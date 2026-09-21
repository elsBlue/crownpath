import { create } from "zustand";
import { SAMPLE_ROSTER } from "./heroes";
import { DEFAULT_VP } from "./ranks";
import { saveArena } from "./api";
import type { ArenaPayload } from "./api";
import type { ScoutMode } from "./formation";
import type { MemberRole, RosterEntry } from "./types";

type ArenaState = {
  hydrated: boolean;
  role: MemberRole;
  email: string | null;
  roster: Record<string, RosterEntry>;
  scoutMode: ScoutMode;
  enemy: string[];
  enemyArena: string[];
  enemyGw: string[];
  enemyGw2: string[];
  gwRound: 1 | 2;
  lastTeam: string[];
  vp: number;
  restrictToRoster: boolean;
  applyServer: (payload: ArenaPayload) => void;
  resetSession: () => void;
  setScoutMode: (mode: ScoutMode) => void;
  setGwRound: (round: 1 | 2) => void;
  setGwSlot: (round: 1 | 2, index: number, id: string | null) => void;
  setEnemySlot: (index: number, id: string | null) => void;
  setEnemy: (ids: string[]) => void;
  clearWall: () => void;
  toggleBuilt: (id: string) => void;
  loadPresetRoster: (kind: "challenger" | "clear") => void;
  setRestrict: (v: boolean) => void;
};

function pad(ids: string[], n: number): string[] {
  const next = Array.from({ length: n }, () => "");
  ids.slice(0, n).forEach((id, i) => {
    next[i] = id ?? "";
  });
  return next;
}

function emptyArena(): string[] {
  return ["", "", "", ""];
}

function emptyGw(): string[] {
  return ["", "", "", ""];
}

function clampGw(ids: string[]): string[] {
  const next = pad(ids, 4);
  let n = 0;
  return next.map((id) => {
    if (!id) return "";
    n += 1;
    return n <= 3 ? id : "";
  });
}

function rosterFrom(ids: readonly string[]): Record<string, RosterEntry> {
  const next: Record<string, RosterEntry> = {};
  for (const id of ids) next[id] = { owned: true, built: true };
  return next;
}

const emptyState = {
  hydrated: false,
  role: "member" as MemberRole,
  email: null as string | null,
  roster: {},
  scoutMode: "gw" as ScoutMode,
  enemy: emptyGw(),
  enemyArena: emptyArena(),
  enemyGw: emptyGw(),
  enemyGw2: emptyGw(),
  gwRound: 1 as 1 | 2,
  lastTeam: emptyArena(),
  vp: DEFAULT_VP,
  restrictToRoster: false,
};

let saveTimer: ReturnType<typeof setTimeout> | undefined;

function persistState() {
  if (typeof window === "undefined") return;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const s = useArenaStore.getState();
    if (!s.hydrated) return;
    void saveArena({
      data: {
        vp: s.vp,
        restrictToRoster: s.restrictToRoster,
        enemy: s.enemyArena,
        lastTeam: emptyArena(),
        roster: s.roster,
        scoutMode: s.scoutMode,
        enemyGw: s.enemyGw,
        enemyGw2: s.enemyGw2,
        gwRound: s.gwRound,
      },
    }).catch(() => {
      /* keep local copy; next edit retries */
    });
  }, 400);
}

export const useArenaStore = create<ArenaState>((set, get) => ({
  ...emptyState,
  applyServer: (payload) => {
    const mode = payload.scoutMode ?? "gw";
    const enemyArena = pad(payload.enemyArena?.length ? payload.enemyArena : payload.enemy, 4);
    const enemyGw = clampGw(payload.enemyGw ?? []);
    const enemyGw2 = clampGw(payload.enemyGw2 ?? []);
    const gwRound = payload.gwRound === 2 ? 2 : 1;
    set({
      hydrated: true,
      role: payload.role,
      email: payload.email,
      roster: payload.roster,
      scoutMode: mode,
      enemyArena,
      enemyGw,
      enemyGw2,
      gwRound,
      enemy: mode === "gw" ? (gwRound === 2 ? enemyGw2 : enemyGw) : enemyArena,
      lastTeam: payload.lastTeam,
      vp: payload.vp,
      restrictToRoster: payload.restrictToRoster,
    });
  },
  resetSession: () => set({ ...emptyState }),
  setScoutMode: (mode) => {
    const s = get();
    const enemy =
      mode === "gw" ? (s.gwRound === 2 ? s.enemyGw2 : s.enemyGw) : pad(s.enemyArena, 4);
    set({ scoutMode: mode, enemy });
    persistState();
  },
  setGwRound: (round) => {
    const board = round === 2 ? get().enemyGw2 : get().enemyGw;
    set({ gwRound: round, enemy: pad(board, 4) });
    persistState();
  },
  setGwSlot: (round, index, id) => {
    const other = round === 2 ? get().enemyGw : get().enemyGw2;
    if (id && other.includes(id)) return;
    const key = round === 2 ? "enemyGw2" : "enemyGw";
    const board = clampGw(get()[key]);
    const next = [...board];
    const filling = Boolean(id) && !next[index];
    const count = next.filter(Boolean).length;
    if (filling && count >= 3) return;
    next[index] = id ?? "";
    const clamped = clampGw(next);
    if (round === 2) set({ enemyGw2: clamped, gwRound: 2, enemy: clamped });
    else set({ enemyGw: clamped, gwRound: 1, enemy: clamped });
    persistState();
  },
  setEnemySlot: (index, id) => {
    const mode = get().scoutMode;
    if (mode === "gw") {
      get().setGwSlot(get().gwRound, index, id);
      return;
    }
    const enemyArena = pad(get().enemyArena, 4);
    enemyArena[index] = id ?? "";
    set({ enemyArena, enemy: enemyArena });
    persistState();
  },
  setEnemy: (ids) => {
    const mode = get().scoutMode;
    if (mode === "gw") {
      const clamped = clampGw(ids);
      const round = get().gwRound;
      if (round === 2) set({ enemyGw2: clamped, enemy: clamped });
      else set({ enemyGw: clamped, enemy: clamped });
    } else {
      const enemyArena = pad(ids, 4);
      set({ enemyArena, enemy: enemyArena });
    }
    persistState();
  },
  clearWall: () => {
    const emptyA = emptyArena();
    const emptyG = emptyGw();
    const mode = get().scoutMode;
    set({
      enemyArena: emptyA,
      enemyGw: emptyG,
      enemyGw2: emptyG,
      enemy: mode === "gw" ? emptyG : emptyA,
    });
    persistState();
  },
  toggleBuilt: (id) => {
    const roster = { ...get().roster };
    const cur = roster[id] ?? { owned: false, built: false };
    const built = !cur.built;
    roster[id] = { owned: built ? true : cur.owned, built };
    if (!roster[id].owned && !roster[id].built) delete roster[id];
    set({ roster });
    persistState();
  },
  loadPresetRoster: (kind) => {
    if (kind === "clear") set({ roster: {} });
    else set({ roster: rosterFrom(SAMPLE_ROSTER) });
    persistState();
  },
  setRestrict: (v) => {
    set({ restrictToRoster: v });
    persistState();
  },
}));

export function builtIds(roster: Record<string, RosterEntry>): string[] {
  return Object.entries(roster)
    .filter(([, v]) => v.built)
    .map(([id]) => id);
}