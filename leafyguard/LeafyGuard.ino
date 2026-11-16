/*
  ============================================================
                         LEAFYGUARD
              Smart Leafy Vegetable Storage
  ============================================================

  BOARD:
    Seeed Studio XIAO ESP32-C6

  SENSOR:
    BME280
    I2C address: 0x76

  OLED:
    1.3 inch SH1106 128x64
    I2C address: 0x3C

    SDA = D4
    SCL = D5

  ATOMIZER:
    5V atomizer
    2N7000 MOSFET gate = D2

  NETWORK:
    ACCESS POINT MODE
    WiFi name : LeafyGuard
    Password  : leafyguard123
    Dashboard : http://192.168.4.1

  FEATURES:
    - Temperature
    - Humidity
    - Automatic atomizer
    - Manual atomizer
    - Hysteresis
    - Safety timeout
    - OLED
    - QR code
    - IP screen
    - Web dashboard
    - NVS settings
    - Leaf favicon
    - Mobile responsive UI

  OLED:
    IP for 10 seconds
    Then screens change every 5 seconds

  NOTE:
    XIAO ESP32-C6 does NOT require the special
    8.5 dBm setting used with your ESP32-C3 Mini.
*/

// ============================================================
// LIBRARIES
// ============================================================

#include <WiFi.h>
#include <WebServer.h>
#include <Wire.h>
#include <Preferences.h>

#include <Adafruit_BME280.h>
#include <Adafruit_Sensor.h>

#include <U8g2lib.h>

#include <qrcode.h>
// ESP32 Arduino core QR API (Espressif), not ricmoo/QRCode.

// ============================================================
// ACCESS POINT
// ============================================================

const char* AP_SSID = "LeafyGuard";
const char* AP_PASSWORD = "leafyguard123";   // at least 8 characters

// ============================================================
// PINS
// ============================================================

#define I2C_SDA D4
#define I2C_SCL D5

#define ATOMIZER_PIN D2

// ============================================================
// I2C ADDRESSES
// ============================================================

#define BME_ADDRESS 0x76
#define OLED_ADDRESS 0x3C

// ============================================================
// BME280
// ============================================================

Adafruit_BME280 bme;

bool bmeOK = false;

// ============================================================
// OLED
// ============================================================

U8G2_SH1106_128X64_NONAME_F_HW_I2C oled(
  U8G2_R0,
  U8X8_PIN_NONE
);

// ============================================================
// WEB SERVER
// ============================================================

WebServer server(80);

// ============================================================
// NVS
// ============================================================

Preferences preferences;

// ============================================================
// SENSOR DATA
// ============================================================

float temperature = 0.0;
float humidity = 0.0;

// ============================================================
// DEFAULT ENVIRONMENT SETTINGS
// ============================================================

float temperatureOn  = 30.0;
float temperatureOff = 28.0;

float humidityOn  = 70.0;
float humidityOff = 75.0;

// ============================================================
// OPERATING STATE
// ============================================================

bool autoMode = true;
bool atomizerState = false;

// ============================================================
// TIMERS
// ============================================================

unsigned long lastSensorRead = 0;
unsigned long lastOLEDChange = 0;
unsigned long atomizerStartTime = 0;
unsigned long bootTime = 0;

const unsigned long SENSOR_INTERVAL = 2000;
const unsigned long OLED_INTERVAL = 5000;

const unsigned long IP_DISPLAY_TIME = 10000;

// Maximum continuous atomizer runtime
const unsigned long MAX_ATOMIZER_TIME = 30000;

// ============================================================
// OLED SCREEN
// ============================================================

int oledScreen = 0;

/*
  0 = Temperature
  1 = Humidity
  2 = Atomizer
  3 = QR
*/

// ============================================================
// HTML
// ============================================================

const char MAIN_PAGE[] PROGMEM = R"rawliteral(

<!DOCTYPE html>
<html lang="en">

<head>

<meta charset="UTF-8">

<meta
name="viewport"
content="width=device-width,initial-scale=1,viewport-fit=cover">

<meta
name="theme-color"
content="#08120d">

<title>LeafyGuard</title>

<!-- =====================================================
     LEAFYGUARD FAVICON
====================================================== -->

<link
rel="icon"
type="image/svg+xml"
href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='18' fill='%23b8f36b'/%3E%3Cpath d='M48 14C29 16 16 27 16 43c0 4 1 7 2 9 2-10 8-17 17-21-5 5-9 11-11 19 15-3 25-14 24-36Z' fill='%2308120d'/%3E%3Cpath d='M19 48c8-11 15-18 27-26' fill='none' stroke='%23b8f36b' stroke-width='3' stroke-linecap='round'/%3E%3C/svg%3E">

<style>

/* ======================================================
   BASE
====================================================== */

*{
  box-sizing:border-box;
}

html{
  scroll-behavior:smooth;
}

body{

  margin:0;

  background:
    radial-gradient(
      circle at 15% 0%,
      rgba(184,243,107,.07),
      transparent 28%
    ),
    #07100c;

  color:#f2f7f3;

  font-family:
    Inter,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;

  min-height:100vh;
}

/* ======================================================
   HEADER
====================================================== */

.header{

  position:sticky;

  top:0;

  z-index:20;

  background:
    rgba(7,16,12,.92);

  backdrop-filter:blur(14px);

  border-bottom:
    1px solid #1d3528;
}

.headerInner{

  max-width:1180px;

  margin:auto;

  padding:
    15px 18px;

  display:flex;

  align-items:center;

  justify-content:space-between;

  gap:15px;
}

.brand{

  display:flex;

  align-items:center;

  gap:12px;
}

.logo{

  width:46px;

  height:46px;

  border-radius:14px;

  background:#b8f36b;

  display:flex;

  align-items:center;

  justify-content:center;

  box-shadow:
    0 8px 30px
    rgba(184,243,107,.15);
}

.logo svg{

  width:29px;

  height:29px;
}

.brandName{

  font-size:19px;

  font-weight:750;

  letter-spacing:-.4px;
}

.brandSub{

  margin-top:3px;

  font-size:11px;

  color:#81998b;
}

.connection{

  display:flex;

  align-items:center;

  gap:7px;

  padding:
    8px 11px;

  border:
    1px solid #264635;

  border-radius:999px;

  background:#0b1a12;

  color:#9cb4a5;

  font-size:11px;
}

.dot{

  width:7px;

  height:7px;

  border-radius:50%;

  background:#b8f36b;

  box-shadow:
    0 0 10px
    rgba(184,243,107,.7);
}

/* ======================================================
   NAV
====================================================== */

.nav{

  max-width:1180px;

  margin:auto;

  padding:
    12px 18px;

  display:flex;

  gap:8px;

  overflow-x:auto;

  scrollbar-width:none;
}

.nav::-webkit-scrollbar{
  display:none;
}

.nav button{

  flex:
    0 0 auto;

  border:
    1px solid #203b2c;

  background:#0a1811;

  color:#92aa9b;

  padding:
    10px 15px;

  border-radius:11px;

  font-size:12px;

  font-weight:600;

  cursor:pointer;

  transition:
    .2s ease;
}

.nav button:hover{

  border-color:#42654f;

  color:#d7e8dd;
}

.nav button.active{

  background:#b8f36b;

  border-color:#b8f36b;

  color:#08120d;
}

/* ======================================================
   MAIN
====================================================== */

main{

  max-width:1180px;

  margin:auto;

  padding:
    18px;
}

.tab{

  display:none;

  animation:
    fadeIn .22s ease;
}

.tab.active{

  display:block;
}

@keyframes fadeIn{

  from{
    opacity:0;
    transform:translateY(4px);
  }

  to{
    opacity:1;
    transform:translateY(0);
  }

}

/* ======================================================
   HERO
====================================================== */

.hero{

  position:relative;

  overflow:hidden;

  border:
    1px solid #294937;

  border-radius:24px;

  padding:25px;

  margin-bottom:15px;

  background:
    linear-gradient(
      135deg,
      #0d2117,
      #09150f
    );
}

.hero:after{

  content:"";

  position:absolute;

  width:190px;

  height:190px;

  right:-75px;

  top:-90px;

  border-radius:50%;

  background:
    rgba(184,243,107,.08);
}

.eyebrow{

  color:#829b8c;

  font-size:11px;

  letter-spacing:
    1.4px;

  text-transform:
    uppercase;
}

.heroState{

  font-size:32px;

  font-weight:800;

  letter-spacing:-1px;

  margin-top:7px;
}

.heroInfo{

  margin-top:7px;

  color:#91a99b;

  font-size:13px;
}

/* ======================================================
   GRID
====================================================== */

.grid{

  display:grid;

  grid-template-columns:
    repeat(
      auto-fit,
      minmax(220px,1fr)
    );

  gap:14px;
}

.card{

  background:#0a1912;

  border:
    1px solid #203d2d;

  border-radius:20px;

  padding:20px;

  box-shadow:
    0 10px 35px
    rgba(0,0,0,.12);
}

.cardTitle{

  color:#819a8b;

  font-size:11px;

  text-transform:
    uppercase;

  letter-spacing:
    1px;

  margin-bottom:13px;
}

.metric{

  font-size:43px;

  font-weight:800;

  letter-spacing:-2px;

  line-height:1;
}

.metric span{

  font-size:15px;

  color:#81998b;

  letter-spacing:0;

  font-weight:500;

  margin-left:4px;
}

.metricFoot{

  margin-top:13px;

  color:#748d7e;

  font-size:12px;
}

/* ======================================================
   STATUS
====================================================== */

.status{

  display:inline-flex;

  align-items:center;

  gap:7px;

  padding:
    7px 10px;

  margin-top:14px;

  border-radius:999px;

  font-size:11px;

  font-weight:700;
}

.status.good{

  color:#b8f36b;

  background:#132c1d;
}

.status.warn{

  color:#ffd66b;

  background:#302811;
}

.status.bad{

  color:#ff8585;

  background:#35191b;
}

/* ======================================================
   BUTTONS
====================================================== */

button{

  font-family:inherit;
}

.action{

  width:100%;

  border:0;

  border-radius:13px;

  padding:14px;

  margin-top:10px;

  background:#b8f36b;

  color:#07100c;

  font-size:13px;

  font-weight:750;

  cursor:pointer;

  transition:
    transform .15s ease,
    opacity .15s ease;
}

.action:hover{

  opacity:.9;

  transform:translateY(-1px);
}

.action.dark{

  background:#14281d;

  color:#e8f3ec;

  border:
    1px solid #31523e;
}

.action.red{

  background:#e96f6f;

  color:#160707;
}

/* ======================================================
   TOGGLE
====================================================== */

.segment{

  display:grid;

  grid-template-columns:1fr 1fr;

  gap:6px;

  background:#07110c;

  border:
    1px solid #1e392a;

  border-radius:14px;

  padding:5px;
}

.segment button{

  border:0;

  border-radius:10px;

  padding:12px;

  background:transparent;

  color:#829b8c;

  cursor:pointer;

  font-weight:700;
}

.segment button.active{

  background:#b8f36b;

  color:#07100c;
}

/* ======================================================
   INPUTS
====================================================== */

label{

  display:block;

  color:#8ca597;

  font-size:12px;

  margin:
    16px 0 7px;
}

input{

  width:100%;

  border:
    1px solid #2a4937;

  background:#07110c;

  color:#f2f7f3;

  border-radius:12px;

  padding:13px;

  outline:none;

  font-size:14px;
}

input:focus{

  border-color:#b8f36b;

  box-shadow:
    0 0 0 3px
    rgba(184,243,107,.08);
}

/* ======================================================
   INFORMATION
====================================================== */

.info{

  color:#829b8c;

  font-size:12px;

  line-height:1.7;
}

.row{

  display:flex;

  justify-content:space-between;

  gap:15px;

  padding:
    12px 0;

  border-bottom:
    1px solid #183326;

  font-size:12px;
}

.row:last-child{
  border-bottom:0;
}

.row span{
  color:#789181;
}

.row strong{
  color:#dce9e0;
}

/* ======================================================
   SECTION HEADER
====================================================== */

.sectionHead{

  margin:
    8px 0 15px;
}

.sectionHead h2{

  margin:0;

  font-size:20px;

  letter-spacing:-.5px;
}

.sectionHead p{

  margin:
    6px 0 0;

  color:#7e9788;

  font-size:12px;
}

/* ======================================================
   FOOTER
====================================================== */

footer{

  max-width:1180px;

  margin:auto;

  padding:
    25px 18px 40px;

  text-align:center;

  color:#536b5c;

  font-size:10px;
}

/* ======================================================
   MOBILE
====================================================== */

@media(max-width:600px){

  main{
    padding:13px;
  }

  .headerInner{
    padding:
      13px;
  }

  .brandName{
    font-size:17px;
  }

  .connection{
    font-size:0;
    padding:9px;
  }

  .hero{
    padding:20px;
    border-radius:20px;
  }

  .heroState{
    font-size:28px;
  }

  .metric{
    font-size:40px;
  }

  .card{
    padding:17px;
  }

}

</style>

</head>

<body>

<!-- ======================================================
     HEADER
====================================================== -->

<header class="header">

<div class="headerInner">

<div class="brand">

<div class="logo">

<svg
viewBox="0 0 64 64"
fill="none"
xmlns="http://www.w3.org/2000/svg">

<path
d="M48 14C29 16 16 27 16 43C16 47 17 50 18 52C20 42 26 34 35 30C30 35 24 42 23 51C38 48 48 37 48 14Z"
fill="#08120D"/>

<path
d="M19 48C27 37 35 29 46 21"
stroke="#B8F36B"
stroke-width="4"
stroke-linecap="round"/>

</svg>

</div>

<div>

<div class="brandName">
LeafyGuard
</div>

<div class="brandSub">
Smart leafy-vegetable storage
</div>

</div>

</div>

<div class="connection">

<div class="dot"></div>

<span>
ESP32-C6 ONLINE
</span>

</div>

</div>

</header>

<!-- ======================================================
     NAVIGATION
====================================================== -->

<nav class="nav">

<button
class="active"
onclick="openTab('overview',this)">
Overview
</button>

<button
onclick="openTab('control',this)">
Control
</button>

<button
onclick="openTab('environment',this)">
Environment
</button>

<button
onclick="openTab('system',this)">
System
</button>

</nav>

<!-- ======================================================
     MAIN
====================================================== -->

<main>

<!-- ======================================================
     OVERVIEW
====================================================== -->

<section
id="overview"
class="tab active">

<div class="hero">

<div class="eyebrow">
Storage condition
</div>

<div
id="heroState"
class="heroState">
Checking environment...
</div>

<div
id="heroInfo"
class="heroInfo">
Reading BME280 sensor
</div>

</div>

<div class="grid">

<div class="card">

<div class="cardTitle">
Temperature
</div>

<div class="metric">

<span id="temperature">
--
</span>

<span>
°C
</span>

</div>

<div
id="tempStatus"
class="status good">

● NORMAL

</div>

<div class="metricFoot">
Target is controlled from Environment
</div>

</div>

<div class="card">

<div class="cardTitle">
Humidity
</div>

<div class="metric">

<span id="humidity">
--
</span>

<span>
%
</span>

</div>

<div
id="humidityStatus"
class="status good">

● NORMAL

</div>

<div class="metricFoot">
Humidity protection
</div>

</div>

<div class="card">

<div class="cardTitle">
Atomizer
</div>

<div
id="atomizerValue"
class="metric">

OFF

</div>

<div
id="atomizerStatus"
class="status good">

● READY

</div>

<div
id="modeText"
class="metricFoot">

AUTO MODE

</div>

</div>

</div>

</section>

<!-- ======================================================
     CONTROL
====================================================== -->

<section
id="control"
class="tab">

<div class="sectionHead">

<h2>
Atomizer control
</h2>

<p>
Control the storage humidification system.
</p>

</div>

<div class="grid">

<div class="card">

<div class="cardTitle">
Operating mode
</div>

<div class="segment">

<button
id="autoBtn"
class="active"
onclick="setMode('auto')">

AUTO

</button>

<button
id="manualBtn"
onclick="setMode('manual')">

MANUAL

</button>

</div>

<p class="info">

AUTO mode automatically controls the
atomizer from the environmental thresholds.

MANUAL mode gives direct control.

</p>

</div>

<div class="card">

<div class="cardTitle">
Manual control
</div>

<button
class="action"
onclick="setAtomizer('on')">

TURN ATOMIZER ON

</button>

<button
class="action red"
onclick="setAtomizer('off')">

TURN ATOMIZER OFF

</button>

<p class="info">

The ESP32-C6 drives the 2N7000 gate.
The atomizer itself must use its own
5V supply.

</p>

</div>

</div>

</section>

<!-- ======================================================
     ENVIRONMENT
====================================================== -->

<section
id="environment"
class="tab">

<div class="sectionHead">

<h2>
Environment
</h2>

<p>
Configure the conditions at which LeafyGuard
activates the atomizer.
</p>

</div>

<div class="card">

<label>
Temperature ON threshold (°C)
</label>

<input
id="temperatureOn"
type="number"
step="0.1">

<label>
Temperature OFF threshold (°C)
</label>

<input
id="temperatureOff"
type="number"
step="0.1">

<label>
Humidity ON threshold (%)
</label>

<input
id="humidityOn"
type="number"
step="0.1">

<label>
Humidity OFF threshold (%)
</label>

<input
id="humidityOff"
type="number"
step="0.1">

<button
class="action"
onclick="saveSettings()">

SAVE ENVIRONMENT SETTINGS

</button>

<p class="info">

Hysteresis is used so that the atomizer does
not rapidly switch ON and OFF around a
single threshold.

</p>

</div>

</section>

<!-- ======================================================
     SYSTEM
====================================================== -->

<section
id="system"
class="tab">

<div class="sectionHead">

<h2>
System
</h2>

<p>
LeafyGuard controller information.
</p>

</div>

<div class="grid">

<div class="card">

<div class="cardTitle">
Controller
</div>

<div class="row">
<span>Board</span>
<strong>XIAO ESP32-C6</strong>
</div>

<div class="row">
<span>Firmware</span>
<strong>LeafyGuard</strong>
</div>

<div class="row">
<span>Sensor</span>
<strong>BME280</strong>
</div>

</div>

<div class="card">

<div class="cardTitle">
Display</div>

<div class="row">
<span>Display</span>
<strong>SH1106 128x64</strong>
</div>

<div class="row">
<span>I2C</span>
<strong>D4 / D5</strong>
</div>

<div class="row">
<span>OLED address</span>
<strong>0x3C</strong>
</div>

</div>

<div class="card">

<div class="cardTitle">
Network</div>

<div class="row">
<span>IP address</span>
<strong id="ipAddress">--</strong>
</div>

<div class="row">
<span>WiFi</span>
<strong>Access Point</strong>
</div>

</div>

</div>

</section>

</main>

<footer>

LeafyGuard
<br>
Smart environmental protection for leafy vegetables

</footer>

<script>

/* ======================================================
   TAB SYSTEM
====================================================== */

function openTab(id,button){

document
.querySelectorAll('.tab')
.forEach(function(tab){

tab.classList.remove('active');

});

document
.getElementById(id)
.classList.add('active');

document
.querySelectorAll('.nav button')
.forEach(function(btn){

btn.classList.remove('active');

});

button.classList.add('active');

}

/* ======================================================
   DATA
====================================================== */

async function updateData(){

try{

const response =
await fetch(
'/api/data',
{
cache:'no-store'
}
);

const d =
await response.json();

document
.getElementById('temperature')
.textContent =
Number(d.temperature).toFixed(1);

document
.getElementById('humidity')
.textContent =
Number(d.humidity).toFixed(1);

document
.getElementById('ipAddress')
.textContent =
d.ip;

document
.getElementById('atomizerValue')
.textContent =
d.atomizer ?
'ON' :
'OFF';

document
.getElementById('modeText')
.textContent =
d.auto ?
'AUTO MODE' :
'MANUAL MODE';

/* ====================================================
   ATOMIZER STATUS
==================================================== */

const aStatus =
document.getElementById(
'atomizerStatus'
);

if(d.atomizer){

aStatus.textContent =
'● ACTIVE';

aStatus.className =
'status warn';

}else{

aStatus.textContent =
'● READY';

aStatus.className =
'status good';

}

/* ====================================================
   TEMPERATURE
==================================================== */

const ts =
document.getElementById(
'tempStatus'
);

if(
d.temperature >=
d.temperatureOn
){

ts.textContent =
'● HIGH';

ts.className =
'status bad';

}else{

ts.textContent =
'● NORMAL';

ts.className =
'status good';

}

/* ====================================================
   HUMIDITY
==================================================== */

const hs =
document.getElementById(
'humidityStatus'
);

if(
d.humidity <=
d.humidityOn
){

hs.textContent =
'● LOW';

hs.className =
'status warn';

}else{

hs.textContent =
'● NORMAL';

hs.className =
'status good';

}

/* ====================================================
   HERO
==================================================== */

const hero =
document.getElementById(
'heroState'
);

const info =
document.getElementById(
'heroInfo'
);

if(d.atomizer){

hero.textContent =
'Moisture protection active';

info.textContent =
'Atomizer is currently running';

}else{

hero.textContent =
'Storage environment monitored';

info.textContent =
'Automatic environmental protection is ready';

}

/* ====================================================
   MODE BUTTONS
==================================================== */

if(d.auto){

document
.getElementById('autoBtn')
.classList.add('active');

document
.getElementById('manualBtn')
.classList.remove('active');

}else{

document
.getElementById('autoBtn')
.classList.remove('active');

document
.getElementById('manualBtn')
.classList.add('active');

}

}
catch(error){

console.log(
'Data update error:',
error
);

}

}

/* ======================================================
   LOAD SETTINGS
====================================================== */

async function loadSettings(){

try{

const response =
await fetch(
'/api/settings',
{
cache:'no-store'
}
);

const d =
await response.json();

document
.getElementById('temperatureOn')
.value =
d.temperatureOn;

document
.getElementById('temperatureOff')
.value =
d.temperatureOff;

document
.getElementById('humidityOn')
.value =
d.humidityOn;

document
.getElementById('humidityOff')
.value =
d.humidityOff;

}
catch(error){

console.log(error);

}

}

/* ======================================================
   SAVE SETTINGS
====================================================== */

async function saveSettings(){

const params =
new URLSearchParams();

params.append(
'temperatureOn',
document
.getElementById('temperatureOn')
.value
);

params.append(
'temperatureOff',
document
.getElementById('temperatureOff')
.value
);

params.append(
'humidityOn',
document
.getElementById('humidityOn')
.value
);

params.append(
'humidityOff',
document
.getElementById('humidityOff')
.value
);

await fetch(
'/api/settings?' +
params.toString(),
{ method:'POST' }
);

alert(
'Environment settings saved'
);

updateData();

}

/* ======================================================
   MODE
====================================================== */

async function setMode(mode){

await fetch(
'/api/mode?value=' +
mode
);

updateData();

}

/* ======================================================
   ATOMIZER
====================================================== */

async function setAtomizer(state){

await fetch(
'/api/atomizer?state=' +
state
);

updateData();

}

/* ======================================================
   START
====================================================== */

updateData();

loadSettings();

setInterval(
updateData,
2000
);

</script>

</body>

</html>

)rawliteral";

// ============================================================
// LOAD SETTINGS
// ============================================================

void loadSettings() {

  temperatureOn =
    preferences.getFloat(
      "tempOn",
      30.0
    );

  temperatureOff =
    preferences.getFloat(
      "tempOff",
      28.0
    );

  humidityOn =
    preferences.getFloat(
      "humOn",
      70.0
    );

  humidityOff =
    preferences.getFloat(
      "humOff",
      75.0
    );

  autoMode =
    preferences.getBool(
      "auto",
      true
    );

}

// ============================================================
// SAVE SETTINGS
// ============================================================

void saveSettings() {

  preferences.putFloat(
    "tempOn",
    temperatureOn
  );

  preferences.putFloat(
    "tempOff",
    temperatureOff
  );

  preferences.putFloat(
    "humOn",
    humidityOn
  );

  preferences.putFloat(
    "humOff",
    humidityOff
  );

  preferences.putBool(
    "auto",
    autoMode
  );

}

// ============================================================
// ATOMIZER ON
// ============================================================

void startAtomizer() {

  if (!atomizerState) {

    digitalWrite(
      ATOMIZER_PIN,
      HIGH
    );

    atomizerState = true;

    atomizerStartTime =
      millis();

    Serial.println(
      "ATOMIZER: ON"
    );

  }

}

// ============================================================
// ATOMIZER OFF
// ============================================================

void stopAtomizer() {

  if (atomizerState) {

    digitalWrite(
      ATOMIZER_PIN,
      LOW
    );

    atomizerState = false;

    Serial.println(
      "ATOMIZER: OFF"
    );

  }

}

// ============================================================
// SENSOR
// ============================================================

void readSensor() {

  if (!bmeOK)
    return;

  temperature =
    bme.readTemperature();

  humidity =
    bme.readHumidity();

}

// ============================================================
// AUTOMATIC CONTROL
// ============================================================

void automaticControl() {

  if (!autoMode)
    return;

  /*
    START:

    Temperature too high
       OR
    Humidity too low
  */

  if (!atomizerState) {

    if (
      temperature >= temperatureOn ||
      humidity <= humidityOn
    ) {

      startAtomizer();

    }

  }

  /*
    STOP:

    Temperature returned low enough
       AND
    Humidity returned high enough
  */

  else {

    if (
      temperature <= temperatureOff &&
      humidity >= humidityOff
    ) {

      stopAtomizer();

    }

  }

  /*
    SAFETY TIMEOUT
  */

  if (
    atomizerState &&
    millis() -
    atomizerStartTime >=
    MAX_ATOMIZER_TIME
  ) {

    Serial.println(
      "ATOMIZER SAFETY TIMEOUT"
    );

    stopAtomizer();

  }

}

// ============================================================
// OLED - TEMPERATURE
// ============================================================

void oledTemperature() {

  oled.clearBuffer();

  oled.setFont(
    u8g2_font_6x10_tf
  );

  oled.drawStr(
    0,
    10,
    "LEAFYGUARD"
  );

  oled.drawLine(
    0,
    12,
    127,
    12
  );

  oled.setFont(
    u8g2_font_6x10_tf
  );

  oled.drawStr(
    0,
    27,
    "TEMPERATURE"
  );

  oled.setFont(
    u8g2_font_10x20_tf
  );

  oled.setCursor(
    0,
    53
  );

  oled.print(
    temperature,
    1
  );

  oled.print(
    " C"
  );

  oled.sendBuffer();

}

// ============================================================
// OLED - HUMIDITY
// ============================================================

void oledHumidity() {

  oled.clearBuffer();

  oled.setFont(
    u8g2_font_6x10_tf
  );

  oled.drawStr(
    0,
    10,
    "LEAFYGUARD"
  );

  oled.drawLine(
    0,
    12,
    127,
    12
  );

  oled.drawStr(
    0,
    27,
    "HUMIDITY"
  );

  oled.setFont(
    u8g2_font_10x20_tf
  );

  oled.setCursor(
    0,
    53
  );

  oled.print(
    humidity,
    1
  );

  oled.print(
    " %"
  );

  oled.sendBuffer();

}

// ============================================================
// OLED - ATOMIZER
// ============================================================

void oledAtomizer() {

  oled.clearBuffer();

  oled.setFont(
    u8g2_font_6x10_tf
  );

  oled.drawStr(
    0,
    10,
    "ATOMIZER"
  );

  oled.drawLine(
    0,
    12,
    127,
    12
  );

  oled.setFont(
    u8g2_font_10x20_tf
  );

  if (atomizerState) {

    oled.drawStr(
      0,
      38,
      "ON"
    );

  }
  else {

    oled.drawStr(
      0,
      38,
      "OFF"
    );

  }

  oled.setFont(
    u8g2_font_6x10_tf
  );

  oled.setCursor(
    0,
    55
  );

  if (autoMode) {

    oled.print(
      "MODE: AUTO"
    );

  }
  else {

    oled.print(
      "MODE: MANUAL"
    );

  }

  oled.sendBuffer();

}

// ============================================================
// QR CODE
// ============================================================

// ESP32/ESP-IDF QR callback used by Arduino-ESP32 core.
// This replaces the ricmoo/QRCode API that caused the compile errors.
void oledQRDisplay(esp_qrcode_handle_t qrcode) {

  if (qrcode == nullptr) {
    return;
  }

  const int qrModules = esp_qrcode_get_size(qrcode);
  if (qrModules <= 0) {
    return;
  }

  oled.clearBuffer();

  const int border = 2;
  const int available = 128 - (border * 2);
  int scale = available / qrModules;
  if (scale < 1) scale = 1;
  if (scale > 2) scale = 2;

  const int qrPixels = qrModules * scale;
  const int offsetX = (128 - qrPixels) / 2;
  const int offsetY = (64 - qrPixels) / 2;

  for (int y = 0; y < qrModules; y++) {
    for (int x = 0; x < qrModules; x++) {
      if (esp_qrcode_get_module(qrcode, x, y)) {
        oled.drawBox(
          offsetX + x * scale,
          offsetY + y * scale,
          scale,
          scale
        );
      }
    }
  }

  oled.sendBuffer();
}

void oledQR() {

  String url =
    "http://" +
    WiFi.softAPIP().toString();

  // Arduino-ESP32 3.3.x provides Espressif's QR API through qrcode.h.
  esp_qrcode_config_t cfg = ESP_QRCODE_CONFIG_DEFAULT();
  cfg.display_func = oledQRDisplay;

  esp_err_t err =
    esp_qrcode_generate(
      &cfg,
      url.c_str()
    );

  if (err != ESP_OK) {
    Serial.print("QR generation failed: ");
    Serial.println((int)err);

    oled.clearBuffer();
    oled.setFont(u8g2_font_6x10_tf);
    oled.drawStr(0, 18, "QR ERROR");
    oled.drawStr(0, 35, "Open dashboard at:");
    oled.setFont(u8g2_font_5x8_tf);
    oled.drawStr(
      0,
      50,
      WiFi.softAPIP().toString().c_str()
    );
    oled.sendBuffer();
  }
}

// ============================================================
// OLED STARTUP IP
// ============================================================

void oledStartup() {

  oled.clearBuffer();

  oled.setFont(
    u8g2_font_6x10_tf
  );

  oled.drawStr(
    0,
    11,
    "LEAFYGUARD"
  );

  oled.drawStr(
    0,
    29,
    "DASHBOARD IP"
  );

  oled.setFont(
    u8g2_font_7x14B_tf
  );

  oled.setCursor(
    0,
    49
  );

  oled.print(
    WiFi.softAPIP().toString()
  );

  oled.setFont(
    u8g2_font_5x8_tf
  );

  oled.drawStr(
    0,
    62,
    "Scan QR on next screen"
  );

  oled.sendBuffer();

}

// ============================================================
// OLED UPDATE
// ============================================================

void updateOLED() {

  /*
    First 10 seconds = IP
  */

  if (
    millis() - bootTime <
    IP_DISPLAY_TIME
  ) {

    oledStartup();

    return;

  }

  switch (oledScreen) {

    case 0:

      oledTemperature();

      break;

    case 1:

      oledHumidity();

      break;

    case 2:

      oledAtomizer();

      break;

    case 3:

      oledQR();

      break;

  }

}

// ============================================================
// ROOT
// ============================================================

void handleRoot() {

  server.send(
    200,
    "text/html",
    MAIN_PAGE
  );

}

// ============================================================
// DATA API
// ============================================================

void handleData() {

  String json;

  json.reserve(500);

  json += "{";

  json += "\"temperature\":";
  json += String(
    temperature,
    2
  );

  json += ",";

  json += "\"humidity\":";
  json += String(
    humidity,
    2
  );

  json += ",";

  json += "\"atomizer\":";
  json +=
    atomizerState ?
    "true" :
    "false";

  json += ",";

  json += "\"auto\":";
  json +=
    autoMode ?
    "true" :
    "false";

  json += ",";

  json += "\"temperatureOn\":";
  json += String(
    temperatureOn,
    1
  );

  json += ",";

  json += "\"temperatureOff\":";
  json += String(
    temperatureOff,
    1
  );

  json += ",";

  json += "\"humidityOn\":";
  json += String(
    humidityOn,
    1
  );

  json += ",";

  json += "\"humidityOff\":";
  json += String(
    humidityOff,
    1
  );

  json += ",";

  json += "\"ip\":\"";
  json += WiFi.softAPIP().toString();
  json += "\"";

  json += "}";

  server.send(
    200,
    "application/json",
    json
  );

}

// ============================================================
// MODE API
// ============================================================

void handleMode() {

  if (!server.hasArg("value")) {

    server.send(
      400,
      "text/plain",
      "Missing value"
    );

    return;

  }

  String mode =
    server.arg("value");

  if (mode == "auto") {

    autoMode = true;

    saveSettings();

    Serial.println(
      "MODE: AUTO"
    );

  }

  else if (
    mode == "manual"
  ) {

    autoMode = false;

    saveSettings();

    Serial.println(
      "MODE: MANUAL"
    );

  }

  server.send(
    200,
    "text/plain",
    "OK"
  );

}

// ============================================================
// ATOMIZER API
// ============================================================

void handleAtomizer() {

  if (!server.hasArg("state")) {

    server.send(
      400,
      "text/plain",
      "Missing state"
    );

    return;

  }

  String state =
    server.arg("state");

  if (state == "on") {

    startAtomizer();

  }

  else if (
    state == "off"
  ) {

    stopAtomizer();

  }

  server.send(
    200,
    "text/plain",
    "OK"
  );

}

// ============================================================
// SETTINGS GET
// ============================================================

void handleGetSettings() {

  String json;

  json.reserve(250);

  json += "{";

  json += "\"temperatureOn\":";
  json += String(
    temperatureOn,
    1
  );

  json += ",";

  json += "\"temperatureOff\":";
  json += String(
    temperatureOff,
    1
  );

  json += ",";

  json += "\"humidityOn\":";
  json += String(
    humidityOn,
    1
  );

  json += ",";

  json += "\"humidityOff\":";
  json += String(
    humidityOff,
    1
  );

  json += "}";

  server.send(
    200,
    "application/json",
    json
  );

}

// ============================================================
// SETTINGS SAVE
// ============================================================

void handleSaveSettings() {

  if (
    server.hasArg(
      "temperatureOn"
    )
  ) {

    temperatureOn =
      server.arg(
        "temperatureOn"
      ).toFloat();

  }

  if (
    server.hasArg(
      "temperatureOff"
    )
  ) {

    temperatureOff =
      server.arg(
        "temperatureOff"
      ).toFloat();

  }

  if (
    server.hasArg(
      "humidityOn"
    )
  ) {

    humidityOn =
      server.arg(
        "humidityOn"
      ).toFloat();

  }

  if (
    server.hasArg(
      "humidityOff"
    )
  ) {

    humidityOff =
      server.arg(
        "humidityOff"
      ).toFloat();

  }

  saveSettings();

  Serial.println(
    "ENVIRONMENT SETTINGS SAVED"
  );

  server.send(
    200,
    "text/plain",
    "OK"
  );

}

// ============================================================
// ACCESS POINT
// ============================================================

void startAccessPoint() {

  WiFi.mode(
    WIFI_AP
  );

  WiFi.softAP(
    AP_SSID,
    AP_PASSWORD
  );

  delay(500);

  Serial.println();

  Serial.println(
    "Access Point started"
  );

  Serial.print(
    "WiFi name: "
  );

  Serial.println(
    AP_SSID
  );

  Serial.print(
    "Password: "
  );

  Serial.println(
    AP_PASSWORD
  );

  Serial.print(
    "IP: "
  );

  Serial.println(
    WiFi.softAPIP()
  );

}

// ============================================================
// SETUP
// ============================================================

void setup() {

  Serial.begin(
    115200
  );

  delay(1500);

  Serial.println();
  Serial.println(
    "======================================"
  );

  Serial.println(
    "             LEAFYGUARD"
  );

  Serial.println(
    "   Smart Leafy Vegetable Storage"
  );

  Serial.println(
    "======================================"
  );

  // ==========================================================
  // ATOMIZER
  // ==========================================================

  pinMode(
    ATOMIZER_PIN,
    OUTPUT
  );

  digitalWrite(
    ATOMIZER_PIN,
    LOW
  );

  // ==========================================================
  // NVS
  // ==========================================================

  preferences.begin(
    "leafyguard",
    false
  );

  loadSettings();

  // ==========================================================
  // I2C
  // ==========================================================

  Wire.begin(
    I2C_SDA,
    I2C_SCL
  );

  Serial.println(
    "I2C:"
  );

  Serial.println(
    "SDA = D4"
  );

  Serial.println(
    "SCL = D5"
  );

  // ==========================================================
  // OLED
  // ==========================================================

  Serial.println(
    "Starting SH1106..."
  );

  oled.begin();

  oled.clearBuffer();

  oled.setFont(
    u8g2_font_10x20_tf
  );

  oled.drawStr(
    0,
    23,
    "LEAFYGUARD"
  );

  oled.setFont(
    u8g2_font_6x10_tf
  );

  oled.drawStr(
    0,
    43,
    "Starting..."
  );

  oled.sendBuffer();

  Serial.println(
    "OLED OK"
  );

  // ==========================================================
  // BME280
  // ==========================================================

  Serial.println(
    "Starting BME280..."
  );

  if (
    bme.begin(
      BME_ADDRESS
    )
  ) {

    bmeOK = true;

    Serial.println(
      "BME280 FOUND at 0x76"
    );

  }

  else {

    bmeOK = false;

    Serial.println(
      "BME280 NOT FOUND"
    );

  }

  // ==========================================================
  // ACCESS POINT
  // ==========================================================

  startAccessPoint();

  // ==========================================================
  // BOOT TIMER
  // ==========================================================

  bootTime =
    millis();

  // ==========================================================
  // SERVER ROUTES
  // ==========================================================

  server.on(
    "/",
    HTTP_GET,
    handleRoot
  );

  server.on(
    "/api/data",
    HTTP_GET,
    handleData
  );

  server.on(
    "/api/mode",
    HTTP_GET,
    handleMode
  );

  server.on(
    "/api/atomizer",
    HTTP_GET,
    handleAtomizer
  );

  // GET  /api/settings -> read saved settings
  // POST /api/settings -> save settings
  server.on(
    "/api/settings",
    HTTP_GET,
    handleGetSettings
  );

  server.on(
    "/api/settings",
    HTTP_POST,
    handleSaveSettings
  );

  // ==========================================================
  // SERVER START
  // ==========================================================

  server.begin();

  Serial.println(
    "Web server started"
  );

  Serial.print(
    "Dashboard: http://"
  );

  Serial.println(
    WiFi.softAPIP()
  );

  // ==========================================================
  // INITIAL SCREEN
  // ==========================================================

  oledStartup();

}

// ============================================================
// LOOP
// ============================================================

void loop() {

  // ==========================================================
  // WEB
  // ==========================================================

  server.handleClient();

  // ==========================================================
  // SENSOR
  // ==========================================================

  if (
    millis() -
    lastSensorRead >=
    SENSOR_INTERVAL
  ) {

    lastSensorRead =
      millis();

    readSensor();

    automaticControl();

    Serial.print(
      "Temperature: "
    );

    Serial.print(
      temperature,
      1
    );

    Serial.print(
      " C | Humidity: "
    );

    Serial.print(
      humidity,
      1
    );

    Serial.print(
      " % | Atomizer: "
    );

    Serial.println(
      atomizerState ?
      "ON" :
      "OFF"
    );

  }

  // ==========================================================
  // OLED
  // ==========================================================

  if (
    millis() -
    lastOLEDChange >=
    OLED_INTERVAL
  ) {

    lastOLEDChange =
      millis();

    /*
      Don't advance the screen during
      the initial 10-second IP display.
    */

    if (
      millis() -
      bootTime >=
      IP_DISPLAY_TIME
    ) {

      oledScreen++;

      if (
        oledScreen > 3
      ) {

        oledScreen = 0;

      }

    }

    updateOLED();

  }

}
