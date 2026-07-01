-- One-off repair for matches where the provider saved the final/AET score into
-- matches.home_score / matches.away_score. Those two columns must be the
-- official 90-minute score because correct score, 1X2 draw, totals, BTTS, and
-- handicap markets settle on 90 minutes only.
--
-- How to use:
-- 1. Replace the sample row in repair_match_scores with the affected match id
--    and the correct scores.
-- 2. Run the whole script in Supabase SQL Editor as an admin/service context.
-- 3. Confirm the final SELECT shows re_settled_bets > 0 for affected matches.
--
-- Example:
--   match_id 101 ended 1-1 after 90 minutes, then 2-1 after extra time.
--   Use: (101, 1, 1, 2, 1)

begin;

create temporary table repair_match_scores (
  match_id bigint primary key,
  home_90 integer not null,
  away_90 integer not null,
  home_final integer not null,
  away_final integer not null
) on commit drop;

-- TODO: add affected rows here, for example:
-- insert into repair_match_scores (match_id, home_90, away_90, home_final, away_final)
-- values
--   (101, 1, 1, 2, 1);

-- Stop early if the placeholder has not been replaced.
do $$
begin
  if not exists (select 1 from repair_match_scores) then
    raise exception 'No repair rows supplied. Add at least one row to repair_match_scores.';
  end if;
end $$;

create temporary table repair_bet_reversals on commit drop as
select
  b.id as bet_id,
  b.user_id,
  b.selection_label,
  b.status as old_status,
  coalesce(s.payout, 0)::numeric(18, 2) as old_payout
from public.bets b
join repair_match_scores rms on rms.match_id = b.match_id
left join public.settlements s on s.bet_id = b.id
where b.market_key in (
    'correct_score',
    'match_result',
    'draw_no_bet',
    'total_goals',
    'btts',
    'handicap',
    'asian_handicap'
  )
  and b.status in ('won', 'lost', 'refunded');

update public.profiles p
set wallet_balance = p.wallet_balance - r.old_payout
from repair_bet_reversals r
where p.id = r.user_id
  and r.old_payout <> 0;

insert into public.wallet_ledger (user_id, actor_id, amount, kind, reason, balance_after)
select
  r.user_id,
  auth.uid(),
  -r.old_payout,
  'settlement_reversal',
  'Reverse prior 90-minute settlement repair: ' || r.selection_label,
  p.wallet_balance
from repair_bet_reversals r
join public.profiles p on p.id = r.user_id
where r.old_payout <> 0;

delete from public.settlements s
using repair_bet_reversals r
where s.bet_id = r.bet_id;

update public.bets b
set status = 'placed',
    points_delta = 0,
    prediction_bonus = 0,
    settled_at = null
from repair_bet_reversals r
where b.id = r.bet_id;

update public.matches m
set home_score = rms.home_90,
    away_score = rms.away_90,
    home_final_score = rms.home_final,
    away_final_score = rms.away_final,
    updated_at = now()
from repair_match_scores rms
where m.id = rms.match_id;

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
  'fix_90_minute_settlements',
  now(),
  now()
from public.matches m
join repair_match_scores rms on rms.match_id = m.id
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
    synced_at = excluded.synced_at;

create temporary table repair_settlement_results on commit drop as
select
  rms.match_id,
  public.settle_match_bets(rms.match_id) as re_settled_bets
from repair_match_scores rms;

select
  rms.match_id,
  rms.home_90 || '-' || rms.away_90 as score_90_minutes,
  rms.home_final || '-' || rms.away_final as score_after_extra_time,
  (select count(*) from repair_bet_reversals r join public.bets b on b.id = r.bet_id where b.match_id = rms.match_id) as reset_bets,
  rsr.re_settled_bets
from repair_match_scores rms
join repair_settlement_results rsr on rsr.match_id = rms.match_id
order by rms.match_id;

commit;
