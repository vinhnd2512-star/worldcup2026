-- FIFA World Cup 2026 knockout bracket.
-- Run after schema.sql. Bracket source: https://www.fifa.com/en/articles/knockout-stage-match-schedule-bracket
-- Kickoff times are stored as UTC timestamps so the UI renders local time correctly.

insert into public.bracket_matches (
  match_no,
  round_key,
  round_label,
  match_date,
  starts_at,
  home_label,
  away_label,
  venue,
  city,
  source_url,
  display_order
)
values
  (73, 'round_of_32', 'Round of 32', '2026-06-28', '2026-06-28 19:00:00+00', 'Group A runners-up', 'Group B runners-up', 'Los Angeles Stadium', 'Los Angeles', 'https://www.fifa.com/en/articles/knockout-stage-match-schedule-bracket', 73),
  (74, 'round_of_32', 'Round of 32', '2026-06-29', '2026-06-29 20:30:00+00', 'Group E winners', 'Group A/B/C/D/F third place', 'Boston Stadium', 'Boston', 'https://www.fifa.com/en/articles/knockout-stage-match-schedule-bracket', 74),
  (75, 'round_of_32', 'Round of 32', '2026-06-29', '2026-06-30 01:00:00+00', 'Group F winners', 'Group C runners-up', 'Estadio Monterrey', 'Monterrey', 'https://www.fifa.com/en/articles/knockout-stage-match-schedule-bracket', 75),
  (76, 'round_of_32', 'Round of 32', '2026-06-29', '2026-06-29 17:00:00+00', 'Group C winners', 'Group F runners-up', 'Houston Stadium', 'Houston', 'https://www.fifa.com/en/articles/knockout-stage-match-schedule-bracket', 76),
  (77, 'round_of_32', 'Round of 32', '2026-06-30', '2026-06-30 21:00:00+00', 'Group I winners', 'Group C/D/F/G/H third place', 'New York New Jersey Stadium', 'New York/New Jersey', 'https://www.fifa.com/en/articles/knockout-stage-match-schedule-bracket', 77),
  (78, 'round_of_32', 'Round of 32', '2026-06-30', '2026-06-30 17:00:00+00', 'Group E runners-up', 'Group I runners-up', 'Dallas Stadium', 'Dallas', 'https://www.fifa.com/en/articles/knockout-stage-match-schedule-bracket', 78),
  (79, 'round_of_32', 'Round of 32', '2026-06-30', '2026-07-01 01:00:00+00', 'Group A winners', 'Group C/E/F/H/I third place', 'Mexico City Stadium', 'Mexico City', 'https://www.fifa.com/en/articles/knockout-stage-match-schedule-bracket', 79),
  (80, 'round_of_32', 'Round of 32', '2026-07-01', '2026-07-01 16:00:00+00', 'Group L winners', 'Group E/H/I/J/K third place', 'Atlanta Stadium', 'Atlanta', 'https://www.fifa.com/en/articles/knockout-stage-match-schedule-bracket', 80),
  (81, 'round_of_32', 'Round of 32', '2026-07-01', '2026-07-02 00:00:00+00', 'Group D winners', 'Group B/E/F/I/J third place', 'San Francisco Bay Area Stadium', 'San Francisco Bay Area', 'https://www.fifa.com/en/articles/knockout-stage-match-schedule-bracket', 81),
  (82, 'round_of_32', 'Round of 32', '2026-07-01', '2026-07-01 20:00:00+00', 'Group G winners', 'Group A/E/H/I/J third place', 'Seattle Stadium', 'Seattle', 'https://www.fifa.com/en/articles/knockout-stage-match-schedule-bracket', 82),
  (83, 'round_of_32', 'Round of 32', '2026-07-02', '2026-07-02 23:00:00+00', 'Group K runners-up', 'Group L runners-up', 'Toronto Stadium', 'Toronto', 'https://www.fifa.com/en/articles/knockout-stage-match-schedule-bracket', 83),
  (84, 'round_of_32', 'Round of 32', '2026-07-02', '2026-07-02 19:00:00+00', 'Group H winners', 'Group J runners-up', 'Los Angeles Stadium', 'Los Angeles', 'https://www.fifa.com/en/articles/knockout-stage-match-schedule-bracket', 84),
  (85, 'round_of_32', 'Round of 32', '2026-07-02', '2026-07-03 03:00:00+00', 'Group B winners', 'Group E/F/G/I/J third place', 'BC Place Vancouver', 'Vancouver', 'https://www.fifa.com/en/articles/knockout-stage-match-schedule-bracket', 85),
  (86, 'round_of_32', 'Round of 32', '2026-07-03', '2026-07-03 22:00:00+00', 'Group J winners', 'Group H runners-up', 'Miami Stadium', 'Miami', 'https://www.fifa.com/en/articles/knockout-stage-match-schedule-bracket', 86),
  (87, 'round_of_32', 'Round of 32', '2026-07-03', '2026-07-04 01:30:00+00', 'Group K winners', 'Group D/E/I/J/L third place', 'Kansas City Stadium', 'Kansas City', 'https://www.fifa.com/en/articles/knockout-stage-match-schedule-bracket', 87),
  (88, 'round_of_32', 'Round of 32', '2026-07-03', '2026-07-03 18:00:00+00', 'Group D runners-up', 'Group G runners-up', 'Dallas Stadium', 'Dallas', 'https://www.fifa.com/en/articles/knockout-stage-match-schedule-bracket', 88),
  (89, 'round_of_16', 'Round of 16', '2026-07-04', '2026-07-04 21:00:00+00', 'Winner match 74', 'Winner match 77', 'Philadelphia Stadium', 'Philadelphia', 'https://www.fifa.com/en/articles/knockout-stage-match-schedule-bracket', 89),
  (90, 'round_of_16', 'Round of 16', '2026-07-04', '2026-07-04 17:00:00+00', 'Winner match 73', 'Winner match 75', 'Houston Stadium', 'Houston', 'https://www.fifa.com/en/articles/knockout-stage-match-schedule-bracket', 90),
  (91, 'round_of_16', 'Round of 16', '2026-07-05', '2026-07-05 20:00:00+00', 'Winner match 76', 'Winner match 78', 'New York New Jersey Stadium', 'New York/New Jersey', 'https://www.fifa.com/en/articles/knockout-stage-match-schedule-bracket', 91),
  (92, 'round_of_16', 'Round of 16', '2026-07-05', '2026-07-06 00:00:00+00', 'Winner match 79', 'Winner match 80', 'Mexico City Stadium', 'Mexico City', 'https://www.fifa.com/en/articles/knockout-stage-match-schedule-bracket', 92),
  (93, 'round_of_16', 'Round of 16', '2026-07-06', '2026-07-06 19:00:00+00', 'Winner match 83', 'Winner match 84', 'Dallas Stadium', 'Dallas', 'https://www.fifa.com/en/articles/knockout-stage-match-schedule-bracket', 93),
  (94, 'round_of_16', 'Round of 16', '2026-07-06', '2026-07-07 00:00:00+00', 'Winner match 81', 'Winner match 82', 'Seattle Stadium', 'Seattle', 'https://www.fifa.com/en/articles/knockout-stage-match-schedule-bracket', 94),
  (95, 'round_of_16', 'Round of 16', '2026-07-07', '2026-07-07 16:00:00+00', 'Winner match 86', 'Winner match 88', 'Atlanta Stadium', 'Atlanta', 'https://www.fifa.com/en/articles/knockout-stage-match-schedule-bracket', 95),
  (96, 'round_of_16', 'Round of 16', '2026-07-07', '2026-07-07 20:00:00+00', 'Winner match 85', 'Winner match 87', 'BC Place Vancouver', 'Vancouver', 'https://www.fifa.com/en/articles/knockout-stage-match-schedule-bracket', 96),
  (97, 'quarter_final', 'Quarter-finals', '2026-07-09', '2026-07-09 20:00:00+00', 'Winner match 89', 'Winner match 90', 'Boston Stadium', 'Boston', 'https://www.fifa.com/en/articles/knockout-stage-match-schedule-bracket', 97),
  (98, 'quarter_final', 'Quarter-finals', '2026-07-10', '2026-07-10 19:00:00+00', 'Winner match 93', 'Winner match 94', 'Los Angeles Stadium', 'Los Angeles', 'https://www.fifa.com/en/articles/knockout-stage-match-schedule-bracket', 98),
  (99, 'quarter_final', 'Quarter-finals', '2026-07-11', '2026-07-11 21:00:00+00', 'Winner match 91', 'Winner match 92', 'Miami Stadium', 'Miami', 'https://www.fifa.com/en/articles/knockout-stage-match-schedule-bracket', 99),
  (100, 'quarter_final', 'Quarter-finals', '2026-07-11', '2026-07-12 01:00:00+00', 'Winner match 95', 'Winner match 96', 'Kansas City Stadium', 'Kansas City', 'https://www.fifa.com/en/articles/knockout-stage-match-schedule-bracket', 100),
  (101, 'semi_final', 'Semi-finals', '2026-07-14', '2026-07-14 19:00:00+00', 'Winner match 97', 'Winner match 98', 'Dallas Stadium', 'Dallas', 'https://www.fifa.com/en/articles/knockout-stage-match-schedule-bracket', 101),
  (102, 'semi_final', 'Semi-finals', '2026-07-15', '2026-07-15 19:00:00+00', 'Winner match 99', 'Winner match 100', 'Atlanta Stadium', 'Atlanta', 'https://www.fifa.com/en/articles/knockout-stage-match-schedule-bracket', 102),
  (103, 'third_place', 'Third-place play-off', '2026-07-18', '2026-07-18 21:00:00+00', 'Runner-up match 101', 'Runner-up match 102', 'Miami Stadium', 'Miami', 'https://www.fifa.com/en/articles/knockout-stage-match-schedule-bracket', 103),
  (104, 'final', 'Final', '2026-07-19', '2026-07-19 19:00:00+00', 'Winner match 101', 'Winner match 102', 'New York New Jersey Stadium', 'New York/New Jersey', 'https://www.fifa.com/en/articles/knockout-stage-match-schedule-bracket', 104)
on conflict (match_no) do update
set round_key = excluded.round_key,
    round_label = excluded.round_label,
    match_date = excluded.match_date,
    starts_at = excluded.starts_at,
    home_label = excluded.home_label,
    away_label = excluded.away_label,
    venue = excluded.venue,
    city = excluded.city,
    source_url = excluded.source_url,
    display_order = excluded.display_order,
    updated_at = now();

update public.bracket_matches
set starts_at = match_date::timestamp at time zone 'UTC'
where match_no between 73 and 104
  and starts_at is null;

insert into public.bracket_slots (match_no, slot, source_type, source_match_no)
values
  (73, 'home', 'manual', null),
  (73, 'away', 'manual', null),
  (74, 'home', 'manual', null),
  (74, 'away', 'manual', null),
  (75, 'home', 'manual', null),
  (75, 'away', 'manual', null),
  (76, 'home', 'manual', null),
  (76, 'away', 'manual', null),
  (77, 'home', 'manual', null),
  (77, 'away', 'manual', null),
  (78, 'home', 'manual', null),
  (78, 'away', 'manual', null),
  (79, 'home', 'manual', null),
  (79, 'away', 'manual', null),
  (80, 'home', 'manual', null),
  (80, 'away', 'manual', null),
  (81, 'home', 'manual', null),
  (81, 'away', 'manual', null),
  (82, 'home', 'manual', null),
  (82, 'away', 'manual', null),
  (83, 'home', 'manual', null),
  (83, 'away', 'manual', null),
  (84, 'home', 'manual', null),
  (84, 'away', 'manual', null),
  (85, 'home', 'manual', null),
  (85, 'away', 'manual', null),
  (86, 'home', 'manual', null),
  (86, 'away', 'manual', null),
  (87, 'home', 'manual', null),
  (87, 'away', 'manual', null),
  (88, 'home', 'manual', null),
  (88, 'away', 'manual', null),
  (89, 'home', 'winner', 74),
  (89, 'away', 'winner', 77),
  (90, 'home', 'winner', 73),
  (90, 'away', 'winner', 75),
  (91, 'home', 'winner', 76),
  (91, 'away', 'winner', 78),
  (92, 'home', 'winner', 79),
  (92, 'away', 'winner', 80),
  (93, 'home', 'winner', 83),
  (93, 'away', 'winner', 84),
  (94, 'home', 'winner', 81),
  (94, 'away', 'winner', 82),
  (95, 'home', 'winner', 86),
  (95, 'away', 'winner', 88),
  (96, 'home', 'winner', 85),
  (96, 'away', 'winner', 87),
  (97, 'home', 'winner', 89),
  (97, 'away', 'winner', 90),
  (98, 'home', 'winner', 93),
  (98, 'away', 'winner', 94),
  (99, 'home', 'winner', 91),
  (99, 'away', 'winner', 92),
  (100, 'home', 'winner', 95),
  (100, 'away', 'winner', 96),
  (101, 'home', 'winner', 97),
  (101, 'away', 'winner', 98),
  (102, 'home', 'winner', 99),
  (102, 'away', 'winner', 100),
  (103, 'home', 'loser', 101),
  (103, 'away', 'loser', 102),
  (104, 'home', 'winner', 101),
  (104, 'away', 'winner', 102)
on conflict (match_no, slot) do update
set source_type = excluded.source_type,
    source_match_no = excluded.source_match_no,
    updated_at = now();

-- Confirmed Round of 32 teams. This block is intentionally idempotent so it
-- can be rerun after group-stage standings are imported.
with confirmed(match_no, home_code, away_code) as (
  values
    (73, 'RSA', 'CAN'),
    (74, 'GER', 'PAR'),
    (75, 'NED', 'MAR'),
    (76, 'BRA', 'JPN'),
    (77, 'FRA', 'SWE'),
    (78, 'CIV', 'NOR'),
    (79, 'MEX', 'ECU'),
    (80, 'ENG', 'COD'),
    (81, 'USA', 'BIH'),
    (82, 'BEL', 'SEN'),
    (83, 'POR', 'CRO'),
    (84, 'ESP', 'AUT'),
    (85, 'SUI', 'ALG'),
    (86, 'ARG', 'CPV'),
    (87, 'COL', 'GHA'),
    (88, 'AUS', 'EGY')
),
resolved as (
  select
    c.match_no,
    ht.id as home_team_id,
    at.id as away_team_id,
    ht.name as home_label,
    at.name as away_label
  from confirmed c
  join public.teams ht on ht.code = c.home_code
  join public.teams at on at.code = c.away_code
)
update public.bracket_matches bm
set home_team_id = resolved.home_team_id,
    away_team_id = resolved.away_team_id,
    home_label = resolved.home_label,
    away_label = resolved.away_label,
    is_confirmed = true,
    source = 'confirmed_knockout',
    updated_at = now()
from resolved
where bm.match_no = resolved.match_no;

do $$
declare
  v_match_no integer;
begin
  for v_match_no in
    select match_no
    from public.bracket_matches
    where match_no between 73 and 88
      and home_team_id is not null
      and away_team_id is not null
    order by match_no
  loop
    perform public.ensure_bracket_match(v_match_no);
  end loop;
end;
$$;

update public.match_markets mm
set closes_at = m.starts_at,
    updated_at = now()
from public.matches m
where mm.match_id = m.id
  and m.provider_id between 'fifa-2026-073' and 'fifa-2026-104'
  and mm.closes_at is distinct from m.starts_at;
