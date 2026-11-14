// Home page: language switch, tabs, story video, report tab, tips, segregation game

const $ = id => document.getElementById(id);
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const sleep = ms => new Promise(r => setTimeout(r, reduced ? Math.min(ms, 150) : ms));

/* ======================= LANGUAGE (English / Telugu) ======================= */
let lang = store('gw_lang') === 'te' ? 'te' : 'en';
const L = (en, te) => (lang === 'te' ? te : en);
const onLang = []; // functions that re-draw dynamic text

function applyLang() {
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-te]').forEach(el => {
    if (el.dataset.en == null) el.dataset.en = el.innerHTML;
    el.innerHTML = lang === 'te' ? el.dataset.te : el.dataset.en;
  });
  $('langLabel').textContent = lang === 'te' ? 'English' : 'తెలుగు';
  document.title = L('Clean Gudlavalleru - Report Garbage, Learn Waste Management', 'క్లీన్ గుడ్లవల్లేరు - చెత్త సమస్య తెలపండి, వ్యర్థాల నిర్వహణ నేర్చుకోండి');
  onLang.forEach(fn => fn());
  if (window.CleanFilm) CleanFilm.setLang(lang);
  // tell the embedded report form
  try { $('reportFrame').contentWindow.postMessage({ gwLang: lang }, location.origin); } catch {}
}
$('langSwitch').onclick = () => { lang = lang === 'te' ? 'en' : 'te'; store('gw_lang', lang); applyLang(); };

/* ======================= TABS ======================= */
const TABS = ['home', 'report', 'segregation', 'tips', 'learn'];
let currentTab = null;

function showTab(name, opts = {}) {
  if (!TABS.includes(name)) name = 'home';
  if (currentTab === name && !opts.force) return;
  const prev = currentTab;
  currentTab = name;
  document.querySelectorAll('.tabbar button').forEach(b => b.classList.toggle('on', b.dataset.tab === name));
  TABS.forEach(t => $('tab-' + t).classList.toggle('hidden', t !== name));
  if (location.hash.slice(1) !== name) history.replaceState(null, '', '#' + name);
  if (!opts.keepScroll) window.scrollTo({ top: 0 });
  if (name === 'home') film.resume(); else if (prev === 'home') film.pause();
  if (prev === 'segregation' && name !== 'segregation') seg.pause(true);
  if (name === 'segregation') seg.autoStart();
  if (name === 'report') loadReportFrame(opts.reportTab);
}
document.querySelectorAll('.tabbar button').forEach(b => b.onclick = () => showTab(b.dataset.tab));
document.querySelectorAll('[data-go]').forEach(b => b.onclick = () => {
  if (b.dataset.go === 'track') showTab('report', { reportTab: 'track', force: true });
  else showTab(b.dataset.go);
});
window.addEventListener('hashchange', () => showTab(location.hash.slice(1)));

/* ======================= LIVE STATS ======================= */
(async () => {
  try {
    const s = await api('/api/stats/public');
    $('stTotal').textContent = s.total;
    $('stProg').textContent = s.inProgress;
    $('stSolved').textContent = s.solved;
  } catch {}
})();

/* ======================= STORY VIDEO ======================= */
const film = CleanFilm.createPlayer($('film'), { autoplay: true, loop: true });

/* ======================= REPORT TAB ======================= */
let frameLoaded = false;
function loadReportFrame(reportTab) {
  const f = $('reportFrame');
  if (!frameLoaded || reportTab) {
    f.src = '/report?embed=1' + (reportTab ? '&tab=' + reportTab : '');
    frameLoaded = true;
  }
}
// keep the iframe as tall as its content, so there is only one scrollbar
setInterval(() => {
  const f = $('reportFrame');
  try {
    const doc = f.contentDocument;
    if (!doc || !doc.body) return;
    const h = Math.max(doc.documentElement.scrollHeight, doc.body.scrollHeight);
    if (h && Math.abs(f.offsetHeight - h) > 4) f.style.height = h + 'px';
  } catch {}
}, 400);

let CATS = [];
function renderSla() {
  $('slaList').innerHTML = CATS.filter(c => c.id !== 'other').sort((a, b) => a.slaHours - b.slaHours).map(c => {
    const d = c.slaHours / 24;
    const when = c.slaHours < 24 ? L(c.slaHours + ' hrs', c.slaHours + ' గంటలు') : d === 1 ? L('1 day', '1 రోజు') : L(d + ' days', d + ' రోజులు');
    return `<li><span>${c.icon}</span><span style="flex:1">${esc(L(c.en, c.te))}</span><strong>${when}</strong></li>`;
  }).join('');
}
onLang.push(renderSla);
(async () => { try { CATS = (await api('/api/config')).categories; renderSla(); } catch {} })();

/* ======================= TIPS ======================= */
const TIP_OF_DAY = [
  ['🛍️', 'Keep a cloth bag in your vehicle or handbag. You will never need a plastic cover again.', 'మీ బండిలో లేదా హ్యాండ్‌బ్యాగ్‌లో ఒక గుడ్డ సంచి ఉంచుకోండి. ఇక ప్లాస్టిక్ కవర్ అవసరమే ఉండదు.'],
  ['🥤', 'Carry a steel water bottle. One bottle can replace hundreds of plastic ones.', 'స్టీల్ నీళ్ల సీసా తీసుకెళ్లండి. ఒక్క సీసా వందల ప్లాస్టిక్ సీసాలకు బదులు అవుతుంది.'],
  ['🗑️', 'Keep two dustbins in your kitchen: green for wet waste, blue for dry waste.', 'వంటగదిలో రెండు డబ్బాలు ఉంచండి: తడి చెత్తకు ఆకుపచ్చ, పొడి చెత్తకు నీలం.'],
  ['🌱', 'Tea leaves and vegetable peels make excellent compost for your plants.', 'టీ పొడి, కూరగాయల తొక్కలు మీ మొక్కలకు అద్భుతమైన కంపోస్ట్ అవుతాయి.'],
  ['🔋', 'Store old batteries in a separate box and hand them to an e-waste collector.', 'పాత బ్యాటరీలను వేరే పెట్టెలో ఉంచి ఇ-వ్యర్థాలు సేకరించేవారికి ఇవ్వండి.'],
  ['🔥', 'Never burn dry leaves or plastic. Compost the leaves and recycle the plastic.', 'ఎండు ఆకులు, ప్లాస్టిక్‌ను ఎప్పుడూ కాల్చవద్దు. ఆకులను కంపోస్ట్ చేయండి, ప్లాస్టిక్‌ను రీసైకిల్ చేయండి.'],
  ['🌸', 'Put pooja flowers in compost, not in canals or ponds.', 'పూజ పూలను కాలువలు, చెరువుల్లో వేయకుండా కంపోస్ట్‌లో వేయండి.'],
  ['🥛', 'Rinse milk packets and dry them before giving them for recycling.', 'పాల ప్యాకెట్లను కడిగి ఆరబెట్టి రీసైక్లింగ్‌కు ఇవ్వండి.'],
  ['📸', 'Saw a garbage pile? Report it in this app. It only takes a minute.', 'చెత్త కుప్ప కనిపించిందా? ఈ యాప్‌లో తెలపండి. ఒక్క నిమిషం చాలు.'],
  ['🍽️', 'At functions, use banana leaves or steel plates instead of plastic plates and cups.', 'శుభకార్యాల్లో ప్లాస్టిక్ ప్లేట్లు, కప్పులకు బదులు అరిటాకులు లేదా స్టీల్ ప్లేట్లు వాడండి.']
];
let tod = new Date().getDate() % TIP_OF_DAY.length;
function showTod() { $('todIcon').textContent = TIP_OF_DAY[tod][0]; $('todText').textContent = L(TIP_OF_DAY[tod][1], TIP_OF_DAY[tod][2]); }
$('todNext').onclick = () => { tod = (tod + 1) % TIP_OF_DAY.length; showTod(); };
onLang.push(showTod);

const PLACE_TIPS = [
  { en: '🏠 At home', te: '🏠 ఇంట్లో', items: [
    ['🗑️', 'Two bins in the kitchen', 'Green for wet waste, blue for dry waste. Keep a small box for hazardous items.', 'వంటగదిలో రెండు డబ్బాలు', 'తడి చెత్తకు ఆకుపచ్చ, పొడి చెత్తకు నీలం. ప్రమాదకర వస్తువులకు ఒక చిన్న పెట్టె ఉంచండి.'],
    ['🪴', 'Compost at home', 'A pot or bucket with holes, plus dry leaves and soil, turns kitchen waste into manure in 6–8 weeks.', 'ఇంట్లోనే కంపోస్ట్', 'రంధ్రాలున్న కుండ లేదా బకెట్, ఎండు ఆకులు, మట్టి ఉంటే వంటగది చెత్త 6–8 వారాల్లో ఎరువుగా మారుతుంది.'],
    ['🥛', 'Clean and dry', 'Rinse milk packets, oil covers and bottles, so they can be recycled.', 'కడిగి ఆరబెట్టండి', 'పాల ప్యాకెట్లు, నూనె కవర్లు, సీసాలను కడిగితే అవి రీసైకిల్ అవుతాయి.'],
    ['📰', 'Wrap sanitary waste', 'Wrap pads and diapers in newspaper and mark them with a red dot for the collector.', 'శానిటరీ చెత్తను చుట్టండి', 'ప్యాడ్లు, డైపర్లను వార్తాపత్రికలో చుట్టి, సేకరించేవారి కోసం ఎరుపు చుక్క పెట్టండి.'],
    ['🚛', 'Hand over on time', "Give waste directly to the collection vehicle. Don't leave it on the roadside.", 'సమయానికి అందజేయండి', 'చెత్తను నేరుగా సేకరణ వాహనానికి ఇవ్వండి. రోడ్డు పక్కన వదలకండి.'],
    ['💧', 'No stagnant water', 'Empty flower pots, coolers and old tyres every week to stop mosquitoes breeding.', 'నిల్వ నీరు వద్దు', 'దోమలు పెరగకుండా పూల కుండీలు, కూలర్లు, పాత టైర్లలో నీటిని ప్రతి వారం ఖాళీ చేయండి.']
  ] },
  { en: '🏪 Shops & market', te: '🏪 దుకాణాలు & మార్కెట్', items: [
    ['🛍️', 'Say no to plastic covers', 'Encourage customers to bring cloth bags. Offer paper or cloth bags instead.', 'ప్లాస్టిక్ కవర్లు వద్దు', 'కస్టమర్లను గుడ్డ సంచులు తెచ్చుకోమని ప్రోత్సహించండి. పేపర్ లేదా గుడ్డ సంచులు ఇవ్వండి.'],
    ['🗑️', 'Keep a dustbin', 'Keep a covered dustbin in front of every shop, and never sweep waste onto the road.', 'చెత్త డబ్బా ఉంచండి', 'ప్రతి దుకాణం ముందు మూత ఉన్న డబ్బా ఉంచండి. చెత్తను రోడ్డు మీదకు ఊడ్చవద్దు.'],
    ['📦', 'Sell cardboard', 'Cartons and boxes are valuable. Give them to scrap dealers for recycling.', 'అట్టపెట్టెలు అమ్మండి', 'కార్టన్లు, పెట్టెలు విలువైనవి. రీసైక్లింగ్ కోసం పాత సామాన్ల వ్యాపారులకు ఇవ్వండి.'],
    ['🥬', 'Market wet waste', 'Vegetable market waste is perfect for a community compost pit or biogas.', 'మార్కెట్ తడి చెత్త', 'కూరగాయల మార్కెట్ చెత్త సామూహిక కంపోస్ట్ గుంత లేదా బయోగ్యాస్‌కు సరైనది.']
  ] },
  { en: '🏫 School & college', te: '🏫 పాఠశాల & కళాశాల', items: [
    ['🥤', 'Steel bottle and tiffin', 'Bring lunch in a reusable box, and avoid packed snacks in plastic wrappers.', 'స్టీల్ సీసా, టిఫిన్', 'భోజనం తిరిగి వాడే డబ్బాలో తెచ్చుకోండి. ప్లాస్టిక్ కవర్లలో ఉన్న చిరుతిళ్లు తగ్గించండి.'],
    ['🧹', 'Clean-up drives', 'Organise a monthly campus and street clean-up day with NSS or NCC.', 'శుభ్రత కార్యక్రమాలు', 'NSS లేదా NCC తో నెలకోసారి క్యాంపస్, వీధి శుభ్రత దినం నిర్వహించండి.'],
    ['📢', 'Awareness', 'Make posters, skits and rallies about segregation for nearby villages.', 'అవగాహన', 'చుట్టుపక్కల గ్రామాల కోసం చెత్త వేరుచేయడంపై పోస్టర్లు, నాటికలు, ర్యాలీలు చేయండి.'],
    ['♻️', 'Segregation corners', 'Set up separate bins for wet, dry and e-waste on campus.', 'వేరుచేసే మూలలు', 'క్యాంపస్‌లో తడి, పొడి, ఇ-వ్యర్థాలకు వేర్వేరు డబ్బాలు ఏర్పాటు చేయండి.']
  ] },
  { en: '🎉 Festivals & functions', te: '🎉 పండుగలు & శుభకార్యాలు', items: [
    ['🍽️', 'No plastic plates', 'Use banana leaves, areca leaf plates or steel plates and glasses.', 'ప్లాస్టిక్ ప్లేట్లు వద్దు', 'అరిటాకులు, పోక ఆకు ప్లేట్లు లేదా స్టీల్ ప్లేట్లు, గ్లాసులు వాడండి.'],
    ['🌸', 'Flowers to compost', 'Collect pooja flowers and garlands for composting, not for the canal.', 'పూలను కంపోస్ట్‌కు', 'పూజ పూలు, దండలను కాలువలో కాకుండా కంపోస్ట్ కోసం సేకరించండి.'],
    ['🎆', 'Clean up after', 'Clear crackers, wrappers and decorations from the street after celebrations.', 'తర్వాత శుభ్రం చేయండి', 'వేడుకల తర్వాత వీధిలో టపాసులు, కవర్లు, అలంకరణలను తొలగించండి.'],
    ['🪔', 'Eco idols', 'Choose clay idols with natural colours instead of plaster of Paris and chemical paint.', 'పర్యావరణ విగ్రహాలు', 'ప్లాస్టర్ ఆఫ్ పారిస్, రసాయన రంగులకు బదులు సహజ రంగులతో మట్టి విగ్రహాలు ఎంచుకోండి.']
  ] }
];
let place = 0;
function renderTips() {
  $('placeTabs').innerHTML = PLACE_TIPS.map((p, i) => `<button data-i="${i}" class="${i === place ? 'on' : ''}">${L(p.en, p.te)}</button>`).join('');
  $('placeTabs').querySelectorAll('button').forEach(b => b.onclick = () => { place = Number(b.dataset.i); renderTips(); });
  $('tipsGrid').innerHTML = PLACE_TIPS[place].items.map(([i, h, p, ht, pt]) =>
    `<div class="card"><div class="ico">${i}</div><div><h3>${esc(L(h, ht))}</h3><p>${esc(L(p, pt))}</p></div></div>`).join('');
}
onLang.push(renderTips);

/* ======================= DECOMPOSITION TABLE ======================= */
const DECOMP = [
  ['🍌', 'Banana peel', 'అరటి తొక్క', 1, '2–5 weeks', '2–5 వారాలు', 1],
  ['📰', 'Newspaper', 'వార్తాపత్రిక', 0, '6 weeks', '6 వారాలు', 1.5],
  ['🍎', 'Apple core', 'ఆపిల్ ముక్క', 1, '2 months', '2 నెలలు', 2],
  ['👕', 'Cotton cloth', 'నూలు బట్ట', 0, '1–5 months', '1–5 నెలలు', 3],
  ['🥾', 'Leather shoe', 'తోలు చెప్పు', 0, '25–40 years', '25–40 సంవత్సరాలు', 6],
  ['🥫', 'Tin / aluminium can', 'టిన్ / అల్యూమినియం డబ్బా', 0, '80–200 years', '80–200 సంవత్సరాలు', 7.5],
  ['🛍️', 'Plastic carry bag', 'ప్లాస్టిక్ క్యారీ బ్యాగ్', 0, '10–1,000 years', '10–1,000 సంవత్సరాలు', 8.5],
  ['🧴', 'Plastic bottle', 'ప్లాస్టిక్ సీసా', 0, '450+ years', '450+ సంవత్సరాలు', 9],
  ['🍾', 'Glass bottle', 'గాజు సీసా', 0, '1 million years', '10 లక్షల సంవత్సరాలు', 10]
];
function renderDecomp() {
  $('decompBody').innerHTML = DECOMP.map(([e, n, nt, wet, time, tt, w]) => `<tr>
    <td>${e} ${L(n, nt)}</td><td><span class="badge" style="background:${wet ? '#dcfce7' : '#dbeafe'};color:${wet ? '#166534' : '#1e40af'}">${wet ? L('Wet', 'తడి') : L('Dry', 'పొడి')}</span></td>
    <td><div class="barw" style="width:${w * 10}%;background:${w < 4 ? '#16a34a' : w < 8 ? '#d97706' : '#dc2626'}"></div></td><td>${L(time, tt)}</td></tr>`).join('');
}
onLang.push(renderDecomp);

/* ======================= SEGREGATION ANIMATION & GAME ======================= */
const seg = (() => {
  const ITEMS = [
    ['🍌', 'Banana peel', 'అరటి తొక్క', 'wet'], ['🧴', 'Plastic bottle', 'ప్లాస్టిక్ సీసా', 'dry'], ['🔋', 'Battery', 'బ్యాటరీ', 'haz'],
    ['🥬', 'Vegetable waste', 'కూరగాయల వ్యర్థాలు', 'wet'], ['📰', 'Newspaper', 'వార్తాపత్రిక', 'dry'], ['💡', 'Bulb / tube light', 'బల్బు / ట్యూబ్ లైట్', 'haz'],
    ['🍚', 'Leftover food', 'మిగిలిన ఆహారం', 'wet'], ['🥫', 'Tin can', 'టిన్ డబ్బా', 'dry'], ['💊', 'Old medicines', 'పాత మందులు', 'haz'],
    ['🥚', 'Egg shells', 'గుడ్డు పెంకులు', 'wet'], ['📦', 'Cardboard box', 'అట్టపెట్టె', 'dry'], ['🌸', 'Pooja flowers', 'పూజ పూలు', 'wet'],
    ['🛍️', 'Plastic cover', 'ప్లాస్టిక్ కవర్', 'dry'], ['🎨', 'Paint can', 'పెయింట్ డబ్బా', 'haz'], ['🍂', 'Dry leaves', 'ఎండు ఆకులు', 'wet'],
    ['🍾', 'Glass bottle', 'గాజు సీసా', 'dry'], ['📱', 'Old phone (e-waste)', 'పాత ఫోన్ (ఇ-వ్యర్థం)', 'haz'], ['☕', 'Used tea leaves', 'వాడిన టీ పొడి', 'wet'],
    ['👕', 'Old clothes', 'పాత బట్టలు', 'dry'], ['🩹', 'Used bandage / sanitary waste', 'వాడిన బ్యాండేజ్ / శానిటరీ వ్యర్థం', 'haz']
  ].map(([e, n, nt, b]) => ({ e, n, nt, b }));
  const name = it => L(it.n, it.nt);
  const BIN_NAME = k => ({
    wet: L('WET bin: Biodegradable', 'తడి చెత్త డబ్బా'),
    dry: L('DRY bin: Non-biodegradable', 'పొడి చెత్త డబ్బా'),
    haz: L('HAZARDOUS bin', 'ప్రమాదకర చెత్త డబ్బా')
  })[k];
  const BIN_COLOR = { wet: '#16a34a', dry: '#2563eb', haz: '#dc2626' };
  const GAME_LEN = 10;
  const stage = $('stage'), tag = $('tag'), scoreEl = $('score');
  const bins = Object.fromEntries([...stage.querySelectorAll('.bin')].map(b => [b.dataset.bin, b]));
  const counts = { wet: 0, dry: 0, haz: 0 };
  let runId = 0, mode = 'idle', waitingItem = null, gameScore = 0, gameDone = 0, gameQueue = [], tagState = 'start';

  const setTag = (html, color) => { tag.innerHTML = html; tag.style.background = color || '#0f172a'; };
  const updateCounts = () => { for (const k in bins) bins[k].querySelector('.cnt').textContent = counts[k]; };
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  function labels() {
    $('playBtn').textContent = mode === 'play' ? L('⏸ Pause', '⏸ ఆపండి') : L('▶ Play animation', '▶ యానిమేషన్ ప్లే చేయండి');
    $('gameBtn').textContent = mode === 'game' ? L('🎮 Restart game', '🎮 ఆటను మళ్ళీ ప్రారంభించండి')
      : gameDone >= GAME_LEN ? L('🎮 Play again', '🎮 మళ్ళీ ఆడండి') : L('🎮 Try it yourself', '🎮 మీరే ప్రయత్నించండి');
    $('resetBtn').textContent = L('↺ Reset', '↺ రీసెట్');
    if (tagState === 'start') setTag(L('Press ▶ Play to start', 'ప్రారంభించడానికి ▶ నొక్కండి'));
    if (tagState === 'paused') setTag(L('Paused. Press ▶ Play to continue', 'ఆగింది. కొనసాగించడానికి ▶ నొక్కండి'));
  }
  onLang.push(labels);

  function spawn(item) {
    const el = document.createElement('div');
    el.className = 'item'; el.textContent = item.e;
    el.style.left = '-70px'; el.style.top = '102px';
    stage.appendChild(el);
    return el;
  }
  async function toCenter(el, id) {
    await sleep(30);
    el.style.left = (stage.clientWidth / 2 - (el.offsetWidth || 46) / 2) + 'px';
    await sleep(950);
    return id === runId;
  }
  async function dropInto(el, key, id) {
    const bin = bins[key];
    bin.classList.add('open');
    const s = stage.getBoundingClientRect(), b = bin.getBoundingClientRect();
    const left = b.left - s.left + b.width / 2 - (el.offsetWidth || 46) / 2, top = b.top - s.top - 10;
    el.style.left = left + 'px'; el.style.top = (top - 30) + 'px';
    await sleep(700);
    if (id !== runId) return false;
    el.style.top = (top + 30) + 'px'; el.style.transform = 'scale(.4)'; el.style.opacity = 0;
    await sleep(450);
    el.remove();
    bin.classList.remove('open');
    bin.classList.add('hit'); setTimeout(() => bin.classList.remove('hit'), 250);
    counts[key]++; updateCounts();
    return id === runId;
  }
  function clearStage() {
    runId++;
    stage.querySelectorAll('.item').forEach(e => e.remove());
    Object.values(bins).forEach(b => b.classList.remove('open', 'clickable', 'wrong'));
    waitingItem = null;
  }

  async function play() {
    clearStage(); mode = 'play'; tagState = '';
    const id = runId;
    stage.classList.remove('paused');
    labels();
    scoreEl.textContent = '';
    while (id === runId) {
      for (const item of shuffle(ITEMS)) {
        if (id !== runId) return;
        const el = spawn(item);
        setTag(`${item.e} ${name(item)}`);
        if (!await toCenter(el, id)) return;
        setTag(`${item.e} ${name(item)}<small>${L('➜ goes to the ' + BIN_NAME(item.b), '➜ ' + BIN_NAME(item.b) + 'లో వేయాలి')}</small>`, BIN_COLOR[item.b]);
        await sleep(900);
        if (id !== runId) return;
        if (!await dropInto(el, item.b, id)) return;
        await sleep(250);
      }
    }
  }
  function pause(silent) {
    if (mode === 'game' && silent) return; // keep game state when switching tabs
    clearStage(); mode = 'idle';
    stage.classList.add('paused');
    if (!silent) tagState = 'paused';
    labels();
  }
  $('playBtn').onclick = () => (mode === 'play' ? pause() : play());

  async function nextGameItem() {
    const id = runId;
    if (gameDone >= GAME_LEN) {
      mode = 'idle'; tagState = '';
      setTag(L(`Game over: ${gameScore} / ${GAME_LEN}`, `ఆట ముగిసింది: ${gameScore} / ${GAME_LEN}`));
      scoreEl.textContent = gameScore >= 9 ? L('🏆 Excellent! You are a segregation champion!', '🏆 అద్భుతం! మీరు చెత్త వేరుచేయడంలో ఛాంపియన్!')
        : gameScore >= 6 ? L('👍 Good job! Keep practising.', '👍 బాగుంది! ఇంకా సాధన చేయండి.')
        : L('📚 Read the bin guide below and try again!', '📚 కింద ఉన్న డబ్బాల వివరాలు చదివి మళ్ళీ ప్రయత్నించండి!');
      Object.values(bins).forEach(b => b.classList.remove('clickable'));
      labels();
      return;
    }
    const item = gameQueue[gameDone];
    const el = spawn(item);
    setTag(L(`Where does ${item.e} <b>${item.n}</b> go?<small>Tap the correct bin</small>`, `${item.e} <b>${item.nt}</b> ఏ డబ్బాలో వేయాలి?<small>సరైన డబ్బాను నొక్కండి</small>`), '#7c3aed');
    if (!await toCenter(el, id)) return;
    waitingItem = { item, el };
    Object.values(bins).forEach(b => b.classList.add('clickable'));
  }
  async function choose(key) {
    if (mode !== 'game' || !waitingItem) return;
    const { item, el } = waitingItem;
    waitingItem = null;
    Object.values(bins).forEach(b => b.classList.remove('clickable'));
    const id = runId;
    if (key === item.b) { gameScore++; setTag(L(`✅ Correct! ${item.n} ➜ ${BIN_NAME(item.b)}`, `✅ సరైనది! ${item.nt} ➜ ${BIN_NAME(item.b)}`), '#16a34a'); }
    else {
      bins[key].classList.add('wrong'); setTimeout(() => bins[key].classList.remove('wrong'), 450);
      setTag(L(`❌ Not quite. ${item.n} goes in the ${BIN_NAME(item.b)}`, `❌ కాదు. ${item.nt} ను ${BIN_NAME(item.b)}లో వేయాలి`), '#dc2626');
      await sleep(900);
      if (id !== runId) return;
    }
    gameDone++;
    scoreEl.textContent = `${L('Score', 'స్కోరు')}: ${gameScore} / ${gameDone}`;
    if (!await dropInto(el, item.b, id)) return;
    await sleep(500);
    if (id === runId) nextGameItem();
  }
  Object.entries(bins).forEach(([k, b]) => b.onclick = () => choose(k));
  $('gameBtn').onclick = () => {
    clearStage(); mode = 'game'; tagState = '';
    stage.classList.remove('paused');
    gameQueue = shuffle(ITEMS).slice(0, GAME_LEN);
    gameScore = 0; gameDone = 0;
    labels();
    scoreEl.textContent = `${L('Score', 'స్కోరు')}: 0 / 0`;
    nextGameItem();
  };
  $('resetBtn').onclick = () => {
    clearStage(); mode = 'idle'; tagState = 'start'; gameDone = 0;
    counts.wet = counts.dry = counts.haz = 0; updateCounts();
    stage.classList.add('paused');
    scoreEl.textContent = '';
    labels();
  };
  return {
    pause,
    autoStart() { if (mode === 'idle' && tagState === 'start') setTimeout(() => { if (currentTab === 'segregation' && mode === 'idle') play(); }, 300); }
  };
})();

/* ======================= START ======================= */
applyLang();
showTab(location.hash.slice(1) || 'home', { force: true, keepScroll: true });
