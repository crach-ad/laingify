"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";

// Interactive 3D build guide for K'NEX projects. Each step adds rods to the
// model; connectors appear automatically wherever rods meet. The learner taps
// through the steps — newest pieces pulse — then spins the finished build.
// Rod colors follow K'NEX sizing (green shortest → gray longest), so the 3D
// guide doubles as the parts list for the real kit.
//
// Geometry is authored in seed content as plain coordinates: each step lists
// rods as [[x,y,z], [x,y,z]] pairs on a unit grid (y is up, ground at y=0).
// A unit-length rod renders blue; diagonals of unit squares render yellow.

export type KnexStep = {
  text: string;
  rods: [number[], number[]][];
};

// Rod size classes, by length in grid units.
const ROD_CLASSES: { max: number; name: string; color: number }[] = [
  { max: 0.6, name: "green", color: 0x4ade80 },
  { max: 0.93, name: "white", color: 0xf1f5f9 },
  { max: 1.2, name: "blue", color: 0x60a5fa },
  { max: 1.75, name: "yellow", color: 0xfacc15 },
  { max: 2.3, name: "red", color: 0xf87171 },
  { max: Infinity, name: "gray", color: 0x9ca3af },
];
const rodClass = (len: number) => ROD_CLASSES.find((c) => len <= c.max)!;

const CHIP_COLORS: Record<string, string> = {
  green: "#4ade80", white: "#f1f5f9", blue: "#60a5fa",
  yellow: "#facc15", red: "#f87171", gray: "#9ca3af",
};

type SceneApi = {
  setBuildIdx: (idx: number) => void;
  dispose: () => void;
};

export default function KnexViewer({ steps, text }: { steps: KnexStep[]; text?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<SceneApi | null>(null);
  const [ready, setReady] = useState(false);
  const [buildIdx, setBuildIdx] = useState(0);

  const built = buildIdx >= steps.length;

  // Parts list for everything currently on screen (K'NEX-manual style).
  const partCounts = useMemo(() => {
    const counts = new Map<string, number>();
    const joints = new Set<string>();
    for (let i = 0; i < buildIdx; i++) {
      for (const [a, b] of steps[i].rods) {
        const len = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
        const name = rodClass(len).name;
        counts.set(name, (counts.get(name) ?? 0) + 1);
        joints.add(a.join(","));
        joints.add(b.join(","));
      }
    }
    return { rods: [...counts.entries()], connectors: joints.size };
  }, [steps, buildIdx]);

  useEffect(() => {
    let disposed = false;
    (async () => {
      const THREE = await import("three");
      const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls.js");
      const host = hostRef.current;
      if (disposed || !host) return;

      const width = host.clientWidth || 520;
      const height = 340;
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      host.replaceChildren(renderer.domElement);

      scene.add(new THREE.HemisphereLight(0xffffff, 0x33363f, 1.5));
      const key = new THREE.DirectionalLight(0xffffff, 1.4);
      key.position.set(3, 6, 4);
      scene.add(key);

      // Bounds over the FULL model so the camera never jumps between steps.
      const bounds = new THREE.Box3();
      for (const s of steps) for (const [a, b] of s.rods) {
        bounds.expandByPoint(new THREE.Vector3(...a));
        bounds.expandByPoint(new THREE.Vector3(...b));
      }
      const center = bounds.getCenter(new THREE.Vector3());
      const radius = Math.max(bounds.getSize(new THREE.Vector3()).length() / 2, 1);

      const grid = new THREE.GridHelper(Math.ceil(radius * 4), Math.ceil(radius * 4), 0x2e323b, 0x23262d);
      grid.position.y = 0;
      scene.add(grid);

      // Build every rod + connector up front; steps just toggle visibility.
      const rodGeo = new THREE.CylinderGeometry(0.05, 0.05, 1, 10);
      const jointGeo = new THREE.SphereGeometry(0.11, 14, 10);
      const jointMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.5 });
      const up = new THREE.Vector3(0, 1, 0);

      const rodMeshes: { mesh: InstanceType<typeof THREE.Mesh>; step: number; mat: InstanceType<typeof THREE.MeshStandardMaterial> }[] = [];
      const jointMeshes = new Map<string, { mesh: InstanceType<typeof THREE.Mesh>; firstStep: number }>();

      steps.forEach((s, stepIdx) => {
        for (const [a, b] of s.rods) {
          const va = new THREE.Vector3(...a);
          const vb = new THREE.Vector3(...b);
          const len = va.distanceTo(vb);
          const mat = new THREE.MeshStandardMaterial({
            color: rodClass(len).color,
            roughness: 0.45,
            metalness: 0.05,
            emissive: 0x84cc16,
            emissiveIntensity: 0,
          });
          const mesh = new THREE.Mesh(rodGeo, mat);
          // Shorten slightly so rods visually plug INTO the connectors.
          mesh.scale.y = Math.max(len - 0.14, 0.1);
          mesh.position.copy(va).add(vb).multiplyScalar(0.5);
          mesh.quaternion.setFromUnitVectors(up, vb.clone().sub(va).normalize());
          mesh.visible = false;
          scene.add(mesh);
          rodMeshes.push({ mesh, step: stepIdx, mat });
          for (const p of [a, b]) {
            const key2 = p.join(",");
            if (!jointMeshes.has(key2)) {
              const jm = new THREE.Mesh(jointGeo, jointMat);
              jm.position.set(p[0], p[1], p[2]);
              jm.visible = false;
              scene.add(jm);
              jointMeshes.set(key2, { mesh: jm, firstStep: stepIdx });
            }
          }
        }
      });

      // Flat table-drawings (cat, fox, butterfly…) read best from overhead,
      // like a build manual; 3D structures get the classic three-quarter view.
      const isFlat = bounds.getSize(new THREE.Vector3()).y < 0.5;
      if (isFlat) {
        camera.position.set(center.x + radius * 0.5, center.y + radius * 2.2, center.z + radius * 1.0);
      } else {
        camera.position.set(center.x + radius * 1.7, center.y + radius * 1.2, center.z + radius * 1.7);
      }
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.target.copy(center);
      controls.enableDamping = true;
      controls.autoRotate = true;
      controls.autoRotateSpeed = 1.6;
      controls.maxDistance = radius * 6;
      controls.minDistance = radius * 0.8;

      let currentIdx = 0;
      let highlightStep = -1;
      const applyVisibility = () => {
        for (const r of rodMeshes) r.mesh.visible = r.step < currentIdx;
        for (const j of jointMeshes.values()) j.mesh.visible = j.firstStep < currentIdx;
      };

      let frame = 0;
      const animate = (t: number) => {
        frame = requestAnimationFrame(animate);
        for (const r of rodMeshes) {
          r.mat.emissiveIntensity = r.step === highlightStep ? 0.3 + 0.25 * Math.sin(t / 160) : 0;
        }
        controls.update();
        renderer.render(scene, camera);
      };
      frame = requestAnimationFrame(animate);

      apiRef.current = {
        setBuildIdx: (idx: number) => {
          currentIdx = idx;
          highlightStep = idx - 1;
          applyVisibility();
        },
        dispose: () => {
          cancelAnimationFrame(frame);
          controls.dispose();
          renderer.dispose();
          rodGeo.dispose();
          jointGeo.dispose();
          for (const r of rodMeshes) r.mat.dispose();
          jointMat.dispose();
        },
      };
      setReady(true);
    })();
    return () => {
      disposed = true;
      apiRef.current?.dispose();
      apiRef.current = null;
    };
    // Steps come from module content JSON — stable for the life of the block.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    apiRef.current?.setBuildIdx(buildIdx);
  }, [buildIdx, ready]);

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-xl border border-[var(--border-soft)] p-3" style={{ background: "var(--tile)" }}>
        <div ref={hostRef} className="h-[340px] w-full overflow-hidden rounded-lg" title="Drag to spin · scroll to zoom">
          <div className="flex h-full items-center justify-center">
            <span className="muted text-sm">Loading 3D builder…</span>
          </div>
        </div>

        {/* Parts on the table so far — the shopping list for the real kit */}
        {buildIdx > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="mono-label !text-[10px]">PARTS SO FAR</span>
            {partCounts.rods.map(([name, n]) => (
              <span
                key={name}
                className="flex items-center gap-1.5 rounded-full border border-[var(--border-soft)] px-2 py-0.5 text-[11px]"
                style={{ background: "var(--card)", color: "var(--body)" }}
              >
                <span className="inline-block h-2 w-4 rounded-full" style={{ background: CHIP_COLORS[name] }} />
                {n} {name}
              </span>
            ))}
            <span className="rounded-full border border-[var(--border-soft)] px-2 py-0.5 text-[11px]" style={{ background: "var(--card)", color: "var(--body)" }}>
              ⚪ {partCounts.connectors} connectors
            </span>
          </div>
        )}

        {/* Build steps — tap each one to add its pieces */}
        <div className="mt-2 flex flex-col gap-1.5">
          {steps.map((s, i) => {
            const done = i < buildIdx;
            const current = i === buildIdx;
            return (
              <motion.button
                key={i}
                type="button"
                disabled={!current && !done}
                onClick={() => setBuildIdx(done ? i : i + 1)}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: current || done ? 1 : 0.45, x: 0 }}
                transition={{ delay: i * 0.04, duration: 0.2 }}
                className="flex items-start gap-3 rounded-xl border p-2.5 text-left transition-colors"
                style={{
                  borderColor: done ? "var(--accent-border)" : current ? "var(--info-border)" : "var(--border-soft)",
                  background: done ? "var(--accent-soft)" : "var(--card)",
                  cursor: current || done ? "pointer" : "default",
                }}
              >
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12px] font-bold"
                  style={{
                    background: done ? "var(--accent)" : "var(--tile)",
                    color: done ? "var(--bg)" : "var(--faint)",
                    border: done ? "none" : "1px solid var(--border)",
                    fontFamily: "var(--font-grotesk)",
                  }}
                >
                  {done ? "✓" : i + 1}
                </span>
                <span className="min-w-0 pt-0.5 text-[13px] leading-relaxed" style={{ color: done ? "var(--faint)" : "var(--body)" }}>
                  {s.text}
                  {current && (
                    <span className="ml-2 font-semibold" style={{ color: "var(--info-text)" }}>
                      ← tap to add it
                    </span>
                  )}
                </span>
              </motion.button>
            );
          })}
          {built && (
            <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="text-sm font-semibold" style={{ color: "var(--accent)" }}>
              🎉 Built! Drag to spin it — then make the real one.
            </motion.p>
          )}
        </div>

        {buildIdx > 0 && (
          <div className="mt-2 flex justify-center gap-2">
            <button
              type="button"
              onClick={() => setBuildIdx((i) => Math.max(0, i - 1))}
              className="btn-ghost h-10 px-4 text-sm"
            >
              ↶ Undo step
            </button>
            {buildIdx > 1 && (
              <button type="button" onClick={() => setBuildIdx(0)} className="btn-ghost h-10 px-4 text-sm">
                ↺ Rebuild
              </button>
            )}
          </div>
        )}
      </div>
      {text && <p className="muted text-[13px]">{text}</p>}
    </div>
  );
}
