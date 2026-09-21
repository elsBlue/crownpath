import { useEffect, useMemo, useState } from "react";
import { CounterCard } from "@/components/e7/counter-card";
import { InfoTip } from "@/components/e7/info-tip";
import { JumpRail } from "@/components/e7/jump-rail";
import { TeamSlots } from "@/components/e7/team-slots";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { getHero, useCatalog } from "@/lib/e7/catalog";
import { classifyDefense, recommendCounters } from "@/lib/e7/engine";
import { ARCHETYPE_META } from "@/lib/e7/recipes";
import { builtIds, useArenaStore } from "@/lib/e7/store";
import { lineupLimitNote } from "@/lib/e7/threats";
import { EFFECT_LABEL } from "@/lib/e7/types";
import { cn } from "@/lib/utils";

export function ScoutView() {
  const enemy = useArenaStore((s) => s.enemy);
  const enemyGw = useArenaStore((s) => s.enemyGw);
  const enemyGw2 = useArenaStore((s) => s.enemyGw2);
  const gwRound = useArenaStore((s) => s.gwRound);
  const setGwRound = useArenaStore((s) => s.setGwRound);
  const setGwSlot = useArenaStore((s) => s.setGwSlot);
  const scoutMode = useArenaStore((s) => s.scoutMode);
  const setScoutMode = useArenaStore((s) => s.setScoutMode);
  const roster = useArenaStore((s) => s.roster);
  const restrict = useArenaStore((s) => s.restrictToRoster);
  const setRestrict = useArenaStore((s) => s.setRestrict);
  const setEnemy = useArenaStore((s) => s.setEnemy);
  const clearWall = useArenaStore((s) => s.clearWall);
  const setEnemySlot = useArenaStore((s) => s.setEnemySlot);
  const presets = useCatalog((s) => s.presets);
  const recipes = useCatalog((s) => s.recipes);
  const heroes = useCatalog((s) => s.heroes);
  const [wallsOpen, setWallsOpen] = useState(false);

  const seats: 3 | 4 = scoutMode === "gw" ? 3 : 4;
  const filled = useMemo(() => enemy.filter((id) => id.length > 0), [enemy]);
  const built = builtIds(roster);
  const builtVerified = built.filter((id) => getHero(id)?.verified).length;
  const pool = restrict ? built : null;
  const poolKey = pool ? pool.join("|") : "all";
  const enemyKey = enemy.join("|");

  const read = useMemo(() => classifyDefense(filled), [enemyKey, heroes]);
  const counters = useMemo(
    () => (filled.length === seats ? recommendCounters(filled, pool, seats) : []),
    [enemyKey, poolKey, filled.length, recipes, heroes, seats],
  );

  const [openIds, setOpenIds] = useState<string[]>([]);
  const [watchAll, setWatchAll] = useState(false);
  const [watchOpen, setWatchOpen] = useState<string | null>(null);
  const [kitOpen, setKitOpen] = useState(false);

  useEffect(() => {
    setWatchAll(false);
    setWatchOpen(null);
    setKitOpen(false);
    setOpenIds([]);
    setWallsOpen(false);
  }, [enemyKey, poolKey, scoutMode]);

  function toggleTeam(id: string, _heroIds: string[]) {
    setOpenIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  }

  const meta = read ? ARCHETYPE_META[read.archetype] : null;
  const limitNote =
    filled.length === seats ? lineupLimitNote(read?.watch ?? [], counters) : null;
  const remain = seats - filled.length;
  const hasKit = Boolean(
    read &&
      (read.effects.length > 0 ||
        read.buffs.length > 0 ||
        read.debuffs.length > 0 ||
        read.uniqueEffects.length > 0),
  );
  const jumpItems = useMemo(
    () => [
      { id: "scout-wall", label: "Wall" },
      { id: "scout-read", label: "Type" },
      { id: "scout-lineups", label: "Lineups" },
      ...(hasKit ? [{ id: "scout-kit", label: "Kit" }] : []),
    ],
    [hasKit],
  );

  return (
    <div className={cn("flex flex-col gap-5 xl:gap-8", filled.length > 0 && "pr-8 xl:pr-0")}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
            Scout
          </p>
          <div className="flex rounded-full bg-secondary p-1">
            {(
              [
                ["gw", "Guild War"],
                ["arena", "Arena"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setScoutMode(id)}
                className={cn(
                  "h-11 rounded-full px-3.5 text-sm",
                  scoutMode === id
                    ? "bg-card text-foreground shadow-[var(--shadow-border)]"
                    : "text-muted-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div id="scout-wall" className="rise-in flex scroll-mt-3 flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
                Enemy wall
              </p>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">
                {scoutMode === "gw"
                  ? "Up to three heroes per phase. Front is the left seat (arrow) — the foremost ally."
                  : "Front is the left seat (arrow) — the foremost ally on the enemy defense."}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {scoutMode === "arena" && presets.length > 0 ? (
                <button
                  type="button"
                  className="min-h-11 px-2 text-sm text-muted-foreground hover:text-foreground"
                  onClick={() => setWallsOpen((v) => !v)}
                  aria-expanded={wallsOpen}
                >
                  {wallsOpen ? "Close" : "Examples"}
                </button>
              ) : null}
              <button
                type="button"
                className="min-h-11 px-2 text-sm text-muted-foreground hover:text-foreground"
                onClick={() => clearWall()}
              >
                Clear
              </button>
            </div>
          </div>
          {scoutMode === "gw" ? (
            <div className="grid grid-cols-1 justify-items-center gap-6 lg:grid-cols-2 lg:gap-8">
              {(
                [
                  [1, enemyGw] as const,
                  [2, enemyGw2] as const,
                ]
              ).map(([round, ids]) => {
                const on = gwRound === round;
                return (
                  <div key={round} className="flex w-full max-w-md flex-col items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setGwRound(round)}
                      className={cn(
                        "flex size-11 items-center justify-center rounded-full text-sm font-medium",
                        on
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground",
                      )}
                      aria-pressed={on}
                    >
                      {round}
                    </button>
                    <div
                      className={cn("w-full", !on && "opacity-70")}
                      onPointerDown={() => {
                        if (!on) setGwRound(round);
                      }}
                    >
                      <TeamSlots
                        ids={ids}
                        mode="arena"
                        maxUnits={3}
                        exclude={round === 1 ? enemyGw2 : enemyGw}
                        onChangeSlot={(i, id) => setGwSlot(round, i, id)}
                        pickerTitle={`Round ${round}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mx-auto w-full max-w-md">
              <TeamSlots
                ids={enemy}
                mode="arena"
                onChangeSlot={setEnemySlot}
                pickerTitle="Enemy unit"
              />
            </div>
          )}
          {wallsOpen && scoutMode === "arena" && presets.length > 0 ? (
            <ul className="flex flex-col gap-1">
              {presets.map((p) => {
                const on = enemy.join() === p.heroIds.join();
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setEnemy(p.heroIds);
                        setWallsOpen(false);
                      }}
                      className={cn(
                        "w-full rounded-xl px-4 py-3 text-left shadow-[var(--shadow-border)]",
                        on ? "bg-primary text-primary-foreground" : "bg-card",
                      )}
                    >
                      <p className="text-sm font-medium">{p.name}</p>
                      {p.blurb ? (
                        <p className={cn("mt-0.5 text-xs", on ? "text-primary-foreground/80" : "text-muted-foreground")}>
                          {p.blurb}
                        </p>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      </div>

      {filled.length > 0 ? (
        <JumpRail
          items={jumpItems}
          onJump={(id) => {
            if (id === "scout-kit") setKitOpen(true);
          }}
        />
      ) : null}

      <div className="flex flex-col gap-6 xl:grid xl:grid-cols-2 xl:items-start xl:gap-10">
        <div className="order-1 flex flex-col gap-6">
        {filled.length === 0 ? (
          <header id="scout-read" className="flex scroll-mt-3 flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-muted-foreground">Wall type</p>
              {scoutMode === "gw" ? (
                <PhaseTabs round={gwRound} onRound={setGwRound} />
              ) : null}
            </div>
            <h1 className="font-display text-3xl leading-[1.1] tracking-tight text-muted-foreground/35 sm:text-4xl">
              Empty defense
            </h1>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              {scoutMode === "gw"
                ? "Each phase is its own 3v3. Fill the diamond for this phase — the wall is named as soon as someone is in."
                : "Tap a diamond to add a hero. The wall is named as soon as someone is in."}
            </p>
          </header>
        ) : read && meta ? (
        <header id="scout-read" className="rise-in flex scroll-mt-3 flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-muted-foreground">Wall type</p>
            {scoutMode === "gw" ? (
              <PhaseTabs round={gwRound} onRound={setGwRound} />
            ) : null}
          </div>
          <h1 className="font-display text-3xl leading-[1.1] tracking-tight sm:text-4xl">
            {meta.title}
          </h1>
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
            {meta.blurb}
          </p>
          {filled.length < seats ? (
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              Add {remain} more {remain === 1 ? "hero" : "heroes"} for lineups.
              The name above is from who is already in.
            </p>
          ) : null}
          {read && read.unverifiedIds.length > 0 ? (
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              {read.unverifiedIds.length === 1 ? "One unit on this wall is" : `${read.unverifiedIds.length} units on this wall are`}{" "}
              not in-game verified. The wall type is named from verified kits only.
            </p>
          ) : null}
          {read && read.watch.length > 0 ? (
            <div className="mt-1 flex max-w-md flex-col gap-1.5 pr-16 xl:pr-0">
              <ul className="flex flex-col gap-1">
                {(watchAll ? read.watch : read.watch.slice(0, 2)).map((item) => {
                  const open = watchOpen === item.key;
                  return (
                    <li key={item.key}>
                      <button
                        type="button"
                        onClick={() => setWatchOpen(open ? null : item.key)}
                        aria-expanded={open}
                        className="w-full rounded-xl px-0 py-1.5 text-left [-webkit-tap-highlight-color:transparent]"
                      >
                        <span className="text-sm font-medium">{item.label}</span>
                        <span
                          className={cn(
                            "mt-0.5 block text-sm leading-relaxed text-muted-foreground",
                            open ? "" : "line-clamp-2",
                          )}
                        >
                          {item.note}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              {read.watch.length > 2 ? (
                <button
                  type="button"
                  onClick={() => setWatchAll((v) => !v)}
                  className="self-start min-h-11 text-sm font-medium text-foreground"
                >
                  {watchAll ? "Show less" : `Watch ${read.watch.length - 2} more`}
                </button>
              ) : null}
            </div>
          ) : null}
        </header>
        ) : null}
        </div>

        <div id="scout-kit" className="order-3 scroll-mt-3 xl:order-1 xl:col-start-1">
        <div className="rise-in-2 flex flex-col gap-3">
          {read &&
          (read.effects.length > 0 ||
            read.buffs.length > 0 ||
            read.debuffs.length > 0 ||
            read.uniqueEffects.length > 0) ? (
            <div className="flex max-w-md flex-col gap-2">
              <button
                type="button"
                onClick={() => setKitOpen((v) => !v)}
                aria-expanded={kitOpen}
                className="flex min-h-11 items-center justify-between gap-3 text-left"
              >
                <span className="text-sm font-medium">Kit on this wall</span>
                <span className="text-sm text-muted-foreground">
                  {kitOpen ? "Hide" : "Show"}
                </span>
              </button>
              {kitOpen ? (
            <div className="flex flex-col gap-3">
              {read.effects.length > 0 ? (
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
                    Kit effects
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {read.effects.map((id) => (
                      <span
                        key={id}
                        className="rounded-full bg-secondary px-3 py-1.5 text-xs text-foreground"
                      >
                        {EFFECT_LABEL[id]}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
              {read.buffs.length > 0 ? (
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
                    Buffs
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {read.buffs.map((name) => (
                      <span
                        key={name}
                        className="rounded-full bg-secondary px-3 py-1.5 text-xs text-foreground"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
              {read.debuffs.length > 0 ? (
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
                    Debuffs
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {read.debuffs.map((name) => (
                      <span
                        key={name}
                        className="rounded-full bg-secondary px-3 py-1.5 text-xs text-foreground"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
              {read.uniqueEffects.length > 0 ? (
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
                    Unique
                  </p>
                  <ul className="flex flex-col gap-2">
                    {read.uniqueEffects.map((u) => {
                      const owner = getHero(u.heroId);
                      return (
                        <li
                          key={`${u.heroId}-${u.name}`}
                          className="rounded-xl bg-card px-4 py-3 shadow-[var(--shadow-border)]"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-sm font-medium">{u.name}</p>
                            {owner ? (
                              <span className="shrink-0 rounded-full bg-secondary px-2.5 py-1 text-xs text-muted-foreground">
                                {owner.short}
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{u.text}</p>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}
            </div>
              ) : null}
            </div>
          ) : null}
        </div>
        </div>

      <div
        id="scout-lineups"
        className="order-2 flex scroll-mt-3 flex-col gap-4 xl:col-start-2 xl:row-start-1 xl:row-span-2 xl:sticky xl:top-20"
      >
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h2 className="font-display text-2xl tracking-tight">Lineups to try</h2>
              {scoutMode === "gw" ? (
                <span className="text-sm text-muted-foreground">Phase {gwRound}</span>
              ) : null}
              <InfoTip label="About lineups">
                These teams are a skill fit against the wall. Speed rolls, gear, artifacts, and
                exclusive equipment are not in the model. Not a win guarantee.
              </InfoTip>
            </div>
            {counters.length > 0 ? (
              <p className="text-sm text-muted-foreground">{counters.length} to try</p>
            ) : (
              <p className="text-sm text-muted-foreground">{filled.length} of {seats}</p>
            )}
          </div>
          <div className="flex h-10 items-center justify-between gap-3 rounded-xl bg-card px-3 shadow-[var(--shadow-border)]">
            <div className="flex min-w-0 items-center gap-1">
              <p className="text-sm font-medium">Only built units</p>
              <InfoTip label="About only built units">
                On: suggestions use the {builtVerified} built, journal-checked{" "}
                {builtVerified === 1 ? "hero" : "heroes"} on your roster. Off: the full checked
                list. Names that are not journal-checked stay out.
              </InfoTip>
            </div>
            <Switch checked={restrict} onCheckedChange={setRestrict} />
          </div>
          {filled.length === seats ? (
            <p className="hidden max-w-md text-sm leading-relaxed text-muted-foreground md:block">
              {restrict
                ? "Suggested from units you marked Built. Skill fit only — gear, sets, artifacts, and exclusive equipment are not used."
                : "Suggested from the full checked list. You may not own every unit. Skill fit only — gear, sets, artifacts, and exclusive equipment are not used."}
            </p>
          ) : null}
          {limitNote ? (
            <p className="max-w-md text-sm leading-relaxed text-foreground">{limitNote}</p>
          ) : null}
        </div>

        {counters.length === 0 ? (
          <Card>
            <CardContent className="p-5 text-sm leading-relaxed text-muted-foreground">
              {filled.length < seats
                ? `Add ${remain} more ${remain === 1 ? "hero" : "heroes"} to the defense. Lineups appear when ${seats} heroes are placed.`
                : restrict
                  ? builtVerified < seats
                    ? `Only ${builtVerified} journal-checked Built ${builtVerified === 1 ? "hero" : "heroes"} — not enough to fill ${seats} seats. Mark more Built on Roster, or turn off Only built units.`
                    : "No lineup from your Built units for this wall yet. Skip the defense, or turn off Only built units."
                  : "No lineup from the checked list for this wall yet. Skipping this defense is allowed."}
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-3 [overflow-anchor:none]">
            {counters.map((team) => (
              <CounterCard
                key={team.recipeId}
                team={team}
                selected={openIds.includes(team.recipeId)}
                onSelect={() => toggleTeam(team.recipeId, team.heroIds)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
    </div>
  );
}

function PhaseTabs({
  round,
  onRound,
}: {
  round: 1 | 2;
  onRound: (round: 1 | 2) => void;
}) {
  return (
    <div className="flex rounded-full bg-secondary p-1">
      {([1, 2] as const).map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onRound(n)}
          className={cn(
            "h-10 rounded-full px-3.5 text-sm",
            round === n
              ? "bg-card text-foreground shadow-[var(--shadow-border)]"
              : "text-muted-foreground",
          )}
        >
          Phase {n}
        </button>
      ))}
    </div>
  );
}
