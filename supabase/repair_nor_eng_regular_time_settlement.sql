-- Repair Norway vs England after the pre-fix sync settled 90-minute markets
-- from the 1-2 extra-time score instead of the 1-1 regulation-time score.
-- User-cancelled bets are intentionally preserved.

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
    m.home_score,
    m.away_score,
    m.home_final_score,
    m.away_final_score
  into v_match
  from public.matches m
  join public.teams ht on ht.id = m.home_team_id
  join public.teams at on at.id = m.away_team_id
  where ht.code = 'NOR'
    and at.code = 'ENG'
    and m.starts_at >= timestamptz '2026-07-11 00:00:00+00'
    and m.starts_at < timestamptz '2026-07-12 00:00:00+00'
  order by m.id desc
  limit 1;

  if not found then
    raise exception 'Norway vs England match on 2026-07-11 not found.';
  end if;

  update public.matches
  set home_score = 1,
      away_score = 1,
      home_final_score = 1,
      away_final_score = 2,
      status = 'AET',
      updated_at = now()
  where id = v_match.match_id;

  update public.match_results
  set home_score = 1,
      away_score = 1,
      home_final_score = 1,
      away_final_score = 2,
      status = 'AET',
      synced_at = now(),
      provider_payload = coalesce(provider_payload, '{}') || jsonb_build_object(
        'admin_repair', true,
        'repair_reason', 'Norway vs England was 1-1 after 90 minutes and 1-2 after extra time'
      )
  where match_id = v_match.match_id;

  for v_bet in
    select
      b.id,
      b.user_id,
      b.selection_label,
      coalesce(s.payout, 0)::numeric(18, 2) as old_payout
    from public.bets b
    join public.settlements s on s.bet_id = b.id
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
      and s.result <> 'user_cancelled'
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
        'Reverse Norway-England incorrect 90-minute settlement: ' || v_bet.selection_label,
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
    'repair.nor_eng_regular_time',
    'match',
    v_match.match_id::text,
    jsonb_build_object(
      'regular_time_score', '1-1',
      'final_score', '1-2',
      'reset_bets', v_reset_count,
      'settled_bets', v_settled_count
    )
  );

  raise notice 'Norway-England repair complete. match_id=%, reset_bets=%, settled_bets=%',
    v_match.match_id,
    v_reset_count,
    v_settled_count;
end $$;

select
  p.username,
  p.display_name,
  b.id as bet_id,
  b.market_key,
  b.selection_key,
  b.selection_label,
  b.stake,
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
where b.match_id = (
  select m.id
  from public.matches m
  join public.teams ht on ht.id = m.home_team_id
  join public.teams at on at.id = m.away_team_id
  where ht.code = 'NOR'
    and at.code = 'ENG'
    and m.starts_at >= timestamptz '2026-07-11 00:00:00+00'
    and m.starts_at < timestamptz '2026-07-12 00:00:00+00'
  order by m.id desc
  limit 1
)
order by p.display_name, p.username, b.market_key, b.id;
