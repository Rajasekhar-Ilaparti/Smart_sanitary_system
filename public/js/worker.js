// =====================================================================
//  Worker App (phone-first)
// =====================================================================
const $ = id => document.getElementById(id);

/* ----------------------------- language ----------------------------- */
const T = {
  en: {
    backSite: '← Website', appName: 'Worker App', loginLead: 'See your cleaning jobs, check in on site and upload the after photo.',
    loginTitle: 'Log in', loginSub: 'Use the username and password given by your department.', username: 'Username', password: 'Password',
    loginBtn: 'Log in', loggingIn: 'Logging in…', forgot: 'Forgot your password? Ask your department to reset it.',
    hello: 'Namaste, {name} 👋', todayLine: '{date} · {n} job(s) to do', navJobs: 'Jobs', navMap: 'Map', navHistory: 'History', navProfile: 'Profile',
    sToDo: 'To do', sWorking: 'Working', sDoneToday: 'Done today', workingNow: 'WORKING NOW', since: 'Started {t} ago', toDo: 'To do',
    waiting: 'Waiting for department check', noJobs: 'No jobs right now', noJobsSub: 'New jobs will appear here with a sound.',
    newTag: 'NEW', high: 'High priority', overdue: 'Overdue', left: '{t} left', late: '{t} late', away: '{d} away', sentBack: 'Sent back - clean again',
    mapHint: 'Tap a pin to open the job. Blue dot = you.', historyTitle: 'Finished jobs', noHistory: 'Finished jobs will appear here.',
    approved: 'Approved ✓', waitingShort: 'Waiting for check', before: 'BEFORE', after: 'AFTER',
    changePw: 'Change password', language: 'Language', sound: 'Alert sound', on: 'On', off: 'Off', logout: 'Log out',
    oldPw: 'Current password', newPw: 'New password (min 6 characters)', save: 'Save', pwSaved: 'Password changed.',
    stTotal: 'Jobs finished', stWeek: 'This week', stOnTime: 'On time', stAvg: 'Avg hours / job',
    step1: 'Reach', step2: 'Check in', step3: 'Clean & photo', step4: 'Done',
    goTitle: 'Go to the spot', navigate: '🧭 Navigate (Google Maps)', reached: '📍 I have reached - Check in', gettingGps: 'Getting your GPS location…',
    tooFar: 'You are {d} m away. You must be within {r} m of the spot to check in.', forceDemo: 'Check in anyway (demo mode - marked not verified)',
    gpsFail: 'Could not get GPS: {e}', checkedIn: '✅ Checked in {t} · {m} m from spot {v}', checkedInNoGps: '✅ Checked in {t} · location unknown (no GPS, not verified)', verified: '(GPS verified)', notVerified: '(not verified)',
    cleanTitle: 'Clean the spot', cleanSub: 'Sweep everything into the cart. Separate wet and dry waste if you can.', workingFor: 'Working for',
    photoTitle: 'Take the AFTER photo', photoSub: 'Stand where the citizen stood and photograph the same place.', tapCam: 'Tap to open camera', retake: 'Tap to retake',
    notePh: 'Note for department (optional)', upload: '⬆ Upload & finish job', uploading: 'Uploading…',
    doneTitle: 'Job finished!', doneSub: 'The department will check your photo. You will get a message when it is approved.',
    resolvedTitle: 'Approved by department ✓', deptNote: 'Department note', reportedAgo: 'Reported {t} ago', people: '{n} people reported this',
    tNewJob: 'New job assigned', tApproved: 'Your job was approved ✓', tSentBack: 'Sent back - please clean again', close: 'Close'
  },
  te: {
    backSite: '← వెబ్‌సైట్', appName: 'కార్మికుల యాప్', loginLead: 'మీ శుభ్రత పనులు చూడండి, స్థలంలో చెక్-ఇన్ చేయండి, తర్వాతి ఫోటో అప్‌లోడ్ చేయండి.',
    loginTitle: 'లాగిన్', loginSub: 'మీ విభాగం ఇచ్చిన యూజర్‌నేమ్, పాస్‌వర్డ్ వాడండి.', username: 'యూజర్‌నేమ్', password: 'పాస్‌వర్డ్',
    loginBtn: 'లాగిన్', loggingIn: 'లాగిన్ అవుతోంది…', forgot: 'పాస్‌వర్డ్ మర్చిపోయారా? మీ విభాగాన్ని రీసెట్ చేయమని అడగండి.',
    hello: 'నమస్తే, {name} 👋', todayLine: '{date} · చేయాల్సిన పనులు {n}', navJobs: 'పనులు', navMap: 'మ్యాప్', navHistory: 'చరిత్ర', navProfile: 'ప్రొఫైల్',
    sToDo: 'చేయాలి', sWorking: 'చేస్తున్నవి', sDoneToday: 'ఈరోజు పూర్తి', workingNow: 'ఇప్పుడు చేస్తున్నది', since: '{t} క్రితం ప్రారంభం', toDo: 'చేయాల్సినవి',
    waiting: 'విభాగం తనిఖీ కోసం', noJobs: 'ప్రస్తుతం పనులు లేవు', noJobsSub: 'కొత్త పనులు శబ్దంతో ఇక్కడ కనిపిస్తాయి.',
    newTag: 'కొత్త', high: 'అధిక ప్రాధాన్యత', overdue: 'గడువు దాటింది', left: '{t} మిగిలింది', late: '{t} ఆలస్యం', away: '{d} దూరం', sentBack: 'తిరిగి పంపారు - మళ్ళీ శుభ్రం చేయండి',
    mapHint: 'పని తెరవడానికి పిన్‌ను నొక్కండి. నీలి చుక్క = మీరు.', historyTitle: 'పూర్తైన పనులు', noHistory: 'పూర్తైన పనులు ఇక్కడ కనిపిస్తాయి.',
    approved: 'ఆమోదించారు ✓', waitingShort: 'తనిఖీలో ఉంది', before: 'ముందు', after: 'తర్వాత',
    changePw: 'పాస్‌వర్డ్ మార్చండి', language: 'భాష', sound: 'అలర్ట్ శబ్దం', on: 'ఆన్', off: 'ఆఫ్', logout: 'లాగౌట్',
    oldPw: 'ప్రస్తుత పాస్‌వర్డ్', newPw: 'కొత్త పాస్‌వర్డ్ (కనీసం 6 అక్షరాలు)', save: 'సేవ్', pwSaved: 'పాస్‌వర్డ్ మార్చబడింది.',
    stTotal: 'పూర్తైన పనులు', stWeek: 'ఈ వారం', stOnTime: 'సమయానికి', stAvg: 'ఒక్కో పనికి సగటు గం.',
    step1: 'చేరండి', step2: 'చెక్-ఇన్', step3: 'శుభ్రం & ఫోటో', step4: 'పూర్తి',
    goTitle: 'ఆ ప్రదేశానికి వెళ్లండి', navigate: '🧭 దారి చూపించు (Google Maps)', reached: '📍 చేరుకున్నాను - చెక్-ఇన్', gettingGps: 'మీ GPS లొకేషన్ తీసుకుంటోంది…',
    tooFar: 'మీరు {d} మీ దూరంలో ఉన్నారు. చెక్-ఇన్ కోసం స్థలం నుండి {r} మీ లోపల ఉండాలి.', forceDemo: 'అయినా చెక్-ఇన్ (డెమో - ధృవీకరించలేదు అని గుర్తిస్తుంది)',
    gpsFail: 'GPS రాలేదు: {e}', checkedIn: '✅ {t} చెక్-ఇన్ · స్థలం నుండి {m} మీ {v}', checkedInNoGps: '✅ {t} చెక్-ఇన్ · స్థానం తెలియదు (GPS లేదు, ధృవీకరించలేదు)', verified: '(GPS ధృవీకరణ)', notVerified: '(ధృవీకరించలేదు)',
    cleanTitle: 'ప్రదేశాన్ని శుభ్రం చేయండి', cleanSub: 'చెత్తనంతా బండిలో వేయండి. వీలైతే తడి, పొడి చెత్తను వేరుచేయండి.', workingFor: 'పని సమయం',
    photoTitle: 'తర్వాతి ఫోటో తీయండి', photoSub: 'పౌరుడు ఫోటో తీసిన చోటే నిలబడి అదే ప్రదేశాన్ని ఫోటో తీయండి.', tapCam: 'కెమెరా తెరవడానికి నొక్కండి', retake: 'మళ్ళీ తీయడానికి నొక్కండి',
    notePh: 'విభాగానికి గమనిక (ఐచ్ఛికం)', upload: '⬆ అప్‌లోడ్ చేసి పని ముగించండి', uploading: 'అప్‌లోడ్ అవుతోంది…',
    doneTitle: 'పని పూర్తైంది!', doneSub: 'విభాగం మీ ఫోటోను తనిఖీ చేస్తుంది. ఆమోదించగానే మీకు సందేశం వస్తుంది.',
    resolvedTitle: 'విభాగం ఆమోదించింది ✓', deptNote: 'విభాగం గమనిక', reportedAgo: '{t} క్రితం నమోదైంది', people: '{n} మంది ఈ సమస్యను తెలిపారు',
    tNewJob: 'కొత్త పని వచ్చింది', tApproved: 'మీ పని ఆమోదించబడింది ✓', tSentBack: 'తిరిగి పంపారు - మళ్ళీ శుభ్రం చేయండి', close: 'మూసివేయండి'
  }
};
let lang = store('gw_lang') === 'te' ? 'te' : 'en';
const t = (k, v) => { let s = (T[lang] && T[lang][k]) || T.en[k] || k; for (const x in v || {}) s = s.split('{' + x + '}').join(v[x]); return s; };
const catOf = id => (cfg && cfg.categories.find(c => c.id === id)) || { en: id, te: id, icon: '📍' };
const catName = c => (lang === 'te' ? c.te : c.en);

function dur(ms) {
  const m = Math.max(0, Math.round(ms / 60000));
  if (lang === 'te') return m < 60 ? m + ' నిమి.' : m < 2880 ? Math.round(m / 60) + ' గం.' : Math.round(m / 1440) + ' రోజులు';
  return m < 60 ? m + ' min' : m < 2880 ? Math.round(m / 60) + ' hr' : Math.round(m / 1440) + ' days';
}
function dueText(j) { const ms = new Date(j.dueAt) - Date.now(); return ms >= 0 ? t('left', { t: dur(ms) }) : t('late', { t: dur(-ms) }); }

/* ----------------------------- state ----------------------------- */
let token = store('worker_token'), me = null, cfg = null, jobs = [], view = 'jobs', initialized = false;
const prev = new Map(), newIds = new Set(), afterPhotos = {};
let soundOn = store('worker_sound') !== false, myPos = null, wmap = null, wLayer = null, meMarker = null, openJobId = null, tick = null;

/* ----------------------------- language apply ----------------------------- */
function applyLang() {
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('.js-lang-label').forEach(el => { el.textContent = lang === 'te' ? 'English' : 'తెలుగు'; });
  document.querySelectorAll('.js-lang-cur').forEach(el => { el.textContent = lang === 'te' ? 'తెలుగు' : 'English'; });
  document.title = lang === 'te' ? 'కార్మికుల యాప్ - క్లీన్ గుడ్లవల్లేరు' : 'Worker App - Clean Gudlavalleru';
  setSound();
  if (me) { renderAll(); if (openJobId) openJob(openJobId); }
}
document.querySelectorAll('.js-lang').forEach(b => b.onclick = () => { lang = lang === 'te' ? 'en' : 'te'; store('gw_lang', lang); applyLang(); });

/* ----------------------------- login ----------------------------- */
$('eyeBtn').onclick = () => { const p = $('lp'); p.type = p.type === 'password' ? 'text' : 'password'; $('eyeBtn').textContent = p.type === 'password' ? '👁️' : '🙈'; };
async function doLogin() {
  $('loginMsg').innerHTML = '';
  const b = $('loginBtn'); b.disabled = true; b.textContent = t('loggingIn');
  try {
    const out = await api('/api/login', { method: 'POST', body: { username: $('lu').value, password: $('lp').value, portal: 'worker' } });
    token = out.token; store('worker_token', token); unlockAudio(); await start();
  } catch (e) { $('loginMsg').innerHTML = `<div class="msg err">${esc(e.message)}</div>`; }
  finally { b.disabled = false; b.textContent = t('loginBtn'); }
}
$('loginBtn').onclick = doLogin;
$('lp').onkeydown = e => { if (e.key === 'Enter') doLogin(); };
$('lu').onkeydown = e => { if (e.key === 'Enter') $('lp').focus(); };
$('logoutBtn').onclick = async () => { try { await api('/api/logout', { method: 'POST', token }); } catch {} store('worker_token', null); location.reload(); };
function showLogin() { $('loginView').classList.remove('hidden'); $('appView').classList.add('hidden'); setTimeout(() => $('lu').focus(), 50); }

/* ----------------------------- sound / alerts ----------------------------- */
let audioCtx = null;
function unlockAudio() { try { audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)(); if (audioCtx.state === 'suspended') audioCtx.resume(); } catch {} }
document.addEventListener('pointerdown', unlockAudio, { once: true });
function beep(kind) {
  const tapped = !navigator.userActivation || navigator.userActivation.hasBeenActive;
  if (navigator.vibrate && tapped) navigator.vibrate(kind === 'new' ? [250, 120, 250] : [150]);
  if (!soundOn || !audioCtx) return;
  const notes = kind === 'new' ? [784, 988, 1175] : kind === 'ok' ? [660, 990] : [523, 392];
  notes.forEach((f, i) => {
    const o = audioCtx.createOscillator(), g = audioCtx.createGain(), at = audioCtx.currentTime + i * .15;
    o.type = 'triangle'; o.frequency.value = f;
    g.gain.setValueAtTime(.0001, at); g.gain.exponentialRampToValueAtTime(.3, at + .02); g.gain.exponentialRampToValueAtTime(.0001, at + .26);
    o.connect(g).connect(audioCtx.destination); o.start(at); o.stop(at + .28);
  });
}
function setSound() {
  $('soundBtn').textContent = soundOn ? '🔔' : '🔕';
  $('soundState').textContent = t(soundOn ? 'on' : 'off');
}
function toggleSound() { soundOn = !soundOn; store('worker_sound', soundOn); unlockAudio(); setSound(); if (soundOn) beep('ok'); }
$('soundBtn').onclick = toggleSound; $('soundBtn2').onclick = toggleSound;

function toast(j, title, color) {
  const c = catOf(j.category);
  const el = document.createElement('div');
  el.className = 'toast'; el.style.setProperty('--tc', color);
  el.innerHTML = `<img src="${esc(j.photoBefore)}" alt=""><div><b>${esc(title)}</b>${c.icon} ${esc(catName(c))}<br><small>${esc(j.id)}</small></div>`;
  el.onclick = () => { el.remove(); openJob(j.id); };
  $('toasts').appendChild(el);
  while ($('toasts').children.length > 3) $('toasts').firstChild.remove();
  setTimeout(() => el.remove(), 9000);
}
function detect() {
  let s = null;
  for (const j of jobs) {
    const p = prev.get(j.id);
    if (initialized) {
      if (!p && j.status === 'assigned') { newIds.add(j.id); toast(j, t('tNewJob'), '#3b82f6'); s = 'new'; }
      else if (p && p !== 'resolved' && j.status === 'resolved') { toast(j, t('tApproved'), '#16a34a'); s = s || 'ok'; }
      else if (p === 'completed' && j.status === 'assigned') { newIds.add(j.id); toast(j, t('tSentBack'), '#ef4444'); s = s || 'back'; }
    }
    prev.set(j.id, j.status);
  }
  initialized = true;
  if (s) beep(s);
  const n = newIds.size;
  $('jobsDot').textContent = n; $('jobsDot').classList.toggle('hidden', !n);
}

/* ----------------------------- GPS ----------------------------- */
function distM(a, b, c, d) {
  const R = 6371000, r = x => x * Math.PI / 180, dLat = r(c - a), dLng = r(d - b);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a)) * Math.cos(r(c)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}
const fmtDist = m => m < 1000 ? m + (lang === 'te' ? ' మీ' : ' m') : (m / 1000).toFixed(1) + (lang === 'te' ? ' కి.మీ' : ' km');
function watchGps() {
  if (!navigator.geolocation) return;
  navigator.geolocation.watchPosition(p => {
    myPos = { lat: p.coords.latitude, lng: p.coords.longitude };
    if (view === 'jobs') renderJobs();
    if (wmap) placeMe();
  }, () => {}, { enableHighAccuracy: true, maximumAge: 30000, timeout: 20000 });
}

/* ----------------------------- data ----------------------------- */
async function load() {
  try { jobs = await api('/api/worker/jobs', { token }); }
  catch (e) { if (e.status === 401) { store('worker_token', null); location.reload(); } return; }
  detect();
  renderAll();
  if (openJobId) {
    const j = jobs.find(x => x.id === openJobId);
    const busy = document.activeElement && $('sheet').contains(document.activeElement) && document.activeElement.tagName === 'INPUT';
    if (j && !busy && !afterPhotos[j.id] && !$('sheetInner').querySelector('.msg')) openJob(openJobId, true);
  }
}

/* ----------------------------- navigation ----------------------------- */
function go(v) {
  view = v;
  document.querySelectorAll('.bnav button').forEach(b => b.classList.toggle('on', b.dataset.view === v));
  ['jobs', 'map', 'history', 'profile'].forEach(k => $('v-' + k).classList.toggle('hidden', k !== v));
  window.scrollTo({ top: 0 });
  renderAll();
}
document.querySelectorAll('.bnav button').forEach(b => b.onclick = () => go(b.dataset.view));
$('meAv').onclick = () => go('profile');

function renderAll() {
  const todo = jobs.filter(j => j.status === 'assigned');
  $('hello').textContent = t('hello', { name: me.name.split(' ')[0] });
  $('meZone').textContent = me.zoneName;
  $('todayLine').textContent = t('todayLine', { date: new Date().toLocaleDateString(lang === 'te' ? 'te-IN' : 'en-IN', { weekday: 'long', day: 'numeric', month: 'long' }), n: todo.length });
  ({ jobs: renderJobs, map: renderMap, history: renderHistory, profile: renderProfile })[view]();
}

/* ----------------------------- JOBS ----------------------------- */
function jobCard(j) {
  const c = catOf(j.category);
  const d = myPos ? distM(myPos.lat, myPos.lng, j.lat, j.lng) : null;
  return `<div class="jcard ${j.priority === 'high' ? 'high' : ''}" data-id="${esc(j.id)}">
    ${newIds.has(j.id) ? `<span class="newdot">${t('newTag')}</span>` : ''}
    <img src="${esc(j.photoBefore)}" alt="">
    <div style="min-width:0;flex:1">
      <h3>${c.icon} ${esc(catName(c))}</h3>
      <div class="hint" style="font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(j.description || j.id)}</div>
      <div class="meta">
        ${j.sentBack ? `<span class="pill2 red">↩ ${t('sentBack')}</span>` : ''}
        ${j.priority === 'high' ? `<span class="pill2 red">⚡ ${t('high')}</span>` : ''}
        <span class="pill2 ${j.overdue ? 'red' : 'amber'}">⏱ ${dueText(j)}</span>
        ${d != null ? `<span class="pill2 blue">📍 ${t('away', { d: fmtDist(d) })}</span>` : ''}
      </div>
    </div></div>`;
}
function renderJobs() {
  const todo = jobs.filter(j => j.status === 'assigned').sort((a, b) => (b.sentBack - a.sentBack) || ((b.priority === 'high') - (a.priority === 'high')) || a.dueAt.localeCompare(b.dueAt));
  const working = jobs.filter(j => j.status === 'in_progress');
  const waiting = jobs.filter(j => j.status === 'completed');
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const doneToday = jobs.filter(j => j.completion && new Date(j.completion.at) >= today).length;
  $('sumRow').innerHTML = `<div class="sum"><b style="color:#dc2626">${todo.length}</b><span>${t('sToDo')}</span></div>
    <div class="sum"><b style="color:#2563eb">${working.length}</b><span>${t('sWorking')}</span></div>
    <div class="sum"><b style="color:#16a34a">${doneToday}</b><span>${t('sDoneToday')}</span></div>`;
  $('nowBox').innerHTML = working.map(j => {
    const c = catOf(j.category);
    return `<div class="sec">🔥 ${t('workingNow')}</div><div class="now" data-id="${esc(j.id)}"><img src="${esc(j.photoBefore)}" alt="">
      <div><div class="lbl">${esc(j.id)}</div><h3>${c.icon} ${esc(catName(c))}</h3><div style="font-size:14px;opacity:.95">⏱ ${t('since', { t: dur(Date.now() - new Date(j.checkIn.at)) })}</div></div><div class="go">›</div></div>`;
  }).join('');
  let html = '';
  if (todo.length) html += `<div class="sec">📋 ${t('toDo')} <span class="n">${todo.length}</span></div>` + todo.map(jobCard).join('');
  if (waiting.length) html += `<div class="sec">🟣 ${t('waiting')} <span class="n">${waiting.length}</span></div>` + waiting.map(jobCard).join('');
  if (!todo.length && !working.length && !waiting.length) html = `<div class="sec"></div><div class="empty2"><div>🎉</div><strong>${t('noJobs')}</strong><p style="margin:4px 0 0">${t('noJobsSub')}</p></div>`;
  $('jobsList').innerHTML = html;
  document.querySelectorAll('#v-jobs [data-id]').forEach(el => el.onclick = () => openJob(el.dataset.id));
}

/* ----------------------------- MAP ----------------------------- */
function placeMe() {
  if (!myPos) return;
  if (!meMarker) meMarker = L.circleMarker([myPos.lat, myPos.lng], { radius: 9, color: '#fff', weight: 3, fillColor: '#2563eb', fillOpacity: 1 }).addTo(wmap);
  else meMarker.setLatLng([myPos.lat, myPos.lng]);
}
function renderMap() {
  if (!wmap) {
    wmap = baseMap('wmap', cfg);
    const z = cfg.zones.find(z => z.id === me.zoneId);
    if (z) { drawZones(wmap, cfg.zones, z.id); wmap.fitBounds(z.polygon); }
    wLayer = L.layerGroup().addTo(wmap);
  }
  setTimeout(() => wmap.invalidateSize(), 60);
  wLayer.clearLayers();
  jobs.filter(j => ['assigned', 'in_progress'].includes(j.status)).forEach(j => {
    const c = catOf(j.category);
    L.marker([j.lat, j.lng], { icon: pinIcon(j.status === 'in_progress' ? '#f97316' : j.priority === 'high' ? '#dc2626' : '#2563eb') })
      .addTo(wLayer).bindTooltip(`${c.icon} ${esc(catName(c))}`).on('click', () => openJob(j.id));
  });
  placeMe();
}

/* ----------------------------- HISTORY ----------------------------- */
function renderHistory() {
  const list = jobs.filter(j => ['completed', 'resolved'].includes(j.status)).sort((a, b) => (b.completion?.at || '').localeCompare(a.completion?.at || ''));
  $('historyList').innerHTML = list.length ? list.map(j => {
    const c = catOf(j.category);
    return `<div class="hist" data-id="${esc(j.id)}">
      <div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><strong>${c.icon} ${esc(catName(c))}</strong>
      <span class="pill2 ${j.status === 'resolved' ? 'green' : 'blue'}">${j.status === 'resolved' ? t('approved') : t('waitingShort')}</span></div>
      <div class="hint" style="font-size:12px">${esc(j.id)} · ${fmtTime(j.completion && j.completion.at)}</div>
      <div class="pics"><div><img src="${esc(j.photoBefore)}" alt=""><small>${t('before')}</small></div><div><img src="${esc(j.completion ? j.completion.photo : j.photoBefore)}" alt=""><small>${t('after')}</small></div></div>
    </div>`;
  }).join('') : `<div class="empty2"><div>🗂️</div>${t('noHistory')}</div>`;
  document.querySelectorAll('#historyList [data-id]').forEach(el => el.onclick = () => openJob(el.dataset.id));
}

/* ----------------------------- PROFILE ----------------------------- */
function renderProfile() {
  $('pAv').textContent = me.name[0]; $('pName').textContent = me.name;
  $('pInfo').textContent = `@${me.username} · ${me.zoneName}`;
  const done = jobs.filter(j => j.completion);
  const resolved = jobs.filter(j => j.status === 'resolved');
  const week = new Date(); week.setDate(week.getDate() - 7);
  const onTime = resolved.filter(j => new Date(j.resolvedAt) <= new Date(j.dueAt)).length;
  const timed = done.filter(j => j.checkIn);
  const avg = timed.length ? Math.round(timed.reduce((s, j) => s + (new Date(j.completion.at) - new Date(j.assignedAt || j.checkIn.at)), 0) / timed.length / 36e5 * 10) / 10 : '—';
  $('pStats').innerHTML = `<div><b style="color:#16a34a">${done.length}</b><span>${t('stTotal')}</span></div>
    <div><b>${done.filter(j => new Date(j.completion.at) >= week).length}</b><span>${t('stWeek')}</span></div>
    <div><b style="color:#2563eb">${resolved.length ? Math.round(onTime / resolved.length * 100) + '%' : '—'}</b><span>${t('stOnTime')}</span></div>
    <div><b>${avg}</b><span>${t('stAvg')}</span></div>`;
}
$('pwBtn').onclick = () => { $('pwForm').classList.toggle('hidden'); $('pwMsg').innerHTML = ''; if (!$('pwForm').classList.contains('hidden')) $('pwOld').focus(); };
$('pwForm').onsubmit = async e => {
  e.preventDefault();
  try {
    await api('/api/worker/password', { method: 'POST', token, body: { old: $('pwOld').value, password: $('pwNew').value } });
    $('pwMsg').innerHTML = `<div class="msg ok">${t('pwSaved')}</div>`; $('pwOld').value = ''; $('pwNew').value = '';
  } catch (er) { $('pwMsg').innerHTML = `<div class="msg err">${esc(er.message)}</div>`; }
};

/* ----------------------------- JOB SHEET ----------------------------- */
function openJob(id, silent) {
  const j = jobs.find(x => x.id === id); if (!j) return;
  openJobId = id;
  if (newIds.delete(id)) detectBadge();
  const c = catOf(j.category);
  const stepIdx = j.status === 'assigned' ? 0 : j.status === 'in_progress' ? 2 : 3;
  const steps = ['step1', 'step2', 'step3', 'step4'].map((k, i) => `<div class="${i < stepIdx ? 'done' : i === stepIdx ? 'cur' : ''}"><i></i>${t(k)}</div>`).join('');
  const d = myPos ? distM(myPos.lat, myPos.lng, j.lat, j.lng) : null;
  let body = '';
  if (j.lastNote && ['assigned', 'in_progress'].includes(j.status)) body += `<div class="${j.sentBack ? 'warn-box' : 'note-box'}" style="margin:0 0 12px">📝 <b>${t('deptNote')}:</b> ${esc(j.lastNote)}</div>`;
  if (j.status === 'assigned') {
    body += `<div class="stepcard"><h3><span class="num">1</span>${t('goTitle')}</h3>
      ${d != null ? `<div class="hint">📍 ${t('away', { d: fmtDist(d) })}</div>` : ''}
      <div id="jmap" class="map" style="height:200px;margin:10px 0"></div>
      <a class="btn light block" href="${mapsLink(j.lat, j.lng)}" target="_blank">${t('navigate')}</a>
      <button class="btn blue bigbtn" id="checkBtn" style="margin-top:10px">${t('reached')}</button>
      <div id="checkMsg"></div></div>`;
  } else if (j.status === 'in_progress') {
    const ph = afterPhotos[j.id];
    body += `<div class="msg ok" style="margin-top:0">${j.checkIn.distance == null ? t('checkedInNoGps', { t: fmtTime(j.checkIn.at) }) : t('checkedIn', { t: fmtTime(j.checkIn.at), m: j.checkIn.distance, v: j.checkIn.verified ? t('verified') : t('notVerified') })}</div>
      <div class="stepcard"><h3><span class="num">2</span>${t('cleanTitle')}</h3><p class="hint" style="margin:0">${t('cleanSub')}</p>
        <div style="margin-top:10px" class="hint">${t('workingFor')}</div><div class="timer" id="timer">00:00</div></div>
      <div class="stepcard"><h3><span class="num">3</span>${t('photoTitle')}</h3><p class="hint" style="margin:0 0 10px">${t('photoSub')}</p>
        <label class="cam"><span>📷</span>${ph ? t('retake') : t('tapCam')}<input type="file" accept="image/*" capture="environment" hidden id="afterInput"></label>
        ${ph ? `<div class="ba" style="margin-top:10px"><figure><img src="${esc(j.photoBefore)}"><figcaption>${t('before')}</figcaption></figure><figure><img src="${ph}"><figcaption>${t('after')}</figcaption></figure></div>` : ''}
        <input type="text" id="afterNote" placeholder="${esc(t('notePh'))}" style="margin-top:10px">
        <button class="btn bigbtn" id="uploadBtn" style="margin-top:12px" ${ph ? '' : 'disabled'}>${t('upload')}</button>
        <div id="upMsg"></div></div>`;
  } else {
    body += `<div class="stepcard" style="text-align:center"><div style="font-size:52px">${j.status === 'resolved' ? '🏆' : '⏳'}</div>
      <h3 style="justify-content:center">${j.status === 'resolved' ? t('resolvedTitle') : t('doneTitle')}</h3>
      ${j.status === 'resolved' ? '' : `<p class="hint">${t('doneSub')}</p>`}
      <div class="ba" style="margin-top:10px"><figure><img src="${esc(j.photoBefore)}"><figcaption>${t('before')}</figcaption></figure><figure><img src="${esc(j.completion ? j.completion.photo : '')}"><figcaption>${t('after')}</figcaption></figure></div></div>`;
  }
  $('sheetInner').innerHTML = `
    <div class="hero"><img src="${esc(j.photoBefore)}" alt=""><button class="back" id="sheetBack" aria-label="${esc(t('close'))}">←</button>
      <div class="tagx">${j.priority === 'high' ? `<span class="pill2 red">⚡ ${t('high')}</span>` : ''}${['assigned', 'in_progress'].includes(j.status) ? `<span class="pill2 ${j.overdue ? 'red' : 'amber'}">⏱ ${dueText(j)}</span>` : ''}</div></div>
    <div class="content">
      <h2 class="ff" style="margin:0;font-size:23px">${c.icon} ${esc(catName(c))}</h2>
      <div class="hint">${esc(j.id)} · ${t('reportedAgo', { t: dur(Date.now() - new Date(j.createdAt)) })}${j.supporters > 1 ? ' · 👥 ' + t('people', { n: j.supporters }) : ''}</div>
      ${j.description ? `<p style="margin:8px 0 12px;font-size:16px">${esc(j.description)}</p>` : '<div style="height:10px"></div>'}
      <div class="stepper">${steps}</div>
      ${body}
    </div>`;
  if (!silent) $('sheetInner').scrollTop = 0;
  $('sheet').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  $('sheetBack').onclick = closeJob;

  if ($('jmap')) {
    const m = L.map('jmap', { zoomControl: false }).setView([j.lat, j.lng], 16);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(m);
    L.marker([j.lat, j.lng], { icon: pinIcon('#dc2626') }).addTo(m);
    if (myPos) { L.circleMarker([myPos.lat, myPos.lng], { radius: 8, color: '#fff', weight: 3, fillColor: '#2563eb', fillOpacity: 1 }).addTo(m); L.polyline([[myPos.lat, myPos.lng], [j.lat, j.lng]], { color: '#2563eb', dashArray: '6 8', weight: 3 }).addTo(m); m.fitBounds([[myPos.lat, myPos.lng], [j.lat, j.lng]], { padding: [30, 30], maxZoom: 17 }); }
  }
  if ($('checkBtn')) $('checkBtn').onclick = () => checkIn(j, false);
  if ($('afterInput')) $('afterInput').onchange = async e => {
    const f = e.target.files[0]; if (!f) return;
    try { afterPhotos[j.id] = await compressImage(f); openJob(j.id, true); } catch (er) { alert(er.message); }
  };
  if ($('uploadBtn')) $('uploadBtn').onclick = () => upload(j);
  clearInterval(tick);
  if ($('timer')) {
    const upd = () => { const s = Math.max(0, Math.floor((Date.now() - new Date(j.checkIn.at)) / 1000)); const el = $('timer'); if (el) el.textContent = `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor(s / 60) % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };
    upd(); tick = setInterval(upd, 1000);
  }
}
function detectBadge() { $('jobsDot').textContent = newIds.size; $('jobsDot').classList.toggle('hidden', !newIds.size); if (view === 'jobs') renderJobs(); }
function closeJob() { $('sheet').classList.add('hidden'); document.body.style.overflow = ''; openJobId = null; clearInterval(tick); }
document.addEventListener('keydown', e => { if (e.key === 'Escape' && openJobId) closeJob(); });

async function checkIn(j, force, pos) {
  const box = $('checkMsg');
  if (!pos) {
    box.innerHTML = `<div class="msg info">${t('gettingGps')}</div>`;
    try { pos = await getGps(); }
    catch (e) {
      box.innerHTML = `<div class="msg err">${esc(t('gpsFail', { e: e.message }))}</div>${cfg.demoMode ? `<button class="btn light block" id="forceBtn">${t('forceDemo')}</button>` : ''}`;
      if ($('forceBtn')) $('forceBtn').onclick = () => checkIn(j, true, { lat: null, lng: null });
      return;
    }
  }
  try {
    const out = await api(`/api/worker/jobs/${encodeURIComponent(j.id)}/checkin`, { method: 'POST', token, body: { lat: pos.lat, lng: pos.lng, force } });
    if (!out.ok) {
      box.innerHTML = `<div class="msg err">${t('tooFar', { d: out.distance, r: out.radius })}</div>${out.canForce ? `<button class="btn light block" id="forceBtn">${t('forceDemo')}</button>` : ''}`;
      if ($('forceBtn')) $('forceBtn').onclick = () => checkIn(j, true, pos);
      return;
    }
    beep('ok');
    await load(); openJob(j.id);
  } catch (e) { box.innerHTML = `<div class="msg err">${esc(e.message)}</div>`; }
}
async function upload(j) {
  const b = $('uploadBtn'); b.disabled = true; b.textContent = t('uploading');
  let pos = {};
  try { pos = await getGps(8000); } catch {}
  try {
    await api(`/api/worker/jobs/${encodeURIComponent(j.id)}/complete`, { method: 'POST', token, body: { photo: afterPhotos[j.id], lat: pos.lat, lng: pos.lng, note: $('afterNote').value } });
    delete afterPhotos[j.id];
    beep('ok');
    await load(); openJob(j.id);
  } catch (e) { $('upMsg').innerHTML = `<div class="msg err">${esc(e.message)}</div>`; b.disabled = false; b.textContent = t('upload'); }
}

/* ----------------------------- start ----------------------------- */
let poll = null;
async function start() {
  try { me = await api('/api/me', { token }); } catch { store('worker_token', null); token = null; return showLogin(); }
  if (me.role !== 'worker') { store('worker_token', null); token = null; return showLogin(); }
  $('loginView').classList.add('hidden'); $('appView').classList.remove('hidden');
  $('meAv').textContent = me.name[0];
  await load();
  watchGps();
  clearInterval(poll); poll = setInterval(load, 15000);
}
(async () => {
  applyLang();
  cfg = await api('/api/config');
  if (token) start(); else showLogin();
})();
