"use client";

import { useEffect, useRef } from "react";
import {
  AdditiveBlending,
  BufferGeometry,
  CanvasTexture,
  Color,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  LineSegments,
  MathUtils,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Scene,
  WebGLRenderer,
} from "three";

// Cool (accent) and hot (pressure) colours, shared with the app's risk
// temperature language. The scene runs cool and warms under pointer load.
const COOL = new Color(0x5ba8f5);
const HOT = new Color(0xf59e42);

const NODE_COUNT = 520;
const MAX_DPR = 1.5;

/**
 * A round, soft point sprite generated at runtime, so the scene needs no image
 * asset. One small canvas texture, created once.
 */
function makeSprite(): CanvasTexture {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.35, "rgba(255,255,255,0.55)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new CanvasTexture(canvas);
}

/**
 * The WebGL hero: an abstract operations room of systems under load. A drifting
 * lattice of nodes wired into a faint network, lit cool and warming under
 * pointer activity, with slow parallax. Built entirely from geometry in code.
 *
 * Every performance rule is enforced here: the render loop runs only when the
 * canvas is on screen (IntersectionObserver) and the tab is visible
 * (visibilitychange), the device pixel ratio is capped, and all GL resources
 * are disposed on unmount. The scene is decorative and aria-hidden; the caller
 * only mounts it when WebGL is available and motion is permitted.
 */
export function HeroScene() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) {
      return;
    }

    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
    } catch {
      return; // No context; the static poster underneath remains.
    }

    const width = mount.clientWidth || 1;
    const height = mount.clientHeight || 1;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_DPR));
    renderer.setSize(width, height, false);
    renderer.setClearColor(0x000000, 0);
    const canvas = renderer.domElement;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    mount.appendChild(canvas);

    const scene = new Scene();
    const camera = new PerspectiveCamera(55, width / height, 0.1, 100);
    camera.position.z = 16;

    // Build the node lattice inside a flattened volume.
    const positions = new Float32Array(NODE_COUNT * 3);
    const pts: [number, number, number][] = [];
    for (let i = 0; i < NODE_COUNT; i += 1) {
      const x = MathUtils.randFloatSpread(26);
      const y = MathUtils.randFloatSpread(14);
      const z = MathUtils.randFloatSpread(16);
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      pts.push([x, y, z]);
    }

    const nodeGeo = new BufferGeometry();
    nodeGeo.setAttribute("position", new Float32BufferAttribute(positions, 3));
    const sprite = makeSprite();
    const nodeMat = new PointsMaterial({
      size: 0.42,
      map: sprite,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      color: COOL.clone(),
      sizeAttenuation: true,
    });
    const nodes = new Points(nodeGeo, nodeMat);

    // Wire each node to a few near neighbours, capped, for a faint network.
    const segments: number[] = [];
    const MAX_SEGMENTS = 700;
    for (let i = 0; i < NODE_COUNT && segments.length < MAX_SEGMENTS * 6; i += 1) {
      let linked = 0;
      for (let j = i + 1; j < NODE_COUNT && linked < 2; j += 1) {
        const dx = pts[i][0] - pts[j][0];
        const dy = pts[i][1] - pts[j][1];
        const dz = pts[i][2] - pts[j][2];
        if (dx * dx + dy * dy + dz * dz < 7) {
          segments.push(...pts[i], ...pts[j]);
          linked += 1;
        }
      }
    }
    const lineGeo = new BufferGeometry();
    lineGeo.setAttribute("position", new Float32BufferAttribute(segments, 3));
    const lineMat = new LineBasicMaterial({
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
      blending: AdditiveBlending,
      color: COOL.clone(),
    });
    const lines = new LineSegments(lineGeo, lineMat);

    const group = new Group();
    group.add(nodes, lines);
    scene.add(group);

    // Pointer parallax and the cool-to-hot heat under pointer activity.
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    let heat = 0;
    let lastMove = 0;
    function onPointer(e: PointerEvent) {
      const rect = mount!.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      const now = performance.now();
      const dt = Math.max(now - lastMove, 1);
      const speed = Math.hypot(nx - pointer.tx, ny - pointer.ty) / (dt / 1000);
      heat = Math.min(1, heat + Math.min(speed * 0.04, 0.25));
      lastMove = now;
      pointer.tx = nx;
      pointer.ty = ny;
    }
    window.addEventListener("pointermove", onPointer, { passive: true });

    // Lifecycle: run only when visible on screen and the tab is shown.
    let onScreen = false;
    let visible = !document.hidden;
    let raf = 0;
    let last = performance.now();
    const tmpColor = new Color();

    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      heat = Math.max(0, heat - dt * 0.35);
      pointer.x += (pointer.tx - pointer.x) * 0.05;
      pointer.y += (pointer.ty - pointer.y) * 0.05;

      group.rotation.y += dt * 0.05;
      group.rotation.x = pointer.y * 0.18 + Math.sin(now * 0.0002) * 0.04;
      group.rotation.z = pointer.x * 0.05;
      camera.position.x = pointer.x * 1.5;
      camera.position.y = -pointer.y * 1.0;
      camera.lookAt(0, 0, 0);

      tmpColor.copy(COOL).lerp(HOT, heat);
      nodeMat.color.copy(tmpColor);
      lineMat.color.copy(tmpColor);
      nodeMat.opacity = 0.85;

      renderer.render(scene, camera);
    }

    function start() {
      if (onScreen && visible && !raf) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    }
    function stop() {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    }

    const io = new IntersectionObserver(
      (entries) => {
        onScreen = entries.some((e) => e.isIntersecting);
        if (onScreen) start();
        else stop();
      },
      { threshold: 0.01 }
    );
    io.observe(mount);

    function onVisibility() {
      visible = !document.hidden;
      if (visible) start();
      else stop();
    }
    document.addEventListener("visibilitychange", onVisibility);

    const ro = new ResizeObserver(() => {
      const w = mount!.clientWidth || 1;
      const h = mount!.clientHeight || 1;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_DPR));
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    });
    ro.observe(mount);

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onPointer);
      nodeGeo.dispose();
      lineGeo.dispose();
      nodeMat.dispose();
      lineMat.dispose();
      sprite.dispose();
      renderer.dispose();
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
    };
  }, []);

  return <div ref={mountRef} aria-hidden="true" className="absolute inset-0" />;
}

export default HeroScene;
