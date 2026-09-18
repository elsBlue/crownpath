import { useMemo } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { HeroRow } from "@/components/e7/hero-line";
import { PAGE, PageHeader } from "@/components/e7/chrome";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  buildFightDump,
  copyFightDump,
  downloadFightDump,
} from "@/lib/e7/export-stats";
import { ARCHETYPE_META } from "@/lib/e7/recipes";
import { nextDivision, divisionForVp, rankProgress } from "@/lib/e7/ranks";
import { groupByArchetype, groupByRecipe, winRate } from "@/lib/e7/stats";
import { useArenaStore } from "@/lib/e7/store";

export function LogView() {
  const vp = useArenaStore((s) => s.vp);
  const setVp = useArenaStore((s) => s.setVp);
  const matches = useArenaStore((s) => s.matches);
  const removeMatch = useArenaStore((s) => s.removeMatch);
  const clearMatches = useArenaStore((s) => s.clearMatches);

  const restrictToRoster = useArenaStore((s) => s.restrictToRoster);
  const roster = useArenaStore((s) => s.roster);

  const rank = divisionForVp(vp);
  const nxt = nextDivision(vp);
  const progress = rankProgress(vp);
  const wins = matches.filter((m) => m.won).length;
  const rate = winRate(wins, matches.length);
  const byRecipe = useMemo(() => groupByRecipe(matches), [matches]);
  const byShape = useMemo(() => groupByArchetype(matches), [matches]);

  const series = useMemo(() => {
    const points: { i: number; vp: number }[] = [];
    let cursor = vp;
    points.push({ i: 0, vp: cursor });
    for (const m of matches) {
      cursor -= m.vpDelta;
      points.push({ i: points.length, vp: cursor });
    }
    return points.reverse().map((p, i) => ({ ...p, i }));
  }, [matches, vp]);

  function dump() {
    return buildFightDump({ vp, matches, roster, restrictToRoster });
  }

  return (
    <div className={PAGE}>
      <PageHeader kicker="Results" title="Fight log">
        Older fights stay here. Scout no longer records Won or Lost.
      </PageHeader>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card>
          <CardContent className="flex flex-col gap-3 p-4 sm:p-5">
            <p className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
              {rank.label}
            </p>
            <p className="font-mono text-4xl tabular-nums leading-none">{vp.toLocaleString()}</p>
            <Progress value={Math.round(progress * 100)} />
            <p className="text-sm text-muted-foreground">
              {nxt
                ? `${nxt.minVp - vp} to ${nxt.label}${nxt.placement ? ` · ${nxt.placement}` : ""}`
                : rank.placement ?? "Top of the board"}
            </p>
            <div>
              <Label htmlFor="vp">Victory points</Label>
              <Input
                id="vp"
                type="number"
                min={0}
                max={6000}
                value={vp}
                onChange={(e) => setVp(Number(e.target.value))}
                className="mt-2 font-mono tabular-nums"
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-3 p-4 sm:p-5">
            <p className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
              Record
            </p>
            <p className="font-mono text-4xl tabular-nums leading-none">
              {rate === null ? "—" : `${rate}%`}
            </p>
            <p className="text-sm text-muted-foreground">
              {matches.length === 0 ? "No fights on this device yet" : `${wins}W · ${matches.length - wins}L`}
            </p>
            <p className="text-xs text-muted-foreground">
              Personal list. Scout no longer records new ones. Guild totals from older logs live under Admin → Stats.
            </p>
          </CardContent>
        </Card>
      </div>

      {series.length > 2 ? (
        <Card>
          <CardContent className="p-4 sm:p-5">
            <p className="mb-3 text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
              VP
            </p>
            <div className="h-36">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="vpFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-steel)" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="var(--color-steel)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="i" hide />
                  <YAxis hide domain={["dataMin - 20", "dataMax + 20"]} />
                  <ReTooltip
                    contentStyle={{
                      background: "var(--color-popover)",
                      border: "none",
                      boxShadow: "var(--shadow-border)",
                      borderRadius: 8,
                      fontSize: 12,
                      color: "var(--color-foreground)",
                    }}
                    formatter={(value) => [`${String(value)} VP`, ""]}
                    labelFormatter={() => ""}
                  />
                  <Area
                    type="monotone"
                    dataKey="vp"
                    stroke="var(--color-steel)"
                    fill="url(#vpFill)"
                    strokeWidth={1.5}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {byRecipe.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="font-display text-2xl tracking-tight">By strategy</h2>
          <ul className="flex flex-col gap-1">
            {byRecipe.map((row) => {
              const wr = winRate(row.wins, row.n);
              return (
                <li
                  key={row.key}
                  className="flex min-h-12 items-center justify-between gap-3 rounded-xl bg-card px-4 py-3 shadow-[var(--shadow-border)]"
                >
                  <span className="min-w-0 truncate text-sm">{row.label}</span>
                  <span className="shrink-0 font-mono text-sm tabular-nums text-muted-foreground">
                    {row.wins}W {row.n - row.wins}L
                    {wr !== null ? ` · ${wr}%` : ""}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {byShape.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="font-display text-2xl tracking-tight">By wall shape</h2>
          <ul className="flex flex-col gap-1">
            {byShape.map((row) => {
              const wr = winRate(row.wins, row.n);
              const title =
                row.key !== "unknown" && row.key in ARCHETYPE_META
                  ? ARCHETYPE_META[row.key as keyof typeof ARCHETYPE_META].title
                  : row.label;
              return (
                <li
                  key={row.key}
                  className="flex min-h-12 items-center justify-between gap-3 rounded-xl bg-card px-4 py-3 shadow-[var(--shadow-border)]"
                >
                  <span className="min-w-0 truncate text-sm capitalize">{title}</span>
                  <span className="shrink-0 font-mono text-sm tabular-nums text-muted-foreground">
                    {row.wins}W {row.n - row.wins}L
                    {wr !== null ? ` · ${wr}%` : ""}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl tracking-tight">Fights</h2>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                downloadFightDump(dump());
                toast("Saved crownpath-stats file");
              }}
            >
              Export
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                void copyFightDump(dump())
                  .then(() => toast("Copied. Paste it here."))
                  .catch(() => toast.error("Could not copy"));
              }}
            >
              Copy
            </Button>
            {matches.length > 0 ? (
              <Button size="sm" variant="ghost" onClick={clearMatches}>
                Clear
              </Button>
            ) : null}
          </div>
        </div>
        {matches.length === 0 ? (
          <Card>
            <CardContent className="p-5 text-sm text-muted-foreground">
              No new fights from Scout. Export still works from Admin → Stats.
            </CardContent>
          </Card>
        ) : (
          <ul className="flex flex-col gap-2">
            {matches.map((m) => (
              <li key={m.id}>
                <Card>
                  <CardContent className="flex flex-col gap-3 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={m.won ? "win" : "loss"}>{m.won ? "Win" : "Loss"}</Badge>
                        {m.recipeName ? (
                          <span className="text-sm text-muted-foreground">{m.recipeName}</span>
                        ) : null}
                      </div>
                      <span
                        className={`font-mono text-sm tabular-nums ${m.vpDelta >= 0 ? "text-win" : "text-loss"}`}
                      >
                        {m.vpDelta > 0 ? "+" : ""}
                        {m.vpDelta}
                      </span>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="mb-1 text-xs tracking-wider text-muted-foreground uppercase">
                          Enemy
                        </p>
                        <HeroRow ids={m.enemy} />
                      </div>
                      <div>
                        <p className="mb-1 text-xs tracking-wider text-muted-foreground uppercase">
                          You
                        </p>
                        <HeroRow ids={m.team} />
                      </div>
                    </div>
                    {m.note ? <p className="text-sm text-muted-foreground">{m.note}</p> : null}
                    <button
                      type="button"
                      onClick={() => removeMatch(m.id)}
                      className="min-h-11 self-end px-2 text-sm text-muted-foreground hover:text-foreground"
                    >
                      Remove
                    </button>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
