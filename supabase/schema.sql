-- WorldCup Predict Supabase schema
-- Run this file in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  display_name text not null,
  role text not null default 'player' check (role in ('admin', 'player')),
  is_active boolean not null default true,
  wallet_balance numeric(12, 2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.wallet_ledger (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  amount numeric(12, 2) not null,
  kind text not null,
  reason text not null,
  balance_after numeric(12, 2) not null,
  created_at timestamptz not null default now()
);

create table if not exists public.teams (
  id bigint generated always as identity primary key,
  provider_id text unique,
  code text not null unique,
  name text not null,
  country text not null,
  group_name text,
  group_slot integer,
  confederation text,
  logo_url text,
  flag_code text,
  flag_url text
);

alter table public.teams
  add column if not exists group_name text,
  add column if not exists group_slot integer,
  add column if not exists confederation text,
  add column if not exists flag_code text,
  add column if not exists flag_url text;

create table if not exists public.team_players (
  id bigint generated always as identity primary key,
  team_id bigint not null references public.teams(id) on delete cascade,
  provider_id text unique,
  name text not null,
  position text,
  shirt_number integer,
  date_of_birth date,
  source text not null default 'manual',
  updated_at timestamptz not null default now()
);

create table if not exists public.matches (
  id bigint generated always as identity primary key,
  provider_id text unique,
  stage text not null,
  group_name text,
  home_team_id bigint not null references public.teams(id),
  away_team_id bigint not null references public.teams(id),
  starts_at timestamptz not null,
  status text not null default 'SCHEDULED',
  home_score integer,
  away_score integer,
  home_penalties integer,
  away_penalties integer,
  venue text,
  city text,
  current_minute integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.matches
  add column if not exists home_penalties integer,
  add column if not exists away_penalties integer;

create table if not exists public.match_stats (
  id bigint generated always as identity primary key,
  match_id bigint not null unique references public.matches(id) on delete cascade,
  corners_home integer not null default 0,
  corners_away integer not null default 0,
  yellow_cards_home integer not null default 0,
  yellow_cards_away integer not null default 0,
  red_cards_home integer not null default 0,
  red_cards_away integer not null default 0,
  payload_json jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists public.bracket_matches (
  match_no integer primary key,
  match_id bigint references public.matches(id) on delete set null,
  home_team_id bigint references public.teams(id) on delete set null,
  away_team_id bigint references public.teams(id) on delete set null,
  round_key text not null,
  round_label text not null,
  match_date date not null,
  starts_at timestamptz,
  home_label text not null,
  away_label text not null,
  venue text not null,
  city text,
  is_confirmed boolean not null default false,
  source text not null default 'fifa',
  source_url text,
  display_order integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.bracket_matches
  add column if not exists match_id bigint references public.matches(id) on delete set null,
  add column if not exists home_team_id bigint references public.teams(id) on delete set null,
  add column if not exists away_team_id bigint references public.teams(id) on delete set null,
  add column if not exists starts_at timestamptz,
  add column if not exists is_confirmed boolean not null default false;

create table if not exists public.bracket_slots (
  match_no integer not null references public.bracket_matches(match_no) on delete cascade,
  slot text not null check (slot in ('home', 'away')),
  source_type text not null default 'manual' check (source_type in ('manual', 'winner', 'loser')),
  source_match_no integer references public.bracket_matches(match_no) on delete cascade,
  updated_at timestamptz not null default now(),
  primary key (match_no, slot)
);

create table if not exists public.market_definitions (
  id bigint generated always as identity primary key,
  key text not null unique,
  name text not null,
  market_type text not null,
  settlement_rule text not null,
  enabled boolean not null default true,
  internal_only boolean not null default false,
  default_multiplier numeric(8, 2) not null default 1,
  display_order integer not null default 0
);

create table if not exists public.match_markets (
  id bigint generated always as identity primary key,
  match_id bigint not null references public.matches(id) on delete cascade,
  market_key text not null,
  label text not null,
  selection_key text not null,
  selection_label text not null,
  line numeric(8, 2),
  line_key numeric(8, 2) generated always as (coalesce(line, -999999.00)) stored,
  odds_multiplier numeric(8, 2) not null,
  is_open boolean not null default true,
  source text not null default 'internal',
  closes_at timestamptz not null,
  extra_json jsonb not null default '{}'
);

alter table public.match_markets
  add column if not exists line_key numeric(8, 2) generated always as (coalesce(line, -999999.00)) stored;

create unique index if not exists match_markets_unique_selection_idx
  on public.match_markets (match_id, market_key, selection_key, line_key);

create table if not exists public.outright_markets (
  id bigint generated always as identity primary key,
  market_key text not null,
  label text not null,
  selection_key text not null,
  selection_label text not null,
  odds_multiplier numeric(8, 2) not null,
  is_open boolean not null default true,
  source text not null default 'internal',
  closes_at timestamptz not null,
  extra_json jsonb not null default '{}',
  unique(market_key, selection_key)
);

create table if not exists public.odds_snapshots (
  id bigint generated always as identity primary key,
  match_market_id bigint not null references public.match_markets(id) on delete cascade,
  provider text not null,
  bookmaker text,
  multiplier numeric(8, 2) not null,
  captured_at timestamptz not null default now(),
  payload_json jsonb not null default '{}'
);

create table if not exists public.bets (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  match_id bigint references public.matches(id) on delete set null,
  market_id bigint references public.match_markets(id) on delete set null,
  market_key text not null,
  selection_key text not null,
  selection_label text not null,
  stake numeric(12, 2) not null check (stake > 0),
  locked_multiplier numeric(8, 2) not null,
  potential_payout numeric(12, 2) not null,
  status text not null default 'placed',
  points_delta numeric(12, 2) not null default 0,
  prediction_bonus numeric(12, 2) not null default 0,
  selection_json jsonb not null default '{}',
  placed_at timestamptz not null default now(),
  settled_at timestamptz
);

alter table public.bets
  add column if not exists prediction_bonus numeric(12, 2) not null default 0;

create table if not exists public.settlements (
  id bigint generated always as identity primary key,
  bet_id bigint not null unique references public.bets(id) on delete cascade,
  result text not null,
  status text not null,
  payout numeric(12, 2) not null,
  reason text not null,
  settled_at timestamptz not null default now()
);

create table if not exists public.sync_runs (
  id bigint generated always as identity primary key,
  provider text not null,
  job_type text not null,
  status text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  request_count integer not null default 0,
  message text not null default ''
);

create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  details_json jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists profiles_role_created_at_idx
  on public.profiles (role, created_at desc);

create index if not exists wallet_ledger_user_created_at_idx
  on public.wallet_ledger (user_id, created_at desc);

create index if not exists wallet_ledger_actor_created_at_idx
  on public.wallet_ledger (actor_id, created_at desc);

create index if not exists wallet_ledger_created_at_idx
  on public.wallet_ledger (created_at desc);

create index if not exists matches_starts_at_idx
  on public.matches (starts_at);

create index if not exists matches_status_starts_at_idx
  on public.matches (status, starts_at);

create index if not exists matches_home_team_id_idx
  on public.matches (home_team_id);

create index if not exists matches_away_team_id_idx
  on public.matches (away_team_id);

create index if not exists team_players_team_position_idx
  on public.team_players (team_id, position, shirt_number);

create index if not exists bracket_matches_round_order_idx
  on public.bracket_matches (round_key, display_order);

create index if not exists bracket_matches_match_id_idx
  on public.bracket_matches (match_id);

create index if not exists bracket_slots_source_idx
  on public.bracket_slots (source_match_no, source_type);

create index if not exists match_markets_match_open_closes_idx
  on public.match_markets (match_id, is_open, closes_at);

create index if not exists match_markets_source_idx
  on public.match_markets (source);

create index if not exists outright_markets_open_odds_idx
  on public.outright_markets (is_open, odds_multiplier);

create index if not exists outright_markets_closes_at_idx
  on public.outright_markets (closes_at);

create index if not exists odds_snapshots_market_captured_idx
  on public.odds_snapshots (match_market_id, captured_at desc);

create index if not exists bets_user_placed_at_idx
  on public.bets (user_id, placed_at desc);

create index if not exists bets_placed_at_idx
  on public.bets (placed_at desc);

create index if not exists bets_match_status_idx
  on public.bets (match_id, status);

create index if not exists bets_user_status_idx
  on public.bets (user_id, status);

create index if not exists bets_market_status_idx
  on public.bets (market_key, status);

create index if not exists bets_open_match_idx
  on public.bets (match_id, id)
  where status = 'placed';

create index if not exists bets_open_tournament_winner_idx
  on public.bets (selection_key, id)
  where status = 'placed' and market_key = 'tournament_winner';

create index if not exists sync_runs_started_at_idx
  on public.sync_runs (started_at desc);

create index if not exists audit_logs_created_at_idx
  on public.audit_logs (created_at desc);

create index if not exists audit_logs_actor_created_at_idx
  on public.audit_logs (actor_id, created_at desc);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username text;
  v_display_name text;
  v_role text;
begin
  v_username := coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1));
  v_display_name := coalesce(new.raw_user_meta_data->>'display_name', v_username);
  v_role := coalesce(new.raw_user_meta_data->>'role', 'player');

  insert into public.profiles (id, username, display_name, role, wallet_balance)
  values (new.id, v_username, v_display_name, case when v_role = 'admin' then 'admin' else 'player' end, 0)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and is_active = true
  );
$$;

alter table public.profiles enable row level security;
alter table public.wallet_ledger enable row level security;
alter table public.teams enable row level security;
alter table public.team_players enable row level security;
alter table public.matches enable row level security;
alter table public.match_stats enable row level security;
alter table public.bracket_matches enable row level security;
alter table public.bracket_slots enable row level security;
alter table public.market_definitions enable row level security;
alter table public.match_markets enable row level security;
alter table public.outright_markets enable row level security;
alter table public.odds_snapshots enable row level security;
alter table public.bets enable row level security;
alter table public.settlements enable row level security;
alter table public.sync_runs enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists profiles_read_self_or_admin on public.profiles;
create policy profiles_read_self_or_admin on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_admin_update on public.profiles;
create policy profiles_admin_update on public.profiles
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists public_read_teams on public.teams;
create policy public_read_teams on public.teams for select to authenticated using (true);

drop policy if exists public_read_team_players on public.team_players;
create policy public_read_team_players on public.team_players for select to authenticated using (true);

drop policy if exists public_read_matches on public.matches;
create policy public_read_matches on public.matches for select to authenticated using (true);

drop policy if exists admin_write_matches on public.matches;
create policy admin_write_matches on public.matches
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists public_read_match_stats on public.match_stats;
create policy public_read_match_stats on public.match_stats for select to authenticated using (true);

drop policy if exists public_read_bracket_matches on public.bracket_matches;
create policy public_read_bracket_matches on public.bracket_matches for select to authenticated using (true);

drop policy if exists admin_write_bracket_matches on public.bracket_matches;
create policy admin_write_bracket_matches on public.bracket_matches
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists public_read_bracket_slots on public.bracket_slots;
create policy public_read_bracket_slots on public.bracket_slots for select to authenticated using (true);

drop policy if exists admin_write_bracket_slots on public.bracket_slots;
create policy admin_write_bracket_slots on public.bracket_slots
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists admin_write_match_stats on public.match_stats;
create policy admin_write_match_stats on public.match_stats
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists public_read_market_definitions on public.market_definitions;
create policy public_read_market_definitions on public.market_definitions for select to authenticated using (true);

drop policy if exists public_read_match_markets on public.match_markets;
create policy public_read_match_markets on public.match_markets for select to authenticated using (true);

drop policy if exists admin_write_match_markets on public.match_markets;
create policy admin_write_match_markets on public.match_markets
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists public_read_outright_markets on public.outright_markets;
create policy public_read_outright_markets on public.outright_markets for select to authenticated using (true);

drop policy if exists admin_write_outright_markets on public.outright_markets;
create policy admin_write_outright_markets on public.outright_markets
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists read_own_ledger_or_admin on public.wallet_ledger;
create policy read_own_ledger_or_admin on public.wallet_ledger
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists read_own_bets_or_admin on public.bets;
create policy read_own_bets_or_admin on public.bets
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists read_own_settlements_or_admin on public.settlements;
create policy read_own_settlements_or_admin on public.settlements
  for select using (
    public.is_admin()
    or exists (select 1 from public.bets where bets.id = settlements.bet_id and bets.user_id = auth.uid())
  );

drop policy if exists admin_read_sync_runs on public.sync_runs;
create policy admin_read_sync_runs on public.sync_runs for select using (public.is_admin());

drop policy if exists admin_manage_sync_runs on public.sync_runs;
create policy admin_manage_sync_runs on public.sync_runs
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists admin_read_audit_logs on public.audit_logs;
create policy admin_read_audit_logs on public.audit_logs for select using (public.is_admin());

create or replace view public.leaderboard as
with user_scores as (
  select
    p.id as user_id,
    p.username,
    p.display_name,
    coalesce(sum(case when b.status in ('won', 'lost', 'refunded') then b.points_delta + b.prediction_bonus else 0 end), 0)::numeric(12,2) as score,
    coalesce(sum(case when b.status in ('won', 'lost', 'refunded') then b.points_delta else 0 end), 0)::numeric(12,2) as net_points,
    coalesce(sum(case when b.status in ('won', 'lost', 'refunded') then b.prediction_bonus else 0 end), 0)::numeric(12,2) as bonus_points,
    count(b.id) filter (where b.status in ('won', 'lost', 'refunded'))::integer as settled_bets,
    count(b.id) filter (where b.status = 'won')::integer as won_bets,
    count(b.id) filter (where b.status = 'won' and b.market_key = 'correct_score')::integer as correct_score_count,
    coalesce(sum(b.stake) filter (where b.status in ('won', 'lost')), 0)::numeric(12,2) as total_staked
  from public.profiles p
  left join public.bets b on b.user_id = p.id
  where p.role = 'player'
  group by p.id, p.username, p.display_name
)
select
  rank() over (order by score desc, won_bets desc) as rank,
  user_id,
  username,
  display_name,
  score,
  net_points,
  bonus_points,
  settled_bets,
  won_bets,
  correct_score_count,
  case when settled_bets = 0 then 0 else round((won_bets::numeric / settled_bets::numeric) * 100, 1) end as accuracy,
  case when total_staked = 0 then 0 else round((score / total_staked) * 100, 1) end as roi
from user_scores;

create or replace view public.admin_report as
select
  (select count(*) from public.profiles where role = 'player')::integer as players,
  (select coalesce(sum(wallet_balance), 0)::numeric(12,2) from public.profiles) as total_wallet_balance,
  (select coalesce(sum(stake), 0)::numeric(12,2) from public.bets) as total_staked,
  (select coalesce(sum(points_delta), 0)::numeric(12,2) from public.bets where status in ('won','lost','refunded')) as settled_net_points,
  (select coalesce(sum(prediction_bonus), 0)::numeric(12,2) from public.bets where status in ('won','lost','refunded')) as prediction_bonus_points,
  (select count(*)::integer from public.bets where status = 'placed') as open_bets,
  (select count(*)::integer from public.bets where status in ('won','lost','refunded')) as settled_bets
where public.is_admin();

create or replace view public.admin_user_report as
select
  p.id as user_id,
  p.username,
  p.display_name,
  p.wallet_balance,
  count(b.id)::integer as total_bets,
  count(b.id) filter (where b.status = 'placed')::integer as open_bets,
  count(b.id) filter (where b.status in ('won','lost','refunded'))::integer as settled_bets,
  count(b.id) filter (where b.status = 'won')::integer as won_bets,
  count(b.id) filter (where b.status = 'won' and b.market_key = 'correct_score')::integer as correct_score_count,
  coalesce(sum(b.stake), 0)::numeric(12,2) as total_staked,
  coalesce(sum(b.points_delta) filter (where b.status in ('won','lost','refunded')), 0)::numeric(12,2) as net_points,
  coalesce(sum(b.prediction_bonus) filter (where b.status in ('won','lost','refunded')), 0)::numeric(12,2) as bonus_points,
  coalesce(sum((b.points_delta + b.prediction_bonus)) filter (where b.status in ('won','lost','refunded')), 0)::numeric(12,2) as score,
  case
    when count(b.id) filter (where b.status in ('won','lost','refunded')) = 0 then 0
    else round((count(b.id) filter (where b.status = 'won'))::numeric / (count(b.id) filter (where b.status in ('won','lost','refunded')))::numeric * 100, 1)
  end as accuracy,
  case
    when coalesce(sum(b.stake) filter (where b.status in ('won','lost')), 0) = 0 then 0
    else round(coalesce(sum(b.points_delta) filter (where b.status in ('won','lost')), 0)::numeric / coalesce(sum(b.stake) filter (where b.status in ('won','lost')), 0)::numeric * 100, 1)
  end as roi
from public.profiles p
left join public.bets b on b.user_id = p.id
where p.role = 'player' and public.is_admin()
group by p.id, p.username, p.display_name, p.wallet_balance;

create or replace view public.admin_market_report as
select
  b.market_key,
  count(b.id)::integer as total_bets,
  count(b.id) filter (where b.status = 'placed')::integer as open_bets,
  count(b.id) filter (where b.status in ('won','lost','refunded'))::integer as settled_bets,
  count(b.id) filter (where b.status = 'won')::integer as won_bets,
  coalesce(sum(b.stake), 0)::numeric(12,2) as total_staked,
  coalesce(sum(b.points_delta) filter (where b.status in ('won','lost','refunded')), 0)::numeric(12,2) as net_points,
  coalesce(sum(b.prediction_bonus) filter (where b.status in ('won','lost','refunded')), 0)::numeric(12,2) as bonus_points,
  coalesce(sum((b.points_delta + b.prediction_bonus)) filter (where b.status in ('won','lost','refunded')), 0)::numeric(12,2) as score,
  case
    when count(b.id) filter (where b.status in ('won','lost','refunded')) = 0 then 0
    else round((count(b.id) filter (where b.status = 'won'))::numeric / (count(b.id) filter (where b.status in ('won','lost','refunded')))::numeric * 100, 1)
  end as accuracy,
  case
    when coalesce(sum(b.stake) filter (where b.status in ('won','lost')), 0) = 0 then 0
    else round(coalesce(sum(b.points_delta) filter (where b.status in ('won','lost')), 0)::numeric / coalesce(sum(b.stake) filter (where b.status in ('won','lost')), 0)::numeric * 100, 1)
  end as roi
from public.bets b
where public.is_admin()
group by b.market_key;

alter view public.leaderboard set (security_invoker = false);
alter view public.admin_report set (security_invoker = true);
alter view public.admin_user_report set (security_invoker = true);
alter view public.admin_market_report set (security_invoker = true);

create or replace function public.place_bet(
  p_match_id bigint,
  p_market_id bigint,
  p_selection_key text,
  p_selection_label text,
  p_stake numeric,
  p_selection_json jsonb default '{}'
)
returns public.bets
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user public.profiles%rowtype;
  v_match public.matches%rowtype;
  v_market public.match_markets%rowtype;
  v_bet public.bets%rowtype;
  v_payout numeric(12, 2);
  v_selection_key text;
  v_selection_label text;
  v_selection_json jsonb;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if p_stake <= 0 then
    raise exception 'stake must be positive';
  end if;

  select * into v_user from public.profiles where id = auth.uid() for update;
  if not found or v_user.is_active is false then
    raise exception 'user is inactive';
  end if;

  select * into v_match from public.matches where id = p_match_id;
  if not found then
    raise exception 'match not found';
  end if;
  if v_match.status not in ('SCHEDULED', 'NS', 'TBD') then
    raise exception 'match is not open for pre-match betting';
  end if;

  select * into v_market
  from public.match_markets
  where id = p_market_id and match_id = p_match_id and is_open = true;
  if not found then
    raise exception 'market is not open';
  end if;
  if v_market.market_key = 'correct_score' then
    if not (p_selection_json ? 'home_score') or not (p_selection_json ? 'away_score') then
      raise exception 'correct score requires home_score and away_score';
    end if;
    if (p_selection_json->>'home_score')::integer < 0 or (p_selection_json->>'away_score')::integer < 0 then
      raise exception 'correct score values must be non-negative';
    end if;
    v_selection_key := (p_selection_json->>'home_score') || '-' || (p_selection_json->>'away_score');
    v_selection_label := (p_selection_json->>'home_score') || ' - ' || (p_selection_json->>'away_score');
    v_selection_json := jsonb_build_object(
      'home_score', (p_selection_json->>'home_score')::integer,
      'away_score', (p_selection_json->>'away_score')::integer,
      'line', v_market.line
    );
  elsif p_selection_key <> v_market.selection_key then
    raise exception 'selection does not match selected market';
  else
    v_selection_key := v_market.selection_key;
    v_selection_label := v_market.selection_label;
    v_selection_json := coalesce(p_selection_json, '{}') || jsonb_build_object('line', v_market.line);
  end if;
  if now() >= coalesce(v_market.closes_at, v_match.starts_at) then
    raise exception 'betting is locked for this match';
  end if;
  if v_user.wallet_balance < p_stake then
    raise exception 'insufficient point balance';
  end if;

  v_payout := round(p_stake * v_market.odds_multiplier, 2);

  update public.profiles
  set wallet_balance = wallet_balance - p_stake
  where id = auth.uid();

  insert into public.bets (
    user_id, match_id, market_id, market_key, selection_key, selection_label,
    stake, locked_multiplier, potential_payout, selection_json
  )
  values (
    auth.uid(), p_match_id, p_market_id, v_market.market_key, v_selection_key, v_selection_label,
    p_stake, v_market.odds_multiplier, v_payout,
    v_selection_json
  )
  returning * into v_bet;

  insert into public.wallet_ledger (user_id, actor_id, amount, kind, reason, balance_after)
  values (
    auth.uid(),
    auth.uid(),
    -p_stake,
    'bet_stake',
    'Placed ' || v_market.market_key || ': ' || v_selection_label,
    v_user.wallet_balance - p_stake
  );

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, details_json)
  values (
    auth.uid(),
    'bet.place',
    'bet',
    v_bet.id::text,
    jsonb_build_object(
      'market_key', v_bet.market_key,
      'selection_key', v_bet.selection_key,
      'stake', v_bet.stake,
      'locked_multiplier', v_bet.locked_multiplier,
      'match_id', v_bet.match_id
    )
  );

  return v_bet;
end;
$$;

create or replace function public.admin_adjust_wallet(
  p_user_id uuid,
  p_amount numeric,
  p_reason text default 'Admin adjustment'
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles%rowtype;
begin
  if not public.is_admin() then
    raise exception 'admin role required';
  end if;

  update public.profiles
  set wallet_balance = wallet_balance + p_amount
  where id = p_user_id
  returning * into v_profile;

  if not found then
    raise exception 'user not found';
  end if;
  if v_profile.wallet_balance < 0 then
    raise exception 'wallet balance cannot be negative';
  end if;

  insert into public.wallet_ledger (user_id, actor_id, amount, kind, reason, balance_after)
  values (
    p_user_id,
    auth.uid(),
    p_amount,
    case when p_amount >= 0 then 'admin_topup' else 'admin_deduction' end,
    p_reason,
    v_profile.wallet_balance
  );

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, details_json)
  values (
    auth.uid(),
    case when p_amount >= 0 then 'wallet.topup' else 'wallet.deduct' end,
    'profile',
    p_user_id::text,
    jsonb_build_object('amount', p_amount, 'reason', p_reason, 'balance_after', v_profile.wallet_balance)
  );

  return v_profile;
end;
$$;

create or replace function public.admin_update_match_market(
  p_market_id bigint,
  p_odds_multiplier numeric,
  p_is_open boolean,
  p_closes_at timestamptz
)
returns public.match_markets
language plpgsql
security definer
set search_path = public
as $$
declare
  v_market public.match_markets%rowtype;
begin
  if not public.is_admin() then
    raise exception 'admin role required';
  end if;
  if p_odds_multiplier < 1 then
    raise exception 'odds multiplier must be at least 1';
  end if;

  update public.match_markets
  set
    odds_multiplier = p_odds_multiplier,
    is_open = p_is_open,
    closes_at = p_closes_at,
    source = 'admin',
    extra_json = coalesce(extra_json, '{}') || jsonb_build_object(
      'provider', 'admin',
      'updated_by', auth.uid(),
      'updated_at', now()
    )
  where id = p_market_id
  returning * into v_market;

  if not found then
    raise exception 'market not found';
  end if;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, details_json)
  values (
    auth.uid(),
    'market.update',
    'match_market',
    p_market_id::text,
    jsonb_build_object(
      'match_id', v_market.match_id,
      'market_key', v_market.market_key,
      'selection_key', v_market.selection_key,
      'odds_multiplier', v_market.odds_multiplier,
      'is_open', v_market.is_open,
      'closes_at', v_market.closes_at
    )
  );

  return v_market;
end;
$$;

create or replace function public.admin_update_outright_market(
  p_market_id bigint,
  p_odds_multiplier numeric,
  p_is_open boolean,
  p_closes_at timestamptz
)
returns public.outright_markets
language plpgsql
security definer
set search_path = public
as $$
declare
  v_market public.outright_markets%rowtype;
begin
  if not public.is_admin() then
    raise exception 'admin role required';
  end if;
  if p_odds_multiplier < 1 then
    raise exception 'odds multiplier must be at least 1';
  end if;

  update public.outright_markets
  set
    odds_multiplier = p_odds_multiplier,
    is_open = p_is_open,
    closes_at = p_closes_at,
    source = 'admin',
    extra_json = coalesce(extra_json, '{}') || jsonb_build_object(
      'provider', 'admin',
      'updated_by', auth.uid(),
      'updated_at', now()
    )
  where id = p_market_id
  returning * into v_market;

  if not found then
    raise exception 'outright market not found';
  end if;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, details_json)
  values (
    auth.uid(),
    'outright.update',
    'outright_market',
    p_market_id::text,
    jsonb_build_object(
      'market_key', v_market.market_key,
      'selection_key', v_market.selection_key,
      'odds_multiplier', v_market.odds_multiplier,
      'is_open', v_market.is_open,
      'closes_at', v_market.closes_at
    )
  );

  return v_market;
end;
$$;

create or replace function public.admin_void_bet(
  p_bet_id bigint,
  p_reason text default 'Admin voided bet'
)
returns public.bets
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bet public.bets%rowtype;
  v_balance numeric(12, 2);
begin
  if not public.is_admin() then
    raise exception 'admin role required';
  end if;

  select * into v_bet
  from public.bets
  where id = p_bet_id
  for update;

  if not found then
    raise exception 'bet not found';
  end if;
  if v_bet.status <> 'placed' then
    raise exception 'only placed bets can be voided';
  end if;

  update public.bets
  set status = 'refunded',
      points_delta = 0,
      prediction_bonus = 0,
      settled_at = now()
  where id = p_bet_id
  returning * into v_bet;

  update public.profiles
  set wallet_balance = wallet_balance + v_bet.stake
  where id = v_bet.user_id
  returning wallet_balance into v_balance;

  insert into public.wallet_ledger (user_id, actor_id, amount, kind, reason, balance_after)
  values (v_bet.user_id, auth.uid(), v_bet.stake, 'bet_refund', p_reason, v_balance);

  insert into public.settlements (bet_id, result, status, payout, reason)
  values (v_bet.id, 'admin_void', 'refunded', v_bet.stake, p_reason);

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, details_json)
  values (
    auth.uid(),
    'bet.void',
    'bet',
    p_bet_id::text,
    jsonb_build_object(
      'user_id', v_bet.user_id,
      'market_key', v_bet.market_key,
      'stake', v_bet.stake,
      'reason', p_reason
    )
  );

  return v_bet;
end;
$$;

create or replace function public.place_outright_bet(
  p_outright_market_id bigint,
  p_stake numeric
)
returns public.bets
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user public.profiles%rowtype;
  v_market public.outright_markets%rowtype;
  v_bet public.bets%rowtype;
  v_payout numeric(12, 2);
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if p_stake <= 0 then
    raise exception 'stake must be positive';
  end if;

  select * into v_user from public.profiles where id = auth.uid() for update;
  if not found or v_user.is_active is false then
    raise exception 'user is inactive';
  end if;

  select * into v_market from public.outright_markets where id = p_outright_market_id and is_open = true;
  if not found then
    raise exception 'outright market is not open';
  end if;
  if now() >= v_market.closes_at then
    raise exception 'outright market is locked';
  end if;
  if v_user.wallet_balance < p_stake then
    raise exception 'insufficient point balance';
  end if;

  v_payout := round(p_stake * v_market.odds_multiplier, 2);

  update public.profiles
  set wallet_balance = wallet_balance - p_stake
  where id = auth.uid();

  insert into public.bets (
    user_id, match_id, market_id, market_key, selection_key, selection_label,
    stake, locked_multiplier, potential_payout, selection_json
  )
  values (
    auth.uid(), null, null, v_market.market_key, v_market.selection_key, v_market.selection_label,
    p_stake, v_market.odds_multiplier, v_payout,
    jsonb_build_object('outright_market_id', v_market.id)
  )
  returning * into v_bet;

  insert into public.wallet_ledger (user_id, actor_id, amount, kind, reason, balance_after)
  values (
    auth.uid(),
    auth.uid(),
    -p_stake,
    'bet_stake',
    'Placed ' || v_market.market_key || ': ' || v_market.selection_label,
    v_user.wallet_balance - p_stake
  );

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, details_json)
  values (
    auth.uid(),
    'bet.place_outright',
    'bet',
    v_bet.id::text,
    jsonb_build_object(
      'market_key', v_bet.market_key,
      'selection_key', v_bet.selection_key,
      'stake', v_bet.stake,
      'locked_multiplier', v_bet.locked_multiplier
    )
  );

  return v_bet;
end;
$$;

create or replace function public.settle_tournament_winner(p_winner_key text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bet public.bets%rowtype;
  v_won boolean;
  v_payout numeric(12, 2);
  v_delta numeric(12, 2);
  v_bonus numeric(12, 2);
  v_count integer := 0;
begin
  if not public.is_admin() then
    raise exception 'admin role required';
  end if;

  update public.outright_markets
  set is_open = false
  where market_key = 'tournament_winner';

  for v_bet in
    select * from public.bets
    where market_key = 'tournament_winner' and status = 'placed'
  loop
    v_won := v_bet.selection_key = p_winner_key;
    if v_won then
      v_payout := round(v_bet.stake * v_bet.locked_multiplier, 2);
      v_delta := v_payout - v_bet.stake;
      v_bonus := 25;
      update public.bets set status = 'won', points_delta = v_delta, prediction_bonus = v_bonus, settled_at = now() where id = v_bet.id;
      update public.profiles set wallet_balance = wallet_balance + v_payout where id = v_bet.user_id;
      insert into public.wallet_ledger (user_id, actor_id, amount, kind, reason, balance_after)
      select
        v_bet.user_id,
        auth.uid(),
        v_payout,
        'bet_payout',
        'Tournament winner payout: ' || v_bet.selection_label,
        wallet_balance
      from public.profiles
      where id = v_bet.user_id;
      insert into public.settlements (bet_id, result, status, payout, reason)
      values (v_bet.id, p_winner_key, 'won', v_payout, 'Tournament winner matched; leaderboard bonus applied.');
    else
      v_payout := 0;
      v_delta := -v_bet.stake;
      v_bonus := 0;
      update public.bets set status = 'lost', points_delta = v_delta, prediction_bonus = v_bonus, settled_at = now() where id = v_bet.id;
      insert into public.settlements (bet_id, result, status, payout, reason)
      values (v_bet.id, p_winner_key, 'lost', v_payout, 'Tournament winner did not match.');
    end if;
    v_count := v_count + 1;
  end loop;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, details_json)
  values (
    auth.uid(),
    'settlement.tournament_winner',
    'tournament_winner',
    p_winner_key,
    jsonb_build_object('winner_key', p_winner_key, 'settled_bets', v_count)
  );

  return v_count;
end;
$$;

create or replace function public.ensure_default_markets_for_match(p_match_id bigint)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match public.matches%rowtype;
  v_count integer := 0;
begin
  if not public.is_admin() then
    raise exception 'admin role required';
  end if;

  select * into v_match from public.matches where id = p_match_id;
  if not found then
    raise exception 'match not found';
  end if;

  insert into public.match_markets (match_id, market_key, label, selection_key, selection_label, line, odds_multiplier, source, closes_at)
  values
    (v_match.id, 'correct_score', 'Dự đoán tỷ số', 'exact', 'Tỷ số chính xác', null, 2.45, 'internal', v_match.starts_at),
    (v_match.id, 'match_result', 'Kết quả 1X2', 'home', 'Đội nhà thắng', null, 1.85, 'internal', v_match.starts_at),
    (v_match.id, 'match_result', 'Kết quả 1X2', 'draw', 'Hòa', null, 3.10, 'internal', v_match.starts_at),
    (v_match.id, 'match_result', 'Kết quả 1X2', 'away', 'Đội khách thắng', null, 2.05, 'internal', v_match.starts_at),
    (v_match.id, 'draw_no_bet', 'Draw no bet', 'home', 'Home DNB', null, 1.65, 'internal', v_match.starts_at),
    (v_match.id, 'draw_no_bet', 'Draw no bet', 'away', 'Away DNB', null, 1.75, 'internal', v_match.starts_at),
    (v_match.id, 'total_goals', 'Tổng bàn thắng 2.5', 'over', 'Tài 2.5', 2.5, 1.92, 'internal', v_match.starts_at),
    (v_match.id, 'total_goals', 'Tổng bàn thắng 2.5', 'under', 'Xỉu 2.5', 2.5, 1.88, 'internal', v_match.starts_at),
    (v_match.id, 'btts', 'Hai đội cùng ghi bàn', 'yes', 'Có', null, 1.95, 'internal', v_match.starts_at),
    (v_match.id, 'btts', 'Hai đội cùng ghi bàn', 'no', 'Không', null, 1.82, 'internal', v_match.starts_at),
    (v_match.id, 'corners_total', 'Tổng phạt góc 8.5', 'over', 'Tài góc 8.5', 8.5, 1.90, 'internal', v_match.starts_at),
    (v_match.id, 'corners_total', 'Tổng phạt góc 8.5', 'under', 'Xỉu góc 8.5', 8.5, 1.90, 'internal', v_match.starts_at),
    (v_match.id, 'cards_total', 'Tổng thẻ 3.5', 'over', 'Tài thẻ 3.5', 3.5, 1.90, 'internal', v_match.starts_at),
    (v_match.id, 'cards_total', 'Tổng thẻ 3.5', 'under', 'Xỉu thẻ 3.5', 3.5, 1.90, 'internal', v_match.starts_at)
  on conflict (match_id, market_key, selection_key, line_key) do nothing;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

create or replace function public.ensure_bracket_match(p_match_no integer)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bracket public.bracket_matches%rowtype;
  v_match_id bigint;
  v_starts_at timestamptz;
begin
  if not public.is_admin() then
    raise exception 'admin role required';
  end if;

  select * into v_bracket from public.bracket_matches where match_no = p_match_no;
  if not found then
    raise exception 'bracket match not found';
  end if;
  if v_bracket.home_team_id is null or v_bracket.away_team_id is null then
    return v_bracket.match_id;
  end if;

  v_starts_at := coalesce(v_bracket.starts_at, v_bracket.match_date::timestamp at time zone 'UTC');

  insert into public.matches (provider_id, stage, group_name, home_team_id, away_team_id, starts_at, status, venue, city)
  values (
    'fifa-2026-' || lpad(p_match_no::text, 3, '0'),
    v_bracket.round_label,
    null,
    v_bracket.home_team_id,
    v_bracket.away_team_id,
    v_starts_at,
    'SCHEDULED',
    v_bracket.venue,
    v_bracket.city
  )
  on conflict (provider_id) do update
  set stage = excluded.stage,
      group_name = excluded.group_name,
      home_team_id = excluded.home_team_id,
      away_team_id = excluded.away_team_id,
      starts_at = excluded.starts_at,
      venue = excluded.venue,
      city = excluded.city,
      updated_at = now()
  returning id into v_match_id;

  update public.bracket_matches
  set match_id = v_match_id,
      starts_at = v_starts_at,
      home_label = (select name from public.teams where id = v_bracket.home_team_id),
      away_label = (select name from public.teams where id = v_bracket.away_team_id),
      is_confirmed = true,
      updated_at = now()
  where match_no = p_match_no;

  perform public.ensure_default_markets_for_match(v_match_id);
  return v_match_id;
end;
$$;

create or replace function public.admin_set_bracket_slot(
  p_match_no integer,
  p_slot text,
  p_team_id bigint
)
returns public.bracket_matches
language plpgsql
security definer
set search_path = public
as $$
declare
  v_team public.teams%rowtype;
  v_bracket public.bracket_matches%rowtype;
begin
  if not public.is_admin() then
    raise exception 'admin role required';
  end if;
  if p_slot not in ('home', 'away') then
    raise exception 'slot must be home or away';
  end if;

  select * into v_team from public.teams where id = p_team_id;
  if not found then
    raise exception 'team not found';
  end if;

  if p_slot = 'home' then
    update public.bracket_matches
    set home_team_id = p_team_id,
        home_label = v_team.name,
        updated_at = now()
    where match_no = p_match_no
    returning * into v_bracket;
  else
    update public.bracket_matches
    set away_team_id = p_team_id,
        away_label = v_team.name,
        updated_at = now()
    where match_no = p_match_no
    returning * into v_bracket;
  end if;

  if not found then
    raise exception 'bracket match not found';
  end if;

  update public.bracket_matches
  set is_confirmed = home_team_id is not null and away_team_id is not null,
      updated_at = now()
  where match_no = p_match_no
  returning * into v_bracket;

  perform public.ensure_bracket_match(p_match_no);

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, details_json)
  values (
    auth.uid(),
    'bracket.slot_set',
    'bracket_match',
    p_match_no::text,
    jsonb_build_object('slot', p_slot, 'team_id', p_team_id)
  );

  return v_bracket;
end;
$$;

create or replace function public.match_winner_team_id(p_match_id bigint)
returns bigint
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_match public.matches%rowtype;
begin
  select * into v_match from public.matches where id = p_match_id;
  if not found or v_match.status not in ('FT', 'AET', 'PEN', 'FT_PEN') then
    return null;
  end if;
  if v_match.home_score is null or v_match.away_score is null then
    return null;
  end if;
  if v_match.home_score > v_match.away_score then
    return v_match.home_team_id;
  elsif v_match.away_score > v_match.home_score then
    return v_match.away_team_id;
  elsif v_match.status in ('PEN', 'FT_PEN')
    and v_match.home_penalties is not null
    and v_match.away_penalties is not null then
    if v_match.home_penalties > v_match.away_penalties then
      return v_match.home_team_id;
    elsif v_match.away_penalties > v_match.home_penalties then
      return v_match.away_team_id;
    end if;
  end if;
  return null;
end;
$$;

create or replace function public.match_loser_team_id(p_match_id bigint)
returns bigint
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_match public.matches%rowtype;
  v_winner bigint;
begin
  select * into v_match from public.matches where id = p_match_id;
  if not found then
    return null;
  end if;
  v_winner := public.match_winner_team_id(p_match_id);
  if v_winner is null then
    return null;
  end if;
  if v_winner = v_match.home_team_id then
    return v_match.away_team_id;
  end if;
  return v_match.home_team_id;
end;
$$;

create or replace function public.advance_knockout_match(p_match_id bigint)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_source public.bracket_matches%rowtype;
  v_slot record;
  v_team_id bigint;
  v_count integer := 0;
begin
  if not public.is_admin() then
    raise exception 'admin role required';
  end if;

  select * into v_source from public.bracket_matches where match_id = p_match_id;
  if not found then
    return 0;
  end if;

  for v_slot in
    select * from public.bracket_slots
    where source_match_no = v_source.match_no
      and source_type in ('winner', 'loser')
  loop
    v_team_id := case
      when v_slot.source_type = 'winner' then public.match_winner_team_id(p_match_id)
      else public.match_loser_team_id(p_match_id)
    end;
    if v_team_id is null then
      continue;
    end if;

    if v_slot.slot = 'home' then
      update public.bracket_matches
      set home_team_id = v_team_id,
          home_label = (select name from public.teams where id = v_team_id),
          is_confirmed = away_team_id is not null,
          updated_at = now()
      where match_no = v_slot.match_no;
    else
      update public.bracket_matches
      set away_team_id = v_team_id,
          away_label = (select name from public.teams where id = v_team_id),
          is_confirmed = home_team_id is not null,
          updated_at = now()
      where match_no = v_slot.match_no;
    end if;

    perform public.ensure_bracket_match(v_slot.match_no);
    v_count := v_count + 1;
  end loop;

  if v_count > 0 then
    insert into public.audit_logs (actor_id, action, entity_type, entity_id, details_json)
    values (
      auth.uid(),
      'bracket.advance',
      'bracket_match',
      v_source.match_no::text,
      jsonb_build_object('match_id', p_match_id, 'advanced_slots', v_count)
    );
  end if;

  return v_count;
end;
$$;

create or replace function public.settle_match_bets(p_match_id bigint)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match public.matches%rowtype;
  v_stats public.match_stats%rowtype;
  v_bet record;
  v_won boolean;
  v_payout numeric(12, 2);
  v_delta numeric(12, 2);
  v_bonus numeric(12, 2);
  v_total_goals numeric;
  v_total_corners numeric;
  v_total_cards numeric;
  v_count integer := 0;
  v_advanced integer := 0;
begin
  if not public.is_admin() then
    raise exception 'admin role required';
  end if;

  select * into v_match from public.matches where id = p_match_id;
  if not found then
    raise exception 'match not found';
  end if;
  if v_match.status not in ('FT', 'AET', 'PEN', 'FT_PEN', 'PST', 'CANC', 'ABD', 'SUSP', 'VOID') then
    return 0;
  end if;

  select * into v_stats from public.match_stats where match_id = p_match_id;
  v_total_goals := coalesce(v_match.home_score, 0) + coalesce(v_match.away_score, 0);
  v_total_corners := coalesce(v_stats.corners_home, 0) + coalesce(v_stats.corners_away, 0);
  v_total_cards := coalesce(v_stats.yellow_cards_home, 0) + coalesce(v_stats.yellow_cards_away, 0)
    + coalesce(v_stats.red_cards_home, 0) + coalesce(v_stats.red_cards_away, 0);

  for v_bet in
    select b.*, mm.line
    from public.bets b
    left join public.match_markets mm on mm.id = b.market_id
    where b.match_id = p_match_id and b.status = 'placed'
  loop
    if v_match.status in ('PST', 'CANC', 'ABD', 'SUSP', 'VOID') then
      v_payout := v_bet.stake;
      v_delta := 0;
      v_bonus := 0;
      update public.bets set status = 'refunded', points_delta = v_delta, prediction_bonus = v_bonus, settled_at = now() where id = v_bet.id;
      update public.profiles set wallet_balance = wallet_balance + v_payout where id = v_bet.user_id;
      insert into public.wallet_ledger (user_id, actor_id, amount, kind, reason, balance_after)
      select
        v_bet.user_id,
        auth.uid(),
        v_payout,
        'bet_refund',
        'Refunded void match stake: ' || v_bet.selection_label,
        wallet_balance
      from public.profiles
      where id = v_bet.user_id;
      insert into public.settlements (bet_id, result, status, payout, reason)
      values (v_bet.id, 'void', 'refunded', v_payout, 'Match void/postponed/cancelled; stake refunded.');
      v_count := v_count + 1;
      continue;
    end if;

    v_won := false;
    if v_bet.market_key = 'correct_score' then
      v_won := (coalesce((v_bet.selection_json->>'home_score')::integer, -1) = v_match.home_score)
        and (coalesce((v_bet.selection_json->>'away_score')::integer, -1) = v_match.away_score);
    elsif v_bet.market_key = 'match_result' then
      v_won := (v_bet.selection_key = 'home' and v_match.home_score > v_match.away_score)
        or (v_bet.selection_key = 'draw' and v_match.home_score = v_match.away_score)
        or (v_bet.selection_key = 'away' and v_match.away_score > v_match.home_score);
    elsif v_bet.market_key = 'draw_no_bet' then
      if v_match.home_score = v_match.away_score then
        v_payout := v_bet.stake;
        v_delta := 0;
        v_bonus := 0;
        update public.bets set status = 'refunded', points_delta = v_delta, prediction_bonus = v_bonus, settled_at = now() where id = v_bet.id;
        update public.profiles set wallet_balance = wallet_balance + v_payout where id = v_bet.user_id;
        insert into public.wallet_ledger (user_id, actor_id, amount, kind, reason, balance_after)
        select
          v_bet.user_id,
          auth.uid(),
          v_payout,
          'bet_refund',
          'Draw no bet refund: ' || v_bet.selection_label,
          wallet_balance
        from public.profiles
        where id = v_bet.user_id;
        insert into public.settlements (bet_id, result, status, payout, reason)
        values (v_bet.id, 'draw', 'refunded', v_payout, 'Draw no bet market refunded because the match was drawn.');
        v_count := v_count + 1;
        continue;
      end if;
      v_won := (v_bet.selection_key = 'home' and v_match.home_score > v_match.away_score)
        or (v_bet.selection_key = 'away' and v_match.away_score > v_match.home_score);
    elsif v_bet.market_key = 'total_goals' then
      v_won := (v_bet.selection_key = 'over' and v_total_goals > v_bet.line)
        or (v_bet.selection_key = 'under' and v_total_goals < v_bet.line);
    elsif v_bet.market_key = 'btts' then
      v_won := (v_bet.selection_key = 'yes' and v_match.home_score > 0 and v_match.away_score > 0)
        or (v_bet.selection_key = 'no' and not (v_match.home_score > 0 and v_match.away_score > 0));
    elsif v_bet.market_key = 'corners_total' then
      v_won := (v_bet.selection_key = 'over' and v_total_corners > v_bet.line)
        or (v_bet.selection_key = 'under' and v_total_corners < v_bet.line);
    elsif v_bet.market_key = 'cards_total' then
      v_won := (v_bet.selection_key = 'over' and v_total_cards > v_bet.line)
        or (v_bet.selection_key = 'under' and v_total_cards < v_bet.line);
    end if;

    if v_won then
      v_payout := round(v_bet.stake * v_bet.locked_multiplier, 2);
      v_delta := v_payout - v_bet.stake;
      v_bonus := case
        when v_bet.market_key = 'correct_score' then 50
        when v_bet.market_key = 'match_result' then 10
        when v_bet.market_key in ('draw_no_bet', 'total_goals', 'btts') then 8
        when v_bet.market_key in ('corners_total', 'cards_total') then 6
        else 0
      end;
      update public.bets set status = 'won', points_delta = v_delta, prediction_bonus = v_bonus, settled_at = now() where id = v_bet.id;
      update public.profiles set wallet_balance = wallet_balance + v_payout where id = v_bet.user_id;
      insert into public.wallet_ledger (user_id, actor_id, amount, kind, reason, balance_after)
      select
        v_bet.user_id,
        auth.uid(),
        v_payout,
        'bet_payout',
        'Match payout: ' || v_bet.selection_label,
        wallet_balance
      from public.profiles
      where id = v_bet.user_id;
      insert into public.settlements (bet_id, result, status, payout, reason)
      values (v_bet.id, 'win', 'won', v_payout, 'Selection matched the final 90-minute result; leaderboard bonus applied.');
    else
      v_payout := 0;
      v_delta := -v_bet.stake;
      v_bonus := 0;
      update public.bets set status = 'lost', points_delta = v_delta, prediction_bonus = v_bonus, settled_at = now() where id = v_bet.id;
      insert into public.settlements (bet_id, result, status, payout, reason)
      values (v_bet.id, 'loss', 'lost', v_payout, 'Selection did not match the final 90-minute result.');
    end if;

    v_count := v_count + 1;
  end loop;

  v_advanced := public.advance_knockout_match(p_match_id);

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, details_json)
  values (
    auth.uid(),
    'settlement.match',
    'match',
    p_match_id::text,
    jsonb_build_object('match_id', p_match_id, 'status', v_match.status, 'settled_bets', v_count, 'advanced_slots', v_advanced)
  );

  return v_count;
end;
$$;
