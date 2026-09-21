import { useEffect, useRef } from "react";

type Mote = { x: number; y: number; r: number; a: number; vx: number; vy: number };
type Leaf = {
  x: number;
  y: number;
  s: number;
  rot: number;
  spin: number;
  vx: number;
  vy: number;
  sway: number;
  swaySp: number;
  hue: number;
  alpha: number;
};

function paintLeaf(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  rot: number,
  hue: number,
  alpha: number,
) {
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  g.beginPath();
  g.moveTo(0, -s);
  g.quadraticCurveTo(s * 0.78, -s * 0.08, 0, s);
  g.quadraticCurveTo(-s * 0.78, -s * 0.08, 0, -s);
  g.fillStyle = `hsla(${hue}, 32%, 40%, ${alpha})`;
  g.fill();
  g.strokeStyle = `hsla(${hue}, 24%, 30%, ${alpha * 0.6})`;
  g.lineWidth = Math.max(0.7, s * 0.09);
  g.beginPath();
  g.moveTo(0, -s * 0.7);
  g.lineTo(0, s * 0.62);
  g.stroke();
  g.restore();
}

export function Breeze() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const g = ctx;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const speed = reduced ? 0.45 : 1;
    let w = 0;
    let h = 0;
    let dpr = 1;
    let motes: Mote[] = [];
    let leaves: Leaf[] = [];
    let wind = 0.08;
    let gustT = 0;
    let raf = 0;
    let last = performance.now();
    let running = true;

    function seed() {
      const nMote = Math.min(80, Math.max(28, Math.floor((w * h) / 18000)));
      motes = Array.from({ length: nMote }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.2 + 0.4,
        a: Math.random() * 0.2 + 0.08,
        vx: 0.04 + Math.random() * 0.06,
        vy: (Math.random() - 0.5) * 0.02,
      }));
      const nLeaf = Math.min(28, Math.max(14, Math.floor((w * h) / 70000)));
      leaves = Array.from({ length: nLeaf }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        s: 7 + Math.random() * 9,
        rot: Math.random() * Math.PI * 2,
        spin: (Math.random() < 0.5 ? -1 : 1) * (0.0022 + Math.random() * 0.0035),
        vx: 0.055 + Math.random() * 0.08,
        vy: 0.028 + Math.random() * 0.045,
        sway: Math.random() * Math.PI * 2,
        swaySp: 0.0014 + Math.random() * 0.0022,
        hue: 72 + Math.random() * 48,
        alpha: 0.28 + Math.random() * 0.16,
      }));
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }

    function wrap(p: { x: number; y: number }, pad: number) {
      if (p.x > w + pad) p.x = -pad;
      if (p.x < -pad) p.x = w + pad;
      if (p.y > h + pad) p.y = -pad;
      if (p.y < -pad) p.y = h + pad;
    }

    function draw(now: number) {
      if (!running) return;
      const dt = Math.min(48, now - last);
      last = now;
      g.clearRect(0, 0, w, h);

      gustT += dt;
      wind = 0.07 + 0.05 * Math.sin(gustT / 1800) + 0.025 * Math.sin(gustT / 430);

      for (const m of motes) {
        m.x += (m.vx + wind) * dt * speed;
        m.y += m.vy * dt * speed;
        wrap(m, 12);
        g.fillStyle = `rgba(255, 252, 245, ${m.a})`;
        g.beginPath();
        g.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        g.fill();
      }

      for (const leaf of leaves) {
        leaf.sway += leaf.swaySp * dt * speed;
        leaf.x += (leaf.vx + wind * 1.6 + Math.sin(leaf.sway) * 0.09) * dt * speed;
        leaf.y += (leaf.vy + Math.cos(leaf.sway * 0.7) * 0.03) * dt * speed;
        leaf.rot += (leaf.spin + Math.sin(leaf.sway) * 0.0012) * dt * speed;
        wrap(leaf, 28);
        paintLeaf(g, leaf.x, leaf.y, leaf.s, leaf.rot, leaf.hue, leaf.alpha);
      }

      raf = requestAnimationFrame(draw);
    }

    function onVis() {
      if (document.visibilityState === "hidden") {
        running = false;
        cancelAnimationFrame(raf);
        return;
      }
      if (!running) {
        running = true;
        last = performance.now();
        raf = requestAnimationFrame(draw);
      }
    }

    resize();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVis);
    raf = requestAnimationFrame(draw);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className="pointer-events-none fixed inset-0 z-0"
      aria-hidden
    />
  );
}
