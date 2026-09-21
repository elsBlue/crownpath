import { useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { FormationBoard } from "@/components/e7/formation-board";
import { InfoTip } from "@/components/e7/info-tip";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { placeLineup } from "@/lib/e7/formation";
import type { CounterTeam } from "@/lib/e7/types";
import { cn } from "@/lib/utils";

function nearestScroller(from: HTMLElement): HTMLElement | Window {
  let node: HTMLElement | null = from.parentElement;
  while (node && node !== document.documentElement) {
    const { overflowY } = getComputedStyle(node);
    if (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") return node;
    node = node.parentElement;
  }
  return window;
}

export function CounterCard({
  team,
  selected,
  onSelect,
}: {
  team: CounterTeam;
  selected: boolean;
  onSelect: () => void;
}) {
  const seats = team.seats ?? 4;
  const slots = Math.round(team.coverage * seats);
  const rootRef = useRef<HTMLDivElement>(null);
  const [whyOpen, setWhyOpen] = useState(false);
  const setupLines = team.setup.split(/(?<=\.)\s+/).filter((s) => s.length > 8);

  function toggle() {
    const top = rootRef.current?.getBoundingClientRect().top ?? 0;
    onSelect();
    const pin = () => {
      const el = rootRef.current;
      if (!el) return;
      const dy = el.getBoundingClientRect().top - top;
      if (Math.abs(dy) <= 0.5) return;
      const scroller = nearestScroller(el);
      if (scroller instanceof Window) scroller.scrollBy(0, dy);
      else scroller.scrollTop += dy;
    };
    requestAnimationFrame(() => {
      pin();
      requestAnimationFrame(pin);
    });
  }

  return (
    <Card
      ref={rootRef}
      className={cn(
        "overflow-hidden [overflow-anchor:none] transition-[box-shadow] duration-200",
        selected ? "shadow-[var(--shadow-border-hover)]" : "",
      )}
    >
      <div
        role="button"
        tabIndex={0}
        aria-expanded={selected}
        onPointerDown={(e) => {
          if (e.button === 0) e.preventDefault();
        }}
        onClick={toggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggle();
          }
        }}
        className="w-full cursor-pointer p-4 text-left [-webkit-tap-highlight-color:transparent] outline-none sm:p-5"
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-display text-lg tracking-tight">{team.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {selected ? "Hide setup" : "Tap for setup"}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <div className="text-right">
                <p className="font-mono text-lg tabular-nums leading-none">{slots}/{seats}</p>
                <p className="mt-1 text-xs tracking-wider text-muted-foreground uppercase">Filled</p>
              </div>
              <ChevronDown
                className={cn(
                  "size-5 text-muted-foreground transition-transform duration-300 ease-[var(--ease-smooth-out)]",
                  selected ? "rotate-180" : "rotate-0",
                )}
                strokeWidth={1.75}
                aria-hidden
              />
            </div>
          </div>
          <FormationBoard ids={placeLineup(team.heroIds)} facing="ally" compact />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 px-4 sm:px-5">
        {team.theorycraft ? (
          <Badge variant="outline">Catalog</Badge>
        ) : (
          <Badge variant="steel">Your roster</Badge>
        )}
        {team.missing.map((m) => (
          <Badge key={m} variant="loss">
            Empty {m}
          </Badge>
        ))}
        {team.gaps.map((g) => (
          <span key={g} className="inline-flex items-center gap-0.5">
            <Badge variant="loss">Unanswered {g}</Badge>
            <InfoTip label={`About unanswered ${g}`} side="top">
              {gapHint(g)}
            </InfoTip>
          </span>
        ))}
      </div>
      <div className="h-4" />
      <div className="counter-fold" data-open={selected ? "true" : "false"}>
        <div>
          <CardContent className="flex flex-col gap-4 border-t border-border px-4 pt-4 pb-5 sm:px-5">
            <Block label="How it wins" text={team.wincon} />
            {team.pitfalls.length > 0 ? (
              <div>
                <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                  Breaks if
                </p>
                <ul className="mt-1 flex flex-col gap-1">
                  {team.pitfalls.slice(0, 3).map((p) => (
                    <li key={p} className="text-sm leading-relaxed text-foreground/90">
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {setupLines.length > 1 ? (
              <div>
                <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                  Setup
                </p>
                <ul className="mt-1 flex flex-col gap-1.5">
                  {setupLines.map((line) => (
                    <li key={line} className="text-sm leading-relaxed">
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <Block label="Setup" text={team.setup} />
            )}
            {team.why.length > 0 ? (
              <div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setWhyOpen((v) => !v);
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  aria-expanded={whyOpen}
                  className="flex min-h-11 w-full items-center justify-between gap-3 text-left"
                >
                  <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                    Why this team
                  </span>
                  <span className="text-sm text-muted-foreground">{whyOpen ? "Hide" : "Show"}</span>
                </button>
                {whyOpen ? (
                  <ul className="flex flex-col gap-1 pb-1">
                    {team.why.map((line) => (
                      <li key={line} className="text-sm leading-relaxed text-muted-foreground">
                        {line}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}
          </CardContent>
        </div>
      </div>
    </Card>
  );
}

function gapHint(label: string): string {
  if (label === "Offering") {
    return "Nobody on this lineup ignores damage sharing. Most of the hit still goes to their front.";
  }
  if (label === "Forced targeting") {
    return "This lineup has no area attack. Single-target skills still have to hit her.";
  }
  if (label === "Revive / reset") {
    return "This lineup has no anti-revive. A kill can still bring that unit back.";
  }
  if (label === "Evasion") {
    return "This lineup has no answer to miss. Single-target skills into the miss core still fail often.";
  }
  if (label === "Speed cap") {
    return "This lineup has no injury plan. You cannot outrun a Speed cap.";
  }
  return `This lineup does not answer ${label}. That part of the wall still applies.`;
}

function Block({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">{label}</p>
      <p className="mt-1 text-sm leading-relaxed">{text}</p>
    </div>
  );
}
