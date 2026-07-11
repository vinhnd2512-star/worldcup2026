-- One-off repair for Argentina vs Cabo Verde 90-minute settlement.
--
-- Use after the ESPN sync bug saved the final/extra-time score into
-- matches.home_score / matches.away_score. The match was 1-1 after 90 minutes.
--
-- This script:
-- 1. Finds Argentina vs Cabo Verde, preferring bracket match_no 86.
-- 2. Preserves the existing score as final score when final score is missing.
-- 3. Sets the 90-minute score to 1-1 in matches and match_results.
-- 4. Reverses prior payouts for markets settled from the wrong 90-minute score.
-- 5. Resets those bets to placed and runs settle_match_bets again.

do $$
declare
  v_match record;
  v_bet record;
  v_balance numeric(18, 2);
  v_reset_count integer := 0;
  v_settled_count integer := 0;
begin
  select
    m.id as match_id,
    m.status,
    m.home_score,
    m.away_score,
    m.home_final_score,
    m.away_final_score,
    m.home_penalties,
    m.away_penalties
  into v_match
  from public.matches m
  join public.teams ht on ht.id = m.home_team_id
  join public.teams at on at.id = m.away_team_id
  left join public.bracket_matches bm on bm.match_id = m.id
  where bm.match_no = 86
     or ((ht.code = 'ARG' and at.code = 'CPV') or (ht.code = 'CPV' and at.code = 'ARG'))
  order by case when bm.match_no = 86 then 0 else 1 end, m.id desc
  limit 1;

  if not found then
    raise exception 'Argentina vs Cabo Verde match not found.';
  end if;

  update public.matches
  set home_final_score = coalesce(home_final_score, home_score),
      away_final_score = coalesce(away_final_score, away_score),
      home_score = 1,
      away_score = 1,
      updated_at = now()
  where id = v_match.match_id;

  update public.match_results
  set home_final_score = coalesce(home_final_score, home_score),
      away_final_score = coalesce(away_final_score, away_score),
      home_score = 1,
      away_score = 1,
      synced_at = now(),
      provider_payload = coalesce(provider_payload, '{}') || jsonb_build_object(
        'admin_repair', true,
        'repair_reason', 'Argentina vs Cabo Verde was 1-1 after 90 minutes'
      )
  where match_id = v_match.match_id;

  for v_bet in
    select
      b.id,
      b.user_id,
      b.market_key,
      b.selection_label,
      coalesce(s.payout, 0)::numeric(18, 2) as old_payout
    from public.bets b
    left join public.settlements s on s.bet_id = b.id
    where b.match_id = v_match.match_id
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
        'Reverse Argentina-Cabo Verde 90-minute settlement repair: ' || v_bet.selection_label,
        v_balance
      );
    end if;

    delete from public.settlements where bet_id = v_bet.id;

    update public.bets
    set status = 'placed',
        points_delta = 0,
        prediction_bonus = 0,
        settled_at = null
    where id = v_bet.id;

    v_reset_count := v_reset_count + 1;
  end loop;

  select public.settle_match_bets(v_match.match_id) into v_settled_count;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, details_json)
  values (
    auth.uid(),
    'repair.arg_cabo_regular_time',
    'match',
    v_match.match_id::text,
    jsonb_build_object(
      'regular_time_score', '1-1',
      'reset_bets', v_reset_count,
      'settled_bets', v_settled_count
    )
  );

  raise notice 'Argentina-Cabo Verde repair complete. match_id=%, reset_bets=%, settled_bets=%',
    v_match.match_id,
    v_reset_count,
    v_settled_count;
end $$;

select
  p.username,
  p.display_name,
  b.market_key,
  b.selection_key,
  b.selection_label,
  b.stake,
  b.locked_multiplier,
  b.status,
  b.points_delta,
  b.prediction_bonus,
  s.result,
  s.payout,
  s.reason,
  b.settled_at
from public.bets b
join public.profiles p on p.id = b.user_id
left join public.settlements s on s.bet_id = b.id
where b.match_id in (
  select m.id
  from public.matches m
  join public.teams ht on ht.id = m.home_team_id
  join public.teams at on at.id = m.away_team_id
  left join public.bracket_matches bm on bm.match_id = m.id
  where bm.match_no = 86
     or ((ht.code = 'ARG' and at.code = 'CPV') or (ht.code = 'CPV' and at.code = 'ARG'))
)
  and b.market_key in ('match_result', 'correct_score', 'total_goals', 'btts', 'asian_handicap')
order by p.display_name, p.username, b.market_key, b.id;
