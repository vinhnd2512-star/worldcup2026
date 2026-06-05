-- Seed teams, matches, and markets. Run after schema.sql.

insert into public.teams (provider_id, code, name, country)
values
  ('seed-team-1', 'BRA', 'Brazil', 'Brazil'),
  ('seed-team-2', 'FRA', 'Pháp', 'France'),
  ('seed-team-3', 'ARG', 'Argentina', 'Argentina'),
  ('seed-team-4', 'NED', 'Hà Lan', 'Netherlands'),
  ('seed-team-5', 'MEX', 'Mexico', 'Mexico'),
  ('seed-team-6', 'GER', 'Đức', 'Germany'),
  ('seed-team-7', 'ESP', 'Tây Ban Nha', 'Spain'),
  ('seed-team-8', 'POR', 'Bồ Đào Nha', 'Portugal'),
  ('seed-team-9', 'URU', 'Uruguay', 'Uruguay'),
  ('seed-team-10', 'SRB', 'Serbia', 'Serbia')
on conflict (code) do update set name = excluded.name, country = excluded.country;

insert into public.market_definitions (key, name, market_type, settlement_rule, internal_only, default_multiplier, display_order)
values
  ('correct_score', 'Dự đoán tỷ số', 'score', 'correct_score', false, 2.45, 1),
  ('match_result', 'Kết quả 1X2', 'single', 'match_result', false, 1.80, 2),
  ('total_goals', 'Tổng bàn thắng', 'line', 'total_goals', false, 1.90, 3),
  ('btts', 'Hai đội cùng ghi bàn', 'single', 'btts', false, 1.95, 4),
  ('corners_total', 'Tổng phạt góc', 'line', 'corners_total', true, 1.90, 5),
  ('cards_total', 'Tổng thẻ', 'line', 'cards_total', true, 1.90, 6),
  ('tournament_winner', 'Vô địch giải', 'outright', 'tournament_winner', false, 4.00, 7)
on conflict (key) do update set name = excluded.name, internal_only = excluded.internal_only;

with t as (select code, id from public.teams)
insert into public.matches (provider_id, stage, group_name, home_team_id, away_team_id, starts_at, status, venue, city)
values
  ('seed-1', 'Group Stage - 1', 'Bảng G', (select id from t where code='BRA'), (select id from t where code='FRA'), '2026-06-11 19:00:00+00', 'SCHEDULED', 'Estadio Azteca', 'Mexico City'),
  ('seed-2', 'Group Stage - 1', 'Bảng C', (select id from t where code='ARG'), (select id from t where code='MEX'), '2026-06-14 02:00:00+00', 'SCHEDULED', 'MetLife Stadium', 'New York'),
  ('seed-3', 'Group Stage - 1', 'Bảng E', (select id from t where code='GER'), (select id from t where code='ESP'), '2026-06-15 23:45:00+00', 'SCHEDULED', 'SoFi Stadium', 'Los Angeles'),
  ('seed-4', 'Quarter-finals', null, (select id from t where code='ARG'), (select id from t where code='NED'), '2026-06-20 21:00:00+00', 'SCHEDULED', 'AT&T Stadium', 'Dallas')
on conflict (provider_id) do nothing;

insert into public.match_markets (match_id, market_key, label, selection_key, selection_label, line, odds_multiplier, source, closes_at)
select m.id, x.market_key, x.label, x.selection_key, x.selection_label, x.line, x.odds_multiplier, x.source, m.starts_at
from public.matches m
cross join (
  values
    ('correct_score', 'Dự đoán tỷ số', 'exact', 'Tỷ số chính xác', null::numeric, 2.45, 'internal'),
    ('match_result', 'Kết quả 1X2', 'home', 'Đội nhà thắng', null::numeric, 1.85, 'odds-api'),
    ('match_result', 'Kết quả 1X2', 'draw', 'Hòa', null::numeric, 3.10, 'odds-api'),
    ('match_result', 'Kết quả 1X2', 'away', 'Đội khách thắng', null::numeric, 2.05, 'odds-api'),
    ('total_goals', 'Tổng bàn thắng 2.5', 'over', 'Tài 2.5', 2.5::numeric, 1.92, 'odds-api'),
    ('total_goals', 'Tổng bàn thắng 2.5', 'under', 'Xỉu 2.5', 2.5::numeric, 1.88, 'odds-api'),
    ('btts', 'Hai đội cùng ghi bàn', 'yes', 'Có', null::numeric, 1.95, 'odds-api'),
    ('btts', 'Hai đội cùng ghi bàn', 'no', 'Không', null::numeric, 1.82, 'odds-api'),
    ('corners_total', 'Tổng phạt góc 8.5', 'over', 'Tài góc 8.5', 8.5::numeric, 1.90, 'internal'),
    ('corners_total', 'Tổng phạt góc 8.5', 'under', 'Xỉu góc 8.5', 8.5::numeric, 1.90, 'internal'),
    ('cards_total', 'Tổng thẻ 3.5', 'over', 'Tài thẻ 3.5', 3.5::numeric, 1.90, 'internal'),
    ('cards_total', 'Tổng thẻ 3.5', 'under', 'Xỉu thẻ 3.5', 3.5::numeric, 1.90, 'internal')
) as x(market_key, label, selection_key, selection_label, line, odds_multiplier, source)
where m.provider_id like 'seed-%'
on conflict (match_id, market_key, selection_key, line_key) do nothing;

insert into public.market_definitions (key, name, market_type, settlement_rule, internal_only, default_multiplier, display_order)
values ('draw_no_bet', 'Draw no bet', 'single', 'draw_no_bet', false, 1.65, 3)
on conflict (key) do update
set name = excluded.name,
    market_type = excluded.market_type,
    settlement_rule = excluded.settlement_rule,
    internal_only = excluded.internal_only,
    default_multiplier = excluded.default_multiplier,
    display_order = excluded.display_order;

insert into public.match_markets (match_id, market_key, label, selection_key, selection_label, line, odds_multiplier, source, closes_at)
select m.id, x.market_key, x.label, x.selection_key, x.selection_label, x.line, x.odds_multiplier, x.source, m.starts_at
from public.matches m
cross join (
  values
    ('draw_no_bet', 'Draw no bet', 'home', 'Home DNB', null::numeric, 1.65, 'internal'),
    ('draw_no_bet', 'Draw no bet', 'away', 'Away DNB', null::numeric, 1.75, 'internal')
) as x(market_key, label, selection_key, selection_label, line, odds_multiplier, source)
where m.provider_id like 'seed-%'
on conflict (match_id, market_key, selection_key, line_key) do nothing;

insert into public.outright_markets (market_key, label, selection_key, selection_label, odds_multiplier, source, closes_at)
values
  ('tournament_winner', 'Vô địch World Cup 2026', 'BRA', 'Brazil', 5.50, 'internal', '2026-06-11 19:00:00+00'),
  ('tournament_winner', 'Vô địch World Cup 2026', 'FRA', 'Pháp', 6.00, 'internal', '2026-06-11 19:00:00+00'),
  ('tournament_winner', 'Vô địch World Cup 2026', 'ARG', 'Argentina', 6.50, 'internal', '2026-06-11 19:00:00+00'),
  ('tournament_winner', 'Vô địch World Cup 2026', 'GER', 'Đức', 8.00, 'internal', '2026-06-11 19:00:00+00'),
  ('tournament_winner', 'Vô địch World Cup 2026', 'ESP', 'Tây Ban Nha', 8.00, 'internal', '2026-06-11 19:00:00+00'),
  ('tournament_winner', 'Vô địch World Cup 2026', 'POR', 'Bồ Đào Nha', 9.00, 'internal', '2026-06-11 19:00:00+00'),
  ('tournament_winner', 'Vô địch World Cup 2026', 'NED', 'Hà Lan', 11.00, 'internal', '2026-06-11 19:00:00+00'),
  ('tournament_winner', 'Vô địch World Cup 2026', 'URU', 'Uruguay', 18.00, 'internal', '2026-06-11 19:00:00+00')
on conflict (market_key, selection_key) do update
set selection_label = excluded.selection_label,
    odds_multiplier = excluded.odds_multiplier,
    closes_at = excluded.closes_at;

insert into public.sync_runs (provider, job_type, status, finished_at, request_count, message)
values ('api-football', 'metadata', 'skipped', now(), 0, 'Seed data active. Add API keys before provider sync.')
on conflict do nothing;
