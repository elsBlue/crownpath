import { useEffect, useRef, useState } from "react";
import { Brand } from "./brand";

const SHADE = { poster: "/intro/shade.jpg?v=2", src: "/intro/shade.mp4?v=2" };
const BREEZE = { poster: "/intro/breeze.jpg?v=2", src: "/intro/breeze.mp4?v=2" };

const IN_MS = 2000;
const HOLD_MS = 5200;
const OUT_MS = 2800;

type Phase = "wait" | "in" | "hold" | "out";

function isLightDom() {
  return typeof document !== "undefined" && document.documentElement.classList.contains("light");
}

export function BootScreen({
  label = "Loading data…",
  canLeave = false,
  onFinished,
}: {
  label?: string;
  canLeave?: boolean;
  brief?: boolean;
  onFinished?: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const started = useRef(false);
  const finished = useRef(false);
  const [clip, setClip] = useState(() => (isLightDom() ? BREEZE : SHADE));
  const [phase, setPhase] = useState<Phase>("wait");

  useEffect(() => {
    setClip(isLightDom() ? BREEZE : SHADE);
  }, []);

  useEffect(() => {
    let id = 0;
    id = requestAnimationFrame(() => {
      id = requestAnimationFrame(() => setPhase("in"));
    });
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || phase === "wait" || started.current) return;
    started.current = true;
    el.muted = true;
    el.defaultMuted = true;
    el.playbackRate = 1;
    el.playsInline = true;
    el.setAttribute("playsinline", "");
    el.setAttribute("webkit-playsinline", "");

    const playFromStart = () => {
      try {
        el.currentTime = 0;
      } catch {
        /* iOS may throw before ready */
      }
      el.playbackRate = 1;
      void el.play().catch(() => {
        /* poster stays; fade still runs */
      });
    };

    if (el.readyState >= 1) playFromStart();
    else el.addEventListener("loadeddata", playFromStart, { once: true });

    return () => el.removeEventListener("loadeddata", playFromStart);
  }, [phase, clip.src]);

  useEffect(() => {
    if (phase !== "in") return;
    const t = window.setTimeout(() => setPhase("hold"), IN_MS);
    return () => window.clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== "hold") return;
    const begun = Date.now();
    const tick = () => {
      if (Date.now() - begun >= HOLD_MS && canLeave) setPhase("out");
    };
    const id = window.setInterval(tick, 100);
    tick();
    return () => window.clearInterval(id);
  }, [phase, canLeave]);

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
            poster={clip.poster}
            muted
            playsInline
            preload="auto"
            onError={() => {
              if (clip.src !== SHADE.src) {
                started.current = false;
                setClip(SHADE);
              }
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
