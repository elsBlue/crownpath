-- Journal pass 21 Sep 2026: seven 17-Sep patch kits rechecked into Scout.
-- Idempotent so a second migrate does not duplicate the bell ping.

insert into notices (id, author_id, kind, title, body, published)
select
  'notice-2026-09-21-journal-7',
  coalesce(
    (select user_id from profiles where role = 'admin' order by user_id limit 1),
    'system'
  ),
  'catalog',
  '7 kits rechecked — 17 Sep patch',
  'Journal pass, 21 Sep. These seven match in-game after the 17 Sep patch.

Miseria — Elbris is +50% Hit Chance and Penetration Resistance, not 70%. Doubled counters still fire the Front ally. Exclusive Equipment Trace of Dawn adds 30% of those numbers.

DJ Basar — S2 is Desert Cycle. Extra turn on Barrier is gone. If he has Barrier after an enemy skill, Desert Storm inverts Barrier and cuts Combat Readiness 20%. Bastet Roar is team Immunity.

US Choux — Bzzt is 2,500. She starts with 1 Focus. Soulburn pays 40% of Injury already on the target. Cream Pastry pens 50%.

A.Yufine — Unbridled Outburst now fully penetrates. Frenzied Strike still strips everyone and cuts Combat Readiness in half.

Elena — Consecrated Ground cleanses one from the team, heals, and she takes 30% Combat Readiness after an area attack.

Frida — Oasis All-Ride Pass is on everyone at the start. Oasis Land grants Increase Attack and ignore sharing for 3 turns.

Kawerik — Mana Field eats Fighting Spirit to cancel skill damage. Dimensional Corridor full-pushes cooldowns and extra-turns on a crit.',
  true
where not exists (
  select 1 from notices where id = 'notice-2026-09-21-journal-7'
);
