import { useEffect, useMemo, useState } from "react";
import { HeroPortrait } from "@/components/hero-portrait";
import {
  EmptyNote,
  FilterChip,
  LetterHead,
  LIST,
  PAGE,
  PageHeader,
  RowCard,
  StatStrip,
  TOOLBAR,
} from "@/components/e7/chrome";
import { FitsKit } from "@/components/e7/fits-kit";
import { JumpRail, groupByLetter } from "@/components/e7/jump-rail";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { searchHeroes } from "@/lib/e7/engine";
import { CLASS_LABEL, ELEMENT_LABEL } from "@/lib/e7/heroes";
import { useCatalog } from "@/lib/e7/catalog";
import { builtIds, useArenaStore } from "@/lib/e7/store";
import type { Hero } from "@/lib/e7/types";
import { cn, daysAgoLabel } from "@/lib/utils";

type KitFilter = "all" | "verified" | "pending";

function rosterEmptyCopy(query: string, onlyBuilt: boolean, kit: KitFilter): string {
  const bits: string[] = [];
  if (query.trim()) bits.push(`“${query.trim()}”`);
  if (onlyBuilt) bits.push("Built only");
  if (kit === "pending") bits.push("Pending");
  if (kit === "verified") bits.push("Verified");
  if (bits.length === 0) return "No heroes in the catalog.";
  return `No heroes match ${bits.join(" + ")}.`;
}

function useWide() {
  const [wide, setWide] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches,
  );
  useEffect(() => {
    const m = window.matchMedia("(min-width: 768px)");
    const on = () => setWide(m.matches);
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return wide;
}

export function RosterView() {
  const roster = useArenaStore((s) => s.roster);
  const toggleBuilt = useArenaStore((s) => s.toggleBuilt);
  const loadPresetRoster = useArenaStore((s) => s.loadPresetRoster);
  const heroes = useCatalog((s) => s.heroes);
  const wide = useWide();
  const [query, setQuery] = useState("");
  const [onlyBuilt, setOnlyBuilt] = useState(false);
  const [kit, setKit] = useState<KitFilter>("all");
  const [confirmClear, setConfirmClear] = useState(false);
  const [openHero, setOpenHero] = useState<Hero | null>(null);

  const built = builtIds(roster);
  const verifiedN = heroes.filter((h) => h.verified).length;
  const builtVerified = built.filter((id) => heroes.find((h) => h.id === id)?.verified).length;

  const list = useMemo(() => {
    let pool = searchHeroes(query, heroes);
    if (onlyBuilt) pool = pool.filter((h) => roster[h.id]?.built);
    if (kit === "verified") pool = pool.filter((h) => h.verified);
    if (kit === "pending") pool = pool.filter((h) => !h.verified);
    return [...pool].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
  }, [query, onlyBuilt, kit, roster, heroes]);
  const groups = useMemo(() => groupByLetter(list, (h) => h.name), [list]);
  const jumpItems = useMemo(
    () => groups.map((g) => ({ id: `az-${g.letter}`, label: g.letter })),
    [groups],
  );

  return (
    <div className={cn(PAGE, jumpItems.length > 1 && "pr-8 xl:pr-0")}>
      <PageHeader kicker="Roster" title="Your roster">
        Tap a name for the kit loadout. Built is what Scout uses when Only built units is on.
      </PageHeader>

      <StatStrip
        items={[
          { label: "Built", value: String(built.length) },
          { label: "Ready", value: String(builtVerified) },
          { label: "Verified", value: String(verifiedN) },
          { label: "Pending", value: String(heroes.length - verifiedN) },
        ]}
      />

      <div className="flex flex-col gap-2">
        <div className={TOOLBAR}>
          {confirmClear ? (
            <>
              <p className="w-full text-sm text-muted-foreground">
                Clear all built marks? This cannot be undone.
              </p>
              <Button size="sm" variant="ghost" onClick={() => setConfirmClear(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  loadPresetRoster("clear");
                  setConfirmClear(false);
                }}
              >
                Clear all
              </Button>
            </>
          ) : (
            <>
              <FilterChip on={false} onClick={() => loadPresetRoster("challenger")}>
                Full kit
              </FilterChip>
              <button
                type="button"
                className="h-11 px-3 text-sm text-muted-foreground"
                onClick={() => setConfirmClear(true)}
              >
                Clear
              </button>
            </>
          )}
        </div>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search heroes…"
        />
        <div className={TOOLBAR}>
          <FilterChip on={onlyBuilt} onClick={() => setOnlyBuilt((v) => !v)}>
            Built only
          </FilterChip>
          {(
            [
              ["all", "All"],
              ["verified", "Verified"],
              ["pending", "Pending"],
            ] as const
          ).map(([id, label]) => (
            <FilterChip key={id} on={kit === id} onClick={() => setKit(id)}>
              {label}
            </FilterChip>
          ))}
        </div>
      </div>

      <ul className={LIST}>
        {groups.map((group) => (
          <li key={group.letter} className="flex flex-col gap-1">
            <LetterHead letter={group.letter} />
            <ul className={LIST}>
              {group.rows.map((hero) => {
                const builtOn = Boolean(roster[hero.id]?.built);
                const checked = daysAgoLabel(hero.checkedAt);
                return (
                  <li key={hero.id}>
                    <RowCard>
                      <button
                        type="button"
                        onClick={() => setOpenHero(hero)}
                        className="flex min-h-11 min-w-0 flex-1 items-center gap-3 text-left [-webkit-tap-highlight-color:transparent]"
                      >
                        <HeroPortrait hero={hero} size="sm" dimmed={!builtOn} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{hero.name}</span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {ELEMENT_LABEL[hero.element]} {CLASS_LABEL[hero.class]}
                            {hero.verified
                              ? ` · verified${checked ? ` ${checked}` : ""}`
                              : " · pending"}
                          </span>
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleBuilt(hero.id)}
                        aria-pressed={builtOn}
                        className={cn(
                          "inline-flex h-11 min-w-[5.75rem] shrink-0 items-center justify-center rounded-full px-3 text-xs font-medium tracking-wide uppercase [-webkit-tap-highlight-color:transparent]",
                          builtOn
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-muted-foreground",
                        )}
                      >
                        {builtOn ? "Built" : "Not built"}
                      </button>
                    </RowCard>
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ul>
      {list.length === 0 ? (
        <EmptyNote>
          {rosterEmptyCopy(query, onlyBuilt, kit)}{" "}
          {query || onlyBuilt || kit !== "all" ? (
            <button
              type="button"
              className="h-11 text-sm text-foreground underline-offset-4 hover:underline"
              onClick={() => {
                setQuery("");
                setOnlyBuilt(false);
                setKit("all");
              }}
            >
              Clear filters
            </button>
          ) : null}
        </EmptyNote>
      ) : null}
      {jumpItems.length > 1 ? <JumpRail items={jumpItems} /> : null}

      <Sheet open={Boolean(openHero)} onOpenChange={(open) => !open && setOpenHero(null)}>
        <SheetContent side={wide ? "right" : "bottom"}>
          {openHero ? (
            <>
              <SheetHeader>
                <div className="flex items-start gap-3">
                  <HeroPortrait hero={openHero} size="md" />
                  <div className="min-w-0 flex-1">
                    <SheetTitle>{openHero.name}</SheetTitle>
                    <SheetDescription>
                      {ELEMENT_LABEL[openHero.element]} {CLASS_LABEL[openHero.class]}
                      {openHero.verified ? " · verified" : " · pending"}
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>
              <div className="app-scroll min-h-0 flex-1 px-5 pb-4">
                <FitsKit hero={openHero} />
                {openHero.kit ? (
                  <div className="mt-6 border-t border-border/80 pt-4">
                    <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">Kit</p>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{openHero.kit}</p>
                  </div>
                ) : null}
              </div>
              <div className="shrink-0 border-t border-border/80 px-5 py-3">
                <Button variant="secondary" className="w-full sm:w-auto" onClick={() => setOpenHero(null)}>
                  Close
                </Button>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
