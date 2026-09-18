-- Journal pass 15 Sep 2026: eight units verified into Scout.
-- Idempotent so a second migrate does not duplicate the bell ping.

insert into notices (id, author_id, kind, title, body, published)
select
  'notice-2026-09-15-journal-8',
  coalesce(
    (select user_id from profiles where role = 'admin' order by user_id limit 1),
    'system'
  ),
  'catalog',
  '8 units Journal-checked into Scout',
  'Journal pass, 15 Sep. These eight are verified in Scout.

Beehoo — strips two, then Cannot Buff and Burn. Incinerate detonates on his turn and cannot Dual Attack. Speed 120. Cannot Buff is not Seal.

Baal & Sezan — Dark Cloud scales with debuffs; a kill resets Last Requiem. Cape of Selfish Interest is Exclusive Equipment, not the base kit.

Baiken is a thief. Tsurane extra-turns on a crit; Garyo detonates Bleed. Team Combat Readiness 15%→25%.

Basar — Sandstorm full strip, Cannot Buff 2 turns, Combat Readiness −30%. Soulburn ignores Effect Resistance. S1 random: Silence, Decrease Defense, Decrease Attack, Unhealable.

Bellona — speed 115. At 5 Focus, Windbreak Fan extra-attacks Razorwind (not Dual Attack). Soulburn is an extra turn.

Benimaru — an enemy extra turn cleanses him, grants Multilayer Barrier, Combat Readiness +25%. Hell Flare 30% penetrate, 60% with Barrier. Do not extra-turn into him.

Bomb Model Kanna — Shelling Stance +40% Effectiveness; Striking Stance +5% Speed and Dual Attack chance. Strips one, then team Speed Up.

Cecilia — speed 110. Provoke, then team Immunity. S2 Decrease Attack is 85%.',
  true
where not exists (
  select 1 from notices where id = 'notice-2026-09-15-journal-8'
);
