/* =====================================================================
   Clean Gudlavalleru - animated story video
   Everything is drawn on a <canvas> as a pure function of time, so the
   player can play, pause, seek, loop and record it as a video file.
   ===================================================================== */
(function () {
  const W = 1280, H = 720, RES = 1.5;            // drawn at 1920x1080
  const FONT = 'Poppins, "Noto Sans Telugu", "Nirmala UI", "Segoe UI", system-ui, sans-serif';
  let LANG = 'en';
  try { LANG = JSON.parse(localStorage.getItem('gw_lang')) || 'en'; } catch {}
  const tr = (en, te) => (LANG === 'te' ? te : en);
  const EMOJI = '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif';

  const SCENES = [
    { id: 'title', len: 5, label: 'Intro', te: 'పరిచయం', icon: '🎬' },
    { id: 'problem', len: 8, label: 'The problem', te: 'సమస్య', icon: '🗑️' },
    { id: 'report', len: 8.5, label: 'Citizen reports', te: 'ఫిర్యాదు', icon: '📸' },
    { id: 'route', len: 6.5, label: 'Department', te: 'విభాగం', icon: '🏢' },
    { id: 'clean', len: 9, label: 'Worker cleans', te: 'శుభ్రత', icon: '🧹' },
    { id: 'segregate', len: 6.5, label: 'Segregation', te: 'వేరుచేయడం', icon: '♻️' },
    { id: 'green', len: 7, label: 'Clean & green', te: 'పరిశుభ్రం', icon: '🌼' },
    { id: 'end', len: 5.5, label: 'Report now', te: 'తెలపండి', icon: '📣' }
  ];
  let acc = 0;
  for (const s of SCENES) { s.a = acc; acc += s.len; s.b = acc; }
  const DURATION = acc;

  /* ---------------- math helpers ---------------- */
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const prog = (t, a, b) => clamp((t - a) / (b - a));
  const E = {
    io: t => (t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
    out: t => 1 - Math.pow(1 - t, 3),
    in: t => t * t * t,
    back: t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
    bounce: t => { const n = 7.5625, d = 2.75; if (t < 1 / d) return n * t * t; if (t < 2 / d) return n * (t -= 1.5 / d) * t + .75; if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + .9375; return n * (t -= 2.625 / d) * t + .984375; }
  };
  const rnd = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const mix = (a, b, t) => { const x = hex(a), y = hex(b); return `rgb(${Math.round(lerp(x[0], y[0], t))},${Math.round(lerp(x[1], y[1], t))},${Math.round(lerp(x[2], y[2], t))})`; };
  const fadeIO = (lt, a, b, f = .4) => clamp(Math.min((lt - a) / f, (b - lt) / f));

  /* ---------------- drawing helpers ---------------- */
  let ctx;
  function rr(x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function fillRR(x, y, w, h, r, c) { rr(x, y, w, h, r); ctx.fillStyle = c; ctx.fill(); }
  function circle(x, y, r, c) { ctx.beginPath(); ctx.arc(x, y, Math.max(0, r), 0, Math.PI * 2); ctx.fillStyle = c; ctx.fill(); }
  function ellipse(x, y, rx, ry, c, rot = 0) { ctx.beginPath(); ctx.ellipse(x, y, Math.max(0, rx), Math.max(0, ry), rot, 0, Math.PI * 2); ctx.fillStyle = c; ctx.fill(); }
  function line(x1, y1, x2, y2, w, c) { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineWidth = w; ctx.strokeStyle = c; ctx.lineCap = 'round'; ctx.stroke(); }
  function text(str, x, y, size, color, { weight = 700, align = 'left', base = 'alphabetic', font = FONT, alpha = 1, shadow = 0, spacing = 0 } = {}) {
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.font = `${weight} ${size}px ${font}`;
    ctx.textAlign = align; ctx.textBaseline = base; ctx.fillStyle = color;
    if (spacing && 'letterSpacing' in ctx) ctx.letterSpacing = spacing + 'px';
    if (shadow) { ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = shadow; ctx.shadowOffsetY = shadow / 3; }
    ctx.fillText(str, x, y);
    ctx.restore();
  }
  function emoji(e, x, y, size, alpha = 1) { text(e, x, y, size, '#000', { font: EMOJI, weight: 400, align: 'center', base: 'middle', alpha }); }
  function withAlpha(a, fn) { ctx.save(); ctx.globalAlpha *= clamp(a); fn(); ctx.restore(); }
  function at(x, y, s, rot, fn) { ctx.save(); ctx.translate(x, y); if (rot) ctx.rotate(rot); if (s !== 1) ctx.scale(s, s); fn(); ctx.restore(); }

  /* ============================================================
     STREET SCENE (used by several scenes)
     ============================================================ */
  const HOUSES = [
    { x: -40, w: 190, h: 150, c: '#f4c27a', roof: 'tile' },
    { x: 160, w: 150, h: 190, c: '#8fd3c7', roof: 'flat' },
    { x: 320, w: 170, h: 140, c: '#f29e8e', roof: 'tile' },
    { x: 760, w: 160, h: 200, c: '#c9b6f2', roof: 'flat' },
    { x: 930, w: 190, h: 150, c: '#f7e07c', roof: 'tile' },
    { x: 1130, w: 190, h: 180, c: '#9cc7f0', roof: 'flat' }
  ];
  const GROUND = 440, CURB = 505;
  const PILE_X = 610, PILE_Y = 498;
  const PIECES = Array.from({ length: 22 }, (_, i) => {
    const dx = (rnd(i) - .5) * 190;
    const hgt = (1 - Math.abs(dx) / 110) * 58;
    return {
      x: PILE_X + dx, y: PILE_Y - 4 - rnd(i + 40) * Math.max(6, hgt), type: ['bag', 'bottle', 'paper', 'peel', 'can', 'box', 'bag'][i % 7],
      c: ['#2b2b2b', '#355e3b', '#2d4f7c', '#5b3d2e', '#1f2937'][i % 5], rot: (rnd(i + 9) - .5) * 1.6, s: .8 + rnd(i + 3) * .5
    };
  }).sort((a, b) => a.y - b.y);

  function drawPiece(p, x, y, rot, s) {
    at(x, y, s * p.s, rot, () => {
      switch (p.type) {
        case 'bag':
          ellipse(0, 0, 26, 20, p.c); ellipse(-8, -6, 8, 5, 'rgba(255,255,255,.18)');
          line(0, -18, -4, -28, 5, p.c); line(0, -18, 5, -27, 5, p.c); break;
        case 'bottle':
          fillRR(-9, -26, 18, 40, 6, 'rgba(120,190,230,.85)'); fillRR(-5, -34, 10, 9, 2, '#1d4ed8'); fillRR(-9, -12, 18, 10, 0, '#ef4444'); break;
        case 'paper':
          ctx.beginPath(); ctx.moveTo(-18, -14); ctx.lineTo(16, -18); ctx.lineTo(20, 10); ctx.lineTo(-14, 14); ctx.closePath(); ctx.fillStyle = '#e7e1d1'; ctx.fill();
          line(-10, -6, 10, -8, 2, '#9ca3af'); line(-9, 2, 12, 0, 2, '#9ca3af'); break;
        case 'peel':
          ctx.beginPath(); ctx.moveTo(-18, 6); ctx.quadraticCurveTo(0, -18, 18, 6); ctx.lineWidth = 9; ctx.strokeStyle = '#d4a017'; ctx.lineCap = 'round'; ctx.stroke();
          circle(-18, 6, 4, '#6b4f1d'); break;
        case 'can':
          fillRR(-11, -18, 22, 32, 4, '#9ca3af'); fillRR(-11, -8, 22, 10, 0, '#dc2626'); ellipse(0, -18, 11, 3, '#d1d5db'); break;
        case 'box':
          fillRR(-20, -18, 40, 30, 2, '#b7854f'); line(-20, -6, 20, -6, 2, '#8a6237'); line(0, -18, 0, 12, 2, '#8a6237'); break;
      }
    });
  }

  function drawPalm(x, sway, clean, scale = 1) {
    at(x, GROUND + 8, scale, 0, () => {
      ctx.beginPath(); ctx.moveTo(-8, 0); ctx.quadraticCurveTo(10, -120, 24 + sway * 8, -235);
      ctx.lineTo(36 + sway * 8, -235); ctx.quadraticCurveTo(22, -120, 8, 0); ctx.closePath();
      ctx.fillStyle = mix('#7a6a55', '#8b5a2b', clean); ctx.fill();
      for (let k = 1; k < 9; k++) line(-2 + k * 2.4, -k * 26, 14 + k * 2.6, -k * 26 - 2, 2, 'rgba(0,0,0,.18)');
      const leaf = mix('#8a8c55', '#22a447', clean), dark = mix('#6e7046', '#15803d', clean);
      const tx = 30 + sway * 8, ty = -235;
      const droop = (1 - clean) * .35;
      for (let i = 0; i < 8; i++) {
        const ang = -Math.PI + (i / 7) * Math.PI + Math.sin(sway * 2 + i) * .05;
        const len = 95 + (i % 2) * 18;
        const ex = tx + Math.cos(ang) * len, ey = ty + Math.sin(ang) * len * .55 + 40 + droop * 40;
        ctx.beginPath(); ctx.moveTo(tx, ty);
        ctx.quadraticCurveTo(tx + Math.cos(ang) * len * .5, ty + Math.sin(ang) * len * .5 - 30, ex, ey);
        ctx.lineWidth = 15; ctx.strokeStyle = i % 2 ? leaf : dark; ctx.lineCap = 'round'; ctx.stroke();
      }
      circle(tx - 6, ty + 10, 9, '#6b4423'); circle(tx + 8, ty + 12, 9, '#7c4f2a');
    });
  }
  function drawNeem(x, clean, s = 1) {
    at(x, GROUND + 8, s, 0, () => {
      fillRR(-9, -110, 18, 112, 6, mix('#6f6252', '#7c4a24', clean));
      const g1 = mix('#7f8a5e', '#16a34a', clean), g2 = mix('#959b70', '#22c55e', clean), g3 = mix('#6b744d', '#15803d', clean);
      circle(-40, -130, 48, g3); circle(38, -132, 50, g3); circle(0, -170, 58, g1);
      circle(-22, -150, 40, g2); circle(28, -160, 36, g2); circle(4, -118, 44, g1);
    });
  }
  function drawHouse(h, clean) {
    const y = GROUND - h.h, grey = '#a39f96';
    const body = mix(grey, h.c, .45 + clean * .55);
    fillRR(h.x, y, h.w, h.h, 3, body);
    ctx.fillStyle = 'rgba(0,0,0,.07)'; ctx.fillRect(h.x + h.w - 14, y, 14, h.h);
    if (h.roof === 'tile') {
      ctx.beginPath(); ctx.moveTo(h.x - 14, y + 4); ctx.lineTo(h.x + h.w / 2, y - 62); ctx.lineTo(h.x + h.w + 14, y + 4); ctx.closePath();
      ctx.fillStyle = mix('#8a6a5e', '#c2410c', clean); ctx.fill();
      for (let k = 1; k < 5; k++) line(h.x - 14 + k * 8, y + 4 - k * 13, h.x + h.w + 14 - k * 8, y + 4 - k * 13, 2, 'rgba(0,0,0,.12)');
    } else {
      fillRR(h.x - 6, y - 12, h.w + 12, 16, 3, mix('#8d8a83', '#e5e7eb', clean));
      fillRR(h.x + h.w - 54, y - 44, 34, 32, 4, mix('#55524c', '#1f2937', clean));
    }
    const win = mix('#6b7280', '#bfdbfe', clean);
    const cols = Math.max(2, Math.floor(h.w / 60));
    for (let c = 0; c < cols; c++) {
      const wx = h.x + 22 + c * ((h.w - 44 - 30) / Math.max(1, cols - 1));
      fillRR(wx - 3, y + 26, 36, 38, 4, mix('#5b5a57', '#7c2d12', clean * .7));
      fillRR(wx, y + 29, 30, 32, 3, win);
      line(wx + 15, y + 29, wx + 15, y + 61, 2, 'rgba(0,0,0,.25)');
      if (h.h > 160) { fillRR(wx - 3, y + 92, 36, 34, 4, mix('#5b5a57', '#7c2d12', clean * .7)); fillRR(wx, y + 95, 30, 28, 3, win); }
    }
    const dx = h.x + h.w / 2 - 18;
    fillRR(dx, GROUND - 62, 36, 62, 4, mix('#4b4540', '#92400e', clean));
    circle(dx + 28, GROUND - 30, 3, '#fcd34d');
    fillRR(dx - 10, GROUND - 4, 56, 6, 2, 'rgba(0,0,0,.15)');
  }
  function drawCloud(x, y, s, c) {
    at(x, y, s, 0, () => { circle(0, 0, 30, c); circle(32, -12, 38, c); circle(70, 0, 30, c); fillRR(-10, -4, 92, 34, 17, c); });
  }
  function drawFlower(x, y, g, i) {
    if (g <= 0) return;
    const h = 34 * g;
    line(x, y, x, y - h, 4, '#16a34a');
    ellipse(x - 8 * g, y - h * .45, 9 * g, 4 * g, '#22c55e', -.5);
    const pc = ['#f43f5e', '#f59e0b', '#ec4899', '#a855f7', '#facc15', '#fb7185'][i % 6];
    for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; circle(x + Math.cos(a) * 8 * g, y - h + Math.sin(a) * 8 * g, 6.5 * g, pc); }
    circle(x, y - h, 5 * g, '#fde047');
  }
  function drawBird(x, y, flap, s = 1) {
    ctx.beginPath(); const w = 16 * s, f = Math.sin(flap) * 9 * s;
    ctx.moveTo(x - w, y - f); ctx.quadraticCurveTo(x - w / 2, y - 4 * s, x, y); ctx.quadraticCurveTo(x + w / 2, y - 4 * s, x + w, y - f);
    ctx.lineWidth = 3.5 * s; ctx.strokeStyle = '#1f2937'; ctx.lineCap = 'round'; ctx.stroke();
  }
  function drawPublicBin(x, clean) {
    const y = CURB - 4;
    fillRR(x - 26, y - 70, 52, 70, 8, mix('#5f6b5f', '#15803d', clean));
    fillRR(x - 31, y - 80, 62, 14, 6, mix('#4d574d', '#166534', clean));
    text('♻', x, y - 26, 26, '#fff', { align: 'center', font: EMOJI, weight: 400 });
  }

  function street(t, o) {
    const c = o.clean || 0;
    // sky
    const sky = ctx.createLinearGradient(0, 0, 0, GROUND);
    sky.addColorStop(0, mix('#8c918c', '#2f8fe0', c)); sky.addColorStop(1, mix('#d6cfbd', '#c7ecff', c));
    ctx.fillStyle = sky; ctx.fillRect(-400, -300, W + 800, GROUND + 300);
    // sun
    const sx = 1040, sy = 120;
    const glow = ctx.createRadialGradient(sx, sy, 10, sx, sy, 160);
    glow.addColorStop(0, `rgba(255,236,150,${.25 + c * .55})`); glow.addColorStop(1, 'rgba(255,236,150,0)');
    ctx.fillStyle = glow; ctx.fillRect(sx - 170, sy - 170, 340, 340);
    circle(sx, sy, 48, mix('#d9cfa6', '#ffd43b', c));
    // clouds
    for (let i = 0; i < 4; i++) {
      const x = ((i * 380 + t * (10 + i * 3)) % (W + 400)) - 200;
      drawCloud(x, 80 + i * 34 % 90, .8 + (i % 2) * .3, c > .5 ? 'rgba(255,255,255,.95)' : mix('#9a9a96', '#ffffff', c));
    }
    // birds
    if (o.birds) for (let i = 0; i < 6; i++) {
      const bx = ((t * 85 + i * 210) % (W + 300)) - 150, by = 150 + (i % 3) * 38 + Math.sin(t * 1.5 + i) * 10;
      withAlpha(o.birds, () => drawBird(bx, by, t * 9 + i, .8 + (i % 3) * .15));
    }
    // hills
    ctx.beginPath(); ctx.moveTo(-400, GROUND);
    for (let x = -400; x <= W + 400; x += 40) ctx.lineTo(x, GROUND - 120 - Math.sin(x / 210) * 30 - Math.sin(x / 90) * 10);
    ctx.lineTo(W + 400, GROUND); ctx.closePath(); ctx.fillStyle = mix('#a4a690', '#86c98d', c); ctx.fill();
    // smog
    withAlpha((1 - c) * .22, () => { ctx.fillStyle = '#8b7d62'; ctx.fillRect(-400, -300, W + 800, GROUND + 300); });
    // houses & trees
    drawNeem(560, c, 1.05);
    for (const h of HOUSES) drawHouse(h, c);
    drawPalm(700, Math.sin(t * .9), c);
    drawPalm(118, Math.sin(t * .8 + 1), c, .9);
    // sidewalk
    ctx.fillStyle = mix('#a9a08f', '#d8ccb6', c); ctx.fillRect(-400, GROUND, W + 800, CURB - GROUND);
    for (let x = -400; x < W + 400; x += 64) line(x, GROUND, x - 18, CURB, 1.5, 'rgba(0,0,0,.08)');
    ctx.fillStyle = mix('#7c766c', '#9ca3af', c); ctx.fillRect(-400, CURB - 6, W + 800, 12);
    // road
    const road = ctx.createLinearGradient(0, CURB, 0, H);
    road.addColorStop(0, mix('#4b4843', '#3f3f46', c)); road.addColorStop(1, mix('#3a3733', '#27272a', c));
    ctx.fillStyle = road; ctx.fillRect(-400, CURB + 6, W + 800, H - CURB + 300);
    for (let x = -400; x < W + 400; x += 110) fillRR(x, 616, 60, 8, 3, 'rgba(255,255,255,.75)');
    // drain grate
    for (let x = 820; x < 900; x += 10) line(x, CURB + 8, x, CURB + 20, 3, '#1f1f1f');
    if (o.bin) drawPublicBin(990, c);
    // garbage stain
    if (o.garbage > 0) withAlpha(o.garbage * .55, () => ellipse(PILE_X, PILE_Y + 4, 130, 16, '#3b2f22'));
    // garbage pieces
    PIECES.forEach((p, i) => {
      const st = o.piece ? o.piece(i, p) : null;
      if (st === false) return;
      if (st) drawPiece(p, st.x, st.y, st.rot, st.s);
      else if (o.garbage > 0) drawPiece(p, p.x, p.y, p.rot, 1);
    });
    // fire & smoke
    if (o.smoke > 0) {
      for (let k = 0; k < 9; k++) {
        const age = (t * .55 + k / 9) % 1;
        withAlpha(o.smoke * .45 * (1 - age), () => circle(688 + age * 70 + Math.sin(age * 6 + k) * 10, 470 - age * 260, 14 + age * 46, '#6b6b6b'));
      }
      for (let k = 0; k < 3; k++) {
        const fl = Math.sin(t * 18 + k * 2) * 5;
        ctx.beginPath(); ctx.moveTo(676 + k * 10, 494); ctx.quadraticCurveTo(670 + k * 10, 470 + fl, 682 + k * 10, 452 + fl); ctx.quadraticCurveTo(692 + k * 10, 472, 688 + k * 10, 494);
        ctx.fillStyle = k === 1 ? `rgba(250,204,21,${o.smoke})` : `rgba(249,115,22,${o.smoke})`; ctx.fill();
      }
    }
    // stink lines
    if (o.flies > 0) for (let k = 0; k < 3; k++) {
      const age = (t * .5 + k / 3) % 1;
      withAlpha(o.flies * (1 - age) * .8, () => {
        ctx.beginPath();
        const bx = 560 + k * 45, by = 440 - age * 70;
        ctx.moveTo(bx, by); for (let j = 1; j <= 6; j++) ctx.lineTo(bx + Math.sin(j * 1.3 + t * 4) * 6, by - j * 8);
        ctx.lineWidth = 4; ctx.strokeStyle = '#84cc16'; ctx.lineCap = 'round'; ctx.stroke();
      });
    }
    // flowers
    if (o.flowers > 0) for (let i = 0; i < 18; i++) {
      const x = 30 + i * 72 + (i % 2) * 14;
      drawFlower(x, CURB - 4, E.back(clamp(o.flowers * 1.6 - i * .045)), i);
    }
    if (o.people) o.people();
    // flies (in front)
    if (o.flies > 0) for (let i = 0; i < 12; i++) {
      const spread = 1 + (o.fliesSpread || 0) * 6;
      const fx = PILE_X + Math.sin(t * (2.3 + rnd(i) * 2) + i * 2) * (40 + rnd(i + 5) * 70) * spread;
      const fy = 430 + Math.cos(t * (2.8 + rnd(i + 2) * 2) + i) * 34 * spread - (o.fliesSpread || 0) * 260;
      withAlpha(o.flies, () => {
        const wing = Math.abs(Math.sin(t * 40 + i)) * 4;
        ellipse(fx - 3, fy - 4, 4, 2 + wing * .4, 'rgba(220,230,240,.8)', -.5); ellipse(fx + 3, fy - 4, 4, 2 + wing * .4, 'rgba(220,230,240,.8)', .5);
        circle(fx, fy, 3.4, '#111');
      });
    }
  }

  /* ---------------- people ---------------- */
  function person(x, y, s, o = {}) {
    const dir = o.dir || 1;
    at(x, y, s, 0, () => {
      ctx.scale(dir, 1);
      const walk = o.walk == null ? null : o.walk;
      const a = walk == null ? 0 : Math.sin(walk) * .45;
      const bob = walk == null ? 0 : Math.abs(Math.cos(walk)) * 3;
      ctx.translate(0, -bob);
      // shadow
      withAlpha(.25, () => ellipse(0, bob + 2, 30, 6, '#000'));
      const hipY = -58;
      const leg = (ang, col) => { line(0, hipY, Math.sin(ang) * 58, hipY + Math.cos(ang) * 58, 13, col); ellipse(Math.sin(ang) * 58 + 5, hipY + Math.cos(ang) * 58, 10, 5.5, '#1f2937'); };
      leg(-a, mix(o.pants || '#1e3a8a', '#000000', .2));
      leg(a, o.pants || '#1e3a8a');
      // back arm
      arm(o.armB || [walk == null ? .15 : -a * .9, .2], o, true);
      // torso
      fillRR(-17, -112, 34, 58, 12, o.shirt || '#2563eb');
      if (o.vest) {
        fillRR(-17, -110, 34, 54, 11, '#f97316');
        fillRR(-17, -88, 34, 6, 0, '#e5e7eb'); fillRR(-17, -72, 34, 6, 0, '#e5e7eb');
      }
      // head
      fillRR(-6, -122, 12, 12, 4, o.skin || '#c68642');
      circle(0, -136, 17, o.skin || '#c68642');
      if (o.helmet) {
        ctx.beginPath(); ctx.arc(0, -140, 19, Math.PI, 0); ctx.fillStyle = '#facc15'; ctx.fill();
        fillRR(-22, -142, 46, 6, 3, '#eab308');
      } else {
        ctx.beginPath(); ctx.arc(0, -140, 18, Math.PI * 1.05, Math.PI * 2.05); ctx.fillStyle = o.hair || '#111827'; ctx.fill();
        if (o.girl) { ellipse(-14, -124, 7, 18, o.hair || '#111827', .25); circle(-18, -108, 6, o.hair || '#111827'); }
      }
      circle(8, -138, 2.4, '#111');
      ctx.beginPath(); ctx.arc(7, -131, 5, .2, Math.PI - .6); ctx.lineWidth = 2; ctx.strokeStyle = '#7c2d12'; ctx.stroke();
      // front arm
      arm(o.armF || [walk == null ? -.15 : a * .9, .25], o, false);
    });
  }
  function arm([a1, a2], o, back) {
    const sx = 0, sy = -104, L1 = 26, L2 = 25;
    const ex = sx + Math.sin(a1) * L1, ey = sy + Math.cos(a1) * L1;
    const hx = ex + Math.sin(a1 + a2) * L2, hy = ey + Math.cos(a1 + a2) * L2;
    const col = back ? mix(o.shirt || '#2563eb', '#000000', .25) : (o.vest ? '#f97316' : (o.shirt || '#2563eb'));
    line(sx, sy, ex, ey, 11, col);
    line(ex, ey, hx, hy, 10, o.skin || '#c68642');
    circle(hx, hy, 6, o.skin || '#c68642');
    if (!back && o.prop === 'phone') { at(hx + 4, hy - 8, 1, -.2, () => { fillRR(-8, -14, 16, 28, 4, '#111827'); fillRR(-6, -11, 12, 21, 2, o.flash ? '#fff' : '#60a5fa'); }); }
    if (!back && o.prop === 'broom') {
      at(hx, hy, 1, (o.broomAng || 0) - .5, () => {
        line(0, -10, 0, 74, 5, '#a16207');
        ctx.beginPath(); ctx.moveTo(-4, 70); ctx.lineTo(-22, 110); ctx.lineTo(22, 110); ctx.lineTo(4, 70); ctx.closePath(); ctx.fillStyle = '#d6b36a'; ctx.fill();
        for (let k = -3; k <= 3; k++) line(k * 2, 74, k * 6, 108, 1.5, '#a68a4a');
      });
    }
  }
  function cart(x, y, fill, wheelRot, hd = 1) {
    at(x, y, 1, 0, () => {
      line(52 * hd, -70, 92 * hd, -100, 6, '#374151');
      ctx.beginPath(); ctx.moveTo(-58, -100); ctx.lineTo(58, -100); ctx.lineTo(48, -26); ctx.lineTo(-48, -26); ctx.closePath();
      ctx.fillStyle = '#15803d'; ctx.fill();
      fillRR(-62, -106, 124, 10, 4, '#166534');
      ctx.save(); ctx.beginPath(); ctx.rect(-56, -100, 112, 70); ctx.clip();
      if (fill > 0) { const fy = -30 - fill * 66; ctx.beginPath(); ctx.moveTo(-56, -30); ctx.lineTo(-56, fy + 8); ctx.quadraticCurveTo(0, fy - 12, 56, fy + 8); ctx.lineTo(56, -30); ctx.fillStyle = '#3f3f46'; ctx.fill(); }
      ctx.restore();
      text('CLEAN', 0, -54, 15, '#dcfce7', { align: 'center', weight: 800 });
      for (const wx of [-34, 34]) {
        circle(wx, -14, 15, '#111827'); circle(wx, -14, 7, '#9ca3af');
        line(wx, -14, wx + Math.cos(wheelRot) * 12, -14 + Math.sin(wheelRot) * 12, 2.5, '#d1d5db');
      }
    });
  }
  function truck(x, y, wheelRot) {
    at(x, y, 1, 0, () => {
      withAlpha(.3, () => ellipse(30, 4, 230, 12, '#000'));
      fillRR(-200, -150, 300, 130, 14, '#16a34a');
      fillRR(-200, -150, 150, 130, 14, '#15803d');
      fillRR(-186, -132, 122, 60, 8, '#22c55e'); text('WET', -125, -92, 26, '#fff', { align: 'center', weight: 800 });
      fillRR(-40, -132, 126, 60, 8, '#3b82f6'); text('DRY', 23, -92, 26, '#fff', { align: 'center', weight: 800 });
      text('CLEAN GUDLAVALLERU', -50, -40, 16, '#f0fdf4', { align: 'center', weight: 800, spacing: 1 });
      fillRR(-300, -112, 104, 92, 16, '#f8fafc');
      fillRR(-288, -102, 60, 40, 8, '#93c5fd');
      fillRR(-306, -34, 50, 14, 6, '#e5e7eb');
      circle(-298, -48, 6, '#fde047');
      fillRR(-310, -22, 420, 10, 4, '#1f2937');
      for (const wx of [-240, -60, 50]) {
        circle(wx, -10, 26, '#111827'); circle(wx, -10, 12, '#9ca3af');
        for (let k = 0; k < 3; k++) { const a = wheelRot + k * 2.09; line(wx, -10, wx + Math.cos(a) * 11, -10 + Math.sin(a) * 11, 3, '#4b5563'); }
      }
    });
  }

  /* ---------------- overlays ---------------- */
  function caption(lt, len, step, title, sub, from = .5) {
    const ap = E.out(prog(lt, from, from + .7)), dis = prog(lt, len - .6, len - .1);
    const a = ap * (1 - dis);
    if (a <= 0) return;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(0, (1 - ap) * 30);
    ctx.font = `800 34px ${FONT}`; const tw = ctx.measureText(title).width;
    ctx.font = `500 21px ${FONT}`; const sw = sub ? ctx.measureText(sub).width : 0;
    const w = Math.max(tw, sw) + 64, x = 54, y = 560;
    const g = ctx.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, 'rgba(5,46,22,.92)'); g.addColorStop(1, 'rgba(5,46,22,.72)');
    rr(x, y, w * E.out(prog(lt, from, from + .5)), sub ? 112 : 78, 18); ctx.fillStyle = g; ctx.fill();
    fillRR(x, y, 8, sub ? 112 : 78, 4, '#22c55e');
    if (step) {
      ctx.font = `800 15px ${FONT}`; const bw = ctx.measureText(step).width + 26;
      fillRR(x, y - 38, bw, 30, 15, '#22c55e'); text(step, x + 13, y - 17, 15, '#052e16', { weight: 800, spacing: 1 });
    }
    text(title, x + 32, y + 48, 34, '#fff', { weight: 800 });
    if (sub) text(sub, x + 32, y + 86, 21, '#bbf7d0', { weight: 500 });
    ctx.restore();
  }
  function chip(x, y, str, bg, fg, a = 1, size = 20) {
    if (a <= 0) return;
    withAlpha(a, () => {
      ctx.font = `700 ${size}px ${FONT}`; const w = ctx.measureText(str).width + size * 1.6;
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 6;
      fillRR(x - w / 2, y - size * 1.1, w, size * 2.2, size * 1.1, bg); ctx.restore();
      text(str, x, y + size * .36, size, fg, { align: 'center' });
    });
  }
  function camera(zoom, cx, cy, fn) {
    ctx.save();
    ctx.translate(W / 2, H / 2); ctx.scale(zoom, zoom); ctx.translate(-cx, -cy);
    fn();
    ctx.restore();
  }
  function leaves(t, n, color) {
    for (let i = 0; i < n; i++) {
      const sp = 20 + rnd(i) * 30;
      const x = (rnd(i + 7) * (W + 200) + t * sp * .6) % (W + 200) - 100;
      const y = (rnd(i + 3) * (H + 200) + t * sp) % (H + 200) - 100;
      at(x, y, .6 + rnd(i + 1) * .9, t * (rnd(i + 2) - .5) * 2 + i, () => {
        ellipse(0, 0, 16, 7, color); line(-14, 0, 14, 0, 1.5, 'rgba(255,255,255,.35)');
      });
    }
  }
  function recycleLogo(x, y, r, rot, a = 1) {
    withAlpha(a, () => at(x, y, 1, rot, () => {
      const cols = ['#22c55e', '#4ade80', '#16a34a'];
      for (let k = 0; k < 3; k++) {
        ctx.save(); ctx.rotate(k * Math.PI * 2 / 3);
        ctx.beginPath(); ctx.arc(0, 0, r, -Math.PI / 2 + .25, Math.PI / 6 - .05);
        ctx.lineWidth = r * .28; ctx.strokeStyle = cols[k]; ctx.lineCap = 'butt'; ctx.stroke();
        const ax = Math.cos(Math.PI / 6 - .05) * r, ay = Math.sin(Math.PI / 6 - .05) * r;
        ctx.translate(ax, ay); ctx.rotate(Math.PI / 6 + Math.PI / 2 - .05);
        ctx.beginPath(); ctx.moveTo(-r * .3, -r * .05); ctx.lineTo(r * .3, -r * .05); ctx.lineTo(0, r * .32); ctx.closePath();
        ctx.fillStyle = cols[k]; ctx.fill();
        ctx.restore();
      }
    }));
  }

  /* ============================================================
     SCENES
     ============================================================ */
  const DRAW = {};

  DRAW.title = (lt, len, t) => {
    const g = ctx.createRadialGradient(W / 2, H / 2, 50, W / 2, H / 2, 800);
    g.addColorStop(0, '#166534'); g.addColorStop(1, '#03200f');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    withAlpha(.5, () => leaves(t, 26, '#22c55e'));
    const zoom = lerp(1.06, 1, E.out(prog(lt, 0, len)));
    camera(zoom, W / 2, H / 2, () => {
      const lp = E.back(prog(lt, .2, 1.2));
      recycleLogo(W / 2, 230, 70 * lp, lt * .6, prog(lt, .2, .6));
      const title = tr('Clean Gudlavalleru', 'క్లీన్ గుడ్లవల్లేరు');
      ctx.font = `800 84px ${FONT}`;
      const full = ctx.measureText(title).width;
      let x = W / 2 - full / 2;
      if (LANG === 'te') {
        const p = E.out(prog(lt, 1, 1.9));
        text(title, W / 2, 420 + (1 - p) * 40, 84, '#ffffff', { weight: 800, alpha: p, shadow: 10, align: 'center' });
      } else for (let i = 0; i < title.length; i++) {
        const ch = title[i], cw = ctx.measureText(ch).width;
        const p = E.out(prog(lt, 1 + i * .05, 1.5 + i * .05));
        text(ch, x, 420 + (1 - p) * 40, 84, '#ffffff', { weight: 800, alpha: p, shadow: 10 });
        x += cw;
      }
      // shine sweep
      const sp = prog(lt, 2.2, 3.2);
      if (sp > 0 && sp < 1) {
        ctx.save(); ctx.font = `800 84px ${FONT}`; ctx.textAlign = 'center';
        ctx.beginPath(); ctx.rect(W / 2 - full / 2 - 40 + sp * (full + 80) - 60, 330, 60, 110); ctx.clip();
        ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.fillStyle = '#bbf7d0'; ctx.fillText(title, W / 2, 420); ctx.restore();
      }
      text(tr('Report it.  Clean it.  Keep it green.', 'తెలపండి.  శుభ్రం చేయండి.  పచ్చగా ఉంచండి.'), W / 2, 482, 30, '#86efac', { weight: 600, align: 'center', alpha: E.out(prog(lt, 2.1, 2.8)) });
      const bp = E.out(prog(lt, 2.8, 3.5));
      withAlpha(bp, () => {
        ctx.font = `600 18px ${FONT}`;
        const s = tr('COMMUNITY SERVICE PROJECT  ·  SRGEC  ·  DEPT. OF EEE', 'కమ్యూనిటీ సర్వీస్ ప్రాజెక్ట్  ·  SRGEC  ·  EEE విభాగం');
        const w = ctx.measureText(s).width + 60;
        rr(W / 2 - w / 2, 530, w, 44, 22); ctx.strokeStyle = 'rgba(134,239,172,.6)'; ctx.lineWidth = 2; ctx.stroke();
        text(s, W / 2, 558, 18, '#dcfce7', { weight: 600, align: 'center' });
      });
    });
  };

  DRAW.problem = (lt, len, t) => {
    const z = lerp(1, 1.32, E.io(prog(lt, .3, len)));
    camera(z, lerp(W / 2, PILE_X + 20, E.io(prog(lt, .3, len))), lerp(H / 2, 420, E.io(prog(lt, .3, len))), () => {
      street(t, { clean: 0, garbage: 1, flies: 1, smoke: E.io(prog(lt, 2.5, 4)) });
      // health risk badges
      const badges = [['🦟', tr('Dengue · Malaria', 'డెంగ్యూ · మలేరియా'), 470, 300], ['🪰', tr('Cholera · Typhoid', 'కలరా · టైఫాయిడ్'), 610, 250], ['😷', tr('Breathing problems', 'శ్వాస సమస్యలు'), 750, 300]];
      badges.forEach(([e, l, bx, by], i) => {
        const p = E.back(prog(lt, 4.3 + i * .35, 4.9 + i * .35));
        if (p <= 0) return;
        const fy = by + Math.sin(t * 2 + i) * 5;
        at(bx, fy, p * .78, 0, () => {
          ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.3)'; ctx.shadowBlur = 18; circle(0, 0, 44, '#fff'); ctx.restore();
          ctx.beginPath(); ctx.arc(0, 0, 44, 0, Math.PI * 2); ctx.lineWidth = 5; ctx.strokeStyle = '#ef4444'; ctx.stroke();
          emoji(e, 0, 2, 44);
          chip(0, 74, l, '#ef4444', '#fff', 1, 17);
        });
      });
    });
    caption(lt, len, tr('THE PROBLEM', 'సమస్య'), tr('Garbage piles up on our streets', 'వీధుల్లో చెత్త పేరుకుపోతోంది'), tr('Open dumping · Plastic · Burning waste', 'బహిరంగ పారవేత · ప్లాస్టిక్ · చెత్త కాల్చడం'), .6);
  };

  DRAW.report = (lt, len, t) => {
    const walkT = prog(lt, 0, 2.6);
    const cx = lerp(-80, 455, E.io(walkT));
    const walking = walkT < 1;
    const raise = E.out(prog(lt, 2.6, 3.1));
    const flash = lt > 4.15 && lt < 4.45;
    const z = lerp(1.08, 1.22, E.io(prog(lt, 0, 3)));
    camera(z, lerp(560, 520, E.io(prog(lt, 0, 3))), 430, () => {
      street(t, {
        clean: 0, garbage: 1, flies: 1, smoke: 0,
        people: () => person(cx, CURB - 2, 1.05, {
          girl: true, shirt: '#7c3aed', pants: '#1f2937', hair: '#1c1917', walk: walking ? lt * 8 : null,
          armF: walking ? null : [lerp(-.15, -2.2, raise), lerp(.25, .9, raise)], prop: raise > .5 ? 'phone' : null, flash
        })
      });
    });
    if (flash) withAlpha(1 - Math.abs(lt - 4.3) / .15, () => { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); });
    // phone close-up
    const pin = E.out(prog(lt, 3, 3.6)), pout = E.in(prog(lt, len - .7, len - .2));
    if (pin > 0) {
      const px = lerp(W + 40, 880, pin) + pout * 500, py = 70, pw = 300, ph = 580;
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 20;
      fillRR(px, py, pw, ph, 44, '#0b0f19'); ctx.restore();
      fillRR(px + 12, py + 12, pw - 24, ph - 24, 34, '#f8fafc');
      ctx.save(); rr(px + 12, py + 12, pw - 24, ph - 24, 34); ctx.clip();
      phoneScreen(lt - 3.5, px + 12, py + 12, pw - 24, ph - 24, t);
      ctx.restore();
      fillRR(px + pw / 2 - 50, py + 18, 100, 22, 11, '#0b0f19');
    }
    caption(lt, len, tr('STEP 1 · REPORT', 'దశ 1 · ఫిర్యాదు'), tr('Anyone can report in seconds', 'ఎవరైనా క్షణాల్లో తెలపవచ్చు'), tr('Photo + GPS location · No sign-up needed', 'ఫోటో + GPS లొకేషన్ · సైన్-అప్ అవసరం లేదు'), .4);
  };

  function phoneScreen(st, x, y, w, h, t) {
    // header
    fillRR(x, y, w, 76, 0, '#14532d');
    text('♻ Clean Gudlavalleru', x + 20, y + 56, 17, '#fff', { weight: 700 });
    const cx = x + w / 2;
    if (st < 1.1) {
      // camera viewfinder
      ctx.fillStyle = '#1c1917'; ctx.fillRect(x, y + 76, w, h - 76);
      at(cx, y + 300, 1, 0, () => {
        ctx.fillStyle = '#57534e'; ctx.fillRect(-140, 40, 280, 160);
        ctx.fillStyle = '#a8a29e'; ctx.fillRect(-140, -60, 280, 100);
        PIECES.slice(0, 14).forEach((p, i) => drawPiece(p, (p.x - PILE_X) * .9, 40 + (p.y - PILE_Y) * .9, p.rot, .8));
      });
      const b = 18 + Math.sin(st * 8) * 3;
      ctx.strokeStyle = '#facc15'; ctx.lineWidth = 3;
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => {
        const bx = cx + sx * 80, by = y + 330 + sy * 70;
        ctx.beginPath(); ctx.moveTo(bx, by - sy * b); ctx.lineTo(bx, by); ctx.lineTo(bx - sx * b, by); ctx.stroke();
      });
      circle(cx, y + h - 64, 30, '#fff'); circle(cx, y + h - 64, 24, st > .7 ? '#e5e7eb' : '#fff');
      ctx.beginPath(); ctx.arc(cx, y + h - 64, 30, 0, Math.PI * 2); ctx.lineWidth = 4; ctx.strokeStyle = '#d4d4d8'; ctx.stroke();
      return;
    }
    if (st < 3.3) {
      const s2 = st - 1.1;
      text('Report a problem', x + 20, y + 112, 20, '#0f172a', { weight: 800 });
      // photo thumb
      fillRR(x + 20, y + 128, w - 40, 110, 12, '#57534e');
      ctx.save(); rr(x + 20, y + 128, w - 40, 110, 12); ctx.clip();
      PIECES.slice(0, 12).forEach(p => drawPiece(p, cx + (p.x - PILE_X) * .7, y + 205 + (p.y - PILE_Y) * .7, p.rot, .65));
      ctx.restore();
      chip(x + w - 60, y + 145, '✓ Photo', '#16a34a', '#fff', 1, 11);
      // mini map
      fillRR(x + 20, y + 252, w - 40, 100, 12, '#e2f0d9');
      line(x + 20, y + 300, x + w - 20, y + 290, 8, '#fff'); line(x + 120, y + 252, x + 140, y + 352, 8, '#fff');
      ctx.beginPath(); ctx.moveTo(x + 20, y + 335); ctx.quadraticCurveTo(cx, y + 315, x + w - 20, y + 340); ctx.lineWidth = 10; ctx.strokeStyle = '#93c5fd'; ctx.stroke();
      const drop = E.bounce(prog(s2, .1, .8));
      const pxp = cx + 10, pyp = y + 250 + drop * 44;
      ctx.beginPath(); ctx.arc(pxp, pyp - 14, 12, Math.PI, 0); ctx.lineTo(pxp, pyp + 6); ctx.closePath(); ctx.fillStyle = '#dc2626'; ctx.fill(); circle(pxp, pyp - 14, 4.5, '#fff');
      text('📍 Location found · 16.36°N, 81.05°E', x + 24, y + 372, 12, '#15803d', { weight: 700, alpha: prog(s2, .6, 1) });
      // categories
      const cats = ['Overflowing bin', 'Open dumping', 'Burning'];
      cats.forEach((c, i) => {
        const sel = i === 1 && s2 > 1.1;
        const cxp = x + 20 + i * 86;
        fillRR(cxp, y + 390, 80, 44, 10, sel ? '#dcfce7' : '#fff');
        rr(cxp, y + 390, 80, 44, 10); ctx.lineWidth = 2; ctx.strokeStyle = sel ? '#16a34a' : '#e2e8f0'; ctx.stroke();
        text(c.split(' ')[0], cxp + 40, y + 410, 11, '#0f172a', { align: 'center', weight: 700 });
        text(c.split(' ')[1] || '', cxp + 40, y + 425, 11, '#0f172a', { align: 'center', weight: 700 });
      });
      // send button
      const press = s2 > 1.8 && s2 < 2.0 ? .94 : 1;
      at(cx, y + h - 60, press, 0, () => { fillRR(-(w - 40) / 2, -26, w - 40, 52, 14, '#16a34a'); text('Send report', 0, 7, 19, '#fff', { align: 'center', weight: 800 }); });
      // tap ripple
      if (s2 > 1.75 && s2 < 2.4) withAlpha(1 - prog(s2, 1.75, 2.4), () => { ctx.beginPath(); ctx.arc(cx + 30, y + h - 60, 10 + prog(s2, 1.75, 2.4) * 40, 0, Math.PI * 2); ctx.lineWidth = 4; ctx.strokeStyle = '#fff'; ctx.stroke(); });
      return;
    }
    // success
    const s3 = st - 3.3;
    const ck = E.out(prog(s3, 0, .5));
    circle(cx, y + 210, 70 * E.back(prog(s3, 0, .4)), '#dcfce7');
    circle(cx, y + 210, 52 * E.back(prog(s3, 0, .4)), '#16a34a');
    ctx.beginPath(); ctx.moveTo(cx - 22, y + 210);
    const p1 = clamp(ck * 2), p2 = clamp(ck * 2 - 1);
    ctx.lineTo(cx - 22 + 16 * p1, y + 210 + 16 * p1);
    if (p2 > 0) ctx.lineTo(cx - 6 + 30 * p2, y + 226 - 34 * p2);
    ctx.lineWidth = 9; ctx.strokeStyle = '#fff'; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
    const ta = E.out(prog(s3, .3, .8));
    text('Report sent!', cx, y + 330, 26, '#14532d', { align: 'center', weight: 800, alpha: ta });
    text('Your tracking ID', cx, y + 370, 14, '#64748b', { align: 'center', weight: 600, alpha: ta });
    withAlpha(ta, () => { fillRR(cx - 105, y + 384, 210, 46, 12, '#dcfce7'); });
    text('GW-2026-00128', cx, y + 415, 20, '#166534', { align: 'center', weight: 800, alpha: ta });
    text('Sent to North Zone', cx, y + 470, 14, '#334155', { align: 'center', weight: 700, alpha: E.out(prog(s3, .7, 1.1)) });
    text('Sanitary Department', cx, y + 490, 14, '#334155', { align: 'center', weight: 700, alpha: E.out(prog(s3, .7, 1.1)) });
  }

  DRAW.route = (lt, len, t) => {
    // top-down map
    ctx.fillStyle = '#eef4e6'; ctx.fillRect(0, 0, W, H);
    const z = lerp(1.12, 1, E.out(prog(lt, 0, 1.6)));
    camera(z, W / 2, H / 2, () => {
      for (let i = 0; i < 14; i++) fillRR(60 + (i % 7) * 175, 70 + Math.floor(i / 7) * 330, 120, 90 + (i % 3) * 30, 10, i % 3 ? '#d9ead0' : '#c7e3b6');
      ctx.beginPath(); ctx.moveTo(-50, 520); ctx.bezierCurveTo(300, 450, 700, 640, 1350, 560);
      ctx.lineWidth = 46; ctx.strokeStyle = '#93c5fd'; ctx.stroke();
      ctx.lineWidth = 18; ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.stroke();
      [[0, 300, W, 280], [0, 140, W, 170], [400, 0, 430, H], [820, 0, 780, H]].forEach(([a, b, c, d]) => line(a, b, c, d, 22, '#ffffff'));
      [[0, 300, W, 280], [400, 0, 430, H]].forEach(([a, b, c, d]) => { ctx.setLineDash([14, 14]); line(a, b, c, d, 3, '#fbbf24'); ctx.setLineDash([]); });
      const zones = [
        { p: [[90, 60], [1190, 60], [1190, 300], [90, 300]], c: '#2563eb', n: 'NORTH ZONE' },
        { p: [[90, 310], [620, 310], [620, 680], [90, 680]], c: '#d97706', n: 'SOUTH-WEST ZONE' },
        { p: [[630, 310], [1190, 310], [1190, 680], [630, 680]], c: '#16a34a', n: 'SOUTH-EAST ZONE' }
      ];
      zones.forEach((zn, i) => {
        const a = E.out(prog(lt, .1 + i * .15, .6 + i * .15));
        withAlpha(a, () => {
          ctx.beginPath(); zn.p.forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath();
          ctx.fillStyle = zn.c + '18'; ctx.fill(); ctx.setLineDash([12, 8]); ctx.lineWidth = 3; ctx.strokeStyle = zn.c; ctx.stroke(); ctx.setLineDash([]);
          const hi = i === 0 && lt > 1.4;
          chip(zn.p[0][0] + 110, zn.p[0][1] + 34, zn.n, hi ? zn.c : '#fff', hi ? '#fff' : zn.c, 1, 15);
        });
      });
      // pin drop
      const pd = E.bounce(prog(lt, .6, 1.4));
      const PX = 520, PY = 210;
      if (lt > .6) {
        for (let k = 0; k < 3; k++) {
          const rp = ((lt - 1.3) * .8 + k / 3) % 1;
          if (lt > 1.3) withAlpha((1 - rp) * .6, () => { ctx.beginPath(); ctx.ellipse(PX, PY, 10 + rp * 70, (10 + rp * 70) * .45, 0, 0, Math.PI * 2); ctx.lineWidth = 3; ctx.strokeStyle = '#dc2626'; ctx.stroke(); });
        }
        const py = lerp(PY - 300, PY, pd);
        at(PX, py, 1.3, 0, () => {
          ctx.beginPath(); ctx.arc(0, -36, 22, Math.PI * .85, Math.PI * 2.15); ctx.lineTo(0, 0); ctx.closePath(); ctx.fillStyle = '#dc2626'; ctx.fill();
          circle(0, -36, 8, '#fff');
        });
      }
      // department building card
      const DX = 1000, DY = 170;
      const ba = E.back(prog(lt, 1.6, 2.2));
      at(DX, DY, ba, 0, () => {
        ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 8; fillRR(-90, -70, 180, 140, 20, '#fff'); ctx.restore();
        fillRR(-34, -48, 68, 70, 6, '#64748b'); for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) fillRR(-26 + c * 19, -40 + r * 20, 12, 12, 2, '#bfdbfe');
        fillRR(-10, 6, 20, 16, 2, '#334155');
        text('Sanitary Dept', 0, 46, 16, '#0f172a', { align: 'center', weight: 800 });
        if (lt > 3.1) { const b = E.back(prog(lt, 3.1, 3.5)); circle(70, -62, 18 * b, '#ef4444'); text('1', 70, -55, 18 * b, '#fff', { align: 'center', weight: 800 }); }
      });
      // signal travelling
      const sp = E.io(prog(lt, 1.8, 3.1));
      if (sp > 0 && sp < 1) {
        const bx = (u) => { const a = 1 - u; return [a * a * PX + 2 * a * u * 780 + u * u * DX, a * a * (PY - 40) + 2 * a * u * 20 + u * u * (DY - 10)]; };
        ctx.setLineDash([8, 10]); ctx.beginPath();
        for (let u = 0; u <= sp; u += .02) { const [x, y] = bx(u); u ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
        ctx.lineWidth = 4; ctx.strokeStyle = '#2563eb'; ctx.stroke(); ctx.setLineDash([]);
        const [hx, hy] = bx(sp);
        circle(hx, hy, 16, 'rgba(37,99,235,.25)'); circle(hx, hy, 9, '#2563eb');
      }
    });
    // dashboard card
    const da = E.out(prog(lt, 3.3, 3.9)), dout = E.in(prog(lt, len - .6, len - .1));
    if (da > 0) {
      const x = 700, y = lerp(H + 20, 330, da) + dout * 400, w = 520, h = 330;
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.3)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 16; fillRR(x, y, w, h, 22, '#fff'); ctx.restore();
      ctx.save(); rr(x, y, w, h, 22); ctx.clip();
      fillRR(x, y, w, 58, 0, '#1e293b');
      text('🏢  North Zone · Sanitary Department', x + 22, y + 37, 17, '#fff', { weight: 700 });
      const cnt = Math.round(lerp(12, 13, prog(lt, 3.9, 4.2)));
      const tiles = [['Received', cnt, '#0f172a'], ['Pending', lt > 4.2 ? 4 : 3, '#dc2626'], ['In progress', 2, '#2563eb'], ['Solved', 7, '#16a34a']];
      tiles.forEach(([l, n, c], i) => {
        const tx = x + 20 + i * 122;
        fillRR(tx, y + 76, 112, 86, 12, '#f8fafc');
        fillRR(tx, y + 76, 6, 86, 3, c);
        const bump = i < 2 && lt > 3.9 && lt < 4.5 ? 1 + Math.sin(prog(lt, 3.9, 4.5) * Math.PI) * .15 : 1;
        at(tx + 22, y + 128, bump, 0, () => text(String(n), 0, 0, 36, c, { weight: 800 }));
        text(l, tx + 22, y + 150, 13, '#64748b', { weight: 700 });
      });
      const ra = E.out(prog(lt, 4.4, 4.9));
      withAlpha(ra, () => {
        const ry = y + 186 + (1 - ra) * 20;
        fillRR(x + 20, ry, w - 40, 60, 12, lt < 5.4 ? '#fef9c3' : '#f8fafc');
        fillRR(x + 32, ry + 10, 52, 40, 6, '#57534e');
        text('Open garbage dumping', x + 98, ry + 26, 16, '#0f172a', { weight: 800 });
        text('GW-2026-00128 · 2 min ago', x + 98, ry + 46, 13, '#64748b', { weight: 600 });
        chip(x + w - 96, ry + 30, 'NEW', '#dc2626', '#fff', 1, 13);
      });
      const aa = E.out(prog(lt, 5.1, 5.5));
      withAlpha(aa, () => {
        fillRR(x + 20, y + 262, w - 40, 50, 12, '#2563eb');
        text('👷  Assigned to Ramesh K', x + w / 2, y + 294, 18, '#fff', { weight: 800, align: 'center' });
      });
      ctx.restore();
    }
    caption(lt, len, tr('STEP 2 · DEPARTMENT', 'దశ 2 · విభాగం'), tr('Sent to the right department', 'సరైన విభాగానికి చేరుతుంది'), tr('Routed automatically by GPS zone', 'GPS జోన్ ఆధారంగా ఆటోమేటిక్‌గా'), .3);
  };

  DRAW.clean = (lt, len, t) => {
    const N = PIECES.length;
    const walkT = prog(lt, 0, 2.6);
    const wx = lerp(1400, 800, E.io(walkT));
    const sweeping = lt > 3.4 && lt < 7.2;
    const sweepStart = 3.5, sweepDur = 3.4;
    const cartX = wx + 125, cartY = CURB + 4;
    const target = [cartX, cartY - 108];
    let removed = 0;
    const pieceFn = (i, p) => {
      const ti = sweepStart + (i / N) * sweepDur;
      const u = prog(lt, ti, ti + .55);
      if (u <= 0) return { x: p.x, y: p.y, rot: p.rot, s: 1 };
      if (u >= 1) { removed++; return false; }
      const e = E.io(u);
      return { x: lerp(p.x, target[0], e), y: lerp(p.y, target[1], e) - Math.sin(e * Math.PI) * 190, rot: p.rot + e * 6, s: lerp(1, .6, e) };
    };
    const z = lerp(1.05, 1.22, E.io(prog(lt, 0, 3.4)));
    let flies = 1 - prog(lt, 3.6, 6.4);
    camera(z, lerp(760, 640, E.io(prog(lt, 0, 3.4))), 420, () => {
      street(t, {
        clean: 0, garbage: 1 - prog(lt, sweepStart + 1, sweepStart + sweepDur + .4), flies, fliesSpread: prog(lt, 3.6, 6.4), piece: pieceFn,
        people: () => {
          const fill = clamp(removed / N);
          cart(cartX, cartY, fill * .9 + (lt > sweepStart ? .05 : 0), walkT < 1 ? -lt * 6 : 0, -1);
          person(wx, CURB - 2, 1.05, {
            dir: -1, vest: true, helmet: true, shirt: '#ea580c', pants: '#334155', skin: '#a0673d',
            walk: walkT < 1 ? lt * 7.5 : null, prop: lt > 7.3 ? 'phone' : 'broom',
            broomAng: sweeping ? Math.sin(lt * 9) * .45 : 0,
            armF: lt > 7.3 ? [-2.1, .9] : sweeping ? [.5 + Math.sin(lt * 9) * .25, .5] : [-.3, .4]
          });
          // GPS check-in rings
          if (lt > 2.6 && lt < 4.6) for (let k = 0; k < 3; k++) {
            const rp = ((lt - 2.6) * .9 + k / 3) % 1;
            withAlpha((1 - rp) * .8 * (1 - prog(lt, 4.1, 4.6)), () => { ctx.beginPath(); ctx.ellipse(wx, CURB, 20 + rp * 90, (20 + rp * 90) * .3, 0, 0, Math.PI * 2); ctx.lineWidth = 4; ctx.strokeStyle = '#3b82f6'; ctx.stroke(); });
          }
        }
      });
      chip(wx, CURB - 210, tr('📍 Checked in · GPS verified · 12 m', '📍 చెక్-ఇన్ · GPS ధృవీకరణ · 12 మీ'), '#2563eb', '#fff', fadeIO(lt, 2.8, 4.8), 18);
      chip(wx - 30, CURB - 210, tr('📷 After photo uploaded ✓', '📷 తర్వాతి ఫోటో అప్‌లోడ్ ✓'), '#16a34a', '#fff', fadeIO(lt, 7.5, len - .2), 18);
    });
    // truck passes in front
    const tp = prog(lt, 5.9, 8.4);
    if (tp > 0 && tp < 1) {
      camera(z, lerp(760, 640, E.io(prog(lt, 0, 3.4))), 420, () => truck(lerp(1800, -500, E.io(tp)), 655, tp * 40));
    }
    caption(lt, len, tr('STEP 3 · CLEANING', 'దశ 3 · శుభ్రత'), tr('A worker cleans the spot', 'కార్మికుడు ఆ ప్రదేశాన్ని శుభ్రం చేస్తారు'), tr('GPS check-in · Before & after photo as proof', 'GPS చెక్-ఇన్ · రుజువుగా ముందు & తర్వాత ఫోటో'), .5);
  };

  function segItem(type, x, y, s, rot) {
    at(x, y, s, rot, () => {
      switch (type) {
        case 'banana':
          ctx.beginPath(); ctx.moveTo(-34, -6); ctx.quadraticCurveTo(0, 40, 34, -6); ctx.quadraticCurveTo(0, 18, -34, -6); ctx.fillStyle = '#facc15'; ctx.fill();
          circle(-34, -6, 5, '#713f12'); break;
        case 'bottle':
          fillRR(-16, -40, 32, 76, 10, 'rgba(96,165,250,.9)'); fillRR(-8, -54, 16, 16, 3, '#1d4ed8'); fillRR(-16, -10, 32, 18, 0, '#ef4444'); ellipse(-6, -20, 4, 14, 'rgba(255,255,255,.5)'); break;
        case 'battery':
          fillRR(-16, -36, 32, 70, 6, '#111827'); fillRR(-16, -36, 32, 26, 6, '#f59e0b'); fillRR(-7, -44, 14, 9, 2, '#9ca3af');
          text('+', 0, -16, 22, '#111827', { align: 'center', weight: 800 }); break;
        case 'leaf':
          ellipse(0, 0, 36, 18, '#22c55e', -.4); line(-30, 12, 30, -12, 3, '#15803d'); break;
        case 'paper':
          fillRR(-34, -26, 68, 52, 4, '#f1f5f9'); fillRR(-28, -20, 30, 18, 2, '#cbd5e1');
          for (let k = 0; k < 4; k++) line(6, -16 + k * 9, 28, -16 + k * 9, 3, '#94a3b8'); line(-28, 8, 28, 8, 3, '#94a3b8'); line(-28, 17, 20, 17, 3, '#94a3b8'); break;
        case 'bulb':
          circle(0, -10, 26, '#fef08a'); ctx.beginPath(); ctx.arc(0, -10, 26, 0, Math.PI * 2); ctx.lineWidth = 3; ctx.strokeStyle = '#eab308'; ctx.stroke();
          fillRR(-12, 12, 24, 20, 3, '#9ca3af'); line(-12, 18, 12, 18, 2, '#6b7280'); line(-12, 25, 12, 25, 2, '#6b7280'); break;
        case 'apple':
          ctx.beginPath(); ctx.moveTo(-14, -28); ctx.quadraticCurveTo(-30, 0, -14, 28); ctx.lineTo(14, 28); ctx.quadraticCurveTo(30, 0, 14, -28); ctx.closePath(); ctx.fillStyle = '#fef3c7'; ctx.fill();
          ellipse(-18, -26, 10, 7, '#dc2626'); ellipse(18, -26, 10, 7, '#dc2626'); ellipse(-18, 26, 10, 7, '#dc2626'); ellipse(18, 26, 10, 7, '#dc2626');
          line(0, -32, 4, -44, 4, '#78350f'); break;
        case 'can':
          fillRR(-20, -32, 40, 64, 6, '#cbd5e1'); fillRR(-20, -14, 40, 26, 0, '#16a34a'); ellipse(0, -32, 20, 6, '#e2e8f0'); break;
      }
    });
  }
  DRAW.segregate = (lt, len, t) => {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#f0fdf4'); g.addColorStop(1, '#bbf7d0'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    withAlpha(.25, () => leaves(t, 12, '#22c55e'));
    ctx.fillStyle = '#86efac'; ctx.fillRect(0, 610, W, H);
    text(tr('Segregate waste at source', 'చెత్తను మూలంలోనే వేరుచేయండి'), W / 2, 92, 44, '#14532d', { align: 'center', weight: 800, alpha: E.out(prog(lt, 0, .5)) });
    const BINS = [
      { k: 'wet', x: 330, c: '#16a34a', d: '#15803d', l: tr('WET', 'తడి'), s: tr('Biodegradable', 'జీవ విచ్ఛిన్నం') },
      { k: 'dry', x: 640, c: '#2563eb', d: '#1d4ed8', l: tr('DRY', 'పొడి'), s: tr('Non-biodegradable', 'విచ్ఛిన్నం కానిది') },
      { k: 'haz', x: 950, c: '#dc2626', d: '#b91c1c', l: tr('HAZARDOUS', 'ప్రమాదకరం'), s: tr('Domestic hazardous', 'గృహ ప్రమాదకరం') }
    ];
    const ITEMS = [['banana', 'wet', tr('Banana peel', 'అరటి తొక్క')], ['bottle', 'dry', tr('Plastic bottle', 'ప్లాస్టిక్ సీసా')], ['battery', 'haz', tr('Battery', 'బ్యాటరీ')], ['leaf', 'wet', tr('Garden leaves', 'తోట ఆకులు')],
      ['paper', 'dry', tr('Newspaper', 'వార్తాపత్రిక')], ['bulb', 'haz', tr('Bulb', 'బల్బు')], ['apple', 'wet', tr('Food waste', 'ఆహార వ్యర్థాలు')], ['can', 'dry', tr('Tin can', 'టిన్ డబ్బా')]];
    const step = .62, start = .5;
    const counts = { wet: 0, dry: 0, haz: 0 };
    const active = [];
    ITEMS.forEach(([type, bin, name], i) => {
      const a = start + i * step;
      const u = prog(lt, a, a + step);
      if (lt >= a + step) counts[bin]++;
      else if (u > 0) active.push({ type, bin, name, u });
    });
    BINS.forEach(b => {
      const near = active.find(x => x.bin === b.k && x.u > .45);
      const lid = near ? Math.sin(prog(near.u, .45, 1) * Math.PI) * .9 : 0;
      const justIn = ITEMS.some(([, bin], i) => bin === b.k && lt - (start + (i + 1) * step) > 0 && lt - (start + (i + 1) * step) < .25);
      const sq = justIn ? 1 + Math.sin(prog(lt % step, 0, .25) * Math.PI) * .05 : 1;
      const ap = E.back(prog(lt, .1, .6));
      at(b.x, 610, ap, 0, () => {
        ctx.scale(1 / sq, sq);
        withAlpha(.2, () => ellipse(0, 4, 110, 14, '#000'));
        ctx.beginPath(); ctx.moveTo(-95, -230); ctx.lineTo(95, -230); ctx.lineTo(80, 0); ctx.lineTo(-80, 0); ctx.closePath(); ctx.fillStyle = b.c; ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(-70, -220, 26, 210);
        text(b.l, 0, -120, b.l.length > 6 ? 26 : 36, '#fff', { align: 'center', weight: 800 });
        text(b.s, 0, -88, 16, 'rgba(255,255,255,.9)', { align: 'center', weight: 600 });
        circle(0, -40, 24, 'rgba(255,255,255,.2)'); text(String(counts[b.k]), 0, -31, 26, '#fff', { align: 'center', weight: 800 });
        at(-100, -236, 1, -lid, () => { fillRR(0, -18, 200, 22, 8, b.d); fillRR(80, -30, 40, 14, 6, b.d); });
      });
    });
    active.forEach(({ type, bin, name, u }) => {
      const b = BINS.find(x => x.k === bin);
      const hold = prog(u, 0, .35), fly = E.io(prog(u, .35, 1));
      const x = lerp(W / 2, b.x, fly), y = lerp(lerp(120, 210, E.out(hold)), 340, fly) - Math.sin(fly * Math.PI) * 80;
      const s = lerp(1.1, .7, fly) * E.back(clamp(hold * 2));
      segItem(type, x, y, s, fly * 3);
      chip(W / 2, 290, `${name} → ${b.l}`, b.c, '#fff', 1 - prog(u, .5, .7), 20);
    });
    caption(lt, len, tr('SEGREGATION', 'వేరుచేయడం'), tr('Wet · Dry · Hazardous', 'తడి · పొడి · ప్రమాదకరం'), tr('Separate bins make recycling & composting possible', 'వేర్వేరు డబ్బాలతో రీసైక్లింగ్, కంపోస్టింగ్ సాధ్యం'), 4.2);
  };

  DRAW.green = (lt, len, t) => {
    const wipe = E.io(prog(lt, .3, 2.3));
    const z = lerp(1.08, 1, E.out(prog(lt, 2.3, len)));
    const pair = () => {
      person(470, CURB - 2, 1.05, { girl: true, shirt: '#7c3aed', pants: '#1f2937', armF: [-2.6 + Math.sin(t * 6) * .3, .3] });
      person(800, CURB - 2, 1.05, { dir: -1, vest: true, helmet: true, shirt: '#ea580c', pants: '#334155', skin: '#a0673d', armF: [-2.6 + Math.sin(t * 6 + 1) * .3, .3] });
    };
    camera(z, W / 2, H / 2, () => {
      if (wipe < 1) street(t, { clean: 0, garbage: 1, flies: 1 });
      if (wipe > 0) {
        ctx.save(); ctx.beginPath(); ctx.rect(-400, -300, (W + 800) * wipe, H + 600); ctx.clip();
        street(t, { clean: 1, garbage: 0, flowers: prog(lt, .2, 2.8), birds: 1, bin: true, people: lt > 2.3 ? pair : null });
        ctx.restore();
      }
    });
    if (wipe > 0 && wipe < 1) {
      const x = W * wipe;
      line(x, 0, x, H, 6, '#fff');
      circle(x, H / 2, 30, '#fff');
      text('⟷', x, H / 2 + 9, 28, '#15803d', { align: 'center', weight: 800 });
      chip(Math.max(110, x - 120), 60, tr('AFTER', 'తర్వాత'), '#16a34a', '#fff', 1, 20);
      chip(Math.min(W - 110, x + 120), 60, tr('BEFORE', 'ముందు'), '#57534e', '#fff', 1, 20);
    }
    // sparkles
    if (lt > 2.3) for (let i = 0; i < 10; i++) {
      const p = ((t * .7 + rnd(i)) % 1);
      const sx = 120 + rnd(i + 10) * 1040, sy = 160 + rnd(i + 20) * 280;
      withAlpha(Math.sin(p * Math.PI) * prog(lt, 2.3, 3), () => at(sx, sy, .6 + Math.sin(p * Math.PI) * .6, p * 2, () => {
        ctx.beginPath(); for (let k = 0; k < 8; k++) { const r = k % 2 ? 4 : 14, a = k * Math.PI / 4; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
        ctx.closePath(); ctx.fillStyle = '#fef08a'; ctx.fill();
      }));
    }
    const ta = E.back(prog(lt, 2.8, 3.5)), tout = 1 - prog(lt, len - .5, len - .1);
    if (ta > 0) at(W / 2, 110, ta, 0, () => withAlpha(tout, () => {
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.3)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 10;
      const bt = tr('✨ Clean & Green Gudlavalleru ✨', '✨ క్లీన్ & గ్రీన్ గుడ్లవల్లేరు ✨');
      ctx.font = `800 40px ${FONT}`; const bw = ctx.measureText(bt).width + 90;
      fillRR(-bw / 2, -52, bw, 104, 52, '#15803d'); ctx.restore();
      text(bt, 0, 15, 40, '#fff', { align: 'center', weight: 800 });
    }));
  caption(lt, len, tr('THE RESULT', 'ఫలితం'), tr('Clean streets, healthy families', 'శుభ్రమైన వీధులు, ఆరోగ్యకరమైన కుటుంబాలు'), tr('Together we keep Gudlavalleru clean', 'అందరం కలిసి గుడ్లవల్లేరును శుభ్రంగా ఉంచుదాం'), 3.6);
  };

  DRAW.end = (lt, len, t) => {
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#052e16'); g.addColorStop(1, '#166534'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    withAlpha(.45, () => leaves(t, 22, '#22c55e'));
    recycleLogo(W / 2, 140, 52 * E.back(prog(lt, 0, .6)), t * .5, 1);
    const a1 = E.out(prog(lt, .3, .9));
    text(tr('See garbage? Report it.', 'చెత్త కనిపించిందా? తెలపండి.'), W / 2, 300 + (1 - a1) * 30, 70, '#fff', { align: 'center', weight: 800, alpha: a1, shadow: 12 });
    const steps = [['📸', tr('Photo', 'ఫోటో')], ['🏢', tr('Department', 'విభాగం')], ['🧹', tr('Cleaned', 'శుభ్రం')], ['🌼', tr('Green', 'పచ్చదనం')]];
    steps.forEach(([e, l], i) => {
      const p = E.back(prog(lt, 1 + i * .25, 1.5 + i * .25));
      const x = W / 2 - 360 + i * 240;
      at(x, 410, p, 0, () => {
        circle(0, 0, 50, 'rgba(255,255,255,.12)');
        ctx.beginPath(); ctx.arc(0, 0, 50, 0, Math.PI * 2); ctx.lineWidth = 3; ctx.strokeStyle = '#4ade80'; ctx.stroke();
        emoji(e, 0, 2, 44);
        text(l, 0, 82, 20, '#dcfce7', { align: 'center', weight: 700 });
      });
      if (i < 3) text('➜', x + 120, 420, 32, '#4ade80', { align: 'center', weight: 800, alpha: prog(lt, 1.3 + i * .25, 1.6 + i * .25) });
    });
    const a3 = E.out(prog(lt, 2.3, 2.9));
    withAlpha(a3, () => {
      fillRR(W / 2 - 230, 548, 460, 62, 31, '#22c55e');
      text(tr('Clean Gudlavalleru', 'క్లీన్ గుడ్లవల్లేరు'), W / 2, 590, 30, '#052e16', { align: 'center', weight: 800 });
    });
    text(tr('Community Service Project · Seshadri Rao Gudlavalleru Engineering College · Dept. of EEE', 'కమ్యూనిటీ సర్వీస్ ప్రాజెక్ట్ · శేషాద్రి రావు గుడ్లవల్లేరు ఇంజనీరింగ్ కళాశాల · EEE విభాగం'), W / 2, 660, 17, '#86efac', { align: 'center', weight: 500, alpha: E.out(prog(lt, 2.8, 3.4)) });
  };

  /* ============================================================
     RENDER + PLAYER
     ============================================================ */
  function sceneAt(t) { return SCENES.find(s => t < s.b) || SCENES[SCENES.length - 1]; }

  function render(c, t) {
    ctx = c;
    ctx.setTransform(c.canvas.width / W, 0, 0, c.canvas.height / H, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const s = sceneAt(t);
    ctx.save();
    DRAW[s.id](t - s.a, s.len, t);
    ctx.restore();
    // scene transition: quick dip to dark
    let d = Infinity;
    for (const x of SCENES) { if (x.a > 0) d = Math.min(d, Math.abs(t - x.a)); }
    if (d < .3) withAlpha((1 - d / .3) * .95, () => { ctx.fillStyle = '#04150b'; ctx.fillRect(0, 0, W, H); });
    // fade from black at the very start
    if (t < .4) withAlpha(1 - t / .4, () => { ctx.fillStyle = '#04150b'; ctx.fillRect(0, 0, W, H); });
    // cinematic vignette
    const v = ctx.createRadialGradient(W / 2, H / 2, H * .45, W / 2, H / 2, H * 1.05);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.32)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  }

  const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  function createPlayer(root, { autoplay = true, loop = true } = {}) {
    root.classList.add('film');
    root.innerHTML = `
      <div class="film-screen">
        <canvas width="${W * RES}" height="${H * RES}"></canvas>
        <button class="film-bigplay" aria-label="Play">▶</button>
      </div>
      <div class="film-bar">
        <button class="film-btn film-play" aria-label="Play or pause">⏸</button>
        <span class="film-time">0:00 / ${fmt(DURATION)}</span>
        <div class="film-track"><div class="film-chapters"></div><div class="film-fill"></div><input type="range" min="0" max="${DURATION}" step="0.01" value="0" aria-label="Seek"></div>
        <button class="film-btn film-fs" title="Full screen" aria-label="Full screen">⛶</button>
      </div>
      <div class="film-steps">${SCENES.map((s, i) => `<button data-i="${i}"><span>${s.icon}</span>${LANG === 'te' ? s.te : s.label}</button>`).join('')}</div>`;
    const canvas = root.querySelector('canvas');
    const c2d = canvas.getContext('2d');
    const playBtn = root.querySelector('.film-play'), big = root.querySelector('.film-bigplay');
    const range = root.querySelector('input[type=range]'), fill = root.querySelector('.film-fill'), time = root.querySelector('.film-time');
    const steps = [...root.querySelectorAll('.film-steps button')];
    root.querySelector('.film-chapters').innerHTML = SCENES.slice(1).map(s => `<i style="left:${s.a / DURATION * 100}%"></i>`).join('');

    let t = 0, playing = false, last = 0, userPaused = false, raf = 0;

    function draw() {
      render(c2d, t);
      range.value = t;
      fill.style.width = (t / DURATION * 100) + '%';
      time.textContent = `${fmt(t)} / ${fmt(DURATION)}`;
      const cur = SCENES.indexOf(sceneAt(t));
      steps.forEach((b, i) => b.classList.toggle('on', i === cur));
    }
    function frame(now) {
      raf = 0;
      if (!playing) return;
      const dt = Math.min(.1, (now - last) / 1000); last = now;
      t += dt;
      if (t >= DURATION) {
        t = loop ? 0 : DURATION - .001;
        if (!loop) { pause(); }
      }
      draw();
      raf = requestAnimationFrame(frame);
    }
    function play() {
      if (playing) return;
      playing = true; userPaused = false;
      playBtn.textContent = '⏸'; big.classList.add('hidden');
      last = performance.now();
      if (!raf) raf = requestAnimationFrame(frame);
    }
    function pause(byUser) {
      playing = false; if (byUser) userPaused = true;
      playBtn.textContent = '▶'; big.classList.remove('hidden');
      draw();
    }
    function seek(v) { t = clamp(v, 0, DURATION - .001); draw(); }

    playBtn.onclick = () => (playing ? pause(true) : play());
    big.onclick = () => play();
    canvas.onclick = () => (playing ? pause(true) : play());
    range.oninput = () => seek(Number(range.value));
    steps.forEach((b, i) => b.onclick = () => { seek(SCENES[i].a + .01); play(); });
    root.querySelector('.film-fs').onclick = () => {
      const el = root.querySelector('.film-screen');
      if (document.fullscreenElement) document.exitFullscreen(); else (el.requestFullscreen || el.webkitRequestFullscreen || (() => {})).call(el);
    };

    const fontsReady = (document.fonts && document.fonts.load) ? Promise.all([document.fonts.load(`800 40px Poppins`), document.fonts.load(`600 20px Poppins`)]).catch(() => {}) : Promise.resolve();
    fontsReady.then(() => { draw(); if (autoplay) play(); else pause(); });

    const api = {
      play, pause: () => pause(false),
      resume() { if (!userPaused) play(); },
      seek, get time() { return t; }, duration: DURATION, scenes: SCENES,
      relabel() { steps.forEach((b, i) => { b.innerHTML = `<span>${SCENES[i].icon}</span>${LANG === 'te' ? SCENES[i].te : SCENES[i].label}`; }); draw(); }
    };
    PLAYERS.push(api);
    return api;
  }

  const PLAYERS = [];
  function setLang(l) { LANG = l === 'te' ? 'te' : 'en'; PLAYERS.forEach(p => p.relabel()); }
  window.CleanFilm = { createPlayer, setLang, DURATION, SCENES };
})();
