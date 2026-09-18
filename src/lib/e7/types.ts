export type Element = "fire" | "ice" | "earth" | "light" | "dark";
export type HeroClass =
  | "knight"
  | "warrior"
  | "mage"
  | "ranger"
  | "thief"
  | "soulweaver";
export type Tier = "SS" | "S" | "A" | "B";
export type Rarity = 3 | 4 | 5;

export type Role =
  | "opener"
  | "strip"
  | "cleanse"
  | "bruiser"
  | "cleave"
  | "tank"
  | "revive"
  | "control"
  | "soulblock"
  | "speedcap"
  | "dps"
  | "healer"
  | "evasion";

export type Tag =
  | "immunity"
  | "injury"
  | "cr-push"
  | "cr-cut"
  | "anti-revive"
  | "aoe"
  | "stun"
  | "barrier"
  | "counter"
  | "dual-attack"
  | "soulburn"
  | "ignore-er"
  | "seal"
  | "unhealable"
  | "defbreak"
  | "extra-turn"
  | "invincible"
  | "provoke"
  | "fixed-dmg"
  | "evade"
  | "strip"
  | "silence"
  | "barrier-break";

export type ArchetypeId =
  | "speed-cleave"
  | "harsetti-stall"
  | "revive-wall"
  | "injury-grind"
  | "evasion-counter"
  | "turn2-control"
  | "immunity-soul"
  | "bruiser-mix";

export const ARCHETYPE_IDS: ArchetypeId[] = [
  "speed-cleave",
  "harsetti-stall",
  "revive-wall",
  "injury-grind",
  "evasion-counter",
  "turn2-control",
  "immunity-soul",
  "bruiser-mix",
];

export const ROLE_IDS: Role[] = [
  "opener",
  "strip",
  "cleanse",
  "bruiser",
  "cleave",
  "tank",
  "revive",
  "control",
  "soulblock",
  "speedcap",
  "dps",
  "healer",
  "evasion",
];

export const TAG_IDS: Tag[] = [
  "immunity",
  "injury",
  "cr-push",
  "cr-cut",
  "anti-revive",
  "aoe",
  "stun",
  "barrier",
  "counter",
  "dual-attack",
  "soulburn",
  "ignore-er",
  "seal",
  "unhealable",
  "defbreak",
  "extra-turn",
  "invincible",
  "provoke",
  "fixed-dmg",
  "evade",
  "strip",
  "silence",
  "barrier-break",
];

export type NormalEffect =
  | "revive"
  | "extinction"
  | "increase-cr"
  | "decrease-cr"
  | "extra-turn"
  | "ally-cd-decrease"
  | "enemy-cd-increase"
  | "increase-hit"
  | "increase-evasion"
  | "always-crit"
  | "damage-reduction"
  | "damage-sharing"
  | "ignore-damage-sharing"
  | "damage-received-limit"
  | "increase-crit-resist"
  | "increase-pen-resist"
  | "soul-removal"
  | "resource-reduction"
  | "barrier-inversion"
  | "buff-dispel"
  | "debuff-dispel"
  | "buff-duration-decrease"
  | "debuff-duration-decrease"
  | "dual-attack"
  | "injury"
  | "counterattack"
  | "cannot-counterattack";

export const EFFECT_IDS: NormalEffect[] = [
  "revive",
  "extinction",
  "increase-cr",
  "decrease-cr",
  "extra-turn",
  "ally-cd-decrease",
  "enemy-cd-increase",
  "increase-hit",
  "increase-evasion",
  "always-crit",
  "damage-reduction",
  "damage-sharing",
  "ignore-damage-sharing",
  "damage-received-limit",
  "increase-crit-resist",
  "increase-pen-resist",
  "soul-removal",
  "resource-reduction",
  "barrier-inversion",
  "buff-dispel",
  "debuff-dispel",
  "buff-duration-decrease",
  "debuff-duration-decrease",
  "dual-attack",
  "injury",
  "counterattack",
  "cannot-counterattack",
];

export const EFFECT_LABEL: Record<NormalEffect, string> = {
  revive: "Revive",
  extinction: "Cannot revive",
  "increase-cr": "Pushes Combat Readiness forward",
  "decrease-cr": "Pushes Combat Readiness back",
  "extra-turn": "Takes another turn immediately",
  "ally-cd-decrease": "Shortens an ally's cooldown",
  "enemy-cd-increase": "Lengthens an enemy's cooldown",
  "increase-hit": "Increase Hit Chance",
  "increase-evasion": "Increase Evasion",
  "always-crit": "Always crits when the attack lands",
  "damage-reduction": "Damage reduction",
  "damage-sharing": "Damage sharing",
  "ignore-damage-sharing": "Ignores damage sharing",
  "damage-received-limit": "Damage received limit",
  "increase-crit-resist": "Increase Critical Hit Resistance",
  "increase-pen-resist": "Increase Penetration Resistance",
  "soul-removal": "Removes souls",
  "resource-reduction": "Cuts Focus / Fighting Spirit gain",
  "barrier-inversion": "Turns Barrier into damage",
  "buff-dispel": "Removes buffs",
  "debuff-dispel": "Removes debuffs",
  "buff-duration-decrease": "Shortens buffs",
  "debuff-duration-decrease": "Shortens debuffs",
  "dual-attack": "Ally hits with them",
  injury: "Cuts max Health",
  counterattack: "Counterattack",
  "cannot-counterattack": "Cannot counterattack",
};

export type UniqueEffect = {
  name: string;
  text: string;
};

export type WallUnique = UniqueEffect & {
  heroId: string;
};

export type Hero = {
  id: string;
  name: string;
  short: string;
  element: Element;
  class: HeroClass;
  tier: Tier;
  rarity?: Rarity;
  roles: Role[];
  tags: Tag[];
  effects?: NormalEffect[];
  buffs?: string[];
  debuffs?: string[];
  uniqueEffects?: UniqueEffect[];
  kit: string;
  defense: number;
  offense: number;
  baseSpeed?: number;
  icon?: string;
  verified?: boolean;
  checkedAt?: string;
};

export type SlotNeed = {
  label: string;
  roles?: Role[];
  tags?: Tag[];
  prefer?: string[];
  avoidRoles?: Role[];
};

export type RecipeSource = "seed" | "admin" | "generated";

export type Recipe = {
  id: string;
  name: string;
  vs: ArchetypeId[];
  summary: string;
  wincon: string;
  setup: string;
  pitfalls: string[];
  slots: [SlotNeed, SlotNeed, SlotNeed, SlotNeed];
  createdBy?: string | null;
  author?: string;
  source?: RecipeSource;
};

export type DefenseRead = {
  archetype: ArchetypeId;
  title: string;
  headline: string;
  threats: { heroId: string; text: string; severity: 1 | 2 | 3 }[];
  notes: string[];
  watch: {
    key: string;
    label: string;
    note: string;
    answerTags?: Tag[];
    answerRoles?: Role[];
    answerEffects?: NormalEffect[];
  }[];
  tags: Tag[];
  roles: Role[];
  effects: NormalEffect[];
  buffs: string[];
  debuffs: string[];
  uniqueEffects: WallUnique[];
  unverifiedIds: string[];
};

export type CounterTeam = {
  recipeId: string;
  name: string;
  heroIds: string[];
  seats: 3 | 4;
  score: number;
  coverage: number;
  wincon: string;
  setup: string;
  pitfalls: string[];
  missing: string[];
  gaps: string[];
  theorycraft: boolean;
  why: string[];
};

export type RankId =
  | "bronze"
  | "silver"
  | "gold"
  | "master"
  | "challenger"
  | "champion"
  | "emperor"
  | "legend";

export type MatchLog = {
  id: string;
  at: number;
  enemy: string[];
  team: string[];
  won: boolean;
  vpDelta: number;
  note: string;
  recipeId?: string;
  recipeName?: string;
  archetype?: ArchetypeId;
};

export type RosterEntry = {
  owned: boolean;
  built: boolean;
};

export type MemberRole = "member" | "admin";

export type DefensePreset = {
  id: string;
  name: string;
  heroIds: string[];
  blurb: string;
};

export type GuildMember = {
  userId: string;
  displayName: string | null;
  ingameName: string | null;
  email: string | null;
  role: MemberRole;
};

export type AdminLogRow = {
  id: string;
  at: number;
  actor: string;
  summary: string;
};

export type StrategyIdeaStatus = "inbox" | "keep" | "skip" | "later";

export type StrategyIdea = {
  id: string;
  body: string;
  about: string;
  status: StrategyIdeaStatus;
  verdict: string;
  author: string;
  at: number;
};

export type RecipeStat = {
  id: string;
  name: string;
  author: string;
  source: RecipeSource;
  wins: number;
  losses: number;
};

export type WallStat = {
  archetype: ArchetypeId;
  title: string;
  wins: number;
  losses: number;
};

export const NOTICE_KINDS = ["catalog", "scout", "app"] as const;
export type NoticeKind = (typeof NOTICE_KINDS)[number];

export const NOTICE_KIND_LABEL: Record<NoticeKind, string> = {
  catalog: "Units",
  scout: "Scout",
  app: "App",
};

export type Notice = {
  id: string;
  kind: NoticeKind;
  title: string;
  body: string;
  published: boolean;
  author: string;
  at: number;
  read: boolean;
};

