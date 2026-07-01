-- One-off repair for Belgium vs Senegal, bracket match_no 82.
--
-- Match id: 954
-- 90 minutes: Belgium 2-2 Senegal
-- Final after extra time: Belgium 3-2 Senegal
--
-- Run the whole file in Supabase SQL Editor. This version intentionally avoids
-- temporary tables so it can run as one self-contained SQL block.

do $$
declare
  v_match_id bigint := 954;
  v_home_90 integer := 2;
  v_away_90 integer := 2;
  v_home_final integer := 3;
  v_away_final integer := 2;
  v_reset_count integer := 0;
  v_settled_count integer := 0;
  v_balance numeric(18, 2);
  v_bet record;
begin
  for v_bet in
    select
      b.id as bet_id,
      b.user_id,
      b.selection_label,
      b.status as old_status,
      coalesce(s.payout, 0)::numeric(18, 2) as old_payout
    from public.bets b
    left join public.settlements s on s.bet_id = b.id
    where b.match_id = v_match_id
      and b.market_key in (
        'correct_score',
        'match_result',
        'draw_no_bet',
        'total_goals',
        'btts',
        'handicap',
        'asian_handicap'
      )
      and b.status in ('won', 'lost', 'refunded')
  loop
    if v_bet.old_payout <> 0 then
      update public.profiles
      set wallet_balance = wallet_balance - v_bet.old_payout
      where id = v_bet.user_id
      returning wallet_balance into v_balance;

      insert into public.wallet_ledger (user_id, actor_id, amount, kind, reason, balance_after)
      values (
        v_bet.user_id,
        auth.uid(),
        -v_bet.old_payout,
        'settlement_reversal',
        'Reverse prior 90-minute settlement repair: ' || v_bet.selection_label,
        v_balance
      );
    end if;

    delete from public.settlements where bet_id = v_bet.bet_id;

    update public.bets
    set status = 'placed',
        points_delta = 0,
        prediction_bonus = 0,
        settled_at = null
    where id = v_bet.bet_id;

    v_reset_count := v_reset_count + 1;
  end loop;

  update public.matches
  set home_score = v_home_90,
      away_score = v_away_90,
      home_final_score = v_home_final,
      away_final_score = v_away_final,
      updated_at = now()
  where id = v_match_id;

  if not found then
    raise exception 'Match id % was not found in public.matches', v_match_id;
  end if;

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
  where m.id = v_match_id
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

  select public.settle_match_bets(v_match_id) into v_settled_count;

  raise notice 'Belgium vs Senegal repair complete. match_id=%, reset_bets=%, re_settled_bets=%, score_90=%-%, final=%-%',
    v_match_id,
    v_reset_count,
    v_settled_count,
    v_home_90,
    v_away_90,
    v_home_final,
    v_away_final;
end $$;

select
  m.id as match_id,
  82 as match_no,
  ht.code as home_code,
  at.code as away_code,
  m.status,
  m.home_score,
  m.away_score,
  m.home_final_score,
  m.away_final_score,
  count(b.id) filter (where b.status in ('won', 'lost', 'refunded')) as settled_90_minute_bets
from public.matches m
join public.teams ht on ht.id = m.home_team_id
join public.teams at on at.id = m.away_team_id
left join public.bets b
  on b.match_id = m.id
 and b.market_key in (
   'correct_score',
   'match_result',
   'draw_no_bet',
   'total_goals',
   'btts',
   'handicap',
   'asian_handicap'
 )
where m.id = 954
group by m.id, ht.code, at.code, m.status, m.home_score, m.away_score, m.home_final_score, m.away_final_score;
