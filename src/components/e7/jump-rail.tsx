import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function letterOf(name: string): string {
  const ch = name.trim().charAt(0).toUpperCase();
  return ch >= "A" && ch <= "Z" ? ch : "#";
}

export function groupByLetter<T>(
  rows: T[],
  nameOf: (row: T) => string,
): { letter: string; rows: T[] }[] {
  const sorted = [...rows].sort((a, b) =>
    nameOf(a).localeCompare(nameOf(b), undefined, { sensitivity: "base" }),
  );
  const map = new Map<string, T[]>();
  for (const row of sorted) {
    const letter = letterOf(nameOf(row));
    const bucket = map.get(letter);
    if (bucket) bucket.push(row);
    else map.set(letter, [row]);
  }
  const keys = [...map.keys()].sort((a, b) => {
    if (a === "#") return 1;
    if (b === "#") return -1;
    return a.localeCompare(b);
  });
  return keys.map((letter) => ({ letter, rows: map.get(letter)! }));
}

function nearestScroller(from: HTMLElement): HTMLElement | Window {
  let node: HTMLElement | null = from.parentElement;
  while (node && node !== document.documentElement) {
    const { overflowY } = getComputedStyle(node);
    if (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") return node;
    node = node.parentElement;
  }
  return window;
}

export function JumpRail({
  items,
  onJump,
}: {
  items: { id: string; label: string }[];
  onJump?: (id: string) => void;
}) {
  const [active, setActive] = useState(items[0]?.id ?? "");
  const [shown, setShown] = useState(false);
  const hold = useRef(false);
  const hideTimer = useRef(0);
  const compact = items.length > 8;

  useEffect(() => {
    const first = items[0]?.id;
    if (first) setActive(first);
    const scroller = document.querySelector(".app-scroll");
    const rootEl = scroller instanceof HTMLElement ? scroller : null;
    const target: HTMLElement | Window = rootEl ?? window;

    function syncActive() {
      const origin = rootEl ? rootEl.getBoundingClientRect().top : 0;
      const marker = origin + 36;
      let current = items[0]?.id ?? "";
      for (const item of items) {
        const el = document.getElementById(item.id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= marker) current = item.id;
      }
      if (current) setActive(current);
    }

    function flash() {
      setShown(true);
      window.clearTimeout(hideTimer.current);
      if (hold.current) return;
      hideTimer.current = window.setTimeout(() => setShown(false), 1000);
    }

    function onScroll() {
      syncActive();
      flash();
    }

    function onPointerUp() {
      hold.current = false;
      flash();
    }

    syncActive();
    target.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    return () => {
      target.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      window.clearTimeout(hideTimer.current);
    };
  }, [items]);

  function go(id: string) {
    onJump?.(id);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const run = () => {
      const el = document.getElementById(id);
      if (!el) return;
      const scroller = nearestScroller(el);
      const origin =
        scroller instanceof Window ? 0 : scroller.getBoundingClientRect().top;
      const dy = el.getBoundingClientRect().top - origin - 8;
      const behavior: ScrollBehavior = reduced ? "auto" : "smooth";
      if (scroller instanceof Window) window.scrollBy({ top: dy, behavior });
      else scroller.scrollBy({ top: dy, behavior });
    };
    window.setTimeout(run, onJump ? 80 : 0);
  }

  if (items.length === 0) return null;

  return (
    <nav
      aria-label="On this page"
      className="scout-rail-dock pointer-events-none fixed top-20 bottom-20 z-30 flex justify-end md:bottom-8"
    >
      <div
        className={cn(
          "scout-rail pointer-events-auto flex min-w-11 items-stretch gap-2 py-2 pr-1 pl-1 transition-[opacity,transform] duration-300 ease-[var(--ease-smooth-out)] motion-reduce:transition-none",
          compact ? "h-full" : "my-auto",
          shown
            ? "translate-x-0 opacity-100"
            : "pointer-events-none translate-x-2 opacity-0 md:pointer-events-auto md:translate-x-0 md:opacity-100",
        )}
        onPointerDown={() => {
          hold.current = true;
          setShown(true);
          window.clearTimeout(hideTimer.current);
        }}
      >
        <div className={cn("flex min-h-0 min-w-11 flex-col", compact && "h-full")}>
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-label={`Jump to ${item.label}`}
              aria-current={active === item.id ? "true" : undefined}
              onClick={() => go(item.id)}
              className={cn(
                "flex min-w-11 items-center justify-center px-2 tracking-wide [-webkit-tap-highlight-color:transparent]",
                compact ? "flex-1 text-xs leading-none" : "min-h-11 text-xs",
                active === item.id ? "text-foreground" : "text-muted-foreground/70",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="flex w-px min-h-0 flex-col py-1.5" aria-hidden>
          {items.map((item) => (
            <span
              key={item.id}
              className={cn(
                "w-px flex-1",
                active === item.id ? "bg-foreground" : "bg-foreground/20",
              )}
            />
          ))}
        </div>
      </div>
    </nav>
  );
}
