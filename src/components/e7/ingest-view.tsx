import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { HeroPortrait } from "@/components/hero-portrait";
import { EmptyNote, FilterChip, StatStrip, TOOLBAR } from "@/components/e7/chrome";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  applyDrafts,
  extractKits,
  ingestKeyStatus,
  listDrafts,
  setIngestKey,
} from "@/lib/e7/api";
import { useCatalog } from "@/lib/e7/catalog";
import { BATCH_MAX, FLAG_LABEL, PREFER_SLOTS, type HeroDraft, type PreferSlot } from "@/lib/e7/ingest";
import { isOwnerIdentity } from "@/lib/e7/owner";
import { useArenaStore } from "@/lib/e7/store";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { cn } from "@/lib/utils";

function todayStamp() {
  return new Date().toISOString().slice(0, 10);
}

export function IngestAdmin() {
  const heroes = useCatalog((s) => s.heroes);
  const email = useArenaStore((s) => s.email);
  const user = useCurrentUser();
  const owner = isOwnerIdentity(user?.primaryEmail, user?.displayName, email);
  const [text, setText] = useState("");
  const [mode, setMode] = useState<"kit" | "json">("kit");
  const [checkedAt, setCheckedAt] = useState(todayStamp);
  const [key, setKey] = useState("");
  const [configured, setConfigured] = useState(false);
  const [drafts, setDrafts] = useState<HeroDraft[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState<"extract" | "apply" | "key" | null>(null);
  const [model, setModel] = useState<string | null>(null);

  useEffect(() => {
    void ingestKeyStatus()
      .then((s) => setConfigured(s.configured))
      .catch(() => setConfigured(false));
    void listDrafts()
      .then((rows) => {
        setDrafts(rows);
        setSelected(rows.filter((d) => d.matched).map((d) => d.id));
      })
      .catch(() => setDrafts([]));
  }, []);

  const chosen = useMemo(
    () => drafts.filter((d) => selected.includes(d.id)).slice(0, BATCH_MAX),
    [drafts, selected],
  );

  function patchDraft(id: string, next: Partial<HeroDraft>) {
    setDrafts((cur) => cur.map((d) => (d.id === id ? { ...d, ...next } : d)));
  }

  async function saveKey() {
    setBusy("key");
    try {
      const next = await setIngestKey({ data: { key } });
      setConfigured(next.configured);
      setKey("");
      toast(next.configured ? "Groq key saved" : "Groq key cleared");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save key");
    } finally {
      setBusy(null);
    }
  }

  async function extract() {
    setBusy("extract");
    try {
      const next = await extractKits({ data: { text, checkedAt, mode } });
      setDrafts(next.heroes);
      setSelected(next.heroes.filter((d) => d.matched).map((d) => d.id));
      setModel(next.model ?? null);
      toast(`Extracted ${next.heroes.length} · review Watch and prefer before apply`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Extract failed");
    } finally {
      setBusy(null);
    }
  }

  async function apply() {
    if (!chosen.length) return;
    setBusy("apply");
    try {
      const next = await applyDrafts({ data: { heroes: chosen } });
      useCatalog.getState().setCatalog(next.catalog);
      setDrafts((cur) => cur.filter((d) => !next.applied.includes(d.id)));
      setSelected([]);
      if (next.sourceError) toast.error(`Scout updated. Source patch: ${next.sourceError}`);
      else toast(`Ingested ${next.applied.length}. No notice posted.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Apply failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <StatStrip
        items={[
          { label: "Pending", value: String(drafts.length) },
          { label: "Selected", value: `${chosen.length}/${BATCH_MAX}` },
          { label: "Groq", value: configured ? "Ready" : "No key" },
        ]}
      />
      <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
        Paste up to {BATCH_MAX} Journal kits. Groq drafts the catalog object. You confirm Watch and
        prefer, then apply. SuperGrok is only for a later source review if Watch was ticked. No
        guild notice is posted from here.
      </p>

      {owner ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="flex min-w-0 flex-1 flex-col gap-1.5">
            <Label>Groq API key</Label>
            <Input
              type="password"
              autoComplete="off"
              placeholder={configured ? "Saved · paste a new key to replace" : "gsk_…"}
              value={key}
              onChange={(e) => setKey(e.target.value)}
            />
          </label>
          <Button
            variant="secondary"
            disabled={busy !== null || (!key && !configured)}
            onClick={() => void saveKey()}
          >
            {busy === "key" ? "Saving…" : configured && !key ? "Clear key" : "Save key"}
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          {configured ? "Extractor is ready." : "Ask the owner to save a Groq key on this tab."}
        </p>
      )}

      <div className={TOOLBAR}>
        <FilterChip on={mode === "kit"} onClick={() => setMode("kit")}>
          Journal kit
        </FilterChip>
        <FilterChip on={mode === "json"} onClick={() => setMode("json")}>
          Draft JSON
        </FilterChip>
      </div>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={
          mode === "kit"
            ? "Paste Journal kits here, one hero after another. Separate with a blank line or ---."
            : "Paste drafts/YYYY-MM-DD.json"
        }
        className="min-h-40"
      />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <label className="flex flex-col gap-1.5 sm:w-44">
          <Label>Checked date</Label>
          <Input type="date" value={checkedAt} onChange={(e) => setCheckedAt(e.target.value)} />
        </label>
        <Button disabled={busy !== null || text.trim().length < 20} onClick={() => void extract()}>
          {busy === "extract" ? "Extracting…" : `Extract · max ${BATCH_MAX}`}
        </Button>
        {model ? <p className="text-xs text-muted-foreground sm:pb-3">{model}</p> : null}
      </div>

      {drafts.length === 0 ? (
        <EmptyNote>No pending drafts. Extract a paste, or come back to a saved batch.</EmptyNote>
      ) : (
        <ul className="flex flex-col gap-3">
          {drafts.map((draft) => (
            <DraftCard
              key={draft.id + draft.name}
              draft={draft}
              heroes={heroes}
              selected={selected.includes(draft.id)}
              onSelect={(on) =>
                setSelected((cur) => {
                  if (on) return cur.includes(draft.id) ? cur : [...cur, draft.id].slice(0, BATCH_MAX);
                  return cur.filter((id) => id !== draft.id);
                })
              }
              onChange={(next) => patchDraft(draft.id, next)}
            />
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-2">
        <Button disabled={busy !== null || chosen.length === 0} onClick={() => void apply()}>
          {busy === "apply" ? "Applying…" : `Apply ${chosen.length || ""}`.trim()}
        </Button>
        <Button
          variant="secondary"
          disabled={!drafts.length}
          onClick={() => setSelected(drafts.filter((d) => d.matched).map((d) => d.id).slice(0, BATCH_MAX))}
        >
          Select matched
        </Button>
      </div>
    </div>
  );
}

function DraftCard({
  draft,
  heroes,
  selected,
  onSelect,
  onChange,
}: {
  draft: HeroDraft;
  heroes: { id: string; name: string }[];
  selected: boolean;
  onSelect: (on: boolean) => void;
  onChange: (next: Partial<HeroDraft>) => void;
}) {
  const live = useCatalog.getState().heroes.find((h) => h.id === draft.id);

  return (
    <li
      className={cn(
        "flex flex-col gap-3 rounded-xl bg-card px-4 py-4 shadow-[var(--shadow-border)]",
        !draft.matched && "shadow-[var(--shadow-border)]",
      )}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          checked={selected}
          onCheckedChange={(v) => onSelect(v === true)}
          aria-label={`Select ${draft.name}`}
          className="mt-1 size-6"
        />
        {live ? <HeroPortrait hero={live} size="sm" /> : null}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{draft.name}</p>
          <p className="text-xs text-muted-foreground">
            {draft.matched ? draft.id : "Unmatched — pick a catalog unit"}
            {draft.baseSpeed ? ` · spd ${draft.baseSpeed}` : " · no speed"}
            {` · ${draft.tier}`}
          </p>
        </div>
      </div>
      {!draft.matched ? (
        <label className="flex flex-col gap-1.5">
          <Label>Catalog unit</Label>
          <select
            value={draft.id}
            onChange={(e) => {
              const hit = useCatalog.getState().heroes.find((h) => h.id === e.target.value);
              onChange({
                id: e.target.value,
                matched: Boolean(hit),
                name: hit?.name ?? draft.name,
                short: hit?.short ?? draft.short,
                element: hit?.element ?? draft.element,
                class: hit?.class ?? draft.class,
                defense: hit?.defense ?? draft.defense,
                offense: hit?.offense ?? draft.offense,
              });
            }}
            className="h-11 w-full rounded-md bg-secondary px-3 text-sm shadow-[var(--shadow-border)] outline-none"
          >
            <option value={draft.id}>Pick unit…</option>
            {heroes.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <p className="text-xs leading-relaxed text-muted-foreground">
        <span className="text-foreground">Roles</span> {draft.roles.join(", ") || "—"}
        {" · "}
        <span className="text-foreground">Tags</span> {draft.tags.join(", ") || "—"}
      </p>
      {draft.flags.length ? (
        <p className="text-xs text-muted-foreground">
          {draft.flags.map((f) => FLAG_LABEL[f] || f).join(" · ")}
        </p>
      ) : null}
      <label className="flex flex-col gap-1.5">
        <Label>Kit</Label>
        <Textarea value={draft.kit} onChange={(e) => onChange({ kit: e.target.value.slice(0, 800) })} />
      </label>
      <label className="flex flex-col gap-1.5">
        <Label>jobFor</Label>
        <Textarea
          value={draft.jobFor}
          onChange={(e) => onChange({ jobFor: e.target.value.slice(0, 400) })}
          className="min-h-20"
        />
      </label>
      <label className="flex items-start gap-3 text-sm">
        <Checkbox
          checked={draft.applyWatch}
          onCheckedChange={(v) => onChange({ applyWatch: v === true })}
          className="mt-0.5 size-6"
        />
        <span>
          <span className="font-medium">Watch</span>
          <span className="block text-xs text-muted-foreground">
            {draft.watch
              ? `${draft.watch.label} — ${draft.watch.note}`
              : "Groq did not propose one. Leave off unless play changes."}
          </span>
        </span>
      </label>
      <div>
        <p className="mb-2 text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">Prefer</p>
        <div className="flex flex-wrap gap-2">
          {PREFER_SLOTS.map((slot) => {
            const on = draft.prefer.includes(slot);
            return (
              <button
                key={slot}
                type="button"
                onClick={() =>
                  onChange({
                    prefer: on
                      ? draft.prefer.filter((s) => s !== slot)
                      : [...draft.prefer, slot].slice(0, 4) as PreferSlot[],
                  })
                }
                className={cn(
                  "inline-flex h-11 items-center rounded-full px-3.5 text-sm",
                  on ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground",
                )}
              >
                {slot}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Off unless they win that slot. Do not tick Frontline or Sustain if they would steal Mort or Diene.
        </p>
      </div>
    </li>
  );
}
