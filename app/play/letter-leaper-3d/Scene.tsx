"use client";

// Letter Leaper 3D preview — the rendered world (React Three Fiber). It only
// reads the rules engine (steps, jumping, jump progress) and follows its view
// events; it never decides what counts or changes any timer.
import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerformanceMonitor, Sparkles, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { LeaperCore } from "@/lib/leaper3d/core";
import { GOAL, type Phase } from "@/lib/leaper3d/preview";

const ASSETS = "/games/letter-leaper-3d";
export const MODEL_URLS = [`${ASSETS}/milo.glb`, `${ASSETS}/islands.glb`, `${ASSETS}/scenery.glb`];

// ---- path layout --------------------------------------------------------------
const RISE = 0.8, DEPTH = 2.6, SIDE = 0.95;
const jitter = (n: number) => (((n * 37) % 7) - 3) / 3; // fixed per island, -1..1
export function islandPos(n: number) {
  return new THREE.Vector3((n % 2 === 0 ? SIDE : -SIDE) + jitter(n) * 0.22, n * RISE, -n * DEPTH);
}
const standPos = (n: number) => islandPos(n).add(new THREE.Vector3(0, 0.02, 0));
const smooth = (t: number) => { const x = Math.min(1, Math.max(0, t)); return x * x * (3 - 2 * x); };

export type SceneProps = {
  core: LeaperCore;
  phase: Phase;
  calm: boolean;
  lowEffects: boolean;
  inputOpen: boolean;
  onLowEffects: () => void;
};

/** The leap Milo stands on, as the player sees it (the rules engine resets to 0 after the goal). */
const visualSteps = (core: LeaperCore, phase: Phase) => (phase === "celebrating" ? GOAL : core.steps);

// ---- sky, light, atmosphere -----------------------------------------------------
function Sky() {
  const geo = useMemo(() => {
    const g = new THREE.SphereGeometry(90, 24, 16), top = new THREE.Color("#7fc4dd"), mid = new THREE.Color("#cfe8dc"), low = new THREE.Color("#f6dcaa");
    const cols = new Float32Array(g.attributes.position.count * 3), c = new THREE.Color();
    for (let i = 0; i < g.attributes.position.count; i++) {
      const y = g.attributes.position.getY(i) / 90;
      if (y > 0.1) c.copy(mid).lerp(top, Math.min(1, (y - 0.1) / 0.6)); else c.copy(low).lerp(mid, Math.max(0, (y + 0.25) / 0.35));
      cols.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute("color", new THREE.BufferAttribute(cols, 3));
    return g;
  }, []);
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ camera }) => ref.current?.position.copy(camera.position));
  useEffect(() => () => geo.dispose(), [geo]);
  return (
    <mesh ref={ref} geometry={geo} renderOrder={-1}>
      <meshBasicMaterial vertexColors side={THREE.BackSide} fog={false} depthWrite={false} />
    </mesh>
  );
}

function SunLight({ focus, shadows }: { focus: React.RefObject<THREE.Vector3>; shadows: boolean }) {
  const light = useRef<THREE.DirectionalLight>(null);
  const { scene } = useThree();
  useEffect(() => {
    const l = light.current;
    if (!l) return;
    scene.add(l.target);
    return () => { scene.remove(l.target); };
  }, [scene]);
  useFrame(() => {
    const l = light.current, f = focus.current;
    if (!l || !f) return;
    l.position.set(f.x - 5, f.y + 9, f.z + 5);
    l.target.position.copy(f);
  });
  return (
    <directionalLight ref={light} color="#ffd9a3" intensity={2.6} castShadow={shadows} shadow-mapSize={[1024, 1024]} shadow-bias={-0.0004} shadow-normalBias={0.03}
      shadow-camera-left={-5} shadow-camera-right={5} shadow-camera-top={5} shadow-camera-bottom={-5} shadow-camera-near={0.5} shadow-camera-far={30} />
  );
}

// A soft round texture for mist and the contact shadow (drawn once).
function useRadialTexture(inner: string, outer: string) {
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d")!, grad = g.createRadialGradient(64, 64, 4, 64, 64, 64);
    grad.addColorStop(0, inner); grad.addColorStop(1, outer);
    g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [inner, outer]);
  useEffect(() => () => tex.dispose(), [tex]);
  return tex;
}

function Mist({ steps, calm }: { steps: number; calm: boolean }) {
  const tex = useRadialTexture("rgba(255,255,255,0.55)", "rgba(255,255,255,0)");
  const group = useRef<THREE.Group>(null);
  const puffs = useMemo(() => Array.from({ length: 6 }, (_, i) => ({ dx: (i % 2 ? -1 : 1) * (2.2 + (i % 3) * 0.9), dy: -1.1 - (i % 3) * 0.5, n: i, s: 3.5 + (i % 3) })), []);
  useFrame(({ clock }) => {
    if (!group.current) return;
    group.current.children.forEach((m, i) => {
      const p = puffs[i], base = islandPos(steps + p.n - 1);
      m.position.set(base.x + p.dx + (calm ? 0 : Math.sin(clock.elapsedTime * 0.08 + i) * 0.6), base.y + p.dy, base.z - 0.8);
    });
  });
  return (
    <group ref={group}>
      {puffs.map((p) => (
        <sprite key={p.n} scale={[p.s, p.s * 0.45, 1]}>
          <spriteMaterial map={tex} transparent depthWrite={false} opacity={0.75} />
        </sprite>
      ))}
    </group>
  );
}

// ---- islands and scenery (cloned from the GLBs; clones share geometry) ---------
function useModel(url: string, name: string) {
  const { scene } = useGLTF(url);
  return useMemo(() => scene.getObjectByName(name)!, [scene, name]);
}
function Island({ n, variant }: { n: number; variant: string }) {
  const src = useModel(MODEL_URLS[1], `island_${variant}`);
  const obj = useMemo(() => {
    const o = src.clone(true);
    o.traverse((m) => { if ((m as THREE.Mesh).isMesh) { m.castShadow = !m.name.startsWith("rock"); m.receiveShadow = true; } });
    return o;
  }, [src]);
  const pebbles = useRef<THREE.Object3D[]>([]);
  useEffect(() => { pebbles.current = obj.children.filter((c) => c.name.startsWith("pebble")); }, [obj]);
  useFrame(({ clock }) => pebbles.current.forEach((p, i) => { p.position.y = -1.9 - i * 0.3 + Math.sin(clock.elapsedTime * 0.7 + n + i) * 0.06; }));
  const p = islandPos(n);
  // dispose={null}: clones share the cached GLB's geometry and materials.
  return <primitive object={obj} position={p.toArray()} rotation={[0, n * 1.7, 0]} dispose={null} />;
}

function SideIsland({ n, calm }: { n: number; calm: boolean }) {
  const variant = ["b", "c", "a"][n % 3], treeName = n % 2 ? "tree_palm" : "tree_round";
  const island = useModel(MODEL_URLS[1], `island_${variant}`), tree = useModel(MODEL_URLS[2], treeName);
  const objs = useMemo(() => [island.clone(true), tree.clone(true)], [island, tree]);
  const treeRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => { if (treeRef.current && !calm) treeRef.current.rotation.z = Math.sin(clock.elapsedTime * 0.6 + n) * 0.025; });
  const p = islandPos(n), side = n % 2 === 0 ? -1 : 1; // opposite the path island
  return (
    <group position={[p.x + side * 3.4, p.y - 0.9, p.z - 1]} rotation={[0, n * 2.3, 0]} scale={0.62}>
      <primitive object={objs[0]} dispose={null} />
      <group ref={treeRef} position={[0.3, 0, -0.2]} scale={1.15}><primitive object={objs[1]} dispose={null} /></group>
    </group>
  );
}

function Canopy({ steps }: { steps: number }) {
  // A layer of treetops far below the islands, recycled along the path.
  const src = useModel(MODEL_URLS[2], "tree_round");
  const trees = useMemo(() => Array.from({ length: 10 }, () => src.clone(true)), [src]);
  const base = Math.max(0, steps - 2);
  return (
    <group>
      {trees.map((t, i) => {
        const n = base + Math.floor(i / 2), p = islandPos(n), side = i % 2 ? -1 : 1;
        return <primitive key={i} object={t} dispose={null} position={[p.x + side * (4 + (i % 3)), p.y - 8.5, p.z - 1.5]} scale={2.2} rotation={[0, i, 0]} />;
      })}
    </group>
  );
}

function Hills({ focus }: { focus: React.RefObject<THREE.Vector3> }) {
  const src = useModel(MODEL_URLS[2], "hills");
  const obj = useMemo(() => src.clone(true), [src]);
  const ref = useRef<THREE.Group>(null);
  // Far away and slow: follows most of the camera's travel, so it recedes gently.
  useFrame(() => { const f = focus.current; if (ref.current && f) ref.current.position.set(f.x * 0.9, f.y * 0.85 - 9, f.z * 0.92 - 34); });
  return <group ref={ref} scale={1.6}><primitive object={obj} dispose={null} /></group>;
}

function ForegroundLeaves({ calm }: { calm: boolean }) {
  const src = useModel(MODEL_URLS[2], "leaf_big");
  const leaves = useMemo(() => [src.clone(true), src.clone(true)], [src]);
  const group = useRef<THREE.Group>(null);
  const { camera } = useThree();
  useFrame(({ clock }) => {
    const g = group.current;
    if (!g) return;
    g.position.copy(camera.position);
    g.quaternion.copy(camera.quaternion);
    if (!calm) g.children.forEach((l, i) => { l.rotation.z = (i === 1 ? -0.5 : 0.6) + Math.sin(clock.elapsedTime * 0.8 + i * 2) * 0.03; });
  });
  return (
    <group ref={group}>
      <group position={[-1.75, -1.15, -2.6]} rotation={[0.2, 0.3, 0.6]} scale={1.1}><primitive object={leaves[0]} dispose={null} /></group>
      <group position={[1.9, -1.2, -2.7]} rotation={[0.25, -0.4, -0.5]} scale={1.2}><primitive object={leaves[1]} dispose={null} /></group>
    </group>
  );
}

// ---- Milo ---------------------------------------------------------------------------
type ClipName = "Idle" | "Anticipate" | "Air" | "Land" | "Celebrate" | "Oops";
type MiloAnimator = { play(name: ClipName, opts?: { once?: boolean; fade?: number }): void; current(): ClipName; update(dt: number): void; dispose(): void };

// Clip playback with cross-fades between states. One-shot reactions (Land,
// Oops) settle back into Idle — or into Celebrate once the goal is reached.
function createAnimator(root: THREE.Object3D, clips: THREE.AnimationClip[], settleTo: () => ClipName): MiloAnimator {
  const mixer = new THREE.AnimationMixer(root);
  const actions = new Map(clips.map((c) => [c.name as ClipName, mixer.clipAction(c)]));
  let current: ClipName = "Idle";
  const play = (name: ClipName, { once = false, fade = 0.14 } = {}) => {
    const next = actions.get(name), prev = actions.get(current);
    if (!next) return;
    next.reset();
    next.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat, once ? 1 : Infinity);
    next.clampWhenFinished = once;
    next.enabled = true;
    next.play();
    if (prev && prev !== next) prev.crossFadeTo(next, fade, false);
    current = name;
  };
  const onFinished = (e: { action: THREE.AnimationAction }) => {
    const name = e.action.getClip().name;
    if (name === "Land" || name === "Oops") play(settleTo(), { fade: 0.25 });
  };
  mixer.addEventListener("finished", onFinished as never);
  play("Idle", { fade: 0 });
  return {
    play, current: () => current,
    update: (dt) => mixer.update(dt),
    dispose() { mixer.removeEventListener("finished", onFinished as never); mixer.stopAllAction(); mixer.uncacheRoot(root); },
  };
}

function Milo({ core, phase, calm, focus }: { core: LeaperCore; phase: Phase; calm: boolean; focus: React.RefObject<THREE.Vector3> }) {
  const { scene, animations } = useGLTF(MODEL_URLS[0]);
  const root = useRef<THREE.Group>(null);
  const shadow = useRef<THREE.Mesh>(null);
  const shadowTex = useRadialTexture("rgba(20,40,20,0.5)", "rgba(20,40,20,0)");
  const animator = useRef<MiloAnimator | null>(null);
  const yaw = useRef(0);
  const phaseRef = useRef(phase);
  useEffect(() => { phaseRef.current = phase; if (phase === "celebrating") animator.current?.play("Celebrate", { fade: 0.3 }); }, [phase]);

  useEffect(() => {
    if (!root.current) return;
    scene.traverse((o) => { if ((o as THREE.Mesh).isMesh) o.castShadow = true; });
    const anim = createAnimator(root.current, animations, () => (phaseRef.current === "celebrating" ? "Celebrate" : "Idle"));
    animator.current = anim;
    // Follow the rules engine's view events (fired from its own frame loop).
    const off = core.onView((type) => {
      if (type === "jump") anim.play("Anticipate", { once: true, fade: 0.06 }); // immediate response to the correct key
      else if (type === "land") anim.play("Land", { once: true, fade: 0.08 });
      else if (type === "miss") anim.play("Oops", { once: true, fade: 0.12 });
      else if ((type === "start" || type === "home") && phaseRef.current !== "celebrating") anim.play("Idle", { fade: 0.2 });
    });
    return () => { off(); anim.dispose(); animator.current = null; };
  }, [core, scene, animations]);

  useFrame((_, dt) => {
    const g = root.current, anim = animator.current;
    if (!g) return;
    anim?.update(dt);
    const steps = visualSteps(core, phaseRef.current);
    const from = standPos(steps), to = standPos(steps + 1);
    let pos = from, height = 0;
    if (core.jumping) {
      const p = core.jumpProgress();
      if (p > 0.16 && anim?.current() === "Anticipate") anim.play("Air", { fade: 0.08 });
      const u = calm ? p : smooth((p - 0.16) / 0.8);
      height = calm ? 0 : Math.sin(Math.min(1, Math.max(0, (p - 0.16) / 0.8)) * Math.PI) * 1.1;
      pos = from.clone().lerp(to, u).add(new THREE.Vector3(0, height, 0));
    }
    g.position.copy(pos);
    // Face the destination (smoothly), and turn toward the camera while celebrating.
    const look = phaseRef.current === "celebrating" ? Math.PI * 0.18 : Math.atan2(to.x - from.x, to.z - from.z);
    let d = look - yaw.current;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    yaw.current += d * Math.min(1, dt * (calm ? 30 : 9));
    g.rotation.y = yaw.current;
    if (shadow.current) {
      const ground = core.jumping && core.jumpProgress() > 0.5 ? to : from;
      shadow.current.position.set(pos.x, ground.y + 0.012, pos.z);
      const s = 0.62 / (1 + height * 0.6);
      shadow.current.scale.set(s, s, s);
    }
    if (focus.current) focus.current.copy(pos);
  });
  return (
    <>
      <group ref={root}><primitive object={scene} dispose={null} /></group>
      <mesh ref={shadow} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={shadowTex} transparent depthWrite={false} />
      </mesh>
    </>
  );
}

// The destination marker: a warm ring that glows only while input is accepted.
function Beacon({ core, phase, inputOpen, calm }: { core: LeaperCore; phase: Phase; inputOpen: boolean; calm: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const m = ref.current;
    if (!m) return;
    const p = islandPos(visualSteps(core, phase) + 1);
    m.position.set(p.x, p.y + 0.03, p.z);
    const mat = m.material as THREE.MeshBasicMaterial;
    const target = phase === "celebrating" || phase === "ready" ? 0 : inputOpen ? 0.9 : 0.25;
    mat.opacity += (target - mat.opacity) * 0.2;
    const pulse = calm || !inputOpen ? 1 : 1 + Math.sin(clock.elapsedTime * 4) * 0.05;
    m.scale.setScalar(pulse);
  });
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} renderOrder={2}>
      <ringGeometry args={[0.38, 0.5, 48]} />
      <meshBasicMaterial color="#ffe08a" transparent opacity={0} depthWrite={false} toneMapped={false} />
    </mesh>
  );
}

// ---- camera ---------------------------------------------------------------------------
const OFFSET = new THREE.Vector3(3.3, 3.1, 6.3);
function CameraRig({ core, phase, calm, focus }: { core: LeaperCore; phase: Phase; calm: boolean; focus: React.RefObject<THREE.Vector3> }) {
  const { camera } = useThree();
  const look = useRef(new THREE.Vector3());
  const ready = useRef(false);
  useFrame((_, dt) => {
    const steps = visualSteps(core, phase);
    // Keep Milo and the destination in frame together; calm mode moves only at landing.
    const anchor = calm && core.jumping ? standPos(steps) : focus.current ?? standPos(steps);
    const goal = anchor.clone().lerp(standPos(steps + 1), 0.42).add(new THREE.Vector3(0, 0.45, 0));
    if (!ready.current || calm) { look.current.copy(goal); ready.current = true; }
    else look.current.lerp(goal, 1 - Math.exp(-dt * 3.2));
    camera.position.copy(look.current).add(OFFSET);
    camera.lookAt(look.current);
  });
  return null;
}

function World(props: SceneProps) {
  const { core, phase, calm, lowEffects, inputOpen } = props;
  const focus = useRef(new THREE.Vector3());
  const steps = visualSteps(core, phase);
  // Re-render on leaps only (state changes come through `phase`/`inputOpen` props).
  const window_ = useMemo(() => Array.from({ length: 6 }, (_, i) => Math.max(0, steps - 1) + i), [steps]);
  return (
    <>
      <Sky />
      <fog attach="fog" args={["#d4e7d2", 13, 52]} />
      <hemisphereLight args={["#fff2d8", "#3b6a45", 1.05]} />
      <SunLight focus={focus} shadows={!lowEffects} />
      <Hills focus={focus} />
      <Canopy steps={steps} />
      {window_.map((n) => <Island key={n} n={n} variant={["a", "b", "c"][n % 3]} />)}
      {window_.slice(0, 5).map((n) => <SideIsland key={`s${n}`} n={n} calm={calm} />)}
      <Beacon core={core} phase={phase} inputOpen={inputOpen} calm={calm} />
      <Milo core={core} phase={phase} calm={calm} focus={focus} />
      {!lowEffects && <Mist steps={steps} calm={calm} />}
      {!lowEffects && !calm && <FocusSparkles focus={focus} celebrating={phase === "celebrating"} />}
      <ForegroundLeaves calm={calm} />
      <CameraRig core={core} phase={phase} calm={calm} focus={focus} />
    </>
  );
}

function FocusSparkles({ focus, celebrating }: { focus: React.RefObject<THREE.Vector3>; celebrating: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => { if (ref.current && focus.current) ref.current.position.copy(focus.current); });
  return (
    <group ref={ref}>
      <Sparkles count={celebrating ? 70 : 22} scale={celebrating ? [2.4, 2.2, 2.4] : [7, 3, 7]} position={[0, celebrating ? 1 : 0.6, 0]} size={celebrating ? 7 : 3} speed={celebrating ? 0.9 : 0.25} color={celebrating ? "#ffe08a" : "#fff6c4"} opacity={celebrating ? 1 : 0.7} />
    </group>
  );
}

export default function Scene(props: SceneProps) {
  const { lowEffects, onLowEffects } = props;
  return (
    <Canvas
      key={lowEffects ? "low" : "full"}
      shadows={lowEffects ? false : "percentage"}
      dpr={lowEffects ? 1 : [1, 1.75]}
      camera={{ fov: 40, near: 0.1, far: 160, position: [4, 4, 8] }}
      gl={{ antialias: !lowEffects, powerPreference: "default" }}
      aria-hidden
    >
      <PerformanceMonitor onDecline={() => { if (!lowEffects) onLowEffects(); }} />
      <Suspense fallback={null}>
        <World {...props} />
      </Suspense>
    </Canvas>
  );
}

for (const url of MODEL_URLS) useGLTF.preload(url);
