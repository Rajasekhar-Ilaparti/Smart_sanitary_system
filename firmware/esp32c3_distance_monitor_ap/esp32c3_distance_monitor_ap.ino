/*
  ESP32-C3 Mini + HC-SR04 + Buzzer + Built-in LED
  --------------------------------------------------
  ACCESS POINT (AP) MODE VERSION

  The ESP32-C3 creates its own Wi-Fi network. No router is needed.

  HOW TO USE
  1. Power the board.
  2. On your phone/laptop, join Wi-Fi:  ESP32-Distance
     Password:                          12345678
  3. Open a browser at:                 http://192.168.4.1

  PINS
  TRIG   = GPIO 4
  ECHO   = GPIO 5 (through 10k/20k voltage divider)
  BUZZER = GPIO 6
  LED    = GPIO 8

  HC-SR04 ECHO WARNING:
  ---------------------
  Never connect a typical 5V HC-SR04 ECHO directly to GPIO 5.

  Use:
      ECHO -> 10k -> GPIO5 junction -> 10k -> 10k -> GND

  The lower leg is 20k, giving about 3.33V from a 5V ECHO.

  BUZZER:
  -------
  This code assumes an ACTIVE buzzer/module.
  A high-current buzzer must be driven with a transistor/MOSFET.

  ACCESS POINT:
  -------------
  Change AP_SSID and AP_PASSWORD below.
  AP_PASSWORD must be at least 8 characters (WPA2 requirement),
  or set it to "" for an open network.
*/

#include <WiFi.h>
#include <WebServer.h>

// --------------------- Access Point -------------------------

const char* AP_SSID     = "ESP32-Distance";
const char* AP_PASSWORD = "12345678";   // min 8 chars, or "" for open
const int   AP_CHANNEL  = 6;            // 1-13
const int   AP_MAX_CLIENTS = 4;

IPAddress AP_IP(192, 168, 4, 1);
IPAddress AP_GATEWAY(192, 168, 4, 1);
IPAddress AP_SUBNET(255, 255, 255, 0);

// ------------------------- Pins -----------------------------

#define TRIG_PIN   4
#define ECHO_PIN   5
#define BUZZER_PIN 6
#define LED_PIN    8

// ---------------------- Application -------------------------

WebServer server(80);

float distanceCm = -1.0;

float thresholdDistance = 50.0;
const float warningRange = 30.0;
const float maxLEDDistance = 150.0;

bool buzzerOn = false;

unsigned long lastSensorRead = 0;
unsigned long lastBuzzerUpdate = 0;

// ESP32 Arduino Core 3.x LEDC API
const uint32_t LED_PWM_FREQUENCY = 5000;
const uint8_t LED_PWM_RESOLUTION = 8;

// ---------------------- Sensor ------------------------------

float readDistanceCm() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);

  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  unsigned long duration = pulseIn(ECHO_PIN, HIGH, 30000);

  if (duration == 0) {
    return -1.0;
  }

  float d = duration * 0.0343f / 2.0f;

  if (d < 2.0f || d > 400.0f) {
    return -1.0;
  }

  return d;
}

// ------------------------ LED --------------------------------

void updateLED() {
  if (distanceCm < 0) {
    ledcWrite(LED_PIN, 0);
    return;
  }

  int brightness;

  if (distanceCm <= thresholdDistance) {
    brightness = 255;
  }
  else if (distanceCm >= maxLEDDistance) {
    brightness = 0;
  }
  else {
    float ratio =
      (maxLEDDistance - distanceCm) /
      (maxLEDDistance - thresholdDistance);

    brightness = (int)(ratio * 255.0f);

    brightness = constrain(brightness, 0, 255);
  }

  ledcWrite(LED_PIN, brightness);
}

// ----------------------- Buzzer ------------------------------

void updateBuzzer() {
  if (distanceCm < 0) {
    digitalWrite(BUZZER_PIN, LOW);
    buzzerOn = false;
    return;
  }

  // Continuous alarm at/below threshold
  if (distanceCm <= thresholdDistance) {
    digitalWrite(BUZZER_PIN, HIGH);
    buzzerOn = true;
    return;
  }

  // Warning zone
  if (distanceCm <= thresholdDistance + warningRange) {

    float progress =
      (thresholdDistance + warningRange - distanceCm) /
      warningRange;

    progress = constrain(progress, 0.0f, 1.0f);

    // Far edge: slow beeps
    // Near threshold: fast beeps
    unsigned long interval =
      (unsigned long)(700.0f - progress * 600.0f);

    if (millis() - lastBuzzerUpdate >= interval) {
      lastBuzzerUpdate = millis();
      buzzerOn = !buzzerOn;
      digitalWrite(BUZZER_PIN, buzzerOn ? HIGH : LOW);
    }
  }
  else {
    digitalWrite(BUZZER_PIN, LOW);
    buzzerOn = false;
  }
}

// -------------------- Access Point ---------------------------

void startAccessPoint() {
  Serial.println();
  Serial.println("Starting Access Point...");

  WiFi.disconnect(true);
  delay(200);

  WiFi.mode(WIFI_AP);
  delay(200);

  if (!WiFi.softAPConfig(AP_IP, AP_GATEWAY, AP_SUBNET)) {
    Serial.println("softAPConfig FAILED (using default 192.168.4.1)");
  }

  bool ok = WiFi.softAP(AP_SSID, AP_PASSWORD, AP_CHANNEL, 0, AP_MAX_CLIENTS);

  // Moderate transmit power (helps with ESP32-C3 Mini brownouts /
  // antenna issues). Raise to WIFI_POWER_19_5dBm for more range.
  WiFi.setTxPower(WIFI_POWER_8_5dBm);

  if (ok) {
    Serial.println("Access Point STARTED!");
    Serial.print("SSID:     ");
    Serial.println(AP_SSID);
    Serial.print("Password: ");
    Serial.println(strlen(AP_PASSWORD) ? AP_PASSWORD : "(open network)");
    Serial.print("AP IP:    ");
    Serial.println(WiFi.softAPIP());
  }
  else {
    Serial.println("Access Point FAILED to start!");
    Serial.println("Check that AP_PASSWORD is at least 8 characters.");
  }
}

// ------------------------- Web UI ----------------------------

String jsonBool(bool value) {
  return value ? "true" : "false";
}

void handleData() {
  String json = "{";

  json += "\"distance\":";
  if (distanceCm < 0) {
    json += "null";
  } else {
    json += String(distanceCm, 1);
  }

  json += ",\"threshold\":";
  json += String(thresholdDistance, 1);

  json += ",\"buzzer\":";
  json += jsonBool(buzzerOn);

  json += ",\"ssid\":\"";
  json += AP_SSID;
  json += "\"";

  json += ",\"ip\":\"";
  json += WiFi.softAPIP().toString();
  json += "\"";

  json += ",\"clients\":";
  json += String(WiFi.softAPgetStationNum());

  json += "}";

  server.send(200, "application/json", json);
}

void handleThreshold() {
  if (!server.hasArg("value")) {
    server.send(400, "text/plain", "Missing value");
    return;
  }

  float newThreshold = server.arg("value").toFloat();

  if (newThreshold < 5.0f || newThreshold > 300.0f) {
    server.send(400, "text/plain", "Threshold must be 5-300 cm");
    return;
  }

  thresholdDistance = newThreshold;

  server.send(200, "text/plain", "OK");
}

// Stored in flash (global), not on the stack
const char INDEX_HTML[] PROGMEM = R"HTML(
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>ESP32-C3 Distance Monitor</title>
<style>
*{box-sizing:border-box}
body{
  margin:0;
  font-family:Arial,sans-serif;
  background:#0d1117;
  color:#f0f6fc;
}
.wrap{
  width:min(680px,94%);
  margin:auto;
  padding:22px 0 35px;
}
h1{
  font-size:30px;
  margin:8px 0;
}
.sub{
  color:#8b949e;
  margin-bottom:20px;
}
.card{
  background:#161b22;
  border:1px solid #30363d;
  border-radius:20px;
  padding:22px;
  margin:14px 0;
  box-shadow:0 8px 30px rgba(0,0,0,.18);
}
.label{
  color:#8b949e;
  font-size:14px;
  text-transform:uppercase;
  letter-spacing:1px;
}
.distance{
  font-size:68px;
  font-weight:800;
  margin:8px 0;
}
.unit{
  font-size:20px;
  color:#8b949e;
}
.row{
  display:flex;
  justify-content:space-between;
  gap:12px;
  margin:12px 0;
  padding:12px 0;
  border-bottom:1px solid #30363d;
}
input,button{
  width:100%;
  padding:13px;
  border-radius:12px;
  border:1px solid #30363d;
  background:#0d1117;
  color:#f0f6fc;
  font-size:16px;
}
button{
  margin-top:10px;
  cursor:pointer;
  font-weight:700;
}
.status{
  font-weight:700;
}
</style>
</head>
<body>
<div class="wrap">
  <h1>ESP32-C3 Distance Monitor</h1>
  <div class="sub">Live HC-SR04 monitoring &middot; Access Point mode</div>

  <div class="card">
    <div class="label">Distance</div>
    <div class="distance"><span id="distance">--</span>
      <span class="unit">cm</span>
    </div>
    <div id="message">Waiting for sensor...</div>
  </div>

  <div class="card">
    <div class="label">Controls</div>
    <p>Alarm threshold (cm)</p>
    <input id="threshold" type="number" min="5" max="300" step="1">
    <button onclick="setThreshold()">Set Threshold</button>
  </div>

  <div class="card">
    <div class="label">System</div>
    <div class="row"><span>Link</span><span id="link" class="status">--</span></div>
    <div class="row"><span>Network (SSID)</span><span id="ssid">--</span></div>
    <div class="row"><span>AP IP</span><span id="ip">--</span></div>
    <div class="row"><span>Connected devices</span><span id="clients">--</span></div>
    <div class="row"><span>Buzzer</span><span id="buzzer">--</span></div>
    <div class="row"><span>Threshold</span><span id="threshText">--</span></div>
  </div>
</div>

<script>
let initialized=false;

function update(){
  fetch('/api/data')
    .then(r=>r.json())
    .then(d=>{
      document.getElementById('distance').textContent =
        d.distance===null ? '--' : Number(d.distance).toFixed(1);

      document.getElementById('link').textContent='CONNECTED';
      document.getElementById('ssid').textContent=d.ssid;
      document.getElementById('ip').textContent=d.ip;
      document.getElementById('clients').textContent=d.clients;
      document.getElementById('buzzer').textContent=d.buzzer?'ON':'OFF';
      document.getElementById('threshText').textContent=d.threshold+' cm';

      if(!initialized){
        document.getElementById('threshold').value=d.threshold;
        initialized=true;
      }

      let msg='Normal';
      if(d.distance===null) msg='No valid sensor reading';
      else if(d.distance<=d.threshold) msg='ALARM — threshold reached';
      else if(d.distance<=d.threshold+30) msg='Warning — object approaching';

      document.getElementById('message').textContent=msg;
    })
    .catch(()=>{
      document.getElementById('link').textContent='LOST — rejoin ESP32 Wi-Fi';
    });
}

function setThreshold(){
  const value=document.getElementById('threshold').value;
  fetch('/api/threshold?value='+encodeURIComponent(value))
    .then(r=>r.text().then(t=>{ if(!r.ok) alert(t); }))
    .then(()=>update());
}

update();
setInterval(update,500);
</script>
</body>
</html>
)HTML";

void handleRoot() {
  server.send_P(200, "text/html", INDEX_HTML);
}

// Any unknown URL -> send the user to the dashboard
void handleNotFound() {
  server.sendHeader("Location", String("http://") + WiFi.softAPIP().toString() + "/", true);
  server.send(302, "text/plain", "");
}

// ------------------------- Setup -----------------------------

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println();
  Serial.println("======================================");
  Serial.println(" ESP32-C3 ULTRASONIC DISTANCE MONITOR");
  Serial.println("           (ACCESS POINT MODE)");
  Serial.println("======================================");

  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(BUZZER_PIN, OUTPUT);

  digitalWrite(TRIG_PIN, LOW);
  digitalWrite(BUZZER_PIN, LOW);

  // ESP32 Arduino Core 3.x LEDC
  ledcAttach(LED_PIN, LED_PWM_FREQUENCY, LED_PWM_RESOLUTION);
  ledcWrite(LED_PIN, 0);

  startAccessPoint();

  server.on("/", handleRoot);
  server.on("/api/data", handleData);
  server.on("/api/threshold", handleThreshold);
  server.onNotFound(handleNotFound);

  server.begin();

  Serial.println("Web Server Started");
  Serial.println();
  Serial.println("======================================");
  Serial.print(" 1. Join Wi-Fi: ");
  Serial.println(AP_SSID);
  Serial.println(" 2. Open this in your browser:");
  Serial.print("    http://");
  Serial.println(WiFi.softAPIP());
  Serial.println("======================================");
}

// -------------------------- Loop -----------------------------

void loop() {
  server.handleClient();

  // Sensor update every 100 ms
  if (millis() - lastSensorRead >= 100) {
    lastSensorRead = millis();

    distanceCm = readDistanceCm();

    updateLED();
  }

  updateBuzzer();
}
