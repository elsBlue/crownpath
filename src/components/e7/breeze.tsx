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
    let w = 0;
    let h = 0;
    let dpr = 1;
    let pace = 1;
    let phone = false;
    let motes: Mote[] = [];
    let leaves: Leaf[] = [];
    let wind = 0.04;
    let gustT = 0;
    let raf = 0;
    let last = performance.now();
    let running = true;

    function isPhone() {
      return window.matchMedia("(max-width: 768px), (pointer: coarse)").matches;
    }

    function seed() {
      const phone = isPhone();
      const nMote = Math.min(phone ? 48 : 80, Math.max(22, Math.floor((w * h) / (phone ? 24000 : 18000))));
      motes = Array.from({ length: nMote }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.2 + 0.4,
        a: Math.random() * 0.2 + 0.08,
        vx: (phone ? 0.018 : 0.032) + Math.random() * (phone ? 0.03 : 0.05),
        vy: (Math.random() - 0.5) * (phone ? 0.012 : 0.02),
      }));
      const nLeaf = Math.min(phone ? 16 : 28, Math.max(phone ? 8 : 14, Math.floor((w * h) / (phone ? 110000 : 70000))));
      leaves = Array.from({ length: nLeaf }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        s: (phone ? 6 : 7) + Math.random() * (phone ? 7 : 9),
        rot: Math.random() * Math.PI * 2,
        spin: (Math.random() < 0.5 ? -1 : 1) * ((phone ? 0.0012 : 0.002) + Math.random() * (phone ? 0.002 : 0.003)),
        vx: (phone ? 0.022 : 0.04) + Math.random() * (phone ? 0.03 : 0.055),
        vy: (phone ? 0.012 : 0.022) + Math.random() * (phone ? 0.018 : 0.032),
        sway: Math.random() * Math.PI * 2,
        swaySp: (phone ? 0.0008 : 0.0012) + Math.random() * (phone ? 0.0012 : 0.0018),
        hue: 72 + Math.random() * 48,
        alpha: 0.26 + Math.random() * 0.14,
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
      phone = isPhone();
      pace = reduced ? 0.38 : phone ? 0.48 : 0.82;
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
      wind =
        (phone ? 0.028 : 0.048) +
        (phone ? 0.018 : 0.032) * Math.sin(gustT / (phone ? 2800 : 2000)) +
        (phone ? 0.01 : 0.018) * Math.sin(gustT / (phone ? 720 : 520));

      for (const m of motes) {
        m.x += (m.vx + wind) * dt * pace;
        m.y += m.vy * dt * pace;
        wrap(m, 12);
        g.fillStyle = `rgba(255, 252, 245, ${m.a})`;
        g.beginPath();
        g.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        g.fill();
      }

      for (const leaf of leaves) {
        leaf.sway += leaf.swaySp * dt * pace;
        leaf.x += (leaf.vx + wind * (phone ? 1.15 : 1.35) + Math.sin(leaf.sway) * 0.06) * dt * pace;
        leaf.y += (leaf.vy + Math.cos(leaf.sway * 0.7) * 0.02) * dt * pace;
        leaf.rot += (leaf.spin + Math.sin(leaf.sway) * 0.0008) * dt * pace;
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
