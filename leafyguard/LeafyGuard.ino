/*
  ============================================================
                         LEAFYGUARD
              Smart Leafy Vegetable Storage
  ============================================================

  BOARD:   Seeed Studio XIAO ESP32-C6
  CORE:    Arduino-ESP32 3.x

  NETWORK: ACCESS POINT MODE (no router needed)
    SSID     : LeafyGuard
    Password : leafyguard123
    Dashboard: http://192.168.4.1
    A captive portal opens the dashboard automatically on
    most phones after joining the network.

  SENSOR:  BME280 (I2C 0x76)
  OLED:    1.3" SH1106 128x64 (I2C 0x3C)
           SDA = D4, SCL = D5

  ATOMIZER:
    5V atomizer, 2N7000 MOSFET gate = D2
    Add a 10k pull-down from gate to GND so the atomizer stays
    OFF while the ESP32 boots. Note: the 2N7000 is only barely
    switched on by 3.3V (Vgs(th) up to 3V). If the atomizer is
    weak or the MOSFET gets warm, use a logic-level MOSFET
    such as the AO3400.

  OLED SEQUENCE:
    Wi-Fi details for 10 seconds, then every 5 seconds:
    Temperature -> Humidity -> Atomizer -> Wi-Fi QR -> Dashboard QR

  SAFETY:
    - Atomizer runs at most 30 s, then rests 60 s (AUTO and MANUAL)
    - Atomizer never runs at or above 95 % humidity
    - Atomizer is switched OFF if the sensor fails (AUTO)
*/

// ============================================================
// LIBRARIES
// ============================================================

#include <WiFi.h>
#include <WebServer.h>
#include <DNSServer.h>
#include <Wire.h>
#include <Preferences.h>

#include <Adafruit_Sensor.h>
#include <Adafruit_BME280.h>

#include <U8g2lib.h>

// Espressif QR API bundled with Arduino-ESP32 3.x (not ricmoo/QRCode)
#include <qrcode.h>

// ============================================================
// ACCESS POINT
// ============================================================

const char* AP_SSID     = "LeafyGuard";
const char* AP_PASSWORD = "leafyguard123";   // must be 8+ characters
const int   AP_CHANNEL  = 6;
const int   AP_MAX_CLIENTS = 4;

const IPAddress AP_IP(192, 168, 4, 1);
const IPAddress AP_GATEWAY(192, 168, 4, 1);
const IPAddress AP_SUBNET(255, 255, 255, 0);

const byte DNS_PORT = 53;

// ============================================================
// PINS & ADDRESSES
// ============================================================

#define I2C_SDA       D4
#define I2C_SCL       D5
#define ATOMIZER_PIN  D2

#define BME_ADDRESS   0x76
#define OLED_ADDRESS  0x3C

// ============================================================
// OBJECTS
// ============================================================

Adafruit_BME280 bme;
U8G2_SH1106_128X64_NONAME_F_HW_I2C oled(U8G2_R0, U8X8_PIN_NONE);
WebServer server(80);
DNSServer dnsServer;
Preferences preferences;

// ============================================================
// SENSOR DATA
// ============================================================

bool  bmeOK       = false;   // sensor found at boot / after retry
bool  sensorValid = false;   // last reading was good
float temperature = NAN;
float humidity    = NAN;

// ============================================================
// SETTINGS (stored in NVS)
// ============================================================

const float DEFAULT_TEMP_ON  = 30.0;
const float DEFAULT_TEMP_OFF = 28.0;
const float DEFAULT_HUM_ON   = 70.0;
const float DEFAULT_HUM_OFF  = 75.0;

float temperatureOn  = DEFAULT_TEMP_ON;
float temperatureOff = DEFAULT_TEMP_OFF;
float humidityOn     = DEFAULT_HUM_ON;
float humidityOff    = DEFAULT_HUM_OFF;

bool autoMode = true;

// Never humidify above this - wet leaves rot quickly
const float HUMIDITY_MAX = 95.0;

// ============================================================
// ATOMIZER STATE
// ============================================================

bool atomizerState = false;
bool atomizerResting = false;

unsigned long atomizerStartTime = 0;
unsigned long atomizerRestStart = 0;

const unsigned long MAX_ATOMIZER_TIME   = 30000;  // max continuous run
const unsigned long ATOMIZER_REST_TIME  = 60000;  // pause after a max run

// ============================================================
// TIMERS
// ============================================================

unsigned long lastSensorRead = 0;
unsigned long lastOLEDChange = 0;
unsigned long bootTime       = 0;

const unsigned long SENSOR_INTERVAL    = 2000;
const unsigned long OLED_INTERVAL      = 5000;
const unsigned long IP_DISPLAY_TIME    = 10000;

// ============================================================
// OLED SCREENS
// ============================================================

enum OledScreen {
  SCREEN_TEMPERATURE = 0,
  SCREEN_HUMIDITY,
  SCREEN_ATOMIZER,
  SCREEN_WIFI_QR,
  SCREEN_URL_QR,
  SCREEN_COUNT
};

// Starts on the last screen so the first advance shows Temperature
int oledScreen = SCREEN_COUNT - 1;

// Text drawn beside the QR code (set before generating it)
const char* qrLine1 = "";
const char* qrLine2 = "";
const char* qrLine3 = "";

// ============================================================
// HTML
// ============================================================

const char MAIN_PAGE[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#08120d">
<title>LeafyGuard</title>
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='18' fill='%23b8f36b'/%3E%3Cpath d='M48 14C29 16 16 27 16 43c0 4 1 7 2 9 2-10 8-17 17-21-5 5-9 11-11 19 15-3 25-14 24-36Z' fill='%2308120d'/%3E%3Cpath d='M19 48c8-11 15-18 27-26' fill='none' stroke='%23b8f36b' stroke-width='3' stroke-linecap='round'/%3E%3C/svg%3E">
<style>
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;min-height:100vh;color:#f2f7f3;
  background:radial-gradient(circle at 15% 0%,rgba(184,243,107,.07),transparent 28%),#07100c;
  font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
button{font-family:inherit}

/* HEADER */
.header{position:sticky;top:0;z-index:20;background:rgba(7,16,12,.92);
  backdrop-filter:blur(14px);border-bottom:1px solid #1d3528}
.headerInner{max-width:1180px;margin:auto;padding:15px 18px;display:flex;
  align-items:center;justify-content:space-between;gap:15px}
.brand{display:flex;align-items:center;gap:12px}
.logo{width:46px;height:46px;border-radius:14px;background:#b8f36b;display:flex;
  align-items:center;justify-content:center;box-shadow:0 8px 30px rgba(184,243,107,.15)}
.logo svg{width:29px;height:29px}
.brandName{font-size:19px;font-weight:750;letter-spacing:-.4px}
.brandSub{margin-top:3px;font-size:11px;color:#81998b}
.connection{display:flex;align-items:center;gap:7px;padding:8px 11px;border:1px solid #264635;
  border-radius:999px;background:#0b1a12;color:#9cb4a5;font-size:11px}
.dot{width:7px;height:7px;border-radius:50%;background:#b8f36b;box-shadow:0 0 10px rgba(184,243,107,.7)}
.dot.off{background:#e96f6f;box-shadow:0 0 10px rgba(233,111,111,.7)}

/* NAV */
.nav{max-width:1180px;margin:auto;padding:12px 18px;display:flex;gap:8px;overflow-x:auto;scrollbar-width:none}
.nav::-webkit-scrollbar{display:none}
.nav a{text-decoration:none;flex:0 0 auto;border:1px solid #203b2c;background:#0a1811;color:#92aa9b;padding:10px 15px;
  border-radius:11px;font-size:12px;font-weight:600;cursor:pointer;transition:.2s ease}
.nav a:hover{border-color:#42654f;color:#d7e8dd}
.nav a.active{background:#b8f36b;border-color:#b8f36b;color:#08120d}

/* MAIN */
main{max-width:1180px;margin:auto;padding:18px}
.tab{display:none;animation:fadeIn .22s ease}
.tab.active{display:block}
/* Without JavaScript, tabs still switch using the #link */
.tab:target{display:block}
main:has(.tab:target) .tab.active:not(:target){display:none}
.jsWarning{max-width:1180px;margin:0 auto 4px;padding:12px 18px;color:#ffd66b;background:#302811;
  border:1px solid #5a4a1c;border-radius:12px;font-size:13px;line-height:1.6}
.jsReady .jsWarning{display:none}
@keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}

/* HERO */
.hero{position:relative;overflow:hidden;border:1px solid #294937;border-radius:24px;padding:25px;
  margin-bottom:15px;background:linear-gradient(135deg,#0d2117,#09150f)}
.hero:after{content:"";position:absolute;width:190px;height:190px;right:-75px;top:-90px;
  border-radius:50%;background:rgba(184,243,107,.08)}
.eyebrow{color:#829b8c;font-size:11px;letter-spacing:1.4px;text-transform:uppercase}
.heroState{font-size:32px;font-weight:800;letter-spacing:-1px;margin-top:7px}
.heroInfo{margin-top:7px;color:#91a99b;font-size:13px}

/* GRID & CARDS */
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px}
.card{background:#0a1912;border:1px solid #203d2d;border-radius:20px;padding:20px;box-shadow:0 10px 35px rgba(0,0,0,.12)}
.cardTitle{color:#819a8b;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin-bottom:13px}
.metric{font-size:43px;font-weight:800;letter-spacing:-2px;line-height:1}
.metric .unit{font-size:15px;color:#81998b;letter-spacing:0;font-weight:500;margin-left:4px}
.metricFoot{margin-top:13px;color:#748d7e;font-size:12px}

/* STATUS */
.status{display:inline-flex;align-items:center;gap:7px;padding:7px 10px;margin-top:14px;
  border-radius:999px;font-size:11px;font-weight:700}
.status.good{color:#b8f36b;background:#132c1d}
.status.warn{color:#ffd66b;background:#302811}
.status.bad{color:#ff8585;background:#35191b}

/* BUTTONS */
.action{width:100%;border:0;border-radius:13px;padding:14px;margin-top:10px;background:#b8f36b;
  color:#07100c;font-size:13px;font-weight:750;cursor:pointer;transition:transform .15s ease,opacity .15s ease}
.action:hover{opacity:.9;transform:translateY(-1px)}
.action:disabled{opacity:.5;cursor:wait;transform:none}
.action.red{background:#e96f6f;color:#160707}

/* SEGMENT */
.segment{display:grid;grid-template-columns:1fr 1fr;gap:6px;background:#07110c;
  border:1px solid #1e392a;border-radius:14px;padding:5px}
.segment button{border:0;border-radius:10px;padding:12px;background:transparent;color:#829b8c;cursor:pointer;font-weight:700}
.segment button.active{background:#b8f36b;color:#07100c}

/* INPUTS */
label{display:block;color:#8ca597;font-size:12px;margin:16px 0 7px}
input{width:100%;border:1px solid #2a4937;background:#07110c;color:#f2f7f3;border-radius:12px;
  padding:13px;outline:none;font-size:16px}
input:focus{border-color:#b8f36b;box-shadow:0 0 0 3px rgba(184,243,107,.08)}

/* INFO */
.info{color:#829b8c;font-size:12px;line-height:1.7}
.msg{min-height:18px;margin-top:10px;font-size:12px;font-weight:600}
.msg.ok{color:#b8f36b}
.msg.err{color:#ff8585}
.row{display:flex;justify-content:space-between;gap:15px;padding:12px 0;border-bottom:1px solid #183326;font-size:12px}
.row:last-child{border-bottom:0}
.row span{color:#789181}
.row strong{color:#dce9e0;text-align:right}

.sectionHead{margin:8px 0 15px}
.sectionHead h2{margin:0;font-size:20px;letter-spacing:-.5px}
.sectionHead p{margin:6px 0 0;color:#7e9788;font-size:12px}

footer{max-width:1180px;margin:auto;padding:25px 18px 40px;text-align:center;color:#536b5c;font-size:10px}

@media(max-width:600px){
  main{padding:13px}
  .headerInner{padding:13px}
  .brandName{font-size:17px}
  .connection{font-size:0;padding:9px}
  .hero{padding:20px;border-radius:20px}
  .heroState{font-size:28px}
  .metric{font-size:40px}
  .card{padding:17px}
}
</style>
</head>
<body>

<header class="header">
<div class="headerInner">
  <div class="brand">
    <div class="logo">
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M48 14C29 16 16 27 16 43C16 47 17 50 18 52C20 42 26 34 35 30C30 35 24 42 23 51C38 48 48 37 48 14Z" fill="#08120D"/>
        <path d="M19 48C27 37 35 29 46 21" stroke="#B8F36B" stroke-width="4" stroke-linecap="round"/>
      </svg>
    </div>
    <div>
      <div class="brandName">LeafyGuard</div>
      <div class="brandSub">Smart leafy-vegetable storage</div>
    </div>
  </div>
  <div class="connection">
    <div id="linkDot" class="dot"></div>
    <span id="linkText">CONNECTING...</span>
  </div>
</div>
</header>

<nav class="nav">
  <a href="#overview" class="active" onclick="return openTab('overview',this)">Overview</a>
  <a href="#control" onclick="return openTab('control',this)">Control</a>
  <a href="#environment" onclick="return openTab('environment',this)">Environment</a>
  <a href="#system" onclick="return openTab('system',this)">System</a>
</nav>

<div id="jsWarning" class="jsWarning">
  This window is blocking the live dashboard.<br>
  Open <strong>http://192.168.4.1</strong> in Chrome (or your normal browser) instead.
</div>

<main>

<!-- OVERVIEW -->
<section id="overview" class="tab active">
  <div class="hero">
    <div class="eyebrow">Storage condition</div>
    <div id="heroState" class="heroState">Checking environment...</div>
    <div id="heroInfo" class="heroInfo">Reading BME280 sensor</div>
  </div>

  <div class="grid">
    <div class="card">
      <div class="cardTitle">Temperature</div>
      <div class="metric"><span id="temperature">--</span><span class="unit">&deg;C</span></div>
      <div id="tempStatus" class="status good">&#9679; NORMAL</div>
      <div id="tempFoot" class="metricFoot">ON at -- / OFF at --</div>
    </div>

    <div class="card">
      <div class="cardTitle">Humidity</div>
      <div class="metric"><span id="humidity">--</span><span class="unit">%</span></div>
      <div id="humidityStatus" class="status good">&#9679; NORMAL</div>
      <div id="humFoot" class="metricFoot">ON at -- / OFF at --</div>
    </div>

    <div class="card">
      <div class="cardTitle">Atomizer</div>
      <div id="atomizerValue" class="metric">OFF</div>
      <div id="atomizerStatus" class="status good">&#9679; READY</div>
      <div id="modeText" class="metricFoot">AUTO MODE</div>
    </div>
  </div>
</section>

<!-- CONTROL -->
<section id="control" class="tab">
  <div class="sectionHead">
    <h2>Atomizer control</h2>
    <p>Control the storage humidification system.</p>
  </div>

  <div class="grid">
    <div class="card">
      <div class="cardTitle">Operating mode</div>
      <div class="segment">
        <button id="autoBtn" class="active" onclick="setMode('auto')">AUTO</button>
        <button id="manualBtn" onclick="setMode('manual')">MANUAL</button>
      </div>
      <p class="info">
        AUTO mode controls the atomizer from the environment thresholds.
        MANUAL mode gives direct control. Using the manual buttons switches to MANUAL automatically.
      </p>
    </div>

    <div class="card">
      <div class="cardTitle">Manual control</div>
      <button class="action" onclick="setAtomizer('on')">TURN ATOMIZER ON</button>
      <button class="action red" onclick="setAtomizer('off')">TURN ATOMIZER OFF</button>
      <div id="controlMsg" class="msg"></div>
      <p class="info">
        For safety the atomizer stops after 30 seconds and then rests for 60 seconds,
        in both modes. It never runs at 95% humidity or above.
      </p>
    </div>
  </div>
</section>

<!-- ENVIRONMENT -->
<section id="environment" class="tab">
  <div class="sectionHead">
    <h2>Environment</h2>
    <p>Configure the conditions at which LeafyGuard activates the atomizer.</p>
  </div>

  <div class="card">
    <label for="temperatureOn">Temperature ON threshold (&deg;C)</label>
    <input id="temperatureOn" type="number" step="0.1" inputmode="decimal">

    <label for="temperatureOff">Temperature OFF threshold (&deg;C) &mdash; must be lower than ON</label>
    <input id="temperatureOff" type="number" step="0.1" inputmode="decimal">

    <label for="humidityOn">Humidity ON threshold (%)</label>
    <input id="humidityOn" type="number" step="0.1" inputmode="decimal">

    <label for="humidityOff">Humidity OFF threshold (%) &mdash; must be higher than ON</label>
    <input id="humidityOff" type="number" step="0.1" inputmode="decimal">

    <button id="saveBtn" class="action" onclick="saveSettings()">SAVE ENVIRONMENT SETTINGS</button>
    <div id="settingsMsg" class="msg"></div>

    <p class="info">
      The atomizer starts when temperature reaches the ON value or humidity falls to the ON value.
      It stops when temperature is back at or below the OFF value and humidity is at or above the OFF value.
      This gap (hysteresis) stops it rapidly switching on and off.
    </p>
  </div>
</section>

<!-- SYSTEM -->
<section id="system" class="tab">
  <div class="sectionHead">
    <h2>System</h2>
    <p>LeafyGuard controller information.</p>
  </div>

  <div class="grid">
    <div class="card">
      <div class="cardTitle">Controller</div>
      <div class="row"><span>Board</span><strong>XIAO ESP32-C6</strong></div>
      <div class="row"><span>Firmware</span><strong>LeafyGuard</strong></div>
      <div class="row"><span>Sensor</span><strong id="sensorState">--</strong></div>
      <div class="row"><span>Uptime</span><strong id="uptime">--</strong></div>
    </div>

    <div class="card">
      <div class="cardTitle">Display</div>
      <div class="row"><span>Display</span><strong>SH1106 128x64</strong></div>
      <div class="row"><span>I2C</span><strong>D4 / D5</strong></div>
      <div class="row"><span>OLED address</span><strong>0x3C</strong></div>
    </div>

    <div class="card">
      <div class="cardTitle">Network</div>
      <div class="row"><span>Mode</span><strong>Access point</strong></div>
      <div class="row"><span>Wi-Fi name</span><strong id="ssid">--</strong></div>
      <div class="row"><span>IP address</span><strong id="ipAddress">--</strong></div>
      <div class="row"><span>Connected devices</span><strong id="clients">--</strong></div>
    </div>
  </div>
</section>

</main>

<footer>
LeafyGuard<br>
Smart environmental protection for leafy vegetables
</footer>

<script>
function $(id){ return document.getElementById(id); }

function setStatus(el, text, cls){
  el.textContent = '● ' + text;
  el.className = 'status ' + cls;
}

/* TABS */
function openTab(id, link){
  document.querySelectorAll('.tab').forEach(function(t){ t.classList.remove('active'); });
  $(id).classList.add('active');
  document.querySelectorAll('.nav a').forEach(function(b){ b.classList.remove('active'); });
  link.classList.add('active');
  return false;   // don't jump to the #link
}

// JavaScript is running: hide the warning banner
document.documentElement.classList.add('jsReady');

function formatUptime(s){
  var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return h + 'h ' + m + 'm ' + sec + 's';
}

/* POST helper */
async function post(url, data){
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(data).toString()
  });
  const text = await r.text();
  if(!r.ok) throw new Error(text || ('HTTP ' + r.status));
  return text;
}

function showMsg(id, text, ok){
  const el = $(id);
  el.textContent = text;
  el.className = 'msg ' + (ok ? 'ok' : 'err');
  clearTimeout(el._t);
  el._t = setTimeout(function(){ el.textContent = ''; }, 4000);
}

/* DATA */
async function updateData(){
  try{
    const r = await fetch('/api/data', { cache: 'no-store' });
    if(!r.ok) throw new Error('HTTP ' + r.status);
    const d = await r.json();

    // Sensor is OK if the board says so OR real numbers arrived
    const sensorOk = d.sensor === true ||
      (typeof d.temperature === 'number' && typeof d.humidity === 'number');

    $('linkDot').className = 'dot';
    $('linkText').textContent = 'LEAFYGUARD ONLINE';

    $('ssid').textContent = d.ssid;
    $('ipAddress').textContent = d.ip;
    $('clients').textContent = d.clients;
    $('uptime').textContent = formatUptime(d.uptime);
    $('sensorState').textContent = sensorOk ? 'BME280 OK' : 'BME280 ERROR';

    $('tempFoot').textContent = 'ON at ' + d.temperatureOn + ' °C / OFF at ' + d.temperatureOff + ' °C';
    $('humFoot').textContent  = 'ON at ' + d.humidityOn + ' % / OFF at ' + d.humidityOff + ' %';

    /* SENSOR VALUES */
    if(sensorOk){
      $('temperature').textContent = Number(d.temperature).toFixed(1);
      $('humidity').textContent = Number(d.humidity).toFixed(1);

      if(d.temperature >= d.temperatureOn)       setStatus($('tempStatus'), 'HIGH', 'bad');
      else if(d.temperature > d.temperatureOff)  setStatus($('tempStatus'), 'WARM', 'warn');
      else                                       setStatus($('tempStatus'), 'NORMAL', 'good');

      if(d.humidity >= d.humidityMax)            setStatus($('humidityStatus'), 'TOO WET', 'bad');
      else if(d.humidity <= d.humidityOn)        setStatus($('humidityStatus'), 'LOW', 'warn');
      else                                       setStatus($('humidityStatus'), 'NORMAL', 'good');
    }else{
      $('temperature').textContent = '--';
      $('humidity').textContent = '--';
      setStatus($('tempStatus'), 'SENSOR ERROR', 'bad');
      setStatus($('humidityStatus'), 'SENSOR ERROR', 'bad');
    }

    /* ATOMIZER */
    $('atomizerValue').textContent = d.atomizer ? 'ON' : 'OFF';
    $('modeText').textContent = d.auto ? 'AUTO MODE' : 'MANUAL MODE';

    if(d.atomizer)      setStatus($('atomizerStatus'), 'ACTIVE ' + d.runLeft + 's left', 'warn');
    else if(d.resting)  setStatus($('atomizerStatus'), 'RESTING ' + d.restLeft + 's', 'bad');
    else                setStatus($('atomizerStatus'), 'READY', 'good');

    /* HERO */
    if(!sensorOk){
      $('heroState').textContent = 'Sensor not responding';
      $('heroInfo').textContent = 'Check the BME280 wiring (address 0x76). Automatic control is paused.';
    }else if(d.atomizer){
      $('heroState').textContent = 'Moisture protection active';
      $('heroInfo').textContent = 'Atomizer is currently running';
    }else if(d.resting){
      $('heroState').textContent = 'Atomizer resting';
      $('heroInfo').textContent = 'Safety pause after the maximum run time';
    }else{
      $('heroState').textContent = 'Storage environment monitored';
      $('heroInfo').textContent = d.auto ? 'Automatic environmental protection is ready' : 'Manual mode - automatic control is off';
    }

    /* MODE BUTTONS */
    $('autoBtn').classList.toggle('active', d.auto);
    $('manualBtn').classList.toggle('active', !d.auto);
  }
  catch(e){
    $('linkDot').className = 'dot off';
    $('linkText').textContent = 'DISCONNECTED';
    console.log('Data update error:', e);
  }
}

/* SETTINGS */
async function loadSettings(){
  try{
    const r = await fetch('/api/settings', { cache: 'no-store' });
    const d = await r.json();
    $('temperatureOn').value  = d.temperatureOn;
    $('temperatureOff').value = d.temperatureOff;
    $('humidityOn').value     = d.humidityOn;
    $('humidityOff').value    = d.humidityOff;
  }
  catch(e){ console.log(e); }
}

async function saveSettings(){
  const btn = $('saveBtn');
  btn.disabled = true;
  try{
    await post('/api/settings', {
      temperatureOn:  $('temperatureOn').value,
      temperatureOff: $('temperatureOff').value,
      humidityOn:     $('humidityOn').value,
      humidityOff:    $('humidityOff').value
    });
    showMsg('settingsMsg', 'Environment settings saved', true);
    loadSettings();
    updateData();
  }
  catch(e){ showMsg('settingsMsg', e.message, false); }
  btn.disabled = false;
}

/* MODE */
async function setMode(mode){
  try{ await post('/api/mode', { value: mode }); }
  catch(e){ showMsg('controlMsg', e.message, false); }
  updateData();
}

/* ATOMIZER */
async function setAtomizer(state){
  try{
    const t = await post('/api/atomizer', { state: state });
    showMsg('controlMsg', t, true);
  }
  catch(e){ showMsg('controlMsg', e.message, false); }
  updateData();
}

updateData();
loadSettings();
setInterval(updateData, 2000);
</script>

</body>
</html>
)rawliteral";

// ============================================================
// SETTINGS VALIDATION
// ============================================================

// Returns nullptr when valid, otherwise a message for the user.
const char* validateSettings(float tOn, float tOff, float hOn, float hOff) {

  if (isnan(tOn) || isnan(tOff) || isnan(hOn) || isnan(hOff))
    return "All four values must be numbers";

  if (tOn < 0 || tOn > 60 || tOff < 0 || tOff > 60)
    return "Temperature must be between 0 and 60 C";

  if (hOn < 0 || hOn > 100 || hOff < 0 || hOff > 100)
    return "Humidity must be between 0 and 100 %";

  if (tOff >= tOn)
    return "Temperature OFF must be lower than temperature ON";

  if (hOff <= hOn)
    return "Humidity OFF must be higher than humidity ON";

  if (hOff >= HUMIDITY_MAX)
    return "Humidity OFF must be below 95 %";

  return nullptr;
}

// ============================================================
// NVS
// ============================================================

void loadSettings() {

  temperatureOn  = preferences.getFloat("tempOn",  DEFAULT_TEMP_ON);
  temperatureOff = preferences.getFloat("tempOff", DEFAULT_TEMP_OFF);
  humidityOn     = preferences.getFloat("humOn",   DEFAULT_HUM_ON);
  humidityOff    = preferences.getFloat("humOff",  DEFAULT_HUM_OFF);
  autoMode       = preferences.getBool ("auto",    true);

  // Fall back to defaults if stored values are corrupt or invalid
  if (validateSettings(temperatureOn, temperatureOff, humidityOn, humidityOff) != nullptr) {

    Serial.println("Stored settings invalid - using defaults");

    temperatureOn  = DEFAULT_TEMP_ON;
    temperatureOff = DEFAULT_TEMP_OFF;
    humidityOn     = DEFAULT_HUM_ON;
    humidityOff    = DEFAULT_HUM_OFF;
  }
}

void saveThresholds() {
  preferences.putFloat("tempOn",  temperatureOn);
  preferences.putFloat("tempOff", temperatureOff);
  preferences.putFloat("humOn",   humidityOn);
  preferences.putFloat("humOff",  humidityOff);
}

void saveMode() {
  preferences.putBool("auto", autoMode);
}

// ============================================================
// ATOMIZER
// ============================================================

// Returns false if the atomizer may not start right now.
bool startAtomizer() {

  if (atomizerState)
    return true;

  if (atomizerResting)
    return false;

  if (sensorValid && humidity >= HUMIDITY_MAX)
    return false;

  digitalWrite(ATOMIZER_PIN, HIGH);
  atomizerState = true;
  atomizerStartTime = millis();

  Serial.println("ATOMIZER: ON");
  return true;
}

void stopAtomizer() {

  if (!atomizerState)
    return;

  digitalWrite(ATOMIZER_PIN, LOW);
  atomizerState = false;

  Serial.println("ATOMIZER: OFF");
}

// Runs every loop, in BOTH modes.
void atomizerSafety() {

  unsigned long now = millis();

  // Maximum continuous run time -> forced rest
  if (atomizerState && now - atomizerStartTime >= MAX_ATOMIZER_TIME) {

    Serial.println("ATOMIZER SAFETY TIMEOUT - resting");

    stopAtomizer();
    atomizerResting = true;
    atomizerRestStart = now;
  }

  // End of rest period
  if (atomizerResting && now - atomizerRestStart >= ATOMIZER_REST_TIME) {
    atomizerResting = false;
    Serial.println("ATOMIZER REST FINISHED");
  }

  // Never humidify a storage that is already wet
  if (atomizerState && sensorValid && humidity >= HUMIDITY_MAX) {
    Serial.println("ATOMIZER: humidity limit reached");
    stopAtomizer();
  }
}

// ============================================================
// SENSOR
// ============================================================

// Same as the original sketch: read the BME280 directly.
void readSensor() {

  if (!bmeOK) {
    sensorValid = false;
    return;
  }

  temperature = bme.readTemperature();
  humidity = bme.readHumidity();

  sensorValid = !isnan(temperature) && !isnan(humidity);
}

// ============================================================
// AUTOMATIC CONTROL
// ============================================================

void automaticControl() {

  if (!autoMode)
    return;

  // No valid reading -> fail safe (OFF)
  if (!sensorValid) {
    stopAtomizer();
    return;
  }

  if (!atomizerState) {

    // START: too warm OR too dry
    if (temperature >= temperatureOn || humidity <= humidityOn) {
      startAtomizer();   // refused while resting / too wet
    }
  }
  else {

    // STOP: cool enough AND humid enough
    if (temperature <= temperatureOff && humidity >= humidityOff) {
      stopAtomizer();
    }
  }
}

// ============================================================
// OLED HELPERS
// ============================================================

void oledHeader(const char* title) {

  oled.setFont(u8g2_font_6x10_tf);
  oled.drawStr(0, 10, title);
  oled.drawLine(0, 12, 127, 12);
}

void oledBigValue(float value, const char* unit) {

  oled.setFont(u8g2_font_10x20_tf);
  oled.setCursor(0, 53);

  if (!sensorValid || isnan(value)) {
    oled.print("SENSOR ERR");
    return;
  }

  oled.print(value, 1);
  oled.print(unit);
}

// ============================================================
// OLED SCREENS
// ============================================================

void oledTemperature() {

  oled.clearBuffer();
  oledHeader("LEAFYGUARD");

  oled.drawStr(0, 27, "TEMPERATURE");
  oledBigValue(temperature, " C");

  oled.sendBuffer();
}

void oledHumidity() {

  oled.clearBuffer();
  oledHeader("LEAFYGUARD");

  oled.drawStr(0, 27, "HUMIDITY");
  oledBigValue(humidity, " %");

  oled.sendBuffer();
}

void oledAtomizer() {

  oled.clearBuffer();
  oledHeader("ATOMIZER");

  oled.setFont(u8g2_font_10x20_tf);

  if (atomizerState)
    oled.drawStr(0, 38, "ON");
  else if (atomizerResting)
    oled.drawStr(0, 38, "RESTING");
  else
    oled.drawStr(0, 38, "OFF");

  oled.setFont(u8g2_font_6x10_tf);
  oled.drawStr(0, 55, autoMode ? "MODE: AUTO" : "MODE: MANUAL");

  oled.sendBuffer();
}

void oledStartup() {

  oled.clearBuffer();

  oled.setFont(u8g2_font_6x10_tf);
  oled.drawStr(0, 10, "LEAFYGUARD WIFI");
  oled.drawLine(0, 12, 127, 12);

  oled.setFont(u8g2_font_5x8_tf);
  oled.drawStr(0, 24, "Network:");
  oled.drawStr(0, 44, "Password:");

  oled.setFont(u8g2_font_6x10_tf);
  oled.drawStr(48, 24, AP_SSID);
  oled.drawStr(48, 44, AP_PASSWORD);

  oled.setFont(u8g2_font_7x14B_tf);
  oled.setCursor(0, 63);
  oled.print(WiFi.softAPIP().toString());

  oled.sendBuffer();
}

// ============================================================
// QR CODE
// ============================================================

// Called by esp_qrcode_generate() with the finished QR code.
void oledQRDisplay(esp_qrcode_handle_t qrcode) {

  if (qrcode == nullptr)
    return;

  const int modules = esp_qrcode_get_size(qrcode);
  if (modules <= 0)
    return;

  // QR is square: size it from the 64 px HEIGHT, not the width
  const int quiet = 2;                       // white border in pixels
  int scale = (64 - quiet * 2) / modules;
  if (scale < 1) scale = 1;

  const int qrPixels = modules * scale;
  const int boxSize = qrPixels + quiet * 2;
  const int offsetX = 0;
  const int offsetY = (64 - boxSize) / 2;

  oled.clearBuffer();

  // Scanners expect dark modules on a light background:
  // draw a lit (white) square, then clear the dark modules.
  oled.setDrawColor(1);
  oled.drawBox(offsetX, offsetY, boxSize, boxSize);

  oled.setDrawColor(0);
  for (int y = 0; y < modules; y++) {
    for (int x = 0; x < modules; x++) {
      if (esp_qrcode_get_module(qrcode, x, y)) {
        oled.drawBox(
          offsetX + quiet + x * scale,
          offsetY + quiet + y * scale,
          scale,
          scale
        );
      }
    }
  }
  oled.setDrawColor(1);

  // Text in the free space to the right
  const int textX = boxSize + 4;
  oled.setFont(u8g2_font_6x10_tf);
  oled.drawStr(textX, 20, qrLine1);
  oled.drawStr(textX, 34, qrLine2);
  oled.setFont(u8g2_font_5x8_tf);
  oled.drawStr(textX, 50, qrLine3);

  oled.sendBuffer();
}

void showQR(const String& text) {

  esp_qrcode_config_t cfg = ESP_QRCODE_CONFIG_DEFAULT();
  cfg.display_func = oledQRDisplay;

  esp_err_t err = esp_qrcode_generate(&cfg, text.c_str());

  if (err != ESP_OK) {

    Serial.print("QR generation failed: ");
    Serial.println((int)err);

    oled.clearBuffer();
    oledHeader("QR ERROR");
    oled.drawStr(0, 30, "Open dashboard at:");
    oled.drawStr(0, 48, WiFi.softAPIP().toString().c_str());
    oled.sendBuffer();
  }
}

// Scan to join the LeafyGuard Wi-Fi
void oledWifiQR() {

  qrLine1 = "SCAN TO";
  qrLine2 = "JOIN WIFI";
  qrLine3 = AP_SSID;

  String wifi = "WIFI:T:WPA;S:";
  wifi += AP_SSID;
  wifi += ";P:";
  wifi += AP_PASSWORD;
  wifi += ";;";

  showQR(wifi);
}

// Scan to open the dashboard (after joining)
void oledUrlQR() {

  static String ipText;
  ipText = WiFi.softAPIP().toString();

  qrLine1 = "SCAN FOR";
  qrLine2 = "DASHBOARD";
  qrLine3 = ipText.c_str();

  showQR("http://" + ipText);
}

// ============================================================
// OLED UPDATE
// ============================================================

void updateOLED() {

  // First 10 seconds: Wi-Fi details
  if (millis() - bootTime < IP_DISPLAY_TIME) {
    oledStartup();
    return;
  }

  switch (oledScreen) {
    case SCREEN_TEMPERATURE: oledTemperature(); break;
    case SCREEN_HUMIDITY:    oledHumidity();    break;
    case SCREEN_ATOMIZER:    oledAtomizer();    break;
    case SCREEN_WIFI_QR:     oledWifiQR();      break;
    case SCREEN_URL_QR:      oledUrlQR();       break;
  }
}

// ============================================================
// WEB HANDLERS
// ============================================================

void sendNoCacheHeaders() {
  server.sendHeader("Cache-Control", "no-store");
}

void handleRoot() {
  sendNoCacheHeaders();   // always load the newest page after re-flashing
  server.send(200, "text/html", MAIN_PAGE);
}

String jsonNumber(float value, int decimals) {
  // NaN is not valid JSON
  if (isnan(value))
    return "null";
  return String(value, decimals);
}

void handleData() {

  unsigned long now = millis();

  unsigned long runLeft = 0;
  if (atomizerState) {
    unsigned long ran = now - atomizerStartTime;
    runLeft = ran < MAX_ATOMIZER_TIME ? (MAX_ATOMIZER_TIME - ran) / 1000 : 0;
  }

  unsigned long restLeft = 0;
  if (atomizerResting) {
    unsigned long rested = now - atomizerRestStart;
    restLeft = rested < ATOMIZER_REST_TIME ? (ATOMIZER_REST_TIME - rested) / 1000 : 0;
  }

  String json;
  json.reserve(400);

  json += "{\"temperature\":";    json += jsonNumber(temperature, 2);
  json += ",\"humidity\":";       json += jsonNumber(humidity, 2);
  json += ",\"sensor\":";         json += sensorValid ? "true" : "false";
  json += ",\"atomizer\":";       json += atomizerState ? "true" : "false";
  json += ",\"resting\":";        json += atomizerResting ? "true" : "false";
  json += ",\"runLeft\":";        json += String(runLeft);
  json += ",\"restLeft\":";       json += String(restLeft);
  json += ",\"auto\":";           json += autoMode ? "true" : "false";
  json += ",\"temperatureOn\":";  json += String(temperatureOn, 1);
  json += ",\"temperatureOff\":"; json += String(temperatureOff, 1);
  json += ",\"humidityOn\":";     json += String(humidityOn, 1);
  json += ",\"humidityOff\":";    json += String(humidityOff, 1);
  json += ",\"humidityMax\":";    json += String(HUMIDITY_MAX, 1);
  json += ",\"ssid\":\"";         json += AP_SSID;
  json += "\",\"ip\":\"";         json += WiFi.softAPIP().toString();
  json += "\",\"clients\":";      json += String(WiFi.softAPgetStationNum());
  json += ",\"uptime\":";         json += String(now / 1000);
  json += "}";

  sendNoCacheHeaders();
  server.send(200, "application/json", json);
}

void handleMode() {

  if (!server.hasArg("value")) {
    server.send(400, "text/plain", "Missing value");
    return;
  }

  String mode = server.arg("value");

  if (mode == "auto") {
    autoMode = true;
    Serial.println("MODE: AUTO");
  }
  else if (mode == "manual") {
    autoMode = false;
    Serial.println("MODE: MANUAL");
  }
  else {
    server.send(400, "text/plain", "Unknown mode");
    return;
  }

  saveMode();

  // Apply AUTO immediately instead of waiting for the next sensor read
  automaticControl();

  server.send(200, "text/plain", "OK");
}

void handleAtomizer() {

  if (!server.hasArg("state")) {
    server.send(400, "text/plain", "Missing state");
    return;
  }

  String state = server.arg("state");

  if (state != "on" && state != "off") {
    server.send(400, "text/plain", "Unknown state");
    return;
  }

  // Manual buttons would be overridden by AUTO a moment later,
  // so using them switches to MANUAL mode.
  if (autoMode) {
    autoMode = false;
    saveMode();
    Serial.println("MODE: MANUAL (manual button used)");
  }

  if (state == "off") {
    stopAtomizer();
    server.send(200, "text/plain", "Atomizer OFF (manual mode)");
    return;
  }

  if (atomizerResting) {
    server.send(409, "text/plain", "Atomizer is resting after its maximum run time - try again shortly");
    return;
  }

  if (sensorValid && humidity >= HUMIDITY_MAX) {
    server.send(409, "text/plain", "Humidity is already 95% or higher - atomizer blocked");
    return;
  }

  startAtomizer();
  server.send(200, "text/plain", "Atomizer ON (stops automatically after 30 s)");
}

void handleGetSettings() {

  String json;
  json.reserve(150);

  json += "{\"temperatureOn\":";  json += String(temperatureOn, 1);
  json += ",\"temperatureOff\":"; json += String(temperatureOff, 1);
  json += ",\"humidityOn\":";     json += String(humidityOn, 1);
  json += ",\"humidityOff\":";    json += String(humidityOff, 1);
  json += "}";

  sendNoCacheHeaders();
  server.send(200, "application/json", json);
}

// Parses a form field; NaN when missing or not a number
float argToFloat(const char* name) {

  if (!server.hasArg(name))
    return NAN;

  String s = server.arg(name);
  s.trim();

  if (s.length() == 0)
    return NAN;

  // toFloat() returns 0 for text, so check it really is a number
  char* end = nullptr;
  float v = strtof(s.c_str(), &end);

  if (end == s.c_str() || *end != '\0')
    return NAN;

  return v;
}

void handleSaveSettings() {

  float tOn  = argToFloat("temperatureOn");
  float tOff = argToFloat("temperatureOff");
  float hOn  = argToFloat("humidityOn");
  float hOff = argToFloat("humidityOff");

  const char* error = validateSettings(tOn, tOff, hOn, hOff);

  if (error != nullptr) {
    server.send(400, "text/plain", error);
    return;
  }

  temperatureOn  = tOn;
  temperatureOff = tOff;
  humidityOn     = hOn;
  humidityOff    = hOff;

  saveThresholds();

  Serial.println("ENVIRONMENT SETTINGS SAVED");

  server.send(200, "text/plain", "OK");
}

// Captive portal: any unknown URL (phone connectivity checks
// like /generate_204 or /hotspot-detect.html) -> dashboard
void handleNotFound() {

  server.sendHeader("Location", "http://" + WiFi.softAPIP().toString() + "/", true);
  server.send(302, "text/plain", "");
}

// ============================================================
// ACCESS POINT
// ============================================================

void startAccessPoint() {

  WiFi.mode(WIFI_AP);

  WiFi.softAPConfig(AP_IP, AP_GATEWAY, AP_SUBNET);

  bool ok = WiFi.softAP(
    AP_SSID,
    AP_PASSWORD,
    AP_CHANNEL,
    0,               // 0 = visible SSID
    AP_MAX_CLIENTS
  );

  WiFi.setSleep(false);   // faster web responses

  Serial.println();

  if (ok) {
    Serial.println("ACCESS POINT STARTED");
    Serial.print("SSID     : ");
    Serial.println(AP_SSID);
    Serial.print("Password : ");
    Serial.println(AP_PASSWORD);
    Serial.print("IP       : ");
    Serial.println(WiFi.softAPIP());
  }
  else {
    Serial.println("ACCESS POINT FAILED");
  }

  // Answer every DNS query with our IP (captive portal)
  dnsServer.setErrorReplyCode(DNSReplyCode::NoError);
  dnsServer.start(DNS_PORT, "*", WiFi.softAPIP());
}

// ============================================================
// SETUP
// ============================================================

void setup() {

  // Atomizer OFF as early as possible
  pinMode(ATOMIZER_PIN, OUTPUT);
  digitalWrite(ATOMIZER_PIN, LOW);

  Serial.begin(115200);
  delay(1500);

  Serial.println();
  Serial.println("======================================");
  Serial.println("             LEAFYGUARD");
  Serial.println("   Smart Leafy Vegetable Storage");
  Serial.println("======================================");

  // NVS
  preferences.begin("leafyguard", false);
  loadSettings();

  // I2C
  Wire.begin(I2C_SDA, I2C_SCL);
  Serial.println("I2C: SDA = D4, SCL = D5");

  // OLED
  Serial.println("Starting SH1106...");

  oled.setI2CAddress(OLED_ADDRESS << 1);   // U8g2 uses 8-bit address
  oled.begin();

  oled.clearBuffer();
  oled.setFont(u8g2_font_10x20_tf);
  oled.drawStr(0, 23, "LEAFYGUARD");
  oled.setFont(u8g2_font_6x10_tf);
  oled.drawStr(0, 43, "Starting...");
  oled.sendBuffer();

  // BME280
  Serial.println("Starting BME280...");

  // Same as the original sketch
  if (bme.begin(BME_ADDRESS)) {

    bmeOK = true;
    Serial.println("BME280 FOUND at 0x76");
  }
  else {

    bmeOK = false;
    Serial.println("BME280 NOT FOUND");

    // Help find the problem: list every device on the I2C bus
    Serial.println("I2C scan:");
    for (byte addr = 1; addr < 127; addr++) {
      Wire.beginTransmission(addr);
      if (Wire.endTransmission() == 0) {
        Serial.print("  device at 0x");
        Serial.println(addr, HEX);
      }
    }
    Serial.print("Sensor ID at 0x76: 0x");
    Serial.println(bme.sensorID(), HEX);
    Serial.println("  0x60 = BME280, 0x58 = BMP280 (no humidity)");
  }

  // Access point + captive DNS
  startAccessPoint();

  // Web routes
  server.on("/",             HTTP_GET,  handleRoot);
  server.on("/api/data",     HTTP_GET,  handleData);
  server.on("/api/mode",     HTTP_POST, handleMode);
  server.on("/api/atomizer", HTTP_POST, handleAtomizer);
  server.on("/api/settings", HTTP_GET,  handleGetSettings);
  server.on("/api/settings", HTTP_POST, handleSaveSettings);
  server.onNotFound(handleNotFound);

  server.begin();

  Serial.print("Dashboard: http://");
  Serial.println(WiFi.softAPIP());

  // First reading straight away
  readSensor();
  automaticControl();

  bootTime = millis();
  lastSensorRead = bootTime;
  lastOLEDChange = bootTime;

  oledStartup();
}

// ============================================================
// LOOP
// ============================================================

void loop() {

  dnsServer.processNextRequest();
  server.handleClient();

  // Safety checks run every loop, not only every 2 s
  atomizerSafety();

  unsigned long now = millis();

  // SENSOR
  if (now - lastSensorRead >= SENSOR_INTERVAL) {

    lastSensorRead = now;

    readSensor();
    automaticControl();

    if (sensorValid) {
      Serial.print("Temperature: ");
      Serial.print(temperature, 1);
      Serial.print(" C | Humidity: ");
      Serial.print(humidity, 1);
      Serial.print(" %");
    }
    else {
      Serial.print("Sensor: ERROR");
    }

    Serial.print(" | Atomizer: ");
    Serial.print(atomizerState ? "ON" : (atomizerResting ? "RESTING" : "OFF"));
    Serial.print(" | Mode: ");
    Serial.print(autoMode ? "AUTO" : "MANUAL");
    Serial.print(" | Clients: ");
    Serial.println(WiFi.softAPgetStationNum());
  }

  // OLED
  if (now - lastOLEDChange >= OLED_INTERVAL) {

    lastOLEDChange = now;

    // Don't advance during the initial Wi-Fi info screen
    if (now - bootTime >= IP_DISPLAY_TIME) {
      oledScreen = (oledScreen + 1) % SCREEN_COUNT;
    }

    updateOLED();
  }
}
