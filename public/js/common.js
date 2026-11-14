// Shared helpers used by all pages

const STATUS = {
  received: { en: 'Received', te: 'స్వీకరించబడింది' },
  assigned: { en: 'Worker assigned', te: 'కార్మికుడిని నియమించారు' },
  in_progress: { en: 'Cleaning in progress', te: 'శుభ్రం చేస్తున్నారు' },
  completed: { en: 'Cleaned - being checked', te: 'శుభ్రం చేశారు - తనిఖీలో ఉంది' },
  resolved: { en: 'Solved', te: 'పరిష్కరించబడింది' },
  rejected: { en: 'Closed (not valid)', te: 'మూసివేయబడింది' }
};

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function badge(status, lang) {
  const s = STATUS[status] || { en: status };
  return `<span class="badge s-${esc(status)}">${esc((lang === 'te' && s.te) || s.en)}</span>`;
}
function fmtTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
}
function timeAgo(iso) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return mins + ' min ago';
  const h = Math.round(mins / 60);
  if (h < 48) return h + ' hr ago';
  return Math.round(h / 24) + ' days ago';
}
function timeLeft(iso) {
  const mins = Math.round((new Date(iso).getTime() - Date.now()) / 60000);
  const abs = Math.abs(mins);
  const t = abs < 60 ? abs + ' min' : abs < 2880 ? Math.round(abs / 60) + ' hr' : Math.round(abs / 1440) + ' days';
  return mins >= 0 ? t + ' left' : t + ' overdue';
}

async function api(path, { method = 'GET', body, token } = {}) {
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = 'Bearer ' + token;
  let res;
  try {
    res = await fetch(path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  } catch {
    throw new Error('Cannot reach the server. Check your internet / Wi-Fi and try again.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) { const e = new Error(data.error || 'Something went wrong.'); e.status = res.status; throw e; }
  return data;
}

// Shrink a photo before upload (also removes hidden GPS/EXIF data)
function compressImage(file, maxSize = 1280, quality = 0.75) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read that photo. Please try another one.')); };
    img.src = url;
  });
}

function getGps(timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('This device does not support GPS location.'));
    navigator.geolocation.getCurrentPosition(
      p => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: Math.round(p.coords.accuracy) }),
      err => reject(new Error(err.code === 1
        ? 'Location permission was denied. Please allow location access in your browser.'
        : 'Could not get your GPS location. Please turn on GPS and try again.')),
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 0 }
    );
  });
}

function store(key, val) {
  try {
    if (val === undefined) return JSON.parse(localStorage.getItem(key));
    if (val === null) localStorage.removeItem(key); else localStorage.setItem(key, JSON.stringify(val));
  } catch { return undefined; }
}

function deviceId() {
  let id = store('gw_device');
  if (!id) { id = 'd_' + Math.random().toString(36).slice(2) + Date.now().toString(36); store('gw_device', id); }
  return id;
}

function mapsLink(lat, lng) { return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`; }

function pinIcon(color) {
  return L.divIcon({
    className: '',
    html: `<svg width="28" height="38" viewBox="0 0 28 38"><path d="M14 0C6.3 0 0 6.2 0 13.9 0 24.3 14 38 14 38s14-13.7 14-24.1C28 6.2 21.7 0 14 0z" fill="${color}" stroke="#fff" stroke-width="2"/><circle cx="14" cy="14" r="5" fill="#fff"/></svg>`,
    iconSize: [28, 38], iconAnchor: [14, 38], popupAnchor: [0, -34]
  });
}
const STATUS_COLOR = { received: '#dc2626', assigned: '#d97706', in_progress: '#2563eb', completed: '#7c3aed', resolved: '#16a34a', rejected: '#64748b' };

function baseMap(el, cfg) {
  const map = L.map(el).setView([cfg.center.lat, cfg.center.lng], cfg.zoom);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(map);
  return map;
}
function drawZones(map, zones, onlyId) {
  for (const z of zones) {
    if (onlyId && z.id !== onlyId) continue;
    L.polygon(z.polygon, { color: z.color, weight: 2, fillOpacity: 0.06, dashArray: '6 4' }).addTo(map).bindTooltip(z.name);
  }
}
