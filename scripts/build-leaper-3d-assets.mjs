// Builds the Letter Leaper 3D preview's models as GLB files, reproducibly
// (seeded; same output every run): node scripts/build-leaper-3d-assets.mjs
//
//   public/games/letter-leaper-3d/milo.glb     articulated Milo + animation clips
//   public/games/letter-leaper-3d/islands.glb  three floating-island variants
//   public/games/letter-leaper-3d/scenery.glb  jungle props (trees, palm, fern, bush, leaf, hills)
//
// PROVISIONAL ORIGINAL ARTWORK, modelled in code for this project (no
// downloaded models or textures). Colour comes from materials and vertex
// colours. A character artist's rigged model can replace milo.glb later as
// long as it keeps the clip names (Idle, Anticipate, Air, Land, Celebrate, Oops).
import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { mkdirSync, writeFileSync } from "node:fs";

// GLTFExporter needs FileReader (browser API) to assemble a GLB.
globalThis.FileReader ??= class {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then((b) => { this.result = b; this.onloadend?.(); this.onload?.({ target: this }); }); }
  readAsDataURL(blob) { blob.arrayBuffer().then((b) => { this.result = `data:${blob.type};base64,${Buffer.from(b).toString("base64")}`; this.onloadend?.(); this.onload?.({ target: this }); }); }
};

const OUT = new URL("../public/games/letter-leaper-3d/", import.meta.url);
function rng(seed) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const mat = (color, opts = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, ...opts });
const vmat = (opts = {}) => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0, ...opts });
function mesh(geo, material, name, pos = [0, 0, 0], scale = [1, 1, 1], rot = [0, 0, 0]) {
  const m = new THREE.Mesh(geo, material);
  m.name = name; m.position.set(...pos); m.scale.set(...scale); m.rotation.set(...rot);
  return m;
}
const group = (name, pos = [0, 0, 0], children = [], rot = [0, 0, 0]) => { const g = new THREE.Group(); g.name = name; g.position.set(...pos); g.rotation.set(...rot); if (children.length) g.add(...children); return g; };
const sphere = (r, w = 20, h = 14) => new THREE.SphereGeometry(r, w, h);
// Colour every vertex (optionally per-vertex via fn(position) → THREE.Color).
function paint(geo, color, fn) {
  const pos = geo.attributes.position, cols = new Float32Array(pos.count * 3), c = new THREE.Color(), v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i); c.set(color); fn?.(v, c, i); cols.set([c.r, c.g, c.b], i * 3); }
  geo.setAttribute("color", new THREE.BufferAttribute(cols, 3));
  return geo;
}
// Faceted look for rocks: unshare vertices so each face gets its own normal.
function facet(geo) { const g = geo.index ? geo.toNonIndexed() : geo; g.computeVertexNormals(); return g; }

async function exportGlb(root, clips, file) {
  // Colour comes from materials and vertex colours: texture coordinates are unused weight.
  root.traverse((o) => { if (o.isMesh) o.geometry.deleteAttribute("uv"); });
  const exporter = new GLTFExporter();
  const glb = await exporter.parseAsync(root, { binary: true, animations: clips, onlyVisible: false });
  mkdirSync(OUT, { recursive: true });
  writeFileSync(new URL(file, OUT), Buffer.from(glb));
  console.log(`${file}: ${(glb.byteLength / 1024).toFixed(0)} KB${clips.length ? `, clips: ${clips.map((c) => c.name).join(", ")}` : ""}`);
}

// ---------------------------------------------------------------------------
// Milo — big head, round ears, long curling tail. Feet at y = 0, facing +Z.
// ---------------------------------------------------------------------------
function buildMilo() {
  const FUR = mat("#8a5a3c"), FUR_DARK = mat("#6a4129"), FACE = mat("#f2cfa0"), FACE_LIGHT = mat("#f8dfb8");
  const PINK = mat("#e9a28c"), WHITE = mat("#ffffff", { roughness: 0.3 }), PUPIL = mat("#1b120c", { roughness: 0.2 }), NOSE = mat("#3e2416", { roughness: 0.4 });
  const MOUTH = mat("#6b2b2b"), TONGUE = mat("#e98a8a"), BLUSH = mat("#ec9a86");

  const legs = [-1, 1].map((s) => group(s < 0 ? "legL" : "legR", [s * 0.1, 0.02, 0], [
    mesh(new THREE.CapsuleGeometry(0.055, 0.12, 6, 14), FUR_DARK, `${s < 0 ? "L" : "R"}_leg`, [0, -0.09, 0]),
    mesh(sphere(0.075), FACE, `${s < 0 ? "L" : "R"}_foot`, [0, -0.18, 0.04], [1, 0.55, 1.45]),
  ]));
  const arms = [-1, 1].map((s) => group(s < 0 ? "armL" : "armR", [s * 0.2, 0.12, 0.01], [
    mesh(new THREE.CapsuleGeometry(0.048, 0.2, 6, 14), FUR, `${s < 0 ? "L" : "R"}_arm`, [s * 0.02, -0.13, 0]),
    mesh(sphere(0.058), FACE, `${s < 0 ? "L" : "R"}_hand`, [s * 0.03, -0.27, 0.01]),
  ], [0, 0, s * 0.18]));
  const eye = (s) => group(s < 0 ? "eyeL" : "eyeR", [s * 0.088, 0.045, 0.205], [
    mesh(sphere(0.058), WHITE, `${s < 0 ? "L" : "R"}_eyeWhite`, [0, 0, 0], [0.92, 1.12, 0.62]),
    mesh(sphere(0.034), PUPIL, `${s < 0 ? "L" : "R"}_pupil`, [0.004 * s, -0.004, 0.03]),
    mesh(sphere(0.011, 10, 8), WHITE, `${s < 0 ? "L" : "R"}_glint`, [0.012, 0.018, 0.058]),
  ]);
  // Eyelids are fur-coloured caps scaled from nothing (open) to full (closed).
  const lid = (s) => mesh(sphere(0.064), FACE, s < 0 ? "lidL" : "lidR", [s * 0.088, 0.045, 0.207], [0.95, 0.02, 0.7]);
  const ear = (s) => group(s < 0 ? "earL" : "earR", [s * 0.265, 0.05, -0.01], [
    mesh(sphere(0.11), FUR, `${s < 0 ? "L" : "R"}_ear`, [s * 0.02, 0, 0], [1, 1, 0.45]),
    mesh(sphere(0.07), PINK, `${s < 0 ? "L" : "R"}_earInner`, [s * 0.022, 0, 0.03], [1, 1, 0.3]),
  ]);
  const smile = mesh(new THREE.TorusGeometry(0.048, 0.011, 8, 24, Math.PI), MOUTH, "mouthSmile", [0, -0.12, 0.262], [1, 1, 1], [Math.PI, 0, 0]);
  const open = group("mouthOpen", [0, -0.13, 0.255], [
    mesh(sphere(0.05), MOUTH, "mouthOpenShape", [0, 0, 0], [1.15, 0.85, 0.45]),
    mesh(sphere(0.026), TONGUE, "tongue", [0, -0.018, 0.012], [1.2, 0.6, 0.6]),
  ]);
  open.scale.set(0.001, 0.001, 0.001);
  const oh = mesh(new THREE.TorusGeometry(0.024, 0.01, 8, 18), MOUTH, "mouthOh", [0, -0.125, 0.262], [0.001, 0.001, 0.001]);
  const head = group("head", [0, 0.53, 0.02], [
    mesh(sphere(0.27, 28, 20), FUR, "headShape", [0, 0, 0], [1.06, 0.95, 0.96]),
    mesh(sphere(0.2, 24, 16), FACE, "faceMask", [0, -0.02, 0.115], [1.08, 0.88, 0.6]),
    mesh(sphere(0.12, 20, 14), FACE_LIGHT, "muzzle", [0, -0.085, 0.2], [1.3, 0.78, 0.78]),
    mesh(sphere(0.036, 16, 12), NOSE, "nose", [0, -0.045, 0.3], [1.45, 0.9, 0.8]),
    mesh(sphere(0.034, 14, 10), BLUSH, "cheekL", [-0.165, -0.06, 0.19], [1, 0.7, 0.5]),
    mesh(sphere(0.034, 14, 10), BLUSH, "cheekR", [0.165, -0.06, 0.19], [1, 0.7, 0.5]),
    ear(-1), ear(1), eye(-1), eye(1), lid(-1), lid(1), smile, open, oh,
  ]);
  // Tail: a chain, each segment a child of the previous, so rotations curl.
  let tail = null;
  for (let i = 6; i >= 0; i--) {
    const r = 0.052 - i * 0.004;
    const seg = group(`tail${i}`, i === 0 ? [0, 0.04, -0.2] : [0, 0.075, 0], [mesh(sphere(r, 14, 10), FUR, `tailBall${i}`, [0, 0.03, 0], [1, 1.5, 1])], i === 0 ? [-0.9, 0, 0] : [-0.32, 0, 0]);
    if (tail) seg.add(tail);
    tail = seg;
  }
  const body = mesh(sphere(0.24, 24, 18), FUR, "body", [0, 0.16, 0], [1, 1.12, 0.9]);
  const belly = mesh(sphere(0.17, 20, 14), FACE, "belly", [0, 0.13, 0.105], [1, 1.12, 0.55]);
  const hips = group("hips", [0, 0.27, 0], [body, belly, ...legs, ...arms, head, tail]);
  const milo = group("Milo", [0, 0, 0], [hips]);
  milo.traverse((o) => { if (o.isMesh) { o.castShadow = true; } });
  return milo;
}

// Clips from poses: every clip animates the same set of nodes, so cross-fades blend cleanly.
const ANIMATED = ["hips", "body", "head", "armL", "armR", "legL", "legR", "earL", "earR", "lidL", "lidR", "mouthSmile", "mouthOpen", "mouthOh", ...Array.from({ length: 7 }, (_, i) => `tail${i}`)];
function restPose(root) {
  const rest = {};
  for (const n of ANIMATED) { const o = root.getObjectByName(n); rest[n] = { p: o.position.toArray(), r: [o.rotation.x, o.rotation.y, o.rotation.z], s: o.scale.toArray() }; }
  return rest;
}
const MOUTH = { smile: { mouthSmile: { s: [1, 1, 1] }, mouthOpen: { s: [0.001, 0.001, 0.001] }, mouthOh: { s: [0.001, 0.001, 0.001] } },
  open: { mouthSmile: { s: [0.001, 0.001, 0.001] }, mouthOpen: { s: [1, 1, 1] }, mouthOh: { s: [0.001, 0.001, 0.001] } },
  oh: { mouthSmile: { s: [0.001, 0.001, 0.001] }, mouthOpen: { s: [0.001, 0.001, 0.001] }, mouthOh: { s: [1, 1, 1] } } };
const tailCurl = (sway, lift = 0) => Object.fromEntries(Array.from({ length: 7 }, (_, i) => [`tail${i}`, { r: [i === 0 ? -0.9 + lift : -0.32 - lift * 0.15, 0, sway * (0.4 + i * 0.12)] }]));
function clip(name, rest, keys) {
  const tracks = [];
  for (const n of ANIMATED) {
    const times = keys.map(([t]) => t);
    const value = (k, field) => keys[k][1][n]?.[field] ?? rest[n][field];
    tracks.push(new THREE.VectorKeyframeTrack(`${n}.position`, times, keys.flatMap((_, k) => value(k, "p"))));
    tracks.push(new THREE.QuaternionKeyframeTrack(`${n}.quaternion`, times, keys.flatMap((_, k) => new THREE.Quaternion().setFromEuler(new THREE.Euler(...value(k, "r"))).toArray())));
    tracks.push(new THREE.VectorKeyframeTrack(`${n}.scale`, times, keys.flatMap((_, k) => value(k, "s"))));
  }
  return new THREE.AnimationClip(name, keys[keys.length - 1][0], tracks);
}
function buildClips(milo) {
  const R = restPose(milo);
  const hipsY = R.hips.p[1];
  const at = (p, y) => [p[0], y, p[2]];
  const blink = { lidL: { s: [0.95, 1, 0.7] }, lidR: { s: [0.95, 1, 0.7] } };
  const idle = clip("Idle", R, [
    [0, { ...MOUTH.smile, ...tailCurl(-0.25) }],
    [0.6, { hips: { p: at(R.hips.p, hipsY + 0.008) }, body: { s: [1.02, 1.035, 1.02] }, head: { p: [0, 0.538, 0.02], r: [0.03, 0.06, 0] }, armL: { r: [0, 0, -0.24] }, armR: { r: [0, 0, 0.12] }, ...MOUTH.smile, ...tailCurl(0) }],
    [1.2, { ...MOUTH.smile, ...tailCurl(0.25) }],
    [1.85, { hips: { p: at(R.hips.p, hipsY + 0.008) }, body: { s: [1.02, 1.035, 1.02] }, head: { p: [0, 0.538, 0.02], r: [0.02, -0.06, 0] }, armL: { r: [0, 0, -0.12] }, armR: { r: [0, 0, 0.24] }, ...MOUTH.smile, ...tailCurl(0) }],
    [1.95, { ...blink, ...MOUTH.smile, ...tailCurl(-0.05) }],
    [2.05, { ...MOUTH.smile, ...tailCurl(-0.12) }],
    [2.4, { ...MOUTH.smile, ...tailCurl(-0.25) }],
  ]);
  const crouch = { hips: { p: at(R.hips.p, hipsY - 0.07) }, body: { s: [1.1, 0.86, 1.1] }, head: { p: [0, 0.49, 0.05], r: [0.18, 0, 0] }, armL: { r: [0.7, 0, -0.35] }, armR: { r: [0.7, 0, 0.35] }, legL: { s: [1, 0.78, 1] }, legR: { s: [1, 0.78, 1] }, ...MOUTH.smile, ...tailCurl(0, 0.2) };
  const anticipate = clip("Anticipate", R, [[0, { ...MOUTH.smile, ...tailCurl(0) }], [0.12, crouch]]);
  const air = (sway) => ({ hips: { p: at(R.hips.p, hipsY + 0.02) }, body: { s: [0.93, 1.1, 0.93] }, head: { r: [-0.15, 0, 0] }, armL: { r: [0, 0, -2.5] }, armR: { r: [0, 0, 2.5] }, legL: { r: [0.7, 0, 0], s: [1, 0.9, 1] }, legR: { r: [0.5, 0, 0], s: [1, 0.9, 1] }, earL: { r: [0, 0, 0.25] }, earR: { r: [0, 0, -0.25] }, ...MOUTH.open, ...tailCurl(sway, -0.7) });
  const airClip = clip("Air", R, [[0, air(-0.2)], [0.3, air(0.2)], [0.6, air(-0.2)]]);
  const land = clip("Land", R, [
    [0, { hips: { p: at(R.hips.p, hipsY - 0.08) }, body: { s: [1.16, 0.82, 1.16] }, head: { p: [0, 0.48, 0.04], r: [0.15, 0, 0] }, armL: { r: [0, 0, -0.9] }, armR: { r: [0, 0, 0.9] }, legL: { s: [1, 0.75, 1] }, legR: { s: [1, 0.75, 1] }, ...MOUTH.open, ...tailCurl(0, -0.3) }],
    [0.14, { hips: { p: at(R.hips.p, hipsY + 0.015) }, body: { s: [0.97, 1.05, 0.97] }, armL: { r: [0, 0, -0.4] }, armR: { r: [0, 0, 0.4] }, ...MOUTH.smile, ...tailCurl(0.15) }],
    [0.32, { ...MOUTH.smile, ...tailCurl(-0.1) }],
  ]);
  const cheer = (t, up, wag) => [t, { hips: { p: at(R.hips.p, hipsY + up) }, body: { s: up > 0.05 ? [0.95, 1.08, 0.95] : [1.08, 0.9, 1.08] }, head: { r: [-0.1, 0, wag * 0.15] }, armL: { r: [0, 0, -2.7 + wag * 0.3] }, armR: { r: [0, 0, 2.7 + wag * 0.3] }, earL: { r: [0, 0, 0.2] }, earR: { r: [0, 0, -0.2] }, ...MOUTH.open, ...tailCurl(wag * 0.5, -0.2) }];
  const celebrate = clip("Celebrate", R, [cheer(0, 0, -1), cheer(0.22, 0.2, 0), cheer(0.44, 0, 1), cheer(0.66, 0.2, 0), cheer(0.88, 0, -1)]);
  const oops = clip("Oops", R, [
    [0, { ...MOUTH.smile, ...tailCurl(0) }],
    [0.12, { head: { r: [0.05, 0, 0.26] }, armR: { r: [-0.2, 0, 2.5] }, earL: { r: [0, 0, -0.35] }, earR: { r: [0, 0, 0.35] }, ...MOUTH.oh, ...tailCurl(0, 0.3) }],
    [0.5, { head: { r: [0.05, 0, 0.2] }, armR: { r: [-0.2, 0, 2.3] }, earL: { r: [0, 0, -0.3] }, earR: { r: [0, 0, 0.3] }, ...MOUTH.oh, ...tailCurl(0.1, 0.3) }],
    [0.75, { ...MOUTH.smile, ...tailCurl(0) }],
  ]);
  return [idle, anticipate, airClip, land, celebrate, oops];
}

// ---------------------------------------------------------------------------
// Floating islands — grassy cap, soil lip, faceted rocky underside, props.
// The landing spot (radius ≈ 0.45 around the centre) stays clear.
// ---------------------------------------------------------------------------
function noise2(r) { const a = Array.from({ length: 6 }, () => [r() * 6.28, 1 + Math.floor(r() * 4), 0.3 + r() * 0.7]); return (ang) => a.reduce((s, [ph, f, amp]) => s + Math.sin(ang * f + ph) * amp, 0) / 6; }
function buildIsland(variant, seed) {
  const r = rng(seed), wobble = noise2(r);
  const g = group(`island_${variant}`);
  const radius = 1.15;
  // Grass cap: a gently uneven disc with a rounded edge.
  const cap = new THREE.CylinderGeometry(radius, radius * 0.97, 0.2, 32, 2);
  const v = new THREE.Vector3();
  for (let i = 0; i < cap.attributes.position.count; i++) {
    v.fromBufferAttribute(cap.attributes.position, i);
    const ang = Math.atan2(v.z, v.x), k = 1 + wobble(ang) * 0.12;
    v.x *= k; v.z *= k;
    if (v.y > 0.05) v.y += Math.max(0, 0.05 - Math.hypot(v.x, v.z) * 0.04) + (r() - 0.5) * 0.015;
    cap.attributes.position.setXYZ(i, v.x, v.y, v.z);
  }
  cap.computeVertexNormals();
  paint(cap, "#6dbb54", (p, c) => { c.offsetHSL((r() - 0.5) * 0.03, 0, (r() - 0.5) * 0.08 + (p.y < 0 ? -0.08 : 0)); });
  g.add(mesh(cap, vmat({ roughness: 0.95 }), "grass", [0, -0.1, 0]));
  // Soil lip.
  const lip = new THREE.CylinderGeometry(radius * 0.98, radius * 0.88, 0.16, 32, 1);
  for (let i = 0; i < lip.attributes.position.count; i++) { v.fromBufferAttribute(lip.attributes.position, i); const k = 1 + wobble(Math.atan2(v.z, v.x)) * 0.12; lip.attributes.position.setXYZ(i, v.x * k, v.y, v.z * k); }
  paint(lip, "#7a5236", (p, c) => c.offsetHSL(0, 0, (r() - 0.5) * 0.06));
  lip.computeVertexNormals();
  g.add(mesh(lip, vmat(), "soil", [0, -0.27, 0]));
  // Rocky underside: a lathe tapering to a point, pushed in and out, faceted.
  const pts = [];
  for (let i = 0; i <= 8; i++) { const t = i / 8; pts.push(new THREE.Vector2(radius * 0.9 * Math.pow(1 - t, 0.75) + 0.02, -t * 1.55)); }
  let rock = new THREE.LatheGeometry(pts, 22);
  for (let i = 0; i < rock.attributes.position.count; i++) {
    v.fromBufferAttribute(rock.attributes.position, i);
    const ang = Math.atan2(v.z, v.x), k = 1 + wobble(ang * 1.7 + v.y) * 0.35 + (r() - 0.5) * 0.12;
    rock.attributes.position.setXYZ(i, v.x * k, v.y + (r() - 0.5) * 0.06, v.z * k);
  }
  rock.mergeVertices?.();
  rock = facet(rock);
  paint(rock, "#8c7d70", (p, c) => { const band = Math.sin(p.y * 9) * 0.04; c.offsetHSL(0, (r() - 0.5) * 0.04, band + (r() - 0.5) * 0.07 + p.y * 0.12); });
  g.add(mesh(rock, vmat({ flatShading: true }), "rock", [0, -0.35, 0]));
  // Props around the rim (never in the landing spot).
  const STONE = vmat({ flatShading: true }), LEAF = vmat({ side: THREE.DoubleSide });
  const rimPoint = (minR = 0.55, maxR = 0.95) => { const a = r() * Math.PI * 2, d = minR + r() * (maxR - minR); return [Math.cos(a) * d, Math.sin(a) * d, a]; };
  for (let i = 0; i < 3 + Math.floor(r() * 2); i++) {
    const [x, z] = rimPoint(0.6, 0.98), s = 0.08 + r() * 0.1;
    g.add(mesh(paint(facet(new THREE.DodecahedronGeometry(s, 0)), "#9a8f86", (p, c) => c.offsetHSL(0, 0, (r() - 0.5) * 0.1)), STONE, `stone${i}`, [x, 0.02, z], [1, 0.7, 1], [r(), r(), r()]));
  }
  for (let i = 0; i < 7; i++) {
    const [x, z] = rimPoint(0.5, 1.0), tuft = group(`tuft${i}`, [x, 0, z]);
    for (let k = 0; k < 5; k++) {
      const blade = paint(new THREE.ConeGeometry(0.025, 0.16 + r() * 0.1, 4), k % 2 ? "#5aa846" : "#79c75e");
      tuft.add(mesh(blade, LEAF, `blade${i}_${k}`, [(r() - 0.5) * 0.08, 0.08, (r() - 0.5) * 0.08], [1, 1, 1], [(r() - 0.5) * 0.6, 0, (r() - 0.5) * 0.6]));
    }
    g.add(tuft);
  }
  const petals = ["#ffd166", "#ff8fab", "#ffffff", "#c9a7ff"];
  for (let i = 0; i < 4; i++) {
    const [x, z] = rimPoint(0.55, 0.95), col = petals[Math.floor(r() * petals.length)];
    const f = group(`flower${i}`, [x, 0, z], [
      mesh(paint(new THREE.CylinderGeometry(0.008, 0.01, 0.16, 5), "#4f9a3d"), LEAF, `stem${i}`, [0, 0.08, 0]),
      mesh(paint(sphere(0.035, 10, 8), col), vmat(), `bloom${i}`, [0, 0.17, 0], [1, 0.6, 1]),
      mesh(paint(sphere(0.014, 8, 6), "#7a4a18"), vmat(), `centre${i}`, [0, 0.188, 0]),
    ]);
    g.add(f);
  }
  { // a little bush on the back rim
    const [x, z] = rimPoint(0.72, 0.9), b = group("bush", [x, 0, z]);
    for (let k = 0; k < 5; k++) b.add(mesh(paint(sphere(0.12 + r() * 0.06, 14, 10), "#4c9a45", (p, c) => c.offsetHSL(0, 0, p.y * 0.4 + (r() - 0.5) * 0.04)), vmat(), `bushBall${k}`, [(r() - 0.5) * 0.25, 0.1 + r() * 0.08, (r() - 0.5) * 0.25]));
    g.add(b);
  }
  // Hanging vines under the lip.
  for (let i = 0; i < 4; i++) {
    const a = r() * Math.PI * 2, d = 0.85 + r() * 0.1, len = 0.5 + r() * 0.6;
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(Math.cos(a) * d, -0.3, Math.sin(a) * d), new THREE.Vector3(Math.cos(a) * d * 0.95, -0.3 - len * 0.5, Math.sin(a) * d * 0.95 + 0.05), new THREE.Vector3(Math.cos(a) * d * 0.9, -0.3 - len, Math.sin(a) * d * 0.9)]);
    g.add(mesh(paint(new THREE.TubeGeometry(curve, 10, 0.018, 5), "#3f7f3a"), vmat(), `vine${i}`));
    const leafAt = curve.getPoint(0.7);
    g.add(mesh(paint(sphere(0.045, 8, 6), "#58a24a"), vmat(), `vineLeaf${i}`, leafAt.toArray(), [1.3, 0.5, 0.8]));
  }
  // Pebbles drifting underneath (animated at runtime by name).
  for (let i = 0; i < 2; i++) g.add(mesh(paint(facet(new THREE.DodecahedronGeometry(0.1 + r() * 0.08, 0)), "#8c7d70"), STONE, `pebble${i}`, [(r() - 0.5) * 1.2, -1.9 - r() * 0.5, (r() - 0.5) * 1.2]));
  g.traverse((o) => { if (o.isMesh) { o.castShadow = o.name !== "rock"; o.receiveShadow = true; } });
  return g;
}

// ---------------------------------------------------------------------------
// Jungle props.
// ---------------------------------------------------------------------------
function buildScenery() {
  const r = rng(99);
  const LEAF = vmat({ side: THREE.DoubleSide }), WOOD = vmat();
  const trunk = (h, r0, r1, bend) => {
    const geo = new THREE.CylinderGeometry(r1, r0, h, 9, 8);
    const v = new THREE.Vector3();
    for (let i = 0; i < geo.attributes.position.count; i++) { v.fromBufferAttribute(geo.attributes.position, i); const t = (v.y + h / 2) / h; geo.attributes.position.setX(i, v.x + Math.sin(t * Math.PI * 0.5) * bend); }
    geo.computeVertexNormals();
    return paint(geo, "#7b5235", (p, c) => c.offsetHSL(0, 0, Math.sin(p.y * 14) * 0.03));
  };
  // Round-canopy tree.
  const round = group("tree_round", [0, 0, 0], [mesh(trunk(2.4, 0.16, 0.1, 0.2), WOOD, "trunk", [0, 1.2, 0])]);
  for (let k = 0; k < 7; k++) {
    const a = (k / 7) * Math.PI * 2, d = k ? 0.55 : 0, s = 0.55 + r() * 0.25;
    round.add(mesh(paint(new THREE.IcosahedronGeometry(s, 2), "#3f8f45", (p, c) => c.offsetHSL((r() - 0.5) * 0.02, 0, p.y * 0.25 + (r() - 0.5) * 0.04)), vmat(), `canopy${k}`, [0.2 + Math.cos(a) * d, 2.6 + (k ? r() * 0.3 : 0.45), Math.sin(a) * d]));
  }
  // Palm: a curved trunk with ring bands and drooping fronds.
  const palm = group("tree_palm", [0, 0, 0], [mesh(trunk(3, 0.13, 0.09, 0.5), WOOD, "palmTrunk", [0, 1.5, 0])]);
  for (let k = 0; k < 8; k++) {
    const frond = new THREE.PlaneGeometry(0.34, 1.5, 1, 8);
    const v = new THREE.Vector3();
    for (let i = 0; i < frond.attributes.position.count; i++) { v.fromBufferAttribute(frond.attributes.position, i); const t = (v.y + 0.75) / 1.5; frond.attributes.position.setXYZ(i, v.x * Math.sin(t * Math.PI) * 1.1, v.y, -t * t * 0.8); }
    frond.translate(0, 0.75, 0);
    frond.computeVertexNormals();
    paint(frond, "#4f9e3f", (p, c) => c.offsetHSL(0, 0, (p.y / 1.5) * 0.12 - Math.abs(p.x) * 0.3));
    palm.add(mesh(frond, LEAF, `frond${k}`, [0.5, 3, 0], [1, 1, 1], [Math.PI / 2 - 0.5, (k / 8) * Math.PI * 2, 0]));
  }
  // Fern: radial arching leaves.
  const fern = group("fern");
  for (let k = 0; k < 9; k++) {
    const leaf = new THREE.PlaneGeometry(0.16, 0.8, 1, 6), v = new THREE.Vector3();
    for (let i = 0; i < leaf.attributes.position.count; i++) { v.fromBufferAttribute(leaf.attributes.position, i); const t = (v.y + 0.4) / 0.8; leaf.attributes.position.setXYZ(i, v.x * (1 - t * 0.8), v.y, -t * t * 0.35); }
    leaf.translate(0, 0.4, 0); leaf.computeVertexNormals();
    paint(leaf, "#5cae4a", (p, c) => c.offsetHSL(0, 0, p.y * 0.12));
    fern.add(mesh(leaf, LEAF, `fernLeaf${k}`, [0, 0.02, 0], [1, 1, 1], [Math.PI / 2 - 0.7, (k / 9) * Math.PI * 2 + r() * 0.3, 0]));
  }
  const bush = group("bush_big");
  for (let k = 0; k < 6; k++) bush.add(mesh(paint(sphere(0.35 + r() * 0.2, 14, 10), "#3d8a40", (p, c) => c.offsetHSL(0, 0, p.y * 0.35)), vmat(), `ball${k}`, [(r() - 0.5) * 0.8, 0.3 + r() * 0.25, (r() - 0.5) * 0.5]));
  // Big framing leaf (monstera-like teardrop with a midrib), slightly curled.
  const shape = new THREE.Shape();
  shape.moveTo(0, 0); shape.bezierCurveTo(0.55, 0.25, 0.65, 0.95, 0, 1.5); shape.bezierCurveTo(-0.65, 0.95, -0.55, 0.25, 0, 0);
  const leafGeo = new THREE.ShapeGeometry(shape, 18), lv = new THREE.Vector3();
  for (let i = 0; i < leafGeo.attributes.position.count; i++) { lv.fromBufferAttribute(leafGeo.attributes.position, i); leafGeo.attributes.position.setZ(i, lv.x * lv.x * 0.5 - lv.y * 0.12); }
  leafGeo.computeVertexNormals();
  paint(leafGeo, "#2f7a3b", (p, c) => c.offsetHSL(0, 0, Math.abs(p.x) < 0.02 ? 0.12 : -Math.abs(p.x) * 0.08));
  const bigLeaf = group("leaf_big", [0, 0, 0], [mesh(leafGeo, LEAF, "leafBlade"), mesh(paint(new THREE.CylinderGeometry(0.015, 0.02, 0.8, 5), "#2d6a33"), LEAF, "leafStem", [0, -0.4, 0])]);
  // Distant hills: soft mounds with a few canopy bumps (fogged at runtime).
  const hills = group("hills");
  for (let k = 0; k < 5; k++) {
    const h = mesh(paint(sphere(4 + r() * 3, 20, 12), "#4e8a5a", (p, c) => c.offsetHSL(0, 0, p.y * 0.04)), vmat(), `hill${k}`, [(k - 2) * 6 + (r() - 0.5) * 2, -1.5, (r() - 0.5) * 4], [1, 0.45 + r() * 0.25, 1]);
    hills.add(h);
    for (let j = 0; j < 6; j++) hills.add(mesh(paint(sphere(0.8 + r() * 0.6, 10, 8), "#3f7d4b"), vmat(), `hillTree${k}_${j}`, [h.position.x + (r() - 0.5) * 6, h.scale.y * 4 - 1.6 + r() * 0.5, h.position.z + (r() - 0.5) * 3]));
  }
  const all = [round, palm, fern, bush, bigLeaf];
  for (const o of all) o.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  return group("Scenery", [0, 0, 0], [...all, hills]);
}

const milo = buildMilo();
await exportGlb(milo, buildClips(milo), "milo.glb");
await exportGlb(group("Islands", [0, 0, 0], [buildIsland("a", 11), buildIsland("b", 23), buildIsland("c", 37)]), [], "islands.glb");
await exportGlb(buildScenery(), [], "scenery.glb");
