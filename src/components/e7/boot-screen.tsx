import { useEffect, useRef, useState } from "react";
import { Brand } from "./brand";
import { bootAlreadyPlayed, claimBootPlay, markBootDone } from "@/lib/e7/boot";

const SHADE = { poster: "/intro/shade.jpg?v=2", src: "/intro/shade.mp4?v=2" };
const BREEZE = { poster: "/intro/breeze.jpg?v=2", src: "/intro/breeze.mp4?v=2" };

const IN_MS = 800;
const HOLD_MS = 8000;
const OUT_MS = 4000;

type Phase = "wait" | "in" | "hold" | "out";

function isLightDom() {
  return typeof document !== "undefined" && document.documentElement.classList.contains("light");
}

export function BootScreen({
  label = "Loading data…",
  canLeave = false,
  play = true,
  onFinished,
}: {
  label?: string;
  canLeave?: boolean;
  play?: boolean;
  onFinished?: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const started = useRef(false);
  const finished = useRef(false);
  const [allowed] = useState(() => play && claimBootPlay());
  const [clip] = useState(() => (isLightDom() ? BREEZE : SHADE));
  const [phase, setPhase] = useState<Phase>(allowed ? "wait" : "out");
  const [motion, setMotion] = useState(false);

  useEffect(() => {
    if (!allowed) {
      onFinished?.();
      return;
    }
    const id = requestAnimationFrame(() => setPhase("in"));
    return () => cancelAnimationFrame(id);
  }, [allowed, onFinished]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !allowed || started.current) return;
    started.current = true;
    el.muted = true;
    el.defaultMuted = true;
    el.loop = false;
    el.playbackRate = 1;
    el.playsInline = true;
    el.setAttribute("playsinline", "");
    el.setAttribute("webkit-playsinline", "");

    const start = () => {
      if (!el || el.readyState < 1) return;
      try {
        el.currentTime = 0;
      } catch {
        /* not ready */
      }
      void el.play().then(() => setMotion(true)).catch(() => setMotion(false));
    };

    if (el.readyState >= 2) start();
    else {
      el.addEventListener("canplay", start, { once: true });
      el.addEventListener("loadeddata", start, { once: true });
    }

    return () => {
      el.removeEventListener("canplay", start);
      el.removeEventListener("loadeddata", start);
    };
  }, [allowed, clip.src]);

  useEffect(() => {
    if (!allowed || phase !== "in") return;
    const t = window.setTimeout(() => setPhase("hold"), IN_MS);
    return () => window.clearTimeout(t);
  }, [allowed, phase]);

  useEffect(() => {
    if (!allowed || phase !== "hold") return;
    const begun = Date.now();
    const id = window.setInterval(() => {
      if (Date.now() - begun >= HOLD_MS && canLeave) setPhase("out");
    }, 100);
    return () => window.clearInterval(id);
  }, [allowed, phase, canLeave]);

  useEffect(() => {
    if (phase !== "out") return;
    const t = window.setTimeout(() => {
      if (finished.current) return;
      finished.current = true;
      markBootDone();
      onFinished?.();
    }, allowed ? OUT_MS : 0);
    return () => window.clearTimeout(t);
  }, [phase, allowed, onFinished]);

  return (
    <div className="relative grid h-full min-h-full place-items-center overflow-hidden bg-background px-6 text-foreground">
      {allowed ? (
        <div className="pointer-events-none absolute inset-0 md:grid md:place-items-center">
          <div
            className="boot-shade absolute inset-0 overflow-hidden md:relative md:inset-auto md:rounded-full"
            data-phase={phase}
            aria-hidden
          >
            <img src={clip.poster} alt="" className="boot-shade-media" />
            <video
              ref={videoRef}
              className="boot-shade-media"
              src={clip.src}
              muted
              playsInline
              preload="auto"
              style={{ opacity: motion ? 1 : 0 }}
            />
            <div className="boot-shade-veil absolute inset-0" />
          </div>
        </div>
      ) : null}
      <div className="relative z-10 flex flex-col items-center gap-3">
        <Brand size="md" align="center" />
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export { bootAlreadyPlayed };
