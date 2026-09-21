/**
 * Exclusive equipment keyed by Crownpath hero id.
 * Hard gate: slug, alias, or slugify(name) must equal an existing id.
 * Broken option text is dropped. No community rank flags. No stats.
 */

export type ExclusiveOption = {
  skill: string;
  effect: string;
};

export type ExclusiveGear = {
  name: string;
  options: ExclusiveOption[];
};

export const EE_BY_HERO: Record<string, ExclusiveGear> = {
  "abigail": {
    name: "Blooming Rose",
    options: [
      { skill: "Ambush", effect: "Increases damage dealt by Ambush by 20%." },
      { skill: "Scarlet Garden", effect: "Decreases Defense of the enemy for 2 turns when using Scarlet Garden." },
      { skill: "Scarlet Garden", effect: "Decreases cooldown of Scarlet Garden by 1 turn." },
    ],
  },
  "alencia": {
    name: "The Price of Insolence",
    options: [
      { skill: "Noble Blood", effect: "Recovers the caster's Health when using Eradicate. Amount recovered increases proportional to the caster's max Health." },
      { skill: "Noble Blood", effect: "Damage dealt is increased by 20% when using Trample." },
      { skill: "Genesis", effect: "Increases Effectiveness of the caster for 2 turns when using Genesis." },
    ],
  },
  "amid": {
    name: "Flower of Oblation",
    options: [
      { skill: "Zephyr", effect: "When using Zephyr, increases Combat Readiness by an additional 5%." },
      { skill: "Zephyr", effect: "When using Zephyr, the same effect applies to the ally with the highest Combat Readiness except for the caster." },
      { skill: "Touch of Hope", effect: "Grants increased Attack (Greater) instead of increased Attack to the target when using Touch of Hope." },
    ],
  },
  "apocalypse-ravi": {
    name: "War God's Deliverance",
    options: [
      { skill: "Deliverance: Soul Exchange", effect: "Increases damage dealt by Deliverance: Soul Exchange by 10%, and inflicts up to 30% injuries on the target." },
    ],
  },
  "aramintha": {
    name: "Scarlet Tear",
    options: [
      { skill: "Ignite", effect: "Increases Ignite burn chance by 10%." },
      { skill: "Fire Pillar", effect: "Increases Fire Pillar's stun chance by 10%." },
    ],
  },
  "arbiter-vildred": {
    name: "Archdemon's Eye",
    options: [
      { skill: "Dark Contract", effect: "When revived by Dark Contract's effect, grants Archdemon's Might (Undispellable) (Increases Attack by 30% and Evasion by 50%) to the caster for 3 turns." },
    ],
  },
  "archdemons-shadow": {
    name: "Abyssal Eye of Kal",
    options: [
      { skill: "Touch of Chaos", effect: "Triggers a Dual Attack from the ally with the highest Attack when using Touch of Chaos." },
    ],
  },
  "argent-waves-hwayoung": {
    name: "Wake of Courage",
    options: [
      { skill: "Advent of the Sura", effect: "Before attacking, grants increased Hit Chance to the caster for 2 turns when using Swallow Kick." },
      { skill: "Advent of the Sura", effect: "With Swallow Kick's effect, increases Combat Readiness by an additional 10%." },
      { skill: "Argent Flash", effect: "Increases damage dealt by Argent Flash by 10%." },
    ],
  },
  "aria": {
    name: "Prophet's Shawl",
    options: [
      { skill: "Shadow Call", effect: "Increases damage dealt by Shadow Call by 10%." },
      { skill: "Guide of Darkness", effect: "Increases damage dealt by Dark Shadow Phantom by 10%." },
      { skill: "Guide of Darkness", effect: "At the start of the first battle, gains 1 Focus." },
    ],
  },
  "arunka": {
    name: "Eternal Red Heart",
    options: [
      { skill: "Dagger Throw", effect: "Increases Dagger Throw's chance to inflict bleeding by 20%." },
      { skill: "A Thrashing In the Prairie", effect: "Increases damage dealt by A Thrashing in the Prairie by 10%." },
      { skill: "A Thrashing In the Prairie", effect: "Increases Combat Readiness of the caster by 30% when using A Thrashing in the Prairie." },
    ],
  },
  "baal-and-sezan": {
    name: "Cape of Selfish Interest",
    options: [
      { skill: "Ghost Haunt", effect: "Increases damage dealt by Ghost Haunt by 10%." },
      { skill: "Last Requiem", effect: "Dispels one buff from all enemies when using Last Requiem." },
      { skill: "Last Requiem", effect: "Increases all of Last Requiem's effect chances by 5%." },
    ],
  },
  "beehoo": {
    name: "Willful Bells of Sanctity",
    options: [
      { skill: "Flame Keeper", effect: "Increases the amount of Attack and Defense increased by Flame Keeper by 5%." },
      { skill: "Symphony of Radiance", effect: "Increases Attack of the caster for 2 turns when using Symphony of Radiance." },
      { skill: "Symphony of Radiance", effect: "Burns all enemies for 1 turn when using Symphony of Radiance." },
    ],
  },
  "bellona": {
    name: "Citrine Treasure",
    options: [
      { skill: "Butterfly Fan", effect: "Dispels one buff from all enemies." },
      { skill: "Razorwind Fan", effect: "Increases chance of decreasing Defense by 20%." },
      { skill: "Razorwind Fan", effect: "Decreases Combat Readiness of all enemies by 15%." },
    ],
  },
  "birgitta": {
    name: "Noblewoman's Pearl",
    options: [
      { skill: "Baseless Rumor", effect: "With Baseless Rumor's effect, decreases Combat Readiness by an additional 5%." },
      { skill: "Subterfuge", effect: "Grants increased Attack (Greater) to the target for 2 turns when using Subterfuge." },
      { skill: "Nothing Personal, Kid", effect: "Grants stealth to the caster for 2 turns when using Nothing Personal, Kid." },
    ],
  },
  "blooming-lidica": {
    name: "Sword of Rapture",
    options: [
      { skill: "Twirling Thorns", effect: "Removes 3 Soul from the enemy when using Twirling Thorns." },
      { skill: "Seductive Scent", effect: "Restricts all enemies for 2 turns when using Thorned Vine." },
      { skill: "Fruit of Ecstasy", effect: "Increases damage dealt by Fruit of Ecstasy by 10%." },
    ],
  },
  "bomb-model-kanna": {
    name: "Nana's Game Console",
    options: [
      { skill: "Quick Bombardment", effect: "Has a 50% chance to make the target unable to be buffed for 1 turn when using Quick Bombardment." },
      { skill: "Stance Shift", effect: "Increases Speed and Dual Attack chance of Stance Shift's Striking Stance by an additional 5%." },
      { skill: "Full Bombardment!", effect: "Makes the target unhealable for 2 turns when using Full Bombardment!" },
    ],
  },
  "briar-witch-iseria": {
    name: "Witch's Crown of Thorns",
    options: [
      { skill: "Cursed Thorn", effect: "Increases Cursed Thorn's decrease Defense effect chance by 10%." },
    ],
  },
  "cecilia": {
    name: "Black Winter Spear",
    options: [
      { skill: "Deliverance", effect: "Increases decrease Defense chance by 10% when using Deliverance." },
      { skill: "Steel Cloudburst", effect: "Decreases Speed of all enemies for 2 turns when using Steel Cloudburst." },
      { skill: "Steel Cloudburst", effect: "Makes all enemies unhealable for 2 turns when using Steel Cloudburst." },
    ],
  },
  "celine": {
    name: "Reingar PSC Armband",
    options: [
      { skill: "Intuition", effect: "Grants the caster stealth for 2 turns after using Blink." },
      { skill: "Intuition", effect: "When using Blink, damage dealt is increased by 10% and attacks the enemy with the highest Attack." },
      { skill: "Thunderclap", effect: "Damage dealt is increased by 10% when using Thunderclap." },
    ],
  },
  "cermia": {
    name: "Lucky Dice",
    options: [
      { skill: "Playing with Fire", effect: "25% chance to grant an extra attack with the same skill when using Playing with Fire." },
      { skill: "Hot Streak!", effect: "Grants barrier to the caster for 2 turns. Barrier strength increases proportional to the caster's Attack." },
      { skill: "All-In!", effect: "Decreases the skill cooldown of Hot Streak! by 2 turns when an enemy is defeated." },
    ],
  },
  "charles": {
    name: "Justice Mask",
    options: [
      { skill: "Slash", effect: "Chance of activating Smash increases by 10% when using Slash." },
      { skill: "Slash", effect: "Chance of decreasing Attack increases by 15%, and damage dealt increases by 10% when using Slash." },
      { skill: "Faithful Strike", effect: "Dispels all debuffs inflicted on the caster before the skill effect when using Faithful Strike." },
    ],
  },
  "charlotte": {
    name: "Little Queen's Guard",
    options: [
      { skill: "Dual Swords", effect: "Increases chance to decrease Attack by 10% when using Dual Swords." },
      { skill: "Will of the Swamp", effect: "After being attacked, increases Combat Readiness of the caster by 10%." },
      { skill: "Vortex", effect: "Dispels two debuffs from the caster before the skill effect when using Vortex." },
    ],
  },
  "chloe": {
    name: "Prototype Crown",
    options: [
      { skill: "Magic Bolt", effect: "Increases Attack of the caster for 2 turns when using Magic Bolt." },
      { skill: "Magic Bolt", effect: "Dispels all buffs when using Magic Bolt. (This effect is applied before inflicting magic nail.)" },
      { skill: "Hyper Strike", effect: "Decreases the enemy's Defense for 2 turns when using Hyper Strike." },
    ],
  },
  "choux": {
    name: "Snowy Mountain Horn",
    options: [
      { skill: "Chop", effect: "When a critical hit is made with Chop, has a 40% chance to activate Fwoooosh!." },
      { skill: "Fwoooosh!", effect: "Damage dealt is increased by 20% when using Fwoooosh!." },
      { skill: "Help Me, Cream!", effect: "Grants Immunity to all allies for 2 turns after using Help Me, Cream!." },
    ],
  },
  "command-model-laika": {
    name: "Prototype Memory Card",
    options: [
      { skill: "Supporting Fire", effect: "Increases Combat Readiness of the ally with the highest Attack instead of a random ally when using Supporting Fire." },
      { skill: "Volley Fire!", effect: "Increases Volley Fire!'s sleep chance effect by 10%." },
      { skill: "Volley Fire!", effect: "Increases damage dealt by Volley Fire! by 10%." },
    ],
  },
  "commander-pavel": {
    name: "Aithernum Regnum",
    options: [
      { skill: "Die, You Fly", effect: "When defeating an enemy with Die, You Fly, inflicts extinction on the enemy." },
    ],
  },
  "crimson-armin": {
    name: "Super Cute Shield",
    options: [
      { skill: "Security State", effect: "With Security State's effect, increases damage reduction by 10%." },
      { skill: "Shield of Holy Spirit", effect: "Extends duration of immunity granted by Shield of Holy Spirit by 1 turn." },
      { skill: "Shield of Holy Spirit", effect: "Recovers Health of all allies proportional to the caster's max Health when using Shield of Holy Spirit." },
    ],
  },
  "desert-jewel-basar": {
    name: "Solar Blessing",
    options: [
      { skill: "Bastet Roar", effect: "When using Bastet Roar, grants Indomitable to all allies for 2 turns." },
    ],
  },
  "destina": {
    name: "Ruele's Sad Promise",
    options: [
      { skill: "Key to an Oath", effect: "Dispels one debuff from an ally with the lowest health when using Key to an Oath." },
      { skill: "Regen", effect: "Has a 30% chance to reset skill cooldown of Regen when using Regen." },
      { skill: "Destina's Grace", effect: "Increases Combat Readiness of the target y an additional 20% when using Regen." },
    ],
  },
  "diene": {
    name: "Halted Pocketwatch",
    options: [
      { skill: "Light of Judgment", effect: "Increases Combat Readiness of the ally with the highest Attack by 5% when using Light of Judgement. When the caster has a buff, the effect is doubled." },
      { skill: "Blessing of the Goddess", effect: "Blessings of the Goddess's barrier strength is increased by 10%." },
      { skill: "Blessing of the Goddess", effect: "Increases Combat Readiness of all allies by 15% when using Blessings of the Goddess." },
    ],
  },
  "disciplinary-prefect-aria": {
    name: "Proof of Authority",
    options: [
      { skill: "Purge", effect: "Increases Purge's damage by 10% and removes 20 Soul from the enemy." },
    ],
  },
  "elena": {
    name: "Guide of Holy Brilliance",
    options: [
      { skill: "Guardian's Authority", effect: "Consecrated Ground increases Combat Readiness of the caster by an additional 5%." },
      { skill: "Eternally Shining Comet", effect: "Dispels one debuff from all allies before the skill effect when using Eternally Shining Comet." },
      { skill: "Eternally Shining Comet", effect: "Decreases skill cooldown of Eternally Shining Comet by 1 turn." },
    ],
  },
  "eligos": {
    name: "Boss's Coat",
    options: [
      { skill: "Point-Blank Shot", effect: "Increases Combat Readiness of the caster by 15% when using Point-Blank Shot." },
      { skill: "The Cleaner", effect: "At the start of the first battle, grants stealth to the caster for 1 turn." },
      { skill: "Cloak and Trigger", effect: "Decreases cooldown of Cloak and Trigger by 1 turn." },
    ],
  },
  "fairytale-tenebria": {
    name: "Time of Tales",
    options: [
      { skill: "One Pair", effect: "Increases One Pair's chance to redirect provoke by 25%." },
      { skill: "Tea Party", effect: "Grants a barrier to the ally with the highest max Health for 2 turns when using Tea Party. Barrier strength increases proportional to the target's max Health." },
      { skill: "Tea Party", effect: "Dispels one additional buff when using Tea Party." },
    ],
  },
  "faithless-lidica": {
    name: "Escapee's Whip Sword",
    options: [
      { skill: "Thorn", effect: "When using Thorn, triggers a Dual Attack from a random ally." },
    ],
  },
  "flan": {
    name: "Foreign Minister's Baton",
    options: [
      { skill: "Communication Breakdown", effect: "Increases buff dispel chance of Communication Breakdown by 25%." },
      { skill: "Data Monopoly", effect: "Increases Combat Readiness by an additional 10% when using Data Monopoly." },
      { skill: "Advantageous Deal", effect: "Decreases Combat Readiness by an additional 5% when using Advantageous Deal." },
    ],
  },
  "fumyr": {
    name: "Gemstone Earrings",
    options: [
      { skill: "Substratal Experimentation", effect: "Increases Combat Readiness by an additional 5% when using Substratal Experimentation." },
      { skill: "Elemental Inquiry", effect: "Increases Fruit of Knowledge's chance to decrease Defense by 15%." },
      { skill: "Sensory Dissection", effect: "Unaffected by elemental disadvantage when using Sensory Dissection." },
    ],
  },
  "guard-captain-krau": {
    name: "Guard Knight's Gauntlet",
    options: [
      { skill: "Crimson Flame", effect: "With Crimson Flame's effect, increases Combat Readiness by an additional 5%." },
      { skill: "Comet", effect: "Makes the target unable to be buffed for 2 turns when using Comet." },
      { skill: "Scorching Flare", effect: "Increases damage dealt by Scorching Flare by 20%." },
    ],
  },
  "haste": {
    name: "Blood Choker",
    options: [
      { skill: "Envoy's Scythe", effect: "Increases Envoy's Scythe's decrease Defense effect chance by 15%." },
      { skill: "Envoy's Scythe", effect: "Has a 75% chance to inflict bleeding on the target for 2 turns when using Envoy's Scythe." },
      { skill: "Vampiric Seal", effect: "Extends duration of bleed inflicted by Vampiric Seal by 1 turn." },
    ],
  },
  "hecate": {
    name: "Reaper's Cloak",
    options: [
      { skill: "Doomsday Judgment", effect: "Doomsday can also be used additionally when performing a Dual Attack." },
      { skill: "Authority of Death", effect: "Grants the caster 20% damage reduction when attacked." },
      { skill: "Inevitable Death", effect: "Increases Combat Readiness of the caster by 50% after using Inevitable Death." },
    ],
  },
  "hwayoung": {
    name: "Blooming Lotus",
    options: [
      { skill: "Supersonic Kick", effect: "Increases damage dealt by Supersonic Kick by 20%." },
      { skill: "Prairie Hawk", effect: "Prairie Hawk's increase Attack activates regardless of debuff status." },
      { skill: "Monarch's Flaming Strike", effect: "Increases damage dealt by Monarch's Flaming Strike by 10%." },
    ],
  },
  "ilynav": {
    name: "Bloody Jewel",
    options: [
      { skill: "Punish", effect: "Decreases skill cooldown of Punish by 1 turn." },
      { skill: "Repel", effect: "Grants a barrier to the caster for 2 turns when using Repel. Barrier strength increases proportional to the caster's max Health." },
      { skill: "Repel", effect: "Increases Combat Readiness of the caster by 50% when using Repel." },
    ],
  },
  "immortal-wukong": {
    name: "Regal Crown",
    options: [
      { skill: "Swing", effect: "Swing attacks all enemies, even when counterattacking." },
      { skill: "The Immortal One", effect: "Amplifies Critical Hit Resistance and Penetration Resistance increased by The Immortal One by 10%." },
      { skill: "Heavenly Fighter's Strike", effect: "Increases damage dealt by Heavenly Fighter's Strike by 20%." },
    ],
  },
  "kawerik": {
    name: "Proof of Choice",
    options: [
      { skill: "Dimensional Explosion", effect: "Increases Attack of the caster for 3 turns before attacking when using Dimensional Explosion." },
      { skill: "Dimensional Explosion", effect: "Inflicts silence for 1 turn when using Dimensional Explosion." },
      { skill: "Dimensional Explosion", effect: "Damage dealt is increased by 20% when using Dimensional Explosion." },
    ],
  },
  "kayron": {
    name: "Grudge Marble",
    options: [
      { skill: "Void Slash", effect: "Increases damage dealt by Void Slash by 10%." },
      { skill: "Apocalypse", effect: "Increases damage dealt by Apocalypse by 10%." },
      { skill: "Apocalypse", effect: "Inflicts silence for 1 turn when using Apocalypse." },
    ],
  },
  "ken": {
    name: "Advent of Destruction",
    options: [
      { skill: "Knockout", effect: "Increases Knockout's decrease Defense effect chance by 10%." },
      { skill: "Celestial Kick", effect: "Triggers a Dual Attack from the ally with the highest Attack when using Celestial Kick." },
      { skill: "Phoenix Flurry", effect: "Recover's Health of the caster when using Phoenix Flurry. Amount recovered increases proportional to the caster's Max Health." },
    ],
  },
  "kise": {
    name: "Moon's Judgment",
    options: [
      { skill: "Full Moon Scythe", effect: "Increases Combat Readiness of the caster by 15% after using Full Moon Scythe." },
      { skill: "Dark Scar", effect: "Damage dealt increases by 10% when using Dark Scar." },
      { skill: "Nocturne", effect: "Decreases duration of any buffs granted to the target by 1 turn when using Nocturne. (This effect is applied before increasing skill cooldown.)" },
    ],
  },
  "krau": {
    name: "Grace of the Vast Ocean Tide",
    options: [
      { skill: "Swordstorm", effect: "Increases Swordstorm's chance to provoke by 25%." },
      { skill: "Charge", effect: "Increases Speed of the caster for 2 turns when using Charge." },
      { skill: "Summon Ziegfried", effect: "Decreases cooldown of Summon Ziegfried by 1 turn." },
    ],
  },
  "laia": {
    name: "Mystic Cyclops Hairpin",
    options: [
      { skill: "Sing with Me!", effect: "Triggers a Dual Attack from the ally in the back row instead of a random ally when using Sing with Me!" },
      { skill: "Sweet Cheers", effect: "Increases Combat Readiness increase amount by 5% when using Sweet Cheers." },
      { skill: "The Spirit of Rock", effect: "Decreases cooldown of The Spirit of Rock by 1 turn." },
    ],
  },
  "landy": {
    name: "Everlasting Faith",
    options: [
      { skill: "The Chief Is on the Scene", effect: "At the start of the turn, when Fighting Spirit is full, dispels all debuffs from the caster." },
      { skill: "Full Burst", effect: "When using Full Burst, if Fighting Spirit is full, penetrates the target's Defense by an additional 10%." },
      { skill: "Full Burst", effect: "With Full Burst's effect, increases Combat Readiness by an additional 5%." },
    ],
  },
  "lethe": {
    name: "Kroscilla's Frost",
    options: [
      { skill: "Wave Slash", effect: "Increases damage dealt by Call of the Abyss by 10%." },
      { skill: "Wave Slash", effect: "Increases Call of the Abyss's amount recovered by 20%." },
      { skill: "Freeze Over", effect: "Cannot trigger a counterattack from the enemy when using Freeze Over." },
    ],
  },
  "lidica": {
    name: "Eternal Rose",
    options: [
      { skill: "Wild Rose", effect: "Increases Damage dealt by 20%." },
      { skill: "Wild Rose", effect: "Increases base Combat Readiness reduction by 5%." },
      { skill: "Thornbush", effect: "Dispels an additional buff." },
    ],
  },
  "lilias": {
    name: "Royal Prosperity",
    options: [
      { skill: "Follow Me! Charge!", effect: "Recovers Health of the caster when using Follow Me! Charge!. Amount recovered increases proportional to the caster's max Health." },
      { skill: "That's Far Enough", effect: "When Suppression is activated by That's Far Enough!, increases Combat Readiness of the caster by 20%." },
      { skill: "Ready, Load, Fire!", effect: "Increases damage dealt by Ready, Load, Fire! by 20%." },
    ],
  },
  "lilibet": {
    name: "Soul Tailor",
    options: [
      { skill: "Slice-Slice", effect: "Damage dealt is increased by 20% when using Slice-Slice." },
      { skill: "Snip-Snip", effect: "Dispels two debuffs from the caster before the skill effect when using Snip-Snip." },
      { skill: "Soul Cutter", effect: "Damage dealt is increased by 10% when using Soul Cutter." },
    ],
  },
  "lionheart-cermia": {
    name: "Roar of the Victor",
    options: [
      { skill: "It's Far From Over!", effect: "Grants 50% damage reduction when suffering an extra attack, counterattack, or Dual Attack." },
    ],
  },
  "little-queen-charlotte": {
    name: "Little Queen's Guard",
    options: [
      { skill: "A Queen's Responsibility", effect: "With A Queen's Dignity's effect, increases damage reduction by 10%." },
    ],
  },
  "lone-crescent-bellona": {
    name: "Cloud-Veiled Crimson Moon",
    options: [
      { skill: "Quixotic Crescent", effect: "Damage dealt by Quixotic Crescent increases proportional to the target's injuries." },
    ],
  },
  "lua": {
    name: "Window of All Creation",
    options: [
      { skill: "Butterfly Reverie", effect: "When using Butterfly Reverie, inflicts decreased Defense on the target for 2 turns." },
      { skill: "Sweet Talk", effect: "When using Sweet Talk, dispels one additional buff." },
      { skill: "Sweet Talk", effect: "When using Sweet Talk, increases skill cooldowns of enemies inflicted with sleep to max." },
    ],
  },
  "ludwig": {
    name: "Everlasting Lapis",
    options: [
      { skill: "Moonlight Blow", effect: "Increases the effect chance by 50% when Moonlight Blow." },
      { skill: "Moonlight Blow", effect: "When the target is an Ice-elemental Hero, decreases Defense for 2 turns after using Moonlight Blow." },
      { skill: "Call of the Full Moon", effect: "Damage dealt is increased by 10% when using Call of the Full Moon." },
    ],
  },
  "luluca": {
    name: "Communion Lotus",
    options: [
      { skill: "Wild Wave", effect: "Increases decrease Defense chance by 15% when using Wild Wave." },
      { skill: "Wild Wave", effect: "Has a 35% chance to grant an extra attack with the same skill using Wild Wave. Extra attack can only be granted once per turn by the caster." },
      { skill: "Wave of Vengeance", effect: "Has a 75% chance to decrease Attack of all enemies for 2 turns when using Wave of Vengeance." },
    ],
  },
  "luna": {
    name: "Dragon Emerald",
    options: [
      { skill: "Infinity Slash", effect: "Increases the caster's Combat Readiness by 15% after using Infinity Slash." },
      { skill: "Ragnar Spear", effect: "Decreases the enemy's Attack for 2 turns after using Ragnar Spear." },
      { skill: "Ragnar Spear", effect: "Grants an extra turn to the caster when the enemy is defeated by Ragnar Spear." },
    ],
  },
  "mediator-kawerik": {
    name: "Constraint of Absolute Power",
    options: [
      { skill: "Balance of Power", effect: "Decreases damage dealt by Balance of Power, but makes it penetrate the target's Defense. Cannot trigger a critical hit or a heavy blow." },
    ],
  },
  "melissa": {
    name: "Lord's Coffin",
    options: [
      { skill: "Might", effect: "Absorbs some of the damage dealt as Health when using Might." },
      { skill: "Manifestation", effect: "Damage dealt is increased by 10% when using Manifestation." },
      { skill: "Manifestation", effect: "When an enemy is defeated when using Manifestation, increases Attack for all allies except for the caster for 1 turn." },
    ],
  },
  "milim": {
    name: "Asura",
    options: [
      { skill: "Dragon Dive", effect: "Increases Dragon Dive's amount recovered by 20%." },
      { skill: "Dragon Buster", effect: "Increases damage dealt by Dragon Buster by 10%." },
      { skill: "Dragon Fear", effect: "When an enemy is defeated with Dragon Fear, acquires 1 additional Focus." },
    ],
  },
  "monarch-of-the-sword-iseria": {
    name: "Trace of Dawn",
    options: [
      { skill: "Elbris's Successor", effect: "Increases the amount of Hit Chance and Penetration Resistance increased by Elbris's Successor by 30%." },
    ],
  },
  "mort": {
    name: "Frigid Spirit",
    options: [
      { skill: "Extermination", effect: "Increases chance to decrease Defense by 10% when using Extermination." },
      { skill: "Absolute Dignity", effect: "Extends the duration of the increased Critical Hit Resistance buff granted by Sacred Blessing by 1 turn." },
      { skill: "Advent: Mortelix", effect: "Damage dealt is increased by 10% when using Advent: Mortelix." },
    ],
  },
  "mui": {
    name: "A Rabbit's Wild Nature",
    options: [
      { skill: "Punishment", effect: "Increases the effect chance by 10% when using Punishment." },
      { skill: "Grand Finale", effect: "Has a 35% chance to grant the caster an extra turn after using Grand Finale." },
      { skill: "Grand Finale", effect: "Silences the enemy with the highest Combat Readiness for 1 turn after using Grand Finale." },
    ],
  },
  "ocean-breeze-luluca": {
    name: "Shooting Star Popping Candy",
    options: [
      { skill: "Order's In, Just Wait!", effect: "Increases Combat Readiness by an additional 5% when using Order's In, Just Wait!" },
      { skill: "One Luluca's Special!", effect: "Increases Combat Readiness of the caster by an additional 15% after an enemy uses a non-attack skill." },
      { skill: "This One's On Me", effect: "Decreases cooldown of This One's On Me by 1 turn." },
    ],
  },
  "operator-sigret": {
    name: "Extermination Protocol",
    options: [
      { skill: "Annihilation", effect: "The extra turn condition triggered by Annihilation will be changed to when a critical hit is made." },
    ],
  },
  "pavel": {
    name: "Silver Belt of Determination",
    options: [
      { skill: "Storm Bullet", effect: "Dispels two debuffs from the caster before the skill effect when using Storm Bullet." },
      { skill: "Storm Bullet", effect: "Increases the Attack of the ally except for the caster with the highest attack for 2 turns after using Storm Bullet." },
      { skill: "Destructive Pursuit", effect: "Grants the caster skill nullifier once after using Destructive Pursuit." },
    ],
  },
  "pirate-captain-flan": {
    name: "Prophet of the Waves",
    options: [
      { skill: "Full Burst", effect: "When using Full Burst, steals one additional buff from the target and randomly grants it to an ally." },
    ],
  },
  "ravi": {
    name: "Flame of Life",
    options: [
      { skill: "Slaughter", effect: "Has a 40% chance to dispel one debuff from the caster when using Slaughter." },
      { skill: "Slaughter", effect: "Has a 70% chance to make the enemy unable to be buffed for 1 turn after using Slaughter." },
      { skill: "Devil Drive", effect: "Increases stun chance by 10% when using Devil Drive." },
    ],
  },
  "ray": {
    name: "Flawless Wings",
    options: [
      { skill: "Extreme Remedies", effect: "If all allies are Earth elemental Heroes, decreases cooldown of Invigorate by 1 turn when using Extreme Remedies on the caster's turn." },
      { skill: "Light of Rebirth", effect: "Amount recovered is increased by 15% when using Light of Rebirth." },
      { skill: "Invigorate", effect: "Increases Defense of the caster for 2 turns when using Invigorate." },
    ],
  },
  "ruele-of-light": {
    name: "Rabbit Fortune Cookie Pouch",
    options: [
      { skill: "Light Ascending", effect: "Applies the same effect to the caster when using Light Ascending." },
    ],
  },
  "saria": {
    name: "Primeval Diadem",
    options: [
      { skill: "Guidance of Nature", effect: "Increases Combat Readiness increase effect of Guidance of Nature by an additional 10%." },
      { skill: "Guidance of Nature", effect: "Increases damage dealt by Wings of Liberation by 20%." },
      { skill: "Blossoming Hope", effect: "When using Blossoming Hope, the duration of increased Attack is increased to 3 turns." },
    ],
  },
  "seaside-bellona": {
    name: "Waltz of Waves",
    options: [
      { skill: "I'm with My Friends", effect: "Dispels one debuff from the caster before attacking when using You're Not Cute." },
      { skill: "I'm with My Friends", effect: "Increases damage dealt by You're Not Cute." },
      { skill: "Haven't I Warned You?", effect: "Decreases skill cooldown of Haven't I Warned You? by 1 turn." },
    ],
  },
  "senya": {
    name: "Grace of Madness",
    options: [
      { skill: "Spear of Vengeance", effect: "Recovers Health of the caster after using Spear of Vengeance. Amount recovered increases proportional to the caster's Attack." },
      { skill: "Indomitable Spirit", effect: "Increases Grace of the Battlefield's barrier strength by 20%." },
      { skill: "Dragon Slayer's Strike", effect: "Grants Increased Attack (Greater) to the caster for 3 turns after using Dragon Slayer's Strike. (This effect is applied before adopting a counterattack stance)." },
    ],
  },
  "sez": {
    name: "Sealed Energy",
    options: [
      { skill: "Dark Shadow", effect: "Increases damage dealt by Dark Shadow by 20%." },
      { skill: "Die Hard", effect: "Increases Attack of the caster for 2 turns when using Encroach." },
      { skill: "Die Hard", effect: "Increases damage dealt by Encroach by 20%." },
    ],
  },
  "sharun": {
    name: "Beads of Mystic Spirits",
    options: [
      { skill: "Just Trust Me", effect: "With Just Trust Me's effect, increases Combat Readiness of the caster by an additional 5%." },
      { skill: "Just Trust Me", effect: "Increases Just Trust Me's barrier strength by 15%." },
      { skill: "May You Perish", effect: "Decreases cooldown of May You Perish by 1 turn." },
    ],
  },
  "shuna": {
    name: "Shuna's Shuttle",
    options: [
      { skill: "Blooming Lotus", effect: "Increases Blooming Lotus's barrier strength by 10%." },
      { skill: "Blooming Lotus", effect: "Increases Combat Readiness of the caster by 30% when using Blooming Lotus." },
      { skill: "Sleeping Spell", effect: "Increases Sleeping Spell's sleep effect chance by 15%." },
    ],
  },
  "sigret": {
    name: "Queen's Keepsake",
    options: [
      { skill: "Sever", effect: "Increases damage dealt by Sever by 20%." },
      { skill: "Sever", effect: "Increases chance of inflicting bleed when using Sever by 20%." },
      { skill: "Smash", effect: "Changes the conditions necessary to activate Sever when using Smash from 50% remaining Health to 75% remaining Health." },
    ],
  },
  "specimen-sez": {
    name: "Cross of Proof",
    options: [
      { skill: "Light Storm", effect: "Light Storm's condition for penetrating Defense by 100% changes to being stunned or asleep." },
    ],
  },
  "specter-tenebria": {
    name: "Mirror of Desire",
    options: [
      { skill: "Nightmare Illusion", effect: "Changes the Attack and Defense increase condition of Nightmare Illusion to after attacking." },
    ],
  },
  "spirit-eye-celine": {
    name: "Phantom Armor",
    options: [
      { skill: "Sixth Sense", effect: "When the caster uses Soulburn for the first time, increases damage dealt by 50% and does not cost Soul." },
    ],
  },
  "straze": {
    name: "Star Extinction",
    options: [
      { skill: "Star Extinction", effect: "When the enemy is defeated by Star Extinction, extends buff durations of the caster by 1 turn and grants an extra turn." },
    ],
  },
  "successor-taeyou": {
    name: "Azure Blade of Spring Thunder",
    options: [
      { skill: "Azure Phantom", effect: "Increases Azure Phantom's chance to decrease Defense by 15%." },
    ],
  },
  "summer-break-charlotte": {
    name: "Twin Fish Blades",
    options: [
      { skill: "Caught A Big One", effect: "Increases Caught A Big One's chance to decrease Defense by 5%." },
      { skill: "Caught A Big One", effect: "Increases Combat Readiness by an additional 5% when Caught A Big One is activated as a Dual Attack." },
      { skill: "An Adult's Responsibility", effect: "At the start of the first battle, grants increased Attack to the caster for 2 turns." },
    ],
  },
  "summertime-iseria": {
    name: "Alexa's Gift",
    options: [
      { skill: "Are you the Culprit?", effect: "Increases buff dispel chance of Are you the Culprit? by 5%." },
      { skill: "Are you the Culprit?", effect: "After using Are you the Culprit?, detonates bombs inflicted on the target at the end of the turn." },
      { skill: "Suppression Attempt", effect: "Upon using Suppress!, plants a bomb on all enemies for 2 turns." },
    ],
  },
  "taeyou": {
    name: "Crown of Pyrokinesis",
    options: [
      { skill: "Full Moon Slash", effect: "Increases Full Moon Slash's Combat Readiness increase effect by 5%." },
      { skill: "Azure Waves Of The Ocean", effect: "Increases Combat Readiness of the caster by 15% after an enemy uses a non-attack skill." },
      { skill: "Tornado Sweep", effect: "Increases skill cooldowns of all enemies except for the target with the highest Attack by 1 turn when using Tornado Sweep." },
    ],
  },
  "tenebria": {
    name: "Shadow King Plushie",
    options: [
      { skill: "Dark Explosion", effect: "Has a 75% chance to dispel one buff from the target when using Dark Explosion. (This effect is applied before sleep)" },
      { skill: "Nightmare", effect: "Increases sleep effect chance of Nightmare by 15%." },
      { skill: "Nightmare", effect: "Grants increased Attack (Greater) instead of increased Attack when using Nightmare." },
    ],
  },
  "top-model-luluca": {
    name: "Homage to Rekos",
    options: [
      { skill: "Victory Pose", effect: "Grants increased Speed to all allies for 2 turns when using Victory Pose." },
    ],
  },
  "tywin": {
    name: "Estyria",
    options: [
      { skill: "Sword Storm", effect: "Dispels one more buff when using Sword Storm." },
      { skill: "Sword Storm", effect: "Increases Combat Readiness of the ally in the back row by 10% when using Sword Storm." },
      { skill: "Commanding Shout", effect: "Increases Commanding Shout's barrier strength by 20%." },
    ],
  },
  "urban-shadow-choux": {
    name: "Cream Pastry Scouter",
    options: [
      { skill: "Wild Charge", effect: "At the end of the turn, grants stealth to the caster for 1 turn." },
    ],
  },
  "vildred": {
    name: "Blade Insignia",
    options: [
      { skill: "Dancing Blade", effect: "Dancing Blade increases the caster's Combat Readiness by an additional 5% when an enemy is defeated." },
      { skill: "Blade Ascent", effect: "Damage dealt is increased by 10% when using Blade Ascent." },
      { skill: "Blade Ascent", effect: "Increases Critical Hit Damage of the caster for 2 turns after using Blade Ascent." },
    ],
  },
  "vivian": {
    name: "True Sight",
    options: [
      { skill: "Vitality Drain", effect: "Combat Readiness of the caster increases by an extra 5% when using Vitality Drain." },
      { skill: "Mana Amplification", effect: "Increases the caster's Combat Readiness by 50% when using Mana Amplification." },
      { skill: "Mana Amplification", effect: "Dispels one debuff from all allies before the skill effect when using Mana Amplification." },
    ],
  },
  "young-senya": {
    name: "It's Senya's",
    options: [
      { skill: "No Bullying!", effect: "Additional damage caused by Special Friendship occurs regardless of the bearer’s turn." },
      { skill: "No Bullying!", effect: "When using Help!, additional damage increases to 20% of max Health." },
      { skill: "Snack Time!", effect: "When using Snack Time!, grants a barrier (proportional to the caster's max Health) to all allies for 2 turns." },
    ],
  },
  "yufine": {
    name: "Azure Dragon's Spirit",
    options: [
      { skill: "Double Slash", effect: "35% chance to extend the caster's buff duration by 1 turn when using Double Slash." },
      { skill: "Double Slash", effect: "Damage dealt is increased by 30% when using Double Slash." },
      { skill: "Dragon's Roar", effect: "Increases chance of inflicting silence with Dragon's Roar by 15%." },
    ],
  },
  "yulha": {
    name: "Wind Ring",
    options: [
      { skill: "Malicious Smile", effect: "With Murderous Intent's effect, increases Combat Readiness by an additional 10%." },
      { skill: "Malicious Smile", effect: "With Malicious Smile's effect, increases damage reflected by 20%." },
      { skill: "Symphony of Agony", effect: "Resets skill cooldown when defeating an enemy with Symphony of Agony." },
    ],
  },
  "yuna": {
    name: "Small Drone Tuna",
    options: [
      { skill: "Homing Laser", effect: "Combat Readiness increase by 1% per target when using Homing Laser." },
      { skill: "Upgrade", effect: "Has a 30% chance each to grant allies increased Attack (Greater) for 2 turns when using Upgrade." },
      { skill: "Meteor Cannon", effect: "Damage dealt increases by 30% when using Meteor Cannon." },
    ],
  },
  "zahhak": {
    name: "A Spell of Tragic Love",
    options: [
      { skill: "Elaborate Plan", effect: "Increases Attack of the target and the caster for 2 turns when using Elaborate Plan." },
      { skill: "Execute", effect: "Inflicts resource reduction on the target by 60% before the skill's effect when using Execute." },
      { skill: "Execute", effect: "Decreases skill cooldown of Execute by 1 turn." },
    ],
  },
};

