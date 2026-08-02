"use client";

import { useEffect, useRef } from "react";

// Interactive 3D viewer for a learner's exported STL file (data URL or path).
// Auto-rotates; drag to orbit, scroll to zoom. Used in portfolios so the
// actual designed object — not just a screenshot — lives in the showcase.
export default function StlViewer({ url }: { url: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let disposed = false;
    let frame = 0;
    let cleanup: (() => void) | null = null;

    (async () => {
      const THREE = await import("three");
      const { STLLoader } = await import("three/examples/jsm/loaders/STLLoader.js");
      const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls.js");
      const host = ref.current;
      if (disposed || !host) return;

      const width = host.clientWidth || 480;
      const height = 320;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x14161b);
      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 5000);
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      host.replaceChildren(renderer.domElement);

      scene.add(new THREE.HemisphereLight(0xffffff, 0x33363f, 1.4));
      const key = new THREE.DirectionalLight(0xffffff, 1.6);
      key.position.set(1, 2, 3);
      scene.add(key);

      let geometry;
      try {
        geometry = await new STLLoader().loadAsync(url);
      } catch {
        host.textContent = "Couldn't load the 3D model.";
        return;
      }
      if (disposed) return;
      geometry.computeVertexNormals();
      geometry.center();
      geometry.computeBoundingBox();
      const size = geometry.boundingBox
        ? geometry.boundingBox.getSize(new THREE.Vector3()).length()
        : 100;

      const mesh = new THREE.Mesh(
        geometry,
        new THREE.MeshStandardMaterial({ color: 0xb6f24d, roughness: 0.45, metalness: 0.1 }),
      );
      mesh.rotation.x = -Math.PI / 2; // STL is usually Z-up; three is Y-up
      scene.add(mesh);

      camera.position.set(size * 0.7, size * 0.5, size * 0.7);
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.autoRotate = true;
      controls.autoRotateSpeed = 2.5;

      const animate = () => {
        frame = requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      };
      animate();

      cleanup = () => {
        cancelAnimationFrame(frame);
        controls.dispose();
        renderer.dispose();
        geometry.dispose();
      };
    })();

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [url]);

  return (
    <div
      ref={ref}
      className="h-80 w-full max-w-xl overflow-hidden rounded-xl border border-[var(--border-soft)]"
      title="Drag to spin · scroll to zoom"
    />
  );
}
