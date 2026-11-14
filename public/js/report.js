// Citizen app: report, track, my reports

const T = {
  en: {
    brand: 'Clean Gudlavalleru', home: 'Home', tabReport: '📸 Report problem', tabTrack: '🔎 Track report', tabMine: '📋 My reports',
    reportTitle: 'Report a garbage / waste problem',
    reportSub: 'No sign-up needed. Your report goes straight to the sanitary department of that area.',
    s1: 'Take a photo of the place', tapPhoto: 'Tap here to take a photo', changePhoto: 'Tap to change photo',
    s2: 'Location', gpsFinding: 'Finding your location…', gpsOk: 'Location found (accuracy about {m} m).',
    mapHint: 'Drag the pin or tap the map if the spot is not exactly right.', useGps: '📍 Use my current location',
    s3: 'What is the problem?', s4: 'Details (optional)', descPh: 'Example: near the bus stop, since 3 days',
    phoneLbl: 'Mobile number (optional, only if you want updates)', submit: 'Send report', sending: 'Sending…',
    needPhoto: 'Please take a photo of the place first.', needCat: 'Please choose what the problem is.', needLoc: 'Please set the location on the map.',
    zoneIs: 'This area is handled by: {z}', zoneNone: 'This spot is outside our zones. The main sanitary office will forward it.',
    thanks: 'Thank you! Your report was sent.', merged: 'This problem was already reported nearby.',
    sentTo: 'It has been sent to {z}.', mergedText: 'We added your report as support (+1). More reports make it higher priority.',
    yourId: 'Your tracking ID', saveId: 'Save this ID. You can check the status anytime in “Track report”. It is also saved in “My reports” on this phone.',
    viewStatus: 'View status', another: 'Report another problem',
    trackTitle: 'Track your report', check: 'Check', mineTitle: 'My reports (on this phone)', mineEmpty: 'You have not sent any reports from this phone yet.',
    before: 'Before', after: 'After cleaning', afterWait: 'After photo will appear here once cleaned', reportedOn: 'Reported', area: 'Area', reports: 'reports', progress: 'Progress'
  },
  te: {
    brand: 'క్లీన్ గుడ్లవల్లేరు', home: 'హోమ్', tabReport: '📸 సమస్య తెలపండి', tabTrack: '🔎 స్థితి చూడండి', tabMine: '📋 నా ఫిర్యాదులు',
    reportTitle: 'చెత్త / వ్యర్థాల సమస్యను తెలపండి',
    reportSub: 'సైన్-అప్ అవసరం లేదు. మీ ఫిర్యాదు నేరుగా ఆ ప్రాంత పారిశుధ్య విభాగానికి వెళ్తుంది.',
    s1: 'ఆ ప్రదేశం ఫోటో తీయండి', tapPhoto: 'ఫోటో తీయడానికి ఇక్కడ నొక్కండి', changePhoto: 'ఫోటో మార్చడానికి నొక్కండి',
    s2: 'ప్రదేశం', gpsFinding: 'మీ లొకేషన్ కనుగొంటోంది…', gpsOk: 'లొకేషన్ దొరికింది (సుమారు {m} మీ. ఖచ్చితత్వం).',
    mapHint: 'ప్రదేశం సరిగ్గా లేకపోతే పిన్‌ను లాగండి లేదా మ్యాప్‌పై నొక్కండి.', useGps: '📍 నా ప్రస్తుత లొకేషన్ వాడండి',
    s3: 'సమస్య ఏమిటి?', s4: 'వివరాలు (ఐచ్ఛికం)', descPh: 'ఉదా: బస్ స్టాప్ దగ్గర, 3 రోజులుగా',
    phoneLbl: 'మొబైల్ నంబర్ (ఐచ్ఛికం, అప్‌డేట్స్ కావాలంటే మాత్రమే)', submit: 'ఫిర్యాదు పంపండి', sending: 'పంపుతోంది…',
    needPhoto: 'దయచేసి ముందుగా ఆ ప్రదేశం ఫోటో తీయండి.', needCat: 'దయచేసి సమస్య రకాన్ని ఎంచుకోండి.', needLoc: 'దయచేసి మ్యాప్‌పై ప్రదేశాన్ని సెట్ చేయండి.',
    zoneIs: 'ఈ ప్రాంతం బాధ్యత: {z}', zoneNone: 'ఈ ప్రదేశం మా జోన్ల బయట ఉంది. ప్రధాన పారిశుధ్య కార్యాలయం దీన్ని పంపిస్తుంది.',
    thanks: 'ధన్యవాదాలు! మీ ఫిర్యాదు పంపబడింది.', merged: 'ఈ సమస్య ఇప్పటికే దగ్గరలో నమోదైంది.',
    sentTo: 'ఇది {z} కు పంపబడింది.', mergedText: 'మీ ఫిర్యాదును మద్దతుగా (+1) జోడించాము. ఎక్కువ ఫిర్యాదులు వస్తే ప్రాధాన్యత పెరుగుతుంది.',
    yourId: 'మీ ట్రాకింగ్ ID', saveId: 'ఈ IDని గుర్తుంచుకోండి. “స్థితి చూడండి”లో ఎప్పుడైనా చూడవచ్చు. ఇది ఈ ఫోన్‌లో “నా ఫిర్యాదులు”లో కూడా ఉంటుంది.',
    viewStatus: 'స్థితి చూడండి', another: 'మరో సమస్య తెలపండి',
    trackTitle: 'మీ ఫిర్యాదు స్థితి', check: 'చూడండి', mineTitle: 'నా ఫిర్యాదులు (ఈ ఫోన్‌లో)', mineEmpty: 'ఈ ఫోన్ నుండి ఇంకా ఫిర్యాదులు పంపలేదు.',
    before: 'ముందు', after: 'శుభ్రం చేసిన తర్వాత', afterWait: 'శుభ్రం చేశాక ఫోటో ఇక్కడ కనిపిస్తుంది', reportedOn: 'నమోదు', area: 'ప్రాంతం', reports: 'ఫిర్యాదులు', progress: 'పురోగతి'
  }
};
let lang = store('gw_lang') || 'en';
const t = (k, vars) => { let s = (T[lang] && T[lang][k]) || T.en[k] || k; for (const v in vars || {}) s = s.replace('{' + v + '}', vars[v]); return s; };

const $ = id => document.getElementById(id);
let cfg, map, marker, photoData = null, chosenCat = null, loc = null;

function applyLang() {
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-t]').forEach(el => { el.textContent = t(el.dataset.t); });
  document.querySelectorAll('[data-tp]').forEach(el => { el.placeholder = t(el.dataset.tp); });
  $('langBtn').textContent = lang === 'en' ? 'తెలుగు' : 'English';
  if (photoData) $('photoDrop').querySelector('[data-t]').textContent = t('changePhoto');
  if (cfg) { renderCats(); showZone(); }
}
$('langBtn').onclick = () => { lang = lang === 'en' ? 'te' : 'en'; store('gw_lang', lang); applyLang(); if (!$('tab-mine').classList.contains('hidden')) loadMine(); };

// When shown inside the home page, follow the home page's language switch
window.addEventListener('message', e => {
  if (e.origin !== location.origin || !e.data || !e.data.gwLang) return;
  lang = e.data.gwLang === 'te' ? 'te' : 'en';
  applyLang();
  if (!$('tab-mine').classList.contains('hidden')) loadMine();
  if ($('trackResult').innerHTML && $('trackInput').value) track();
});

// ---------- tabs ----------
function showTab(name) {
  document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
  ['report', 'track', 'mine'].forEach(n => $('tab-' + n).classList.toggle('hidden', n !== name));
  if (name === 'report' && map) setTimeout(() => map.invalidateSize(), 50);
  if (name === 'mine') loadMine();
}
document.querySelectorAll('.tabs button').forEach(b => b.onclick = () => showTab(b.dataset.tab));

// ---------- report form ----------
function renderCats() {
  $('catGrid').innerHTML = cfg.categories.map(c =>
    `<div class="cat-opt ${c.id === chosenCat ? 'sel' : ''}" data-id="${c.id}" role="button" tabindex="0"><span class="ico">${c.icon}</span>${esc(lang === 'te' ? c.te : c.en)}</div>`).join('');
  $('catGrid').querySelectorAll('.cat-opt').forEach(el => el.onclick = el.onkeydown = (e) => {
    if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
    chosenCat = el.dataset.id; renderCats();
  });
}

function pointInPolygon(lat, lng, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [yi, xi] = poly[i], [yj, xj] = poly[j];
    if (((yi > lat) !== (yj > lat)) && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
}
function showZone() {
  if (!loc) { $('zoneChip').textContent = ''; return; }
  const z = cfg.zones.find(z => pointInPolygon(loc.lat, loc.lng, z.polygon));
  $('zoneChip').innerHTML = z ? `🏢 ${esc(t('zoneIs', { z: z.name }))}` : `ℹ️ ${esc(t('zoneNone'))}`;
}
function setLoc(lat, lng, accuracy) {
  loc = { lat, lng, accuracy: accuracy || null };
  marker.setLatLng([lat, lng]);
  showZone();
}

async function locate() {
  $('gpsMsg').className = 'msg info'; $('gpsMsg').textContent = t('gpsFinding');
  try {
    const p = await getGps();
    setLoc(p.lat, p.lng, p.accuracy);
    map.setView([p.lat, p.lng], 17);
    $('gpsMsg').className = 'msg ok'; $('gpsMsg').textContent = t('gpsOk', { m: p.accuracy });
  } catch (e) {
    $('gpsMsg').className = 'msg err'; $('gpsMsg').textContent = e.message + ' ' + t('mapHint');
  }
}

$('photoInput').onchange = async (e) => {
  const f = e.target.files[0]; if (!f) return;
  try {
    photoData = await compressImage(f);
    $('photoPreview').src = photoData; $('photoPreview').classList.remove('hidden');
    $('photoDrop').querySelector('[data-t]').textContent = t('changePhoto');
  } catch (err) { $('formMsg').innerHTML = `<div class="msg err">${esc(err.message)}</div>`; }
};
$('gpsRetry').onclick = locate;

$('submitBtn').onclick = async () => {
  const msg = $('formMsg'); msg.innerHTML = '';
  const fail = k => { msg.innerHTML = `<div class="msg err">${esc(t(k))}</div>`; };
  if (!photoData) return fail('needPhoto');
  if (!loc) return fail('needLoc');
  if (!chosenCat) return fail('needCat');
  const btn = $('submitBtn'); btn.disabled = true; btn.textContent = t('sending');
  try {
    const out = await api('/api/reports', { method: 'POST', body: {
      photo: photoData, lat: loc.lat, lng: loc.lng, accuracy: loc.accuracy, category: chosenCat,
      description: $('desc').value.trim(), phone: $('phone').value.trim(), deviceId: deviceId()
    } });
    const mine = store('gw_mine') || [];
    if (!mine.includes(out.id)) { mine.unshift(out.id); store('gw_mine', mine.slice(0, 50)); }
    $('successTitle').textContent = out.merged ? t('merged') : t('thanks');
    $('successText').textContent = out.merged ? t('mergedText') : (out.zoneName ? t('sentTo', { z: out.zoneName }) : t('zoneNone'));
    $('successId').textContent = out.id;
    $('reportForm').classList.add('hidden'); $('successBox').classList.remove('hidden');
    window.scrollTo(0, 0);
  } catch (e) {
    msg.innerHTML = `<div class="msg err">${esc(e.message)}</div>`;
  } finally { btn.disabled = false; btn.textContent = t('submit'); }
};
$('anotherBtn').onclick = () => {
  photoData = null; chosenCat = null; $('desc').value = '';
  $('photoPreview').classList.add('hidden'); $('photoInput').value = '';
  $('photoDrop').querySelector('[data-t]').textContent = t('tapPhoto');
  renderCats();
  $('successBox').classList.add('hidden'); $('reportForm').classList.remove('hidden');
  setTimeout(() => map.invalidateSize(), 50);
};
$('viewStatusBtn').onclick = () => { $('trackInput').value = $('successId').textContent; showTab('track'); track(); };

// ---------- tracking ----------
const STEPS = ['received', 'assigned', 'in_progress', 'completed', 'resolved'];
function reportCard(r) {
  const cat = cfg.categories.find(c => c.id === r.category) || { en: r.category, icon: '📍' };
  const stepIdx = STEPS.indexOf(r.status);
  const bar = r.status === 'rejected' ? '' : `
    <div style="display:flex;gap:4px;margin:12px 0 4px">${STEPS.map((s, i) => `<div style="flex:1;height:8px;border-radius:4px;background:${i <= stepIdx ? STATUS_COLOR[r.status] : '#e2e8f0'}"></div>`).join('')}</div>`;
  return `<div class="card">
    <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:center">
      <h2 style="margin:0;font-size:20px">${cat.icon} ${esc(lang === 'te' ? cat.te : cat.en)}</h2>${badge(r.status, lang)}
    </div>
    <div class="hint">${esc(r.id)} · ${t('reportedOn')} ${fmtTime(r.createdAt)} · ${t('area')}: ${esc(r.zoneName)}${r.supporters > 1 ? ` · 👥 ${r.supporters} ${t('reports')}` : ''}</div>
    ${bar}
    ${r.description ? `<p>${esc(r.description)}</p>` : ''}
    <div class="ba" style="margin:12px 0">
      <figure><img src="${esc(r.photoBefore)}" alt="before"><figcaption>${t('before')}</figcaption></figure>
      <figure>${r.photoAfter ? `<img src="${esc(r.photoAfter)}" alt="after">` : `<div class="noimg">${t('afterWait')}</div>`}<figcaption>${t('after')}</figcaption></figure>
    </div>
    <h3 style="font-size:16px">${t('progress')}</h3>
    <ul class="timeline">${r.timeline.slice().reverse().map(x => `<li><div>${esc(x.note || (STATUS[x.status] || {}).en)}</div><div class="when">${fmtTime(x.at)}</div></li>`).join('')}</ul>
  </div>`;
}
async function track() {
  const id = $('trackInput').value.trim().toUpperCase();
  $('trackMsg').innerHTML = ''; $('trackResult').innerHTML = '';
  if (!id) return;
  try { $('trackResult').innerHTML = reportCard(await api('/api/reports/' + encodeURIComponent(id))); }
  catch (e) { $('trackMsg').innerHTML = `<div class="msg err">${esc(e.message)}</div>`; }
}
$('trackBtn').onclick = track;
$('trackInput').onkeydown = e => { if (e.key === 'Enter') track(); };

async function loadMine() {
  const ids = store('gw_mine') || [];
  if (!ids.length) { $('mineList').innerHTML = `<p class="hint">${t('mineEmpty')}</p>`; return; }
  try {
    const list = await api('/api/reports/lookup', { method: 'POST', body: { ids } });
    list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    $('mineList').innerHTML = list.map(r => {
      const cat = cfg.categories.find(c => c.id === r.category) || { en: r.category };
      return `<div class="my-item" data-id="${esc(r.id)}"><img src="${esc(r.photoAfter || r.photoBefore)}" alt="">
        <div style="flex:1"><strong>${esc(lang === 'te' ? cat.te : cat.en)}</strong><div class="hint">${esc(r.id)} · ${timeAgo(r.createdAt)}</div></div>${badge(r.status, lang)}</div>`;
    }).join('');
    $('mineList').querySelectorAll('.my-item').forEach(el => el.onclick = () => { $('trackInput').value = el.dataset.id; showTab('track'); track(); });
  } catch (e) { $('mineList').innerHTML = `<div class="msg err">${esc(e.message)}</div>`; }
}

// ---------- start ----------
(async function init() {
  cfg = await api('/api/config');
  map = baseMap('map', cfg);
  drawZones(map, cfg.zones);
  marker = L.marker([cfg.center.lat, cfg.center.lng], { draggable: true, icon: pinIcon('#dc2626') }).addTo(map);
  marker.on('dragend', () => { const p = marker.getLatLng(); setLoc(p.lat, p.lng, null); });
  map.on('click', e => setLoc(e.latlng.lat, e.latlng.lng, null));
  applyLang();
  const params = new URLSearchParams(location.search);
  if (params.get('embed')) document.body.classList.add('embed');
  if (location.pathname === '/track' || params.get('id') || params.get('tab') === 'track') {
    showTab('track');
    if (params.get('id')) { $('trackInput').value = params.get('id'); track(); }
  } else if (params.get('tab') === 'mine') showTab('mine');
  locate();
})().catch(e => { document.querySelector('main').insertAdjacentHTML('afterbegin', `<div class="msg err">${esc(e.message)}</div>`); });
