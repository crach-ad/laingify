// three.js renderer for Letter Leaper: Milo leaps between floating platforms
// through the six environments of the climb (jungle → mountains → clouds →
// high atmosphere → near space → the moon and the stars). Like the other
// renderers it follows core.js through view events and read-only state —
// it never changes rules, timers, or tracking. ui.js loads it as a module
// (after art.js, for the synthesized sounds) and falls back to the Phaser
// scene if it can't start.
//
// Shared script scope (classic scripts): $, views, state, steps, target,
// typed, jumping, jumpProgress, terrains, terrainFor, MOON, TOTAL, pace,
// remaining, reducedMotion, prefs, letterCase, Art.
import * as THREE from 'three';
import { GLTFLoader } from './vendor/three/examples/jsm/loaders/GLTFLoader.js';

const stats = { renderer: '3d', ready: false, failed: null, quality: 'full', destroy() {} };
window.__leaperScene = stats;

const host = $('scene');
const calm = () => reducedMotion();
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const IDS = terrains.map((t) => t.id); // jungle, mountains, clouds, atmosphere, moon (near space), stars

// ---- the path ------------------------------------------------------------------------------
// Leap n's platform. Alternate sides, rising and receding; the moon landing
// (leap 100) and the final star (150) sit on the centre line.
const RISE = 0.8, DEPTH = 2.6, SIDE = 0.95;
const jitter = (n) => (((n * 37) % 7) - 3) / 3;
function islandPos(n, v = new THREE.Vector3()) {
  const x = n === MOON || n === TOTAL ? 0 : (n % 2 === 0 ? SIDE : -SIDE) + jitter(n) * 0.22;
  return v.set(x, n * RISE, -n * DEPTH);
}
const standPos = (n, v) => islandPos(n, v).add(new THREE.Vector3(0, 0.02, 0));
// The environment a platform belongs to: the one Milo leaps *from* (as in the 2D scenes).
const kindFor = (n) => (n === MOON ? 'moon-surface' : n === TOTAL ? 'final-star' : terrainFor(Math.max(0, n - 1)).id);
// Environment blend at a (continuous) leap level: the outgoing look fades over the last two leaps.
function blendAt(a) {
  let k = 0;
  while (k < terrains.length - 1 && a >= terrains[k + 1].at) k++;
  const next = terrains[k + 1];
  const t = next && a > next.at - 2 ? smooth((a - (next.at - 2)) / 2) : 0;
  return { k, t };
}
const weightOf = (b, k) => (k === b.k ? 1 - b.t : k === b.k + 1 ? b.t : 0);

// Sky (top, horizon, below), fog, sun and fill light for each environment.
const LOOKS = {
  jungle: { sky: ['#7fc4dd', '#cfe8dc', '#f6dcaa'], fog: ['#d4e7d2', 13, 52], sun: ['#ffd9a3', 2.6], hemi: ['#fff2d8', '#3b6a45', 1.05] },
  mountains: { sky: ['#5f86b6', '#c4d4e4', '#e3eaf0'], fog: ['#c9d7e4', 13, 54], sun: ['#fff1dc', 2.4], hemi: ['#f4f7ff', '#55687a', 1.1] },
  clouds: { sky: ['#2f7fd0', '#8ec6f2', '#cfe6fb'], fog: ['#bfdcf6', 18, 70], sun: ['#fff4d6', 2.6], hemi: ['#ffffff', '#8aa9d0', 1.05] },
  atmosphere: { sky: ['#2c2260', '#9a5f9a', '#ffb07a'], fog: ['#c98e95', 18, 74], sun: ['#ffc59a', 2.4], hemi: ['#ffd9c0', '#4b3a7a', 0.95] },
  moon: { sky: ['#04061a', '#0e1540', '#232a5c'], fog: ['#101538', 26, 100], sun: ['#e8ecff', 2.3], hemi: ['#c9d2ff', '#22264c', 0.8] },
  stars: { sky: ['#030210', '#130a35', '#2c1660'], fog: ['#150c33', 26, 100], sun: ['#f0e6ff', 2.1], hemi: ['#d9c9ff', '#1c1244', 0.75] },
};
const LOOK_LIST = IDS.map((id) => {
  const l = LOOKS[id];
  return { sky: l.sky.map((c) => new THREE.Color(c)), fog: new THREE.Color(l.fog[0]), near: l.fog[1], far: l.fog[2], sun: new THREE.Color(l.sun[0]), sunI: l.sun[1], hemiSky: new THREE.Color(l.hemi[0]), hemiGround: new THREE.Color(l.hemi[1]), hemiI: l.hemi[2] };
});

// ---- textures ---------------------------------------------------------------------------------
function radial(inner, outer, size = 128) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d'), r = g.createRadialGradient(size / 2, size / 2, size / 32, size / 2, size / 2, size / 2);
  r.addColorStop(0, inner); r.addColorStop(1, outer);
  g.fillStyle = r; g.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function paint(geo, fn) { // vertex colours from a function of the vertex position
  const pos = geo.attributes.position, col = new Float32Array(pos.count * 3), c = new THREE.Color(), p = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) { p.fromBufferAttribute(pos, i); fn(p, c); col.set([c.r, c.g, c.b], i * 3); }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return geo;
}
function rng(seed) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

try {
  init();
} catch (err) {
  console.error(err);
  stats.failed = err;
}

function init() {
  // ---- renderer, camera, lights -----------------------------------------------------------
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'default' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  const canvas = renderer.domElement;
  canvas.classList.add('leaper-canvas');
  canvas.setAttribute('aria-hidden', 'true');
  let W = host.clientWidth || 800, H = host.clientHeight || 600;
  renderer.setSize(W, H);
  host.prepend(canvas);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 220);
  scene.fog = new THREE.Fog('#d4e7d2', 13, 52);
  const hemi = new THREE.HemisphereLight('#fff2d8', '#3b6a45', 1.05);
  const sun = new THREE.DirectionalLight('#ffd9a3', 2.6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
  Object.assign(sun.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5, near: 0.5, far: 30 });
  sun.shadow.camera.updateProjectionMatrix();
  scene.add(hemi, sun, sun.target);

  // Sky dome: vertex colours, recoloured as the climb moves between environments.
  const skyGeo = new THREE.SphereGeometry(150, 24, 16);
  skyGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(skyGeo.attributes.position.count * 3), 3));
  const sky = new THREE.Mesh(skyGeo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }));
  sky.renderOrder = -10;
  scene.add(sky);

  const glowTex = radial('rgba(255,255,255,1)', 'rgba(255,255,255,0)');
  const softTex = radial('rgba(255,255,255,0.55)', 'rgba(255,255,255,0)');
  const shadowTex = radial('rgba(20,30,30,0.5)', 'rgba(20,30,30,0)');

  // ---- models ------------------------------------------------------------------------------------
  let models = null;
  const loader = new GLTFLoader();
  const load = (f) => loader.loadAsync(new URL('models/' + f, document.baseURI).href);
  Promise.all(['milo.glb', 'islands.glb', 'scenery.glb'].map(load))
    .then(([milo, islands, scenery]) => { models = { milo, islands: islands.scene, scenery: scenery.scene }; build(); })
    .catch((err) => { console.error(err); stats.failed = err; });

  // Shared geometry and materials for the code-built pieces.
  const unit = new THREE.SphereGeometry(1, 16, 12);
  const M = {
    cloud: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, emissive: '#d6e6ff', emissiveIntensity: 0.18 }),
    glass: new THREE.MeshStandardMaterial({ color: '#ffe3f1', roughness: 0.12, metalness: 0.1, transparent: true, opacity: 0.6, emissive: '#ff9ec8', emissiveIntensity: 0.2 }),
    shard: new THREE.MeshStandardMaterial({ color: '#f3c9ff', roughness: 0.2, transparent: true, opacity: 0.55, emissive: '#c58cff', emissiveIntensity: 0.3, flatShading: true }),
    crystalBase: new THREE.MeshStandardMaterial({ color: '#33246e', roughness: 0.35, metalness: 0.2, emissive: '#5b3fe0', emissiveIntensity: 0.35, flatShading: true }),
    crystal: new THREE.MeshStandardMaterial({ color: '#9ff3ff', roughness: 0.2, emissive: '#5fd8ff', emissiveIntensity: 0.9, flatShading: true }),
    crystalPink: new THREE.MeshStandardMaterial({ color: '#ffc4f2', roughness: 0.2, emissive: '#ff6fd0', emissiveIntensity: 0.8, flatShading: true }),
    moonRock: new THREE.MeshStandardMaterial({ color: '#b8b6c6', roughness: 0.95, flatShading: true }),
    moonDark: new THREE.MeshStandardMaterial({ color: '#8e8c9e', roughness: 1 }),
    gold: new THREE.MeshStandardMaterial({ color: '#ffd45e', roughness: 0.3, metalness: 0.35, emissive: '#ffae1a', emissiveIntensity: 0.55 }),
    pine: new THREE.MeshStandardMaterial({ color: '#2f5d4a', roughness: 0.9, flatShading: true }),
    snow: new THREE.MeshStandardMaterial({ color: '#f4f8fb', roughness: 0.8, flatShading: true }),
    bark: new THREE.MeshStandardMaterial({ color: '#6b4a32', roughness: 0.9 }),
    asteroid: new THREE.MeshStandardMaterial({ color: '#7d7a8c', roughness: 1, flatShading: true }),
    edge: new THREE.LineBasicMaterial({ color: '#fff3fb', transparent: true, opacity: 0.8 }),
    edgeCyan: new THREE.LineBasicMaterial({ color: '#8ff0ff', transparent: true, opacity: 0.9 }),
  };
  const hexGeo = new THREE.CylinderGeometry(1.05, 0.9, 0.24, 6);
  const hexEdges = new THREE.EdgesGeometry(hexGeo);
  const shardGeo = new THREE.ConeGeometry(0.18, 0.9, 5);
  const octa = new THREE.OctahedronGeometry(1, 0);
  const rockGeo = new THREE.IcosahedronGeometry(1, 1);

  // ---- island variants per environment (recoloured clones of the GLB islands) -----------------
  const recolour = {
    mountains: (name) => (/^(bloom|centre|stem|vine)/.test(name) ? null
      : name === 'grass' ? ['#f2f6f9', 0.88] : name === 'soil' ? ['#7d8996', 0.8] : /^(rock|pebble)/.test(name) ? ['#7a8696', 0.7]
        : name.startsWith('stone') ? ['#aab5c1', 0.8] : name.startsWith('tuft') ? ['#dde7ee', 0.6] : name.startsWith('bush') ? ['#2f5d4a', 0.6] : null),
    moon: (name) => (/^(bloom|centre|stem|vine|tuft|bush)/.test(name) ? null
      : name === 'grass' ? ['#bdbbc9', 0.92] : name === 'soil' ? ['#6f6d7c', 0.85] : /^(rock|pebble)/.test(name) ? ['#5f5d6d', 0.8]
        : name.startsWith('stone') ? ['#8c8a99', 0.85] : null),
  };
  const recoloured = new Map();
  function islandFor(kind, variant) {
    const src = models.islands.getObjectByName('island_' + variant);
    const o = src.clone(true);
    const rule = recolour[kind];
    const hide = [];
    o.traverse((m) => {
      if (!m.isMesh) return;
      m.castShadow = !m.name.startsWith('rock'); m.receiveShadow = true;
      if (!rule) return;
      const r = rule(m.name);
      if (!r) { hide.push(m); return; }
      const key = kind + m.geometry.uuid;
      if (!recoloured.has(key)) {
        const g = m.geometry.clone(), col = g.attributes.color, to = new THREE.Color(r[0]), c = new THREE.Color();
        if (col) for (let i = 0; i < col.count; i++) { c.fromBufferAttribute(col, i).lerp(to, r[1]); col.setXYZ(i, c.r, c.g, c.b); }
        recoloured.set(key, g);
      }
      m.geometry = recoloured.get(key);
    });
    for (const m of hide) m.visible = false;
    return o;
  }

  // ---- platform builders (top surface at y = 0) ------------------------------------------------
  function cloudPuff(r, seed) {
    const g = new THREE.Group(), rnd = rng(seed);
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2, d = i ? r * (0.45 + rnd() * 0.25) : 0, s = r * (0.42 + rnd() * 0.2);
      const m = new THREE.Mesh(unit, M.cloud);
      m.position.set(Math.cos(a) * d, -s * 0.55 - rnd() * 0.08, Math.sin(a) * d);
      m.scale.set(s, s * 0.6, s);
      m.castShadow = true; m.receiveShadow = true;
      g.add(m);
    }
    return g;
  }
  function pine(h = 1, snowy = true) {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.05 * h, 0.07 * h, 0.4 * h, 5), M.bark);
    trunk.position.y = 0.2 * h; g.add(trunk);
    for (let i = 0; i < 3; i++) {
      const c = new THREE.Mesh(new THREE.ConeGeometry((0.42 - i * 0.1) * h, 0.6 * h, 7), M.pine);
      c.position.y = (0.55 + i * 0.32) * h; c.castShadow = true; g.add(c);
      if (snowy) { const s = new THREE.Mesh(new THREE.ConeGeometry((0.2 - i * 0.04) * h, 0.22 * h, 7), M.snow); s.position.y = c.position.y + 0.22 * h; g.add(s); }
    }
    return g;
  }
  function crystalCluster(seed, mats, count = 4, scale = 1) {
    const g = new THREE.Group(), rnd = rng(seed);
    for (let i = 0; i < count; i++) {
      const m = new THREE.Mesh(octa, mats[i % mats.length]);
      m.scale.set(0.12 * scale, (0.3 + rnd() * 0.25) * scale, 0.12 * scale);
      m.position.set((rnd() - 0.5) * 0.4 * scale, m.scale.y * 0.8, (rnd() - 0.5) * 0.4 * scale);
      m.rotation.set((rnd() - 0.5) * 0.5, rnd() * 3, (rnd() - 0.5) * 0.5);
      g.add(m);
    }
    return g;
  }
  function buildPlatform(n) {
    const kind = kindFor(n), v = ['a', 'b', 'c'][n % 3];
    let g;
    if (kind === 'jungle' || kind === 'mountains' || kind === 'moon') {
      g = islandFor(kind, v);
      g.rotation.y = n * 1.7;
      if (kind === 'mountains') { const p = pine(0.75); p.position.set(-0.45, 0, -0.3); g.add(p); }
      g.userData.pebbles = g.children.filter((c) => c.name.startsWith('pebble'));
    } else if (kind === 'clouds') {
      g = cloudPuff(1.05, n * 13 + 1);
    } else if (kind === 'atmosphere') {
      g = new THREE.Group();
      const top = new THREE.Mesh(hexGeo, M.glass); top.position.y = -0.12; top.receiveShadow = true;
      const edges = new THREE.LineSegments(hexEdges, M.edge); edges.position.y = -0.12;
      g.add(top, edges);
      for (let i = 0; i < 4; i++) { const s = new THREE.Mesh(shardGeo, M.shard); s.rotation.x = Math.PI; s.position.set(Math.cos(i * 1.7) * 0.4, -0.6 - (i % 2) * 0.2, Math.sin(i * 1.7) * 0.4); s.scale.y = 1 + (i % 3) * 0.4; g.add(s); }
      g.rotation.y = n * 0.9;
    } else if (kind === 'stars') {
      g = new THREE.Group();
      const top = new THREE.Mesh(hexGeo, M.crystalBase); top.position.y = -0.12; top.receiveShadow = true;
      const edges = new THREE.LineSegments(hexEdges, M.edgeCyan); edges.position.y = -0.12;
      const under = crystalCluster(n * 7, [M.crystalBase, M.crystal], 5, 2.2); under.rotation.x = Math.PI; under.position.y = -0.2;
      const rim = crystalCluster(n * 11, [M.crystal, M.crystalPink], 3, 0.9); rim.position.set(0.6, 0, -0.35);
      g.add(top, edges, under, rim);
      g.rotation.y = n * 0.9;
    } else if (kind === 'moon-surface') {
      g = new THREE.Group();
      const top = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.1, 0.5, 40), M.moonRock); top.position.y = -0.25; top.receiveShadow = true;
      const under = new THREE.Mesh(new THREE.ConeGeometry(2.1, 2.2, 10), M.moonRock); under.rotation.x = Math.PI; under.position.y = -1.6;
      g.add(top, under);
      const rnd = rng(100);
      for (let i = 0; i < 7; i++) {
        const r = 0.18 + rnd() * 0.3, a = rnd() * Math.PI * 2, d = 0.7 + rnd() * 1.2;
        const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.15, 0.04, 20), M.moonDark);
        c.position.set(Math.cos(a) * d, 0.0, Math.sin(a) * d); c.receiveShadow = true; g.add(c);
      }
    } else { // final star
      g = new THREE.Group();
      const shape = new THREE.Shape();
      for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 0.7 : 1.6; shape[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r); }
      const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.35, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 2 });
      const star = new THREE.Mesh(geo, M.gold); star.rotation.x = -Math.PI / 2; star.position.y = -0.43; star.receiveShadow = true;
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#ffd76a', transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
      glow.scale.set(6, 6, 1); glow.position.y = 0.2;
      g.add(star, glow);
    }
    g.position.copy(islandPos(n));
    g.userData.n = n;
    g.userData.baseY = g.position.y;
    g.userData.base = { pos: g.position.clone(), rot: g.rotation.clone() };
    return g;
  }

  // Side scenery for leap n (opposite the path), plus anything below it.
  function buildDecor(n) {
    const kind = terrainFor(Math.max(0, n - 1)).id, p = islandPos(n), side = n % 2 === 0 ? -1 : 1, g = new THREE.Group(), rnd = rng(n * 31 + 7);
    const at = (o, dx, dy, dz, s = 1, ry = 0) => { o.position.set(p.x + dx, p.y + dy, p.z + dz); o.scale.setScalar(s); o.rotation.y = ry; g.add(o); return o; };
    if (kind === 'jungle') {
      const island = at(islandFor('jungle', ['b', 'c', 'a'][n % 3]), side * 3.4, -0.9, -1, 0.62, n * 2.3);
      const tree = models.scenery.getObjectByName(n % 2 ? 'tree_palm' : 'tree_round').clone(true);
      tree.position.set(0.3, 0, -0.2); tree.scale.setScalar(1.15); island.add(tree);
      g.userData.sway = tree;
      for (const s of [-1, 1]) at(models.scenery.getObjectByName('tree_round').clone(true), s * (4 + (n % 3)), -8.5, -1.5, 2.2, n + s);
    } else if (kind === 'mountains') {
      const rock = at(islandFor('mountains', ['c', 'a', 'b'][n % 3]), side * 3.3, -1.1, -1, 0.6, n * 2.1);
      for (let i = 0; i < 2; i++) { const t = pine(0.9 + i * 0.3); t.position.set(i ? 0.5 : -0.3, 0, i ? 0.2 : -0.4); rock.add(t); }
      for (const s of [-1, 1]) at(pine(3.2 + rnd()), s * (4.5 + rnd() * 2), -9, -2, 1, rnd() * 3);
    } else if (kind === 'clouds') {
      at(cloudPuff(1.4, n * 5), side * 3.6, -0.8 - rnd(), -1.5, 1);
      at(cloudPuff(1.0, n * 9), -side * (5.5 + rnd() * 2), 1.4 + rnd(), -4, 1);
    } else if (kind === 'atmosphere') {
      for (let i = 0; i < 3; i++) {
        const s = new THREE.Mesh(octa, M.shard);
        at(s, side * (3 + rnd() * 2), -0.4 + rnd() * 1.6, -1 - rnd() * 2, 0.25 + rnd() * 0.3, rnd() * 3);
        s.scale.y *= 2.2; g.userData.spin = (g.userData.spin || []).concat(s);
      }
    } else if (kind === 'moon') {
      for (let i = 0; i < 2; i++) {
        const a = new THREE.Mesh(rockGeo, M.asteroid);
        at(a, (i ? -side : side) * (3 + rnd() * 3), -1 + rnd() * 2.5, -1 - rnd() * 3, 0.3 + rnd() * 0.5, rnd() * 3);
        a.scale.y *= 0.8; a.castShadow = true;
        g.userData.spin = (g.userData.spin || []).concat(a);
      }
    } else if (kind === 'stars') {
      const c = at(crystalCluster(n * 3, [M.crystal, M.crystalPink, M.crystalBase], 4, 1.6), side * (3 + rnd() * 2), -0.6 + rnd() * 1.5, -1.5, 1, rnd() * 3);
      g.userData.spin = [c];
    }
    return g;
  }

  // ---- distant backdrops (follow the camera's focus; fade between environments) ---------------
  function fadeable(group) {
    const mats = new Set();
    group.traverse((o) => { if (o.material) { o.material = o.material.clone(); mats.add(o.material); } });
    group.userData.mats = [...mats];
    group.userData.base = [...mats].map((m) => m.opacity);
    return group;
  }
  function setFade(group, w) {
    group.visible = w > 0.01;
    group.userData.mats.forEach((m, i) => { m.opacity = group.userData.base[i] * w; m.transparent = w < 0.999 || group.userData.base[i] < 1; m.depthWrite = w >= 0.999; });
  }
  const backdrops = {};
  function buildBackdrops() {
    // Jungle: rolling hills.
    const hills = models.scenery.getObjectByName('hills').clone(true);
    hills.scale.setScalar(1.6);
    backdrops.jungle = { obj: fadeable(new THREE.Group().add(hills)), off: new THREE.Vector3(0, -9, -34), recede: 0.08, from: 0 };
    // Mountains: a low-poly range with snowy tops.
    const range = new THREE.Group(), rnd = rng(20);
    for (let i = 0; i < 9; i++) {
      const h = 10 + rnd() * 9, r = 6 + rnd() * 5;
      const geo = paint(new THREE.ConeGeometry(r, h, 7, 3), (p, c) => c.set(p.y > h * 0.18 ? '#f3f6fa' : '#6d7f95').offsetHSL(0, 0, (rnd() - 0.5) * 0.04));
      const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1 }));
      m.position.set((i - 4) * 9 + (rnd() - 0.5) * 5, h / 2 - 6, -(rnd() * 14)); m.rotation.y = rnd() * 3;
      range.add(m);
    }
    backdrops.mountains = { obj: fadeable(range), off: new THREE.Vector3(0, -12, -46), recede: 0.06, from: 20 };
    // Clouds: a sea of soft cloud tops below.
    const sea = new THREE.Group();
    for (let i = 0; i < 26; i++) {
      const m = new THREE.Mesh(unit, M.cloud), s = 3 + rnd() * 4;
      m.position.set((rnd() - 0.5) * 70, -rnd() * 1.5, -rnd() * 60 + 10); m.scale.set(s, s * 0.45, s);
      sea.add(m);
    }
    backdrops.clouds = { obj: fadeable(sea), off: new THREE.Vector3(0, -7.5, -10), recede: 0.25, from: 40 };
    for (const b of Object.values(backdrops)) scene.add(b.obj);
  }

  // Sky bodies: the sun, Earth (a horizon, then a planet), the moon, the stars and the final star.
  const sunSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#fff2c4', transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending }));
  scene.add(sunSprite);
  const earth = new THREE.Group();
  {
    const rnd = rng(60);
    const blobs = Array.from({ length: 9 }, () => [new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize(), 0.25 + rnd() * 0.3]);
    const geo = paint(new THREE.SphereGeometry(1, 48, 32), (p, c) => {
      const land = blobs.some(([d, r]) => p.distanceTo(d) < r), cloud = Math.sin(p.x * 9 + p.z * 4) * Math.sin(p.y * 7 - p.x * 3) > 0.55;
      c.set(cloud ? '#f4f8ff' : land ? '#5e9a52' : '#2d6bb0');
    });
    earth.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, fog: false })));
    const rim = new THREE.Mesh(new THREE.SphereGeometry(1.025, 48, 32), new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.BackSide,
      uniforms: { tint: { value: new THREE.Color('#7fc6ff') }, alpha: { value: 1 } },
      vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }',
      fragmentShader: 'uniform vec3 tint; uniform float alpha; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.0 - abs(dot(vN, vV)), 4.0); gl_FragColor = vec4(tint, f * alpha * 0.45); }',
    }));
    earth.add(rim);
    earth.userData.rim = rim.material;
  }
  scene.add(earth);
  const moonBody = new THREE.Mesh(paint(new THREE.IcosahedronGeometry(1, 4), (p, c) => {
    const crater = Math.sin(p.x * 11) * Math.sin(p.y * 13 + 1) * Math.sin(p.z * 9 + 2) > 0.35;
    c.set(crater ? '#9a98a8' : '#d9d7e2');
  }), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, fog: false, emissive: '#3a3a55', emissiveIntensity: 0.35 }));
  scene.add(moonBody);
  const starGeo = new THREE.BufferGeometry();
  {
    const rnd = rng(99), n = 900, pos = new Float32Array(n * 3), col = new Float32Array(n * 3), c = new THREE.Color();
    for (let i = 0; i < n; i++) {
      const v = new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize().multiplyScalar(140);
      pos.set([v.x, v.y, v.z], i * 3);
      c.set(['#ffffff', '#ffe9b0', '#c9d8ff', '#ffd0f0'][i % 4]).multiplyScalar(0.6 + rnd() * 0.4);
      col.set([c.r, c.g, c.b], i * 3);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  }
  const starfield = new THREE.Points(starGeo, new THREE.PointsMaterial({ size: 1.8, sizeAttenuation: false, vertexColors: true, transparent: true, depthWrite: false, fog: false }));
  starfield.renderOrder = -5;
  scene.add(starfield);
  const finalGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#ffe08a', transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending }));
  scene.add(finalGlow);

  // ---- ambient particles (camera-following; none in calm or low quality) ----------------------
  const AMBIENT = { jungle: { color: '#fff3a6', fall: -0.02, n: 26, size: 0.09 }, mountains: { color: '#ffffff', fall: 0.5, n: 60, size: 0.07 }, atmosphere: { color: '#ffd1e8', fall: -0.05, n: 18, size: 0.08 }, stars: { color: '#c9f2ff', fall: -0.03, n: 30, size: 0.08 } };
  const ambient = {};
  for (const [id, a] of Object.entries(AMBIENT)) {
    const rnd = rng(id.length * 17), pos = new Float32Array(a.n * 3);
    for (let i = 0; i < a.n; i++) pos.set([(rnd() - 0.5) * 14, (rnd() - 0.5) * 8, -2 - rnd() * 9], i * 3);
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ map: glowTex, color: a.color, size: a.size * 1.8, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    pts.userData = a; pts.frustumCulled = false;
    scene.add(pts);
    ambient[id] = pts;
  }

  // Short bursts: sparkles for milestones, dust for take-off and landing.
  const bursts = [];
  function burst(at, { n = 20, color = '#ffe08a', speed = 2.2, life = 1.2, size = 0.22, up = 1.5, gravity = -2.5, tex = glowTex, blending = THREE.AdditiveBlending } = {}) {
    if (calm() || stats.quality === 'low') return;
    const pos = new Float32Array(n * 3), vel = [], rnd = Math.random;
    for (let i = 0; i < n; i++) { pos.set([at.x, at.y, at.z], i * 3); vel.push(new THREE.Vector3((rnd() - 0.5) * speed, rnd() * up, (rnd() - 0.5) * speed)); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ map: tex, color, size, transparent: true, depthWrite: false, blending }));
    pts.frustumCulled = false;
    scene.add(pts);
    bursts.push({ pts, vel, age: 0, life, gravity });
  }
  function updateBursts(dt) {
    for (let i = bursts.length - 1; i >= 0; i--) {
      const b = bursts[i], pos = b.pts.geometry.attributes.position;
      b.age += dt;
      for (let k = 0; k < b.vel.length; k++) { b.vel[k].y += b.gravity * dt; pos.setXYZ(k, pos.getX(k) + b.vel[k].x * dt, pos.getY(k) + b.vel[k].y * dt, pos.getZ(k) + b.vel[k].z * dt); }
      pos.needsUpdate = true;
      b.pts.material.opacity = 1 - b.age / b.life;
      if (b.age >= b.life) { scene.remove(b.pts); b.pts.geometry.dispose(); b.pts.material.dispose(); bursts.splice(i, 1); }
    }
  }

  // ---- sound (synthesized in art.js; Web Audio, only after the player turns it on) -------------
  let audio = null;
  const buffers = {};
  function play(key) {
    if (!prefs.sound || typeof Art === 'undefined' || !Art.sounds[key]) return;
    try {
      audio ??= new AudioContext();
      if (audio.state === 'suspended') audio.resume();
      if (!buffers[key]) { buffers[key] = audio.decodeAudioData(Art.synth(Art.sounds[key])); }
      buffers[key].then((buf) => {
        const src = audio.createBufferSource(), gain = audio.createGain();
        gain.gain.value = 0.7; src.buffer = buf; src.connect(gain).connect(audio.destination); src.start();
      }).catch(() => {});
    } catch { /* sound is optional */ }
  }

  // ---- the target card (HTML over the canvas; the keyboard panel has the accessible prompt) ----
  const card = document.createElement('div');
  card.className = 'leaper3d-card';
  card.setAttribute('aria-hidden', 'true');
  card.innerHTML = '<div class="leaper3d-letters"></div><div class="leaper3d-timer"><i></i></div><div class="leaper3d-hint">TYPE TO LEAP</div><div class="leaper3d-count"></div>';
  host.append(card);
  const cardLetters = card.firstChild, cardTimer = card.querySelector('.leaper3d-timer'), cardFill = cardTimer.firstChild, cardCount = card.querySelector('.leaper3d-count');
  function refreshCard(pop = false) {
    const show = (state === 'playing' || state === 'paused') && steps < TOTAL;
    card.classList.toggle('shown', show && !jumping);
    if (!show) return;
    cardLetters.innerHTML = '';
    [...target].forEach((ch, i) => {
      const s = document.createElement('span');
      s.textContent = letterCase(ch);
      if (i < typed) s.className = 'typed'; else if (i === typed && target.length > 1) s.className = 'next';
      cardLetters.append(s);
    });
    card.classList.toggle('word', target.length > 1);
    cardTimer.hidden = !Number.isFinite(remaining) && !falls;
    if (pop && !calm()) { card.classList.remove('pop'); void card.offsetWidth; card.classList.add('pop'); }
  }
  function shakeCard() { if (calm()) return; card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake'); }
  const cardAnchor = new THREE.Vector3();
  function placeCard() {
    if (!card.classList.contains('shown')) return;
    islandPos(steps + 1, cardAnchor).y += 1.1;
    cardAnchor.project(camera);
    const x = clamp((cardAnchor.x + 1) / 2 * W, 70, W - 70), y = clamp((1 - cardAnchor.y) / 2 * H, 110, H - 20);
    card.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -100%)`;
    if (falls) {
      // The falling-platform countdown reads the rules' own deadline clock.
      const left = deadlineLeft(), f = clamp(left / FALL_DEADLINE, 0, 1), secs = String(Math.ceil(left / 1000));
      cardFill.style.transform = `scaleX(${f.toFixed(3)})`;
      cardTimer.classList.toggle('low', left <= 2000);
      if (cardCount.textContent !== secs) cardCount.textContent = secs;
      card.classList.toggle('warn', left <= 2000 && left > 1000);
      card.classList.toggle('danger', left <= 1000);
    } else if (Number.isFinite(remaining)) {
      const total = (pace === 'steady' ? 8000 : 4000) * target.length, f = clamp(remaining / total, 0, 1);
      cardFill.style.transform = `scaleX(${f.toFixed(3)})`;
      cardTimer.classList.toggle('low', f < 0.3);
    }
  }

  // ---- world state -------------------------------------------------------------------------------
  const platforms = new Map(), decor = new Map();
  let milo = null, animator = null, helmet = null, flag = null, beacon = null, contact = null, leaves = null, warnRing = null;
  const look = new THREE.Vector3(), focus = new THREE.Vector3(), tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3();
  let camLevel = 0, yaw = 0, frameView = { x: 0, y: 0 }, snapCamera = true, lastSky = -1, dip = null;
  const OFFSET = new THREE.Vector3(3.3, 3.1, 6.3);

  function syncWindow() {
    const lo = Math.max(0, steps - 2), hi = Math.min(TOTAL, steps + 6);
    for (const [n, o] of platforms) if (n < lo || n > hi) { scene.remove(o); platforms.delete(n); }
    for (const [n, o] of decor) if (n < lo || n > hi) { scene.remove(o); decor.delete(n); }
    for (let n = lo; n <= hi; n++) {
      if (!platforms.has(n)) { const p = buildPlatform(n); platforms.set(n, p); scene.add(p); }
      if (!decor.has(n) && n !== MOON && n !== TOTAL) { const d = buildDecor(n); decor.set(n, d); scene.add(d); }
    }
  }

  // Milo: GLB clips with cross-fades. One-shot reactions settle back into Idle,
  // or into Celebrate at the moon and the stars.
  function createAnimator(root, clips) {
    const mixer = new THREE.AnimationMixer(root), actions = new Map(clips.map((c) => [c.name, mixer.clipAction(c)]));
    let current = 'Idle';
    const settle = () => (state === 'moon' || state === 'finished' ? 'Celebrate' : 'Idle');
    const playClip = (name, { once = false, fade = 0.14 } = {}) => {
      const next = actions.get(name), prev = actions.get(current);
      if (!next) return;
      next.reset(); next.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat, once ? 1 : Infinity);
      next.clampWhenFinished = once; next.enabled = true; next.play();
      if (prev && prev !== next) prev.crossFadeTo(next, fade, false);
      current = name;
    };
    mixer.addEventListener('finished', (e) => { const n = e.action.getClip().name; if (n === 'Land' || n === 'Oops') playClip(settle(), { fade: 0.25 }); });
    playClip('Idle', { fade: 0 });
    return { play: playClip, current: () => current, update: (dt) => mixer.update(dt) };
  }

  function build() {
    buildBackdrops();
    milo = new THREE.Group();
    const m = models.milo.scene;
    m.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    milo.add(m);
    scene.add(milo);
    animator = createAnimator(m, models.milo.animations);
    // Space helmet for near space and beyond (as in the 2D scenes).
    const head = m.getObjectByName('head'), headBox = new THREE.Box3().setFromObject(m.getObjectByName('headShape') || head);
    const size = headBox.getSize(new THREE.Vector3()), centre = head.worldToLocal(headBox.getCenter(new THREE.Vector3()));
    helmet = new THREE.Mesh(new THREE.SphereGeometry(Math.max(size.x, size.y, size.z) * 0.72, 32, 20), new THREE.MeshStandardMaterial({ color: '#d8f0ff', roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.28, depthWrite: false }));
    helmet.position.copy(centre);
    helmet.renderOrder = 5;
    head.add(helmet);
    contact = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
    contact.rotation.x = -Math.PI / 2; contact.renderOrder = 1;
    scene.add(contact);
    beacon = new THREE.Mesh(new THREE.RingGeometry(0.38, 0.5, 48), new THREE.MeshBasicMaterial({ color: '#ffe08a', transparent: true, opacity: 0, depthWrite: false, toneMapped: false }));
    beacon.rotation.x = -Math.PI / 2; beacon.renderOrder = 2;
    scene.add(beacon);
    warnRing = new THREE.Mesh(new THREE.RingGeometry(0.62, 0.78, 48), new THREE.MeshBasicMaterial({ color: '#ff7a3d', transparent: true, opacity: 0, depthWrite: false, toneMapped: false }));
    warnRing.rotation.x = -Math.PI / 2; warnRing.renderOrder = 2;
    scene.add(warnRing);
    // Moon flag (shown at the landing).
    flag = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.1, 6), new THREE.MeshStandardMaterial({ color: '#d9d2c3', metalness: 0.4, roughness: 0.4 }));
    pole.position.y = 0.55;
    const cloth = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.34, 8, 1), new THREE.MeshStandardMaterial({ color: '#f2c14e', side: THREE.DoubleSide, roughness: 0.7 }));
    cloth.position.set(0.29, 0.9, 0);
    flag.add(pole, cloth); flag.userData.cloth = cloth;
    flag.visible = false;
    scene.add(flag);
    // Big jungle leaves framing the view (jungle only).
    leaves = new THREE.Group();
    const leaf = models.scenery.getObjectByName('leaf_big');
    [[-1.75, -1.15, -2.6, 0.2, 0.3, 0.6, 1.1], [1.9, -1.2, -2.7, 0.25, -0.4, -0.5, 1.2]].forEach(([x, y, z, rx, ry, rz, s]) => {
      const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.set(rx, ry, rz); g.scale.setScalar(s); g.add(leaf.clone(true)); leaves.add(g);
    });
    scene.add(leaves);
    layout();
    renderer.setAnimationLoop(tick);
    views.push(onGame);
    prefs.on(() => refreshCard());
    new ResizeObserver(resize).observe(host);
    stats.ready = true;
  }

  function layout() {
    syncWindow();
    helmet.visible = steps >= 80;
    flag.visible = false;
    snapCamera = true;
    refreshCard();
  }

  function celebrate(kind) {
    play(kind);
    animator.play('Celebrate', { fade: 0.3 });
    const p = standPos(steps, tmp);
    if (kind === 'moon') {
      flag.position.set(p.x + 0.75, p.y, p.z - 0.2);
      flag.visible = true;
      flag.scale.setScalar(calm() ? 1 : 0.001);
      flag.userData.grow = calm() ? null : { t: -0.3 };
    }
    burst(p.clone().add(new THREE.Vector3(0, 1, 0)), { n: kind === 'moon' ? 26 : 40, speed: 3, up: 3.2, life: 1.4 });
  }

  function onGame(type, d) {
    switch (type) {
      case 'start': case 'home': restorePlatform(platforms.get(steps)); resetMilo(); animator.play('Idle', { fade: 0.2 }); layout(); break;
      case 'target': refreshCard(true); break;
      case 'typed': play(['correct', 'correct2', 'correct3'][Math.min(d.pos, 2)]); refreshCard(); break;
      case 'miss': play('mistake'); animator.play('Oops', { once: true, fade: 0.12 }); refreshCard(); shakeCard(); break;
      case 'timeout': play('timeout'); animator.play('Oops', { once: true, fade: 0.12 }); break;
      case 'jump':
        play('takeoff');
        animator.play('Anticipate', { once: true, fade: 0.06 }); // immediate response to the accepted key
        refreshCard();
        burst(standPos(d.from, tmp).clone(), { n: 6, color: '#ffffff', speed: 1.2, up: 0.6, life: 0.45, size: 0.25, gravity: -0.5, tex: softTex, blending: THREE.NormalBlending });
        break;
      case 'land': {
        play('land');
        animator.play('Land', { once: true, fade: 0.08 });
        syncWindow();
        const plat = platforms.get(d.leap);
        if (plat && !calm()) dip = { plat, t: 0 };
        burst(standPos(d.leap, tmp).clone(), { n: 8, color: '#ffffff', speed: 1.6, up: 0.5, life: 0.5, size: 0.25, gravity: -0.4, tex: softTex, blending: THREE.NormalBlending });
        if (d.leap === 80) helmet.visible = true;
        refreshCard();
        break;
      }
      case 'moon': refreshCard(); celebrate('moon'); break;
      case 'continue': animator.play('Idle', { fade: 0.3 }); flag.visible = false; refreshCard(true); break;
      case 'finish': refreshCard(); celebrate(steps >= TOTAL ? 'stars' : 'moon'); break;
      case 'pause': case 'resume': case 'countdown': refreshCard(); break;
      case 'fall':
        play(d.kind === 'miss' ? 'mistake' : 'timeout');
        if (d.kind === 'miss' && !calm()) animator.play('Anticipate', { once: true, fade: 0.06 });
        else animator.play('Oops', { once: true, fade: 0.1 });
        refreshCard();
        break;
      case 'recover':
        restorePlatform(platforms.get(steps));
        resetMilo();
        play('land');
        animator.play('Land', { once: true, fade: 0.08 });
        burst(standPos(steps, tmp).clone().add(new THREE.Vector3(0, 0.3, 0)), { n: 12, color: '#fff3c4', speed: 1.4, up: 1.2, life: 0.7, size: 0.18 });
        refreshCard(true);
        break;
    }
  }

  // ---- falls (falling-platform preview) ---------------------------------------------------------------
  // Both play inside the rules' fall time: a near miss (jump short, drop out
  // of view) or the platform giving way, then Milo pops back onto a restored
  // platform for the same leap. Calm mode: a simple sink-and-return.
  const fallPoint = new THREE.Vector3();
  function fallMotion(p, from, to, plat, still) {
    if (still) {
      const out = p < 0.5 ? smooth(p / 0.45) : 1 - smooth((p - 0.55) / 0.4);
      milo.scale.setScalar(Math.max(0.001, 1 - out));
      focus.copy(from).y -= out * 0.5;
      if (plat && fallKind === 'timeout') plat.position.y = plat.userData.baseY - out * 0.35;
      return 0;
    }
    if (fallKind === 'miss') {
      if (p < 0.3) { // the attempt: an arc that runs out of height halfway
        const q = p / 0.3;
        if (q > 0.35 && animator.current() === 'Anticipate') animator.play('Air', { fade: 0.08 });
        focus.copy(from).lerp(to, smooth(q) * 0.5).y += Math.sin(q * Math.PI * 0.8) * 0.95;
      } else if (p < 0.72) { // falling short, out of view
        const q = (p - 0.3) / 0.42;
        if (animator.current() !== 'Oops') animator.play('Oops', { fade: 0.1 });
        fallPoint.copy(from).lerp(to, 0.5 + q * 0.12).y += Math.sin(Math.PI * 0.8) * 0.95 - 10 * q * q;
        focus.copy(fallPoint);
        milo.rotation.x = q * 1.1;
      } else { // back on the start platform, dropping in from above
        const q = (p - 0.72) / 0.28;
        milo.rotation.x = 0;
        focus.copy(from).y += (1 - smooth(q)) * 1.8;
        if (animator.current() !== 'Air') animator.play('Air', { fade: 0.05 });
      }
      return Math.max(0, focus.y - from.y);
    }
    // timeout: the platform drops with Milo on it, then a restored platform rises back
    if (p < 0.55) {
      const q = p / 0.55, drop = 9 * q * q;
      if (plat) { plat.position.y = plat.userData.baseY - drop; plat.rotation.z = plat.userData.base.rot.z + q * 0.5; }
      focus.copy(from).y -= drop * 0.96;
      milo.rotation.x = q * 0.5;
    } else {
      const q = (p - 0.55) / 0.45;
      if (plat) {
        plat.position.y = plat.userData.baseY - (1 - smooth(q / 0.6)) * 2;
        plat.rotation.z = plat.userData.base.rot.z;
        plat.scale.setScalar(0.6 + 0.4 * smooth(q / 0.6));
      }
      milo.rotation.x = 0;
      milo.visible = q > 0.45;
      focus.copy(from).y += (1 - smooth((q - 0.45) / 0.55)) * 1.8;
      if (milo.visible && animator.current() !== 'Air') animator.play('Air', { fade: 0.05 });
    }
    return 0;
  }
  function restorePlatform(plat) {
    if (!plat?.userData.base) return;
    plat.position.copy(plat.userData.base.pos);
    plat.rotation.copy(plat.userData.base.rot);
    plat.scale.setScalar(1);
  }
  function resetMilo() { milo.visible = true; milo.scale.setScalar(1); milo.rotation.x = 0; }

  // ---- per frame -------------------------------------------------------------------------------------
  const clock = new THREE.Timer();
  let frameTimes = [];
  function tick(now) {
    clock.update(now);
    const dt = Math.min(clock.getDelta(), 0.1), t = clock.getElapsed(), still = calm();
    // Camera level: follows the leap (calm: holds, then moves at the landing).
    const p = jumpProgress();
    const goal = steps + (jumping && !still && !fallKind ? smooth((p - 0.1) / 0.85) : 0);
    camLevel = snapCamera || still ? goal : camLevel + (goal - camLevel) * (1 - Math.exp(-dt * 7));
    const b = blendAt(camLevel), w = (k) => weightOf(b, k);

    // Milo along a controlled arc inside the rules' jump time.
    const from = standPos(steps, new THREE.Vector3()), to = standPos(Math.min(steps + 1, TOTAL), new THREE.Vector3());
    let height = 0;
    focus.copy(from);
    const plat = platforms.get(steps);
    if (jumping && fallKind) {
      height = fallMotion(p, from, to, plat, still);
    } else if (jumping) {
      if (p > 0.16 && animator.current() === 'Anticipate') animator.play('Air', { fade: 0.08 });
      const u = still ? p : smooth((p - 0.16) / 0.8);
      height = still ? 0 : Math.sin(clamp((p - 0.16) / 0.8, 0, 1) * Math.PI) * 1.1;
      focus.copy(from).lerp(to, u).y += height;
    }
    // Falling platforms: the wobble grows over the last two seconds (calm: a steady warning ring instead).
    const left = falls && state === 'playing' && !jumping ? deadlineLeft() : Infinity;
    const warn = left <= 2000 ? 1 - left / 2000 : 0;
    if (plat && !fallKind && plat.userData.base) {
      const b0 = plat.userData.base;
      const amp = warn && !still ? 0.012 + 0.05 * warn : 0;
      plat.position.x = b0.pos.x + Math.sin(t * 41) * amp;
      plat.position.z = b0.pos.z + Math.sin(t * 53 + 1) * amp * 0.7;
      plat.rotation.z = b0.rot.z + Math.sin(t * 37) * amp * 0.9;
      focus.x += plat.position.x - b0.pos.x; focus.z += plat.position.z - b0.pos.z;
    }
    warnRing.visible = warn > 0;
    if (warnRing.visible) {
      warnRing.position.set(from.x, from.y + 0.025, from.z);
      warnRing.material.color.set(left <= 1000 ? '#ff4b3a' : '#ff9a3d');
      warnRing.material.opacity = still ? 0.9 : 0.55 + 0.4 * Math.abs(Math.sin(t * (6 + 10 * warn)));
    }
    milo.position.copy(focus);
    animator.update(dt);
    const celebrating = state === 'moon' || state === 'finished';
    const want = celebrating || state === 'intro' ? Math.PI * 0.18 : Math.atan2(to.x - from.x, to.z - from.z);
    let dy = want - yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
    yaw += dy * Math.min(1, dt * (still ? 30 : 9));
    milo.rotation.y = yaw;
    const ground = jumping && p > 0.5 && !fallKind ? to : from;
    contact.visible = milo.visible && focus.y > from.y - 0.3;
    contact.position.set(focus.x, ground.y + 0.012, focus.z);
    contact.scale.setScalar(0.62 / (1 + height * 0.6));

    // Camera: keep Milo and the destination in frame; framing follows the HTML around the scene.
    const anchor = (still && jumping) || fallKind ? from : focus; // the camera never follows a fall
    tmp.copy(anchor);
    if (state !== 'intro' && !celebrating) tmp.lerp(to, 0.42);
    tmp.y += 0.45;
    if (snapCamera || still) look.copy(tmp); else look.lerp(tmp, 1 - Math.exp(-dt * 3.2));
    camera.position.copy(look).addScaledVector(OFFSET, clamp(1.25 / camera.aspect, 1, 1.6)); // pull back on tall, narrow screens
    camera.lookAt(look);
    const narrow = W < 740;
    const fx = state === 'intro' ? (narrow ? 0 : 0.17) : 0;
    const fy = state === 'intro' ? (narrow ? 0.3 : 0.1) : state === 'finished' ? -0.36 : celebrating ? -0.1 : 0.05;
    const k = snapCamera || still ? 1 : 1 - Math.exp(-dt * 4);
    frameView.x += (fx - frameView.x) * k; frameView.y += (fy - frameView.y) * k;
    camera.setViewOffset(W, H, -frameView.x * W, -frameView.y * H, W, H);
    snapCamera = false;

    // Light and atmosphere for the current blend.
    const A = LOOK_LIST[b.k], B = LOOK_LIST[Math.min(b.k + 1, LOOK_LIST.length - 1)];
    scene.fog.color.copy(A.fog).lerp(B.fog, b.t);
    scene.fog.near = lerp(A.near, B.near, b.t); scene.fog.far = lerp(A.far, B.far, b.t);
    hemi.color.copy(A.hemiSky).lerp(B.hemiSky, b.t); hemi.groundColor.copy(A.hemiGround).lerp(B.hemiGround, b.t); hemi.intensity = lerp(A.hemiI, B.hemiI, b.t);
    sun.color.copy(A.sun).lerp(B.sun, b.t); sun.intensity = lerp(A.sunI, B.sunI, b.t);
    sun.position.set(focus.x - 5, focus.y + 9, focus.z + 5); sun.target.position.copy(focus);
    sky.position.copy(camera.position);
    if (Math.abs(camLevel - lastSky) > 0.005) {
      lastSky = camLevel;
      const pos = skyGeo.attributes.position, col = skyGeo.attributes.color, c = new THREE.Color(), top = A.sky[0].clone().lerp(B.sky[0], b.t), mid = A.sky[1].clone().lerp(B.sky[1], b.t), low = A.sky[2].clone().lerp(B.sky[2], b.t);
      for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i) / 150;
        if (y > 0.05) c.copy(mid).lerp(top, Math.min(1, (y - 0.05) / 0.55)); else c.copy(low).lerp(mid, clamp((y + 0.3) / 0.35, 0, 1));
        col.setXYZ(i, c.r, c.g, c.b);
      }
      col.needsUpdate = true;
    }

    // Backdrops and sky bodies.
    for (const [id, bd] of Object.entries(backdrops)) {
      const wk = w(IDS.indexOf(id));
      setFade(bd.obj, wk);
      if (!bd.obj.visible) continue;
      islandPos(bd.from, tmp2);
      bd.obj.position.copy(look).add(bd.off).addScaledVector(tmp.copy(look).sub(tmp2), -bd.recede);
    }
    const a = camLevel;
    const sunW = smooth((a - 34) / 6) * (1 - smooth((a - 74) / 6));
    sunSprite.visible = sunW > 0.01;
    sunSprite.material.opacity = sunW;
    sunSprite.material.color.set(a < 60 ? '#fff2c4' : '#ffb98a');
    sunSprite.position.copy(camera.position).add(tmp.set(-0.45, 0.42 - smooth((a - 60) / 20) * 0.35, -1).normalize().multiplyScalar(110));
    sunSprite.scale.setScalar(26);
    const earthW = smooth((a - 56) / 5);
    earth.visible = earthW > 0.01;
    if (earth.visible) {
      const s = smooth((a - 60) / 32), s2 = smooth((a - 100) / 50);
      earth.scale.setScalar(lerp(lerp(95, 8, s), 4, s2));
      earth.position.copy(look).add(tmp.set(lerp(lerp(0, -36, s), -40, s2), lerp(lerp(-132, -36, s), -42, s2), lerp(lerp(-70, -80, s), -90, s2)));
      earth.rotation.y = t * 0.01;
      earth.userData.rim.uniforms.alpha.value = earthW;
      earth.children[0].material.opacity = earthW; earth.children[0].material.transparent = earthW < 1;
    }
    const moonW = smooth((a - 72) / 6);
    moonBody.visible = moonW > 0.01;
    if (moonBody.visible) {
      const u = smooth((a - 76) / 24), after = a > 99.5, s2 = smooth((a - 101) / 49);
      const fade = moonW * (after ? smooth((a - 101.5) / 2.5) : 1 - smooth((a - 97.5) / 1.5));
      if (after) { moonBody.position.copy(look).add(tmp.set(lerp(-24, -30, s2), lerp(-30, -42, s2), lerp(-55, -85, s2))); moonBody.scale.setScalar(lerp(8, 4, s2)); }
      else { moonBody.position.copy(look).add(tmp.set(lerp(10, 6, u), lerp(2, 0.5, u), lerp(-90, -40, u))); moonBody.scale.setScalar(lerp(4, 11, u)); }
      moonBody.visible = fade > 0.01;
      moonBody.material.opacity = fade; moonBody.material.transparent = fade < 1;
      moonBody.rotation.y = t * 0.02;
    }
    starfield.visible = a > 66;
    starfield.material.opacity = smooth((a - 66) / 12);
    starfield.position.copy(camera.position);
    finalGlow.visible = a > 104;
    if (finalGlow.visible) {
      const s = smooth((a - 104) / 46);
      islandPos(TOTAL, finalGlow.position).y += 2;
      finalGlow.scale.setScalar(lerp(8, 18, s));
      finalGlow.material.opacity = 0.35 + s * 0.6;
    }
    leaves.visible = w(0) > 0.02;
    leaves.position.copy(camera.position); leaves.quaternion.copy(camera.quaternion);
    leaves.position.y -= (1 - w(0)) * 2; // sink out of view as the jungle ends
    if (!still) leaves.children.forEach((l, i) => { l.rotation.z = (i ? -0.5 : 0.6) + Math.sin(t * 0.8 + i * 2) * 0.03; });

    // Ambient particles.
    for (const [id, pts] of Object.entries(ambient)) {
      const wk = w(IDS.indexOf(id));
      pts.visible = !still && stats.quality !== 'low' && wk > 0.02;
      if (!pts.visible) continue;
      pts.material.opacity = wk * 0.9;
      pts.position.copy(look);
      const pos = pts.geometry.attributes.position, fall = pts.userData.fall;
      for (let i = 0; i < pos.count; i++) {
        let y = pos.getY(i) - fall * dt;
        if (y < -4) y += 8; if (y > 4) y -= 8;
        pos.setXYZ(i, pos.getX(i) + Math.sin(t * 0.6 + i) * 0.002, y, pos.getZ(i));
      }
      pos.needsUpdate = true;
    }

    // Small motions (never in calm mode).
    if (!still) {
      for (const [n, o] of platforms) {
        o.userData.pebbles?.forEach((pb, i) => { pb.position.y = -1.9 - i * 0.3 + Math.sin(t * 0.7 + n + i) * 0.06; });
        const kind = kindFor(n);
        if (kind === 'clouds' && !(fallKind && n === steps)) o.position.y = o.userData.baseY + Math.sin(t * 0.9 + n) * 0.03;
      }
      for (const [n, o] of decor) {
        if (o.userData.sway) o.userData.sway.rotation.z = Math.sin(t * 0.6 + n) * 0.025;
        o.userData.spin?.forEach((s, i) => { s.rotation.y += dt * (0.15 + i * 0.05); });
      }
    }
    if (dip) {
      dip.t += dt;
      dip.plat.position.y = dip.plat.userData.baseY - Math.sin(clamp(dip.t / 0.18, 0, 1) * Math.PI) * 0.06;
      if (dip.t > 0.18) { dip.plat.position.y = dip.plat.userData.baseY; dip = null; }
    }
    // The destination ring glows while an answer is accepted.
    islandPos(Math.min(steps + 1, TOTAL), beacon.position).y += 0.03;
    const open = state === 'playing' && !jumping && steps < TOTAL;
    beacon.material.opacity += ((open ? 0.9 : state === 'paused' ? 0.3 : 0) - beacon.material.opacity) * 0.2;
    beacon.scale.setScalar(open && !still ? 1 + Math.sin(t * 4) * 0.05 : 1);
    if (flag.visible) {
      const g = flag.userData.grow;
      if (g) { g.t += dt; flag.scale.setScalar(smooth(g.t / 0.42) || 0.001); if (g.t > 0.42) flag.userData.grow = null; }
      if (!still) flag.userData.cloth.rotation.y = Math.sin(t * 2) * 0.15;
    }
    updateBursts(dt);

    renderer.render(scene, camera);
    placeCard();
    watchFrames(dt);
  }

  // Lower the quality (1× pixels, no shadows or ambient particles) if frames run slow.
  function watchFrames(dt) {
    if (stats.quality === 'low' || document.hidden) return;
    frameTimes.push(dt);
    if (frameTimes.length < 180) return;
    const avg = frameTimes.reduce((x, y) => x + y, 0) / frameTimes.length;
    frameTimes = [];
    if (avg > 0.026) setQuality('low');
  }
  function setQuality(q) {
    stats.quality = q;
    renderer.setPixelRatio(q === 'low' ? 1 : Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setSize(W, H);
    sun.castShadow = q !== 'low';
  }
  stats.setQuality = setQuality;

  function resize() {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h || (w === W && h === H)) return;
    W = w; H = h;
    renderer.setSize(W, H);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    snapCamera = true;
  }

  stats.destroy = () => {
    renderer.setAnimationLoop(null);
    const i = views.indexOf(onGame);
    if (i >= 0) views.splice(i, 1);
    renderer.dispose();
    canvas.remove();
    card.remove();
  };
}
