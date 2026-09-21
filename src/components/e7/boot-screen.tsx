import { useEffect, useRef, useState } from "react";
import { Brand } from "./brand";

const SHADE = { poster: "/intro/shade.jpg?v=2", src: "/intro/shade.mp4?v=2" };
const BREEZE = { poster: "/intro/breeze.jpg?v=2", src: "/intro/breeze.mp4?v=2" };

const IN_MS = 1800;
const HOLD_MS = 4200;
const OUT_MS = 2400;
const BRIEF_HOLD_MS = 700;

type Phase = "wait" | "in" | "hold" | "out";

function isLightDom() {
  return typeof document !== "undefined" && document.documentElement.classList.contains("light");
}

export function BootScreen({
  label = "Loading data…",
  canLeave = false,
  brief = false,
  onFinished,
}: {
  label?: string;
  canLeave?: boolean;
  brief?: boolean;
  onFinished?: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const finished = useRef(false);
  const [clip, setClip] = useState(() => (isLightDom() ? BREEZE : SHADE));
  const [phase, setPhase] = useState<Phase>("wait");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setClip(isLightDom() ? BREEZE : SHADE);
  }, []);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    let alive = true;
    el.muted = true;
    el.playsInline = true;
    el.setAttribute("playsinline", "");
    el.setAttribute("webkit-playsinline", "");

    const mark = () => {
      if (alive) setReady(true);
    };
    el.addEventListener("playing", mark);
    el.addEventListener("canplay", mark);
    const fallback = window.setTimeout(mark, 900);
    void el.play().catch(mark);

    return () => {
      alive = false;
      window.clearTimeout(fallback);
      el.removeEventListener("playing", mark);
      el.removeEventListener("canplay", mark);
    };
  }, [clip.src]);

  useEffect(() => {
    if (!ready || phase !== "wait") return;
    const id = requestAnimationFrame(() => setPhase("in"));
    return () => cancelAnimationFrame(id);
  }, [ready, phase]);

  useEffect(() => {
    if (phase !== "in") return;
    const t = window.setTimeout(() => setPhase("hold"), IN_MS);
    return () => window.clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== "hold") return;
    const minHold = brief ? BRIEF_HOLD_MS : HOLD_MS;
    const started = Date.now();
    const tick = () => {
      if (Date.now() - started >= minHold && canLeave) setPhase("out");
    };
    const id = window.setInterval(tick, 100);
    tick();
    return () => window.clearInterval(id);
  }, [phase, canLeave, brief]);

  useEffect(() => {
    if (phase !== "out") return;
    const t = window.setTimeout(() => {
      if (finished.current) return;
      finished.current = true;
      onFinished?.();
    }, OUT_MS);
    return () => window.clearTimeout(t);
  }, [phase, onFinished]);

  return (
    <div className="relative grid h-full min-h-full place-items-center overflow-hidden bg-background px-6 text-foreground">
      <div className="pointer-events-none absolute inset-0 md:grid md:place-items-center">
        <div
          className="boot-shade absolute inset-0 overflow-hidden md:relative md:inset-auto md:rounded-full"
          data-phase={phase}
          aria-hidden
        >
          <video
            ref={videoRef}
            className="boot-shade-media"
            src={clip.src}
            autoPlay
            muted
            playsInline
            loop
            preload="auto"
            onError={() => {
              if (clip.src !== SHADE.src) setClip(SHADE);
              else setReady(true);
            }}
          />
          <div className="boot-shade-veil absolute inset-0" />
        </div>
      </div>
      <div className="relative z-10 flex flex-col items-center gap-3">
        <Brand size="md" align="center" />
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
