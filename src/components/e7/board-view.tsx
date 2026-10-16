import { useEffect, useMemo, useState } from "react";
import { TeamSlots } from "@/components/e7/team-slots";
import { getHero, useCatalog } from "@/lib/e7/catalog";
import { classifyDefense } from "@/lib/e7/engine";
import { ARCHETYPE_META } from "@/lib/e7/recipes";
import type { ScoutMode } from "@/lib/e7/formation";
import { EFFECT_LABEL } from "@/lib/e7/types";
import { cn } from "@/lib/utils";

const KEY = "crownpath-board";

function emptyIds(): string[] {
  return ["", "", "", ""];
}

function loadBoard(): { mode: ScoutMode; ids: string[] } {
  if (typeof window === "undefined") return { mode: "arena", ids: emptyIds() };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { mode: "arena", ids: emptyIds() };
    const parsed = JSON.parse(raw) as { mode?: string; ids?: unknown };
    const mode: ScoutMode = parsed.mode === "gw" ? "gw" : "arena";
    const ids = emptyIds();
    if (Array.isArray(parsed.ids)) {
      parsed.ids.slice(0, 4).forEach((id, i) => {
        if (typeof id === "string") ids[i] = id;
      });
    }
    return { mode, ids };
  } catch {
    return { mode: "arena", ids: emptyIds() };
  }
}

export function BoardView() {
  const heroes = useCatalog((s) => s.heroes);
  const [mode, setMode] = useState<ScoutMode>("arena");
  const [ids, setIds] = useState<string[]>(emptyIds);
  const [ready, setReady] = useState(false);
  const [watchAll, setWatchAll] = useState(false);

  useEffect(() => {
    const saved = loadBoard();
    setMode(saved.mode);
    setIds(saved.ids);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(KEY, JSON.stringify({ mode, ids }));
  }, [mode, ids, ready]);

  const filled = useMemo(() => ids.filter((id) => id.length > 0), [ids]);
  const read = useMemo(() => classifyDefense(filled), [filled.join("|"), heroes]);
  const meta = read ? ARCHETYPE_META[read.archetype] : null;
  const overGw = mode === "gw" && filled.length > 3;

  useEffect(() => {
    setWatchAll(false);
  }, [filled.join("|")]);

  function setSlot(index: number, id: string | null) {
    setIds((cur) => {
      const next = [...cur];
      while (next.length < 4) next.push("");
      next[index] = id ?? "";
      return next;
    });
  }

  function clear() {
    setIds(emptyIds());
  }

  const watch = read?.watch ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
          Defense Board
        </p>
        <div className="flex rounded-full bg-secondary p-1">
          {(
            [
              ["arena", "Arena"],
              ["gw", "Guild War"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setMode(id)}
              className={cn(
                "h-11 rounded-full px-3.5 text-sm",
                mode === id
                  ? "bg-card text-foreground shadow-[var(--shadow-border)]"
                  : "text-muted-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-start justify-between gap-3">
        <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
          Put heroes on one team. This names what they do together from checked kits.
          Gear, artifacts, and speed tuning are not in the read.
        </p>
        <button
          type="button"
          className="min-h-11 shrink-0 px-2 text-sm text-muted-foreground hover:text-foreground"
          onClick={clear}
        >
          Clear
        </button>
      </div>

      <div className="mx-auto w-full max-w-md">
        <TeamSlots
          ids={ids}
          mode="arena"
          facing="ally"
          maxUnits={mode === "gw" ? 3 : 4}
          onChangeSlot={setSlot}
          pickerTitle="Add to the team"
        />
      </div>

      {overGw ? (
        <p className="text-sm text-muted-foreground">
          Guild War is three heroes. Clear one seat.
        </p>
      ) : null}

      {filled.length === 0 || !read || !meta ? (
        <header className="flex flex-col gap-2">
          <p className="text-sm font-medium text-muted-foreground">Together</p>
          <h1 className="font-display text-3xl leading-[1.1] tracking-tight text-muted-foreground/35 sm:text-4xl">
            Empty team
          </h1>
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
            Tap a seat. The read starts as soon as someone is in. Two or more is when the mix shows.
          </p>
        </header>
      ) : (
        <div className="flex flex-col gap-8 xl:grid xl:grid-cols-2 xl:items-start xl:gap-10">
          <header className="flex flex-col gap-2">
            <p className="text-sm font-medium text-muted-foreground">Together</p>
            <h1 className="font-display text-3xl leading-[1.1] tracking-tight sm:text-4xl">
              {meta.title}
            </h1>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">{meta.blurb}</p>
            {read.unverifiedIds.length > 0 ? (
              <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
                {read.unverifiedIds.length === 1
                  ? "One seat is not in-game verified. That kit is ignored."
                  : `${read.unverifiedIds.length} seats are not in-game verified. Those kits are ignored.`}
              </p>
            ) : null}
            {watch.length > 0 ? (
              <ul className="mt-1 flex max-w-md flex-col gap-1">
                {(watchAll ? watch : watch.slice(0, 3)).map((item) => (
                  <li key={item.key} className="py-1.5">
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{item.note}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
                No shared trap yet. Add another hero, or these kits only do their own jobs.
              </p>
            )}
            {watch.length > 3 ? (
              <button
                type="button"
                onClick={() => setWatchAll((v) => !v)}
                className="self-start min-h-11 text-sm font-medium text-foreground"
              >
                {watchAll ? "Show less" : `Show ${watch.length - 3} more`}
              </button>
            ) : null}
          </header>

          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium">On this team</p>
            <ul className="flex flex-col gap-2">
              {filled.map((id) => {
                const hero = getHero(id);
                if (!hero) return null;
                const uniques = (hero.uniqueEffects ?? []).slice(0, 2);
                return (
                  <li
                    key={id}
                    className="rounded-xl bg-card px-4 py-3 shadow-[var(--shadow-border)]"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-sm font-medium">{hero.name}</p>
                      <p className="shrink-0 text-xs text-muted-foreground">
                        {hero.verified ? hero.roles.join(" · ") : "Not checked"}
                      </p>
                    </div>
                    {hero.verified && uniques.length > 0 ? (
                      <ul className="mt-2 flex flex-col gap-1.5">
                        {uniques.map((u) => (
                          <li key={u.name}>
                            <p className="text-sm font-medium">{u.name}</p>
                            <p className="text-sm leading-relaxed text-muted-foreground">{u.text}</p>
                          </li>
                        ))}
                      </ul>
                    ) : hero.verified ? (
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{hero.kit}</p>
                    ) : (
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        This kit has not been checked against the journal, so it does not change the read.
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
            {read.effects.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {read.effects.map((id) => (
                  <span
                    key={id}
                    className="rounded-full bg-secondary px-3 py-1.5 text-xs text-foreground"
                  >
                    {EFFECT_LABEL[id]}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
