'use strict';
// Letter Leaper asset definitions: environment palettes and layer recipes,
// platform styles, celestial bodies, Milo's body parts, and sound recipes.
//
// PROVISIONAL ORIGINAL ARTWORK — everything here is drawn procedurally with
// the Canvas 2D API from a seeded generator (no downloaded images, fonts, or
// audio). It is original to this project and can be replaced cleanly: a
// renderer only asks for textures by key (Art.texture*) and for environment
// data (Art.envs), so final illustrations can be swapped in later as image
// files with the same keys and sizes.
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- used by scene-phaser.js and milo.js (shared script scope)
const Art = (() => {
  // ---- utilities ---------------------------------------------------------------
  function rng(seed) { // mulberry32
    return () => { seed |= 0; seed = seed + 0x6d2b79f5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  function surface(w, h, scale) {
    const c = document.createElement('canvas');
    c.width = Math.max(2, Math.ceil(w * scale)); c.height = Math.max(2, Math.ceil(h * scale));
    const g = c.getContext('2d');
    g.scale(scale, scale);
    return { c, g };
  }
  const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const mix = (a, b, t) => { const x = hex(a), y = hex(b); return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
  const rgba = (h, a) => { const [r, g, b] = hex(h); return `rgba(${r},${g},${b},${a})`; };
  // A soft, rounded ridge line across [0, w] that tiles horizontally.
  function ridge(r, w, base, amp, bumps) {
    const pts = [];
    const n = bumps, phase = [];
    for (let i = 0; i < 3; i++) phase.push(r() * Math.PI * 2);
    for (let i = 0; i <= n; i++) {
      const x = (i / n) * w;
      const k = (i / n) * Math.PI * 2;
      const y = base - amp * (0.55 * Math.sin(k * 2 + phase[0]) + 0.3 * Math.sin(k * 3 + phase[1]) + 0.15 * Math.sin(k * 7 + phase[2]) + 0.5) / 1.5;
      pts.push([x, y]);
    }
    pts[n][1] = pts[0][1];
    return pts;
  }
  function fillRidge(g, pts, w, h, fill) {
    g.beginPath(); g.moveTo(0, h); g.lineTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
      g.quadraticCurveTo(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
    }
    g.lineTo(w, pts[pts.length - 1][1]); g.lineTo(w, h); g.closePath();
    g.fillStyle = fill; g.fill();
  }
  function blob(g, x, y, r, fill) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fillStyle = fill; g.fill(); }
  function round(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
  // Draw something near a tile edge on both sides of the wrap, so tiles join seamlessly.
  function wrap(x, w, margin, fn) { fn(x); if (x < margin) fn(x + w); if (x > w - margin) fn(x - w); }

  // ---- environments --------------------------------------------------------------
  // `at` matches core.js terrains. Layers draw back-to-front. `f` is parallax
  // (0 = fixed to the sky, 1 = moves with the platforms); `drift` is a gentle
  // ambient sideways motion in px/s (zero in calm mode).
  const envs = [
    {
      id: 'jungle', at: 0, name: 'Jungle canopy',
      sky: ['#2b6f63', '#cfe8b8'], ink: '#173b2f', accent: '#f2c14e', platform: 'branch',
      layers: [
        { kind: 'field', key: 'jungle-light', f: 0.02, alpha: 0.5 },
        { kind: 'horizon', key: 'jungle-far', h: 300, f: 0.1 },
        { kind: 'horizon', key: 'jungle-mid', h: 280, f: 0.28 },
        { kind: 'horizon', key: 'jungle-near', h: 220, f: 0.55 },
        { kind: 'sides', key: 'jungle-vines', w: 150, f: 0.85 },
      ],
      ambient: { kind: 'firefly', count: 7, tint: 0xfff0a6 },
    },
    {
      id: 'mountains', at: 20, name: 'Misty mountains',
      sky: ['#58799c', '#d6e2e8'], ink: '#24394a', accent: '#9fd3ff', platform: 'ledge',
      layers: [
        { kind: 'horizon', key: 'mtn-far', h: 340, f: 0.08 },
        { kind: 'field', key: 'mtn-mist', f: 0.2, drift: 6, alpha: 0.55 },
        { kind: 'horizon', key: 'mtn-mid', h: 260, f: 0.26 },
        { kind: 'horizon', key: 'mtn-near', h: 210, f: 0.55 },
        { kind: 'sides', key: 'mtn-pines', w: 130, f: 0.85 },
      ],
      ambient: { kind: 'snow', count: 12, tint: 0xffffff },
    },
    {
      id: 'clouds', at: 40, name: 'Cloud peaks',
      sky: ['#3f8fd6', '#c3e7ff'], ink: '#1f4a74', accent: '#ffd36b', platform: 'cloud',
      body: 'sun',
      layers: [
        { kind: 'horizon', key: 'cloud-sea', h: 230, f: 0.1 },
        { kind: 'field', key: 'cloud-islands', f: 0.22, drift: 3, alpha: 0.5 },
        { kind: 'field', key: 'cloud-wisps', f: 0.45, drift: 9, alpha: 0.4 },
        { kind: 'sides', key: 'cloud-banks', w: 170, f: 0.8, alpha: 0.7 },
      ],
      ambient: null,
    },
    {
      id: 'atmosphere', at: 60, name: 'High atmosphere',
      sky: ['#3a2d6a', '#ff9e6b'], ink: '#2b1d4d', accent: '#ffb38a', platform: 'glass',
      body: 'earth',
      layers: [
        { kind: 'field', key: 'stars-faint', f: 0.03, alpha: 0.45 },
        { kind: 'field', key: 'atmo-streaks', f: 0.3, drift: 5, alpha: 0.7 },
      ],
      ambient: null,
    },
    {
      id: 'moon', at: 80, name: 'Near space',
      sky: ['#0a0d26', '#232a5c'], ink: '#1b1f45', accent: '#d8dcff', platform: 'asteroid',
      body: 'earth+moon',
      layers: [
        { kind: 'field', key: 'stars-dense', f: 0.04, alpha: 0.9 },
        { kind: 'field', key: 'stars-near', f: 0.12, alpha: 0.9 },
      ],
      ambient: { kind: 'twinkle', count: 8, tint: 0xd8e2ff },
    },
    {
      id: 'stars', at: 100, name: 'Moon to the stars',
      sky: ['#05040f', '#24104a'], ink: '#160b33', accent: '#ffe27a', platform: 'crystal',
      body: 'moon-below+star',
      layers: [
        { kind: 'field', key: 'stars-dense', f: 0.04, alpha: 1 },
        { kind: 'field', key: 'nebula', f: 0.1, drift: 2, alpha: 0.8 },
        { kind: 'field', key: 'stars-near', f: 0.14, alpha: 1 },
      ],
      ambient: { kind: 'twinkle', count: 10, tint: 0xfff3c4 },
    },
  ];
  // Sky gradient keyframes over altitude (leaps): long holds inside each
  // environment, gradual blends across the boundaries.
  const skyKeys = [
    [0, envs[0].sky], [17, envs[0].sky], [23, envs[1].sky], [37, envs[1].sky], [43, envs[2].sky], [57, envs[2].sky],
    [63, envs[3].sky], [77, envs[3].sky], [83, envs[4].sky], [98, ['#070a1c', '#1a1d45']], [104, envs[5].sky], [150, ['#05040f', '#2a1150']],
  ];
  function skyAt(a) {
    let i = 0;
    while (i < skyKeys.length - 2 && a > skyKeys[i + 1][0]) i++;
    const [a0, c0] = skyKeys[i], [a1, c1] = skyKeys[i + 1];
    const t = Math.max(0, Math.min(1, (a - a0) / (a1 - a0 || 1)));
    const s = t * t * (3 - 2 * t);
    return [mix(c0[0], c1[0], s), mix(c0[1], c1[1], s)];
  }

  // ---- layer textures (tile horizontally; fields tile both ways) -----------------
  const TILE = 1024;
  const layerDraw = {
    'jungle-light'(g, w, h) { // soft diagonal light shafts through the canopy
      for (let i = 0; i < 5; i++) {
        const x = 80 + i * 210;
        const grad = g.createLinearGradient(x, 0, x + 160, h);
        grad.addColorStop(0, 'rgba(255,244,196,0.28)'); grad.addColorStop(1, 'rgba(255,244,196,0)');
        g.fillStyle = grad;
        g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 60, 0); g.lineTo(x + 230, h); g.lineTo(x + 120, h); g.closePath(); g.fill();
      }
    },
    'jungle-far'(g, w, h, r) {
      fillRidge(g, ridge(r, w, h * 0.45, h * 0.35, 48), w, h, '#7fb39a');
      fillRidge(g, ridge(r, w, h * 0.62, h * 0.3, 40), w, h, '#5f9a7e');
    },
    'jungle-mid'(g, w, h, r) { // rounded tree crowns
      for (let x = 0; x < w; x += 34 + r() * 30) {
        const cy = h * 0.42 + r() * h * 0.25, rad = 34 + r() * 30;
        wrap(x, w, 70, (x) => { blob(g, x, cy, rad, '#3c7a5a'); blob(g, x - rad * 0.2, cy - rad * 0.25, rad * 0.6, '#4a8a68'); });
      }
      g.fillStyle = '#3c7a5a'; g.fillRect(0, h * 0.6, w, h);
    },
    'jungle-near'(g, w, h, r) { // big leaves and trunks
      for (let x0 = 0; x0 < w; x0 += 70 + r() * 70) wrap(x0, w, 80, (x) => {
        g.fillStyle = '#21543c'; g.fillRect(x + 18, h * 0.35, 12, h);
        for (let k = 0; k < 4; k++) {
          const a = -Math.PI / 2 + (k - 1.5) * 0.7, lx = x + 24 + Math.cos(a) * 30, ly = h * 0.38 + Math.sin(a) * 26;
          g.save(); g.translate(lx, ly); g.rotate(a + Math.PI / 2);
          g.beginPath(); g.ellipse(0, 0, 13, 34, 0, 0, Math.PI * 2); g.fillStyle = k % 2 ? '#2c6a4b' : '#255d42'; g.fill();
          g.strokeStyle = 'rgba(160,220,170,0.35)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(0, -30); g.lineTo(0, 30); g.stroke();
          g.restore();
        }
      });
      fillRidge(g, ridge(r, w, h * 0.78, h * 0.18, 30), w, h, '#1c4a35');
    },
    'jungle-vines'(g, w, h, r) { // hanging vines at the frame edge (tiles vertically)
      for (let i = 0; i < 4; i++) {
        const x = 10 + i * 30 + r() * 10;
        g.strokeStyle = i % 2 ? '#2a6447' : '#24583e'; g.lineWidth = 5; g.lineCap = 'round';
        g.beginPath(); g.moveTo(x, 0);
        for (let y = 0; y <= h; y += 40) g.quadraticCurveTo(x + (y / 40 % 2 ? 14 : -14), y + 20, x, y + 40);
        g.stroke();
        for (let y = 20 + r() * 40; y < h; y += 70 + r() * 40) {
          g.save(); g.translate(x, y); g.rotate((r() - 0.5) * 1.6);
          g.beginPath(); g.ellipse(9, 0, 12, 6, 0.3, 0, Math.PI * 2); g.fillStyle = '#3f8d5f'; g.fill(); g.restore();
        }
      }
    },
    'mtn-far'(g, w, h, r) { // snow-capped peaks
      const pts = [];
      let x = 0;
      while (x <= w) { pts.push([x, h * (0.25 + r() * 0.35)]); x += 90 + r() * 90; }
      pts.push([w, pts[0][1]]);
      g.beginPath(); g.moveTo(0, h);
      for (let i = 0; i < pts.length - 1; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[i + 1]; const mx = (x0 + x1) / 2, my = Math.max(y0, y1) + 70 + r() * 40; g.lineTo(x0, y0); g.lineTo(mx, my); }
      g.lineTo(w, pts[pts.length - 1][1]); g.lineTo(w, h); g.closePath();
      const grad = g.createLinearGradient(0, 0, 0, h); grad.addColorStop(0, '#b9c9d8'); grad.addColorStop(1, '#8fa6ba');
      g.fillStyle = grad; g.fill();
      g.save(); g.clip();
      g.fillStyle = 'rgba(248,251,253,0.95)';
      for (const [px, py] of pts) { g.beginPath(); g.moveTo(px - 46, py + 40); g.lineTo(px, py - 2); g.lineTo(px + 46, py + 40); g.quadraticCurveTo(px, py + 24, px - 46, py + 40); g.fill(); }
      g.restore();
    },
    'mtn-mist'(g, w, h, r) {
      for (let i = 0; i < 9; i++) {
        const x = r() * w, y = r() * h, rx = 160 + r() * 200, ry = 22 + r() * 18;
        const grad = g.createRadialGradient(x, y, 0, x, y, rx);
        grad.addColorStop(0, 'rgba(255,255,255,0.55)'); grad.addColorStop(1, 'rgba(255,255,255,0)');
        g.save(); g.translate(x, y); g.scale(1, ry / rx); g.translate(-x, -y); g.fillStyle = grad;
        for (const dx of [-w, 0, w]) for (const dy of [-h, 0, h]) { g.beginPath(); g.arc(x + dx, y + dy, rx, 0, Math.PI * 2); g.fill(); }
        g.restore();
      }
    },
    'mtn-mid'(g, w, h, r) { pines(g, w, h, r, '#5d7b86', 0.35, 34); },
    'mtn-near'(g, w, h, r) {
      pines(g, w, h, r, '#33525a', 0.25, 52);
      fillRidge(g, ridge(r, w, h * 0.82, h * 0.12, 26), w, h, '#2b474e');
    },
    'mtn-pines'(g, w, h, r) {
      for (let y = 0; y < h; y += 120) { pine(g, 30 + r() * 30, y + 120, 34 + r() * 14, '#2f4d52'); }
    },
    'cloud-sea'(g, w, h, r) {
      for (let pass = 0; pass < 3; pass++) {
        const base = h * (0.35 + pass * 0.2);
        for (let x = 0; x < w; x += 50 + r() * 40) { const y = base + r() * 24, rad = 50 + r() * 40; wrap(x, w, 100, (x) => blob(g, x, y, rad, pass === 0 ? '#e4f1ff' : pass === 1 ? '#f4f9ff' : '#ffffff')); }
      }
      g.fillStyle = '#ffffff'; g.fillRect(0, h * 0.78, w, h);
    },
    'cloud-islands'(g, w, h, r) { // floating rock peaks with grassy tops
      for (let i = 0; i < 4; i++) {
        const x = 90 + i * 250 + r() * 60, y = 120 + r() * (h - 260), s = 0.7 + r() * 0.5;
        g.save(); g.translate(x, y); g.scale(s, s);
        g.beginPath(); g.moveTo(-70, 0); g.quadraticCurveTo(-40, 70, 0, 120); g.quadraticCurveTo(40, 70, 70, 0); g.closePath(); g.fillStyle = '#9b7f69'; g.fill();
        g.beginPath(); g.moveTo(-70, 0); g.quadraticCurveTo(-30, 50, 0, 120); g.lineTo(-10, 0); g.closePath(); g.fillStyle = '#86705f'; g.fill();
        round(g, -78, -14, 156, 24, 12); g.fillStyle = '#7cc46a'; g.fill();
        blob(g, -30, -20, 18, '#6db55c'); blob(g, 20, -24, 22, '#78c066');
        g.restore();
      }
    },
    'cloud-wisps'(g, w, h, r) {
      for (let i = 0; i < 7; i++) {
        const x = r() * w, y = r() * h;
        for (let k = 0; k < 4; k++) for (const dx of [-w, 0, w]) blob(g, x + dx + k * 34, y + (k % 2) * 8, 26 + r() * 12, 'rgba(255,255,255,0.75)');
      }
    },
    'cloud-banks'(g, w, h, r) {
      for (let y = 0; y < h; y += 70) blob(g, 20 + r() * 40, y + 35, 60 + r() * 25, 'rgba(255,255,255,0.92)');
    },
    'stars-faint'(g, w, h, r) { starfield(g, w, h, r, 70, 1.1, 0.7); },
    'stars-dense'(g, w, h, r) { starfield(g, w, h, r, 260, 1.3, 0.9); },
    'stars-near'(g, w, h, r) { starfield(g, w, h, r, 40, 2.4, 1); },
    'atmo-streaks'(g, w, h, r) {
      for (let i = 0; i < 10; i++) {
        const x = r() * w, y = r() * h, len = 180 + r() * 260, th = 5 + r() * 5;
        for (const dx of [-w, 0, w]) { // each wrapped copy needs its own gradient
          const grad = g.createLinearGradient(x + dx, y, x + dx + len, y);
          grad.addColorStop(0, 'rgba(255,214,186,0)'); grad.addColorStop(0.5, 'rgba(255,214,186,0.5)'); grad.addColorStop(1, 'rgba(255,214,186,0)');
          g.fillStyle = grad; round(g, x + dx, y, len, th, 4); g.fill();
        }
      }
    },
    nebula(g, w, h, r) {
      for (let i = 0; i < 6; i++) {
        const x = r() * w, y = r() * h, rad = 160 + r() * 200, col = i % 2 ? [122, 61, 184] : [47, 179, 196];
        for (const dx of [-w, 0, w]) for (const dy of [-h, 0, h]) {
          const grad = g.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, rad);
          grad.addColorStop(0, `rgba(${col},0.22)`); grad.addColorStop(1, `rgba(${col},0)`);
          g.fillStyle = grad; g.beginPath(); g.arc(x + dx, y + dy, rad, 0, Math.PI * 2); g.fill();
        }
      }
    },
  };
  function pine(g, x, base, s, fill) {
    g.fillStyle = fill;
    for (let k = 0; k < 3; k++) {
      const top = base - s * 2.2 + k * s * 0.55, half = s * (0.45 + k * 0.18);
      g.beginPath(); g.moveTo(x, top); g.lineTo(x + half, top + s * 0.95); g.lineTo(x - half, top + s * 0.95); g.closePath(); g.fill();
    }
    g.fillRect(x - s * 0.08, base - s * 0.4, s * 0.16, s * 0.4);
  }
  function pines(g, w, h, r, fill, top, size) {
    for (let x = 0; x < w; x += size * (0.55 + r() * 0.4)) { const base = h * (top + 0.35) + r() * h * 0.15, s = size * (0.8 + r() * 0.5); wrap(x, w, s, (x) => pine(g, x, base, s, fill)); }
    g.fillStyle = fill; g.fillRect(0, h * (top + 0.42), w, h);
  }
  function starfield(g, w, h, r, n, size, alpha) {
    for (let i = 0; i < n; i++) {
      const x = r() * w, y = r() * h, s = (0.3 + r() * 0.7) * size;
      g.fillStyle = `rgba(255,255,${220 + Math.floor(r() * 35)},${(0.35 + r() * 0.65) * alpha})`;
      g.beginPath(); g.arc(x, y, s, 0, Math.PI * 2); g.fill();
      if (s > 1.6) { g.fillStyle = `rgba(255,250,220,${0.25 * alpha})`; g.fillRect(x - s * 3, y - 0.4, s * 6, 0.8); g.fillRect(x - 0.4, y - s * 3, 0.8, s * 6); }
    }
  }
  // Size of each layer texture, in logical px. Fields are screen-sized tiles.
  const layerSize = (layer) => layer.kind === 'horizon' ? [TILE, layer.h] : layer.kind === 'sides' ? [layer.w, 720] : [TILE, 768];

  // ---- platforms ------------------------------------------------------------------
  const PLATFORM = { w: 150, h: 46 };
  const platformDraw = {
    branch(g, w) {
      round(g, 6, 10, w - 12, 22, 11); g.fillStyle = '#8b5e3c'; g.fill();
      g.lineWidth = 2.5; g.strokeStyle = '#4a2f1d'; g.stroke();
      g.strokeStyle = 'rgba(255,220,180,0.35)'; g.lineWidth = 2; g.beginPath(); g.moveTo(20, 16); g.lineTo(w - 26, 16); g.stroke();
      g.strokeStyle = 'rgba(74,47,29,0.45)'; for (const x of [40, 78, 110]) { g.beginPath(); g.moveTo(x, 14); g.lineTo(x + 6, 28); g.stroke(); }
      for (const [x, y, a] of [[14, 30, 0.6], [w - 18, 28, -0.5], [w / 2, 34, 0.1]]) {
        g.save(); g.translate(x, y); g.rotate(a); g.beginPath(); g.ellipse(0, 4, 8, 13, 0, 0, Math.PI * 2); g.fillStyle = '#3f8d5f'; g.fill(); g.restore();
      }
    },
    ledge(g, w) {
      g.beginPath(); g.moveTo(8, 14); g.lineTo(w - 8, 12); g.lineTo(w - 22, 38); g.lineTo(30, 42); g.closePath();
      g.fillStyle = '#7f8c93'; g.fill(); g.lineWidth = 2.5; g.strokeStyle = '#3f4a52'; g.stroke();
      round(g, 6, 6, w - 12, 12, 6); g.fillStyle = '#f2f7fa'; g.fill();
      blob(g, 30, 16, 6, '#6f9a6a'); blob(g, w - 36, 16, 5, '#6f9a6a');
    },
    cloud(g, w) {
      // A defined blue-grey underside so platform clouds read as solid against background clouds.
      const puffs = [[30, 26, 18], [60, 18, 22], [92, 20, 20], [120, 27, 16], [75, 30, 20]];
      for (const [x, y, rad] of puffs) blob(g, x, y + 2.5, rad + 2.5, '#7f9fc4');
      for (const [x, y, rad] of puffs) blob(g, x, y + 3, rad, '#cfdff2');
      for (const [x, y, rad] of puffs) blob(g, x, y - 1, rad - 1.5, '#ffffff');
      g.fillStyle = 'rgba(160,190,225,0.55)'; round(g, 16, 30, w - 32, 12, 6); g.fill();
      g.strokeStyle = 'rgba(120,160,210,0.6)'; g.lineWidth = 2; g.beginPath(); g.moveTo(18, 40); g.lineTo(w - 18, 40); g.stroke();
    },
    glass(g, w) {
      round(g, 10, 12, w - 20, 22, 10);
      const grad = g.createLinearGradient(0, 12, 0, 34); grad.addColorStop(0, 'rgba(255,214,240,0.95)'); grad.addColorStop(1, 'rgba(150,120,230,0.85)');
      g.fillStyle = grad; g.fill(); g.lineWidth = 2; g.strokeStyle = '#fff1f8'; g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.6)'; round(g, 22, 15, w * 0.45, 4, 2); g.fill();
    },
    asteroid(g, w) {
      g.beginPath(); g.moveTo(14, 18); g.quadraticCurveTo(40, 4, 80, 9); g.quadraticCurveTo(125, 8, w - 10, 20); g.quadraticCurveTo(w - 30, 44, 76, 42); g.quadraticCurveTo(26, 42, 14, 18); g.closePath();
      g.fillStyle = '#8a8798'; g.fill(); g.lineWidth = 2.5; g.strokeStyle = '#4a4758'; g.stroke();
      for (const [x, y, rad] of [[46, 22, 6], [92, 26, 8], [118, 20, 4]]) { blob(g, x, y, rad, '#6f6c80'); blob(g, x - 1, y - 1, rad * 0.6, '#7c798c'); }
      g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 2; g.beginPath(); g.moveTo(26, 14); g.quadraticCurveTo(60, 6, 100, 10); g.stroke();
    },
    crystal(g, w) {
      g.beginPath(); g.moveTo(14, 18); g.lineTo(w / 2, 8); g.lineTo(w - 14, 18); g.lineTo(w / 2 + 20, 40); g.lineTo(w / 2 - 20, 40); g.closePath();
      const grad = g.createLinearGradient(0, 8, 0, 40); grad.addColorStop(0, '#fff6c8'); grad.addColorStop(1, '#a07ce8');
      g.fillStyle = grad; g.fill(); g.lineWidth = 2; g.strokeStyle = '#fffbe6'; g.stroke();
      g.strokeStyle = 'rgba(255,255,255,0.55)'; g.beginPath(); g.moveTo(w / 2, 8); g.lineTo(w / 2, 40); g.moveTo(14, 18); g.lineTo(w - 14, 18); g.stroke();
    },
  };
  const special = {
    'moon-surface': { w: 380, h: 90, draw(g, w, h) {
      g.beginPath(); g.ellipse(w / 2, h * 0.75, w / 2, h * 0.6, 0, Math.PI, 0); g.lineTo(w, h); g.lineTo(0, h); g.closePath();
      const grad = g.createLinearGradient(0, 0, 0, h); grad.addColorStop(0, '#e6e6ee'); grad.addColorStop(1, '#a9a9b8');
      g.fillStyle = grad; g.fill(); g.lineWidth = 2.5; g.strokeStyle = '#6e6e80'; g.stroke();
      for (const [x, y, rx] of [[90, 52, 22], [200, 44, 30], [300, 58, 16], [150, 70, 12]]) { g.beginPath(); g.ellipse(x, y, rx, rx * 0.35, 0, 0, Math.PI * 2); g.fillStyle = '#b8b8c7'; g.fill(); g.strokeStyle = 'rgba(110,110,128,0.6)'; g.lineWidth = 1.5; g.stroke(); }
    } },
    'final-star': { w: 220, h: 220, draw(g, w, h) {
      const cx = w / 2, cy = h / 2;
      const glow = g.createRadialGradient(cx, cy, 10, cx, cy, w / 2); glow.addColorStop(0, 'rgba(255,240,170,0.9)'); glow.addColorStop(1, 'rgba(255,240,170,0)');
      g.fillStyle = glow; g.fillRect(0, 0, w, h);
      g.beginPath();
      for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rad = i % 2 ? 30 : 70; g.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad); }
      g.closePath(); g.fillStyle = '#ffe27a'; g.fill(); g.lineWidth = 3; g.strokeStyle = '#fff8d8'; g.stroke();
    } },
  };

  // ---- celestial bodies -------------------------------------------------------------
  const bodies = {
    sun: { w: 260, h: 260, draw(g, w, h) {
      const glow = g.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, w / 2); glow.addColorStop(0, 'rgba(255,246,200,1)'); glow.addColorStop(0.35, 'rgba(255,236,170,0.6)'); glow.addColorStop(1, 'rgba(255,236,170,0)');
      g.fillStyle = glow; g.fillRect(0, 0, w, h); blob(g, w / 2, h / 2, 46, '#fff6cf');
    } },
    earth: { w: 520, h: 520, draw(g, w, h) {
      const cx = w / 2, cy = h / 2, rad = w * 0.42;
      const atmo = g.createRadialGradient(cx, cy, rad * 0.95, cx, cy, rad * 1.18); atmo.addColorStop(0, 'rgba(160,216,255,0.75)'); atmo.addColorStop(1, 'rgba(160,216,255,0)');
      g.fillStyle = atmo; g.beginPath(); g.arc(cx, cy, rad * 1.18, 0, Math.PI * 2); g.fill();
      g.save(); g.beginPath(); g.arc(cx, cy, rad, 0, Math.PI * 2); g.clip();
      g.fillStyle = '#3f8fd8'; g.fillRect(0, 0, w, h);
      const r = rng(7);
      for (let i = 0; i < 9; i++) { const x = cx + (r() - 0.5) * rad * 1.6, y = cy + (r() - 0.5) * rad * 1.6; g.beginPath(); g.ellipse(x, y, 40 + r() * 60, 24 + r() * 40, r() * 3, 0, Math.PI * 2); g.fillStyle = i % 3 ? '#6fbf73' : '#8fcf7a'; g.fill(); }
      for (let i = 0; i < 7; i++) { const x = cx + (r() - 0.5) * rad * 1.8, y = cy + (r() - 0.5) * rad * 1.8; g.beginPath(); g.ellipse(x, y, 60 + r() * 50, 10 + r() * 8, r() * 0.6, 0, Math.PI * 2); g.fillStyle = 'rgba(255,255,255,0.75)'; g.fill(); }
      const shade = g.createLinearGradient(cx - rad, cy - rad, cx + rad, cy + rad); shade.addColorStop(0.4, 'rgba(10,20,60,0)'); shade.addColorStop(1, 'rgba(10,20,60,0.55)');
      g.fillStyle = shade; g.fillRect(0, 0, w, h);
      g.restore();
    } },
    moon: { w: 300, h: 300, draw(g, w, h) {
      const cx = w / 2, cy = h / 2, rad = w * 0.4;
      const glow = g.createRadialGradient(cx, cy, rad * 0.9, cx, cy, rad * 1.25); glow.addColorStop(0, 'rgba(230,230,255,0.4)'); glow.addColorStop(1, 'rgba(230,230,255,0)');
      g.fillStyle = glow; g.fillRect(0, 0, w, h);
      g.save(); g.beginPath(); g.arc(cx, cy, rad, 0, Math.PI * 2); g.clip();
      const grad = g.createRadialGradient(cx - rad * 0.3, cy - rad * 0.3, rad * 0.2, cx, cy, rad); grad.addColorStop(0, '#f2f2f7'); grad.addColorStop(1, '#b4b4c4');
      g.fillStyle = grad; g.fillRect(0, 0, w, h);
      for (const [x, y, rr] of [[-0.3, -0.1, 0.18], [0.25, 0.2, 0.22], [0.1, -0.35, 0.12], [-0.15, 0.4, 0.1], [0.42, -0.15, 0.08]]) { blob(g, cx + x * rad, cy + y * rad, rr * rad, 'rgba(150,150,170,0.45)'); }
      g.restore();
    } },
    star: { w: 260, h: 260, draw(g, w, h) { special['final-star'].draw(g, w, h); } },
  };

  // ---- Milo ---------------------------------------------------------------------------
  // Parts are drawn around their pivot (see Milo.parts in milo.js).
  const FUR = '#8a5a3c', FUR_DARK = '#6c432b', FACE = '#f0cfa2', LINE = '#3d2416';
  const miloParts = {
    tail: { w: 16, h: 16, draw(g) { blob(g, 8, 8, 6.2, FUR); g.lineWidth = 1.6; g.strokeStyle = LINE; g.beginPath(); g.arc(8, 8, 6.2, 0, Math.PI * 2); g.stroke(); } },
    leg: { w: 18, h: 26, draw(g) {
      round(g, 4, 1, 10, 18, 5); g.fillStyle = FUR_DARK; g.fill(); g.lineWidth = 2; g.strokeStyle = LINE; g.stroke();
      g.beginPath(); g.ellipse(9, 20, 8.5, 5, 0, 0, Math.PI * 2); g.fillStyle = FACE; g.fill(); g.stroke();
    } },
    body: { w: 52, h: 56, draw(g) {
      g.beginPath(); g.ellipse(26, 29, 22, 25, 0, 0, Math.PI * 2); g.fillStyle = FUR; g.fill(); g.lineWidth = 2.5; g.strokeStyle = LINE; g.stroke();
      g.beginPath(); g.ellipse(26, 33, 13, 16, 0, 0, Math.PI * 2); g.fillStyle = FACE; g.fill();
      g.strokeStyle = 'rgba(255,230,200,0.35)'; g.lineWidth = 2; g.beginPath(); g.arc(26, 29, 18, -2.6, -1.6); g.stroke();
    } },
    arm: { w: 16, h: 34, draw(g) {
      round(g, 4, 2, 9, 26, 4.5); g.fillStyle = FUR; g.fill(); g.lineWidth = 2; g.strokeStyle = LINE; g.stroke();
      blob(g, 8.5, 28, 6, FACE); g.beginPath(); g.arc(8.5, 28, 6, 0, Math.PI * 2); g.stroke();
    } },
    ear: { w: 26, h: 26, draw(g) {
      blob(g, 13, 13, 11, FUR); g.lineWidth = 2.2; g.strokeStyle = LINE; g.beginPath(); g.arc(13, 13, 11, 0, Math.PI * 2); g.stroke();
      blob(g, 13, 13, 6.5, '#e9a98f');
    } },
    head: { w: 64, h: 60, draw(g) {
      g.beginPath(); g.ellipse(32, 30, 27, 26, 0, 0, Math.PI * 2); g.fillStyle = FUR; g.fill(); g.lineWidth = 2.5; g.strokeStyle = LINE; g.stroke();
      // heart-shaped face mask
      g.beginPath(); g.moveTo(32, 50); g.bezierCurveTo(10, 44, 8, 20, 21, 16); g.bezierCurveTo(28, 13, 31, 18, 32, 21); g.bezierCurveTo(33, 18, 36, 13, 43, 16); g.bezierCurveTo(56, 20, 54, 44, 32, 50); g.closePath();
      g.fillStyle = FACE; g.fill();
      g.beginPath(); g.ellipse(32, 39, 11, 7.5, 0, 0, Math.PI * 2); g.fillStyle = '#f7dcb6'; g.fill();
      g.beginPath(); g.ellipse(32, 35.5, 3.6, 2.4, 0, 0, Math.PI * 2); g.fillStyle = '#4a2a1a'; g.fill();
      blob(g, 17, 37, 3.2, 'rgba(233,140,120,0.45)'); blob(g, 47, 37, 3.2, 'rgba(233,140,120,0.45)');
      g.strokeStyle = 'rgba(255,230,200,0.4)'; g.lineWidth = 2; g.beginPath(); g.arc(32, 30, 22, -2.5, -1.8); g.stroke();
    } },
    eye: { w: 14, h: 16, draw(g) { g.beginPath(); g.ellipse(7, 8, 5.6, 6.6, 0, 0, Math.PI * 2); g.fillStyle = '#ffffff'; g.fill(); g.lineWidth = 1.4; g.strokeStyle = LINE; g.stroke(); } },
    pupil: { w: 8, h: 8, draw(g) { blob(g, 4, 4, 3.3, '#1b120c'); blob(g, 5.2, 2.8, 1.1, '#ffffff'); } },
    lid: { w: 14, h: 16, draw(g) { g.beginPath(); g.ellipse(7, 8, 6.2, 7.2, 0, 0, Math.PI * 2); g.fillStyle = FACE; g.fill(); g.lineWidth = 1.4; g.strokeStyle = LINE; g.beginPath(); g.moveTo(1.5, 8); g.quadraticCurveTo(7, 11, 12.5, 8); g.stroke(); } },
    'mouth-smile': { w: 20, h: 12, draw(g) { g.lineWidth = 2; g.strokeStyle = LINE; g.lineCap = 'round'; g.beginPath(); g.moveTo(4, 3); g.quadraticCurveTo(10, 10, 16, 3); g.stroke(); } },
    'mouth-open': { w: 20, h: 14, draw(g) { g.beginPath(); g.moveTo(3, 3); g.quadraticCurveTo(10, 15, 17, 3); g.closePath(); g.fillStyle = '#6b2b2b'; g.fill(); g.lineWidth = 1.8; g.strokeStyle = LINE; g.stroke(); blob(g, 10, 8.5, 2.6, '#e98a8a'); } },
    'mouth-oh': { w: 20, h: 14, draw(g) { g.beginPath(); g.ellipse(10, 7, 3.4, 4, 0, 0, Math.PI * 2); g.fillStyle = '#6b2b2b'; g.fill(); g.lineWidth = 1.6; g.strokeStyle = LINE; g.stroke(); } },
    'mouth-hmm': { w: 20, h: 12, draw(g) { g.lineWidth = 2; g.strokeStyle = LINE; g.lineCap = 'round'; g.beginPath(); g.moveTo(5, 6); g.quadraticCurveTo(10, 4, 15, 7); g.stroke(); } },
    helmet: { w: 96, h: 96, draw(g) {
      g.beginPath(); g.arc(48, 48, 44, 0, Math.PI * 2); g.fillStyle = 'rgba(200,230,255,0.16)'; g.fill(); g.lineWidth = 2.5; g.strokeStyle = 'rgba(230,245,255,0.85)'; g.stroke();
      g.strokeStyle = 'rgba(255,255,255,0.75)'; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.arc(48, 48, 34, -2.5, -1.7); g.stroke();
      round(g, 22, 84, 52, 9, 4); g.fillStyle = '#c9d3e6'; g.fill(); g.lineWidth = 1.6; g.strokeStyle = '#6a7690'; g.stroke();
    } },
  };

  // ---- small particle textures -----------------------------------------------------------
  const sprites = {
    dot: { w: 16, h: 16, draw(g) { const r = g.createRadialGradient(8, 8, 0, 8, 8, 8); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 16, 16); } },
    puff: { w: 24, h: 24, draw(g) { blob(g, 12, 12, 10, 'rgba(255,255,255,0.9)'); } },
    sparkle: { w: 18, h: 18, draw(g) { g.fillStyle = '#ffffff'; g.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, rr = i % 2 ? 2.5 : 8.5; g.lineTo(9 + Math.cos(a) * rr, 9 + Math.sin(a) * rr); } g.closePath(); g.fill(); } },
    flag: { w: 44, h: 56, draw(g) { g.fillStyle = '#d9d2c3'; g.fillRect(4, 4, 3, 50); g.beginPath(); g.moveTo(7, 6); g.lineTo(40, 14); g.lineTo(7, 24); g.closePath(); g.fillStyle = '#f2c14e'; g.fill(); g.lineWidth = 1.5; g.strokeStyle = '#8a6a1e'; g.stroke(); } },
  };

  // ---- sounds (synthesized PCM → WAV, decoded by Phaser's sound manager) -------------
  // Short, soft, and never harsh: sine/triangle tones with smooth envelopes.
  const sounds = {
    correct: { notes: [[880, 0, 0.09]], wave: 'sine', gain: 0.22 },
    correct2: { notes: [[988, 0, 0.09]], wave: 'sine', gain: 0.22 },
    correct3: { notes: [[1175, 0, 0.09]], wave: 'sine', gain: 0.22 },
    takeoff: { sweep: [420, 820], dur: 0.16, wave: 'triangle', gain: 0.16 },
    land: { sweep: [190, 120], dur: 0.12, wave: 'sine', gain: 0.24 },
    mistake: { sweep: [300, 240], dur: 0.16, wave: 'sine', gain: 0.16 },
    timeout: { notes: [[392, 0, 0.12], [330, 0.12, 0.16]], wave: 'sine', gain: 0.16 },
    moon: { notes: [[523, 0, 0.16], [659, 0.14, 0.16], [784, 0.28, 0.16], [1047, 0.42, 0.42]], wave: 'triangle', gain: 0.2 },
    stars: { notes: [[659, 0, 0.5], [784, 0.08, 0.5], [988, 0.16, 0.5], [1319, 0.3, 0.8]], wave: 'sine', gain: 0.18 },
  };
  function synth(recipe, rate = 22050) {
    const total = recipe.notes ? Math.max(...recipe.notes.map(([, s, d]) => s + d)) + 0.05 : recipe.dur + 0.05;
    const n = Math.ceil(total * rate), data = new Float32Array(n);
    const osc = (wave, ph) => wave === 'triangle' ? 2 / Math.PI * Math.asin(Math.sin(ph)) : Math.sin(ph);
    const env = (t, d) => Math.min(1, t / 0.008) * Math.exp(-4 * t / d) * (t < d ? 1 : 0);
    if (recipe.notes) for (const [f, s, d] of recipe.notes) {
      for (let i = Math.floor(s * rate); i < Math.min(n, Math.floor((s + d) * rate)); i++) { const t = i / rate - s; data[i] += osc(recipe.wave, 2 * Math.PI * f * t) * env(t, d); }
    } else {
      let ph = 0;
      for (let i = 0; i < Math.floor(recipe.dur * rate); i++) { const t = i / rate, f = recipe.sweep[0] + (recipe.sweep[1] - recipe.sweep[0]) * (t / recipe.dur); ph += 2 * Math.PI * f / rate; data[i] = osc(recipe.wave, ph) * env(t, recipe.dur); }
    }
    const buf = new ArrayBuffer(44 + n * 2), v = new DataView(buf);
    const str = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
    str(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); str(8, 'WAVE'); str(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); str(36, 'data'); v.setUint32(40, n * 2, true);
    for (let i = 0; i < n; i++) v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, data[i] * recipe.gain)) * 32767, true);
    return buf;
  }

  // ---- texture factory --------------------------------------------------------------------
  const seeds = {};
  let seedN = 11;
  const seedOf = (key) => (seeds[key] ??= (seedN += 7919));
  // Returns an HTMLCanvasElement for `key` at `scale` (device px per logical px).
  const partOf = (key) => (key.startsWith('milo-') ? miloParts[key.slice(5)] : null);
  function canvasFor(key, scale) {
    const layer = envs.flatMap((e) => e.layers).find((l) => l.key === key);
    if (layer) { const [w, h] = layerSize(layer); const s = surface(w, h, scale); layerDraw[key](s.g, w, h, rng(seedOf(key))); return s.c; }
    const def = platformDraw[key] ? { ...PLATFORM, draw: platformDraw[key] } : special[key] || bodies[key] || partOf(key) || sprites[key];
    if (!def) throw new Error('Unknown art key ' + key);
    const s = surface(def.w, def.h, scale);
    def.draw(s.g, def.w, def.h, rng(seedOf(key)));
    return s.c;
  }
  const sizeOf = (key) => {
    const layer = envs.flatMap((e) => e.layers).find((l) => l.key === key);
    if (layer) return layerSize(layer);
    const def = platformDraw[key] ? PLATFORM : special[key] || bodies[key] || partOf(key) || sprites[key];
    return [def.w, def.h];
  };

  return { envs, skyAt, canvasFor, sizeOf, sounds, synth, PLATFORM, miloParts: Object.keys(miloParts), mix, rgba,
    credits: 'Original procedural artwork and synthesized sounds created for Laingify (provisional).' };
})();
