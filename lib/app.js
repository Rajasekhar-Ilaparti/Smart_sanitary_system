// ============================================================
//  Clean Gudlavalleru - the app's rules and API (shared)
//  Used by server.js (your computer) and by the Netlify function
//  (netlify/functions/api.js). Where data is kept is decided by
//  the "store": a JSON file (lib/store-file.js) or Supabase
//  (lib/store-supabase.js).
// ============================================================

const crypto = require('crypto');
const CONFIG = require('../config');
const DEMO_ACCOUNTS = require('../demo-accounts');

// The data for the request being handled: { counter, users, sessions, reports, blockedDevices }
let db;
let store;
let dirty = false;
let revokedUsers = [];
function saveDb() { dirty = true; }

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 32).toString('hex');
}
function newId(prefix) { return prefix + crypto.randomBytes(6).toString('hex'); }

// ---------------- helpers ----------------
const CAT = Object.fromEntries(CONFIG.CATEGORIES.map(c => [c.id, c]));
const ZONE = Object.fromEntries(CONFIG.ZONES.map(z => [z.id, z]));

// Gudlavalleru time (India, UTC+5:30), so "today" is right even on servers set to UTC
const IST_MS = 330 * 60 * 1000;
function istStartOfDay() { const t = new Date(Date.now() + IST_MS); t.setUTCHours(0, 0, 0, 0); return new Date(t.getTime() - IST_MS); }
function istStartOfMonth() { const t = new Date(Date.now() + IST_MS); t.setUTCDate(1); t.setUTCHours(0, 0, 0, 0); return new Date(t.getTime() - IST_MS); }

function distanceM(lat1, lng1, lat2, lng2) {
  const R = 6371000, toRad = d => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(a)));
}
function pointInPolygon(lat, lng, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [yi, xi] = poly[i], [yj, xj] = poly[j];
    if (((yi > lat) !== (yj > lat)) && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
}
function findZone(lat, lng) {
  const z = CONFIG.ZONES.find(z => pointInPolygon(lat, lng, z.polygon));
  return z ? z.id : null;
}
async function nextReportId() {
  const n = await store.nextCounter(db);
  return `GW-${new Date().getFullYear()}-${String(n).padStart(5, '0')}`;
}
const OPEN = ['received', 'assigned', 'in_progress', 'completed'];
function isOverdue(r) { return OPEN.includes(r.status) && Date.now() > new Date(r.dueAt).getTime(); }
function userName(id) { const u = db.users.find(u => u.id === id); return u ? u.name : null; }

async function savePhoto(dataUrl, name) {
  const m = /^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/.exec(dataUrl || '');
  if (!m) throw httpError(400, 'Please attach a photo.');
  const buf = Buffer.from(m[2], 'base64');
  if (buf.length > 6 * 1024 * 1024) throw httpError(400, 'Photo is too large.');
  const ext = m[1] === 'png' ? 'png' : m[1] === 'webp' ? 'webp' : 'jpg';
  const type = ext === 'jpg' ? 'image/jpeg' : 'image/' + ext;
  return store.savePhoto(`${name}-${crypto.randomBytes(4).toString('hex')}.${ext}`, buf, type);
}
function httpError(code, message) { const e = new Error(message); e.code = code; return e; }

// What anyone with the tracking ID may see (no phone / device info)
function publicView(r) {
  return {
    id: r.id, createdAt: r.createdAt, category: r.category, description: r.description,
    lat: r.lat, lng: r.lng, zoneId: r.zoneId, zoneName: r.zoneId ? ZONE[r.zoneId].name : 'Not yet assigned',
    status: r.status, supporters: r.supporters, photoBefore: r.photoBefore,
    photoAfter: r.status === 'resolved' ? r.photoAfter : null,
    resolvedAt: r.resolvedAt || null,
    timeline: r.timeline.map(t => ({ at: t.at, status: t.status, note: t.publicNote || '' }))
  };
}
// What the department sees
function deptView(r) {
  return {
    ...r, deviceId: undefined, ip: undefined, supporterDevices: undefined,
    workerName: r.workerId ? userName(r.workerId) : null,
    zoneName: r.zoneId ? ZONE[r.zoneId].name : 'Outside all zones',
    overdue: isOverdue(r),
    timeline: r.timeline.map(t => ({ ...t, byName: t.by ? userName(t.by) : (t.byLabel || 'Citizen') }))
  };
}
function addTimeline(r, status, by, note, publicNote) {
  r.timeline.push({ at: new Date().toISOString(), status, by: by || null, note: note || '', publicNote: publicNote || '' });
}

// ---------------- request plumbing ----------------
// req = { method, path, headers (lower-case names), body (already parsed), ip }
async function readBody(req) { return req.body || {}; }
function clientIp(req) { return req.ip || ''; }
function tokenOf(req) {
  const h = (req.headers && req.headers.authorization) || '';
  return h.startsWith('Bearer ') ? h.slice(7) : null;
}
function authUser(req) {
  const token = tokenOf(req);
  const s = token && db.sessions[token];
  if (!s) return null;
  return db.users.find(u => u.id === s.userId) || null;
}
function requireRole(req, roles) {
  const u = authUser(req);
  if (!u) throw httpError(401, 'Please log in.');
  if (!roles.includes(u.role)) throw httpError(403, 'Not allowed.');
  return u;
}
function canSee(u, r) { return u.role === 'super' || r.zoneId === u.zoneId; }
// Log a user out everywhere (after a password reset or removal)
function revokeUserSessions(userId) {
  for (const [tok, s] of Object.entries(db.sessions)) if (s.userId === userId) delete db.sessions[tok];
  revokedUsers.push(userId);
}

// ---------------- API routes ----------------
const routes = [];
function route(method, pattern, handler) {
  const keys = [];
  const re = new RegExp('^' + pattern.replace(/:(\w+)/g, (_, k) => { keys.push(k); return '([^/]+)'; }) + '$');
  routes.push({ method, re, keys, handler });
}

// --- public ---
route('GET', '/api/config', () => ({
  categories: CONFIG.CATEGORIES, zones: CONFIG.ZONES, center: CONFIG.MAP_CENTER, zoom: CONFIG.MAP_ZOOM,
  checkinRadius: CONFIG.CHECKIN_RADIUS_M, demoMode: CONFIG.DEMO_MODE
}));

route('GET', '/api/stats/public', () => {
  const monthStart = istStartOfMonth();
  const valid = db.reports.filter(r => r.status !== 'rejected');
  const solved = valid.filter(r => r.status === 'resolved');
  return {
    total: valid.length,
    solved: solved.length,
    inProgress: valid.filter(r => OPEN.includes(r.status)).length,
    solvedThisMonth: solved.filter(r => new Date(r.resolvedAt) >= monthStart).length
  };
});

route('POST', '/api/reports', async (req) => {
  const b = await readBody(req);
  const deviceId = String(b.deviceId || '').slice(0, 64);
  if (!deviceId) throw httpError(400, 'Missing device id.');
  if (db.blockedDevices.includes(deviceId)) throw httpError(403, 'Reporting from this device has been blocked due to fake reports.');
  const lat = Number(b.lat), lng = Number(b.lng);
  if (!isFinite(lat) || !isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) throw httpError(400, 'Please set the location on the map.');
  if (!CAT[b.category]) throw httpError(400, 'Please choose the type of problem.');

  const hourAgo = Date.now() - 3600 * 1000;
  const ip = clientIp(req);
  const recent = db.reports.filter(r => new Date(r.createdAt).getTime() > hourAgo && (r.deviceId === deviceId || r.ip === ip && ip && ip !== '127.0.0.1' && ip !== '::1'));
  if (recent.length >= CONFIG.MAX_REPORTS_PER_HOUR) throw httpError(429, 'Too many reports in one hour. Please try again later.');

  // Duplicate check: same type, still open, very close by
  const dup = db.reports.find(r => OPEN.includes(r.status) && r.category === b.category &&
    distanceM(lat, lng, r.lat, r.lng) <= CONFIG.DUPLICATE_RADIUS_M);
  if (dup) {
    if (!dup.supporterDevices.includes(deviceId)) {
      dup.supporters += 1;
      dup.supporterDevices.push(deviceId);
      if (dup.supporters >= 3) dup.priority = 'high';
      addTimeline(dup, dup.status, null, `Another citizen reported the same problem (+1, total ${dup.supporters})`, `Another citizen reported this (${dup.supporters} reports)`);
      saveDb();
    }
    return { id: dup.id, merged: true };
  }

  // Check the photo before using up a tracking number
  if (!/^data:image\/(jpeg|jpg|png|webp);base64,/.test(b.photo || '')) throw httpError(400, 'Please attach a photo.');
  const id = await nextReportId();
  const photoBefore = await savePhoto(b.photo, id + '-before');
  const now = new Date();
  const r = {
    id, createdAt: now.toISOString(), category: b.category,
    description: String(b.description || '').slice(0, 500),
    contactPhone: String(b.phone || '').replace(/[^\d+]/g, '').slice(0, 15),
    lat, lng, accuracy: Number(b.accuracy) || null, zoneId: findZone(lat, lng),
    photoBefore, photoAfter: null, status: 'received', priority: 'normal',
    supporters: 1, supporterDevices: [deviceId], deviceId, ip,
    workerId: null, checkIn: null, completion: null, resolvedAt: null,
    dueAt: new Date(now.getTime() + CAT[b.category].slaHours * 3600 * 1000).toISOString(),
    timeline: []
  };
  addTimeline(r, 'received', null, 'Reported by citizen', 'Report received');
  r.timeline[0].byLabel = 'Citizen';
  db.reports.push(r);
  saveDb();
  return { id, merged: false, zoneName: r.zoneId ? ZONE[r.zoneId].name : null };
});

route('GET', '/api/reports/:id', (req, p) => {
  const r = db.reports.find(r => r.id === decodeURIComponent(p.id).toUpperCase().trim());
  if (!r) throw httpError(404, 'No report found with that tracking ID.');
  return publicView(r);
});

route('POST', '/api/reports/lookup', async (req) => {
  const b = await readBody(req);
  const ids = (Array.isArray(b.ids) ? b.ids : []).slice(0, 50);
  return db.reports.filter(r => ids.includes(r.id)).map(publicView);
});

// --- login ---
route('POST', '/api/login', async (req) => {
  const b = await readBody(req);
  const u = db.users.find(u => u.username === String(b.username || '').trim().toLowerCase());
  if (!u || hashPassword(String(b.password || ''), u.salt) !== u.passHash) throw httpError(401, 'Wrong username or password.');
  if (u.active === false) throw httpError(403, 'This account has been removed. Please contact your department.');
  if (b.portal === 'worker' && u.role !== 'worker') throw httpError(403, 'This is the worker app. Department staff please use the Department portal.');
  if (b.portal === 'department' && u.role === 'worker') throw httpError(403, 'Workers please use the Worker app.');
  const token = crypto.randomBytes(24).toString('hex');
  db.sessions[token] = { userId: u.id, at: new Date().toISOString() };
  saveDb();
  return { token, user: meView(u) };
});
function meView(u) {
  return { id: u.id, name: u.name, role: u.role, username: u.username, zoneId: u.zoneId, zoneName: u.zoneId ? ZONE[u.zoneId].name : 'All zones' };
}
route('GET', '/api/me', (req) => { const u = authUser(req); if (!u) throw httpError(401, 'Please log in.'); return meView(u); });
route('POST', '/api/logout', (req) => {
  const token = tokenOf(req);
  if (token && db.sessions[token]) { delete db.sessions[token]; saveDb(); }
  return { ok: true };
});

// --- department ---
function deptReports(u) { return db.reports.filter(r => canSee(u, r)); }

route('GET', '/api/dept/reports', (req) => {
  const u = requireRole(req, ['admin', 'super']);
  return deptReports(u).slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(deptView);
});

route('GET', '/api/dept/stats', (req) => {
  const u = requireRole(req, ['admin', 'super']);
  const list = deptReports(u);
  const valid = list.filter(r => r.status !== 'rejected');
  const solved = valid.filter(r => r.status === 'resolved');
  const avgHours = solved.length ? Math.round(solved.reduce((s, r) => s + (new Date(r.resolvedAt) - new Date(r.createdAt)), 0) / solved.length / 36e5 * 10) / 10 : null;
  const byCategory = {};
  for (const r of valid) byCategory[r.category] = (byCategory[r.category] || 0) + 1;
  const today = istStartOfDay();
  return {
    received: valid.length,
    pending: valid.filter(r => ['received', 'assigned'].includes(r.status)).length,
    inProgress: valid.filter(r => r.status === 'in_progress').length,
    awaitingVerify: valid.filter(r => r.status === 'completed').length,
    solved: solved.length,
    overdue: valid.filter(isOverdue).length,
    spam: list.filter(r => r.status === 'rejected').length,
    unassignedZone: u.role === 'super' ? db.reports.filter(r => !r.zoneId && OPEN.includes(r.status)).length : 0,
    today: valid.filter(r => new Date(r.createdAt) >= today).length,
    avgResolveHours: avgHours,
    byCategory
  };
});

route('GET', '/api/dept/workers', (req) => {
  const u = requireRole(req, ['admin', 'super']);
  return db.users.filter(w => w.role === 'worker' && w.active !== false && (u.role === 'super' || w.zoneId === u.zoneId)).map(w => {
    const jobs = db.reports.filter(r => r.workerId === w.id);
    const active = jobs.filter(r => ['assigned', 'in_progress'].includes(r.status));
    const onSite = active.find(r => r.status === 'in_progress');
    return {
      id: w.id, name: w.name, username: w.username, phone: w.phone, zoneId: w.zoneId, zoneName: ZONE[w.zoneId] ? ZONE[w.zoneId].name : '',
      activeJobs: active.length, completedJobs: jobs.filter(r => ['completed', 'resolved'].includes(r.status)).length,
      onSiteAt: onSite ? { reportId: onSite.id, since: onSite.checkIn && onSite.checkIn.at, verified: onSite.checkIn && onSite.checkIn.verified } : null
    };
  });
});

// Everything the department page needs in ONE call (saves Netlify function runs:
// the page refreshes every 10 seconds)
route('GET', '/api/dept/dashboard', async (req) => {
  const get = p => routes.find(r => r.method === 'GET' && r.re.test(p)).handler(req, {});
  return { reports: await get('/api/dept/reports'), stats: await get('/api/dept/stats'), workers: await get('/api/dept/workers') };
});

// --- worker management (department staff) ---
function getZoneWorker(u, id) {
  const w = db.users.find(w => w.id === id && w.role === 'worker' && w.active !== false);
  if (!w || (u.role !== 'super' && w.zoneId !== u.zoneId)) throw httpError(404, 'Worker not found.');
  return w;
}
function checkPassword(p) {
  p = String(p || '');
  if (p.length < 6) throw httpError(400, 'Password must be at least 6 characters.');
  return p;
}
route('POST', '/api/dept/workers', async (req) => {
  const u = requireRole(req, ['admin', 'super']);
  const b = await readBody(req);
  const name = String(b.name || '').trim().slice(0, 60);
  const username = String(b.username || '').trim().toLowerCase();
  const phone = String(b.phone || '').replace(/[^\d+]/g, '').slice(0, 15);
  const zoneId = u.role === 'super' ? b.zoneId : u.zoneId;
  if (!name) throw httpError(400, 'Enter the worker\'s name.');
  if (!/^[a-z0-9_.]{3,20}$/.test(username)) throw httpError(400, 'Username must be 3–20 letters or numbers, no spaces.');
  if (db.users.some(x => x.username === username)) throw httpError(400, 'That username is already taken.');
  if (!ZONE[zoneId]) throw httpError(400, 'Choose a zone.');
  const password = checkPassword(b.password);
  const salt = crypto.randomBytes(8).toString('hex');
  const w = { id: newId('u_'), role: 'worker', username, name, phone, zoneId, salt, passHash: hashPassword(password, salt), active: true, createdAt: new Date().toISOString() };
  db.users.push(w);
  saveDb();
  return { ok: true, id: w.id };
});
route('POST', '/api/dept/workers/:id/password', async (req, p) => {
  const u = requireRole(req, ['admin', 'super']);
  const b = await readBody(req);
  const w = getZoneWorker(u, p.id);
  w.salt = crypto.randomBytes(8).toString('hex');
  w.passHash = hashPassword(checkPassword(b.password), w.salt);
  revokeUserSessions(w.id);
  saveDb();
  return { ok: true };
});
route('POST', '/api/dept/workers/:id/remove', (req, p) => {
  const u = requireRole(req, ['admin', 'super']);
  const w = getZoneWorker(u, p.id);
  const active = db.reports.filter(r => r.workerId === w.id && ['assigned', 'in_progress'].includes(r.status));
  if (active.length) throw httpError(400, `${w.name} still has ${active.length} open job(s). Re-assign them first.`);
  w.active = false;
  revokeUserSessions(w.id);
  saveDb();
  return { ok: true };
});

function getDeptReport(u, id) {
  const r = db.reports.find(r => r.id === id);
  if (!r || !canSee(u, r)) throw httpError(404, 'Report not found.');
  return r;
}

route('POST', '/api/dept/reports/:id/assign', async (req, p) => {
  const u = requireRole(req, ['admin', 'super']);
  const b = await readBody(req);
  const r = getDeptReport(u, p.id);
  if (!OPEN.includes(r.status)) throw httpError(400, 'This report is already closed.');
  const w = db.users.find(w => w.id === b.workerId && w.role === 'worker' && w.active !== false);
  if (!w) throw httpError(400, 'Choose a worker.');
  if (u.role !== 'super' && w.zoneId !== u.zoneId) throw httpError(403, 'That worker is not in your zone.');
  r.workerId = w.id;
  if (b.priority === 'high' || b.priority === 'normal') r.priority = b.priority;
  r.status = 'assigned';
  r.checkIn = null; r.completion = null;
  addTimeline(r, 'assigned', u.id, `Assigned to ${w.name}` + (b.note ? ` - ${b.note}` : ''), 'A cleaning worker has been assigned');
  saveDb();
  return deptView(r);
});

route('POST', '/api/dept/reports/:id/verify', async (req, p) => {
  const u = requireRole(req, ['admin', 'super']);
  const b = await readBody(req);
  const r = getDeptReport(u, p.id);
  if (r.status !== 'completed') throw httpError(400, 'The worker has not finished this job yet.');
  if (b.approve) {
    r.status = 'resolved'; r.resolvedAt = new Date().toISOString(); r.photoAfter = r.completion.photo;
    addTimeline(r, 'resolved', u.id, 'Verified and closed' + (b.note ? ` - ${b.note}` : ''), 'Problem solved - area cleaned');
  } else {
    r.status = 'assigned';
    addTimeline(r, 'assigned', u.id, 'Sent back to worker: ' + (b.note || 'not cleaned properly'), 'Cleaning is being redone');
  }
  saveDb();
  return deptView(r);
});

route('POST', '/api/dept/reports/:id/spam', async (req, p) => {
  const u = requireRole(req, ['admin', 'super']);
  const b = await readBody(req);
  const r = getDeptReport(u, p.id);
  if (!OPEN.includes(r.status)) throw httpError(400, 'This report is already closed.');
  r.status = 'rejected';
  addTimeline(r, 'rejected', u.id, 'Marked as fake / not valid' + (b.note ? ` - ${b.note}` : ''), 'Closed - report could not be verified');
  const spamCount = db.reports.filter(x => x.deviceId === r.deviceId && x.status === 'rejected').length;
  if (spamCount >= CONFIG.SPAM_BLOCK_AFTER && !db.blockedDevices.includes(r.deviceId)) db.blockedDevices.push(r.deviceId);
  saveDb();
  return deptView(r);
});

route('POST', '/api/dept/reports/:id/zone', async (req, p) => {
  const u = requireRole(req, ['super']);
  const b = await readBody(req);
  const r = getDeptReport(u, p.id);
  if (!ZONE[b.zoneId]) throw httpError(400, 'Choose a zone.');
  r.zoneId = b.zoneId;
  addTimeline(r, r.status, u.id, `Sent to ${ZONE[b.zoneId].name}`, `Sent to ${ZONE[b.zoneId].name}`);
  saveDb();
  return deptView(r);
});

// --- worker ---
function getWorkerJob(u, id) {
  const r = db.reports.find(r => r.id === id && r.workerId === u.id);
  if (!r) throw httpError(404, 'Job not found.');
  return r;
}
route('GET', '/api/worker/jobs', (req) => {
  const u = requireRole(req, ['worker']);
  return db.reports.filter(r => r.workerId === u.id && r.status !== 'rejected')
    .sort((a, b) => (a.priority === 'high' ? -1 : 0) - (b.priority === 'high' ? -1 : 0) || a.dueAt.localeCompare(b.dueAt))
    .map(r => ({
      id: r.id, category: r.category, description: r.description, lat: r.lat, lng: r.lng,
      status: r.status, priority: r.priority, dueAt: r.dueAt, overdue: isOverdue(r),
      photoBefore: r.photoBefore, checkIn: r.checkIn, completion: r.completion, zoneName: r.zoneId ? ZONE[r.zoneId].name : '',
      createdAt: r.createdAt, resolvedAt: r.resolvedAt, supporters: r.supporters,
      assignedAt: ([...r.timeline].reverse().find(t => t.status === 'assigned') || {}).at || null,
      sentBack: r.status === 'assigned' && /^Sent back/.test(([...r.timeline].reverse().find(t => t.status === 'assigned') || {}).note || ''),
      lastNote: [...r.timeline].reverse().find(t => t.by && t.by !== u.id)?.note || ''
    }));
});

route('POST', '/api/worker/password', async (req) => {
  const u = requireRole(req, ['worker']);
  const b = await readBody(req);
  if (hashPassword(String(b.old || ''), u.salt) !== u.passHash) throw httpError(400, 'Your current password is wrong.');
  u.salt = crypto.randomBytes(8).toString('hex');
  u.passHash = hashPassword(checkPassword(b.password), u.salt);
  saveDb();
  return { ok: true };
});

route('POST', '/api/worker/jobs/:id/checkin', async (req, p) => {
  const u = requireRole(req, ['worker']);
  const b = await readBody(req);
  const r = getWorkerJob(u, p.id);
  if (r.status !== 'assigned') throw httpError(400, 'You can only check in to a job that is assigned to you and not started.');
  const hasGps = b.lat != null && b.lng != null && isFinite(Number(b.lat)) && isFinite(Number(b.lng));
  if (!hasGps) {
    // No GPS at all: only allowed as an unverified demo-mode check-in, with no location recorded.
    if (!(CONFIG.DEMO_MODE && b.force)) throw httpError(400, 'Could not read your GPS location.');
    r.status = 'in_progress';
    r.checkIn = { at: new Date().toISOString(), lat: null, lng: null, distance: null, verified: false };
    addTimeline(r, 'in_progress', u.id, `${u.name} checked in (no GPS - location unknown, NOT verified - demo mode)`, 'Worker is on site - cleaning in progress');
    saveDb();
    return { ok: true, distance: null, verified: false };
  }
  const lat = Number(b.lat), lng = Number(b.lng);
  const dist = distanceM(lat, lng, r.lat, r.lng);
  const verified = dist <= CONFIG.CHECKIN_RADIUS_M;
  if (!verified && !(CONFIG.DEMO_MODE && b.force)) {
    return { ok: false, distance: dist, radius: CONFIG.CHECKIN_RADIUS_M, canForce: CONFIG.DEMO_MODE };
  }
  r.status = 'in_progress';
  r.checkIn = { at: new Date().toISOString(), lat, lng, distance: dist, verified };
  addTimeline(r, 'in_progress', u.id, `${u.name} checked in on site (${dist} m from spot${verified ? ', GPS verified' : ', NOT verified - demo mode'})`, 'Worker is on site - cleaning in progress');
  saveDb();
  return { ok: true, distance: dist, verified };
});

route('POST', '/api/worker/jobs/:id/complete', async (req, p) => {
  const u = requireRole(req, ['worker']);
  const b = await readBody(req);
  const r = getWorkerJob(u, p.id);
  if (r.status !== 'in_progress') throw httpError(400, 'Please check in on site first.');
  const photo = await savePhoto(b.photo, r.id + '-after');
  const lat = Number(b.lat), lng = Number(b.lng);
  const hasGps = b.lat != null && b.lng != null && isFinite(lat) && isFinite(lng);
  const dist = hasGps ? distanceM(lat, lng, r.lat, r.lng) : null;
  r.completion = { at: new Date().toISOString(), photo, lat: hasGps ? lat : null, lng: hasGps ? lng : null, distance: dist, note: String(b.note || '').slice(0, 300) };
  r.status = 'completed';
  addTimeline(r, 'completed', u.id, `Cleaning done, after photo uploaded${dist != null ? ` (${dist} m from spot)` : ''}` + (b.note ? ` - ${b.note}` : ''), 'Cleaning done - waiting for department check');
  saveDb();
  return { ok: true };
});

// ---------------- first run: demo accounts + sample data ----------------
async function seedIfEmpty() {
  if (db.users.length) return;
  for (const a of DEMO_ACCOUNTS) {
    const salt = crypto.randomBytes(8).toString('hex');
    db.users.push({
      id: newId('u_'), role: a.role, username: a.username, name: a.name, phone: a.phone,
      zoneId: a.zoneId, salt, passHash: hashPassword(a.password, salt)
    });
  }
  await seedSampleReports();
  saveDb();
  console.log('Created new database with demo accounts and sample reports.');
}

async function seedSampleReports() {
  const mkSvg = (file, title, dirty) => {
    const bg = dirty ? '#8b7355' : '#9ccc65';
    const items = dirty
      ? '<circle cx="120" cy="190" r="34" fill="#5d4037"/><rect x="170" y="160" width="60" height="45" rx="6" fill="#e0e0e0"/><circle cx="260" cy="200" r="26" fill="#ff7043"/><rect x="90" y="215" width="40" height="22" fill="#42a5f5"/><path d="M200 210 l30 -20 l25 25 z" fill="#ffca28"/><circle cx="300" cy="175" r="18" fill="#616161"/>'
      : '<rect x="150" y="140" width="90" height="100" rx="8" fill="#2e7d32"/><rect x="140" y="128" width="110" height="16" rx="4" fill="#1b5e20"/><text x="195" y="200" font-size="34" text-anchor="middle" fill="#fff">♻</text>';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#bbdefb"/><rect y="150" width="400" height="150" fill="${bg}"/>${items}<rect x="0" y="0" width="400" height="34" fill="rgba(0,0,0,.55)"/><text x="12" y="23" font-family="Arial" font-size="15" fill="#fff">SAMPLE PHOTO - ${title}</text></svg>`;
    return store.savePhoto(file, Buffer.from(svg, 'utf8'), 'image/svg+xml');
  };
  const workers = db.users.filter(u => u.role === 'worker');
  const wFor = zone => workers.find(w => w.zoneId === zone);
  const c = CONFIG.MAP_CENTER;
  const samples = [
    { cat: 'overflowing_bin', d: 'Dustbin near bus stop overflowing for 3 days', lat: c.lat + 0.004, lng: c.lng - 0.003, status: 'received', hoursAgo: 1 },
    { cat: 'open_dumping', d: 'Garbage dumped beside the canal road', lat: c.lat - 0.006, lng: c.lng - 0.008, status: 'assigned', hoursAgo: 1.5 },
    { cat: 'burning', d: 'People burning plastic waste near the field', lat: c.lat - 0.004, lng: c.lng + 0.006, status: 'in_progress', hoursAgo: 2 },
    { cat: 'drain_block', d: 'Drain blocked with plastic covers, water stagnant', lat: c.lat + 0.008, lng: c.lng + 0.004, status: 'completed', hoursAgo: 2.5 },
    { cat: 'missed_collection', d: 'Collection vehicle has not come to our street', lat: c.lat - 0.009, lng: c.lng + 0.010, status: 'resolved', hoursAgo: 50 },
    { cat: 'littering', d: 'Plastic waste scattered near the temple', lat: c.lat + 0.002, lng: c.lng + 0.012, status: 'resolved', hoursAgo: 80 },
    { cat: 'dead_animal', d: 'Dead dog on the main road', lat: c.lat - 0.002, lng: c.lng - 0.012, status: 'received', hoursAgo: 4 }
  ];
  for (const s of samples) {
    const id = await nextReportId();
    const created = new Date(Date.now() - s.hoursAgo * 3600 * 1000);
    const zoneId = findZone(s.lat, s.lng);
    const w = wFor(zoneId);
    const r = {
      id, createdAt: created.toISOString(), category: s.cat, description: s.d, contactPhone: '',
      lat: s.lat, lng: s.lng, accuracy: 10, zoneId,
      photoBefore: await mkSvg(`${id}-before.svg`, 'before', true), photoAfter: null,
      status: 'received', priority: 'normal', supporters: 1, supporterDevices: ['sample'], deviceId: 'sample', ip: 'sample',
      workerId: null, checkIn: null, completion: null, resolvedAt: null,
      dueAt: new Date(created.getTime() + CAT[s.cat].slaHours * 3600 * 1000).toISOString(),
      timeline: [{ at: created.toISOString(), status: 'received', by: null, byLabel: 'Citizen', note: 'Reported by citizen', publicNote: 'Report received' }]
    };
    const t = h => new Date(created.getTime() + h * 3600 * 1000).toISOString();
    const order = ['received', 'assigned', 'in_progress', 'completed', 'resolved'];
    const level = order.indexOf(s.status);
    if (level >= 1) { r.workerId = w.id; r.status = 'assigned'; r.timeline.push({ at: t(0.25), status: 'assigned', by: null, byLabel: 'Department', note: `Assigned to ${w.name}`, publicNote: 'A cleaning worker has been assigned' }); }
    if (level >= 2) { r.status = 'in_progress'; r.checkIn = { at: t(0.5), lat: s.lat, lng: s.lng, distance: 12, verified: true }; r.timeline.push({ at: t(0.5), status: 'in_progress', by: w.id, note: `${w.name} checked in on site (12 m from spot, GPS verified)`, publicNote: 'Worker is on site - cleaning in progress' }); }
    if (level >= 3) { r.status = 'completed'; r.completion = { at: t(2), photo: await mkSvg(`${id}-after.svg`, 'after cleaning', false), lat: s.lat, lng: s.lng, distance: 8, note: 'Cleaned' }; r.timeline.push({ at: t(2), status: 'completed', by: w.id, note: 'Cleaning done, after photo uploaded (8 m from spot)', publicNote: 'Cleaning done - waiting for department check' }); }
    if (level >= 4) { r.status = 'resolved'; r.resolvedAt = t(2.5); r.photoAfter = r.completion.photo; r.timeline.push({ at: t(2.5), status: 'resolved', by: null, byLabel: 'Department', note: 'Verified and closed', publicNote: 'Problem solved - area cleaned' }); }
    db.reports.push(r);
  }
}

// ---------------- handling one API request ----------------
async function handleOne(req) {
  dirty = false;
  revokedUsers = [];
  try {
    if (typeof req.body === 'string') {
      if (req.body.length > 10 * 1024 * 1024) throw httpError(413, 'Upload too large.');
      try { req.body = req.body ? JSON.parse(req.body) : {}; } catch { throw httpError(400, 'Bad request.'); }
    }
    db = await store.load({ token: tokenOf(req) });
    await seedIfEmpty();
    let out = null, found = false;
    for (const rt of routes) {
      if (rt.method !== req.method) continue;
      const m = rt.re.exec(req.path);
      if (!m) continue;
      const params = Object.fromEntries(rt.keys.map((k, i) => [k, m[i + 1]]));
      out = await rt.handler(req, params);
      found = true;
      break;
    }
    if (dirty) await store.save(db, { revokedUsers });
    if (!found) return { status: 404, body: { error: 'Not found' } };
    return { status: 200, body: out };
  } catch (e) {
    if (typeof e.code !== 'number') console.error(e);
    return { status: typeof e.code === 'number' ? e.code : 500, body: { error: typeof e.code === 'number' ? e.message : 'Something went wrong on the server.' } };
  }
}

// One request at a time per server process, so two requests never overwrite each other's changes.
function createApp(theStore) {
  store = theStore;
  let chain = Promise.resolve();
  return {
    handle(req) {
      const p = chain.then(() => handleOne(req));
      chain = p.catch(() => {});
      return p;
    }
  };
}

module.exports = { createApp };
