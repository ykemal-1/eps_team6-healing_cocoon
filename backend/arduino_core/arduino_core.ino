#include <WiFi.h>
#include <WebServer.h>
#include <Wire.h>
#include <BH1750.h>

// --- WI-FI CREDENTIALS ---
const char* ssid = "Dani";
const char* password = "dani1998";

// --- HARDWARE PINS & ADDRESSES ---
#define I2C_SDA_PIN 23
#define I2C_SCL_PIN 22
#define MQ135_PIN 32
#define ATOMIZER_PIN 18
#define GY21_ADDR 0x40

// --- SENSOR OBJECTS ---
BH1750 lightSensor;
WebServer server(80);

// Baseline calibrated from real sensor readings after 10 min warm-up in clean air
const float MQ135_CLEAN_AIR_BASELINE = 2400.0;
const float BASELINE_CO2_PPM = 400.0;

// --- TIMING CONFIG (PRODUCTION) ---
#define PERIODIC_INTERVAL_MS  (30UL * 60 * 1000)  // 30 minutes between periodic mist cycles
#define MIST_DURATION_MS      (10UL *  1 * 1000)  // 10 seconds of mist per periodic cycle
#define REACTIVE_DURATION_MS  (30UL *  1 * 1000)  // 30 seconds max if CO2 triggers it

// --- GLOBAL VARIABLES ---
float luxLevel    = 0.0;
float temperature = 0.0;
float humidity    = 0.0;
float eCO2_ppm    = 400.0;
float rawGasFloat = 0.0;
bool  atomizerActive = false;

unsigned long lastReadTime      = 0;
unsigned long lastPeriodicMist  = 0;
unsigned long atomizerStartTime = 0;
bool atomizerScheduled = false;
bool atomizerReactive  = false;

// Sensor health flags set during startup checks
bool sensorOK_BH1750 = false;
bool sensorOK_GY21   = false;
bool sensorOK_MQ135  = false;
bool sensorOK_WiFi   = false;

// ==========================================
// STARTUP SENSOR CHECKS
// ==========================================
bool checkBH1750() {
  Serial.println("\n[CHECK] BH1750 Light Sensor...");
  float val = lightSensor.readLightLevel();
  if (val >= 0) {
    Serial.print("  [OK] BH1750 reading: ");
    Serial.print(val);
    Serial.println(" lux");
    return true;
  }
  Serial.println("  [FAIL] BH1750 returned invalid value. Check I2C wiring on SDA/SCL.");
  return false;
}

bool checkGY21() {
  Serial.println("\n[CHECK] GY-21 Temp & Humidity Sensor...");

  Wire.beginTransmission(GY21_ADDR);
  Wire.write(0xF3);
  byte err = Wire.endTransmission();
  if (err != 0) {
    Serial.print("  [FAIL] GY-21 not found at I2C address 0x");
    Serial.print(GY21_ADDR, HEX);
    Serial.println(". Check wiring or address.");
    return false;
  }
  delay(100);
  Wire.requestFrom(GY21_ADDR, 2);
  if (Wire.available() == 2) {
    uint16_t rawTemp = Wire.read() << 8 | Wire.read();
    rawTemp &= 0xFFFC;
    float t = -46.85 + (175.72 * (rawTemp / 65536.0));
    if (t < -10.0 || t > 60.0) {
      Serial.print("  [WARN] GY-21 temperature out of expected range: ");
      Serial.print(t); Serial.println(" C");
    } else {
      Serial.print("  [OK] Temperature: ");
      Serial.print(t); Serial.println(" C");
    }
  } else {
    Serial.println("  [FAIL] GY-21 temperature read failed. No bytes received.");
    return false;
  }

  delay(20);

  Wire.beginTransmission(GY21_ADDR);
  Wire.write(0xF5);
  Wire.endTransmission();
  delay(100);
  Wire.requestFrom(GY21_ADDR, 2);
  if (Wire.available() == 2) {
    uint16_t rawHum = Wire.read() << 8 | Wire.read();
    rawHum &= 0xFFFC;
    float h = -6.0 + (125.0 * (rawHum / 65536.0));
    if (h < 0.0 || h > 100.0) {
      Serial.print("  [WARN] GY-21 humidity out of expected range: ");
      Serial.print(h); Serial.println(" %");
    } else {
      Serial.print("  [OK] Humidity: ");
      Serial.print(h); Serial.println(" %");
    }
  } else {
    Serial.println("  [FAIL] GY-21 humidity read failed. No bytes received.");
    return false;
  }

  return true;
}

bool checkMQ135() {
  Serial.println("\n[CHECK] MQ-135 Gas Sensor...");

  int samples[5];
  for (int i = 0; i < 5; i++) {
    samples[i] = analogRead(MQ135_PIN);
    delay(50);
  }

  int minVal = samples[0], maxVal = samples[0], sum = 0;
  for (int i = 0; i < 5; i++) {
    if (samples[i] < minVal) minVal = samples[i];
    if (samples[i] > maxVal) maxVal = samples[i];
    sum += samples[i];
  }
  float avg = sum / 5.0;

  Serial.print("  Samples: ");
  for (int i = 0; i < 5; i++) {
    Serial.print(samples[i]);
    if (i < 4) Serial.print(", ");
  }
  Serial.println();
  Serial.print("  Average: "); Serial.print(avg);
  Serial.print("  Min: ");     Serial.print(minVal);
  Serial.print("  Max: ");     Serial.println(maxVal);

  if (avg == 0) {
    Serial.println("  [FAIL] MQ-135 reads all zeros. Check wiring on pin " + String(MQ135_PIN) + ".");
    return false;
  }
  if (avg >= 4095) {
    Serial.println("  [FAIL] MQ-135 reads max value (4095). Sensor may be shorted or not connected.");
    return false;
  }
  if (maxVal - minVal == 0) {
    Serial.println("  [WARN] MQ-135 values are perfectly flat — sensor may not be warmed up yet.");
    Serial.println("         MQ-135 needs ~3 minutes warm-up after power-on for stable readings.");
  } else {
    Serial.println("  [OK] MQ-135 returning live data.");
  }

  Serial.print("  Baseline reference: "); Serial.println(MQ135_CLEAN_AIR_BASELINE);
  if (avg < MQ135_CLEAN_AIR_BASELINE) {
    Serial.println("  [INFO] Raw value below baseline — eCO2 will read 400 ppm (clean air floor).");
  } else {
    Serial.print("  [INFO] Raw value above baseline — eCO2 estimate: ");
    Serial.print(BASELINE_CO2_PPM + (avg - MQ135_CLEAN_AIR_BASELINE) * 2.5);
    Serial.println(" ppm");
  }

  return true;
}

bool checkWiFi() {
  Serial.println("\n[CHECK] Wi-Fi...");
  Serial.print("  Connecting to: "); Serial.println(ssid);
  WiFi.begin(ssid, password);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("  [OK] Connected! IP: ");
    Serial.println(WiFi.localIP());
    return true;
  }
  Serial.println("  [FAIL] Could not connect to Wi-Fi. Check SSID/password.");
  return false;
}

void printStartupSummary() {
  Serial.println("\n========================================");
  Serial.println("         STARTUP DIAGNOSTICS SUMMARY    ");
  Serial.println("========================================");
  Serial.print("  BH1750  (Light)      : "); Serial.println(sensorOK_BH1750 ? "OK" : "FAIL");
  Serial.print("  GY-21   (Temp/Hum)   : "); Serial.println(sensorOK_GY21   ? "OK" : "FAIL");
  Serial.print("  MQ-135  (Gas/eCO2)   : "); Serial.println(sensorOK_MQ135  ? "OK" : "FAIL");
  Serial.print("  Wi-Fi                : "); Serial.println(sensorOK_WiFi   ? "OK" : "FAIL");

  bool allOK = sensorOK_BH1750 && sensorOK_GY21 && sensorOK_MQ135 && sensorOK_WiFi;
  Serial.println("========================================");
  if (allOK) {
    Serial.println("  All systems nominal. Starting main loop.");
  } else {
    Serial.println("  WARNING: One or more checks failed.");
    Serial.println("  System will continue but readings may be unreliable.");
  }
  Serial.println("========================================\n");
}

// ==========================================
// ATOMIZER HARDWARE TEST (runs once at boot)
// ==========================================
void testAtomizer() {
  Serial.println("\n[TEST] Atomizer hardware test — activating for 3 seconds...");
  digitalWrite(ATOMIZER_PIN, HIGH);
  delay(3000);
  digitalWrite(ATOMIZER_PIN, LOW);
  Serial.println("[TEST] Done. If atomizer did NOT vibrate, check:");
  Serial.println("       - Wiring on pin " + String(ATOMIZER_PIN));
  Serial.println("       - Transistor/relay circuit");
  Serial.println("       - External power supply for atomizer");
}

// ==========================================
// SERIAL PLOTTER OUTPUT
// ==========================================
void printPlotterData() {
  Serial.print("RawMQ135:");  Serial.print(rawGasFloat);              Serial.print(" ");
  Serial.print("Baseline:");  Serial.print(MQ135_CLEAN_AIR_BASELINE); Serial.print(" ");
  Serial.print("eCO2_ppm:");  Serial.print(eCO2_ppm);                 Serial.print(" ");
  Serial.print("Humidity:");  Serial.print(humidity);                  Serial.print(" ");
  Serial.print("Temp:");      Serial.print(temperature);               Serial.print(" ");
  Serial.print("Lux:");       Serial.print(luxLevel);                  Serial.print(" ");
  Serial.print("Atomizer:");  Serial.println(atomizerActive ? 1000 : 0);
}

// ==========================================
// HELPERS
// ==========================================
void atomizerON(const char* reason) {
  if (!atomizerActive) {
    atomizerActive    = true;
    atomizerStartTime = millis();
    digitalWrite(ATOMIZER_PIN, HIGH);
    Serial.print("[ATOMIZER ON] Reason: ");
    Serial.println(reason);
  }
}

void atomizerOFF() {
  if (atomizerActive) {
    atomizerActive    = false;
    atomizerScheduled = false;
    atomizerReactive  = false;
    digitalWrite(ATOMIZER_PIN, LOW);
    Serial.println("[ATOMIZER OFF]");
  }
}

// ==========================================
// WEB SERVER API
// ==========================================
void sendJSONData() {
  unsigned long now = millis();
  unsigned long nextPeriodic = (lastPeriodicMist == 0)
      ? PERIODIC_INTERVAL_MS
      : (PERIODIC_INTERVAL_MS - min((unsigned long)(now - lastPeriodicMist), PERIODIC_INTERVAL_MS));

  String json = "{";
  json += "\"light\":"              + String(luxLevel)      + ",";
  json += "\"temperature\":"        + String(temperature)   + ",";
  json += "\"humidity\":"           + String(humidity)       + ",";
  json += "\"eco2\":"               + String(eCO2_ppm)       + ",";
  json += "\"raw_mq135\":"          + String(rawGasFloat)    + ",";
  json += "\"atomizer\":\""         + String(atomizerActive ? "ON (MISTING)" : "STANDBY") + "\",";
  json += "\"next_periodic_ms\":"   + String(nextPeriodic);
  json += "}";

  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "application/json", json);
}

// ==========================================
// SETUP
// ==========================================
void setup() {
  Serial.begin(115200);
  delay(500); // Let serial settle before printing

  Serial.println("\n========================================");
  Serial.println("       PLANT MONITOR — BOOTING UP       ");
  Serial.println("========================================");

  // 1. Init actuators
  pinMode(ATOMIZER_PIN, OUTPUT);
  digitalWrite(ATOMIZER_PIN, LOW);
  pinMode(MQ135_PIN, INPUT);

  // 2. Init I2C bus
  Wire.setPins(I2C_SDA_PIN, I2C_SCL_PIN);
  Wire.begin();

  // 3. Init BH1750 before check
  lightSensor.begin();

  // 4. Atomizer hardware test
  testAtomizer();

  // 5. Run all startup sensor checks
  sensorOK_BH1750 = checkBH1750();
  sensorOK_GY21   = checkGY21();
  sensorOK_MQ135  = checkMQ135();
  sensorOK_WiFi   = checkWiFi();

  // 6. Print summary
  printStartupSummary();

  // 7. Start web server API (even if some sensors failed)
  server.on("/api/data", sendJSONData);
  server.begin();
  Serial.print("API ready at: http://");
  Serial.print(WiFi.localIP());
  Serial.println("/api/data");

  // Do NOT fire immediately on boot — wait the full 30 minutes first
  lastPeriodicMist = millis();
  Serial.println("First periodic mist scheduled in 30 minutes.");
}

// ==========================================
// MAIN LOOP
// ==========================================
void loop() {
  server.handleClient();
  unsigned long now = millis();

  // ── 1. Read sensors every 2 seconds ──────────────────────────
  if (now - lastReadTime > 2000) {
    lastReadTime = now;

    // BH1750 light sensor
    luxLevel = lightSensor.readLightLevel();
    delay(20); // I2C traffic clearance delay

    // GY-21 temperature
    Wire.beginTransmission(GY21_ADDR);
    Wire.write(0xF3);
    Wire.endTransmission();
    delay(100); // Wait for temperature calculation
    Wire.requestFrom(GY21_ADDR, 2);
    if (Wire.available() == 2) {
      uint16_t rawTemp = Wire.read() << 8 | Wire.read();
      rawTemp &= 0xFFFC;
      temperature = -46.85 + (175.72 * (rawTemp / 65536.0));
    }
    delay(20); // I2C traffic clearance delay

    // GY-21 humidity
    Wire.beginTransmission(GY21_ADDR);
    Wire.write(0xF5);
    Wire.endTransmission();
    delay(100); // Wait for humidity calculation
    Wire.requestFrom(GY21_ADDR, 2);
    if (Wire.available() == 2) {
      uint16_t rawHum = Wire.read() << 8 | Wire.read();
      rawHum &= 0xFFFC;
      humidity = -6.0 + (125.0 * (rawHum / 65536.0));
    }

    // MQ-135 eCO2 — raw value only, no climate compensation
    // Compensation was over-correcting at high humidity levels
    rawGasFloat = (float)analogRead(MQ135_PIN);

    eCO2_ppm = BASELINE_CO2_PPM;
    if (rawGasFloat > MQ135_CLEAN_AIR_BASELINE) {
      eCO2_ppm += (rawGasFloat - MQ135_CLEAN_AIR_BASELINE) * 2.5;
    }

    // Print all values to Serial Plotter every sensor cycle
    printPlotterData();
  }

  // ── 2. Atomizer state machine ─────────────────────────────────
  if (atomizerActive) {
    unsigned long elapsed = now - atomizerStartTime;

    if (atomizerScheduled && elapsed >= MIST_DURATION_MS) {
      // Periodic cycle complete — turn off
      atomizerOFF();

    } else if (atomizerReactive) {
      // Reactive mode: turn off when CO2 drops below threshold or timeout reached
      if (eCO2_ppm <= 1000.0 || elapsed >= REACTIVE_DURATION_MS) {
        atomizerOFF();
      }
    }

  } else {
    // Check if a periodic cycle is due (every 30 minutes)
    if (now - lastPeriodicMist >= PERIODIC_INTERVAL_MS) {
      lastPeriodicMist  = now;
      atomizerScheduled = true;
      atomizerReactive  = false;
      atomizerON("Scheduled 30-minute cycle");

    // Check reactive condition: high CO2 only
    // Humidity is handled by the periodic cycle, not reactively
    } else if (eCO2_ppm > 1000.0) {
      atomizerScheduled = false;
      atomizerReactive  = true;
      atomizerON("High CO2 detected");
    }
  }
}
