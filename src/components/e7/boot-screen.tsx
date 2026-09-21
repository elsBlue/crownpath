import { Brand } from "./brand";

export function BootScreen({ label = "Loading data…" }: { label?: string }) {
  return (
    <div className="relative grid h-full min-h-full place-items-center overflow-hidden bg-background px-6 text-foreground">
      <div className="pointer-events-none absolute inset-0 md:grid md:place-items-center">
        <div
          className="boot-shade absolute inset-0 overflow-hidden md:relative md:inset-auto md:rounded-full"
          aria-hidden
        >
          <video
            className="boot-shade-media boot-media-dark"
            src="/intro/shade.mp4?v=4"
            autoPlay
            muted
            playsInline
            preload="auto"
          />
          <video
            className="boot-shade-media boot-media-light"
            src="/intro/breeze.mp4?v=4"
            autoPlay
            muted
            playsInline
            preload="auto"
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