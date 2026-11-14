// =====================================================================
//  Sanitary Department Portal
// =====================================================================
const $ = id => document.getElementById(id);

/* ----------------------------- language ----------------------------- */
const T = {
  en: {
    brand: 'Clean Gudlavalleru', loginHero: 'Sanitary Department Portal',
    loginLead: 'Receive complaints from citizens, send workers, verify the cleaning and keep Gudlavalleru clean.',
    f1: 'Complaints from your zone only, with photo and GPS', f2: 'Assign workers and see who is on site', f3: 'Verify before & after photos', f4: 'Live alerts, charts and Excel reports',
    backSite: '← Back to website', welcome: 'Welcome back', loginSub: 'Log in with your department account. Each department sees only complaints from its own area.',
    username: 'Username', password: 'Password', login: 'Log in', loggingIn: 'Logging in…', demoHint: 'Demo accounts: see HOW-TO-RUN.md (admin, north, southwest, southeast).',
    portalName: 'Sanitary Department Portal', navOverview: 'Overview', navComplaints: 'Complaints', navMap: 'Map', navWorkers: 'Workers', navAnalytics: 'Analytics',
    soundOn: 'Sound on', soundOff: 'Sound off', logout: 'Log out', live: 'Live · updated {s}', justNow: 'just now', secAgo: '{n}s ago',
    trendTitle: 'Complaints in the last 14 days', received: 'Received', solved: 'Solved', needsAttention: 'Needs your attention', viewAll: 'View all ›',
    statusTitle: 'Complaints by status', workersNow: 'Workers right now', manage: 'Manage ›', searchPh: 'Search ID, text or worker…', export: 'Excel (CSV)',
    heatmap: 'Hotspot heatmap', workersHint: 'Field workers in your zone. Add new workers, reset passwords or remove workers who left.', addWorker: 'Add worker',
    trend30: 'Received vs solved - last 30 days', byType: 'Problems by type', workerPerf: 'Worker performance', hotspots: 'Garbage hotspots',
    hotspotsHint: 'Darker red = more complaints. Place extra dustbins or awareness boards here.',
    kTotal: 'Total received', kPending: 'Pending', kProgress: 'Solving in progress', kVerify: 'Waiting for your check', kSolved: 'Solved', kOverdue: 'Overdue', kOutside: 'Outside all zones',
    allStatuses: 'All statuses', fPending: 'Pending (not started)', fReceived: 'New - not assigned', fAssigned: 'Worker assigned', fInProgress: 'Cleaning in progress',
    fCompleted: 'Waiting for your check', fResolved: 'Solved', fOverdue: 'Overdue', fRejected: 'Fake / not valid', allTypes: 'All problem types', allZones: 'All zones', outsideZones: 'Outside all zones',
    thPhoto: 'Photo', thProblem: 'Problem', thReported: 'Reported', thStatus: 'Status', thWorker: 'Worker', noMatch: 'No complaints match these filters.',
    highPri: 'High priority', overdue: 'Overdue', newTag: 'NEW', rOverdue: 'Overdue', rVerify: 'Check the after photo', rNew: 'New - assign a worker', nothingAttn: '🎉 Nothing needs attention right now.',
    onSite: 'On site at {id}', busyN: '{n} job(s) assigned', free: 'Free', noWorkers: 'No workers in this zone yet.',
    wActive: 'Active', wDone: 'Done', wAvg: 'Avg hrs', resetPw: '🔑 Reset password', remove: '🗑 Remove', removeConfirm: 'Remove {name}? They will no longer be able to log in.',
    addTitle: 'Add a new worker', name: 'Full name', phone: 'Phone number', zone: 'Zone', save: 'Save', cancel: 'Cancel', newPw: 'New password (min 6 characters)',
    pwTitle: 'Reset password for {name}', pwSaved: 'Password changed for {name}.', workerAdded: '{name} added. They can log in to the Worker app now.', workerRemoved: '{name} removed.',
    aAvg: 'Avg time to solve', aOnTime: 'Solved on time', aWeek: 'Solved this week', aRepeat: 'Spots reported 2+ times', aSpam: 'Fake reports blocked', hrs: 'hrs',
    pWorker: 'Worker', pAssigned: 'Jobs', pSolved: 'Solved', pOpen: 'Open', pAvg: 'Avg hrs', pOnTime: 'On time', pSentBack: 'Sent back',
    reported: 'Reported', deadline: 'Deadline', details: 'Details', citizenReports: 'Citizen reports', citizenPhone: 'Citizen phone', notGiven: 'Not given',
    workerL: 'Worker', notAssigned: 'Not assigned', checkin: 'On-site check-in', cleaningDone: 'Cleaning done', before: 'Before (citizen photo)', after: 'After (worker photo)',
    noAfter: 'No after photo yet', openMaps: 'Open in Google Maps ↗', history: 'History', workerSaysDone: '✔ Worker says cleaning is done. Check the after photo.',
    notePh: 'Note (optional)', approve: 'Approve - mark as Solved', sendBack: 'Not clean - send back', assignTitle: '👷 Assign a worker', reassignTitle: '👷 Re-assign worker',
    assign: 'Assign', reassign: 'Re-assign', normalPri: 'Normal priority', highPriOpt: 'High priority', instrPh: 'Instruction for worker (optional)', noZoneWorkers: 'No workers in this zone',
    sendZone: '🏢 Send to a zone', move: 'Move', markFake: '🚫 Mark as fake / not valid', fakeConfirm: 'Mark this report as fake / not valid? It will be closed.',
    gpsOk: '✅ GPS verified', gpsNot: '⚠ not verified', mFromSpot: '{m} m from spot', noGpsLoc: 'location unknown (no GPS)', photoFrom: 'photo taken {m} m from spot', activeN: '{n} active', onSiteShort: 'on site',
    tNew: 'New complaint', tDone: 'Cleaning done - please verify', tPlus: 'Reported again (+1)', allZonesTitle: 'All zones - Gudlavalleru', all: 'All', left: 'left', overdueBy: 'overdue',
    deptLoginOnly: 'Workers please use the Worker app.'
  },
  te: {
    brand: 'క్లీన్ గుడ్లవల్లేరు', loginHero: 'పారిశుధ్య విభాగం పోర్టల్',
    loginLead: 'పౌరుల ఫిర్యాదులు స్వీకరించండి, కార్మికులను పంపండి, శుభ్రతను తనిఖీ చేయండి, గుడ్లవల్లేరును శుభ్రంగా ఉంచండి.',
    f1: 'మీ జోన్ ఫిర్యాదులు మాత్రమే, ఫోటో మరియు GPS తో', f2: 'కార్మికులను నియమించండి, ఎవరు స్థలంలో ఉన్నారో చూడండి', f3: 'ముందు & తర్వాత ఫోటోలు తనిఖీ చేయండి', f4: 'లైవ్ అలర్ట్‌లు, చార్ట్‌లు, Excel నివేదికలు',
    backSite: '← వెబ్‌సైట్‌కు వెనక్కి', welcome: 'స్వాగతం', loginSub: 'మీ విభాగం ఖాతాతో లాగిన్ అవ్వండి. ప్రతి విభాగం తమ ప్రాంత ఫిర్యాదులను మాత్రమే చూస్తుంది.',
    username: 'యూజర్‌నేమ్', password: 'పాస్‌వర్డ్', login: 'లాగిన్', loggingIn: 'లాగిన్ అవుతోంది…', demoHint: 'డెమో ఖాతాలు: HOW-TO-RUN.md చూడండి (admin, north, southwest, southeast).',
    portalName: 'పారిశుధ్య విభాగం పోర్టల్', navOverview: 'సారాంశం', navComplaints: 'ఫిర్యాదులు', navMap: 'మ్యాప్', navWorkers: 'కార్మికులు', navAnalytics: 'విశ్లేషణ',
    soundOn: 'శబ్దం ఆన్', soundOff: 'శబ్దం ఆఫ్', logout: 'లాగౌట్', live: 'లైవ్ · {s} అప్‌డేట్', justNow: 'ఇప్పుడే', secAgo: '{n} సెకన్ల క్రితం',
    trendTitle: 'గత 14 రోజుల ఫిర్యాదులు', received: 'అందినవి', solved: 'పరిష్కరించినవి', needsAttention: 'మీ దృష్టి అవసరం', viewAll: 'అన్నీ చూడండి ›',
    statusTitle: 'స్థితి వారీగా ఫిర్యాదులు', workersNow: 'ఇప్పుడు కార్మికులు', manage: 'నిర్వహించండి ›', searchPh: 'ID, వివరాలు లేదా కార్మికుడి పేరు వెతకండి…', export: 'Excel (CSV)',
    heatmap: 'హాట్‌స్పాట్ హీట్‌మ్యాప్', workersHint: 'మీ జోన్ కార్మికులు. కొత్త కార్మికులను చేర్చండి, పాస్‌వర్డ్ మార్చండి లేదా వెళ్లిపోయినవారిని తొలగించండి.', addWorker: 'కార్మికుడిని చేర్చండి',
    trend30: 'అందినవి vs పరిష్కరించినవి - గత 30 రోజులు', byType: 'సమస్య రకం వారీగా', workerPerf: 'కార్మికుల పనితీరు', hotspots: 'చెత్త హాట్‌స్పాట్‌లు',
    hotspotsHint: 'ముదురు ఎరుపు = ఎక్కువ ఫిర్యాదులు. ఇక్కడ అదనపు డబ్బాలు లేదా అవగాహన బోర్డులు పెట్టండి.',
    kTotal: 'మొత్తం అందినవి', kPending: 'పెండింగ్', kProgress: 'పరిష్కారంలో', kVerify: 'మీ తనిఖీ కోసం', kSolved: 'పరిష్కరించినవి', kOverdue: 'గడువు దాటినవి', kOutside: 'జోన్ల బయట',
    allStatuses: 'అన్ని స్థితులు', fPending: 'పెండింగ్ (ప్రారంభం కానివి)', fReceived: 'కొత్తవి - నియమించలేదు', fAssigned: 'కార్మికుడిని నియమించారు', fInProgress: 'శుభ్రం చేస్తున్నారు',
    fCompleted: 'మీ తనిఖీ కోసం', fResolved: 'పరిష్కరించినవి', fOverdue: 'గడువు దాటినవి', fRejected: 'నకిలీ / చెల్లనివి', allTypes: 'అన్ని సమస్య రకాలు', allZones: 'అన్ని జోన్లు', outsideZones: 'జోన్ల బయట',
    thPhoto: 'ఫోటో', thProblem: 'సమస్య', thReported: 'నమోదు', thStatus: 'స్థితి', thWorker: 'కార్మికుడు', noMatch: 'ఈ ఫిల్టర్లకు సరిపోయే ఫిర్యాదులు లేవు.',
    highPri: 'అధిక ప్రాధాన్యత', overdue: 'గడువు దాటింది', newTag: 'కొత్త', rOverdue: 'గడువు దాటింది', rVerify: 'తర్వాతి ఫోటో తనిఖీ చేయండి', rNew: 'కొత్తది - కార్మికుడిని నియమించండి', nothingAttn: '🎉 ప్రస్తుతం దృష్టి అవసరమైనవి ఏవీ లేవు.',
    onSite: '{id} వద్ద ఉన్నారు', busyN: '{n} పని(లు) నియమించారు', free: 'ఖాళీ', noWorkers: 'ఈ జోన్‌లో ఇంకా కార్మికులు లేరు.',
    wActive: 'చురుకైనవి', wDone: 'పూర్తి', wAvg: 'సగటు గం.', resetPw: '🔑 పాస్‌వర్డ్ మార్చండి', remove: '🗑 తొలగించండి', removeConfirm: '{name} ను తొలగించాలా? వారు ఇక లాగిన్ కాలేరు.',
    addTitle: 'కొత్త కార్మికుడిని చేర్చండి', name: 'పూర్తి పేరు', phone: 'ఫోన్ నంబర్', zone: 'జోన్', save: 'సేవ్', cancel: 'రద్దు', newPw: 'కొత్త పాస్‌వర్డ్ (కనీసం 6 అక్షరాలు)',
    pwTitle: '{name} పాస్‌వర్డ్ మార్చండి', pwSaved: '{name} పాస్‌వర్డ్ మార్చబడింది.', workerAdded: '{name} చేర్చబడ్డారు. ఇప్పుడు వర్కర్ యాప్‌లో లాగిన్ కావచ్చు.', workerRemoved: '{name} తొలగించబడ్డారు.',
    aAvg: 'పరిష్కారానికి సగటు సమయం', aOnTime: 'సమయానికి పరిష్కరించినవి', aWeek: 'ఈ వారం పరిష్కరించినవి', aRepeat: '2+ సార్లు నమోదైన ప్రదేశాలు', aSpam: 'అడ్డుకున్న నకిలీ ఫిర్యాదులు', hrs: 'గం.',
    pWorker: 'కార్మికుడు', pAssigned: 'పనులు', pSolved: 'పూర్తి', pOpen: 'పెండింగ్', pAvg: 'సగటు గం.', pOnTime: 'సమయానికి', pSentBack: 'తిరిగి పంపినవి',
    reported: 'నమోదు', deadline: 'గడువు', details: 'వివరాలు', citizenReports: 'పౌరుల ఫిర్యాదులు', citizenPhone: 'పౌరుడి ఫోన్', notGiven: 'ఇవ్వలేదు',
    workerL: 'కార్మికుడు', notAssigned: 'నియమించలేదు', checkin: 'స్థలంలో చెక్-ఇన్', cleaningDone: 'శుభ్రత పూర్తి', before: 'ముందు (పౌరుడి ఫోటో)', after: 'తర్వాత (కార్మికుడి ఫోటో)',
    noAfter: 'ఇంకా తర్వాతి ఫోటో లేదు', openMaps: 'Google Maps లో తెరవండి ↗', history: 'చరిత్ర', workerSaysDone: '✔ శుభ్రం చేశామని కార్మికుడు చెప్పారు. తర్వాతి ఫోటో తనిఖీ చేయండి.',
    notePh: 'గమనిక (ఐచ్ఛికం)', approve: 'ఆమోదించండి - పరిష్కరించినట్లు గుర్తించండి', sendBack: 'శుభ్రంగా లేదు - తిరిగి పంపండి', assignTitle: '👷 కార్మికుడిని నియమించండి', reassignTitle: '👷 కార్మికుడిని మార్చండి',
    assign: 'నియమించండి', reassign: 'మార్చండి', normalPri: 'సాధారణ ప్రాధాన్యత', highPriOpt: 'అధిక ప్రాధాన్యత', instrPh: 'కార్మికుడికి సూచన (ఐచ్ఛికం)', noZoneWorkers: 'ఈ జోన్‌లో కార్మికులు లేరు',
    sendZone: '🏢 జోన్‌కు పంపండి', move: 'పంపండి', markFake: '🚫 నకిలీ / చెల్లనిదిగా గుర్తించండి', fakeConfirm: 'ఈ ఫిర్యాదును నకిలీగా గుర్తించాలా? ఇది మూసివేయబడుతుంది.',
    gpsOk: '✅ GPS ధృవీకరించబడింది', gpsNot: '⚠ ధృవీకరించలేదు', mFromSpot: 'స్థలం నుండి {m} మీ', noGpsLoc: 'స్థానం తెలియదు (GPS లేదు)', photoFrom: 'స్థలం నుండి {m} మీ దూరంలో ఫోటో', activeN: '{n} చురుకైనవి', onSiteShort: 'స్థలంలో',
    tNew: 'కొత్త ఫిర్యాదు', tDone: 'శుభ్రత పూర్తి - తనిఖీ చేయండి', tPlus: 'మళ్ళీ నమోదైంది (+1)', allZonesTitle: 'అన్ని జోన్లు - గుడ్లవల్లేరు', all: 'అన్నీ', left: 'మిగిలి ఉంది', overdueBy: 'గడువు దాటింది',
    deptLoginOnly: 'కార్మికులు వర్కర్ యాప్ వాడండి.'
  }
};
let lang = store('gw_lang') === 'te' ? 'te' : 'en';
const t = (k, v) => { let s = (T[lang] && T[lang][k]) || T.en[k] || k; for (const x in v || {}) s = s.split('{' + x + '}').join(v[x]); return s; };
const LT = (en, te) => (lang === 'te' && te ? te : en);
const stLabel = s => LT((STATUS[s] || {}).en || s, (STATUS[s] || {}).te);

function agoL(iso) {
  const m = Math.round((Date.now() - new Date(iso)) / 60000);
  if (lang !== 'te') return timeAgo(iso);
  if (m < 1) return 'ఇప్పుడే';
  if (m < 60) return m + ' నిమి. క్రితం';
  const h = Math.round(m / 60);
  return h < 48 ? h + ' గం. క్రితం' : Math.round(h / 24) + ' రోజుల క్రితం';
}
function leftL(iso) {
  const m = Math.round((new Date(iso) - Date.now()) / 60000), a = Math.abs(m);
  const v = a < 60 ? a + (lang === 'te' ? ' నిమి.' : ' min') : a < 2880 ? Math.round(a / 60) + (lang === 'te' ? ' గం.' : ' hr') : Math.round(a / 1440) + (lang === 'te' ? ' రోజులు' : ' days');
  return v + ' ' + (m >= 0 ? t('left') : t('overdueBy'));
}

/* ----------------------------- state ----------------------------- */
let token = store('dept_token'), me = null, cfg = null, reports = [], workers = [], stats = null;
let view = 'overview', lastUpdate = 0, initialized = false;
const prev = new Map();          // id -> {status, supporters}
const newIds = new Set();
let soundOn = store('dept_sound') !== false;
let dmap = null, markerLayer = null, heatLayer = null, hmap = null, hheat = null, mapFilter = '';
const charts = {};

const catOf = id => (cfg && cfg.categories.find(c => c.id === id)) || { en: id, te: id, icon: '📍' };
const catName = c => LT(c.en, c.te);
const zoneName = r => r.zoneId ? (cfg.zones.find(z => z.id === r.zoneId) || {}).name : t('outsideZones');

/* ----------------------------- language apply ----------------------------- */
function applyLang() {
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-ph]').forEach(el => { el.placeholder = t(el.dataset.i18nPh); });
  document.querySelectorAll('.js-lang-label').forEach(el => { el.textContent = lang === 'te' ? 'English' : 'తెలుగు'; });
  document.title = LT('Sanitary Department Portal - Clean Gudlavalleru', 'పారిశుధ్య విభాగం పోర్టల్ - క్లీన్ గుడ్లవల్లేరు');
  setSoundLabel();
  if (me) { buildFilters(); renderAll(); }
}
document.querySelectorAll('.js-lang').forEach(b => b.onclick = () => { lang = lang === 'te' ? 'en' : 'te'; store('gw_lang', lang); applyLang(); });

/* ----------------------------- login ----------------------------- */
$('eyeBtn').onclick = () => { const p = $('lp'); p.type = p.type === 'password' ? 'text' : 'password'; $('eyeBtn').textContent = p.type === 'password' ? '👁️' : '🙈'; };
async function doLogin() {
  $('loginMsg').innerHTML = '';
  const btn = $('loginBtn'); btn.disabled = true; btn.textContent = t('loggingIn');
  try {
    const out = await api('/api/login', { method: 'POST', body: { username: $('lu').value, password: $('lp').value, portal: 'department' } });
    token = out.token; store('dept_token', token);
    unlockAudio();
    await start();
  } catch (e) { $('loginMsg').innerHTML = `<div class="msg err">${esc(e.message)}</div>`; }
  finally { btn.disabled = false; btn.textContent = t('login'); }
}
$('loginBtn').onclick = doLogin;
$('lp').onkeydown = e => { if (e.key === 'Enter') doLogin(); };
$('lu').onkeydown = e => { if (e.key === 'Enter') $('lp').focus(); };
$('logoutBtn').onclick = async () => { try { await api('/api/logout', { method: 'POST', token }); } catch {} store('dept_token', null); location.reload(); };
function showLogin() {
  $('loginView').classList.remove('hidden'); $('appView').classList.add('hidden');
  const box = $('loginView').querySelector('.login-art');
  if (!box.querySelector('.leaf')) for (let i = 0; i < 10; i++) {
    const l = document.createElement('span'); l.className = 'leaf';
    l.style.left = (Math.random() * 100) + '%'; l.style.animationDuration = (9 + Math.random() * 10) + 's'; l.style.animationDelay = (-Math.random() * 15) + 's';
    box.appendChild(l);
  }
  setTimeout(() => $('lu').focus(), 50);
}

/* ----------------------------- sound & alerts ----------------------------- */
let audioCtx = null;
function unlockAudio() { try { audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)(); if (audioCtx.state === 'suspended') audioCtx.resume(); } catch {} }
document.addEventListener('pointerdown', unlockAudio, { once: true });
function beep(kind) {
  if (!soundOn || !audioCtx) return;
  const notes = kind === 'new' ? [880, 1175] : [660, 880, 1046];
  notes.forEach((f, i) => {
    const o = audioCtx.createOscillator(), g = audioCtx.createGain(), at = audioCtx.currentTime + i * 0.16;
    o.type = 'sine'; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(0.25, at + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, at + 0.28);
    o.connect(g).connect(audioCtx.destination); o.start(at); o.stop(at + 0.3);
  });
}
function setSoundLabel() { $('soundBtn').innerHTML = (soundOn ? '🔔 ' : '🔕 ') + `<span>${t(soundOn ? 'soundOn' : 'soundOff')}</span>`; }
$('soundBtn').onclick = () => { soundOn = !soundOn; store('dept_sound', soundOn); unlockAudio(); setSoundLabel(); if (soundOn) beep('new'); };

function toast(r, kind) {
  const c = catOf(r.category);
  const title = kind === 'new' ? t('tNew') : kind === 'done' ? t('tDone') : t('tPlus');
  const color = kind === 'new' ? '#ef4444' : kind === 'done' ? '#7c3aed' : '#f59e0b';
  const el = document.createElement('div');
  el.className = 'toast'; el.style.setProperty('--tc', color);
  el.innerHTML = `<img src="${esc(kind === 'done' && r.completion ? r.completion.photo : r.photoBefore)}" alt=""><div><b>${esc(title)}</b>${c.icon} ${esc(catName(c))}<br><small>${esc(r.id)}${r.workerName && kind === 'done' ? ' · ' + esc(r.workerName) : ''}</small></div><button class="x" aria-label="Close">×</button>`;
  el.onclick = e => { if (e.target.classList.contains('x')) { el.remove(); return; } el.remove(); openReport(r.id); };
  $('toasts').appendChild(el);
  while ($('toasts').children.length > 4) $('toasts').firstChild.remove();
  setTimeout(() => el.remove(), 12000);
}

function detectChanges() {
  let sound = null;
  for (const r of reports) {
    const p = prev.get(r.id);
    if (initialized) {
      if (!p && r.status === 'received') { newIds.add(r.id); toast(r, 'new'); sound = 'new'; }
      else if (p && p.status !== 'completed' && r.status === 'completed') { toast(r, 'done'); sound = sound || 'done'; }
      else if (p && r.supporters > p.supporters) { toast(r, 'plus'); sound = sound || 'new'; }
    }
    prev.set(r.id, { status: r.status, supporters: r.supporters });
  }
  initialized = true;
  if (sound) beep(sound);
  updateNewBadge();
}
function updateNewBadge() {
  for (const id of [...newIds]) { const r = reports.find(x => x.id === id); if (!r || r.status !== 'received') newIds.delete(id); }
  const pending = reports.filter(r => ['received'].includes(r.status)).length;
  const n = newIds.size || pending;
  $('newCount').textContent = n; $('newCount').classList.toggle('hidden', !n);
  document.title = (newIds.size ? `(${newIds.size}) ` : '') + LT('Sanitary Department Portal - Clean Gudlavalleru', 'పారిశుధ్య విభాగం పోర్టల్ - క్లీన్ గుడ్లవల్లేరు');
}

/* ----------------------------- data ----------------------------- */
async function refresh() {
  try {
    ({ reports, stats, workers } = await api('/api/dept/dashboard', { token }));
  } catch (e) {
    if (e.status === 401) { store('dept_token', null); location.reload(); }
    return;
  }
  lastUpdate = Date.now();
  detectChanges();
  renderAll();
}
setInterval(() => {
  if (!lastUpdate) return;
  const s = Math.round((Date.now() - lastUpdate) / 1000);
  $('liveText').textContent = t('live', { s: s < 3 ? t('justNow') : t('secAgo', { n: s }) });
}, 1000);

/* ----------------------------- navigation ----------------------------- */
const TITLES = { overview: 'navOverview', complaints: 'navComplaints', map: 'navMap', workers: 'navWorkers', analytics: 'navAnalytics' };
function go(v) {
  view = v;
  document.querySelectorAll('.nav button').forEach(b => b.classList.toggle('on', b.dataset.view === v));
  Object.keys(TITLES).forEach(k => $('v-' + k).classList.toggle('hidden', k !== v));
  $('sidebar').classList.remove('open');
  if (v === 'complaints') { setTimeout(() => { newIds.clear(); updateNewBadge(); }, 4000); }
  renderAll();
  window.scrollTo({ top: 0 });
}
document.querySelectorAll('.nav button').forEach(b => b.onclick = () => go(b.dataset.view));
document.querySelectorAll('[data-goto]').forEach(b => b.onclick = () => go(b.dataset.goto));
$('hamb').onclick = () => $('sidebar').classList.toggle('open');

function renderAll() {
  if (!stats) return;
  $('pageTitle').textContent = t(TITLES[view]);
  $('pageSub').textContent = (me.role === 'super' ? t('allZonesTitle') : me.zoneName) + ' · ' +
    new Date().toLocaleDateString(lang === 'te' ? 'te-IN' : 'en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
  ({ overview: renderOverview, complaints: renderComplaints, map: renderMap, workers: renderWorkers, analytics: renderAnalytics })[view]();
}

/* ----------------------------- shared bits ----------------------------- */
const valid = () => reports.filter(r => r.status !== 'rejected');
const OPEN = ['received', 'assigned', 'in_progress', 'completed'];
function dayKey(d) { const x = new Date(d); return x.getFullYear() + '-' + (x.getMonth() + 1) + '-' + x.getDate(); }
function lastDays(n) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - i); out.push(d); }
  return out;
}
function trendData(n) {
  const days = lastDays(n), rec = {}, sol = {};
  for (const r of valid()) {
    rec[dayKey(r.createdAt)] = (rec[dayKey(r.createdAt)] || 0) + 1;
    if (r.resolvedAt) sol[dayKey(r.resolvedAt)] = (sol[dayKey(r.resolvedAt)] || 0) + 1;
  }
  return {
    labels: days.map(d => d.toLocaleDateString(lang === 'te' ? 'te-IN' : 'en-IN', { day: 'numeric', month: 'short' })),
    rec: days.map(d => rec[dayKey(d)] || 0), sol: days.map(d => sol[dayKey(d)] || 0)
  };
}
const INK = '#0f172a', MUTED = '#64748b', GRID = '#eef2f7';
function lineChart(id, n) {
  const d = trendData(n);
  const cfgC = {
    type: 'line',
    data: { labels: d.labels, datasets: [
      { label: t('received'), data: d.rec, borderColor: '#2563eb', backgroundColor: '#2563eb', borderWidth: 2, pointRadius: 4, pointHoverRadius: 6, pointBorderColor: '#fff', pointBorderWidth: 2, tension: 0 },
      { label: t('solved'), data: d.sol, borderColor: '#16a34a', backgroundColor: '#16a34a', borderWidth: 2, pointRadius: 4, pointHoverRadius: 6, pointBorderColor: '#fff', pointBorderWidth: 2, tension: 0 }
    ] },
    options: {
      maintainAspectRatio: false, animation: { duration: 400 },
      interaction: { mode: 'index', intersect: false },
      plugins: { legend: { display: false }, tooltip: { backgroundColor: '#0f172a', padding: 10, cornerRadius: 10, boxPadding: 4, usePointStyle: true } },
      scales: {
        x: { grid: { display: false }, ticks: { color: MUTED, maxRotation: 0, autoSkip: true, maxTicksLimit: 8 }, border: { color: GRID } },
        y: { beginAtZero: true, ticks: { color: MUTED, precision: 0 }, grid: { color: GRID }, border: { display: false } }
      }
    }
  };
  if (charts[id]) { charts[id].data = cfgC.data; charts[id].update('none'); }
  else charts[id] = new Chart($(id), cfgC);
}

/* ----------------------------- OVERVIEW ----------------------------- */
function kpiTiles(target, list) {
  $(target).innerHTML = list.map(k => `<div class="kpi" style="--c:${k.c};--bg2:${k.bg}" data-f="${k.f || ''}" role="button" tabindex="0">
    <div class="ki">${k.i}</div><div class="num ff">${k.n}</div><div class="lbl">${esc(k.l)}</div></div>`).join('');
  $(target).querySelectorAll('.kpi').forEach(el => el.onclick = () => {
    if (el.dataset.f === '') return;
    if (el.dataset.f === 'nozone') { $('fZone').value = 'none'; $('fStatus').value = ''; }
    else { $('fStatus').value = el.dataset.f; if (me.role === 'super') $('fZone').value = ''; }
    go('complaints');
  });
}
function renderOverview() {
  const tiles = [
    { i: '📥', n: stats.received, l: t('kTotal'), c: '#0f172a', bg: '#f1f5f9', f: 'all' },
    { i: '🔴', n: stats.pending, l: t('kPending'), c: '#dc2626', bg: '#fee2e2', f: 'pending' },
    { i: '🧹', n: stats.inProgress, l: t('kProgress'), c: '#2563eb', bg: '#dbeafe', f: 'in_progress' },
    { i: '🔍', n: stats.awaitingVerify, l: t('kVerify'), c: '#7c3aed', bg: '#ede9fe', f: 'completed' },
    { i: '✅', n: stats.solved, l: t('kSolved'), c: '#16a34a', bg: '#dcfce7', f: 'resolved' },
    { i: '⏰', n: stats.overdue, l: t('kOverdue'), c: '#7f1d1d', bg: '#fee2e2', f: 'overdue' }
  ];
  if (me.role === 'super') tiles.push({ i: '🧭', n: stats.unassignedZone, l: t('kOutside'), c: '#d97706', bg: '#fef3c7', f: 'nozone' });
  kpiTiles('kpis', tiles);
  lineChart('trendChart', 14);

  // needs attention
  const open = reports.filter(r => OPEN.includes(r.status));
  const items = [
    ...open.filter(r => r.overdue).map(r => ({ r, why: t('rOverdue'), c: '#b91c1c', o: 0 })),
    ...open.filter(r => !r.overdue && r.status === 'completed').map(r => ({ r, why: t('rVerify'), c: '#7c3aed', o: 1 })),
    ...open.filter(r => !r.overdue && r.status === 'received').map(r => ({ r, why: t('rNew'), c: '#dc2626', o: 2 }))
  ].sort((a, b) => a.o - b.o || (b.r.priority === 'high') - (a.r.priority === 'high')).slice(0, 6);
  $('attnList').innerHTML = items.length ? items.map(({ r, why, c }) => {
    const cat = catOf(r.category);
    return `<div class="attn" data-id="${esc(r.id)}"><img src="${esc(r.status === 'completed' && r.completion ? r.completion.photo : r.photoBefore)}" alt="">
      <div style="flex:1;min-width:0"><strong>${cat.icon} ${esc(catName(cat))}</strong>${newIds.has(r.id) ? ` <span class="badge" style="background:#ef4444;color:#fff">${t('newTag')}</span>` : ''}
      <div class="why" style="color:${c}">● ${esc(why)}</div><div class="hint" style="font-size:12px">${esc(r.id)} · ${agoL(r.createdAt)}</div></div>
      ${r.priority === 'high' ? `<span class="badge b-high">${t('highPri')}</span>` : ''}</div>`;
  }).join('') : `<div class="empty">${t('nothingAttn')}</div>`;
  $('attnList').querySelectorAll('.attn').forEach(el => el.onclick = () => openReport(el.dataset.id));

  // status bars
  const S = [['received', '#dc2626'], ['assigned', '#d97706'], ['in_progress', '#2563eb'], ['completed', '#7c3aed'], ['resolved', '#16a34a'], ['rejected', '#64748b']];
  const counts = Object.fromEntries(S.map(([s]) => [s, reports.filter(r => r.status === s).length]));
  const max = Math.max(1, ...Object.values(counts));
  $('statusBars').innerHTML = S.map(([s, c]) => `<div class="bar-row"><span>${badge(s, lang)}</span>
    <div class="track" title="${esc(stLabel(s))}: ${counts[s]}"><div class="fill" style="width:${counts[s] / max * 100}%;background:${c}"></div></div><b>${counts[s]}</b></div>`).join('');

  // workers now
  $('workersNow').innerHTML = workers.length ? workers.map(w => workerStateRow(w)).join('') : `<div class="empty">${t('noWorkers')}</div>`;
}
function workerState(w) {
  if (w.onSiteAt) return { txt: t('onSite', { id: w.onSiteAt.reportId }), c: '#2563eb', bg: '#dbeafe' };
  if (w.activeJobs) return { txt: t('busyN', { n: w.activeJobs }), c: '#b45309', bg: '#fef3c7' };
  return { txt: t('free'), c: '#15803d', bg: '#dcfce7' };
}
function workerStateRow(w) {
  const s = workerState(w);
  return `<div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--line)">
    <div class="avatar" style="width:38px;height:38px;border-radius:12px;background:#ffedd5;color:#c2410c;font-weight:800;display:flex;align-items:center;justify-content:center">${esc(w.name[0])}</div>
    <div style="flex:1;min-width:0"><strong>${esc(w.name)}</strong><div class="hint" style="font-size:12px">✅ ${w.completedJobs} ${t('wDone')}${me.role === 'super' ? ' · ' + esc(w.zoneName) : ''}</div></div>
    <span class="state" style="color:${s.c};background:${s.bg}"><i></i>${esc(s.txt)}</span></div>`;
}

/* ----------------------------- COMPLAINTS ----------------------------- */
function buildFilters() {
  const keep = { s: $('fStatus').value, c: $('fCat').value, z: $('fZone').value };
  const opts = [['', 'allStatuses'], ['pending', 'fPending'], ['received', 'fReceived'], ['assigned', 'fAssigned'], ['in_progress', 'fInProgress'],
    ['completed', 'fCompleted'], ['resolved', 'fResolved'], ['overdue', 'fOverdue'], ['rejected', 'fRejected']];
  $('fStatus').innerHTML = opts.map(([v, k]) => `<option value="${v}">${esc(t(k))}</option>`).join('');
  $('fCat').innerHTML = `<option value="">${esc(t('allTypes'))}</option>` + cfg.categories.map(c => `<option value="${c.id}">${c.icon} ${esc(catName(c))}</option>`).join('');
  if (me.role === 'super') {
    $('fZone').classList.remove('hidden');
    $('fZone').innerHTML = `<option value="">${esc(t('allZones'))}</option><option value="none">${esc(t('outsideZones'))}</option>` + cfg.zones.map(z => `<option value="${z.id}">${esc(z.name)}</option>`).join('');
  }
  $('fStatus').value = keep.s === 'all' ? '' : keep.s; $('fCat').value = keep.c; $('fZone').value = keep.z;
}
function filtered() {
  const st = $('fStatus').value === 'all' ? '' : $('fStatus').value, cat = $('fCat').value, zone = $('fZone').value, q = $('fSearch').value.trim().toLowerCase();
  return reports.filter(r => {
    if (st === 'pending' && !['received', 'assigned'].includes(r.status)) return false;
    if (st === 'in_progress' && !['in_progress', 'completed'].includes(r.status)) return false;
    if (st === 'overdue' && !r.overdue) return false;
    if (st && !['pending', 'in_progress', 'overdue'].includes(st) && r.status !== st) return false;
    if (!st && r.status === 'rejected') return false;
    if (cat && r.category !== cat) return false;
    if (zone === 'none' && r.zoneId) return false;
    if (zone && zone !== 'none' && r.zoneId !== zone) return false;
    if (q && !(r.id.toLowerCase().includes(q) || (r.description || '').toLowerCase().includes(q) || (r.workerName || '').toLowerCase().includes(q))) return false;
    return true;
  });
}
function renderComplaints() {
  const list = filtered();
  if (!list.length) { $('listView').innerHTML = `<div class="empty">${t('noMatch')}</div>`; return; }
  $('listView').innerHTML = `<table><thead><tr><th>${t('thPhoto')}</th><th>${t('thProblem')}</th><th class="hide-sm">${t('thReported')}</th><th>${t('thStatus')}</th><th class="hide-sm">${t('thWorker')}</th></tr></thead><tbody>
    ${list.map(r => {
      const c = catOf(r.category);
      return `<tr class="clickable" data-id="${esc(r.id)}" style="${newIds.has(r.id) ? 'background:#fef2f2' : ''}">
        <td><img class="thumb" src="${esc(r.photoBefore)}" alt=""></td>
        <td><strong>${c.icon} ${esc(catName(c))}</strong> ${newIds.has(r.id) ? `<span class="badge" style="background:#ef4444;color:#fff">${t('newTag')}</span>` : ''}
          <div class="hint">${esc(r.id)}${r.supporters > 1 ? ` · 👥 ${r.supporters}` : ''}${me.role === 'super' ? ' · ' + esc(zoneName(r)) : ''}</div>
          ${r.priority === 'high' ? `<span class="badge b-high">${t('highPri')}</span> ` : ''}${r.overdue ? `<span class="badge b-overdue">${t('overdue')}</span>` : ''}
          <div class="hint show-sm">${agoL(r.createdAt)}${['resolved', 'rejected'].includes(r.status) ? '' : ' · ⏱ ' + leftL(r.dueAt)}${r.workerName ? ' · 👷 ' + esc(r.workerName) : ''}</div></td>
        <td class="hide-sm">${agoL(r.createdAt)}<div class="hint">${['resolved', 'rejected'].includes(r.status) ? '' : leftL(r.dueAt)}</div></td>
        <td>${badge(r.status, lang)}</td>
        <td class="hide-sm">${esc(r.workerName || '—')}</td></tr>`;
    }).join('')}</tbody></table>`;
  $('listView').querySelectorAll('tr.clickable').forEach(tr => tr.onclick = () => openReport(tr.dataset.id));
}
['fStatus', 'fCat', 'fZone'].forEach(id => $(id).onchange = renderComplaints);
$('fSearch').oninput = renderComplaints;

$('exportBtn').onclick = () => {
  const rows = [['Tracking ID', 'Problem', 'Zone', 'Status', 'Priority', 'Reported at', 'Deadline', 'Overdue', 'Citizen reports', 'Worker', 'Check-in distance (m)', 'Solved at', 'Latitude', 'Longitude', 'Details']];
  for (const r of filtered()) rows.push([r.id, catOf(r.category).en, zoneName(r), (STATUS[r.status] || {}).en, r.priority, fmtTime(r.createdAt), fmtTime(r.dueAt),
    r.overdue ? 'Yes' : 'No', r.supporters, r.workerName || '', r.checkIn && r.checkIn.distance != null ? r.checkIn.distance : '', fmtTime(r.resolvedAt), r.lat, r.lng, r.description || '']);
  const csv = '﻿' + rows.map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = `complaints-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
};

/* ----------------------------- MAP ----------------------------- */
function renderMap() {
  const S = [['', '#0f172a'], ['received', STATUS_COLOR.received], ['assigned', STATUS_COLOR.assigned], ['in_progress', STATUS_COLOR.in_progress], ['completed', STATUS_COLOR.completed], ['resolved', STATUS_COLOR.resolved]];
  $('mapChips').innerHTML = S.map(([s, c]) => `<button data-s="${s}" class="${mapFilter === s ? 'on' : ''}"><i style="background:${c}"></i>${esc(s ? stLabel(s) : t('all'))}</button>`).join('');
  $('mapChips').querySelectorAll('button').forEach(b => b.onclick = () => { mapFilter = b.dataset.s; renderMap(); });
  if (!dmap) {
    dmap = baseMap('dmap', cfg);
    drawZones(dmap, cfg.zones, me.role === 'super' ? null : me.zoneId);
    markerLayer = L.layerGroup().addTo(dmap);
    if (me.zoneId) dmap.fitBounds(cfg.zones.find(z => z.id === me.zoneId).polygon);
  }
  setTimeout(() => dmap.invalidateSize(), 60);
  markerLayer.clearLayers();
  const list = reports.filter(r => r.status !== 'rejected' && (!mapFilter || r.status === mapFilter));
  for (const r of list) {
    const c = catOf(r.category);
    L.marker([r.lat, r.lng], { icon: pinIcon(STATUS_COLOR[r.status]) }).addTo(markerLayer)
      .bindTooltip(`${c.icon} ${esc(catName(c))} - ${esc(stLabel(r.status))}`).on('click', () => openReport(r.id));
  }
  if (heatLayer) { dmap.removeLayer(heatLayer); heatLayer = null; }
  if ($('heatToggle').checked && L.heatLayer) {
    heatLayer = L.heatLayer(valid().map(r => [r.lat, r.lng, Math.min(1, .4 + r.supporters * .2)]), { radius: 35, blur: 25, maxZoom: 17 }).addTo(dmap);
  }
}
$('heatToggle').onchange = renderMap;

/* ----------------------------- WORKERS ----------------------------- */
function workerStats(w) {
  const jobs = reports.filter(r => r.workerId === w.id && r.status !== 'rejected');
  const solved = jobs.filter(r => r.status === 'resolved');
  const avg = solved.length ? solved.reduce((s, r) => s + (new Date(r.resolvedAt) - new Date(r.createdAt)), 0) / solved.length / 36e5 : null;
  const onTime = solved.filter(r => new Date(r.resolvedAt) <= new Date(r.dueAt)).length;
  const sentBack = jobs.reduce((s, r) => s + r.timeline.filter(x => (x.note || '').startsWith('Sent back')).length, 0);
  return { jobs: jobs.length, solved: solved.length, open: jobs.filter(r => ['assigned', 'in_progress', 'completed'].includes(r.status)).length,
    avg: avg == null ? '—' : Math.round(avg * 10) / 10, onTime: solved.length ? Math.round(onTime / solved.length * 100) + '%' : '—', sentBack };
}
function renderWorkers() {
  $('workerCards').innerHTML = workers.length ? workers.map(w => {
    const s = workerState(w), st = workerStats(w);
    return `<div class="wcard">
      <div class="top"><div class="av">${esc(w.name[0])}</div><div style="flex:1;min-width:0"><strong>${esc(w.name)}</strong>
        <div class="hint" style="font-size:13px">@${esc(w.username)}${w.phone ? ' · 📞 ' + esc(w.phone) : ''}</div>
        ${me.role === 'super' ? `<div class="hint" style="font-size:12px">${esc(w.zoneName)}</div>` : ''}</div></div>
      <div style="margin-top:10px"><span class="state" style="color:${s.c};background:${s.bg}"><i></i>${esc(s.txt)}</span></div>
      <div class="stats"><div><b>${w.activeJobs}</b><span>${t('wActive')}</span></div><div><b>${st.solved}</b><span>${t('wDone')}</span></div><div><b>${st.avg}</b><span>${t('wAvg')}</span></div></div>
      <div style="display:flex;gap:6px"><button class="btn light small" style="flex:1" data-pw="${w.id}">${t('resetPw')}</button><button class="btn light small" style="color:#b91c1c" data-rm="${w.id}">${t('remove')}</button></div>
    </div>`;
  }).join('') : `<div class="panel empty">${t('noWorkers')}</div>`;
  $('workerCards').querySelectorAll('[data-pw]').forEach(b => b.onclick = () => resetPw(workers.find(w => w.id === b.dataset.pw)));
  $('workerCards').querySelectorAll('[data-rm]').forEach(b => b.onclick = () => removeWorker(workers.find(w => w.id === b.dataset.rm)));
}
function formModal(title, fields, onSave) {
  $('modalBody').innerHTML = `<h2 class="ff" style="font-size:22px;margin-right:30px">${esc(title)}</h2>
    ${fields.map(f => f.type === 'select'
      ? `<label for="mf-${f.k}">${esc(f.l)}</label><select id="mf-${f.k}">${f.opts.map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join('')}</select>`
      : `<label for="mf-${f.k}">${esc(f.l)}</label><input id="mf-${f.k}" type="${f.type || 'text'}" ${f.ph ? `placeholder="${esc(f.ph)}"` : ''} autocomplete="off">`).join('')}
    <div id="mfMsg"></div>
    <div style="display:flex;gap:8px;margin-top:18px;justify-content:flex-end"><button class="btn light" id="mfCancel">${t('cancel')}</button><button class="btn" id="mfSave">${t('save')}</button></div>`;
  $('modal').classList.remove('hidden');
  $('modal').querySelector('.modal').style.maxWidth = '460px';
  $('mfCancel').onclick = closeModal;
  $('mfSave').onclick = async () => {
    const vals = Object.fromEntries(fields.map(f => [f.k, $('mf-' + f.k).value]));
    $('mfSave').disabled = true;
    try { await onSave(vals); closeModal(); }
    catch (e) { $('mfMsg').innerHTML = `<div class="msg err">${esc(e.message)}</div>`; }
    finally { const b = $('mfSave'); if (b) b.disabled = false; }
  };
  setTimeout(() => { const first = $('modalBody').querySelector('input'); if (first) first.focus(); }, 50);
}
function notify(msg) {
  const el = document.createElement('div'); el.className = 'toast'; el.style.setProperty('--tc', '#22c55e');
  el.innerHTML = `<div>✅ ${esc(msg)}</div>`; el.onclick = () => el.remove();
  $('toasts').appendChild(el); setTimeout(() => el.remove(), 5000);
}
$('addWorkerBtn').onclick = () => {
  const fields = [{ k: 'name', l: t('name'), ph: 'Ravi Kumar' }, { k: 'username', l: t('username'), ph: 'ravik' }, { k: 'phone', l: t('phone'), type: 'tel', ph: '98XXXXXXXX' }, { k: 'password', l: t('newPw'), type: 'password' }];
  if (me.role === 'super') fields.push({ k: 'zoneId', l: t('zone'), type: 'select', opts: cfg.zones.map(z => [z.id, z.name]) });
  formModal(t('addTitle'), fields, async v => {
    await api('/api/dept/workers', { method: 'POST', token, body: v });
    notify(t('workerAdded', { name: v.name })); await refresh();
  });
};
function resetPw(w) {
  formModal(t('pwTitle', { name: w.name }), [{ k: 'password', l: t('newPw'), type: 'password' }], async v => {
    await api(`/api/dept/workers/${w.id}/password`, { method: 'POST', token, body: v });
    notify(t('pwSaved', { name: w.name }));
  });
}
async function removeWorker(w) {
  if (!confirm(t('removeConfirm', { name: w.name }))) return;
  try { await api(`/api/dept/workers/${w.id}/remove`, { method: 'POST', token }); notify(t('workerRemoved', { name: w.name })); await refresh(); }
  catch (e) { alert(e.message); }
}

/* ----------------------------- ANALYTICS ----------------------------- */
function renderAnalytics() {
  const v = valid(), solved = v.filter(r => r.status === 'resolved');
  const week = new Date(); week.setDate(week.getDate() - 7);
  const onTime = solved.filter(r => new Date(r.resolvedAt) <= new Date(r.dueAt)).length;
  kpiTiles('akpis', [
    { i: '⏱', n: stats.avgResolveHours != null ? `${stats.avgResolveHours} <small style="font-size:15px">${t('hrs')}</small>` : '—', l: t('aAvg'), c: '#2563eb', bg: '#dbeafe', f: '' },
    { i: '🎯', n: solved.length ? Math.round(onTime / solved.length * 100) + '%' : '—', l: t('aOnTime'), c: '#16a34a', bg: '#dcfce7', f: '' },
    { i: '📅', n: solved.filter(r => new Date(r.resolvedAt) >= week).length, l: t('aWeek'), c: '#0f172a', bg: '#f1f5f9', f: '' },
    { i: '👥', n: v.filter(r => r.supporters > 1).length, l: t('aRepeat'), c: '#d97706', bg: '#fef3c7', f: '' },
    { i: '🚫', n: stats.spam, l: t('aSpam'), c: '#64748b', bg: '#f1f5f9', f: '' }
  ]);
  lineChart('trend30Chart', 30);

  // problems by type: single-hue horizontal bars, sorted
  const entries = cfg.categories.map(c => [c, v.filter(r => r.category === c.id).length]).filter(e => e[1] > 0).sort((a, b) => b[1] - a[1]);
  const cmax = Math.max(1, ...entries.map(e => e[1]));
  $('catBars').innerHTML = entries.length ? entries.map(([c, n]) => `<div class="bar-row" style="grid-template-columns:minmax(120px,190px) 1fr 34px">
      <span>${c.icon} ${esc(catName(c))}</span>
      <div class="track" title="${esc(catName(c))}: ${n}"><div class="fill" style="width:${n / cmax * 100}%;background:#16a34a"></div></div><b>${n}</b></div>`).join('')
    : `<div class="empty">—</div>`;

  // worker performance table
  $('perfTable').innerHTML = workers.length ? `<table><thead><tr><th>${t('pWorker')}</th><th>${t('pAssigned')}</th><th>${t('pSolved')}</th><th>${t('pOpen')}</th><th>${t('pAvg')}</th><th>${t('pOnTime')}</th><th>${t('pSentBack')}</th></tr></thead><tbody>
    ${workers.map(w => { const s = workerStats(w); return `<tr><td><strong>${esc(w.name)}</strong>${me.role === 'super' ? `<div class="hint" style="font-size:12px">${esc(w.zoneName)}</div>` : ''}</td><td>${s.jobs}</td><td>${s.solved}</td><td>${s.open}</td><td>${s.avg}</td><td>${s.onTime}</td><td>${s.sentBack}</td></tr>`; }).join('')}
    </tbody></table>` : `<div class="empty">${t('noWorkers')}</div>`;

  // hotspot heat map
  if (!hmap) {
    hmap = baseMap('hmap', cfg);
    drawZones(hmap, cfg.zones, me.role === 'super' ? null : me.zoneId);
    if (me.zoneId) hmap.fitBounds(cfg.zones.find(z => z.id === me.zoneId).polygon);
  }
  setTimeout(() => hmap.invalidateSize(), 60);
  if (hheat) hmap.removeLayer(hheat);
  if (L.heatLayer) hheat = L.heatLayer(v.map(r => [r.lat, r.lng, Math.min(1, .4 + r.supporters * .2)]), { radius: 35, blur: 25, maxZoom: 17 }).addTo(hmap);
}

/* ----------------------------- REPORT DETAIL ----------------------------- */
function openReport(id) {
  const r = reports.find(x => x.id === id); if (!r) return;
  newIds.delete(id); updateNewBadge();
  $('modal').querySelector('.modal').style.maxWidth = '';
  const c = catOf(r.category);
  const zoneWorkers = workers.filter(w => me.role !== 'super' || w.zoneId === r.zoneId);
  const isOpen = OPEN.includes(r.status);
  let actions = '';
  if (r.status === 'completed') {
    actions += `<div class="actions-box"><h3 style="font-size:17px">${t('workerSaysDone')}</h3>
      <input type="text" id="verifyNote" placeholder="${esc(t('notePh'))}">
      <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap"><button class="btn" id="approveBtn">${t('approve')}</button><button class="btn light" id="rejectBtn">${t('sendBack')}</button></div></div>`;
  }
  if (isOpen && r.zoneId) {
    actions += `<div class="actions-box"><h3 style="font-size:17px">${r.workerId ? t('reassignTitle') : t('assignTitle')}</h3>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <select id="aWorker" style="flex:2;min-width:180px">${zoneWorkers.length ? zoneWorkers.map(w => `<option value="${w.id}" ${w.id === r.workerId ? 'selected' : ''}>${esc(w.name)} (${w.onSiteAt ? t('onSiteShort') : t('activeN', { n: w.activeJobs })})</option>`).join('') : `<option value="">${t('noZoneWorkers')}</option>`}</select>
        <select id="aPriority" style="flex:1;min-width:130px"><option value="normal" ${r.priority !== 'high' ? 'selected' : ''}>${t('normalPri')}</option><option value="high" ${r.priority === 'high' ? 'selected' : ''}>${t('highPriOpt')}</option></select>
      </div>
      <input type="text" id="aNote" placeholder="${esc(t('instrPh'))}" style="margin-top:8px">
      <button class="btn blue" id="assignBtn" style="margin-top:10px">${r.workerId ? t('reassign') : t('assign')}</button></div>`;
  }
  if (me.role === 'super' && isOpen) {
    actions += `<div class="actions-box"><h3 style="font-size:17px">${t('sendZone')}</h3><div style="display:flex;gap:8px;flex-wrap:wrap">
      <select id="zSel" style="flex:1;min-width:180px">${cfg.zones.map(z => `<option value="${z.id}" ${z.id === r.zoneId ? 'selected' : ''}>${esc(z.name)}</option>`).join('')}</select>
      <button class="btn light" id="zoneBtn">${t('move')}</button></div></div>`;
  }
  if (isOpen) actions += `<div style="margin-top:14px;text-align:right"><button class="btn danger small" id="spamBtn">${t('markFake')}</button></div>`;

  $('modalBody').innerHTML = `
    <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;padding-right:30px">
      <h2 class="ff" style="margin:0;font-size:22px">${c.icon} ${esc(catName(c))}</h2>${badge(r.status, lang)}
      ${r.priority === 'high' ? `<span class="badge b-high">${t('highPri')}</span>` : ''}${r.overdue ? `<span class="badge b-overdue">${t('overdue')}</span>` : ''}
    </div>
    <div class="hint" style="margin-bottom:12px">${esc(r.id)} · ${esc(zoneName(r))}</div>
    <div class="ba">
      <figure><a href="${esc(r.photoBefore)}" target="_blank"><img src="${esc(r.photoBefore)}" alt="before"></a><figcaption>${t('before')}</figcaption></figure>
      <figure>${r.completion ? `<a href="${esc(r.completion.photo)}" target="_blank"><img src="${esc(r.completion.photo)}" alt="after"></a>` : `<div class="noimg">${t('noAfter')}</div>`}<figcaption>${t('after')}</figcaption></figure>
    </div>
    <div class="grid two" style="margin-top:14px">
      <dl class="kv">
        <dt>${t('reported')}</dt><dd>${fmtTime(r.createdAt)} (${agoL(r.createdAt)})</dd>
        <dt>${t('deadline')}</dt><dd>${fmtTime(r.dueAt)}${isOpen ? ` · <strong style="color:${r.overdue ? '#b91c1c' : 'inherit'}">${leftL(r.dueAt)}</strong>` : ''}</dd>
        <dt>${t('details')}</dt><dd>${esc(r.description || '—')}</dd>
        <dt>${t('citizenReports')}</dt><dd>👥 ${r.supporters}</dd>
        <dt>${t('citizenPhone')}</dt><dd>${r.contactPhone ? `<a href="tel:${esc(r.contactPhone)}">${esc(r.contactPhone)}</a>` : t('notGiven')}</dd>
        <dt>${t('workerL')}</dt><dd>${esc(r.workerName || t('notAssigned'))}</dd>
        <dt>${t('checkin')}</dt><dd>${r.checkIn ? `${fmtTime(r.checkIn.at)} · ${r.checkIn.distance == null ? t('noGpsLoc') : t('mFromSpot', { m: r.checkIn.distance })} ${r.checkIn.verified ? t('gpsOk') : t('gpsNot')}` : '—'}</dd>
        ${r.completion ? `<dt>${t('cleaningDone')}</dt><dd>${fmtTime(r.completion.at)}${r.completion.distance != null ? ' · ' + t('photoFrom', { m: r.completion.distance }) : ''}${r.completion.note ? ' · ' + esc(r.completion.note) : ''}</dd>` : ''}
      </dl>
      <div><div id="miniMap" class="map" style="height:220px"></div><a class="hint" href="${mapsLink(r.lat, r.lng)}" target="_blank">${t('openMaps')}</a></div>
    </div>
    ${actions}
    <h3 style="font-size:17px;margin-top:18px">${t('history')}</h3>
    <ul class="timeline">${r.timeline.slice().reverse().map(x => `<li><div>${esc(x.note)}</div><div class="when">${fmtTime(x.at)} · ${esc(x.byName)}</div></li>`).join('')}</ul>`;
  $('modal').classList.remove('hidden');

  const mm = L.map('miniMap', { zoomControl: false }).setView([r.lat, r.lng], 17);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(mm);
  L.marker([r.lat, r.lng], { icon: pinIcon(STATUS_COLOR[r.status]) }).addTo(mm);
  if (r.checkIn && r.checkIn.lat != null) L.circleMarker([r.checkIn.lat, r.checkIn.lng], { radius: 7, color: '#2563eb' }).addTo(mm).bindTooltip(t('checkin'));

  const act = async (path, body) => {
    try { await api(`/api/dept/reports/${encodeURIComponent(r.id)}/${path}`, { method: 'POST', body, token }); await refresh(); openReport(r.id); }
    catch (e) { alert(e.message); }
  };
  if ($('approveBtn')) $('approveBtn').onclick = () => act('verify', { approve: true, note: $('verifyNote').value });
  if ($('rejectBtn')) $('rejectBtn').onclick = () => act('verify', { approve: false, note: $('verifyNote').value });
  if ($('assignBtn')) $('assignBtn').onclick = () => act('assign', { workerId: $('aWorker').value, priority: $('aPriority').value, note: $('aNote').value });
  if ($('zoneBtn')) $('zoneBtn').onclick = () => act('zone', { zoneId: $('zSel').value });
  if ($('spamBtn')) $('spamBtn').onclick = () => { if (confirm(t('fakeConfirm'))) act('spam', {}); };
}
function closeModal() { $('modal').classList.add('hidden'); }
$('closeModal').onclick = closeModal;
$('modal').onclick = e => { if (e.target === $('modal')) closeModal(); };
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

/* ----------------------------- start ----------------------------- */
let timer = null;
async function start() {
  try { me = await api('/api/me', { token }); }
  catch { store('dept_token', null); token = null; return showLogin(); }
  if (me.role === 'worker') { store('dept_token', null); token = null; $('loginMsg').innerHTML = `<div class="msg err">${esc(t('deptLoginOnly'))}</div>`; return showLogin(); }
  $('loginView').classList.add('hidden'); $('appView').classList.remove('hidden');
  $('meName').textContent = me.name; $('meZone').textContent = me.role === 'super' ? t('allZones') : me.zoneName; $('meAv').textContent = me.name[0];
  buildFilters();
  await refresh();
  clearInterval(timer); timer = setInterval(refresh, 10000);
}

(async () => {
  applyLang();
  cfg = await api('/api/config');
  if (token) start(); else showLogin();
})();
