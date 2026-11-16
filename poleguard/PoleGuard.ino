/*
  ELECTRICAL POLE SAFETY ALERT SYSTEM
  ESP32-C3 Super Mini + MPU6500 + ACS712-5A + Buzzer

  MPU6500: VCC 3.3V, GND, SDA GPIO4, SCL GPIO5
  ACS712-5A: VCC 5V, GND, OUT -> 20k/10k divider -> GPIO3
  Buzzer: GPIO6 (use a transistor/driver for anything beyond a tiny buzzer)

  Wi-Fi: ACCESS POINT MODE
  WiFi name : PoleGuard
  Password  : poleguard123
  Dashboard : http://192.168.4.1
  TX power  : 8.5 dBm (previously working ESP32-C3 setting)

  IMPORTANT:
  This is a prototype/educational system. Never connect the ESP32 or a
  non-isolated ACS712 setup directly to live high-voltage conductors.
*/

#include <Arduino.h>
#include <Wire.h>
#include <WiFi.h>
#include <WebServer.h>
#include <Preferences.h>
#include <time.h>
#include <math.h>

// ============================================================
// ACCESS POINT
// ============================================================
const char* AP_SSID = "PoleGuard";
const char* AP_PASSWORD = "poleguard123";   // at least 8 characters

// ============================================================
// PINS
// ============================================================
#define MPU_SDA 4
#define MPU_SCL 5
#define ACS_PIN 3
#define BUZZER_PIN 6

// ============================================================
// MPU6500
// ============================================================
#define MPU_ADDR          0x68
#define REG_WHO_AM_I      0x75
#define REG_PWR_MGMT_1    0x6B
#define REG_ACCEL_CONFIG  0x1C
#define REG_GYRO_CONFIG   0x1B
#define REG_ACCEL_XOUT_H  0x3B
#define REG_GYRO_XOUT_H   0x43

// ============================================================
// ACS712-5A + DIVIDER
// ============================================================
const float ACS_SENSITIVITY_V_PER_A = 0.185f; // 185 mV/A
const float ACS_DIVIDER_RATIO = 3.0f;         // 20k/10k divider
const int ADC_MAX = 4095;
const int CURRENT_SAMPLES = 1800;

// ============================================================
// NVS / HISTORY
// ============================================================
Preferences prefs;
WebServer server(80);
const char* NVS_NS = "pole";
const uint8_t MAX_HISTORY = 40;

uint32_t eventCount = 0;
uint8_t eventHead = 0;

// ============================================================
// LIVE VALUES
// ============================================================
float ax = 0, ay = 0, az = 1;
float gx = 0, gy = 0, gz = 0;
float rollDeg = 0, pitchDeg = 0;
float tiltDeg = 0;
float prevTiltDeg = 0;
float angleRate = 0;
float accelG = 1.0f;
float currentA = 0;

bool mpuOK = false;
bool imuCalibrated = false;
bool currentCalibrated = false;

float refX = 0;
float refY = 0;
float refZ = 1;
float currentZeroADC = 2048;

// ============================================================
// SETTINGS
// ============================================================
float tiltThreshold = 8.0f;
float fallAngleThreshold = 35.0f;
float fallRateThreshold = 80.0f;
float impactThreshold = 2.50f;
float freeFallThreshold = 0.40f;
float currentHazardThreshold = 0.20f;
bool currentHazardEnabled = false;
bool buzzerEnabled = true;

// ============================================================
// ALERT
// ============================================================
bool alertActive = false;
String alertReason = "NORMAL";
unsigned long lastAlertMs = 0;
int tiltCounter = 0;

// ============================================================
// TIMERS
// ============================================================
unsigned long lastMPUMs = 0;
unsigned long lastCurrentMs = 0;
unsigned long lastSerialMs = 0;
unsigned long lastBuzzerMs = 0;
unsigned long buzzerStartMs = 0;
bool buzzerState = false;
const unsigned long BUZZER_DURATION_MS = 5000UL;

// ============================================================
// MPU HELPERS
// ============================================================
void mpuWrite(uint8_t reg, uint8_t value) {
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(reg);
  Wire.write(value);
  Wire.endTransmission();
}

uint8_t mpuRead(uint8_t reg) {
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(reg);
  if (Wire.endTransmission(false) != 0) return 0;
  Wire.requestFrom(MPU_ADDR, (uint8_t)1);
  return Wire.available() ? Wire.read() : 0;
}

int16_t mpuRead16(uint8_t reg) {
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(reg);
  if (Wire.endTransmission(false) != 0) return 0;
  Wire.requestFrom(MPU_ADDR, (uint8_t)2);
  if (Wire.available() < 2) return 0;
  uint8_t hi = Wire.read();
  uint8_t lo = Wire.read();
  return (int16_t)(((uint16_t)hi << 8) | lo);
}

bool initMPU() {
  uint8_t who = mpuRead(REG_WHO_AM_I);
  Serial.print("[MPU] WHO_AM_I = 0x");
  Serial.println(who, HEX);

  if (who != 0x70 && who != 0x71) return false;

  mpuWrite(REG_PWR_MGMT_1, 0x00);   // wake
  delay(100);
  mpuWrite(REG_ACCEL_CONFIG, 0x00); // +/-2g
  mpuWrite(REG_GYRO_CONFIG, 0x00);  // +/-250 dps
  delay(50);
  return true;
}

bool readMPU() {
  if (!mpuOK) return false;

  int16_t arx = mpuRead16(REG_ACCEL_XOUT_H);
  int16_t ary = mpuRead16(REG_ACCEL_XOUT_H + 2);
  int16_t arz = mpuRead16(REG_ACCEL_XOUT_H + 4);
  int16_t grx = mpuRead16(REG_GYRO_XOUT_H);
  int16_t gry = mpuRead16(REG_GYRO_XOUT_H + 2);
  int16_t grz = mpuRead16(REG_GYRO_XOUT_H + 4);

  ax = arx / 16384.0f;
  ay = ary / 16384.0f;
  az = arz / 16384.0f;

  gx = grx / 131.0f;
  gy = gry / 131.0f;
  gz = grz / 131.0f;

  accelG = sqrtf(ax * ax + ay * ay + az * az);
  rollDeg = atan2f(ay, az) * 180.0f / PI;
  pitchDeg = atan2f(-ax, sqrtf(ay * ay + az * az)) * 180.0f / PI;
  return true;
}

float calculateTilt() {
  float cm = sqrtf(ax * ax + ay * ay + az * az);
  float rm = sqrtf(refX * refX + refY * refY + refZ * refZ);
  if (cm < 0.001f || rm < 0.001f) return 0;
  float dot = (ax * refX + ay * refY + az * refZ) / (cm * rm);
  dot = constrain(dot, -1.0f, 1.0f);
  return acosf(dot) * 180.0f / PI;
}

void calibrateIMU(bool save) {
  if (!mpuOK) {
    Serial.println("[CAL] MPU unavailable.");
    return;
  }

  Serial.println("[CAL] Keep sensor still in normal pole position...");
  delay(1200);

  const int samples = 300;
  float sx = 0, sy = 0, sz = 0;

  for (int i = 0; i < samples; i++) {
    if (readMPU()) {
      sx += ax;
      sy += ay;
      sz += az;
    }
    delay(5);
  }

  sx /= samples;
  sy /= samples;
  sz /= samples;

  float mag = sqrtf(sx * sx + sy * sy + sz * sz);

  if (mag < 0.5f || mag > 1.5f) {
    Serial.println("[CAL] Invalid MPU reference. Retry while still.");
    return;
  }

  refX = sx;
  refY = sy;
  refZ = sz;
  imuCalibrated = true;
  tiltDeg = 0;
  prevTiltDeg = 0;
  angleRate = 0;

  if (save) {
    prefs.begin(NVS_NS, false);
    prefs.putFloat("refX", refX);
    prefs.putFloat("refY", refY);
    prefs.putFloat("refZ", refZ);
    prefs.putBool("imuCal", true);
    prefs.end();
  }

  Serial.println("[CAL] MPU reference saved.");
}

// ============================================================
// ACS712 CURRENT RMS
// ============================================================
float readCurrent() {
  const int samples = 500;
  long total = 0;

  for (int i = 0; i < samples; i++) {
    total += analogRead(ACS_PIN);
    delayMicroseconds(200);
  }

  float adc = (float)total / (float)samples;

  float pinVoltage =
    (adc / (float)ADC_MAX) * 3.3f;

  float sensorVoltage =
    pinVoltage * ACS_DIVIDER_RATIO;

  float zeroPinVoltage =
    (currentZeroADC / (float)ADC_MAX) * 3.3f;

  float zeroSensorVoltage =
    zeroPinVoltage * ACS_DIVIDER_RATIO;

  float voltageDifference =
    sensorVoltage - zeroSensorVoltage;

  // ACS712-5A = 185 mV/A
  float current =
    (voltageDifference * 1000.0f) / 185.0f;

  if (fabsf(current) < 0.03f) {
    current = 0.0f;
  }

  // This prototype reports non-negative current magnitude.
  if (current < 0.0f) {
    current = 0.0f;
  }

  return current;
}

void calibrateCurrent() {
  Serial.println("[ACS712] Keep current at ZERO...");
  delay(1200);

  const int samples = 1500;
  long total = 0;
  for (int i = 0; i < samples; i++) {
    total += analogRead(ACS_PIN);
    delayMicroseconds(100);
  }

  currentZeroADC = (float)total / samples;
  currentCalibrated = true;

  prefs.begin(NVS_NS, false);
  prefs.putFloat("zeroADC", currentZeroADC);
  prefs.putBool("curCal", true);
  prefs.end();

  Serial.print("[ACS712] Zero ADC = ");
  Serial.println(currentZeroADC, 2);
}

// ============================================================
// SETTINGS / HISTORY NVS
// ============================================================
void loadSettings() {
  prefs.begin(NVS_NS, true);

  tiltThreshold = prefs.getFloat("tiltOn", 8.0f);
  fallAngleThreshold = prefs.getFloat("fallAng", 35.0f);
  fallRateThreshold = prefs.getFloat("fallRate", 80.0f);
  impactThreshold = prefs.getFloat("impactG", 2.50f);
  freeFallThreshold = prefs.getFloat("freeG", 0.40f);
  currentHazardThreshold = prefs.getFloat("curTh", 0.20f);
  currentHazardEnabled = prefs.getBool("curAl", false);
  buzzerEnabled = prefs.getBool("buzz", true);

  refX = prefs.getFloat("refX", 0.0f);
  refY = prefs.getFloat("refY", 0.0f);
  refZ = prefs.getFloat("refZ", 1.0f);
  imuCalibrated = prefs.getBool("imuCal", false);

  currentZeroADC = prefs.getFloat("zeroADC", 2048.0f);
  currentCalibrated = prefs.getBool("curCal", false);

  eventCount = prefs.getULong("evtCnt", 0);
  eventHead = prefs.getUChar("evtHead", 0);

  prefs.end();
}

void saveSettings() {
  prefs.begin(NVS_NS, false);

  prefs.putFloat("tiltOn", tiltThreshold);
  prefs.putFloat("fallAng", fallAngleThreshold);
  prefs.putFloat("fallRate", fallRateThreshold);
  prefs.putFloat("impactG", impactThreshold);
  prefs.putFloat("freeG", freeFallThreshold);
  prefs.putFloat("curTh", currentHazardThreshold);
  prefs.putBool("curAl", currentHazardEnabled);
  prefs.putBool("buzz", buzzerEnabled);

  prefs.end();
  Serial.println("[SETTINGS] Saved to ESP32 NVS.");
}

String timestampNow() {
  // Access point mode has no internet, so there is no NTP time.
  // Events are stamped with the time since power-on.
  unsigned long s = millis() / 1000UL;
  char b[32];
  snprintf(b, sizeof(b), "UPTIME %lu:%02lu:%02lu", s / 3600UL, (s % 3600UL) / 60UL, s % 60UL);
  return String(b);
}

String jescape(const String& s) {
  String o;
  o.reserve(s.length() + 8);
  for (size_t i = 0; i < s.length(); i++) {
    char c = s[i];
    if (c == '"') o += "\\\"";
    else if (c == '\\') o += "\\\\";
    else if (c == '\n') o += "\\n";
    else if (c == '\r') o += "\\r";
    else o += c;
  }
  return o;
}

void saveEvent(const String& type) {
  String record;
  record.reserve(160);
  record += timestampNow();
  record += '|';
  record += type;
  record += '|';
  record += String(tiltDeg, 1);
  record += '|';
  record += String(angleRate, 1);
  record += '|';
  record += String(accelG, 2);
  record += '|';
  record += String(currentA, 3);

  prefs.begin(NVS_NS, false);
  String key = "evt" + String(eventHead);
  prefs.putString(key.c_str(), record);
  eventHead = (uint8_t)((eventHead + 1) % MAX_HISTORY);
  eventCount++;
  prefs.putUChar("evtHead", eventHead);
  prefs.putULong("evtCnt", eventCount);
  prefs.end();

  Serial.println();
  Serial.println("[HISTORY] ALERT SAVED");
  Serial.print("Time     : "); Serial.println(timestampNow());
  Serial.print("Type     : "); Serial.println(type);
  Serial.print("Tilt     : "); Serial.print(tiltDeg, 1); Serial.println(" deg");
  Serial.print("Rate     : "); Serial.print(angleRate, 1); Serial.println(" deg/s");
  Serial.print("Accel    : "); Serial.print(accelG, 2); Serial.println(" g");
  Serial.print("Current  : "); Serial.print(currentA, 3); Serial.println(" A");
  Serial.print("Total    : "); Serial.println(eventCount);
}

// ============================================================
// ALERTS / BUZZER
// ============================================================
void triggerAlert(const String& reason) {
  if (alertActive) return;
  if (millis() - lastAlertMs < 5000UL) return;

  alertActive = true;
  alertReason = reason;
  lastAlertMs = millis();
  buzzerStartMs = millis();
  lastBuzzerMs = millis();
  buzzerState = false;
  saveEvent(reason);

  Serial.println();
  Serial.println("!!! SAFETY ALERT !!!");
  Serial.println(reason);
}

void resetAlert() {
  alertActive = false;
  alertReason = "NORMAL";
  buzzerState = false;
  buzzerStartMs = 0;
  digitalWrite(BUZZER_PIN, LOW);
  tiltCounter = 0;
  Serial.println("[ALERT] Acknowledged/reset.");
}

void updateBuzzer() {
  // The alarm remains visible in the dashboard/history until reset,
  // but the physical buzzer sounds for only 5 seconds per event.
  if (!alertActive || !buzzerEnabled) {
    buzzerState = false;
    digitalWrite(BUZZER_PIN, LOW);
    return;
  }

  if (buzzerStartMs == 0 || millis() - buzzerStartMs >= BUZZER_DURATION_MS) {
    buzzerState = false;
    digitalWrite(BUZZER_PIN, LOW);
    return;
  }

  unsigned long interval = buzzerState ? 120UL : 100UL;

  if (millis() - lastBuzzerMs >= interval) {
    lastBuzzerMs = millis();
    buzzerState = !buzzerState;
    digitalWrite(BUZZER_PIN, buzzerState ? HIGH : LOW);
  }
}

// ============================================================
// ACCESS POINT
// ============================================================
void startAccessPoint() {
  Serial.println("[WIFI] Starting access point...");
  WiFi.disconnect(true);
  delay(1000);
  WiFi.mode(WIFI_AP);
  delay(1000);
  WiFi.setTxPower(WIFI_POWER_8_5dBm);
  delay(500);
  WiFi.softAP(AP_SSID, AP_PASSWORD);
  delay(500);
  WiFi.setTxPower(WIFI_POWER_8_5dBm);

  Serial.println("[WIFI] ACCESS POINT STARTED");
  Serial.print("[WIFI] Name    : "); Serial.println(AP_SSID);
  Serial.print("[WIFI] Password: "); Serial.println(AP_PASSWORD);
  Serial.print("[WIFI] IP      : "); Serial.println(WiFi.softAPIP());
}

// ============================================================
// API
// ============================================================
void apiData() {
  String j;
  j.reserve(2200);
  j += "{";
  j += "\"mpuOK\":"; j += (mpuOK ? "true" : "false");
  j += ",\"calibrated\":"; j += (imuCalibrated ? "true" : "false");
  j += ",\"ax\":"; j += String(ax, 3);
  j += ",\"ay\":"; j += String(ay, 3);
  j += ",\"az\":"; j += String(az, 3);
  j += ",\"gx\":"; j += String(gx, 2);
  j += ",\"gy\":"; j += String(gy, 2);
  j += ",\"gz\":"; j += String(gz, 2);
  j += ",\"roll\":"; j += String(rollDeg, 1);
  j += ",\"pitch\":"; j += String(pitchDeg, 1);
  j += ",\"tilt\":"; j += String(tiltDeg, 1);
  j += ",\"angleRate\":"; j += String(angleRate, 1);
  j += ",\"accel\":"; j += String(accelG, 2);
  j += ",\"current\":"; j += String(currentA, 3);
  j += ",\"alert\":"; j += (alertActive ? "true" : "false");
  j += ",\"reason\":\""; j += jescape(alertReason); j += "\"";
  j += ",\"tiltThreshold\":"; j += String(tiltThreshold, 1);
  j += ",\"fallAngle\":"; j += String(fallAngleThreshold, 1);
  j += ",\"fallRate\":"; j += String(fallRateThreshold, 1);
  j += ",\"impact\":"; j += String(impactThreshold, 2);
  j += ",\"freeFall\":"; j += String(freeFallThreshold, 2);
  j += ",\"currentThreshold\":"; j += String(currentHazardThreshold, 3);
  j += ",\"currentHazardEnabled\":"; j += (currentHazardEnabled ? "true" : "false");
  j += ",\"buzzerEnabled\":"; j += (buzzerEnabled ? "true" : "false");
  j += ",\"buzzerDuration\":"; j += String(BUZZER_DURATION_MS / 1000UL);
  j += ",\"eventCount\":"; j += String(eventCount);
  j += ",\"wifi\":true";
  j += ",\"ip\":\""; j += WiFi.softAPIP().toString(); j += "\"";
  j += ",\"rssi\":null";
  j += "}";
  server.send(200, "application/json; charset=utf-8", j);
}

void apiSettings() {
  String j;
  j.reserve(1000);
  j += "{";
  j += "\"tilt\":"; j += String(tiltThreshold, 1);
  j += ",\"fallAngle\":"; j += String(fallAngleThreshold, 1);
  j += ",\"fallRate\":"; j += String(fallRateThreshold, 1);
  j += ",\"impact\":"; j += String(impactThreshold, 2);
  j += ",\"freeFall\":"; j += String(freeFallThreshold, 2);
  j += ",\"currentThreshold\":"; j += String(currentHazardThreshold, 3);
  j += ",\"currentHazardEnabled\":"; j += (currentHazardEnabled ? "true" : "false");
  j += ",\"buzzerEnabled\":"; j += (buzzerEnabled ? "true" : "false");
  j += ",\"buzzerDuration\":"; j += String(BUZZER_DURATION_MS / 1000UL);
  j += ",\"imuCalibrated\":"; j += (imuCalibrated ? "true" : "false");
  j += ",\"currentCalibrated\":"; j += (currentCalibrated ? "true" : "false");
  j += ",\"eventCount\":"; j += String(eventCount);
  j += "}";
  server.send(200, "application/json; charset=utf-8", j);
}

void apiSaveSettings() {
  if (server.hasArg("tilt")) tiltThreshold = constrain(server.arg("tilt").toFloat(), 1.0f, 90.0f);
  if (server.hasArg("fallAngle")) fallAngleThreshold = constrain(server.arg("fallAngle").toFloat(), 5.0f, 180.0f);
  if (server.hasArg("fallRate")) fallRateThreshold = constrain(server.arg("fallRate").toFloat(), 10.0f, 1000.0f);
  if (server.hasArg("impact")) impactThreshold = constrain(server.arg("impact").toFloat(), 1.2f, 8.0f);
  if (server.hasArg("freeFall")) freeFallThreshold = constrain(server.arg("freeFall").toFloat(), 0.05f, 0.8f);
  if (server.hasArg("currentThreshold")) currentHazardThreshold = constrain(server.arg("currentThreshold").toFloat(), 0.03f, 5.0f);
  if (server.hasArg("currentHazardEnabled")) currentHazardEnabled = server.arg("currentHazardEnabled") == "1";
  if (server.hasArg("buzzerEnabled")) buzzerEnabled = server.arg("buzzerEnabled") == "1";
  if (fallAngleThreshold <= tiltThreshold) fallAngleThreshold = tiltThreshold + 10.0f;
  saveSettings();
  server.send(200, "application/json", "{\"ok\":true}");
}

void apiCalibrate() {
  if (!server.hasArg("type")) {
    server.send(400, "application/json", "{\"ok\":false}");
    return;
  }
  String type = server.arg("type");
  if (type == "imu") {
    calibrateIMU(true);
    server.send(200, "application/json", "{\"ok\":true}");
    return;
  }
  if (type == "current") {
    calibrateCurrent();
    server.send(200, "application/json", "{\"ok\":true}");
    return;
  }
  server.send(400, "application/json", "{\"ok\":false}");
}

void apiResetAlert() {
  resetAlert();
  server.send(200, "application/json", "{\"ok\":true}");
}

void apiHistory() {
  String j;
  j.reserve(14000);
  j += "[";

  prefs.begin(NVS_NS, true);
  uint32_t total = prefs.getULong("evtCnt", 0);
  uint8_t head = prefs.getUChar("evtHead", 0);
  uint8_t available = (uint8_t)min((uint32_t)MAX_HISTORY, total);
  bool first = true;

  for (int off = 1; off <= available; off++) {
    int idx = ((int)head - off + MAX_HISTORY) % MAX_HISTORY;
    String key = "evt" + String(idx);
    String rec = prefs.getString(key.c_str(), "");
    if (!rec.length()) continue;

    int p1 = rec.indexOf('|');
    int p2 = rec.indexOf('|', p1 + 1);
    int p3 = rec.indexOf('|', p2 + 1);
    int p4 = rec.indexOf('|', p3 + 1);
    int p5 = rec.indexOf('|', p4 + 1);
    if (p1 < 0 || p2 < 0 || p3 < 0 || p4 < 0 || p5 < 0) continue;

    String stamp = rec.substring(0, p1);
    String type = rec.substring(p1 + 1, p2);
    String angle = rec.substring(p2 + 1, p3);
    String rate = rec.substring(p3 + 1, p4);
    String accel = rec.substring(p4 + 1, p5);
    String cur = rec.substring(p5 + 1);

    if (!first) j += ',';
    first = false;
    j += "{\"time\":\"" + jescape(stamp) + "\",\"type\":\"" + jescape(type) + "\",\"angle\":" + angle + ",\"rate\":" + rate + ",\"accel\":" + accel + ",\"current\":" + cur + "}";
  }

  prefs.end();
  j += "]";
  server.send(200, "application/json; charset=utf-8", j);
}

// ============================================================
// WEB UI
// ============================================================
String nav(const String& active) {
  String n;
  n += "<aside id='side' class='side'>";
  n += "<div class='brand'><div class='logo'>P</div><div><b>PoleGuard</b><small>SAFETY MONITOR</small></div></div>";
  const char* labels[] = {"Overview","Live Monitor","Alert History","Calibration","Settings"};
  const char* urls[] = {"/overview","/live","/history","/calibration","/settings"};
  const char* ids[] = {"overview","live","history","calibration","settings"};
  for (int i=0;i<5;i++) {
    n += "<a class='nav";
    if (active == ids[i]) n += " active";
    n += "' href='"; n += urls[i]; n += "'><span>0"; n += String(i+1); n += "</span>"; n += labels[i]; n += "</a>";
  }
  n += "</aside><div id='shade' class='shade' onclick='closeNav()'></div>";
  return n;
}

String head(const String& title) {
  String h;
  h += "<!doctype html><html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>" + title + "</title>";
  h += "<link rel=\"icon\" href=\"data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 64 64%27%3E%3Crect width=%2764%27 height=%2764%27 rx=%2716%27 fill=%27%23101827%27/%3E%3Cpath d=%27M32 9C24 20 17 29 17 39a15 15 0 0030 0C47 29 40 20 32 9z%27 fill=%27%232b72df%27/%3E%3Ccircle cx=%2732%27 cy=%2739%27 r=%277%27 fill=%27white%27/%3E%3C/svg%3E\">";
  h += R"rawliteral(<style>
:root{--bg:#f4f7fb;--panel:#ffffff;--text:#172033;--muted:#6b778b;--line:#e4eaf1;--blue:#2b72df;--green:#12a878;--red:#e44747;--yellow:#e9a21b;--dark:#101827;--shadow:0 12px 34px rgba(18,32,55,.08);--r:20px}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.side{position:fixed;left:0;top:0;bottom:0;width:252px;background:var(--dark);padding:22px 15px;z-index:30;color:#fff;box-shadow:10px 0 32px rgba(0,0,0,.08)}.brand{display:flex;gap:12px;align-items:center;padding:8px 8px 25px}.logo{width:44px;height:44px;display:flex;align-items:center;justify-content:center;border-radius:13px;background:linear-gradient(135deg,#246fe5,#10a778);font-weight:900}.brand b{display:block;font-size:18px}.brand small{display:block;font-size:10px;color:#9eacbf;letter-spacing:1px;margin-top:2px}.nav{display:flex;align-items:center;gap:12px;text-decoration:none;color:#aebaca;padding:14px 13px;border-radius:13px;margin:5px 0;font-size:14px;font-weight:800}.nav span{width:25px;color:#748399;font-size:10px}.nav:hover{background:#192337;color:#fff}.nav.active{background:linear-gradient(90deg,#236ed8,#215ea6);color:#fff}.main{margin-left:250px;padding:30px;max-width:1550px}.top{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;margin-bottom:22px}h1{margin:0 0 6px;font-size:32px;letter-spacing:-1px}.sub{color:var(--muted);font-size:14px}.grid{display:grid;grid-template-columns:repeat(12,1fr);gap:18px}.span12{grid-column:span 12}.span8{grid-column:span 8}.span7{grid-column:span 7}.span6{grid-column:span 6}.span5{grid-column:span 5}.span4{grid-column:span 4}.card{background:var(--panel);border:1px solid var(--line);border-radius:var(--r);box-shadow:var(--shadow);padding:20px}.title{font-size:11px;font-weight:900;color:#77859a;letter-spacing:.9px;text-transform:uppercase;margin-bottom:13px}.big{font-size:44px;font-weight:950;letter-spacing:-2px}.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.kpi{background:#fafbfd;border:1px solid var(--line);border-radius:15px;padding:15px}.kpi b{display:block;font-size:22px}.kpi span{display:block;font-size:10px;color:var(--muted);font-weight:800;margin-top:5px}.info{background:#f8fafc;border:1px solid var(--line);border-radius:15px;padding:12px}.row{display:flex;justify-content:space-between;gap:12px;padding:9px 0;border-bottom:1px solid var(--line);font-size:13px}.row:last-child{border-bottom:0}.muted{color:var(--muted)}.badge{display:inline-flex;align-items:center;gap:7px;border-radius:999px;padding:7px 11px;font-size:11px;font-weight:900}.badge.ok{background:#e8faf3;color:#087a58}.badge.bad{background:#ffecec;color:#c62e2e}.badge.warn{background:#fff4de;color:#a86d00}.badge.blue{background:#e9f2ff;color:#215fbd}.dot{width:8px;height:8px;border-radius:50%;background:currentColor}.status{padding:20px 22px;border-radius:18px;font-size:18px;font-weight:900;margin-bottom:18px}.status.normal{background:#e9faf4;color:#087b5a}.status.alert{background:#ffeded;color:#c62e2e}.gaugeWrap{display:flex;justify-content:center}.gauge{width:215px;height:215px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:conic-gradient(var(--blue) 0deg,#e8edf4 0deg);position:relative}.gauge:before{content:"";position:absolute;inset:17px;background:#fff;border-radius:50%;box-shadow:inset 0 0 0 1px #edf1f6}.ginner{position:relative;z-index:2;text-align:center}.gval{font-size:46px;font-weight:950}.glabel{font-size:11px;color:#728096;font-weight:900;text-transform:uppercase;letter-spacing:1px}.chart{height:300px}.controls{display:flex;gap:10px;flex-wrap:wrap}button{border:0;border-radius:12px;padding:11px 15px;font:inherit;font-weight:900;cursor:pointer}.primary{background:var(--blue);color:#fff}.danger{background:var(--red);color:#fff}.soft{background:#edf2f8;color:#405066}input{width:100%;padding:12px;border:1px solid #dce3ec;border-radius:11px;background:#fff;font:inherit}input[type=checkbox]{width:22px;height:22px}label{display:block;color:#68758a;font-size:11px;font-weight:900;margin-bottom:7px}.form{display:grid;grid-template-columns:repeat(2,1fr);gap:15px}.alertBox{padding:16px;border-radius:15px;border:1px solid var(--line);line-height:1.55;font-size:13px}.alertBox.ok{background:#edfbf6;border-color:#b6ead8}.alertBox.bad{background:#fff0f0;border-color:#efb7b7}.alertBox.warn{background:#fff8e8;border-color:#f0d79b}.tableWrap{overflow:auto;border:1px solid var(--line);border-radius:15px}table{width:100%;border-collapse:collapse;min-width:720px}th,td{padding:12px;border-bottom:1px solid var(--line);font-size:12px;text-align:left}th{background:#f7f9fc;color:#6f7c90;font-size:10px;letter-spacing:.7px}.footer{text-align:center;color:#8a96a7;font-size:10px;margin:25px 0}.menu{display:none}.shade{display:none}.flash{display:none;position:fixed;right:20px;bottom:20px;background:#172237;color:#fff;padding:13px 16px;border-radius:13px;z-index:100;box-shadow:0 15px 35px rgba(0,0,0,.2);font-size:12px}
@media(max-width:1000px){.span8,.span7,.span6,.span5,.span4{grid-column:span 12}.kpis{grid-template-columns:repeat(2,1fr)}}
@media(max-width:760px){.side{transform:translateX(-100%);transition:.25s;width:275px}.side.open{transform:translateX(0)}.shade.show{display:block;position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:25}.main{margin-left:0;padding:18px 13px}.menu{display:block;position:fixed;left:13px;top:13px;z-index:35;width:44px;height:44px;background:#101827;color:#fff}.top{padding-left:56px}.top>.badge{display:none}h1{font-size:26px}.form{grid-template-columns:1fr}.kpis{grid-template-columns:repeat(2,1fr)}.gauge{width:205px;height:205px}}
</style>)rawliteral";
  h += "</head><body>";
  return h;
}

String scripts() {
  return R"rawliteral(
<script>
let points=[];
function openNav(){document.getElementById('side')?.classList.add('open');document.getElementById('shade')?.classList.add('show')}
function closeNav(){document.getElementById('side')?.classList.remove('open');document.getElementById('shade')?.classList.remove('show')}
function flash(msg){let f=document.getElementById('flash');if(!f)return;f.textContent=msg;f.style.display='block';clearTimeout(window.__f);window.__f=setTimeout(()=>f.style.display='none',2300)}
async function api(u,o={}){let r=await fetch(u,{cache:'no-store',...o}),t=await r.text(),d={};try{d=JSON.parse(t)}catch(e){}if(!r.ok)throw new Error(d.error||t||'Request failed');return d}
function txt(id,v){let e=document.getElementById(id);if(e)e.textContent=v}
function esc(s){return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;')}
function gauge(id,v){let g=document.getElementById(id);if(!g)return;let n=Number(v);if(!Number.isFinite(n))n=0;n=Math.max(0,Math.min(100,n));g.style.background=`conic-gradient(#246fe5 ${n*3.6}deg,#e8edf4 ${n*3.6}deg 360deg)`}
function update(d){
 txt('tilt',Number(d.tilt).toFixed(1));txt('liveTilt',Number(d.tilt).toFixed(1));txt('rate',Number(d.angleRate).toFixed(1));txt('accel',Number(d.accel).toFixed(2));txt('current',Number(d.current).toFixed(3));txt('roll',Number(d.roll).toFixed(1));txt('pitch',Number(d.pitch).toFixed(1));txt('events',d.eventCount);txt('ip',d.ip);txt('rssi',d.rssi===null?'--':d.rssi+' dBm');txt('mpu',d.mpuOK?'OK':'FAULT');txt('cal',d.calibrated?'READY':'NOT CALIBRATED');txt('threshold',Number(d.tiltThreshold).toFixed(1)+'°');txt('curTh',Number(d.currentThreshold).toFixed(3)+' A');
 let sb=document.getElementById('systemStatus');if(sb){sb.className='status '+(d.alert?'alert':'normal');sb.innerHTML=d.alert?'⚠ SAFETY ALERT — '+esc(d.reason):'✓ SYSTEM NORMAL — Pole position within configured limits'}
 let la=document.getElementById('liveAlert');if(la){la.className='alertBox '+(d.alert?'bad':'ok');la.innerHTML=d.alert?'<b>ALERT ACTIVE</b><br>'+esc(d.reason)+'<br><br><button class="danger" onclick="resetAlert()">ACKNOWLEDGE / RESET</button>':'<b>Monitoring normally</b><br>No active structural alert.'}
 gauge('tiltGauge',Math.min(100,Number(d.tilt)*2.5));gauge('liveGauge',Math.min(100,Number(d.tilt)*2.5));
 points.push({t:Number(d.tilt),a:Number(d.accel)});if(points.length>90)points.shift();drawChart();
}
function drawChart(){let c=document.getElementById('liveChart');if(!c)return;let r=c.getBoundingClientRect();if(r.width<10||r.height<10)return;let q=devicePixelRatio||1,W=r.width,H=r.height;c.width=Math.round(W*q);c.height=Math.round(H*q);let x=c.getContext('2d');x.setTransform(q,0,0,q,0,0);x.clearRect(0,0,W,H);x.strokeStyle='#edf1f6';x.lineWidth=1;for(let i=0;i<=4;i++){let y=22+(H-55)*i/4;x.beginPath();x.moveTo(45,y);x.lineTo(W-12,y);x.stroke()}if(points.length<2){x.fillStyle='#78869a';x.font='12px system-ui';x.fillText('Waiting for live readings...',20,H/2);return}x.beginPath();points.forEach((p,i)=>{let X=45+(W-57)*i/(points.length-1),Y=22+(H-55)*(1-Math.min(40,p.t)/40);if(i===0)x.moveTo(X,Y);else x.lineTo(X,Y)});x.strokeStyle='#246fe5';x.lineWidth=3;x.stroke();x.beginPath();points.forEach((p,i)=>{let X=45+(W-57)*i/(points.length-1),Y=22+(H-55)*(1-Math.min(4,p.a)/4);if(i===0)x.moveTo(X,Y);else x.lineTo(X,Y)});x.strokeStyle='#10a778';x.lineWidth=2.2;x.stroke();x.fillStyle='#78869a';x.font='10px system-ui';x.fillText('40° / 4g',4,27);x.fillText('20° / 2g',4,H/2);x.fillText('0',10,H-29);x.fillStyle='#246fe5';x.fillRect(55,H-18,18,3);x.fillStyle='#47566d';x.fillText('Tilt',80,H-15);x.fillStyle='#10a778';x.fillRect(120,H-18,18,3);x.fillStyle='#47566d';x.fillText('Acceleration',145,H-15)}
async function getData(){try{update(await api('/api/data'))}catch(e){console.log(e)}}
async function resetAlert(){try{await api('/api/reset-alert');flash('Alert reset');getData()}catch(e){flash('Reset failed')}}
async function loadSettings(){try{let d=await api('/api/settings');let ids=[['setTilt',d.tilt],['setFallAngle',d.fallAngle],['setFallRate',d.fallRate],['setImpact',d.impact],['setFreeFall',d.freeFall],['setCurrent',d.currentThreshold]];ids.forEach(a=>{let e=document.getElementById(a[0]);if(e)e.value=a[1]});let ca=document.getElementById('setCurrentAlert');if(ca)ca.checked=d.currentHazardEnabled;let bz=document.getElementById('setBuzzer');if(bz)bz.checked=d.buzzerEnabled;txt('calibrationState',d.imuCalibrated?'READY':'NOT CALIBRATED');txt('currentCalibrationState',d.currentCalibrated?'READY':'NOT CALIBRATED')}catch(e){console.log(e)}}
async function saveSettings(){let p=new URLSearchParams();[['tilt','setTilt'],['fallAngle','setFallAngle'],['fallRate','setFallRate'],['impact','setImpact'],['freeFall','setFreeFall'],['currentThreshold','setCurrent']].forEach(a=>p.set(a[0],document.getElementById(a[1]).value));p.set('currentHazardEnabled',document.getElementById('setCurrentAlert').checked?'1':'0');p.set('buzzerEnabled',document.getElementById('setBuzzer').checked?'1':'0');try{await api('/api/settings',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:p.toString()});flash('Settings saved');loadSettings();getData()}catch(e){flash('Save failed')}}
async function calibrate(t){let s=t==='imu'?'Keep the sensor still in the normal pole position.':'Make sure no current is flowing through the ACS712.';if(!confirm(s+'\n\nContinue?'))return;try{await api('/api/calibrate?type='+t);flash('Calibration saved');loadSettings();getData()}catch(e){flash('Calibration failed')}}
async function loadHistory(){let tb=document.getElementById('historyTable');if(!tb)return;try{let rows=await api('/api/history');tb.innerHTML='';if(!rows.length){tb.innerHTML='<tr><td colspan="6">No alert events recorded yet.</td></tr>';return}rows.forEach(r=>{let tr=document.createElement('tr');tr.innerHTML='<td>'+esc(r.time)+'</td><td>'+esc(r.type)+'</td><td>'+Number(r.angle).toFixed(1)+'°</td><td>'+Number(r.rate).toFixed(1)+'°/s</td><td>'+Number(r.accel).toFixed(2)+' g</td><td>'+Number(r.current).toFixed(3)+' A</td>';tb.appendChild(tr)})}catch(e){console.log(e)}}
window.addEventListener('load',()=>{getData();loadSettings();setInterval(getData,1000);loadHistory();setInterval(loadHistory,10000);window.addEventListener('resize',drawChart)})
</script>)rawliteral";
}

String startPage(const String& title,const String& active,const String& h,const String& sub){
  String p=head(title);p+=nav(active);p+="<button class='menu' onclick='openNav()'>&#9776;</button><main class='main'><div class='top'><div><h1>"+h+"</h1><div class='sub'>"+sub+"</div></div><div class='badge blue'>ESP32-C3</div></div>";return p;
}
String endPage(){String p="<div class='footer'>PoleGuard · ESP32-C3 Electrical Pole Safety Prototype</div><div id='flash' class='flash'></div>";p+=scripts();p+="</main></body></html>";return p;}

// ============================================================
// PAGES
// ============================================================
void sendOverview(){
  String p=startPage("PoleGuard Overview","overview","Safety Overview","Live structural and electrical monitoring.");
  p+="<div id='systemStatus' class='status normal'>✓ SYSTEM NORMAL</div><div class='grid'>";
  p+="<section class='card span4'><div class='title'>Pole Deviation</div><div class='gaugeWrap'><div id='tiltGauge' class='gauge'><div class='ginner'><div id='tilt' class='gval'>--</div><div class='glabel'>degrees</div></div></div></div><div class='row'><span>Alert limit</span><b id='threshold'>--</b></div></section>";
  p+="<section class='card span4'><div class='title'>Electrical Current</div><div class='big'><span id='current'>--</span> <span style='font-size:16px;color:#77859a'>A RMS</span></div><div class='muted'>ACS712-5A monitored current.</div><div class='info' style='margin-top:15px'><div class='row'><span>Hazard threshold</span><b id='curTh'>--</b></div></div></section>";
  p+="<section class='card span4'><div class='title'>Alert</div><div id='liveAlert' class='alertBox ok'>Monitoring normally.</div></section>";
  p+="<section class='card span8'><div class='title'>Sensor Summary</div><div class='kpis'><div class='kpi'><b id='rate'>--</b><span>ANGLE RATE °/s</span></div><div class='kpi'><b id='accel'>--</b><span>ACCELERATION g</span></div><div class='kpi'><b id='roll'>--</b><span>ROLL °</span></div><div class='kpi'><b id='pitch'>--</b><span>PITCH °</span></div></div></section>";
  p+="<section class='card span4'><div class='title'>System</div><div class='info'><div class='row'><span>MPU6500</span><b id='mpu'>--</b></div><div class='row'><span>Calibration</span><b id='cal'>--</b></div><div class='row'><span>Alert events</span><b id='events'>--</b></div><div class='row'><span>Wi-Fi (Access Point)</span><b id='ip'>--</b></div><div class='row'><span>RSSI</span><b id='rssi'>--</b></div></div></section></div>";
  p+=endPage();server.send(200,"text/html; charset=utf-8",p);
}

void sendLive(){
  String p=startPage("PoleGuard Live","live","Live Monitor","Real-time angle, motion and current data.");
  p+="<div class='grid'>";
  p+="<section class='card span4'><div class='title'>Current Tilt</div><div class='gaugeWrap'><div id='liveGauge' class='gauge'><div class='ginner'><div id='liveTilt' class='gval'>--</div><div class='glabel'>degrees</div></div></div></div><div class='info'><div class='row'><span>Angle rate</span><b id='rate'>--</b></div><div class='row'><span>Acceleration</span><b id='accel'>--</b></div></div></section>";
  p+="<section class='card span8'><div class='title'>Live Safety Trend</div><div class='chart'><canvas id='liveChart' style='width:100%;height:100%'></canvas></div></section>";
  p+="<section class='card span6'><div class='title'>Orientation & Current</div><div class='kpis'><div class='kpi'><b id='roll'>--</b><span>ROLL</span></div><div class='kpi'><b id='pitch'>--</b><span>PITCH</span></div><div class='kpi'><b id='current'>--</b><span>CURRENT A</span></div><div class='kpi'><b id='events'>--</b><span>ALERT EVENTS</span></div></div></section>";
  p+="<section class='card span6'><div class='title'>Safety Alert</div><div id='liveAlert' class='alertBox ok'>Monitoring normally.</div></section></div>";
  p+=endPage();server.send(200,"text/html; charset=utf-8",p);
}

void sendHistory(){
  String p=startPage("PoleGuard History","history","Alert History","Recent safety events stored in ESP32 NVS.");
  p+="<div class='alertBox ok' style='margin-bottom:18px'><b>Persistent local history</b><br>Up to 40 recent safety events are retained in ESP32 non-volatile Preferences memory and survive reboot/power loss.</div>";
  p+="<div class='card'><div class='title'>Recorded Events</div><div class='tableWrap'><table><thead><tr><th>DATE / TIME</th><th>EVENT</th><th>TILT</th><th>ANGLE RATE</th><th>ACCEL</th><th>CURRENT</th></tr></thead><tbody id='historyTable'></tbody></table></div></div>";
  p+=endPage();server.send(200,"text/html; charset=utf-8",p);
}

void sendCalibration(){
  String p=startPage("PoleGuard Calibration","calibration","Calibration","Set the normal pole reference and current zero.");
  p+="<div class='grid'>";
  p+="<section class='card span6'><div class='title'>MPU6500 Reference</div><div class='alertBox warn'><b>Procedure</b><br>Mount the sensor in the normal safe pole position and keep it completely still.</div><div style='margin-top:15px'><button class='primary' onclick=\"calibrate('imu')\">CALIBRATE POLE REFERENCE</button></div><div class='info' style='margin-top:15px'><div class='row'><span>Status</span><b id='calibrationState'>--</b></div><div class='row'><span>Live X</span><b id='ax'>--</b></div><div class='row'><span>Live Y</span><b id='ay'>--</b></div><div class='row'><span>Live Z</span><b id='az'>--</b></div></div></section>";
  p+="<section class='card span6'><div class='title'>ACS712-5A Zero</div><div class='alertBox warn'><b>Procedure</b><br>Make sure no current is flowing through the sensor, then calibrate.</div><div style='margin-top:15px'><button class='primary' onclick=\"calibrate('current')\">CALIBRATE CURRENT ZERO</button></div><div class='info' style='margin-top:15px'><div class='row'><span>Status</span><b id='currentCalibrationState'>--</b></div><div class='row'><span>Current</span><b id='current'>--</b></div></div></section>";
  p+="</div><script>setInterval(async()=>{try{let d=await api('/api/data');txt('ax',Number(d.ax).toFixed(3));txt('ay',Number(d.ay).toFixed(3));txt('az',Number(d.az).toFixed(3));}catch(e){}},1000)</script>";
  p+=endPage();server.send(200,"text/html; charset=utf-8",p);
}

void sendSettings(){
  String p=startPage("PoleGuard Settings","settings","Safety Settings","Adjust detection and buzzer behaviour.");
  p+="<section class='card'><div class='title'>Motion Detection</div><div class='form'>";
  p+="<div><label>SLIGHT TILT ALERT (°)</label><input id='setTilt' type='number' min='1' max='90' step='0.5'></div>";
  p+="<div><label>FALL ANGLE (°)</label><input id='setFallAngle' type='number' min='5' max='180' step='1'></div>";
  p+="<div><label>FALL RATE (°/s)</label><input id='setFallRate' type='number' min='10' max='1000' step='1'></div>";
  p+="<div><label>IMPACT THRESHOLD (g)</label><input id='setImpact' type='number' min='1.2' max='8' step='0.05'></div>";
  p+="<div><label>FREE-FALL THRESHOLD (g)</label><input id='setFreeFall' type='number' min='0.05' max='0.8' step='0.01'></div>";
  p+="<div><label>CURRENT HAZARD THRESHOLD (A RMS)</label><input id='setCurrent' type='number' min='0.03' max='5' step='0.01'></div></div>";
  p+="<div style='display:flex;align-items:center;justify-content:space-between;margin-top:18px;padding:13px;background:#f8fafc;border:1px solid var(--line);border-radius:14px'><div><b>Current hazard alert</b><div class='muted'>Optional. Leave OFF for a bulb demo if current should be monitored only.</div></div><input id='setCurrentAlert' type='checkbox'></div>";
  p+="<div style='display:flex;align-items:center;justify-content:space-between;margin-top:10px;padding:13px;background:#f8fafc;border:1px solid var(--line);border-radius:14px'><div><b>Buzzer enabled</b><div class='muted'>Rapid buzzer pattern for 5 seconds when an alert is triggered.</div></div><input id='setBuzzer' type='checkbox'></div>";
  p+="<div style='margin-top:18px'><button class='primary' onclick='saveSettings()'>SAVE SETTINGS</button></div></section>";
  p+=endPage();server.send(200,"text/html; charset=utf-8",p);
}

// ============================================================
// SETUP / LOOP
// ============================================================
void setup(){
  Serial.begin(115200);
  delay(1500);
  Serial.println();
  Serial.println("=============================================");
  Serial.println(" ELECTRICAL POLE SAFETY ALERT SYSTEM");
  Serial.println(" ESP32-C3 + MPU6500 + ACS712-5A");
  Serial.println("=============================================");

  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);

  analogReadResolution(12);
  analogSetPinAttenuation(ACS_PIN, ADC_11db);

  prefs.begin(NVS_NS, true);
  prefs.end();
  loadSettings();

  Wire.begin(MPU_SDA, MPU_SCL);
  Wire.setClock(400000);

  mpuOK = initMPU();
  if (mpuOK) Serial.println("[MPU] Ready.");
  else Serial.println("[MPU] ERROR: Check wiring/address.");

  if (mpuOK && !imuCalibrated) calibrateIMU(true);

  if (!currentCalibrated) {
    calibrateCurrent();
  }

  startAccessPoint();

  server.on("/", HTTP_GET, sendOverview);
  server.on("/overview", HTTP_GET, sendOverview);
  server.on("/live", HTTP_GET, sendLive);
  server.on("/history", HTTP_GET, sendHistory);
  server.on("/calibration", HTTP_GET, sendCalibration);
  server.on("/settings", HTTP_GET, sendSettings);

  server.on("/api/data", HTTP_GET, apiData);
  server.on("/api/history", HTTP_GET, apiHistory);
  server.on("/api/settings", HTTP_GET, apiSettings);
  server.on("/api/settings", HTTP_POST, apiSaveSettings);
  server.on("/api/calibrate", HTTP_GET, apiCalibrate);
  server.on("/api/reset-alert", HTTP_GET, apiResetAlert);

  server.onNotFound([](){ server.send(404, "text/plain", "Not found"); });
  server.begin();

  Serial.println();
  Serial.println("----------- SYSTEM STATUS -----------");
  Serial.print("MPU6500       : "); Serial.println(mpuOK ? "OK" : "FAULT");
  Serial.print("IMU Reference : "); Serial.println(imuCalibrated ? "CALIBRATED" : "NOT CALIBRATED");
  Serial.print("ACS712        : "); Serial.println(currentCalibrated ? "CALIBRATED" : "NOT CALIBRATED");
  Serial.print("Tilt alert    : "); Serial.print(tiltThreshold,1); Serial.println(" deg");
  Serial.print("Fall angle    : "); Serial.print(fallAngleThreshold,1); Serial.println(" deg");
  Serial.print("Fall rate     : "); Serial.print(fallRateThreshold,1); Serial.println(" deg/s");
  Serial.print("Impact        : "); Serial.print(impactThreshold,2); Serial.println(" g");
  Serial.print("Current alert : "); Serial.println(currentHazardEnabled ? "ON" : "OFF");
  Serial.print("Buzzer        : "); Serial.print(buzzerEnabled ? "ON" : "OFF"); Serial.println(" (5 sec/event)");
  Serial.print("Events stored : "); Serial.println(eventCount);
  Serial.print("Wi-Fi AP      : "); Serial.print(AP_SSID); Serial.print(" / "); Serial.println(AP_PASSWORD);
  Serial.print("Dashboard     : http://"); Serial.println(WiFi.softAPIP());
  Serial.println("-------------------------------------");
}

void loop(){
  server.handleClient();

  if (millis() - lastMPUMs >= 100) {
    unsigned long now = millis();
    float dt = lastMPUMs == 0 ? 0.1f : (now-lastMPUMs)/1000.0f;
    lastMPUMs = now;

    if (readMPU()) {
      tiltDeg = calculateTilt();
      angleRate = fabsf(tiltDeg - prevTiltDeg) / max(dt, 0.001f);
      prevTiltDeg = tiltDeg;

      if (accelG >= impactThreshold) triggerAlert("SUDDEN IMPACT / POSSIBLE POLE FALL");
      else if (accelG <= freeFallThreshold) triggerAlert("FREE-FALL / POSSIBLE POLE FALL");
      else if (angleRate >= fallRateThreshold) triggerAlert("SUDDEN ANGLE CHANGE / POSSIBLE FALL");
      else if (tiltDeg >= fallAngleThreshold) triggerAlert("LARGE TILT / POSSIBLE POLE FALL");
      else if (tiltDeg >= tiltThreshold) {
        tiltCounter++;
        if (tiltCounter >= 3) {
          triggerAlert("ANGLE DEVIATION DETECTED");
          tiltCounter = 0;
        }
      } else {
        tiltCounter = 0;
      }
    }
  }

  if (millis() - lastCurrentMs >= 500) {
    lastCurrentMs = millis();
    currentA = readCurrent();
    if (currentHazardEnabled && currentA >= currentHazardThreshold) {
      triggerAlert("ELECTRICAL CURRENT HAZARD");
    }
  }

  updateBuzzer();

  if (millis() - lastSerialMs >= 2000) {
    lastSerialMs = millis();
    Serial.print("[LIVE] Tilt="); Serial.print(tiltDeg,1);
    Serial.print(" deg | Rate="); Serial.print(angleRate,1);
    Serial.print(" deg/s | Accel="); Serial.print(accelG,2);
    Serial.print(" g | Current="); Serial.print(currentA,3);
    Serial.print(" A | Alert="); Serial.print(alertActive ? alertReason : "NORMAL");
    Serial.print(" | Clients="); Serial.println(WiFi.softAPgetStationNum());
  }

  delay(1);
}
