/**
 * Built-in recipes. Accumulated — never rewrite this file as a whole.
 * Overlay refreshes `source = seed` only. Admin-authored and generated
 * strategies keep their own ids. Floor: stay above 200 lines.
 */
import type { ArchetypeId, DefensePreset, Recipe } from "./types";

export const ARCHETYPE_META: Record<
  ArchetypeId,
  { title: string; blurb: string; color: "control" | "stall" | "cleave" | "bruiser" }
> = {
  "speed-cleave": {
    title: "Speed cleave",
    blurb: "This wall wants the first turn, strips your buffs, and hits everyone.",
    color: "cleave",
  },
  "harsetti-stall": {
    title: "Harsetti stall",
    blurb: "Speed is capped. You cannot race this wall. Plan for a long fight.",
    color: "stall",
  },
  "revive-wall": {
    title: "Revive wall",
    blurb: "Someone on this wall can bring an ally back. Killing one unit may not end the fight.",
    color: "stall",
  },
  "injury-grind": {
    title: "Injury grind",
    blurb: "They cut maximum Health as the fight goes on. Extra Health does not fill what Injury removed.",
    color: "bruiser",
  },
  "evasion-counter": {
    title: "Evasion nest",
    blurb: "This wall is built around miss chance and counters. Single-target skills into the miss core fail often.",
    color: "bruiser",
  },
  "turn2-control": {
    title: "Turn-2 control",
    blurb: "After the first cycle they pull Combat Readiness back and take over the fight.",
    color: "control",
  },
  "immunity-soul": {
    title: "Immunity / soul lock",
    blurb: "Soulburn does not work here. If they also sit in Immunity, strip before you land debuffs.",
    color: "control",
  },
  "bruiser-mix": {
    title: "Mixed bruiser",
    blurb: "No single gimmick. The wall is bulky and mixes tools.",
    color: "bruiser",
  },
};

export const RECIPES: Recipe[] = [
  {
    id: "injury-vs-stall",
    name: "Injury grind",
    vs: ["harsetti-stall", "revive-wall", "bruiser-mix", "immunity-soul", "evasion-counter", "turn2-control", "injury-grind"],
    summary: "You cannot outspeed this wall. Stack injury, then grind.",
    wincon: "Stack injury on the threat. Once maximum Health is reduced, the stall cannot out-heal you.",
    setup: "An injury core takes the first slot. A tank holds the front while injury stacks. Sustain covers a long cycle. If the wall can revive, the fourth slot is anti-revive.",
    pitfalls: [
      "Do not cleave into a Speed cap. That plan does not work here.",
      "If they can revive, land anti-revive before you commit the closer.",
      "Ferocious Stand forces single-target skills onto Arunka. Use area injury, or accept hitting her.",
    ],
    slots: [
      { label: "Injury", tags: ["injury"], prefer: ["empyrean-ilynav", "urban-shadow-choux", "new-moon-luna", "twisted-eidolon-kayron", "lone-crescent-bellona", "monarch-of-the-sword-iseria", "zahhak", "estelle", "disciplinary-prefect-aria", "death-dealer-ray", "alencia", "abigail", "ilynav"] },
      { label: "Frontline", roles: ["tank", "bruiser"], prefer: ["dragon-bride-senya", "last-rider-krau", "mort", "dark-corvus", "boss-arunka"] },
      { label: "Tech", tags: ["anti-revive", "strip"], roles: ["soulblock", "strip"], prefer: ["briar-witch-iseria", "hecate", "shepherd-diene", "belian"] },
      { label: "Sustain", roles: ["healer", "cleanse", "revive"], prefer: ["ruele-of-light", "lisette", "school-nurse-yulha", "maid-chloe", "spirit-eye-celine", "blood-moon-haste", "diene", "destina"] },
    ],
  },
  {
    id: "anti-revive-burst",
    name: "Anti-revive cut",
    vs: ["revive-wall", "bruiser-mix", "injury-grind", "harsetti-stall"],
    summary: "Stop the reset, then collapse the rest of the wall.",
    wincon: "Land anti-revive, focus the reviver, then collapse the rest.",
    setup: "Anti-revive has to live. Strip if they sit in Immunity. The closer has to get the last hit.",
    pitfalls: [
      "Do not kill the tank first. That feeds the reviver.",
      "Extinction only applies if that skill gets the last hit.",
      "Hecate's third skill starts the first fight on cooldown. The passive is the point of bringing her.",
    ],
    slots: [
      { label: "Anti-revive", tags: ["anti-revive"], prefer: ["briar-witch-iseria", "hecate", "bystander-hwayoung"] },
      { label: "Strip", roles: ["strip"], tags: ["strip"], prefer: ["briar-witch-iseria", "shepherd-diene", "rinak", "frieren", "fallen-cecilia", "witch-of-the-mere-tenebria", "desert-jewel-basar", "abyssal-yufine", "pirate-captain-flan", "ainz-ooal-gown", "requiem-roana", "zio", "mediator-kawerik", "death-dealer-ray", "uncharted-pioneer-politis", "aki", "ae-ningning", "aramintha", "aria", "aubade-ludwig", "beehoo", "basar", "birgitta", "eda", "eligos", "elphelt", "eye-of-the-abyss-fumyr", "festive-eda", "fumyr", "haste", "iseria", "kawerik", "lidica", "lilibet", "lua"] },
      { label: "Closer", roles: ["dps", "cleave", "bruiser"], prefer: ["straze", "specimen-sez", "little-queen-charlotte", "hecate", "arbiter-vildred", "commander-pavel", "closer-charles", "bystander-hwayoung", "arunka", "jenua", "lethe", "lilibet"] },
      { label: "Cover", roles: ["opener", "tank", "control"], prefer: ["genesis-ras", "boss-arunka", "last-rider-krau", "rinak"] },
    ],
  },
  {
    id: "harsetti-answer",
    name: "Speed cap",
    vs: ["speed-cleave", "turn2-control"],
    summary: "Cap their Speed and force the cleave into a real fight.",
    wincon: "Harsetti denies the opener. A tank absorbs leftover area damage. Belian turns Soulburn off.",
    setup: "Harsetti on a bulky set. Pair a real tank and Belian. Mort and both versions of Politis are not a soul lock.",
    pitfalls: [
      "If Harsetti is slower than their opener, you still lose the first turn.",
      "Injury and evasion ignore this plan. Read the wall first.",
      "Do not bring a Combat Readiness stack as the win condition into your own Harsetti.",
    ],
    slots: [
      { label: "Cap", roles: ["speedcap"], prefer: ["harsetti"], tags: ["cr-cut"] },
      { label: "Tank", roles: ["tank"], prefer: ["last-rider-krau", "dragon-bride-senya", "mort", "notos", "dark-corvus", "crimson-armin", "ambitious-tywin"] },
      { label: "Soul lock", roles: ["soulblock"], prefer: ["belian"] },
      { label: "Flex", roles: ["bruiser", "healer", "control"], prefer: ["empyrean-ilynav", "urban-shadow-choux", "new-moon-luna", "lone-crescent-bellona", "monarch-of-the-sword-iseria", "ruele-of-light"] },
    ],
  },
  {
    id: "outspeed-cleave",
    name: "Strip cleave",
    vs: ["bruiser-mix", "immunity-soul", "turn2-control"],
    summary: "Take the first turn, strip, and end the fight before the wall cycles.",
    wincon: "Opener into strip into area damage. If anyone lives, the draft has already lost.",
    setup: "A real Speed floor, or an extra-turn opener. Strip, then extra-turn into the area skill. Do not lead with the only strip into Skill Nullifier.",
    pitfalls: [
      "Harsetti, evasion, and Belian all stop this plan.",
      "Skill Nullifier eats one skill. Do not open with your only strip.",
      "Do not Soulburn into Shepherd of the Dark Diene. Dark Moon strips everyone.",
    ],
    slots: [
      { label: "Opener", roles: ["opener"], prefer: ["architect-laika", "ran", "faithless-lidica", "lone-wolf-peira", "salome", "rhianna-and-luciella", "archdemons-shadow", "tidal-rift-elvira", "top-model-luluca", "death-dealer-ray", "amid", "aube"] },
      { label: "Strip", roles: ["strip"], tags: ["strip"], prefer: ["briar-witch-iseria", "faithless-lidica", "ran", "rinak", "frieren", "witch-of-the-mere-tenebria", "desert-jewel-basar", "abyssal-yufine", "rhianna-and-luciella", "pirate-captain-flan", "zio", "mediator-kawerik", "death-dealer-ray", "uncharted-pioneer-politis", "aki", "ae-ningning", "aramintha", "aria", "aubade-ludwig", "beehoo", "basar", "birgitta", "eda", "eligos", "elphelt", "eye-of-the-abyss-fumyr", "festive-eda", "fumyr", "haste", "iseria", "kawerik", "lidica", "lilibet", "lua"] },
      { label: "Cleave", roles: ["cleave", "dps"], tags: ["aoe"], prefer: ["architect-laika", "straze", "judge-kise", "arbiter-vildred", "navy-captain-landy", "afternoon-soak-flan", "operator-sigret", "eternal-wanderer-ludwig", "archdemons-shadow", "requiem-roana", "argent-waves-hwayoung"] },
      { label: "Enable", roles: ["soulblock", "cleanse", "dps"], prefer: ["belian", "diene", "conqueror-lilias", "angel-of-light-angelica", "dragon-king-sharun", "sylvan-sage-vivian", "hellion-lua", "mediator-kawerik", "aram"] },
    ],
  },
  {
    id: "turn2-control",
    name: "Turn-2 script",
    vs: ["speed-cleave", "bruiser-mix", "injury-grind", "turn2-control"],
    summary: "Survive the opener, then take the next cycle.",
    wincon: "Last Rider Krau's third skill is team Immunity. Control then takes the script.",
    setup: "Team Immunity is Last Rider Krau's third skill — not Diene, not Angel of Light Angelica, not Genesis Ras. Sage Baal is Sleep, not Stun.",
    pitfalls: [
      "A strip that ignores Effect Resistance ends the Immunity window.",
      "If Last Rider Krau is slower than their opener, Immunity never starts.",
      "Do not Dual Attack into Lionheart Cermia. That returns her third skill.",
    ],
    slots: [
      { label: "Immunity", tags: ["immunity"], roles: ["tank"], prefer: ["last-rider-krau", "crimson-armin"] },
      { label: "Control", roles: ["control"], prefer: ["sage-baal", "rinak", "frieren", "solitaria", "politis", "witch-of-the-mere-tenebria", "silver-blade-aramintha", "specter-tenebria", "hellion-lua", "zio", "ambitious-tywin", "ae-winter", "ae-ningning", "aramintha", "aube", "aubade-ludwig", "birgitta", "cerise", "command-model-laika", "dizzy", "fairytale-tenebria", "elphelt", "festive-eda", "fumyr", "guard-captain-krau", "lua"] },
      { label: "Wincon", roles: ["bruiser", "dps"], prefer: ["empyrean-ilynav", "twisted-eidolon-kayron", "lionheart-cermia", "designer-lilibet", "apocalypse-ravi", "martial-artist-ken"] },
      { label: "Hold", roles: ["tank", "healer", "soulblock", "cleanse"], prefer: ["last-rider-krau", "angel-of-light-angelica", "designer-lilibet", "dragon-bride-senya", "dragon-king-sharun", "desert-jewel-basar", "mediator-kawerik"] },
    ],
  },
  {
    id: "evasion-bait",
    name: "Evasion bait",
    vs: ["speed-cleave", "bruiser-mix", "turn2-control"],
    summary: "Setsuka buffs team evasion. Remnant Violet is the miss magnet. They miss, then Massacre.",
    wincon: "They miss, then you punish. Setsuka counters. Remnant Violet uses Massacre.",
    setup: "Setsuka or Remnant Violet is the miss core. Someone in front has to be hit so Focus actually builds.",
    pitfalls: [
      "Area attacks that cannot miss, and Unbuffable, both ignore this plan.",
      "Lone Crescent Bellona and Lone Wolf Peira are self-evasion, not a nest.",
      "Do not Dual Attack into Lionheart Cermia.",
    ],
    slots: [
      { label: "Miss", roles: ["evasion"], tags: ["evade"], prefer: ["setsuka", "remnant-violet"] },
      { label: "Force", tags: ["dual-attack", "counter"], prefer: ["conqueror-lilias", "sea-phantom-politis", "frieren", "adventurer-ras", "afternoon-soak-flan"] },
      { label: "Frontline", roles: ["tank", "bruiser"], prefer: ["dragon-bride-senya", "last-rider-krau", "fallen-cecilia", "boss-arunka"] },
      { label: "Support", roles: ["healer", "soulblock", "control"], prefer: ["frieren", "belian", "lady-of-the-scales", "politis", "diene", "dragon-king-sharun"] },
    ],
  },
  {
    id: "anti-evasion",
    name: "True hit",
    vs: ["evasion-counter"],
    summary: "Do not play their miss game. Use area attacks, Dual Attacks, injury, or a guaranteed hit.",
    wincon: "Do not snipe Remnant Violet with a single-target third skill. Area attacks, Dual Attacks, or injury. Soulburn Little Queen Charlotte if she is the main target.",
    setup: "Dual Attack, area damage, or injury. Mort turns their counters off.",
    pitfalls: [
      "A single-target third skill into Remnant Violet will miss often.",
      "Little Queen Charlotte can still miss without Soulburn. Belian on their side turns that Soulburn off.",
      "During Demon Blade Unleashed, Setsuka cannot die. Wait it out, or strip first.",
    ],
    slots: [
      { label: "Force", tags: ["dual-attack", "aoe"], roles: ["opener"], prefer: ["architect-laika", "conqueror-lilias", "sea-phantom-politis", "rinak", "salome"] },
      { label: "AoE", roles: ["cleave", "dps"], tags: ["aoe"], prefer: ["little-queen-charlotte", "straze", "judge-kise", "navy-captain-landy", "frieren"] },
      { label: "True", tags: ["fixed-dmg", "injury"], prefer: ["urban-shadow-choux", "new-moon-luna", "twisted-eidolon-kayron", "empyrean-ilynav", "lone-crescent-bellona", "monarch-of-the-sword-iseria", "zahhak", "disciplinary-prefect-aria", "death-dealer-ray"] },
      { label: "Cover", roles: ["strip", "tank", "soulblock", "control"], prefer: ["solitaria", "mort", "astromancer-elena", "briar-witch-iseria", "belian", "hellion-lua"] },
    ],
  },
  {
    id: "strip-control",
    name: "Strip and lock",
    vs: ["immunity-soul", "revive-wall", "turn2-control"],
    summary: "Remove the Immunity, then the fight is a normal draft.",
    wincon: "Strip through Effect Resistance, then lock. Their kit never gets to play.",
    setup: "A real strip first. Control locks the cycle after. Do not open the strip into Skill Nullifier.",
    pitfalls: [
      "Skill Nullifier eats the first skill. Do not open with your only strip.",
      "Oath of Punishment and Ferocious Stand do not strip off.",
      "Belian does not care about a Soulburn follow-up.",
    ],
    slots: [
      { label: "Strip", tags: ["strip", "ignore-er"], roles: ["strip"], prefer: ["briar-witch-iseria", "judge-kise", "successor-taeyou", "ran", "rinak", "frieren", "witch-of-the-mere-tenebria", "desert-jewel-basar", "abyssal-yufine", "zio", "ainz-ooal-gown", "uncharted-pioneer-politis", "aki", "ae-ningning", "aramintha", "basar", "birgitta", "eda", "eligos", "elphelt", "eye-of-the-abyss-fumyr", "festive-eda", "fumyr", "haste", "iseria", "kawerik", "lidica", "lilibet", "lua"] },
      { label: "Lock", roles: ["control"], prefer: ["solitaria", "ambitious-tywin", "politis", "rinak", "frieren", "witch-of-the-mere-tenebria", "aube", "aubade-ludwig", "aramintha", "birgitta", "cerise", "command-model-laika", "fairytale-tenebria", "elphelt", "festive-eda", "fumyr"] },
      { label: "Wincon", roles: ["dps", "bruiser", "cleave"], prefer: ["straze", "judge-kise", "little-queen-charlotte", "closer-charles"] },
      { label: "Hold", roles: ["tank", "healer", "opener"], prefer: ["genesis-ras", "last-rider-krau", "ruele-of-light", "dragon-bride-senya", "ambitious-tywin"] },
    ],
  },
];

export const PRESET_DEFENSES: DefensePreset[] = [
  {
    id: "emperor-stall",
    name: "Harsetti + Belian",
    heroIds: ["harsetti", "last-rider-krau", "belian", "dragon-bride-senya"],
    blurb: "Example defense. Speed cap, soul lock, team Immunity, and Oath of Punishment.",
  },
  {
    id: "injury-throne",
    name: "Ilynav + Luna",
    heroIds: ["empyrean-ilynav", "new-moon-luna", "last-rider-krau", "dragon-bride-senya"],
    blurb: "Example defense. Two injury cores. No revive.",
  },
  {
    id: "scales-script",
    name: "Scales + Rinak",
    heroIds: ["lady-of-the-scales", "rinak", "frieren", "genesis-ras"],
    blurb: "Example defense. Offering, Pickpocketing, Judradjim, and Sacred Covenant.",
  },
  {
    id: "evasion-nest",
    name: "Setsuka + Violet",
    heroIds: ["setsuka", "remnant-violet", "frieren", "fallen-cecilia"],
    blurb: "Example defense. Miss nest. Frieren feeds Focus. Skill Nullifier eats the first skill.",
  },
  {
    id: "revive-bench",
    name: "Lisette + Ruele",
    heroIds: ["lisette", "ruele-of-light", "blood-moon-haste", "dragon-bride-senya"],
    blurb: "Example defense. Three resets: Time Reversal, Spirit Lord, and Moon Slash.",
  },
  {
    id: "soul-lock",
    name: "Belian + LR Krau",
    heroIds: ["belian", "last-rider-krau", "fallen-cecilia", "boss-arunka"],
    blurb: "Example defense. No souls. Team Immunity. Skill Nullifier and Ferocious Stand.",
  },
];
