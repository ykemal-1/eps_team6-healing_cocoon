import http from "k6/http";
import { check, sleep } from "k6";

export let options = {
    stages: [
        { duration: "15s", target: 5 },
        { duration: "30s", target: 25 },
        { duration: "60s", target: 100 },
        { duration: "30s", target: 0 },
    ],
    thresholds: {
        http_req_duration: ["p(95)<2000"],
        http_req_failed: ["rate<0.05"],
    },
};

const BASE = __ENV.BASE_URL || "http://host.docker.internal:8000";
const AUTH = __ENV.TEST_AUTH || "Bearer demo_token";

export default function () {
    // Auth check
    const res = http.get(`${BASE}/api/me`, {
        headers: { Authorization: AUTH },
    });
    check(res, { "me 200|401": (r) => r.status === 200 || r.status === 401 });

    // Create session
    const payload = JSON.stringify({
        child_name: "LoadTest",
        age_range: "10-12",
        environment: "Ocean",
        sound_level: "Soft",
        scent_level: "Soft",
        duration_minutes: 10,
        wheelchair_access: false,
        removable_seat: false,
        low_stimulation_mode: false,
        caregiver_assistance: false,
        notes: "load test",
    });

    const params = {
        headers: { "Content-Type": "application/json", Authorization: AUTH },
    };
    const createRes = http.post(`${BASE}/api/sessions`, payload, params);
    check(createRes, {
        "create 200|201": (r) => r.status === 200 || r.status === 201,
    });

    sleep(1);
}
