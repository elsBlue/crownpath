import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
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
import { IngestAdmin } from "@/components/e7/ingest-view";
import { JumpRail, groupByLetter } from "@/components/e7/jump-rail";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  deleteHero,
  deletePreset,
  deleteRecipe,
  deleteNotice,
  draftNoticeFromLog,
  listAdminLog,
  listAdminNotices,
  listMembers,
  listStrategyIdeas,
  saveHero,
  saveHeroIcon,
  saveNotice,
  savePreset,
  saveRecipe,
  saveStrategyIdea,
  setIngameName,
  setMemberRole,
  setStrategyIdeaStatus,
  deleteStrategyIdea,
} from "@/lib/e7/api";
import { useCatalog } from "@/lib/e7/catalog";
import { CLASS_LABEL, ELEMENT_LABEL, heroRarity } from "@/lib/e7/heroes";
import { fileToHeroIcon } from "@/lib/e7/icon";
import { isOwnerIdentity } from "@/lib/e7/owner";
import { useNotices } from "@/lib/e7/notices";
import { ARCHETYPE_META } from "@/lib/e7/recipes";
import { useArenaStore } from "@/lib/e7/store";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import {
  ARCHETYPE_IDS,
  EFFECT_IDS,
  EFFECT_LABEL,
  ROLE_IDS,
  TAG_IDS,
  type AdminLogRow,
  type DefensePreset,
  type GuildMember,
  type Hero,
  type NormalEffect,
  type Notice,
  type NoticeKind,
  type Recipe,
  type SlotNeed,
  type StrategyIdea,
  type StrategyIdeaStatus,
  NOTICE_KIND_LABEL,
  NOTICE_KINDS,
} from "@/lib/e7/types";
import { cn, daysAgoLabel } from "@/lib/utils";

type Tab = "units" | "ingest" | "strategies" | "ideas" | "updates" | "walls" | "members" | "log";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

function applyCatalog(next: { heroes: Hero[]; recipes: Recipe[]; presets: DefensePreset[] }) {
  useCatalog.getState().setCatalog(next);
}

function useEditorWide() {
  const [wide, setWide] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches,
  );
  useEffect(() => {
    const m = window.matchMedia("(min-width: 1024px)");
    const on = () => setWide(m.matches);
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return wide;
}

function EditorSheet({
  open,
  onClose,
  title,
  description,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const wide = useEditorWide();
  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <SheetContent side={wide ? "right" : "bottom"} className={cn("gap-0", wide && "max-w-2xl")}>
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          {description ? <SheetDescription>{description}</SheetDescription> : null}
        </SheetHeader>
        {children}
      </SheetContent>
    </Sheet>
  );
}

function SheetForm({ children, actions }: { children: ReactNode; actions: ReactNode }) {
  return (
    <>
      <div className="app-scroll min-h-0 flex-1 px-5 pb-4">{children}</div>
      <div className="shrink-0 border-t border-border/80 px-5 py-3">
        <div className="flex flex-wrap gap-2">{actions}</div>
      </div>
    </>
  );
}

export function AdminView() {
  const [tab, setTab] = useState<Tab>("units");
  return (
    <div className={PAGE}>
      <PageHeader kicker="Admin" title="Catalog">
        Units, lineup strategies, and example defenses are shared. Progress stays private.
      </PageHeader>
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["units", "Units"],
            ["ingest", "Ingest"],
            ["strategies", "Strategies"],
            ["ideas", "Ideas"],
            ["updates", "Updates"],
            ["walls", "Examples"],
            ["members", "Members"],
            ["log", "Log"],
          ] as const
        ).map(([id, label]) => (
          <FilterChip key={id} on={tab === id} onClick={() => setTab(id)}>
            {label}
          </FilterChip>
        ))}
      </div>
      {tab === "units" ? <HeroAdmin /> : null}
      {tab === "ingest" ? <IngestAdmin /> : null}
      {tab === "strategies" ? <RecipeAdmin /> : null}
      {tab === "ideas" ? <IdeaAdmin /> : null}
      {tab === "updates" ? <NoticeAdmin /> : null}
      {tab === "walls" ? <PresetAdmin /> : null}
      {tab === "members" ? <MemberAdmin /> : null}
      {tab === "log" ? <ActivityLog /> : null}
    </div>
  );
}

function HeroAdmin() {
  const heroes = useCatalog((s) => s.heroes);
  const [query, setQuery] = useState("");
  const [star, setStar] = useState<0 | 3 | 4 | 5>(0);
  const [editing, setEditing] = useState<Hero | null>(null);
  const [iconHero, setIconHero] = useState<Hero | null>(null);
  const starCounts = useMemo(() => {
    const counts = { 3: 0, 4: 0, 5: 0 };
    for (const h of heroes) counts[heroRarity(h)] += 1;
    return counts;
  }, [heroes]);
  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = q
      ? heroes.filter((h) => `${h.name} ${h.short} ${h.id}`.toLowerCase().includes(q))
      : heroes;
    if (star) rows = rows.filter((h) => heroRarity(h) === star);
    return [...rows].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
  }, [heroes, query, star]);
  const groups = useMemo(() => groupByLetter(list, (h) => h.name), [list]);
  const jumpItems = useMemo(
    () => groups.map((g) => ({ id: `az-${g.letter}`, label: g.letter })),
    [groups],
  );

  return (
    <div className={cn("flex flex-col gap-5", jumpItems.length > 1 && "pr-8 xl:pr-0")}>
      <StatStrip
        items={[
          { label: "Units", value: String(heroes.length) },
          { label: "Verified", value: String(heroes.filter((h) => h.verified).length) },
          { label: "Pending", value: String(heroes.filter((h) => !h.verified).length) },
          {
            label: "Shown",
            value: query || star ? `${list.length}` : String(heroes.length),
          },
        ]}
      />
      <div className={TOOLBAR}>
        {(
          [
            [0, "All", heroes.length],
            [5, "5★", starCounts[5]],
            [4, "4★", starCounts[4]],
            [3, "3★", starCounts[3]],
          ] as const
        ).map(([id, label, count]) => (
          <FilterChip key={id} on={star === id} onClick={() => setStar(id)}>
            {label} {count}
          </FilterChip>
        ))}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search units…" className="sm:flex-1" />
        <Button
          variant="secondary"
          onClick={() =>
            setEditing({
              id: "",
              name: "",
              short: "",
              element: "fire",
              class: "warrior",
              tier: "S",
              rarity: 5,
              roles: [],
              tags: [],
              effects: [],
              buffs: [],
              uniqueEffects: [],
              debuffs: [],
              kit: "",
              defense: 5,
              offense: 5,
              baseSpeed: undefined,
              icon: "",
              verified: false,
            })
          }
        >
          Add unit
        </Button>
      </div>
      <EditorSheet
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing && heroes.some((h) => h.id === editing.id) ? `Edit · ${editing.name}` : "New unit"}
        description="Kit, roles, and speed. Icon is separate — tap the portrait on the list."
      >
        {editing ? (
          <HeroForm
            key={editing.id || "new"}
            initial={editing}
            onClose={() => setEditing(null)}
            onSaved={() => setEditing(null)}
          />
        ) : null}
      </EditorSheet>
      <IconDialog hero={iconHero} onClose={() => setIconHero(null)} />
      <ul className={LIST}>
        {groups.map((group) => (
          <li key={group.letter} className="flex flex-col gap-1">
            <LetterHead letter={group.letter} />
            <ul className={LIST}>
              {group.rows.map((hero) => {
                const checked = daysAgoLabel(hero.checkedAt);
                return (
                  <li key={hero.id}>
                    <RowCard>
                      <button
                        type="button"
                        onClick={() => setIconHero(hero)}
                        className="shrink-0 rounded-md"
                        aria-label={`Edit icon · ${hero.name}`}
                      >
                        <HeroPortrait hero={hero} size="sm" />
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-1.5 text-sm font-medium">
                          <span className="truncate">{hero.name}</span>
                          {hero.verified ? (
                            <Star className="size-3.5 shrink-0 fill-current" strokeWidth={1.5} aria-label="In-game verified" />
                          ) : null}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {hero.verified
                            ? `Verified${checked ? ` · ${checked}` : ""} · `
                            : "Pending · "}
                          {ELEMENT_LABEL[hero.element]} {CLASS_LABEL[hero.class]} · {heroRarity(hero)}★
                        </p>
                      </div>
                      <Button variant="secondary" onClick={() => setEditing(hero)}>
                        Edit
                      </Button>
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
          {query.trim() || star
            ? `No units match${query.trim() ? ` “${query.trim()}”` : ""}${star ? ` · ${star}★` : ""}.`
            : "No units in the catalog."}{" "}
          {query.trim() || star ? (
            <button
              type="button"
              className="h-11 text-sm text-foreground underline-offset-4 hover:underline"
              onClick={() => {
                setQuery("");
                setStar(0);
              }}
            >
              Clear filters
            </button>
          ) : null}
        </EmptyNote>
      ) : null}
      {jumpItems.length > 1 ? <JumpRail items={jumpItems} /> : null}
    </div>
  );
}

function IconDialog({ hero, onClose }: { hero: Hero | null; onClose: () => void }) {
  const [icon, setIcon] = useState(hero?.icon ?? "");
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState(false);
  const [iconBusy, setIconBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIcon(hero?.icon ?? "");
    setFileName("");
  }, [hero]);

  async function save() {
    if (!hero) return;
    setBusy(true);
    try {
      const next = await saveHeroIcon({ data: { id: hero.id, icon } });
      applyCatalog(next);
      toast(icon ? "Icon saved" : "Icon removed");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save icon");
    } finally {
      setBusy(false);
    }
  }

  const preview: Hero | null = hero ? { ...hero, icon } : null;

  return (
    <Dialog open={Boolean(hero)} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Icon · {hero?.name ?? ""}</DialogTitle>
          <DialogDescription>
            This save only changes the icon. Kit, roles, and in-game verified stay as they are.
          </DialogDescription>
        </DialogHeader>
        {preview ? (
          <div className="flex items-center gap-3">
            <HeroPortrait hero={preview} size="lg" />
            <p className="text-xs text-muted-foreground">Square crop, face in the middle. 256×256 is enough.</p>
          </div>
        ) : null}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="sr-only"
          disabled={busy || iconBusy || !hero}
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            setIconBusy(true);
            void fileToHeroIcon(file)
              .then((next) => {
                setIcon(next);
                setFileName(file.name);
              })
              .catch((err) => toast.error(err instanceof Error ? err.message : "Could not read image"))
              .finally(() => setIconBusy(false));
          }}
        />
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={busy || iconBusy || !hero}
              onClick={() => fileRef.current?.click()}
            >
              {iconBusy ? "Reading…" : "Upload image"}
            </Button>
            {fileName ? (
              <span className="min-w-0 truncate text-xs text-muted-foreground">{fileName}</span>
            ) : null}
          </div>
          <Input
            value={icon.startsWith("data:") ? "" : icon}
            placeholder="Or paste an image URL"
            disabled={busy || !hero}
            onChange={(e) => {
              setIcon(e.target.value);
              setFileName("");
            }}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void save()} disabled={busy || iconBusy || !hero}>
            Save icon
          </Button>
          {icon ? (
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => {
                setIcon("");
                setFileName("");
              }}
            >
              Remove
            </Button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function HeroForm({
  initial,
  onClose,
  onSaved,
}: {
  initial: Hero;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isNew = !useCatalog.getState().heroes.some((h) => h.id === initial.id);
  const [form, setForm] = useState<Hero>({
    ...initial,
    icon: initial.icon ?? "",
    effects: initial.effects ?? [],
    buffs: initial.buffs ?? [],
    debuffs: initial.debuffs ?? [],
    uniqueEffects: initial.uniqueEffects ?? [],
  });
  const [busy, setBusy] = useState(false);

  function patch(next: Partial<Hero>) {
    setForm((cur) => {
      const merged = { ...cur, ...next };
      if (isNew && next.name && !cur.id) merged.id = slugify(next.name);
      if (isNew && next.name && !cur.short) merged.short = next.name.split(" ")[0] ?? next.name;
      return merged;
    });
  }

  async function save() {
    setBusy(true);
    try {
      const next = await saveHero({
        data: {
          ...form,
          icon: "",
          uniqueEffects: (form.uniqueEffects ?? []).filter((u) => u.name.trim()),
        },
      });
      applyCatalog(next);
      toast("Unit saved");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!form.id || isNew) return;
    setBusy(true);
    try {
      const next = await deleteHero({ data: { id: form.id } });
      applyCatalog(next);
      toast("Unit removed");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete");
    } finally {
      setBusy(false);
    }
  }

  return (
    <SheetForm
      actions={
        <>
          <Button onClick={() => void save()} disabled={busy || !form.id || !form.name}>
            Save
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
          {!isNew ? (
            <Button variant="destructive" onClick={() => void remove()} disabled={busy}>
              Delete
            </Button>
          ) : null}
        </>
      }
    >
      <div className="mb-4">
        <HeroPortrait hero={{ ...form, name: form.name || "New", short: form.short || "New" }} size="lg" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Name">
          <Input value={form.name} onChange={(e) => patch({ name: e.target.value })} />
        </Field>
        <Field label="Short">
          <Input value={form.short} onChange={(e) => patch({ short: e.target.value })} />
        </Field>
        <Field label="Id">
          <Input value={form.id} disabled={!isNew} onChange={(e) => patch({ id: slugify(e.target.value) })} />
        </Field>
        <Field label="Rarity">
          <NativeSelect
            value={String(heroRarity(form))}
            onChange={(v) => patch({ rarity: Number(v) as 3 | 4 | 5 })}
            options={["5", "4", "3"]}
            labels={{ "5": "5★", "4": "4★", "3": "3★" }}
          />
        </Field>
        <Field label="Tier">
          <NativeSelect value={form.tier} onChange={(v) => patch({ tier: v as Hero["tier"] })} options={["SS", "S", "A", "B"]} />
        </Field>
        <Field label="Element">
          <NativeSelect
            value={form.element}
            onChange={(v) => patch({ element: v as Hero["element"] })}
            options={Object.keys(ELEMENT_LABEL)}
            labels={ELEMENT_LABEL}
          />
        </Field>
        <Field label="Class">
          <NativeSelect
            value={form.class}
            onChange={(v) => patch({ class: v as Hero["class"] })}
            options={Object.keys(CLASS_LABEL)}
            labels={CLASS_LABEL}
          />
        </Field>
        <Field label="Defense 0–10">
          <Input type="number" min={0} max={10} value={form.defense} onChange={(e) => patch({ defense: Number(e.target.value) })} />
        </Field>
        <Field label="Offense 0–10">
          <Input type="number" min={0} max={10} value={form.offense} onChange={(e) => patch({ offense: Number(e.target.value) })} />
        </Field>
        <Field label="Base Speed">
          <Input
            type="number"
            min={70}
            max={160}
            value={form.baseSpeed ?? ""}
            onChange={(e) =>
              patch({
                baseSpeed: e.target.value === "" ? undefined : Number(e.target.value),
              })
            }
          />
        </Field>
      </div>
      <div className="mt-4">
        <Label>Roles</Label>
        <ChipSet values={ROLE_IDS} selected={form.roles} onToggle={(role) => {
          const on = form.roles.includes(role as Hero["roles"][number]);
          patch({ roles: on ? form.roles.filter((r) => r !== role) : [...form.roles, role as Hero["roles"][number]] });
        }} />
      </div>
      <div className="mt-4">
        <Label>Normal effects</Label>
        <p className="mt-1 text-xs text-muted-foreground">
          In-game Skill Effect filters. Buffs, debuffs, and unique effects come later.
        </p>
        <ChipSet
          values={EFFECT_IDS}
          selected={form.effects ?? []}
          labels={EFFECT_LABEL}
          onToggle={(value) => {
            const effect = value as NormalEffect;
            const on = (form.effects ?? []).includes(effect);
            patch({
              effects: on
                ? (form.effects ?? []).filter((e) => e !== effect)
                : [...(form.effects ?? []), effect],
            });
          }}
        />
      </div>
      <div className="mt-4">
        <Label>Tags</Label>
        <ChipSet values={TAG_IDS} selected={form.tags} onToggle={(tag) => {
          const on = form.tags.includes(tag as Hero["tags"][number]);
          patch({ tags: on ? form.tags.filter((t) => t !== tag) : [...form.tags, tag as Hero["tags"][number]] });
        }} />
      </div>
      <div className="mt-4">
        <Field label="Buffs">
          <Input
            value={(form.buffs ?? []).join(", ")}
            placeholder="Increase Speed, Immunity"
            onChange={(e) =>
              patch({
                buffs: e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
          />
        </Field>
        <p className="mt-1 text-xs text-muted-foreground">Comma-separated. In-game buff names.</p>
      </div>
      <div className="mt-4">
        <Field label="Debuffs">
          <Input
            value={(form.debuffs ?? []).join(", ")}
            placeholder="Decrease Defense, Seal, Cannot Buff"
            onChange={(e) =>
              patch({
                debuffs: e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
          />
        </Field>
        <p className="mt-1 text-xs text-muted-foreground">Comma-separated. In-game debuff names.</p>
      </div>
      <div className="mt-4">
        <Label>Unique effects</Label>
        <p className="mt-1 text-xs text-muted-foreground">Named kit effects that are not on the normal list.</p>
        <div className="mt-2 flex flex-col gap-3">
          {(form.uniqueEffects ?? []).map((item, index) => (
            <div key={index} className="rounded-xl bg-secondary/60 p-3">
              <div className="flex items-center justify-between gap-2">
                <Input
                  value={item.name}
                  placeholder="Name"
                  onChange={(e) => {
                    const next = [...(form.uniqueEffects ?? [])];
                    next[index] = { ...item, name: e.target.value };
                    patch({ uniqueEffects: next });
                  }}
                />
                <button
                  type="button"
                  className="h-11 shrink-0 px-2 text-sm text-muted-foreground hover:text-foreground"
                  onClick={() =>
                    patch({ uniqueEffects: (form.uniqueEffects ?? []).filter((_, i) => i !== index) })
                  }
                >
                  Remove
                </button>
              </div>
              <Textarea
                className="mt-2"
                value={item.text}
                placeholder="What it does"
                onChange={(e) => {
                  const next = [...(form.uniqueEffects ?? [])];
                  next[index] = { ...item, text: e.target.value };
                  patch({ uniqueEffects: next });
                }}
              />
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              patch({ uniqueEffects: [...(form.uniqueEffects ?? []), { name: "", text: "" }] })
            }
          >
            Add unique
          </Button>
        </div>
      </div>
      <div className="mt-4">
        <Field label="Kit note">
          <Textarea value={form.kit} onChange={(e) => patch({ kit: e.target.value })} />
        </Field>
      </div>
      <label className="mt-4 flex items-start gap-3 rounded-xl bg-secondary/60 px-4 py-3">
        <Checkbox
          checked={Boolean(form.verified)}
          onCheckedChange={(v) => patch({ verified: v === true })}
          className="mt-0.5"
        />
        <span>
          <span className="flex items-center gap-1.5 text-sm">
            <Star className={form.verified ? "size-3.5 fill-current" : "size-3.5"} strokeWidth={1.5} />
            In-game verified
          </span>
          <span className="mt-0.5 block text-xs text-muted-foreground">
            Kit is the same as the journal. Saving with this on stamps today{form.verified && daysAgoLabel(form.checkedAt) ? ` (last: ${daysAgoLabel(form.checkedAt)})` : ""}.
          </span>
        </span>
      </label>
    </SheetForm>
  );
}

function RecipeAdmin() {
  const recipes = useCatalog((s) => s.recipes);
  const me = useCurrentUser();
  const [editing, setEditing] = useState<Recipe | null>(null);
  const [filter, setFilter] = useState<"all" | "mine">("all");
  const blank: Recipe = {
    id: "",
    name: "",
    vs: [],
    summary: "",
    wincon: "",
    setup: "",
    pitfalls: [],
    slots: [
      { label: "One", prefer: [], roles: [], tags: [] },
      { label: "Two", prefer: [], roles: [], tags: [] },
      { label: "Three", prefer: [], roles: [], tags: [] },
      { label: "Four", prefer: [], roles: [], tags: [] },
    ],
  };
  const list =
    filter === "mine" && me?.id
      ? recipes.filter((r) => r.createdBy === me.id)
      : recipes;
  return (
    <div className="flex flex-col gap-5">
      <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">
        Lineup plans we try into a wall type. Eight seeds. Not example enemy teams.
      </p>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className={TOOLBAR}>
          {(["all", "mine"] as const).map((id) => (
            <FilterChip key={id} on={filter === id} onClick={() => setFilter(id)}>
              {id === "all" ? "All" : "Mine"}
            </FilterChip>
          ))}
        </div>
        <Button variant="secondary" onClick={() => setEditing(blank)}>Add strategy</Button>
      </div>
      <EditorSheet
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing && recipes.some((r) => r.id === editing.id) ? `Edit · ${editing.name}` : "New strategy"}
        description="Lineup plan vs a wall type. Not an example enemy team."
      >
        {editing ? (
          <RecipeForm
            key={editing.id || "new"}
            initial={editing}
            onClose={() => setEditing(null)}
            onSaved={() => setEditing(null)}
          />
        ) : null}
      </EditorSheet>
      <ul className={LIST}>
        {list.map((recipe) => (
          <li key={recipe.id}>
            <RowCard>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{recipe.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {recipe.author || "Catalog"}
                  {recipe.vs.length > 0
                    ? ` · ${recipe.vs.map((v) => ARCHETYPE_META[v]?.title ?? v).join(", ")}`
                    : ""}
                </p>
              </div>
              <Button size="sm" variant="secondary" onClick={() => setEditing(recipe)}>
                Edit
              </Button>
            </RowCard>
          </li>
        ))}
        {list.length === 0 ? (
          <li className="rounded-xl bg-card px-3 py-5 text-sm text-muted-foreground shadow-[var(--shadow-border)]">
            {filter === "mine" ? "No strategies saved under your account yet." : "No strategies."}
          </li>
        ) : null}
      </ul>
    </div>
  );
}

function RecipeForm({
  initial,
  onClose,
  onSaved,
}: {
  initial: Recipe;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isNew = !useCatalog.getState().recipes.some((r) => r.id === initial.id);
  const [form, setForm] = useState<Recipe>(initial);
  const [busy, setBusy] = useState(false);
  const pitfallsText = form.pitfalls.join("\n");

  async function save() {
    setBusy(true);
    try {
      const next = await saveRecipe({
        data: {
          ...form,
          slots: form.slots.map((s) => ({
            label: s.label,
            roles: s.roles ?? [],
            tags: s.tags ?? [],
            prefer: s.prefer ?? [],
          })),
        },
      });
      applyCatalog(next);
      toast("Strategy saved");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!form.id || isNew) return;
    setBusy(true);
    try {
      const next = await deleteRecipe({ data: { id: form.id } });
      applyCatalog(next);
      toast("Strategy removed");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete");
    } finally {
      setBusy(false);
    }
  }

  function setSlot(index: number, next: SlotNeed) {
    const slots = [...form.slots] as Recipe["slots"];
    slots[index] = next;
    setForm({ ...form, slots });
  }

  return (
    <SheetForm
      actions={
        <>
          <Button onClick={() => void save()} disabled={busy || !form.id || !form.name}>
            Save
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
          {!isNew ? (
            <Button variant="destructive" onClick={() => void remove()} disabled={busy}>
              Delete
            </Button>
          ) : null}
        </>
      }
    >
      <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Name">
          <Input
            value={form.name}
            onChange={(e) =>
              setForm({
                ...form,
                name: e.target.value,
                id: isNew && !form.id ? slugify(e.target.value) : form.id,
              })
            }
          />
        </Field>
        <Field label="Id">
          <Input value={form.id} disabled={!isNew} onChange={(e) => setForm({ ...form, id: slugify(e.target.value) })} />
        </Field>
      </div>
      <div>
        <Label>Works vs</Label>
        <ChipSet
          values={ARCHETYPE_IDS}
          selected={form.vs}
          labels={Object.fromEntries(ARCHETYPE_IDS.map((id) => [id, ARCHETYPE_META[id].title]))}
          onToggle={(id) => {
            const on = form.vs.includes(id as Recipe["vs"][number]);
            setForm({
              ...form,
              vs: on ? form.vs.filter((v) => v !== id) : [...form.vs, id as Recipe["vs"][number]],
            });
          }}
        />
      </div>
      <Field label="Summary">
        <Textarea value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
      </Field>
      <Field label="Wincon">
        <Textarea value={form.wincon} onChange={(e) => setForm({ ...form, wincon: e.target.value })} />
      </Field>
      <Field label="Setup">
        <Textarea value={form.setup} onChange={(e) => setForm({ ...form, setup: e.target.value })} />
      </Field>
      <Field label="Breaks if (one per line)">
        <Textarea value={pitfallsText} onChange={(e) => setForm({ ...form, pitfalls: e.target.value.split("\n").filter(Boolean) })} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        {form.slots.map((slot, i) => (
          <div key={i} className="rounded-lg bg-secondary p-3">
            <Field label={`Slot ${i + 1}`}>
              <Input value={slot.label} onChange={(e) => setSlot(i, { ...slot, label: e.target.value })} />
            </Field>
            <Field label="Preferred ids">
              <Input
                value={(slot.prefer ?? []).join(", ")}
                onChange={(e) =>
                  setSlot(i, {
                    ...slot,
                    prefer: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                  })
                }
                placeholder="harsetti, belian"
              />
            </Field>
          </div>
        ))}
      </div>
      </div>
    </SheetForm>
  );
}

function PresetAdmin() {
  const presets = useCatalog((s) => s.presets);
  const heroes = useCatalog((s) => s.heroes);
  const [editing, setEditing] = useState<DefensePreset | null>(null);
  return (
    <div className="flex flex-col gap-5">
      <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">
        Ready-made enemy teams for Scout. These are not the eight wall types, and not lineup strategies.
      </p>
      <div className="flex justify-end">
        <Button variant="secondary" onClick={() => setEditing({ id: "", name: "", heroIds: ["", "", "", ""], blurb: "" })}>
          Add example
        </Button>
      </div>
      <EditorSheet
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing && presets.some((p) => p.id === editing.id) ? `Edit · ${editing.name}` : "New example"}
        description="Ready-made enemy team for Scout."
      >
        {editing ? (
          <PresetForm
            key={editing.id || "new"}
            initial={editing}
            heroes={heroes}
            onClose={() => setEditing(null)}
            onSaved={() => setEditing(null)}
          />
        ) : null}
      </EditorSheet>
      <ul className={LIST}>
        {presets.map((p) => (
          <li key={p.id}>
            <RowCard>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{p.name}</p>
                <p className="truncate text-xs text-muted-foreground">{p.heroIds.filter(Boolean).join(" · ")}</p>
              </div>
              <Button size="sm" variant="secondary" onClick={() => setEditing(p)}>
                Edit
              </Button>
            </RowCard>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PresetForm({
  initial,
  heroes,
  onClose,
  onSaved,
}: {
  initial: DefensePreset;
  heroes: Hero[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isNew = !useCatalog.getState().presets.some((p) => p.id === initial.id);
  const [form, setForm] = useState<DefensePreset>({
    ...initial,
    heroIds: [...initial.heroIds, "", "", "", ""].slice(0, 4),
  });
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      const next = await savePreset({ data: form });
      applyCatalog(next);
      toast("Example saved");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!form.id || isNew) return;
    setBusy(true);
    try {
      const next = await deletePreset({ data: { id: form.id } });
      applyCatalog(next);
      toast("Example removed");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete");
    } finally {
      setBusy(false);
    }
  }

  return (
    <SheetForm
      actions={
        <>
          <Button onClick={() => void save()} disabled={busy || !form.name || form.heroIds.filter(Boolean).length < 4}>
            Save
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
          {!isNew ? (
            <Button variant="destructive" onClick={() => void remove()} disabled={busy}>
              Delete
            </Button>
          ) : null}
        </>
      }
    >
      <div className="flex flex-col gap-3">
      <Field label="Name">
        <Input
          value={form.name}
          onChange={(e) =>
            setForm({
              ...form,
              name: e.target.value,
              id: isNew && !form.id ? slugify(e.target.value) : form.id,
            })
          }
        />
      </Field>
      <Field label="Blurb">
        <Input value={form.blurb} onChange={(e) => setForm({ ...form, blurb: e.target.value })} />
      </Field>
      <div className="grid gap-2 sm:grid-cols-2">
        {form.heroIds.map((id, i) => (
          <Field key={i} label={`Unit ${i + 1}`}>
            <NativeSelect
              value={id}
              onChange={(v) => {
                const heroIds = [...form.heroIds];
                heroIds[i] = v;
                setForm({ ...form, heroIds });
              }}
              options={["", ...heroes.map((h) => h.id)]}
              labels={Object.fromEntries(heroes.map((h) => [h.id, h.name]))}
            />
          </Field>
        ))}
      </div>
      </div>
    </SheetForm>
  );
}

function IdeaAdmin() {
  const [ideas, setIdeas] = useState<StrategyIdea[] | null>(null);
  const [filter, setFilter] = useState<StrategyIdeaStatus | "all">("inbox");
  const [body, setBody] = useState("");
  const [about, setAbout] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void listStrategyIdeas()
      .then(setIdeas)
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : "Could not load ideas");
        setIdeas([]);
      });
  }, []);

  const counts = useMemo(() => {
    const list = ideas ?? [];
    return {
      inbox: list.filter((i) => i.status === "inbox").length,
      later: list.filter((i) => i.status === "later").length,
      keep: list.filter((i) => i.status === "keep").length,
      skip: list.filter((i) => i.status === "skip").length,
    };
  }, [ideas]);

  const shown = useMemo(() => {
    if (!ideas) return [];
    if (filter === "all") return ideas;
    return ideas.filter((i) => i.status === filter);
  }, [ideas, filter]);

  async function submit() {
    const nextBody = body.trim();
    if (nextBody.length < 8) {
      toast.error("Write a bit more — at least a sentence.");
      return;
    }
    setBusy(true);
    try {
      const next = await saveStrategyIdea({
        data: { body: nextBody, about: about.trim() },
      });
      setIdeas(next);
      setBody("");
      setAbout("");
      setFilter("inbox");
      toast("Logged. Ask in chat to review.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3 rounded-xl bg-card px-4 py-4 shadow-[var(--shadow-border)]">
        <div>
          <h2 className="font-display text-lg tracking-tight">Log a thought</h2>
          <p className="mt-1 max-w-lg text-sm leading-relaxed text-muted-foreground">
            Recipes, Watches, walls. Not a lineup. Review happens in chat — Keep, Skip, or Later with why.
          </p>
        </div>
        <Field label="Thought">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={2000}
            rows={5}
            placeholder="Put ML.Luluca on the anti-revive strip list because…"
          />
        </Field>
        <Field label="About (optional)">
          <Input
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            maxLength={120}
            placeholder="Harsetti stall · Strip"
          />
        </Field>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => void submit()} disabled={busy || body.trim().length < 8}>
            Log
          </Button>
          <p className="font-mono text-xs tabular-nums text-muted-foreground">{body.trim().length}/2000</p>
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["inbox", "Inbox", counts.inbox],
            ["later", "Later", counts.later],
            ["keep", "Keep", counts.keep],
            ["skip", "Skip", counts.skip],
            ["all", "All", ideas?.length ?? 0],
          ] as const
        ).map(([id, label, n]) => (
          <FilterChip key={id} on={filter === id} onClick={() => setFilter(id)}>
            {label}
            <span className="ml-1.5 font-mono tabular-nums opacity-70">{n}</span>
          </FilterChip>
        ))}
      </div>

      {!ideas ? (
        <p className="text-sm text-muted-foreground">Loading ideas…</p>
      ) : shown.length === 0 ? (
        <p className="rounded-xl bg-card px-4 py-5 text-sm text-muted-foreground shadow-[var(--shadow-border)]">
          {filter === "inbox"
            ? "Inbox is empty. Log a thought above, then ask in chat to review."
            : filter === "all"
              ? "No ideas yet."
              : `Nothing in ${filter}.`}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {shown.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} onChange={setIdeas} />
          ))}
        </ul>
      )}
    </div>
  );
}

const STATUS_LABEL: Record<StrategyIdeaStatus, string> = {
  inbox: "Inbox",
  later: "Later",
  keep: "Keep",
  skip: "Skip",
};

function IdeaCard({
  idea,
  onChange,
}: {
  idea: StrategyIdea;
  onChange: (next: StrategyIdea[]) => void;
}) {
  const [verdict, setVerdict] = useState(idea.verdict);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setVerdict(idea.verdict);
  }, [idea.verdict]);

  async function setStatus(status: StrategyIdeaStatus) {
    setBusy(true);
    try {
      const next = await setStrategyIdeaStatus({
        data: { id: idea.id, status, verdict: verdict.trim() },
      });
      onChange(next);
      toast(
        status === "keep"
          ? "Kept"
          : status === "skip"
            ? "Skipped"
            : status === "later"
              ? "Later"
              : "Back in inbox",
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      const next = await deleteStrategyIdea({ data: { id: idea.id } });
      onChange(next);
      toast("Removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete");
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="flex flex-col gap-3 rounded-xl bg-card px-4 py-4 shadow-[var(--shadow-border)]">
      <div>
        {idea.about ? (
          <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">{idea.about}</p>
        ) : null}
        <p className="mt-1 text-sm leading-relaxed whitespace-pre-wrap">{idea.body}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          {idea.author} · {ago(idea.at)} · {STATUS_LABEL[idea.status]}
        </p>
      </div>
      <Field label="Verdict (from chat)">
        <Textarea
          value={verdict}
          onChange={(e) => setVerdict(e.target.value)}
          maxLength={800}
          rows={2}
          placeholder="Why we kept, skipped, or parked this…"
        />
      </Field>
      <div className="flex flex-wrap gap-2">
        <Button
          variant={idea.status === "keep" ? "default" : "secondary"}
          disabled={busy}
          onClick={() => void setStatus("keep")}
        >
          Keep
        </Button>
        <Button
          variant={idea.status === "later" ? "default" : "secondary"}
          disabled={busy}
          onClick={() => void setStatus("later")}
        >
          Later
        </Button>
        <Button
          variant={idea.status === "skip" ? "default" : "secondary"}
          disabled={busy}
          onClick={() => void setStatus("skip")}
        >
          Skip
        </Button>
        {idea.status !== "inbox" ? (
          <Button variant="ghost" disabled={busy} onClick={() => void setStatus("inbox")}>
            Inbox
          </Button>
        ) : null}
        <Button variant="ghost" disabled={busy} onClick={() => void remove()}>
          Delete
        </Button>
      </div>
    </li>
  );
}

function NoticeAdmin() {
  const empty = {
    id: "",
    kind: "catalog" as NoticeKind,
    title: "",
    body: "",
    published: true,
  };
  const [form, setForm] = useState(empty);
  const [list, setList] = useState<Notice[] | null>(null);
  const [filter, setFilter] = useState<"live" | "draft" | "all">("live");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void listAdminNotices()
      .then(setList)
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : "Could not load updates");
        setList([]);
      });
  }, []);

  const counts = useMemo(() => {
    const rows = list ?? [];
    return {
      live: rows.filter((n) => n.published).length,
      draft: rows.filter((n) => !n.published).length,
      all: rows.length,
    };
  }, [list]);

  const shown = useMemo(() => {
    if (!list) return [];
    if (filter === "all") return list;
    if (filter === "draft") return list.filter((n) => !n.published);
    return list.filter((n) => n.published);
  }, [list, filter]);

  async function publish() {
    const title = form.title.trim();
    const body = form.body.trim();
    if (title.length < 3) {
      toast.error("Title needs a few words.");
      return;
    }
    if (body.length < 8) {
      toast.error("Write what actually changed — a sentence at least.");
      return;
    }
    setBusy(true);
    try {
      const next = await saveNotice({
        data: {
          id: form.id || undefined,
          kind: form.kind,
          title,
          body,
          published: form.published,
        },
      });
      setList(next);
      setForm(empty);
      setFilter(form.published ? "live" : "draft");
      void useNotices.getState().refresh();
      toast(form.published ? "Published to the bell" : "Saved draft");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  async function fillFromLog() {
    setBusy(true);
    try {
      const draft = await draftNoticeFromLog();
      if (!draft) {
        toast.error("Nothing in the last day. Write it by hand.");
        return;
      }
      setForm((cur) => ({
        ...cur,
        body: cur.body.trim() ? `${cur.body.trim()}\n${draft}` : draft,
        title: cur.title || "Catalog notes",
        kind: cur.kind || "catalog",
      }));
      toast("Log pasted — edit before you publish.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not read log");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setBusy(true);
    try {
      const next = await deleteNotice({ data: { id } });
      setList(next);
      if (form.id === id) setForm(empty);
      void useNotices.getState().refresh();
      toast("Removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3 rounded-xl bg-card px-4 py-4 shadow-[var(--shadow-border)]">
        <div>
          <h2 className="font-display text-lg tracking-tight">
            {form.id ? "Edit update" : "Write an update"}
          </h2>
          <p className="mt-1 max-w-lg text-sm leading-relaxed text-muted-foreground">
            Members see this on the bell — what changed in a kit or Scout, not every save.
            Editing a live note does not ping again.
          </p>
        </div>
        <Field label="Kind">
          <NativeSelect
            value={form.kind}
            onChange={(v) => setForm({ ...form, kind: v as NoticeKind })}
            options={[...NOTICE_KINDS]}
            labels={NOTICE_KIND_LABEL}
          />
        </Field>
        <Field label="Title">
          <Input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            maxLength={80}
            placeholder="Beehoo verified — Cannot Buff, not Seal"
          />
        </Field>
        <Field label="What changed">
          <Textarea
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            maxLength={2000}
            rows={5}
            placeholder="Speed 120. Incinerate is self-only. Flame Keeper +20% on his turn."
          />
        </Field>
        <label className="flex h-11 items-center gap-2 text-sm">
          <Checkbox
            checked={form.published}
            onCheckedChange={(v) => setForm({ ...form, published: v === true })}
          />
          Publish to members
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => void publish()} disabled={busy || form.title.trim().length < 3}>
            {form.published ? "Publish" : "Save draft"}
          </Button>
          <Button variant="secondary" disabled={busy} onClick={() => void fillFromLog()}>
            Fill from today’s log
          </Button>
          {form.id ? (
            <Button variant="ghost" disabled={busy} onClick={() => setForm(empty)}>
              Cancel
            </Button>
          ) : null}
          <p className="font-mono text-xs tabular-nums text-muted-foreground">{form.body.trim().length}/2000</p>
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["live", "Live", counts.live],
            ["draft", "Drafts", counts.draft],
            ["all", "All", counts.all],
          ] as const
        ).map(([id, label, n]) => (
          <FilterChip key={id} on={filter === id} onClick={() => setFilter(id)}>
            {label}
            <span className="ml-1.5 font-mono tabular-nums opacity-70">{n}</span>
          </FilterChip>
        ))}
      </div>

      {!list ? (
        <p className="text-sm text-muted-foreground">Loading updates…</p>
      ) : shown.length === 0 ? (
        <EmptyNote>
          {filter === "live"
            ? "Nothing live. Publish above when a kit or Scout change is worth telling the guild."
            : filter === "draft"
              ? "No drafts."
              : "No updates yet."}
        </EmptyNote>
      ) : (
        <ul className="flex flex-col gap-2">
          {shown.map((n) => (
            <li
              key={n.id}
              className="flex flex-col gap-3 rounded-xl bg-card px-4 py-4 shadow-[var(--shadow-border)]"
            >
              <div>
                <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
                  {NOTICE_KIND_LABEL[n.kind]} · {n.published ? "Live" : "Draft"}
                </p>
                <p className="mt-1 text-sm font-medium">{n.title}</p>
                <p className="mt-1 text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                  {n.body}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {n.author} · {ago(n.at)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  disabled={busy}
                  onClick={() =>
                    setForm({
                      id: n.id,
                      kind: n.kind,
                      title: n.title,
                      body: n.body,
                      published: n.published,
                    })
                  }
                >
                  Edit
                </Button>
                <Button variant="ghost" disabled={busy} onClick={() => void remove(n.id)}>
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MemberAdmin() {
  const me = useArenaStore((s) => s.role);
  const email = useArenaStore((s) => s.email);
  const user = useCurrentUser();
  const owner = isOwnerIdentity(user?.primaryEmail, user?.displayName, email);
  const [members, setMembers] = useState<GuildMember[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    void listMembers()
      .then(setMembers)
      .catch(() => {
        toast.error("Could not load members");
        setMembers([]);
      });
  }, []);

  async function toggle(member: GuildMember) {
    const nextRole = member.role === "admin" ? "member" : "admin";
    setBusyId(member.userId);
    try {
      const next = await setMemberRole({ data: { userId: member.userId, role: nextRole } });
      setMembers(next);
      toast(nextRole === "admin" ? "Promoted to admin" : "Moved to member");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update role");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {owner ? (
        <p className="text-sm text-muted-foreground">
          In-game names are yours to set, including your own. Everyone else sees them in the log.
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">In-game names are set by the owner.</p>
      )}
      <ul className={LIST}>
        {(members ?? []).map((m) => (
          <li key={m.userId}>
            <RowCard className="flex-col items-stretch sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {m.ingameName || m.displayName || m.email || m.userId}
                </p>
                <p className="truncate text-xs text-muted-foreground">{m.email ?? m.userId}</p>
                {owner ? (
                  <IngameNameField member={m} onSaved={setMembers} />
                ) : null}
              </div>
              <Button
                size="sm"
                variant={m.role === "admin" ? "default" : "secondary"}
                disabled={
                  busyId === m.userId ||
                  (m.role === "admin" && me === "admin" && (members ?? []).filter((x) => x.role === "admin").length === 1)
                }
                onClick={() => void toggle(m)}
              >
                {m.role === "admin" ? "Admin" : "Member"}
              </Button>
            </RowCard>
          </li>
        ))}
        {!members ? (
          <li>
            <EmptyNote>Loading members…</EmptyNote>
          </li>
        ) : members.length === 0 ? (
          <li>
            <EmptyNote>No members yet.</EmptyNote>
          </li>
        ) : null}
      </ul>
    </div>
  );
}

function IngameNameField({
  member,
  onSaved,
}: {
  member: GuildMember;
  onSaved: (next: GuildMember[]) => void;
}) {
  const [value, setValue] = useState(member.ingameName ?? "");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setValue(member.ingameName ?? "");
  }, [member.ingameName]);

  async function save() {
    const next = value.trim();
    if (next === (member.ingameName ?? "")) return;
    setBusy(true);
    try {
      const list = await setIngameName({ data: { userId: member.userId, name: next } });
      onSaved(list);
      toast(next ? `In-game name · ${next}` : "In-game name cleared");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save name");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-2 flex gap-2">
      <Input
        value={value}
        maxLength={24}
        placeholder="In-game name"
        disabled={busy}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            void save();
          }
        }}
      />
      <Button size="sm" variant="secondary" disabled={busy} onClick={() => void save()}>
        Save
      </Button>
    </div>
  );
}

function ago(at: number): string {
  const s = Math.max(0, Math.floor((Date.now() - at) / 1000));
  if (s < 45) return "just now";
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)}d`;
  return new Date(at).toLocaleDateString();
}

function ActivityLog() {
  const [rows, setRows] = useState<AdminLogRow[] | null>(null);

  useEffect(() => {
    void listAdminLog()
      .then(setRows)
      .catch(() => {
        toast.error("Could not load log");
        setRows([]);
      });
  }, []);

  if (!rows) {
    return <p className="text-sm text-muted-foreground">Loading log…</p>;
  }

  if (rows.length === 0) {
    return (
      <p className="rounded-xl bg-card px-4 py-5 text-sm text-muted-foreground shadow-[var(--shadow-border)]">
        No admin changes yet. Saves, icons, roles, and names show up here — batched if the same admin does several in a row.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-1">
      {rows.map((row) => (
        <li
          key={row.id}
          className="flex items-baseline justify-between gap-3 rounded-xl bg-card px-4 py-3 shadow-[var(--shadow-border)]"
        >
          <div className="min-w-0">
            <p className="truncate text-sm">{row.summary}</p>
            <p className="truncate text-xs text-muted-foreground">{row.actor}</p>
          </div>
          <p className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">{ago(row.at)}</p>
        </li>
      ))}
    </ul>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
    </label>
  );
}

function NativeSelect({
  value,
  onChange,
  options,
  labels,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  labels?: Record<string, string>;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-11 w-full rounded-md bg-secondary px-3 text-sm shadow-[var(--shadow-border)] outline-none"
    >
      {options.map((opt) => (
        <option key={opt || "empty"} value={opt}>
          {opt === "" ? "—" : labels?.[opt] ?? opt}
        </option>
      ))}
    </select>
  );
}

function ChipSet({
  values,
  selected,
  onToggle,
  labels,
}: {
  values: readonly string[];
  selected: readonly string[];
  onToggle: (value: string) => void;
  labels?: Record<string, string>;
}) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {values.map((value) => {
        const on = selected.includes(value);
        return (
          <button
            key={value}
            type="button"
            onClick={() => onToggle(value)}
            className={cn(
              "h-11 rounded-full px-3 text-xs",
              on ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground",
            )}
          >
            {labels?.[value] ?? value.replace(/-/g, " ")}
          </button>
        );
      })}
    </div>
  );
}
