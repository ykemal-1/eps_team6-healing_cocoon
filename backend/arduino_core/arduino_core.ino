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

// --- SENSOR OBJECTS & CONSTANTS ---
BH1750 lightSensor;
WebServer server(80);

const float MQ135_CLEAN_AIR_BASELINE = 2660.0; 
const float BASELINE_CO2_PPM = 400.0;

// --- GLOBAL VARIABLES ---
float luxLevel = 0.0;
float temperature = 0.0;
float humidity = 0.0;
float eCO2_ppm = 400.0;
bool atomizerActive = false;
unsigned long lastReadTime = 0;

// ==========================================
// WEB SERVER API FUNCTION (JSON ONLY)
// ==========================================
void sendJSONData() {
  String json = "{";
  json += "\"light\":" + String(luxLevel) + ",";
  json += "\"temperature\":" + String(temperature) + ",";
  json += "\"humidity\":" + String(humidity) + ",";
  json += "\"eco2\":" + String(eCO2_ppm) + ",";
  json += "\"atomizer\":\"" + String(atomizerActive ? "ON (MISTING)" : "STANDBY") + "\"";
  json += "}";
  
  // CRITICAL: This allows local HTML files (file:///) to read the data without security blocks
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "application/json", json);
}

// ==========================================
// SYSTEM SETUP
// ==========================================
void setup() {
  Serial.begin(9600);
  
  // 1. Init Actuators & Analog Pins
  pinMode(ATOMIZER_PIN, OUTPUT);
  digitalWrite(ATOMIZER_PIN, LOW);
  pinMode(MQ135_PIN, INPUT);

  // 2. Init I2C Bus & Digital Sensors
  Wire.setPins(I2C_SDA_PIN, I2C_SCL_PIN);
  Wire.begin();
  lightSensor.begin();
  
  // 3. Wi-Fi Connection
  Serial.println("\nConnecting to Wi-Fi...");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("\n[OK] Wi-Fi Connected!");
  Serial.print("API Endpoint ready at: http://");
  Serial.print(WiFi.localIP());
  Serial.println("/api/data");

  // 4. Start Web Server API
  server.on("/api/data", sendJSONData);
  server.begin();
  Serial.println("API Server running.");
}

// ==========================================
// MAIN LOOP & LOGIC
// ==========================================
void loop() {
  server.handleClient(); // Keep listening for web requests

  // Update sensors every 2 seconds
  if (millis() - lastReadTime > 2000) {
    lastReadTime = millis();
    
    // --- 1. Read Light Sensor (BH1750) ---
    luxLevel = lightSensor.readLightLevel();
    delay(20); // I2C traffic clearance delay

    // --- 2. Read Temperature (GY-21) ---
    Wire.beginTransmission(GY21_ADDR);
    Wire.write(0xF3);
    Wire.endTransmission();
    delay(100); // Wait for temp calculation
    
    Wire.requestFrom(GY21_ADDR, 2);
    if (Wire.available() == 2) {
      uint16_t rawTemp = Wire.read() << 8 | Wire.read();
      rawTemp &= 0xFFFC;
      temperature = -46.85 + (175.72 * (rawTemp / 65536.0));
    }
    delay(20); // I2C traffic clearance delay

    // --- 3. Read Humidity (GY-21) ---
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

    // --- 4. Read Gas & Calculate eCO2 (MQ-135) ---
    int rawGasValue = analogRead(MQ135_PIN);
    
    // Climate compensation math for the gas sensor
    float tempCorrection = (temperature - 20.0) * 0.02; 
    float humCorrection = (humidity - 33.0) * 0.01;
    float correctionFactor = 1.0 + tempCorrection + humCorrection;
    
    float adjustedGasValue = rawGasValue / correctionFactor;
    
    eCO2_ppm = BASELINE_CO2_PPM;
    if (adjustedGasValue > MQ135_CLEAN_AIR_BASELINE) {
      eCO2_ppm += (adjustedGasValue - MQ135_CLEAN_AIR_BASELINE) * 2.5; 
    }

    // --- 5. Automation Logic (Atomizer Control) ---
    // Trigger mist if air is too dry OR pollution is too high
    if (humidity < 40.0 || eCO2_ppm > 1000.0) {
      atomizerActive = true;
      digitalWrite(ATOMIZER_PIN, HIGH);
    } else {
      atomizerActive = false;
      digitalWrite(ATOMIZER_PIN, LOW);
    }
  }
}