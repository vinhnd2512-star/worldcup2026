-- One-off repair for Germany vs Paraguay when the provider only synced FT 1-1
-- but Paraguay advanced on penalties.
--
-- Run in Supabase SQL Editor as an admin/service context, after schema.sql has
-- been applied. This script does not invent a shootout score. It only marks
-- Paraguay as the bracket winner so match_winner bets can settle correctly.

with target_match as (
  select
    m.id as match_id,
    bm.match_no,
    bm.home_team_id,
    bm.away_team_id
  from public.matches m
  join public.teams ht on ht.id = m.home_team_id
  join public.teams at on at.id = m.away_team_id
  join public.bracket_matches bm on bm.match_id = m.id
  where ht.code = 'GER'
    and at.code = 'PAR'
  order by m.starts_at desc
  limit 1
),
winner_team as (
  select id, name from public.teams where code = 'PAR'
),
winner_slot as (
  select bs.match_no, bs.slot
  from public.bracket_slots bs
  join target_match tm on tm.match_no = bs.source_match_no
  where bs.source_type = 'winner'
  order by bs.match_no
  limit 1
),
updated_match as (
  update public.matches m
  set status = 'PEN',
      home_score = coalesce(m.home_score, 1),
      away_score = coalesce(m.away_score, 1),
      home_final_score = coalesce(m.home_final_score, m.home_score, 1),
      away_final_score = coalesce(m.away_final_score, m.away_score, 1),
      updated_at = now()
  from target_match tm
  where m.id = tm.match_id
  returning m.id
),
updated_home as (
  update public.bracket_matches bm
  set home_team_id = wt.id,
      home_label = wt.name,
      is_confirmed = bm.away_team_id is not null,
      updated_at = now()
  from winner_slot ws, winner_team wt
  where bm.match_no = ws.match_no
    and ws.slot = 'home'
  returning bm.match_no
),
updated_away as (
  update public.bracket_matches bm
  set away_team_id = wt.id,
      away_label = wt.name,
      is_confirmed = bm.home_team_id is not null,
      updated_at = now()
  from winner_slot ws, winner_team wt
  where bm.match_no = ws.match_no
    and ws.slot = 'away'
  returning bm.match_no
),
upsert_result as (
  insert into public.match_results (
    match_id,
    home_team_id,
    away_team_id,
    status,
    home_score,
    away_score,
    home_final_score,
    away_final_score,
    home_penalties,
    away_penalties,
    provider,
    source,
    finished_at,
    synced_at
  )
  select
    m.id,
    m.home_team_id,
    m.away_team_id,
    m.status,
    m.home_score,
    m.away_score,
    m.home_final_score,
    m.away_final_score,
    m.home_penalties,
    m.away_penalties,
    'admin',
    'fix_ger_par_winner',
    now(),
    now()
  from public.matches m
  join target_match tm on tm.match_id = m.id
  on conflict (match_id) do update
  set status = excluded.status,
      home_score = excluded.home_score,
      away_score = excluded.away_score,
      home_final_score = excluded.home_final_score,
      away_final_score = excluded.away_final_score,
      home_penalties = excluded.home_penalties,
      away_penalties = excluded.away_penalties,
      provider = excluded.provider,
      source = excluded.source,
      synced_at = excluded.synced_at
  returning match_id
)
select
  tm.match_id,
  tm.match_no as source_match_no,
  (select count(*) from updated_match) as updated_matches,
  (select count(*) from updated_home) + (select count(*) from updated_away) as updated_winner_slots,
  (select count(*) from upsert_result) as upserted_results,
  public.match_winner_team_id(tm.match_id) as winner_team_id,
  public.settle_match_bets(tm.match_id) as settled_bets
from target_match tm;
