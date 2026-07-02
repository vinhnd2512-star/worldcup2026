-- One-off repair for Belgium vs Senegal handicap bets.
--
-- Problem:
-- Senegal +0.5 should win when the 90-minute score is drawn. Some reopened or
-- manual handicap rows may have stored line as the selected team's handicap
-- (+0.5) instead of the app's home-perspective convention. For Belgium home vs
-- Senegal away, Senegal +0.5 must be stored as line = -0.5.
--
-- This script:
-- 1. Keeps Belgium vs Senegal at 2-2 after 90 minutes, 3-2 final.
-- 2. Corrects the +0.5/-0.5 handicap market line for Senegal.
-- 3. Reverses and re-settles handicap bets for the match.

do $$
declare
  v_match_id bigint := 954;
  v_senegal_side text;
  v_opponent_side text;
  v_home_line numeric(8, 2);
  v_reset_count integer := 0;
  v_settled_count integer := 0;
  v_balance numeric(18, 2);
  v_bet record;
begin
  select
    case
      when ht.code = 'SEN' then 'home'
      when at.code = 'SEN' then 'away'
      else null
    end
  into v_senegal_side
  from public.matches m
  join public.teams ht on ht.id = m.home_team_id
  join public.teams at on at.id = m.away_team_id
  where m.id = v_match_id;

  if v_senegal_side is null then
    raise exception 'Match % does not include Senegal', v_match_id;
  end if;

  v_opponent_side := case when v_senegal_side = 'home' then 'away' else 'home' end;
  v_home_line := case when v_senegal_side = 'home' then 0.5 else -0.5 end;

  update public.matches
  set home_score = 2,
      away_score = 2,
      home_final_score = 3,
      away_final_score = 2,
      updated_at = now()
  where id = v_match_id;

  update public.match_markets
  set line = v_home_line,
      label = 'Kèo châu Á Senegal +0.5',
      source = 'odds-api'
  where match_id = v_match_id
    and market_key = 'asian_handicap'
    and selection_key = v_senegal_side
    and selection_label ~ '\+0([.,]5)?';

  update public.match_markets
  set line = v_home_line,
      label = 'Kèo châu Á Senegal +0.5',
      source = 'odds-api'
  where match_id = v_match_id
    and market_key = 'asian_handicap'
    and selection_key = v_opponent_side
    and selection_label ~ '-0([.,]5)?';

  for v_bet in
    select
      b.id as bet_id,
      b.user_id,
      b.selection_label,
      coalesce(s.payout, 0)::numeric(18, 2) as old_payout
    from public.bets b
    left join public.settlements s on s.bet_id = b.id
    where b.match_id = v_match_id
      and b.market_key = 'asian_handicap'
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
        'Reverse handicap settlement repair: ' || v_bet.selection_label,
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

  select public.settle_match_bets(v_match_id) into v_settled_count;

  raise notice 'Belgium-Senegal handicap repair complete. match_id=%, senegal_side=%, home_line=%, reset_bets=%, re_settled_bets=%',
    v_match_id,
    v_senegal_side,
    v_home_line,
    v_reset_count,
    v_settled_count;
end $$;

select
  b.id as bet_id,
  b.selection_label,
  mm.line,
  b.status,
  b.points_delta,
  b.prediction_bonus,
  s.result,
  s.payout,
  s.reason
from public.bets b
left join public.match_markets mm on mm.id = b.market_id
left join public.settlements s on s.bet_id = b.id
where b.match_id = 954
  and b.market_key = 'asian_handicap'
order by b.placed_at desc;
