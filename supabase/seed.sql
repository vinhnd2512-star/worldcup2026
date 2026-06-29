-- Seed official FIFA World Cup 2026 group-stage teams, fixtures, and default markets.
-- Run after schema.sql. This file replaces the old MVP demo teams/matches.

alter table public.teams
  add column if not exists group_name text,
  add column if not exists group_slot integer,
  add column if not exists confederation text,
  add column if not exists flag_code text,
  add column if not exists flag_url text,
  add column if not exists fifa_rank integer,
  add column if not exists fifa_points numeric(8, 2),
  add column if not exists rating_source text,
  add column if not exists rating_updated_at timestamptz,
  add column if not exists fifa_team_id text,
  add column if not exists fifa_profile_json jsonb not null default '{}',
  add column if not exists coach_name text,
  add column if not exists world_cup_titles integer not null default 0,
  add column if not exists world_cup_title_years integer[] not null default '{}',
  add column if not exists profile_updated_at timestamptz;

alter table public.team_players
  add column if not exists height_cm numeric(5, 1),
  add column if not exists weight_kg numeric(5, 1),
  add column if not exists preferred_foot text,
  add column if not exists fifa_position_code integer,
  add column if not exists real_position integer,
  add column if not exists position_side integer,
  add column if not exists active_status integer,
  add column if not exists fifa_payload_json jsonb not null default '{}';

-- Remove old demo rows from the earlier MVP seed without touching live provider sync rows.
delete from public.sync_runs
where provider = 'api-football'
  and job_type = 'metadata'
  and message = 'Seed data active. Add API keys before provider sync.';

delete from public.outright_markets
where source = 'internal'
  and market_key in ('tournament_winner', 'golden_boot');

delete from public.matches
where provider_id like 'seed-%';

delete from public.teams
where provider_id like 'seed-team-%';

insert into public.teams (provider_id, code, name, country, group_name, group_slot, confederation)
values
  ('fifa-2026-team-mex', 'MEX', 'Mexico', 'Mexico', 'A', 1, 'CONCACAF'),
  ('fifa-2026-team-rsa', 'RSA', 'South Africa', 'South Africa', 'A', 2, 'CAF'),
  ('fifa-2026-team-kor', 'KOR', 'Korea Republic', 'South Korea', 'A', 3, 'AFC'),
  ('fifa-2026-team-cze', 'CZE', 'Czechia', 'Czechia', 'A', 4, 'UEFA'),
  ('fifa-2026-team-can', 'CAN', 'Canada', 'Canada', 'B', 1, 'CONCACAF'),
  ('fifa-2026-team-bih', 'BIH', 'Bosnia and Herzegovina', 'Bosnia and Herzegovina', 'B', 2, 'UEFA'),
  ('fifa-2026-team-qat', 'QAT', 'Qatar', 'Qatar', 'B', 3, 'AFC'),
  ('fifa-2026-team-sui', 'SUI', 'Switzerland', 'Switzerland', 'B', 4, 'UEFA'),
  ('fifa-2026-team-bra', 'BRA', 'Brazil', 'Brazil', 'C', 1, 'CONMEBOL'),
  ('fifa-2026-team-mar', 'MAR', 'Morocco', 'Morocco', 'C', 2, 'CAF'),
  ('fifa-2026-team-hai', 'HAI', 'Haiti', 'Haiti', 'C', 3, 'CONCACAF'),
  ('fifa-2026-team-sco', 'SCO', 'Scotland', 'Scotland', 'C', 4, 'UEFA'),
  ('fifa-2026-team-usa', 'USA', 'United States', 'United States', 'D', 1, 'CONCACAF'),
  ('fifa-2026-team-par', 'PAR', 'Paraguay', 'Paraguay', 'D', 2, 'CONMEBOL'),
  ('fifa-2026-team-aus', 'AUS', 'Australia', 'Australia', 'D', 3, 'AFC'),
  ('fifa-2026-team-tur', 'TUR', 'Türkiye', 'Türkiye', 'D', 4, 'UEFA'),
  ('fifa-2026-team-ger', 'GER', 'Germany', 'Germany', 'E', 1, 'UEFA'),
  ('fifa-2026-team-cuw', 'CUW', 'Curaçao', 'Curaçao', 'E', 2, 'CONCACAF'),
  ('fifa-2026-team-civ', 'CIV', 'Côte d''Ivoire', 'Côte d''Ivoire', 'E', 3, 'CAF'),
  ('fifa-2026-team-ecu', 'ECU', 'Ecuador', 'Ecuador', 'E', 4, 'CONMEBOL'),
  ('fifa-2026-team-ned', 'NED', 'Netherlands', 'Netherlands', 'F', 1, 'UEFA'),
  ('fifa-2026-team-jpn', 'JPN', 'Japan', 'Japan', 'F', 2, 'AFC'),
  ('fifa-2026-team-swe', 'SWE', 'Sweden', 'Sweden', 'F', 3, 'UEFA'),
  ('fifa-2026-team-tun', 'TUN', 'Tunisia', 'Tunisia', 'F', 4, 'CAF'),
  ('fifa-2026-team-bel', 'BEL', 'Belgium', 'Belgium', 'G', 1, 'UEFA'),
  ('fifa-2026-team-egy', 'EGY', 'Egypt', 'Egypt', 'G', 2, 'CAF'),
  ('fifa-2026-team-irn', 'IRN', 'IR Iran', 'Iran', 'G', 3, 'AFC'),
  ('fifa-2026-team-nzl', 'NZL', 'New Zealand', 'New Zealand', 'G', 4, 'OFC'),
  ('fifa-2026-team-esp', 'ESP', 'Spain', 'Spain', 'H', 1, 'UEFA'),
  ('fifa-2026-team-cpv', 'CPV', 'Cabo Verde', 'Cabo Verde', 'H', 2, 'CAF'),
  ('fifa-2026-team-ksa', 'KSA', 'Saudi Arabia', 'Saudi Arabia', 'H', 3, 'AFC'),
  ('fifa-2026-team-uru', 'URU', 'Uruguay', 'Uruguay', 'H', 4, 'CONMEBOL'),
  ('fifa-2026-team-fra', 'FRA', 'France', 'France', 'I', 1, 'UEFA'),
  ('fifa-2026-team-sen', 'SEN', 'Senegal', 'Senegal', 'I', 2, 'CAF'),
  ('fifa-2026-team-irq', 'IRQ', 'Iraq', 'Iraq', 'I', 3, 'AFC'),
  ('fifa-2026-team-nor', 'NOR', 'Norway', 'Norway', 'I', 4, 'UEFA'),
  ('fifa-2026-team-arg', 'ARG', 'Argentina', 'Argentina', 'J', 1, 'CONMEBOL'),
  ('fifa-2026-team-alg', 'ALG', 'Algeria', 'Algeria', 'J', 2, 'CAF'),
  ('fifa-2026-team-aut', 'AUT', 'Austria', 'Austria', 'J', 3, 'UEFA'),
  ('fifa-2026-team-jor', 'JOR', 'Jordan', 'Jordan', 'J', 4, 'AFC'),
  ('fifa-2026-team-por', 'POR', 'Portugal', 'Portugal', 'K', 1, 'UEFA'),
  ('fifa-2026-team-cod', 'COD', 'Congo DR', 'Democratic Republic of the Congo', 'K', 2, 'CAF'),
  ('fifa-2026-team-uzb', 'UZB', 'Uzbekistan', 'Uzbekistan', 'K', 3, 'AFC'),
  ('fifa-2026-team-col', 'COL', 'Colombia', 'Colombia', 'K', 4, 'CONMEBOL'),
  ('fifa-2026-team-eng', 'ENG', 'England', 'England', 'L', 1, 'UEFA'),
  ('fifa-2026-team-cro', 'CRO', 'Croatia', 'Croatia', 'L', 2, 'UEFA'),
  ('fifa-2026-team-gha', 'GHA', 'Ghana', 'Ghana', 'L', 3, 'CAF'),
  ('fifa-2026-team-pan', 'PAN', 'Panama', 'Panama', 'L', 4, 'CONCACAF')
on conflict (code) do update
set provider_id = excluded.provider_id,
    name = excluded.name,
    country = excluded.country,
    group_name = excluded.group_name,
    group_slot = excluded.group_slot,
    confederation = excluded.confederation;

with flags(code, flag_code, flag_url) as (
  values
    ('MEX', 'mx', 'https://flagcdn.com/w80/mx.png'),
    ('RSA', 'za', 'https://flagcdn.com/w80/za.png'),
    ('KOR', 'kr', 'https://flagcdn.com/w80/kr.png'),
    ('CZE', 'cz', 'https://flagcdn.com/w80/cz.png'),
    ('CAN', 'ca', 'https://flagcdn.com/w80/ca.png'),
    ('BIH', 'ba', 'https://flagcdn.com/w80/ba.png'),
    ('QAT', 'qa', 'https://flagcdn.com/w80/qa.png'),
    ('SUI', 'ch', 'https://flagcdn.com/w80/ch.png'),
    ('BRA', 'br', 'https://flagcdn.com/w80/br.png'),
    ('MAR', 'ma', 'https://flagcdn.com/w80/ma.png'),
    ('HAI', 'ht', 'https://flagcdn.com/w80/ht.png'),
    ('SCO', 'gb-sct', 'https://flagcdn.com/w80/gb-sct.png'),
    ('USA', 'us', 'https://flagcdn.com/w80/us.png'),
    ('PAR', 'py', 'https://flagcdn.com/w80/py.png'),
    ('AUS', 'au', 'https://flagcdn.com/w80/au.png'),
    ('TUR', 'tr', 'https://flagcdn.com/w80/tr.png'),
    ('GER', 'de', 'https://flagcdn.com/w80/de.png'),
    ('CUW', 'cw', 'https://flagcdn.com/w80/cw.png'),
    ('CIV', 'ci', 'https://flagcdn.com/w80/ci.png'),
    ('ECU', 'ec', 'https://flagcdn.com/w80/ec.png'),
    ('NED', 'nl', 'https://flagcdn.com/w80/nl.png'),
    ('JPN', 'jp', 'https://flagcdn.com/w80/jp.png'),
    ('SWE', 'se', 'https://flagcdn.com/w80/se.png'),
    ('TUN', 'tn', 'https://flagcdn.com/w80/tn.png'),
    ('BEL', 'be', 'https://flagcdn.com/w80/be.png'),
    ('EGY', 'eg', 'https://flagcdn.com/w80/eg.png'),
    ('IRN', 'ir', 'https://flagcdn.com/w80/ir.png'),
    ('NZL', 'nz', 'https://flagcdn.com/w80/nz.png'),
    ('ESP', 'es', 'https://flagcdn.com/w80/es.png'),
    ('CPV', 'cv', 'https://flagcdn.com/w80/cv.png'),
    ('KSA', 'sa', 'https://flagcdn.com/w80/sa.png'),
    ('URU', 'uy', 'https://flagcdn.com/w80/uy.png'),
    ('FRA', 'fr', 'https://flagcdn.com/w80/fr.png'),
    ('SEN', 'sn', 'https://flagcdn.com/w80/sn.png'),
    ('IRQ', 'iq', 'https://flagcdn.com/w80/iq.png'),
    ('NOR', 'no', 'https://flagcdn.com/w80/no.png'),
    ('ARG', 'ar', 'https://flagcdn.com/w80/ar.png'),
    ('ALG', 'dz', 'https://flagcdn.com/w80/dz.png'),
    ('AUT', 'at', 'https://flagcdn.com/w80/at.png'),
    ('JOR', 'jo', 'https://flagcdn.com/w80/jo.png'),
    ('POR', 'pt', 'https://flagcdn.com/w80/pt.png'),
    ('COD', 'cd', 'https://flagcdn.com/w80/cd.png'),
    ('UZB', 'uz', 'https://flagcdn.com/w80/uz.png'),
    ('COL', 'co', 'https://flagcdn.com/w80/co.png'),
    ('ENG', 'gb-eng', 'https://flagcdn.com/w80/gb-eng.png'),
    ('CRO', 'hr', 'https://flagcdn.com/w80/hr.png'),
    ('GHA', 'gh', 'https://flagcdn.com/w80/gh.png'),
    ('PAN', 'pa', 'https://flagcdn.com/w80/pa.png')
)
update public.teams t
set flag_code = flags.flag_code,
    flag_url = flags.flag_url
from flags
where t.code = flags.code;

with fifa_rankings(code, fifa_rank, fifa_points) as (
  values
    ('MEX', 14, 1687.48),
    ('RSA', 60, 1428.38),
    ('KOR', 25, 1591.63),
    ('CZE', 39, 1505.74),
    ('CAN', 30, 1559.48),
    ('BIH', 64, 1387.22),
    ('QAT', 57, 1450.31),
    ('SUI', 19, 1650.06),
    ('BRA', 6, 1765.86),
    ('MAR', 7, 1755.10),
    ('HAI', 83, 1293.10),
    ('SCO', 42, 1503.34),
    ('USA', 17, 1671.23),
    ('PAR', 40, 1505.35),
    ('AUS', 27, 1579.34),
    ('TUR', 22, 1605.73),
    ('GER', 10, 1735.77),
    ('CUW', 82, 1294.77),
    ('CIV', 33, 1540.87),
    ('ECU', 23, 1598.52),
    ('NED', 8, 1751.10),
    ('JPN', 18, 1661.58),
    ('SWE', 38, 1509.79),
    ('TUN', 46, 1476.41),
    ('BEL', 9, 1742.24),
    ('EGY', 29, 1562.37),
    ('IRN', 21, 1619.58),
    ('NZL', 85, 1275.58),
    ('ESP', 2, 1873.01),
    ('CPV', 67, 1371.11),
    ('KSA', 61, 1421.54),
    ('URU', 16, 1673.07),
    ('FRA', 3, 1869.43),
    ('SEN', 15, 1686.41),
    ('IRQ', 56, 1451.15),
    ('NOR', 31, 1557.44),
    ('ARG', 1, 1876.12),
    ('ALG', 28, 1571.03),
    ('AUT', 24, 1597.40),
    ('JOR', 63, 1387.74),
    ('POR', 5, 1766.18),
    ('COD', 45, 1479.68),
    ('UZB', 50, 1461.21),
    ('COL', 13, 1698.35),
    ('ENG', 4, 1827.05),
    ('CRO', 11, 1714.87),
    ('GHA', 73, 1346.88),
    ('PAN', 34, 1539.16)
)
update public.teams t
set fifa_rank = fifa_rankings.fifa_rank,
    fifa_points = fifa_rankings.fifa_points,
    rating_source = 'FIFA/Coca-Cola Men''s World Ranking live API (https://api.fifa.com/api/v3/fifarankings/rankings/live?gender=1&sportType=0&language=en)',
    rating_updated_at = now()
from fifa_rankings
where t.code = fifa_rankings.code;

with world_cup_history(code, title_years) as (
  values
    ('ARG', array[1978, 1986, 2022]),
    ('BRA', array[1958, 1962, 1970, 1994, 2002]),
    ('ENG', array[1966]),
    ('ESP', array[2010]),
    ('FRA', array[1998, 2018]),
    ('GER', array[1954, 1974, 1990, 2014]),
    ('URU', array[1930, 1950])
)
update public.teams t
set world_cup_titles = cardinality(world_cup_history.title_years),
    world_cup_title_years = world_cup_history.title_years,
    profile_updated_at = coalesce(t.profile_updated_at, now())
from world_cup_history
where t.code = world_cup_history.code;

insert into public.market_definitions (key, name, market_type, settlement_rule, internal_only, default_multiplier, display_order)
values
  ('correct_score', 'Dự đoán tỷ số', 'score', 'correct_score', false, 6.00, 1),
  ('match_result', 'Kết quả 1X2 (90 phút)', 'single', 'match_result', false, 1.80, 2),
  ('draw_no_bet', 'Draw no bet', 'single', 'draw_no_bet', false, 1.65, 3),
  ('total_goals', 'Tổng bàn thắng', 'line', 'total_goals', false, 1.90, 4),
  ('btts', 'Hai đội cùng ghi bàn', 'single', 'btts', false, 1.95, 5),
  ('corners_total', 'Tổng phạt góc', 'line', 'corners_total', true, 1.90, 6),
  ('cards_total', 'Tổng thẻ', 'line', 'cards_total', true, 1.90, 7),
  ('tournament_winner', 'Vô địch giải', 'outright', 'tournament_winner', false, 50.00, 8),
  ('golden_boot', 'Dự đoán Vua phá lưới', 'outright', 'golden_boot', false, 120.00, 9)
on conflict (key) do update
set name = excluded.name,
    market_type = excluded.market_type,
    settlement_rule = excluded.settlement_rule,
    internal_only = excluded.internal_only,
    default_multiplier = excluded.default_multiplier,
    display_order = excluded.display_order;

insert into public.market_definitions (key, name, market_type, settlement_rule, internal_only, default_multiplier, display_order)
values ('match_winner', 'Doi di tiep / thang chung cuoc', 'single', 'match_winner', false, 1.80, 3)
on conflict (key) do update
set name = excluded.name,
    market_type = excluded.market_type,
    settlement_rule = excluded.settlement_rule,
    internal_only = excluded.internal_only,
    default_multiplier = excluded.default_multiplier,
    display_order = excluded.display_order;

insert into public.market_definitions (key, name, market_type, settlement_rule, internal_only, default_multiplier, display_order)
values ('qualification_method', 'Cach di tiep', 'single', 'qualification_method', false, 3.50, 4)
on conflict (key) do update
set name = excluded.name,
    market_type = excluded.market_type,
    settlement_rule = excluded.settlement_rule,
    internal_only = excluded.internal_only,
    default_multiplier = excluded.default_multiplier,
    display_order = excluded.display_order;

insert into public.market_definitions (key, name, market_type, settlement_rule, internal_only, default_multiplier, display_order)
values ('asian_handicap', 'Keo Chau A', 'line', 'asian_handicap', false, 1.90, 8)
on conflict (key) do update
set name = excluded.name,
    market_type = excluded.market_type,
    settlement_rule = excluded.settlement_rule,
    internal_only = excluded.internal_only,
    default_multiplier = excluded.default_multiplier,
    display_order = excluded.display_order;

update public.market_definitions
set enabled = false
where key = 'correct_score';

with t as (select code, id from public.teams)
insert into public.matches (provider_id, stage, group_name, home_team_id, away_team_id, starts_at, status, venue, city)
values
  ('fifa-2026-001', 'Group Stage - Matchday 1', 'A', (select id from t where code='MEX'), (select id from t where code='RSA'), '2026-06-11 19:00:00+00', 'SCHEDULED', 'Mexico City Stadium', 'Mexico City'),
  ('fifa-2026-002', 'Group Stage - Matchday 1', 'A', (select id from t where code='KOR'), (select id from t where code='CZE'), '2026-06-12 02:00:00+00', 'SCHEDULED', 'Estadio Guadalajara', 'Guadalajara'),
  ('fifa-2026-003', 'Group Stage - Matchday 1', 'B', (select id from t where code='CAN'), (select id from t where code='BIH'), '2026-06-12 19:00:00+00', 'SCHEDULED', 'Toronto Stadium', 'Toronto'),
  ('fifa-2026-004', 'Group Stage - Matchday 1', 'D', (select id from t where code='USA'), (select id from t where code='PAR'), '2026-06-13 01:00:00+00', 'SCHEDULED', 'Los Angeles Stadium', 'Los Angeles'),
  ('fifa-2026-005', 'Group Stage - Matchday 1', 'C', (select id from t where code='HAI'), (select id from t where code='SCO'), '2026-06-14 01:00:00+00', 'SCHEDULED', 'Boston Stadium', 'Boston'),
  ('fifa-2026-006', 'Group Stage - Matchday 1', 'D', (select id from t where code='AUS'), (select id from t where code='TUR'), '2026-06-14 04:00:00+00', 'SCHEDULED', 'BC Place Vancouver', 'Vancouver'),
  ('fifa-2026-007', 'Group Stage - Matchday 1', 'C', (select id from t where code='BRA'), (select id from t where code='MAR'), '2026-06-13 22:00:00+00', 'SCHEDULED', 'New York New Jersey Stadium', 'New York/New Jersey'),
  ('fifa-2026-008', 'Group Stage - Matchday 1', 'B', (select id from t where code='QAT'), (select id from t where code='SUI'), '2026-06-13 19:00:00+00', 'SCHEDULED', 'San Francisco Bay Area Stadium', 'San Francisco Bay Area'),
  ('fifa-2026-009', 'Group Stage - Matchday 1', 'E', (select id from t where code='CIV'), (select id from t where code='ECU'), '2026-06-14 23:00:00+00', 'SCHEDULED', 'Philadelphia Stadium', 'Philadelphia'),
  ('fifa-2026-010', 'Group Stage - Matchday 1', 'E', (select id from t where code='GER'), (select id from t where code='CUW'), '2026-06-14 17:00:00+00', 'SCHEDULED', 'Houston Stadium', 'Houston'),
  ('fifa-2026-011', 'Group Stage - Matchday 1', 'F', (select id from t where code='NED'), (select id from t where code='JPN'), '2026-06-14 20:00:00+00', 'SCHEDULED', 'Dallas Stadium', 'Dallas'),
  ('fifa-2026-012', 'Group Stage - Matchday 1', 'F', (select id from t where code='SWE'), (select id from t where code='TUN'), '2026-06-15 02:00:00+00', 'SCHEDULED', 'Estadio Monterrey', 'Monterrey'),
  ('fifa-2026-013', 'Group Stage - Matchday 1', 'H', (select id from t where code='KSA'), (select id from t where code='URU'), '2026-06-15 22:00:00+00', 'SCHEDULED', 'Miami Stadium', 'Miami'),
  ('fifa-2026-014', 'Group Stage - Matchday 1', 'H', (select id from t where code='ESP'), (select id from t where code='CPV'), '2026-06-15 16:00:00+00', 'SCHEDULED', 'Atlanta Stadium', 'Atlanta'),
  ('fifa-2026-015', 'Group Stage - Matchday 1', 'G', (select id from t where code='IRN'), (select id from t where code='NZL'), '2026-06-16 01:00:00+00', 'SCHEDULED', 'Los Angeles Stadium', 'Los Angeles'),
  ('fifa-2026-016', 'Group Stage - Matchday 1', 'G', (select id from t where code='BEL'), (select id from t where code='EGY'), '2026-06-15 19:00:00+00', 'SCHEDULED', 'Seattle Stadium', 'Seattle'),
  ('fifa-2026-017', 'Group Stage - Matchday 1', 'I', (select id from t where code='FRA'), (select id from t where code='SEN'), '2026-06-16 19:00:00+00', 'SCHEDULED', 'New York New Jersey Stadium', 'New York/New Jersey'),
  ('fifa-2026-018', 'Group Stage - Matchday 1', 'I', (select id from t where code='IRQ'), (select id from t where code='NOR'), '2026-06-16 22:00:00+00', 'SCHEDULED', 'Boston Stadium', 'Boston'),
  ('fifa-2026-019', 'Group Stage - Matchday 1', 'J', (select id from t where code='ARG'), (select id from t where code='ALG'), '2026-06-17 01:00:00+00', 'SCHEDULED', 'Kansas City Stadium', 'Kansas City'),
  ('fifa-2026-020', 'Group Stage - Matchday 1', 'J', (select id from t where code='AUT'), (select id from t where code='JOR'), '2026-06-17 04:00:00+00', 'SCHEDULED', 'San Francisco Bay Area Stadium', 'San Francisco Bay Area'),
  ('fifa-2026-021', 'Group Stage - Matchday 1', 'L', (select id from t where code='GHA'), (select id from t where code='PAN'), '2026-06-17 23:00:00+00', 'SCHEDULED', 'Toronto Stadium', 'Toronto'),
  ('fifa-2026-022', 'Group Stage - Matchday 1', 'L', (select id from t where code='ENG'), (select id from t where code='CRO'), '2026-06-17 20:00:00+00', 'SCHEDULED', 'Dallas Stadium', 'Dallas'),
  ('fifa-2026-023', 'Group Stage - Matchday 1', 'K', (select id from t where code='POR'), (select id from t where code='COD'), '2026-06-17 17:00:00+00', 'SCHEDULED', 'Houston Stadium', 'Houston'),
  ('fifa-2026-024', 'Group Stage - Matchday 1', 'K', (select id from t where code='UZB'), (select id from t where code='COL'), '2026-06-18 02:00:00+00', 'SCHEDULED', 'Mexico City Stadium', 'Mexico City'),
  ('fifa-2026-025', 'Group Stage - Matchday 2', 'A', (select id from t where code='CZE'), (select id from t where code='RSA'), '2026-06-18 16:00:00+00', 'SCHEDULED', 'Atlanta Stadium', 'Atlanta'),
  ('fifa-2026-026', 'Group Stage - Matchday 2', 'B', (select id from t where code='SUI'), (select id from t where code='BIH'), '2026-06-18 19:00:00+00', 'SCHEDULED', 'Los Angeles Stadium', 'Los Angeles'),
  ('fifa-2026-027', 'Group Stage - Matchday 2', 'B', (select id from t where code='CAN'), (select id from t where code='QAT'), '2026-06-18 22:00:00+00', 'SCHEDULED', 'BC Place Vancouver', 'Vancouver'),
  ('fifa-2026-028', 'Group Stage - Matchday 2', 'A', (select id from t where code='MEX'), (select id from t where code='KOR'), '2026-06-19 01:00:00+00', 'SCHEDULED', 'Estadio Guadalajara', 'Guadalajara'),
  ('fifa-2026-029', 'Group Stage - Matchday 2', 'C', (select id from t where code='BRA'), (select id from t where code='HAI'), '2026-06-20 00:30:00+00', 'SCHEDULED', 'Philadelphia Stadium', 'Philadelphia'),
  ('fifa-2026-030', 'Group Stage - Matchday 2', 'C', (select id from t where code='SCO'), (select id from t where code='MAR'), '2026-06-19 22:00:00+00', 'SCHEDULED', 'Boston Stadium', 'Boston'),
  ('fifa-2026-031', 'Group Stage - Matchday 2', 'D', (select id from t where code='TUR'), (select id from t where code='PAR'), '2026-06-20 03:00:00+00', 'SCHEDULED', 'San Francisco Bay Area Stadium', 'San Francisco Bay Area'),
  ('fifa-2026-032', 'Group Stage - Matchday 2', 'D', (select id from t where code='USA'), (select id from t where code='AUS'), '2026-06-19 19:00:00+00', 'SCHEDULED', 'Seattle Stadium', 'Seattle'),
  ('fifa-2026-033', 'Group Stage - Matchday 2', 'E', (select id from t where code='GER'), (select id from t where code='CIV'), '2026-06-20 20:00:00+00', 'SCHEDULED', 'Toronto Stadium', 'Toronto'),
  ('fifa-2026-034', 'Group Stage - Matchday 2', 'E', (select id from t where code='ECU'), (select id from t where code='CUW'), '2026-06-21 00:00:00+00', 'SCHEDULED', 'Kansas City Stadium', 'Kansas City'),
  ('fifa-2026-035', 'Group Stage - Matchday 2', 'F', (select id from t where code='NED'), (select id from t where code='SWE'), '2026-06-20 17:00:00+00', 'SCHEDULED', 'Houston Stadium', 'Houston'),
  ('fifa-2026-036', 'Group Stage - Matchday 2', 'F', (select id from t where code='TUN'), (select id from t where code='JPN'), '2026-06-21 04:00:00+00', 'SCHEDULED', 'Estadio Monterrey', 'Monterrey'),
  ('fifa-2026-037', 'Group Stage - Matchday 2', 'H', (select id from t where code='URU'), (select id from t where code='CPV'), '2026-06-21 22:00:00+00', 'SCHEDULED', 'Miami Stadium', 'Miami'),
  ('fifa-2026-038', 'Group Stage - Matchday 2', 'H', (select id from t where code='ESP'), (select id from t where code='KSA'), '2026-06-21 16:00:00+00', 'SCHEDULED', 'Atlanta Stadium', 'Atlanta'),
  ('fifa-2026-039', 'Group Stage - Matchday 2', 'G', (select id from t where code='BEL'), (select id from t where code='IRN'), '2026-06-21 19:00:00+00', 'SCHEDULED', 'Los Angeles Stadium', 'Los Angeles'),
  ('fifa-2026-040', 'Group Stage - Matchday 2', 'G', (select id from t where code='NZL'), (select id from t where code='EGY'), '2026-06-22 01:00:00+00', 'SCHEDULED', 'BC Place Vancouver', 'Vancouver'),
  ('fifa-2026-041', 'Group Stage - Matchday 2', 'I', (select id from t where code='NOR'), (select id from t where code='SEN'), '2026-06-23 00:00:00+00', 'SCHEDULED', 'New York New Jersey Stadium', 'New York/New Jersey'),
  ('fifa-2026-042', 'Group Stage - Matchday 2', 'I', (select id from t where code='FRA'), (select id from t where code='IRQ'), '2026-06-22 21:00:00+00', 'SCHEDULED', 'Philadelphia Stadium', 'Philadelphia'),
  ('fifa-2026-043', 'Group Stage - Matchday 2', 'J', (select id from t where code='ARG'), (select id from t where code='AUT'), '2026-06-22 17:00:00+00', 'SCHEDULED', 'Dallas Stadium', 'Dallas'),
  ('fifa-2026-044', 'Group Stage - Matchday 2', 'J', (select id from t where code='JOR'), (select id from t where code='ALG'), '2026-06-23 03:00:00+00', 'SCHEDULED', 'San Francisco Bay Area Stadium', 'San Francisco Bay Area'),
  ('fifa-2026-045', 'Group Stage - Matchday 2', 'L', (select id from t where code='ENG'), (select id from t where code='GHA'), '2026-06-23 20:00:00+00', 'SCHEDULED', 'Boston Stadium', 'Boston'),
  ('fifa-2026-046', 'Group Stage - Matchday 2', 'L', (select id from t where code='PAN'), (select id from t where code='CRO'), '2026-06-23 23:00:00+00', 'SCHEDULED', 'Toronto Stadium', 'Toronto'),
  ('fifa-2026-047', 'Group Stage - Matchday 2', 'K', (select id from t where code='POR'), (select id from t where code='UZB'), '2026-06-23 17:00:00+00', 'SCHEDULED', 'Houston Stadium', 'Houston'),
  ('fifa-2026-048', 'Group Stage - Matchday 2', 'K', (select id from t where code='COL'), (select id from t where code='COD'), '2026-06-24 02:00:00+00', 'SCHEDULED', 'Estadio Guadalajara', 'Guadalajara'),
  ('fifa-2026-049', 'Group Stage - Matchday 3', 'C', (select id from t where code='SCO'), (select id from t where code='BRA'), '2026-06-24 22:00:00+00', 'SCHEDULED', 'Miami Stadium', 'Miami'),
  ('fifa-2026-050', 'Group Stage - Matchday 3', 'C', (select id from t where code='MAR'), (select id from t where code='HAI'), '2026-06-24 22:00:00+00', 'SCHEDULED', 'Atlanta Stadium', 'Atlanta'),
  ('fifa-2026-051', 'Group Stage - Matchday 3', 'B', (select id from t where code='SUI'), (select id from t where code='CAN'), '2026-06-24 19:00:00+00', 'SCHEDULED', 'BC Place Vancouver', 'Vancouver'),
  ('fifa-2026-052', 'Group Stage - Matchday 3', 'B', (select id from t where code='BIH'), (select id from t where code='QAT'), '2026-06-24 19:00:00+00', 'SCHEDULED', 'Seattle Stadium', 'Seattle'),
  ('fifa-2026-053', 'Group Stage - Matchday 3', 'A', (select id from t where code='CZE'), (select id from t where code='MEX'), '2026-06-25 01:00:00+00', 'SCHEDULED', 'Mexico City Stadium', 'Mexico City'),
  ('fifa-2026-054', 'Group Stage - Matchday 3', 'A', (select id from t where code='RSA'), (select id from t where code='KOR'), '2026-06-25 01:00:00+00', 'SCHEDULED', 'Estadio Monterrey', 'Monterrey'),
  ('fifa-2026-055', 'Group Stage - Matchday 3', 'E', (select id from t where code='CUW'), (select id from t where code='CIV'), '2026-06-25 20:00:00+00', 'SCHEDULED', 'Philadelphia Stadium', 'Philadelphia'),
  ('fifa-2026-056', 'Group Stage - Matchday 3', 'E', (select id from t where code='ECU'), (select id from t where code='GER'), '2026-06-25 20:00:00+00', 'SCHEDULED', 'New York New Jersey Stadium', 'New York/New Jersey'),
  ('fifa-2026-057', 'Group Stage - Matchday 3', 'F', (select id from t where code='JPN'), (select id from t where code='SWE'), '2026-06-25 23:00:00+00', 'SCHEDULED', 'Dallas Stadium', 'Dallas'),
  ('fifa-2026-058', 'Group Stage - Matchday 3', 'F', (select id from t where code='TUN'), (select id from t where code='NED'), '2026-06-25 23:00:00+00', 'SCHEDULED', 'Kansas City Stadium', 'Kansas City'),
  ('fifa-2026-059', 'Group Stage - Matchday 3', 'D', (select id from t where code='TUR'), (select id from t where code='USA'), '2026-06-26 02:00:00+00', 'SCHEDULED', 'Los Angeles Stadium', 'Los Angeles'),
  ('fifa-2026-060', 'Group Stage - Matchday 3', 'D', (select id from t where code='PAR'), (select id from t where code='AUS'), '2026-06-26 02:00:00+00', 'SCHEDULED', 'San Francisco Bay Area Stadium', 'San Francisco Bay Area'),
  ('fifa-2026-061', 'Group Stage - Matchday 3', 'I', (select id from t where code='NOR'), (select id from t where code='FRA'), '2026-06-26 19:00:00+00', 'SCHEDULED', 'Boston Stadium', 'Boston'),
  ('fifa-2026-062', 'Group Stage - Matchday 3', 'I', (select id from t where code='SEN'), (select id from t where code='IRQ'), '2026-06-26 19:00:00+00', 'SCHEDULED', 'Toronto Stadium', 'Toronto'),
  ('fifa-2026-063', 'Group Stage - Matchday 3', 'G', (select id from t where code='EGY'), (select id from t where code='IRN'), '2026-06-27 03:00:00+00', 'SCHEDULED', 'Seattle Stadium', 'Seattle'),
  ('fifa-2026-064', 'Group Stage - Matchday 3', 'G', (select id from t where code='NZL'), (select id from t where code='BEL'), '2026-06-27 03:00:00+00', 'SCHEDULED', 'BC Place Vancouver', 'Vancouver'),
  ('fifa-2026-065', 'Group Stage - Matchday 3', 'H', (select id from t where code='CPV'), (select id from t where code='KSA'), '2026-06-27 00:00:00+00', 'SCHEDULED', 'Houston Stadium', 'Houston'),
  ('fifa-2026-066', 'Group Stage - Matchday 3', 'H', (select id from t where code='URU'), (select id from t where code='ESP'), '2026-06-27 00:00:00+00', 'SCHEDULED', 'Estadio Guadalajara', 'Guadalajara'),
  ('fifa-2026-067', 'Group Stage - Matchday 3', 'L', (select id from t where code='PAN'), (select id from t where code='ENG'), '2026-06-27 21:00:00+00', 'SCHEDULED', 'New York New Jersey Stadium', 'New York/New Jersey'),
  ('fifa-2026-068', 'Group Stage - Matchday 3', 'L', (select id from t where code='CRO'), (select id from t where code='GHA'), '2026-06-27 21:00:00+00', 'SCHEDULED', 'Philadelphia Stadium', 'Philadelphia'),
  ('fifa-2026-069', 'Group Stage - Matchday 3', 'J', (select id from t where code='ALG'), (select id from t where code='AUT'), '2026-06-28 02:00:00+00', 'SCHEDULED', 'Kansas City Stadium', 'Kansas City'),
  ('fifa-2026-070', 'Group Stage - Matchday 3', 'J', (select id from t where code='JOR'), (select id from t where code='ARG'), '2026-06-28 02:00:00+00', 'SCHEDULED', 'Dallas Stadium', 'Dallas'),
  ('fifa-2026-071', 'Group Stage - Matchday 3', 'K', (select id from t where code='COL'), (select id from t where code='POR'), '2026-06-27 23:30:00+00', 'SCHEDULED', 'Miami Stadium', 'Miami'),
  ('fifa-2026-072', 'Group Stage - Matchday 3', 'K', (select id from t where code='COD'), (select id from t where code='UZB'), '2026-06-27 23:30:00+00', 'SCHEDULED', 'Atlanta Stadium', 'Atlanta')
on conflict (provider_id) do update
set stage = excluded.stage,
    group_name = excluded.group_name,
    home_team_id = excluded.home_team_id,
    away_team_id = excluded.away_team_id,
    starts_at = excluded.starts_at,
    status = excluded.status,
    venue = excluded.venue,
    city = excluded.city,
    updated_at = now();

insert into public.match_markets (match_id, market_key, label, selection_key, selection_label, line, odds_multiplier, source, closes_at)
select m.id, x.market_key, x.label, x.selection_key, x.selection_label, x.line, x.odds_multiplier, x.source, m.starts_at
from public.matches m
join public.teams ht on ht.id = m.home_team_id
join public.teams at on at.id = m.away_team_id
cross join lateral (
  select
    public.team_strength_score(ht.fifa_rank, ht.squad_market_value_eur, ht.squad_value_rank) as home_strength,
    public.team_strength_score(at.fifa_rank, at.squad_market_value_eur, at.squad_value_rank) as away_strength
) as s
cross join lateral (
  values
    ('correct_score', 'Dự đoán tỷ số', 'exact', 'Tỷ số chính xác', null::numeric, 6.00, 'internal'),
    ('match_result', 'Kết quả 1X2 (90 phút)', 'home', ht.name || ' thắng sau 90 phút', null::numeric, public.team_win_multiplier(s.home_strength, s.away_strength, 1.35, 4.50), 'internal'),
    ('match_result', 'Kết quả 1X2 (90 phút)', 'draw', 'Hòa sau 90 phút', null::numeric, round(greatest(2.70, least(3.80, 2.95 + abs(s.home_strength - s.away_strength) / 45))::numeric, 2), 'internal'),
    ('match_result', 'Kết quả 1X2 (90 phút)', 'away', at.name || ' thắng sau 90 phút', null::numeric, public.team_win_multiplier(s.away_strength, s.home_strength, 1.35, 4.50), 'internal'),
    ('draw_no_bet', 'Draw no bet', 'home', ht.name || ' DNB', null::numeric, public.team_win_multiplier(s.home_strength, s.away_strength, 1.15, 3.20), 'internal'),
    ('draw_no_bet', 'Draw no bet', 'away', at.name || ' DNB', null::numeric, public.team_win_multiplier(s.away_strength, s.home_strength, 1.15, 3.20), 'internal'),
    ('total_goals', 'Tổng bàn thắng 2.5', 'over', 'Tài 2.5', 2.5::numeric, 1.92, 'internal'),
    ('total_goals', 'Tổng bàn thắng 2.5', 'under', 'Xỉu 2.5', 2.5::numeric, 1.88, 'internal'),
    ('btts', 'Hai đội cùng ghi bàn', 'yes', 'Có', null::numeric, 1.95, 'internal'),
    ('btts', 'Hai đội cùng ghi bàn', 'no', 'Không', null::numeric, 1.82, 'internal'),
    ('corners_total', 'Tổng phạt góc 8.5', 'over', 'Tài góc 8.5', 8.5::numeric, 1.90, 'internal'),
    ('corners_total', 'Tổng phạt góc 8.5', 'under', 'Xỉu góc 8.5', 8.5::numeric, 1.90, 'internal'),
    ('cards_total', 'Tổng thẻ 3.5', 'over', 'Tài thẻ 3.5', 3.5::numeric, 1.90, 'internal'),
    ('cards_total', 'Tổng thẻ 3.5', 'under', 'Xỉu thẻ 3.5', 3.5::numeric, 1.90, 'internal')
) as x(market_key, label, selection_key, selection_label, line, odds_multiplier, source)
where m.provider_id like 'fifa-2026-%'
on conflict (match_id, market_key, selection_key, line_key) do update
set label = excluded.label,
    selection_label = excluded.selection_label,
    odds_multiplier = excluded.odds_multiplier,
    source = excluded.source,
    closes_at = excluded.closes_at
where public.match_markets.source = 'internal';

insert into public.match_markets (match_id, market_key, label, selection_key, selection_label, line, odds_multiplier, source, closes_at)
select m.id, x.market_key, x.label, x.selection_key, x.selection_label, x.line, x.odds_multiplier, x.source, m.starts_at
from public.matches m
join public.teams ht on ht.id = m.home_team_id
join public.teams at on at.id = m.away_team_id
cross join lateral (
  select
    public.team_strength_score(ht.fifa_rank, ht.squad_market_value_eur, ht.squad_value_rank) as home_strength,
    public.team_strength_score(at.fifa_rank, at.squad_market_value_eur, at.squad_value_rank) as away_strength
) as s
cross join lateral (
  select
    public.team_win_multiplier(s.home_strength, s.away_strength, 1.35, 4.50) as home_win_odds,
    public.team_win_multiplier(s.away_strength, s.home_strength, 1.35, 4.50) as away_win_odds
) as o
cross join lateral (
  values
    ('asian_handicap', 'Keo Chau A -0.5', 'home', ht.name || ' -0.5', -0.5::numeric, greatest(1.28, least(3.50, o.home_win_odds)), 'internal'),
    ('asian_handicap', 'Keo Chau A -0.5', 'away', at.name || ' +0.5', -0.5::numeric, greatest(1.35, least(2.80, round((o.home_win_odds / greatest(0.1, o.home_win_odds - 1)) * 0.97, 2))), 'internal'),
    ('asian_handicap', 'Keo Chau A +0.5', 'home', ht.name || ' +0.5', 0.5::numeric, greatest(1.35, least(2.80, round((o.away_win_odds / greatest(0.1, o.away_win_odds - 1)) * 0.97, 2))), 'internal'),
    ('asian_handicap', 'Keo Chau A +0.5', 'away', at.name || ' -0.5', 0.5::numeric, greatest(1.28, least(3.50, o.away_win_odds)), 'internal')
) as x(market_key, label, selection_key, selection_label, line, odds_multiplier, source)
where m.provider_id like 'fifa-2026-%'
on conflict (match_id, market_key, selection_key, line_key) do update
set label = excluded.label,
    selection_label = excluded.selection_label,
    odds_multiplier = excluded.odds_multiplier,
    source = excluded.source,
    closes_at = excluded.closes_at
where public.match_markets.source = 'internal';

insert into public.outright_markets (market_key, label, selection_key, selection_label, odds_multiplier, source, closes_at)
select
  'tournament_winner',
  'Vô địch World Cup 2026',
  t.code,
  t.name,
  50.00,
  'internal',
  '2026-06-11 19:00:00+00'::timestamptz
from (
  select
    teams.*,
    row_number() over (
      order by
        teams.fifa_rank asc nulls last,
        public.team_strength_score(teams.fifa_rank, teams.squad_market_value_eur, teams.squad_value_rank) desc,
        teams.name
    ) as strength_rank
  from public.teams
  where teams.provider_id like 'fifa-2026-team-%'
) t
on conflict (market_key, selection_key) do update
set selection_label = excluded.selection_label,
    odds_multiplier = excluded.odds_multiplier,
    source = excluded.source,
    closes_at = excluded.closes_at
where public.outright_markets.source = 'internal';

insert into public.outright_markets (market_key, label, selection_key, selection_label, odds_multiplier, source, closes_at, extra_json)
select
  'golden_boot',
  'Dự đoán Vua phá lưới',
  'player:' || p.id::text,
  p.name || ' (' || t.code || ')',
  120.00,
  'internal',
  '2026-06-11 19:00:00+00'::timestamptz,
  jsonb_build_object(
    'player_id', p.id,
    'team_id', p.team_id,
    'team_code', t.code,
    'position', p.position,
    'club', p.club
  )
from (
  select
    team_players.*,
    row_number() over (
      order by
        coalesce(team_players.market_value_eur, 0) desc,
        coalesce(team_players.overall_rating, 0) desc,
        team_players.name
    ) as player_rank
  from public.team_players
) p
join public.teams t on t.id = p.team_id
where t.provider_id like 'fifa-2026-team-%'
on conflict (market_key, selection_key) do update
set selection_label = excluded.selection_label,
    odds_multiplier = excluded.odds_multiplier,
    source = excluded.source,
    closes_at = excluded.closes_at,
    extra_json = excluded.extra_json
where public.outright_markets.source = 'internal';

update public.match_markets
set is_open = false
where market_key = 'correct_score'
  or (source = 'internal' and market_key in ('draw_no_bet', 'asian_handicap'));

update public.outright_markets
set is_open = false
where source = 'internal'
  and market_key in ('tournament_winner', 'golden_boot');

insert into public.sync_runs (provider, job_type, status, finished_at, request_count, message)
values ('fifa', 'seed', 'success', now(), 0, 'Seeded FIFA World Cup 2026 group teams, fixtures, and default internal markets.')
on conflict do nothing;
