# Scout copy audit

Name for this class of bug: **ungrounded copy**.

A sentence that is true of a kit in isolation, but false or irrelevant for
**this wall** or **this filled team**.

Read this file before:

- answering “cek resep / cek hasil scout”
- editing `jobFor`, `whyFor`, `pitfallsFor`, `wallThreats`, or recipe wincon/setup
- adding a new verified unique that other copy might mention

**Adding or verifying a hero?** Use [`VERIFY_HERO.md`](VERIFY_HERO.md) first.
This file is only the copy pass on one filled card.

Files: `engine.ts`, `threats.ts`, `recipes.ts`, verified kits in `heroes.ts`.

**Never rewrite `engine.ts` (or recipes / threats / heroes) as a whole file.**
Targeted patch only. Run `node scripts/guard-e7-core.mjs` after edits. If
`engine.ts` drops below 1000 lines it was truncated — restore from git first.

---

## Four subtypes

| Subtype | What leaked | Example |
|---|---|---|
| **Tag leak** | A shared tag fires copy written for a different kit | `evade` on LC Bellona → miss-nest line meant for Riolet / Setsuka |
| **Wall-blind job** | Setup/why names a mechanic that is not on this wall | B.Iseria “revive is off” vs a wall with no revive; “do not strip into Nullifier” vs no Nullifier |
| **Unstated clash** | Two units on **our** team cancel each other; copy stays silent | Ruele + B.Iseria: Witch's Curse turns her revive off |
| **Union false positive** | Tags/roles OR’d across four heroes as if one hero had both | `immunity` on LC Bellona + `tank` on Arunka → “buffed wall / LR Krau Immunity” |

---

## Grounding rule

- `jobFor` = who this hero is. **No wall-conditional warnings.**
- `whyFor` / `pitfallsFor` = this wall + this filled team. Every named mechanic must exist on one of those two sides.
- `wallThreats` = this wall only. Do not OR a tag from hero A with a role from hero B unless the same hero has both, or the unique is team-wide (Ferocious Stand, Offering, Skuggiheim).

If a line cannot be pointed at a verified unique, tag, or effect **on this board**, it does not ship.

---

## Checklist (run in order)

Wall = the four enemy ids. Team = the four filled counter ids. Use **verified kits only**.

### 1. Inventory

For each wall hero, list: roles, tags, uniques, what the kit actually does (self-only vs team).

Known **self-only** (must not drive team-wide copy):

- LC Bellona evasion — self. Not a miss nest.
- Lone Wolf Peira evasion — self. Extra-turn opener, not a miss nest.
- WMeri Stealth — self. Not Ferocious Stand. Not a force-target wall.

Known **team-wide** (must drive copy):

- Ferocious Stand (B.Arunka)
- Offering / Scales of Equity
- Skuggiheim (Harsetti)
- Witch's Curse / Death's Dominion (no revive, both sides)
- Skill Nullifier / Guardian Angel
- Dark Moon (any Soulburn)
- Elbris's Successor (Miseria) — doubled counters and foremost-ally counter. Not Dual Attack.
- Superhumanization (SN Yulha) — revive on an ally, not herself. Cooldown cannot be pushed.
- Possession (S.Taeyou) — self. Counters on a critical hit, not a miss nest. Roaring Spiritfall does not Dual Attack; Dual Attack into him keeps Lan Na Zha.
- Sanctuary of Battle (Notos) — both sides. Buffs and debuffs do not apply. Not Immunity. Do not recommend strip or stun as the plan. Injury still stacks. God's Might starts the first fight on cooldown. Do not fire Seal, Cannot Buff, Fear, or Sleep watches while it is on the wall — they do not land after transform.
- Seal ≠ Cannot Buff. Seal turns passives off. Harsetti Checkmate is Cannot Buff. Never label them as one watch.
- Skill Effect Nullifier (NM Luna) — on herself at start. Not Fallen Cecilia eating the opener. Do not fire the Skill Nullifier watch from this unique.
- Block (WMeri) — afflicted heroes only. Cannot receive buffs; other heroes cannot dispel their debuffs. Not Seal — passives still run. Random Stun / Sleep / Redirected Provoke is one of three — do not fire those watches from this kit.
- Restrict — Combat Readiness push other than Speed is off. Shared with Ran. Gate during Sanctuary.
- Cascade / Lullaby for Waves (DK Sharun) — team-wide. Stun, Sleep, or Fear on their ally grants Cascade and cleanses the lock. Do not fire a stun-wall watch from her 30% S1. S3 is Cannot Buff and buff duration −2, not a strip and not Seal.
- Star's Blessing (A.Elena) — enemy heroes cannot counter only while she has it. She starts with 1 turn. Not Mort (not stun-immune, not permanent). S3 is Unhealable + Restrict and buff duration −1, not a strip. Worship Me! is her own Combat Readiness after an ally AoE — do not tell the attacker “do not AoE”.
- Begone! (C.Pavel) — ally crits charge Fighting Spirit. Extra attacks, counters, and Dual Attacks do not. Die, You Fly ignores damage sharing on heroes, not Elite/Boss. Not Dual Attack. +100% Combat Readiness is a CR push, not an extra-turn tag.
- Flame Release (SB Ara) — extra attack, not Dual Attack. Extra attacks into Lionheart Cermia still reset her third skill. Meteor Fall Stun is real (not a 1-of-3 pool). Attack-from-Effectiveness is a first-fight stat, not an Increase Attack buff.
- Insight (SS Vivian) — PvP only. Focus 3+ immune to debuffs. Starts full Focus. Not the Immunity buff — strip does not turn it off. 30% max Health hits spend Focus. Extra S1 at full Focus is not Dual Attack. Soulburn S1 does not Dual Attack. S3 heal is self only.
- Bastet Roar (DJ Basar) — this is the Immunity buff. Strip turns it off. Not Last Rider Krau. Extra turn on Barrier is gone (2026-09-17). If he has Barrier after an enemy skill, Desert Storm inverts Barrier. Barrier Inversion ignores ER and always hits, heroes only. 25% S1 Stun is not a stun wall.
- Shield of Holy Spirit (C.Armin) — team Immunity 2 turns and Invincible 1 turn. Strip turns both off. She does not cleanse. Not Last Rider Krau. 10% Security State is team-wide damage reduction, not a barrier.
- Divine Vessel (ML Hwayoung) — immune to buffs and debuffs. Not Immunity, not Insight, not Oath of Punishment. Strip does not apply. Sura trigger is a 40% hit on an ally, random enemy, not Dual Attack and not a counter. Extinction only if Sura gets the last hit.
- Unwavering Execution (DP Aria) — enemy Soulburn costs double. Souls still generate. Not Belian. Injury is on Disciplinary Action (extra attack while Purge is on cooldown), not on Purge itself. Extra attack is not Dual Attack. Team Barrier on Purge — do not put that Barrier on DJ Basar.
- Dragon Flame (MA Ken) — ally-crit counter and self-crit Dragon Flame. Counters are not Dual Attack. Mort and Star's Blessing turn them off. Vigor is undispellable Attack/Defense, not Immunity. 55% Decrease Defense is real, not a 1-of-3 pool.
- Blood Moon Haste — Grudge is Barrier + Immunity on first ally death, not a revive. Moon Slash revives only if that third skill gets a kill. Do not name the wall revive-wall. Do not fire Revive / reset. Do not put anti-revive as the recipe.
- Collapse (Salome) — −25% max Health, doubled on heroes. Not injury stacking. Dual Attack is from the highest Attack ally on S1, not from counters. Clone is one turn and dispels with its unique effects. Skill Nullifier is self only.
- Inner Abyss (A.Yufine) — enemy CR increases −30%. Not a Speed cap. Frenzied Strike is AoE strip all + −50% CR, ignore ER. Trauma is self only. 30% counter is not Dual Attack. Unbridled Outburst is the Trauma S1, 70% pen, not an extra turn.
- Bind (R&L) — extra skills, counters, Dual Attacks off-turn, heroes only. Extra attack after Hunter's Mark is not Dual Attack. Afterdream 70% evasion starts after the third skill, not from turn 1 — not a miss nest (do not fire the Setsuka/Riolet evade watch). Erosion is not injury. Fear on Pursuit of Death is real (not a 1-of-3 pool).
- Challenge (H.Lua) — undispellable. 10% max Health additional after a basic skill vs a Hero, then it falls off. Lua Squad counters are team counters when a Hero hits her, not Dual Attack. Lua's Challenge is buff duration −1, not a strip. Mort and Star's Blessing turn the counters off.
- Obliterate (O.Sigret) — 75% buff duration −1, not a strip. Extra turn only if Annihilation kills, not an opener extra turn. Barrier bonus is more damage / ignore ER, not Barrier Inversion.
- Hunt (PC Flan) — fires after an ally hits a target with no buffs. Swift Attack is +50% CR at end of turn, then it falls off. Bomb stun is delayed two turns and ignores ER — not an opener stun. Extra turn is Soulburn Execution only. 30% DR when hit is not Immunity. Do not match unique name "Hunt" by substring — that leaked onto Hunter's Mark (R&L).
- Death Sentence (Ainz) — 50,000 at the 12th turn, ignore share, falls off if he dies. Not injury. S1 25% Stun is not a stun wall. Extra turn is Soulburn only. Mana Barrier is 25% on ally hit: team Barrier + self Counter — not a guaranteed counter nest. S3 cooldown cannot be changed.
- Burst (ADS) — extra AoE after a sealed S1, not Dual Attack. Seal is heroes only. Dissolution extra turn does not trigger counters. 20% DR on crit is not Immunity.
- Can You Handle This? (EW Ludwig) — any Soulburn (including yours) +20% CR and +30% pen, stacks twice. Extra turn on S1/S2 is Soulburn only. Self Skill Nullifier. Not Dark Moon.
- Boundless Obsession (RQ Roana) — CR from Speed halved. Not a Speed cap. +70% CR when the front ally takes a turn. Eternal Lament is AoE strip one + CD +1 + CR −30%, cannot crit. Not Harsetti.
- Illusion (S.Tene) — cannot be selected while an ally lives. AoE still hits. Endless Nightmare is guaranteed Stun. Poison Blast does not trigger counters. Extra turn is Soulburn only. Hitting two while S3 is on cooldown is not Dual Attack.
- Engulf (TR Elvira) — 100% Effectiveness and Crit Hit Resistance. Not Immunity, not a revive. Lethal damage grants Cascade to her team — do not name a unique "Cascade" (that is Sharun's watch). Twisted Strike extra AoE is not Dual Attack. Seal is heroes only.
- Victory Pose (TM Lulu) — team CR + extra turn. Demolish extinction only on a kill. Stealth is not Illusion. Extra attack on Energy Blast is not Dual Attack. Ignore share vs Heroes.
- Deify (Zio) — extra attack on S1, 50% DR when hit. Not Dual Attack, not Immunity. S3 strip two + Silence. Supreme Authority ignores CR-increase reduction — not a Speed cap.
- Nature Restoration (ML Kawerik) — team cleanse + Immunity. Balance of Power is strip all + team Barrier. Barrier is not Barrier Inversion. Debuff duration −1 is not extra turn.
- Pestilence (DD Ray) — team: Venom on attack, detonate at end of turn. Venom inflicts Injury. Cloud of Death is AoE strip two + Sleep + extra turn. Clinical Trial does not trigger Dual Attack. Sleep is not a stun wall. During Sanctuary, Venom (a debuff) does not land.
- Miss-nest copy (C.Lilias Dual Attack, LQ Charlotte Soulburn hit, Solitaria Focus lock) only if the evade watch fired — Setsuka / Remnant Violet. Not LC Bellona, Peira, or R&L Afterdream.

- Mort's `counter` tag means he turns counters **off**. Do not treat it as a counter core (Bind, extra-attack into LH Cermia, Mort-clash is already gated on *other* units).
- B.Iseria jobFor during Sanctuary: do not say “nobody revives” unless the wall actually revives. Do not sell Cursed Thorn strip while Sanctuary is up.
- Hecate jobFor / why: Death’s Dominion “nobody revives” only if the wall actually revives. Offering-only walls keep ignore-share, not anti-revive.

### 2. Watch

For each watch line: which hero on **this wall** justifies it?

Drop or rewrite if the answer is “a tag that means something else on this kit”.

### 3. Why / Setup / Breaks if — line by line

For each sentence, write in the margin:

- **On the wall?** unique / id / role that exists here
- **On the team?** hero that actually does it
- **Else:** ungrounded → delete or gate

Named mechanics that must be gated, not baked into `jobFor`:

- Skill Nullifier / Guardian Angel
- Revive / Extinction / anti-revive
- Ferocious Stand
- Offering / ignore damage sharing
- Speed cap / Skuggiheim
- Miss nest (Setsuka, Remnant Violet only)
- Soul lock / Dark Moon
- Dual Attack reset (Lionheart Cermia)

### 4. Clashes on our team

If both sides of a pair are in the filled team, a Breaks-if (or Setup) line is required.

| Pair | What actually happens |
|---|---|
| B.Iseria or Hecate + Ruele / Maid Chloe / SN Yulha / A.Vildred / Lisette / SE Celine / A.Ravi / BM Haste | Ally revive is off while the curse lives |
| Mort + TE Kayron / Miseria / S.Taeyou / any counter core | Mort turns other counters off |
| Belian (ours) + a Soulburn wincon | That Soulburn does not exist |
| B.Iseria (ours) + Ruele as “the reset” | She is heals and Barrier only |
| Notos Sanctuary + strip / stun / Immunity plan | Buffs and debuffs do not apply. Injury still stacks |

If the wall has **no** revive, do not sell B.Iseria / Hecate as anti-revive. Sell the job they still do (area strip / ignore share).

### 5. Gaps

`No {threat}` means the **draft does not answer that threat**, not that the wall lacks it.

Offering unanswered → Breaks-if must say: do not dump the closer into the back.

### 6. Pass / fail

Fail if any Why / Setup / Breaks-if line would still print after you remove the justifying unique from the wall, or after you swap the filled hero for a generic of the same slot.

---

## When editing generators

1. Prefer `read.watch.some((t) => t.key === "…")` or a unique regex on `read` over `read.tags.includes("evade")`.
2. Anti-revive why only if the wall has a revive unique or `roles.includes("revive")`.
3. Nullifier warning only in `pitfallsFor` when the unique is on the wall.
4. After a verified-kit pass, pick one real scout (four named enemies) and run this checklist on the printed card — not on the recipe template.
