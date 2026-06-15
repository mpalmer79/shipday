/**
 * The fuse engine: a self-contained Canvas 2D particle system that drives the
 * Ghost Protocol cold open. It owns one full-bleed canvas and, given an authored
 * duration, ignites a glowing spark that travels a bending path across the
 * screen, throwing realistic orange-and-white sparks and casting a traveling
 * ambient orange light onto the dark room behind it.
 *
 * It is intentionally framework-free (no React, no assets): the orchestrator
 * component mounts it, calls start(), and listens on the callbacks. Like the
 * hero WebGL scene it enforces every performance rule itself — capped device
 * pixel ratio, a fixed particle ceiling with a reused pool, a single
 * requestAnimationFrame loop that stops the instant the run completes, and full
 * teardown on dispose(). Canvas 2D is chosen over WebGL/Three here because the
 * effect is a 2D spark trail: it is lighter, has no GL context to lose, and the
 * prompt allows Canvas where it is more performant.
 */

export type FuseEngineOptions = {
  /** Total travel time of the spark, in milliseconds. */
  durationMs: number;
  /** Reports normalized travel progress (0..1) every frame, for syncing DOM. */
  onProgress?: (t: number) => void;
  /** Fires once when the spark reaches the detonation point. */
  onComplete?: () => void;
};

export type FuseEngine = {
  start: () => void;
  stop: () => void;
  dispose: () => void;
};

// Performance ceilings. The pixel ratio cap keeps fill cost bounded on retina
// screens; the particle cap bounds per-frame work regardless of spawn pressure.
const MAX_DPR = 1.75;
const MAX_PARTICLES = 560;

// The fuse path as normalized waypoints (0..1 of the viewport). It enters from
// off the left edge, bends and switchbacks dynamically across the frame, then
// converges on the centre where the charge detonates and the screen whites out.
const WAYPOINTS: ReadonlyArray<readonly [number, number]> = [
  [-0.12, 0.74],
  [0.12, 0.44],
  [0.3, 0.68],
  [0.47, 0.33],
  [0.63, 0.62],
  [0.79, 0.3],
  [0.62, 0.52],
  [0.5, 0.47],
];

// Resolution of the sampled spline. Higher means a smoother head path and trail.
const SPLINE_STEPS = 90;

const VOID_RGB = "7, 9, 13";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  hot: boolean;
  active: boolean;
};

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

// Smooth acceleration into the run and a deceleration as the spark settles on
// the detonation point, so the travel reads as a deliberate sweep, not linear.
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function catmull(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    0.5 *
    (2 * p1 +
      (-p0 + p2) * t +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
      (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
  );
}

/**
 * A soft round dot sprite generated once at runtime, drawn additively for every
 * particle. Two tints — white-hot and ember orange — let particles cool from
 * the spark to ash without per-particle gradient allocation in the loop.
 */
function makeDot(inner: string, mid: string): HTMLCanvasElement {
  const size = 32;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  g.addColorStop(0, inner);
  g.addColorStop(0.4, mid);
  g.addColorStop(1, "rgba(255,120,30,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return c;
}

export function createFuseEngine(
  canvas: HTMLCanvasElement,
  options: FuseEngineOptions
): FuseEngine {
  const { durationMs, onProgress, onComplete } = options;
  const ctx = canvas.getContext("2d", { alpha: true })!;

  // The hot spark dot tops out at the cool off-white highlight ceiling
  // (235 238 244) — no pure white anywhere — over a warm ember falloff.
  const dotWhite = makeDot("rgba(235,238,244,1)", "rgba(255,210,150,0.7)");
  const dotEmber = makeDot("rgba(255,200,120,1)", "rgba(255,120,40,0.65)");

  // Build the smooth spline through the waypoints once, in normalized space.
  // Multiplying by the live canvas size each frame makes resize free.
  const path: Array<[number, number]> = [];
  const ext = [WAYPOINTS[0], ...WAYPOINTS, WAYPOINTS[WAYPOINTS.length - 1]];
  for (let i = 0; i < WAYPOINTS.length - 1; i += 1) {
    const [a, b, c, d] = [ext[i], ext[i + 1], ext[i + 2], ext[i + 3]];
    for (let s = 0; s < SPLINE_STEPS; s += 1) {
      const t = s / SPLINE_STEPS;
      path.push([catmull(a[0], b[0], c[0], d[0], t), catmull(a[1], b[1], c[1], d[1], t)]);
    }
  }
  path.push([...WAYPOINTS[WAYPOINTS.length - 1]] as [number, number]);
  const lastIndex = path.length - 1;

  // Reused particle pool. nextSlot scans for a free slot so a spike of spawns
  // never grows the array past the ceiling.
  const pool: Particle[] = Array.from({ length: MAX_PARTICLES }, () => ({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    life: 0,
    maxLife: 1,
    size: 1,
    hot: true,
    active: false,
  }));
  let nextSlot = 0;

  let cssW = 1;
  let cssH = 1;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    cssW = canvas.clientWidth || window.innerWidth;
    cssH = canvas.clientHeight || window.innerHeight;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function headAt(p: number): { x: number; y: number; idx: number } {
    const idx = clamp(Math.round(p * lastIndex), 0, lastIndex);
    return { x: path[idx][0] * cssW, y: path[idx][1] * cssH, idx };
  }

  function spawn(x: number, y: number, dirX: number, dirY: number, count: number) {
    for (let n = 0; n < count; n += 1) {
      const slot = pool[nextSlot];
      nextSlot = (nextSlot + 1) % MAX_PARTICLES;
      const spread = (Math.random() - 0.5) * 2.4;
      // Cast mostly backward along travel with a wide perpendicular fan.
      const px = -dirX + dirY * spread;
      const py = -dirY - dirX * spread;
      const speed = 40 + Math.random() * 220;
      slot.x = x;
      slot.y = y;
      slot.vx = px * speed + (Math.random() - 0.5) * 60;
      slot.vy = py * speed - Math.random() * 90; // slight upward kick
      slot.maxLife = 0.35 + Math.random() * 0.55;
      slot.life = slot.maxLife;
      slot.size = 1.5 + Math.random() * 4.5;
      slot.hot = Math.random() < 0.55;
      slot.active = true;
    }
  }

  let raf = 0;
  let startTs = 0;
  let lastTs = 0;
  let done = false;

  function frame(now: number) {
    if (!startTs) {
      startTs = now;
      lastTs = now;
    }
    const dt = Math.min((now - lastTs) / 1000, 0.05);
    lastTs = now;

    const rawT = clamp((now - startTs) / durationMs, 0, 1);
    const t = easeInOutCubic(rawT);

    // Persistence clear: a translucent void wash each frame leaves a glowing,
    // charring trail behind the spark instead of a hard wipe.
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = `rgba(${VOID_RGB}, 0.26)`;
    ctx.fillRect(0, 0, cssW, cssH);

    ctx.globalCompositeOperation = "lighter";

    const head = headAt(t);
    const prev = path[clamp(head.idx - 2, 0, lastIndex)];
    let dx = head.x - prev[0] * cssW;
    let dy = head.y - prev[1] * cssH;
    const mag = Math.hypot(dx, dy) || 1;
    dx /= mag;
    dy /= mag;

    // Traveling ambient light: a large warm radial cast that lights the dark
    // room around the moving spark and pulses with a faint flicker.
    const flicker = 0.82 + Math.random() * 0.18;
    const glowR = 240 * flicker;
    const amb = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, glowR);
    amb.addColorStop(0, "rgba(255,150,60,0.42)");
    amb.addColorStop(0.45, "rgba(255,110,35,0.16)");
    amb.addColorStop(1, "rgba(255,90,20,0)");
    ctx.fillStyle = amb;
    ctx.fillRect(head.x - glowR, head.y - glowR, glowR * 2, glowR * 2);

    // The bright bending trail just behind the head, tapering and dimming back.
    const tailLen = 46;
    ctx.lineCap = "round";
    for (let k = 0; k < tailLen; k += 1) {
      const i = head.idx - k;
      if (i < 1) break;
      const a = path[i];
      const b = path[i - 1];
      const fade = 1 - k / tailLen;
      ctx.strokeStyle = `rgba(255,${160 + Math.round(70 * fade)},${60},${0.5 * fade})`;
      ctx.lineWidth = 1 + 5 * fade;
      ctx.beginPath();
      ctx.moveTo(a[0] * cssW, a[1] * cssH);
      ctx.lineTo(b[0] * cssW, b[1] * cssH);
      ctx.stroke();
    }

    // Spawn pressure: a hot burst at ignition, a steady stream while traveling,
    // and a heavy shower as the charge reaches detonation.
    const ignition = rawT < 0.06 ? 14 : 0;
    const finale = rawT > 0.9 ? 18 : 0;
    spawn(head.x, head.y, dx, dy, 5 + ignition + finale);

    // Update and draw the pool.
    for (let i = 0; i < MAX_PARTICLES; i += 1) {
      const part = pool[i];
      if (!part.active) continue;
      part.life -= dt;
      if (part.life <= 0) {
        part.active = false;
        continue;
      }
      part.vx *= 0.9;
      part.vy = part.vy * 0.9 + 520 * dt; // drag + gravity
      part.x += part.vx * dt;
      part.y += part.vy * dt;
      const kf = part.life / part.maxLife;
      const s = part.size * (0.45 + 0.55 * kf);
      const sprite = part.hot && kf > 0.45 ? dotWhite : dotEmber;
      ctx.globalAlpha = kf;
      ctx.drawImage(sprite, part.x - s, part.y - s, s * 2, s * 2);
    }
    ctx.globalAlpha = 1;

    // The hot spark core at the head, topping out at the off-white highlight
    // ceiling (235 238 244) rather than pure white.
    const core = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, 16);
    core.addColorStop(0, "rgba(235,238,244,1)");
    core.addColorStop(0.5, "rgba(255,220,150,0.8)");
    core.addColorStop(1, "rgba(255,140,40,0)");
    ctx.fillStyle = core;
    ctx.fillRect(head.x - 16, head.y - 16, 32, 32);

    onProgress?.(rawT);

    if (rawT >= 1 && !done) {
      done = true;
      onComplete?.();
    }
    raf = requestAnimationFrame(frame);
  }

  function onResize() {
    resize();
  }

  return {
    start() {
      resize();
      window.addEventListener("resize", onResize, { passive: true });
      raf = requestAnimationFrame(frame);
    },
    stop() {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    },
    dispose() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      window.removeEventListener("resize", onResize);
    },
  };
}
