import { useEffect, useRef } from "react";

type Star = { x: number; y: number; r: number; a: number; tw: number; sp: number };
type Meteor = { x: number; y: number; vx: number; vy: number; life: number; max: number };

function nextGap() {
  return 2800 + Math.random() * 4200;
}

export function Starfield() {
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
    let stars: Star[] = [];
    let meteor: Meteor | null = null;
    let nextMeteor = 900 + Math.random() * 1600;
    let raf = 0;
    let last = performance.now();
    let running = true;

    function seed() {
      const n = Math.min(180, Math.max(56, Math.floor((w * h) / 11000)));
      stars = Array.from({ length: n }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.3 + 0.28,
        a: Math.random() * 0.4 + 0.16,
        tw: Math.random() * Math.PI * 2,
        sp: 0.45 + Math.random() * 1.25,
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

    function spawn() {
      meteor = {
        x: Math.random() * w * 0.78,
        y: Math.random() * h * 0.42,
        vx: 0.48 + Math.random() * 0.32,
        vy: 0.24 + Math.random() * 0.18,
        life: 0,
        max: 520 + Math.random() * 380,
      };
      nextMeteor = nextGap();
    }

    function draw(now: number) {
      if (!running) return;
      const dt = Math.min(48, now - last);
      last = now;
      g.clearRect(0, 0, w, h);

      for (const s of stars) {
        s.tw += (s.sp * dt * speed) / 1000;
        const a = s.a * (0.58 + 0.42 * Math.sin(s.tw));
        g.fillStyle = `rgba(236, 238, 242, ${a})`;
        g.beginPath();
        g.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        g.fill();
      }

      nextMeteor -= dt * speed;
      if (!meteor && nextMeteor <= 0) spawn();

      if (meteor) {
        meteor.life += dt * speed;
        meteor.x += meteor.vx * dt * speed;
        meteor.y += meteor.vy * dt * speed;
        const p = meteor.life / meteor.max;
        const alpha = p < 0.1 ? p / 0.1 : Math.max(0, 1 - (p - 0.1) / 0.9);
        const len = 92;
        const gx = meteor.x - meteor.vx * len;
        const gy = meteor.y - meteor.vy * len;
        const grad = g.createLinearGradient(gx, gy, meteor.x, meteor.y);
        grad.addColorStop(0, "rgba(230,232,236,0)");
        grad.addColorStop(1, `rgba(252,253,255,${0.86 * alpha})`);
        g.strokeStyle = grad;
        g.lineWidth = 1.45;
        g.beginPath();
        g.moveTo(gx, gy);
        g.lineTo(meteor.x, meteor.y);
        g.stroke();
        g.fillStyle = `rgba(255,255,255,${0.92 * alpha})`;
        g.beginPath();
        g.arc(meteor.x, meteor.y, 1.55, 0, Math.PI * 2);
        g.fill();
        if (meteor.life > meteor.max || meteor.x > w + 50 || meteor.y > h + 50) {
          meteor = null;
        }
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
