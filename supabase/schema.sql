-- WorldCup Predict Supabase schema
-- Run this file in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  display_name text not null,
  role text not null default 'player' check (role in ('admin', 'player')),
  is_active boolean not null default true,
  wallet_balance numeric(18, 2) not null default 0,
  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id) on delete set null,
  deleted_reason text,
  created_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references public.profiles(id) on delete set null,
  add column if not exists deleted_reason text;

create table if not exists public.wallet_ledger (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  amount numeric(18, 2) not null,
  kind text not null,
  reason text not null,
  balance_after numeric(18, 2) not null,
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
  flag_url text,
  fifa_rank integer,
  fifa_points numeric(8, 2),
  rating_source text,
  rating_updated_at timestamptz,
  fifa_team_id text,
  fifa_profile_json jsonb not null default '{}',
  coach_name text,
  world_cup_titles integer not null default 0,
  world_cup_title_years integer[] not null default '{}',
  profile_updated_at timestamptz,
  transfermarkt_team_id text,
  transfermarkt_url text,
  squad_market_value_eur numeric(14, 2),
  squad_market_value_label text,
  squad_value_rank integer,
  squad_value_updated_at timestamptz,
  squad_value_source text
);

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
  add column if not exists profile_updated_at timestamptz,
  add column if not exists transfermarkt_team_id text,
  add column if not exists transfermarkt_url text,
  add column if not exists squad_market_value_eur numeric(14, 2),
  add column if not exists squad_market_value_label text,
  add column if not exists squad_value_rank integer,
  add column if not exists squad_value_updated_at timestamptz,
  add column if not exists squad_value_source text;

create table if not exists public.team_players (
  id bigint generated always as identity primary key,
  team_id bigint not null references public.teams(id) on delete cascade,
  provider_id text unique,
  name text not null,
  position text,
  shirt_number integer,
  date_of_birth date,
  club text,
  photo_url text,
  overall_rating integer,
  rating_source text,
  rating_updated_at timestamptz,
  height_cm numeric(5, 1),
  weight_kg numeric(5, 1),
  preferred_foot text,
  fifa_position_code integer,
  real_position integer,
  position_side integer,
  active_status integer,
  fifa_payload_json jsonb not null default '{}',
  transfermarkt_player_id text,
  transfermarkt_url text,
  market_value_eur numeric(14, 2),
  market_value_label text,
  market_value_updated_at timestamptz,
  market_value_source text,
  source text not null default 'manual',
  updated_at timestamptz not null default now()
);

alter table public.team_players
  add column if not exists club text,
  add column if not exists photo_url text,
  add column if not exists overall_rating integer,
  add column if not exists rating_source text,
  add column if not exists rating_updated_at timestamptz,
  add column if not exists height_cm numeric(5, 1),
  add column if not exists weight_kg numeric(5, 1),
  add column if not exists preferred_foot text,
  add column if not exists fifa_position_code integer,
  add column if not exists real_position integer,
  add column if not exists position_side integer,
  add column if not exists active_status integer,
  add column if not exists fifa_payload_json jsonb not null default '{}',
  add column if not exists transfermarkt_player_id text,
  add column if not exists transfermarkt_url text,
  add column if not exists market_value_eur numeric(14, 2),
  add column if not exists market_value_label text,
  add column if not exists market_value_updated_at timestamptz,
  add column if not exists market_value_source text;

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

create table if not exists public.match_results (
  id bigint generated always as identity primary key,
  match_id bigint not null unique references public.matches(id) on delete cascade,
  home_team_id bigint not null references public.teams(id),
  away_team_id bigint not null references public.teams(id),
  status text not null,
  home_score integer,
  away_score integer,
  home_penalties integer,
  away_penalties integer,
  provider text not null default 'manual',
  source text not null default 'manual',
  provider_payload jsonb not null default '{}',
  finished_at timestamptz,
  synced_at timestamptz not null default now()
);

alter table public.match_results
  add column if not exists home_penalties integer,
  add column if not exists away_penalties integer,
  add column if not exists provider text not null default 'manual',
  add column if not exists source text not null default 'manual',
  add column if not exists provider_payload jsonb not null default '{}',
  add column if not exists finished_at timestamptz,
  add column if not exists synced_at timestamptz not null default now();

create table if not exists public.team_lineups (
  id bigint generated always as identity primary key,
  team_id bigint not null references public.teams(id) on delete cascade,
  match_id bigint references public.matches(id) on delete cascade,
  formation text,
  source text not null default 'projected',
  lineup_json jsonb not null default '[]',
  updated_at timestamptz not null default now(),
  unique(team_id, match_id, source)
);

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

update public.match_markets
set is_open = false
where market_key = 'correct_score'
  and source = 'internal';

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
  stake numeric(18, 2) not null check (stake > 0),
  locked_multiplier numeric(8, 2) not null,
  potential_payout numeric(18, 2) not null,
  status text not null default 'placed',
  points_delta numeric(18, 2) not null default 0,
  prediction_bonus numeric(18, 2) not null default 0,
  selection_json jsonb not null default '{}',
  placed_at timestamptz not null default now(),
  settled_at timestamptz
);

alter table public.bets
  add column if not exists prediction_bonus numeric(18, 2) not null default 0;

create table if not exists public.settlements (
  id bigint generated always as identity primary key,
  bet_id bigint not null unique references public.bets(id) on delete cascade,
  result text not null,
  status text not null,
  payout numeric(18, 2) not null,
  reason text not null,
  settled_at timestamptz not null default now()
);

-- Existing report views depend on money columns, so drop them before widening
-- numeric precision on already-created databases.
drop view if exists public.admin_market_report;
drop view if exists public.admin_user_report;
drop view if exists public.admin_report;
drop view if exists public.leaderboard;

alter table public.profiles
  alter column wallet_balance type numeric(18, 2);

alter table public.wallet_ledger
  alter column amount type numeric(18, 2),
  alter column balance_after type numeric(18, 2);

alter table public.bets
  alter column stake type numeric(18, 2),
  alter column potential_payout type numeric(18, 2),
  alter column points_delta type numeric(18, 2),
  alter column prediction_bonus type numeric(18, 2);

alter table public.settlements
  alter column payout type numeric(18, 2);

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

create index if not exists profiles_deleted_at_idx
  on public.profiles (deleted_at)
  where deleted_at is not null;

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

create index if not exists match_results_finished_at_idx
  on public.match_results (finished_at desc);

create index if not exists match_results_provider_synced_idx
  on public.match_results (provider, synced_at desc);

create index if not exists team_players_team_position_idx
  on public.team_players (team_id, position, shirt_number);

create unique index if not exists teams_fifa_team_id_idx
  on public.teams (fifa_team_id)
  where fifa_team_id is not null;

create unique index if not exists teams_transfermarkt_team_id_idx
  on public.teams (transfermarkt_team_id)
  where transfermarkt_team_id is not null;

create index if not exists team_lineups_team_match_idx
  on public.team_lineups (team_id, match_id, updated_at desc);

create index if not exists teams_fifa_rank_idx
  on public.teams (fifa_rank)
  where fifa_rank is not null;

create index if not exists team_players_rating_idx
  on public.team_players (team_id, overall_rating desc)
  where overall_rating is not null;

create unique index if not exists team_players_transfermarkt_player_id_idx
  on public.team_players (transfermarkt_player_id)
  where transfermarkt_player_id is not null;

create index if not exists team_players_market_value_idx
  on public.team_players (team_id, market_value_eur desc)
  where market_value_eur is not null;

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

create index if not exists bets_open_user_match_market_idx
  on public.bets (user_id, match_id, market_key, placed_at desc)
  where status = 'placed';

create index if not exists bets_open_tournament_winner_idx
  on public.bets (selection_key, id)
  where status = 'placed' and market_key = 'tournament_winner';

create index if not exists bets_open_golden_boot_idx
  on public.bets (selection_key, id)
  where status = 'placed' and market_key = 'golden_boot';

create index if not exists sync_runs_started_at_idx
  on public.sync_runs (started_at desc);

create index if not exists audit_logs_created_at_idx
  on public.audit_logs (created_at desc);

create index if not exists audit_logs_actor_created_at_idx
  on public.audit_logs (actor_id, created_at desc);

insert into public.match_results (
  match_id,
  home_team_id,
  away_team_id,
  status,
  home_score,
  away_score,
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
  m.home_penalties,
  m.away_penalties,
  'backfill',
  'matches',
  m.updated_at,
  now()
from public.matches m
where m.status in ('FT', 'AET', 'PEN', 'FT_PEN')
  and m.home_score is not null
  and m.away_score is not null
on conflict (match_id) do update
set status = excluded.status,
    home_score = excluded.home_score,
    away_score = excluded.away_score,
    home_penalties = excluded.home_penalties,
    away_penalties = excluded.away_penalties,
    synced_at = excluded.synced_at;

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
  v_base_username text;
begin
  v_base_username := lower(regexp_replace(coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1), 'player'), '[^a-z0-9._-]', '', 'g'));
  if v_base_username = '' then
    v_base_username := 'player';
  end if;
  v_username := v_base_username;
  if exists (select 1 from public.profiles where username = v_username and id <> new.id) then
    v_username := left(v_base_username, 24) || '-' || left(replace(new.id::text, '-', ''), 8);
  end if;
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
alter table public.team_lineups enable row level security;
alter table public.matches enable row level security;
alter table public.match_results enable row level security;
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

drop policy if exists admin_write_teams on public.teams;
create policy admin_write_teams on public.teams
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists public_read_team_players on public.team_players;
create policy public_read_team_players on public.team_players for select to authenticated using (true);

drop policy if exists admin_write_team_players on public.team_players;
create policy admin_write_team_players on public.team_players
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists public_read_team_lineups on public.team_lineups;
create policy public_read_team_lineups on public.team_lineups for select to authenticated using (true);

drop policy if exists admin_write_team_lineups on public.team_lineups;
create policy admin_write_team_lineups on public.team_lineups
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists public_read_matches on public.matches;
create policy public_read_matches on public.matches for select to authenticated using (true);

drop policy if exists admin_write_matches on public.matches;
create policy admin_write_matches on public.matches
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists public_read_match_results on public.match_results;
create policy public_read_match_results on public.match_results for select to authenticated using (true);

drop policy if exists admin_write_match_results on public.match_results;
create policy admin_write_match_results on public.match_results
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

create or replace function public.team_strength_score(
  p_fifa_rank integer,
  p_squad_market_value_eur numeric,
  p_squad_value_rank integer default null
)
returns numeric
language sql
immutable
as $$
  select round((
    case
      when p_fifa_rank is null then 28
      else greatest(0, 110 - p_fifa_rank) * 0.55
    end
    + case
      when coalesce(p_squad_market_value_eur, 0) <= 0 then 0
      else ln((p_squad_market_value_eur / 1000000) + 1) * 7
    end
    + case
      when p_squad_value_rank is null then 0
      else greatest(0, 58 - p_squad_value_rank) * 0.45
    end
  )::numeric, 4);
$$;

create or replace function public.team_win_multiplier(
  p_team_strength numeric,
  p_opponent_strength numeric,
  p_floor numeric default 1.35,
  p_ceiling numeric default 4.50
)
returns numeric
language sql
immutable
as $$
  select round(greatest(p_floor, least(p_ceiling,
    1.25 + (
      1 - case
        when coalesce(p_team_strength, 0) + coalesce(p_opponent_strength, 0) <= 0 then 0.5
        else coalesce(p_team_strength, 0) / (coalesce(p_team_strength, 0) + coalesce(p_opponent_strength, 0))
      end
    ) * 3.2
  ))::numeric, 2);
$$;

create or replace function public.is_knockout_match(p_match public.matches)
returns boolean
language sql
immutable
as $$
  select coalesce(p_match.group_name, '') = ''
    and p_match.stage !~* 'group';
$$;

-- Recreate report views because CREATE OR REPLACE VIEW cannot reorder or
-- rename columns on an existing view.
drop view if exists public.admin_market_report;
drop view if exists public.admin_user_report;
drop view if exists public.admin_report;
drop view if exists public.leaderboard;

create or replace view public.leaderboard as
with ledger_equity as (
  select
    user_id,
    coalesce(sum(amount) filter (where kind in ('admin_topup', 'admin_deduction')), 0)::numeric(18,2) as initial_equity
  from public.wallet_ledger
  group by user_id
),
user_scores as (
  select
    p.id as user_id,
    p.username,
    p.display_name,
    p.wallet_balance,
    count(b.id)::integer as total_bets,
    coalesce(sum(case when b.status in ('won', 'lost', 'refunded') then b.points_delta + b.prediction_bonus else 0 end), 0)::numeric(18,2) as score,
    coalesce(sum(case when b.status in ('won', 'lost', 'refunded') then b.points_delta else 0 end), 0)::numeric(18,2) as net_points,
    coalesce(sum(case when b.status in ('won', 'lost', 'refunded') then b.prediction_bonus else 0 end), 0)::numeric(18,2) as bonus_points,
    count(b.id) filter (where b.status in ('won', 'lost', 'refunded'))::integer as settled_bets,
    count(b.id) filter (where b.status = 'won')::integer as won_bets,
    count(b.id) filter (where b.status = 'won' and b.market_key = 'correct_score')::integer as correct_score_count,
    coalesce(sum(case when b.status = 'placed' then b.stake else 0 end), 0)::numeric(18,2) as open_staked,
    coalesce(sum(case when b.status in ('won', 'lost') then b.stake else 0 end), 0)::numeric(18,2) as settled_staked,
    coalesce(sum(case when b.status in ('placed', 'won', 'lost') then b.stake else 0 end), 0)::numeric(18,2) as total_staked,
    coalesce(
      nullif(le.initial_equity, 0),
      p.wallet_balance
        + coalesce(sum(case when b.status = 'placed' then b.stake else 0 end), 0)
        - coalesce(sum(case when b.status in ('won', 'lost', 'refunded') then b.points_delta + b.prediction_bonus else 0 end), 0)
    )::numeric(18,2) as initial_equity
  from public.profiles p
  left join public.bets b on b.user_id = p.id
  left join ledger_equity le on le.user_id = p.id
  where p.role = 'player'
    and p.deleted_at is null
  group by p.id, p.username, p.display_name, p.wallet_balance, le.initial_equity
)
select
  rank() over (order by wallet_balance desc, score desc, won_bets desc) as rank,
  user_id,
  username,
  display_name,
  wallet_balance,
  wallet_balance as available_balance,
  open_staked,
  (wallet_balance + open_staked)::numeric(18,2) as total_balance,
  total_bets,
  score,
  net_points,
  bonus_points,
  score as profit_loss,
  settled_bets,
  won_bets,
  correct_score_count,
  settled_staked,
  total_staked,
  initial_equity,
  case when settled_bets = 0 then 0 else round((won_bets::numeric / settled_bets::numeric) * 100, 1) end as accuracy,
  case when initial_equity = 0 then 0 else round((score / initial_equity) * 100, 1) end as roi,
  case when initial_equity = 0 then 0 else round((score / initial_equity) * 100, 1) end as profit_loss_pct
from user_scores;

create or replace view public.admin_report as
select
  (select count(*) from public.profiles where role = 'player' and deleted_at is null)::integer as players,
  (select coalesce(sum(wallet_balance), 0)::numeric(18,2) from public.profiles where deleted_at is null) as total_wallet_balance,
  (select coalesce(sum(wallet_balance), 0)::numeric(18,2) from public.profiles where role = 'player' and deleted_at is null) as total_available_to_bet,
  (select coalesce(sum(stake), 0)::numeric(18,2) from public.bets where status = 'placed') as total_open_staked,
  (select coalesce(sum(stake), 0)::numeric(18,2) from public.bets where status in ('placed','won','lost')) as total_staked,
  (select coalesce(sum(points_delta), 0)::numeric(18,2) from public.bets where status in ('won','lost','refunded')) as settled_net_points,
  (select coalesce(sum(prediction_bonus), 0)::numeric(18,2) from public.bets where status in ('won','lost','refunded')) as prediction_bonus_points,
  (select count(*)::integer from public.bets where status = 'placed') as open_bets,
  (select count(*)::integer from public.bets where status in ('won','lost','refunded')) as settled_bets
where public.is_admin();

create or replace view public.admin_user_report as
with ledger_equity as (
  select
    user_id,
    coalesce(sum(amount) filter (where kind in ('admin_topup', 'admin_deduction')), 0)::numeric(18,2) as initial_equity
  from public.wallet_ledger
  group by user_id
),
user_scores as (
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
    coalesce(sum(case when b.status = 'placed' then b.stake else 0 end), 0)::numeric(18,2) as open_staked,
    coalesce(sum(case when b.status in ('won','lost') then b.stake else 0 end), 0)::numeric(18,2) as settled_staked,
    coalesce(sum(case when b.status in ('placed','won','lost') then b.stake else 0 end), 0)::numeric(18,2) as total_staked,
    coalesce(sum(b.points_delta) filter (where b.status in ('won','lost','refunded')), 0)::numeric(18,2) as net_points,
    coalesce(sum(b.prediction_bonus) filter (where b.status in ('won','lost','refunded')), 0)::numeric(18,2) as bonus_points,
    coalesce(sum((b.points_delta + b.prediction_bonus)) filter (where b.status in ('won','lost','refunded')), 0)::numeric(18,2) as score,
    coalesce(
      nullif(le.initial_equity, 0),
      p.wallet_balance
        + coalesce(sum(case when b.status = 'placed' then b.stake else 0 end), 0)
        - coalesce(sum((b.points_delta + b.prediction_bonus)) filter (where b.status in ('won','lost','refunded')), 0)
    )::numeric(18,2) as initial_equity
  from public.profiles p
  left join public.bets b on b.user_id = p.id
  left join ledger_equity le on le.user_id = p.id
  where p.role = 'player' and p.deleted_at is null and public.is_admin()
  group by p.id, p.username, p.display_name, p.wallet_balance, le.initial_equity
)
select
  user_id,
  username,
  display_name,
  wallet_balance,
  wallet_balance as available_balance,
  open_staked,
  (wallet_balance + open_staked)::numeric(18,2) as total_balance,
  total_bets,
  open_bets,
  settled_bets,
  won_bets,
  correct_score_count,
  settled_staked,
  total_staked,
  initial_equity,
  net_points,
  bonus_points,
  score,
  case
    when settled_bets = 0 then 0
    else round((won_bets::numeric / settled_bets::numeric) * 100, 1)
  end as accuracy,
  case
    when initial_equity = 0 then 0
    else round((score / initial_equity) * 100, 1)
  end as roi
from user_scores;

create or replace view public.admin_market_report as
select
  b.market_key,
  count(b.id)::integer as total_bets,
  count(b.id) filter (where b.status = 'placed')::integer as open_bets,
  count(b.id) filter (where b.status in ('won','lost','refunded'))::integer as settled_bets,
  count(b.id) filter (where b.status = 'won')::integer as won_bets,
  coalesce(sum(b.stake) filter (where b.status in ('placed','won','lost')), 0)::numeric(18,2) as total_staked,
  coalesce(sum(b.points_delta) filter (where b.status in ('won','lost','refunded')), 0)::numeric(18,2) as net_points,
  coalesce(sum(b.prediction_bonus) filter (where b.status in ('won','lost','refunded')), 0)::numeric(18,2) as bonus_points,
  coalesce(sum((b.points_delta + b.prediction_bonus)) filter (where b.status in ('won','lost','refunded')), 0)::numeric(18,2) as score,
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
  v_next_stake numeric(18, 2);
  v_stake_delta numeric(18, 2);
  v_balance_after numeric(18, 2);
  v_payout numeric(18, 2);
  v_selection_key text;
  v_selection_label text;
  v_selection_json jsonb;
  v_locked_multiplier numeric(8, 2);
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if p_stake <= 0 then
    raise exception 'stake must be positive';
  end if;
  v_next_stake := round(p_stake, 2);
  if v_next_stake <= 0 then
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
  if v_market.market_key = 'draw_no_bet' then
    raise exception 'draw no bet is temporarily locked';
  end if;
  if v_market.market_key = 'match_winner' and v_market.source <> 'odds-api' then
    raise exception 'match winner requires bookmaker odds';
  end if;
  if v_market.market_key = 'qualification_method' and v_market.source <> 'odds-api' then
    raise exception 'qualification method requires bookmaker odds';
  end if;
  if v_market.market_key = 'asian_handicap' and v_market.source <> 'odds-api' then
    raise exception 'handicap requires bookmaker odds';
  end if;
  if v_market.market_key = 'correct_score'
     and not (v_market.extra_json ? 'score_odds') then
    raise exception 'correct score requires model odds';
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
    if not ((v_market.extra_json->'score_odds') ? v_selection_key) then
      raise exception 'correct score odds are not available for selected score';
    end if;
  elsif p_selection_key <> v_market.selection_key then
    raise exception 'selection does not match selected market';
  else
    v_selection_key := v_market.selection_key;
    v_selection_label := v_market.selection_label;
    v_selection_json := coalesce(p_selection_json, '{}') || jsonb_build_object('line', v_market.line);
  end if;
  v_locked_multiplier := coalesce((v_market.extra_json #>> array['score_odds', v_selection_key, 'fair_odds'])::numeric, v_market.odds_multiplier);
  if v_market.market_key = 'correct_score' then
    v_selection_json := v_selection_json || jsonb_build_object('fair_odds', v_locked_multiplier);
  end if;
  if now() >= coalesce(v_market.closes_at, v_match.starts_at) then
    raise exception 'betting is locked for this match';
  end if;

  perform pg_advisory_xact_lock(
    hashtext(auth.uid()::text),
    hashtext(p_match_id::text || ':' || v_market.market_key)
  );

  select * into v_bet
  from public.bets
  where user_id = auth.uid()
    and match_id = p_match_id
    and market_key = v_market.market_key
    and status = 'placed'
  order by placed_at desc
  limit 1
  for update;

  if v_bet.id is not null then
    v_stake_delta := v_next_stake - v_bet.stake;
    if v_stake_delta > 0 and v_user.wallet_balance < v_stake_delta then
      raise exception 'insufficient point balance';
    end if;

    v_balance_after := v_user.wallet_balance - v_stake_delta;
    if v_stake_delta <> 0 then
      update public.profiles
      set wallet_balance = v_balance_after
      where id = auth.uid();

      insert into public.wallet_ledger (user_id, actor_id, amount, kind, reason, balance_after)
      values (
        auth.uid(),
        auth.uid(),
        -v_stake_delta,
        case when v_stake_delta > 0 then 'bet_stake_adjustment' else 'bet_stake_refund' end,
        'Updated ' || v_market.market_key || ': ' || v_selection_label,
        v_balance_after
      );
    end if;

    v_payout := round(v_next_stake * v_locked_multiplier, 2);
    update public.bets
    set market_id = v_market.id,
        market_key = v_market.market_key,
        selection_key = v_selection_key,
        selection_label = v_selection_label,
        stake = v_next_stake,
        locked_multiplier = v_locked_multiplier,
        potential_payout = v_payout,
        selection_json = v_selection_json
    where id = v_bet.id
    returning * into v_bet;

    insert into public.audit_logs (actor_id, action, entity_type, entity_id, details_json)
    values (
      auth.uid(),
      'bet.update_existing',
      'bet',
      v_bet.id::text,
      jsonb_build_object(
        'market_key', v_bet.market_key,
        'selection_key', v_bet.selection_key,
        'stake', v_bet.stake,
        'stake_delta', v_stake_delta,
        'locked_multiplier', v_bet.locked_multiplier,
        'match_id', v_bet.match_id
      )
    );

    return v_bet;
  end if;

  if v_user.wallet_balance < v_next_stake then
    raise exception 'insufficient point balance';
  end if;

  v_payout := round(v_next_stake * v_locked_multiplier, 2);

  update public.profiles
  set wallet_balance = wallet_balance - v_next_stake
  where id = auth.uid()
  returning wallet_balance into v_balance_after;

  insert into public.bets (
    user_id, match_id, market_id, market_key, selection_key, selection_label,
    stake, locked_multiplier, potential_payout, selection_json
  )
  values (
    auth.uid(), p_match_id, p_market_id, v_market.market_key, v_selection_key, v_selection_label,
    v_next_stake, v_locked_multiplier, v_payout,
    v_selection_json
  )
  returning * into v_bet;

  insert into public.wallet_ledger (user_id, actor_id, amount, kind, reason, balance_after)
  values (
    auth.uid(),
    auth.uid(),
    -v_next_stake,
    'bet_stake',
    'Placed ' || v_market.market_key || ': ' || v_selection_label,
    v_balance_after
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

create or replace function public.update_bet(
  p_bet_id bigint,
  p_market_id bigint,
  p_selection_key text,
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
  v_bet public.bets%rowtype;
  v_match public.matches%rowtype;
  v_market public.match_markets%rowtype;
  v_updated public.bets%rowtype;
  v_next_stake numeric(18, 2);
  v_stake_delta numeric(18, 2);
  v_balance_after numeric(18, 2);
  v_selection_key text;
  v_selection_label text;
  v_selection_json jsonb;
  v_payout numeric(18, 2);
  v_locked_multiplier numeric(8, 2);
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if p_stake <= 0 then
    raise exception 'stake must be positive';
  end if;

  select * into v_user
  from public.profiles
  where id = auth.uid()
  for update;

  if not found or v_user.is_active is false then
    raise exception 'user is inactive';
  end if;

  select * into v_bet
  from public.bets
  where id = p_bet_id
  for update;

  if not found then
    raise exception 'bet not found';
  end if;
  if v_bet.user_id <> auth.uid() then
    raise exception 'cannot update another user''s bet';
  end if;
  if v_bet.status <> 'placed' then
    raise exception 'only placed bets can be updated';
  end if;
  if v_bet.match_id is null then
    raise exception 'outright bets cannot be updated from prediction stats';
  end if;

  select * into v_match
  from public.matches
  where id = v_bet.match_id;

  if not found then
    raise exception 'match not found';
  end if;
  if v_match.status not in ('SCHEDULED', 'NS', 'TBD') then
    raise exception 'match is not open for pre-match betting';
  end if;

  select * into v_market
  from public.match_markets
  where id = coalesce(p_market_id, v_bet.market_id)
    and match_id = v_bet.match_id
    and is_open = true;

  if not found then
    raise exception 'market is not open';
  end if;
  if v_market.market_key = 'draw_no_bet' then
    raise exception 'draw no bet is temporarily locked';
  end if;
  if v_market.market_key = 'match_winner' and v_market.source <> 'odds-api' then
    raise exception 'match winner requires bookmaker odds';
  end if;
  if v_market.market_key = 'qualification_method' and v_market.source <> 'odds-api' then
    raise exception 'qualification method requires bookmaker odds';
  end if;
  if v_market.market_key = 'asian_handicap' and v_market.source <> 'odds-api' then
    raise exception 'handicap requires bookmaker odds';
  end if;
  if v_market.market_key = 'correct_score'
     and not (v_market.extra_json ? 'score_odds') then
    raise exception 'correct score requires model odds';
  end if;
  if now() >= coalesce(v_market.closes_at, v_match.starts_at) then
    raise exception 'betting is locked for this match';
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
    if not ((v_market.extra_json->'score_odds') ? v_selection_key) then
      raise exception 'correct score odds are not available for selected score';
    end if;
  elsif p_selection_key <> v_market.selection_key then
    raise exception 'selection does not match selected market';
  else
    v_selection_key := v_market.selection_key;
    v_selection_label := v_market.selection_label;
    v_selection_json := coalesce(p_selection_json, '{}') || jsonb_build_object('line', v_market.line);
  end if;
  v_locked_multiplier := coalesce((v_market.extra_json #>> array['score_odds', v_selection_key, 'fair_odds'])::numeric, v_market.odds_multiplier);
  if v_market.market_key = 'correct_score' then
    v_selection_json := v_selection_json || jsonb_build_object('fair_odds', v_locked_multiplier);
  end if;

  v_next_stake := round(p_stake, 2);
  v_stake_delta := v_next_stake - v_bet.stake;
  if v_stake_delta > 0 and v_user.wallet_balance < v_stake_delta then
    raise exception 'insufficient point balance';
  end if;

  v_balance_after := v_user.wallet_balance - v_stake_delta;
  update public.profiles
  set wallet_balance = v_balance_after
  where id = auth.uid();

  if v_stake_delta <> 0 then
    insert into public.wallet_ledger (user_id, actor_id, amount, kind, reason, balance_after)
    values (
      auth.uid(),
      auth.uid(),
      -v_stake_delta,
      case when v_stake_delta > 0 then 'bet_stake_adjustment' else 'bet_stake_refund' end,
      'Updated ' || v_market.market_key || ': ' || v_selection_label,
      v_balance_after
    );
  end if;

  v_payout := round(v_next_stake * v_locked_multiplier, 2);
  update public.bets
  set market_id = v_market.id,
      market_key = v_market.market_key,
      selection_key = v_selection_key,
      selection_label = v_selection_label,
      stake = v_next_stake,
      locked_multiplier = v_locked_multiplier,
      potential_payout = v_payout,
      selection_json = v_selection_json
  where id = p_bet_id
  returning * into v_updated;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, details_json)
  values (
    auth.uid(),
    'bet.update',
    'bet',
    p_bet_id::text,
    jsonb_build_object(
      'match_id', v_updated.match_id,
      'market_key', v_updated.market_key,
      'selection_key', v_updated.selection_key,
      'stake_before', v_bet.stake,
      'stake_after', v_updated.stake,
      'stake_delta', v_stake_delta,
      'locked_multiplier', v_updated.locked_multiplier
    )
  );

  return v_updated;
end;
$$;

create or replace function public.cancel_bet(
  p_bet_id bigint,
  p_reason text default 'User cancelled bet'
)
returns public.bets
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user public.profiles%rowtype;
  v_bet public.bets%rowtype;
  v_match public.matches%rowtype;
  v_market public.match_markets%rowtype;
  v_outright public.outright_markets%rowtype;
  v_balance numeric(18, 2);
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select * into v_user
  from public.profiles
  where id = auth.uid()
  for update;

  if not found or v_user.is_active is false then
    raise exception 'user is inactive';
  end if;

  select * into v_bet
  from public.bets
  where id = p_bet_id
  for update;

  if not found then
    raise exception 'bet not found';
  end if;
  if v_bet.user_id <> auth.uid() then
    raise exception 'cannot cancel another user''s bet';
  end if;
  if v_bet.status <> 'placed' then
    raise exception 'only placed bets can be cancelled';
  end if;

  if v_bet.match_id is not null then
    select * into v_match
    from public.matches
    where id = v_bet.match_id;

    if not found then
      raise exception 'match not found';
    end if;
    if v_match.status not in ('SCHEDULED', 'NS', 'TBD') then
      raise exception 'match is not open for bet cancellation';
    end if;

    select * into v_market
    from public.match_markets
    where id = v_bet.market_id
      and match_id = v_bet.match_id;

    if not found then
      select * into v_market
      from public.match_markets
      where match_id = v_bet.match_id
        and market_key = v_bet.market_key
      order by closes_at asc
      limit 1;
    end if;

    if not found or v_market.is_open is false or now() >= coalesce(v_market.closes_at, v_match.starts_at) then
      raise exception 'bet cancellation is locked for this match';
    end if;
  else
    select * into v_outright
    from public.outright_markets
    where id = (v_bet.selection_json->>'outright_market_id')::bigint;

    if not found then
      raise exception 'outright market not found';
    end if;
    if v_outright.is_open is false or now() >= v_outright.closes_at then
      raise exception 'outright bet cancellation is locked';
    end if;
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
  where id = auth.uid()
  returning wallet_balance into v_balance;

  insert into public.wallet_ledger (user_id, actor_id, amount, kind, reason, balance_after)
  values (auth.uid(), auth.uid(), v_bet.stake, 'bet_refund', p_reason, v_balance);

  insert into public.settlements (bet_id, result, status, payout, reason)
  values (v_bet.id, 'user_cancelled', 'refunded', v_bet.stake, p_reason);

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, details_json)
  values (
    auth.uid(),
    'bet.cancel',
    'bet',
    p_bet_id::text,
    jsonb_build_object(
      'match_id', v_bet.match_id,
      'market_key', v_bet.market_key,
      'selection_key', v_bet.selection_key,
      'stake', v_bet.stake,
      'reason', p_reason
    )
  );

  return v_bet;
end;
$$;

create or replace function public.ensure_golden_boot_markets()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer := 0;
begin
  if coalesce(auth.role(), '') <> 'service_role' and not public.is_admin() then
    raise exception 'admin role required';
  end if;

  update public.outright_markets
  set is_open = false
  where market_key = 'golden_boot'
    and source <> 'odds-api';


  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

create or replace function public.admin_import_transfermarkt_values(
  p_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows jsonb := '[]'::jsonb;
  v_row jsonb;
  v_team_id bigint;
  v_player_id bigint;
  v_team_code text;
  v_team_tm_id text;
  v_team_url text;
  v_player_tm_id text;
  v_player_url text;
  v_player_name text;
  v_position text;
  v_club text;
  v_team_value_label text;
  v_player_value_label text;
  v_source text;
  v_team_value_text text;
  v_player_value_text text;
  v_rank_text text;
  v_team_value numeric(14, 2);
  v_player_value numeric(14, 2);
  v_rank integer;
  v_updated_at timestamptz := now();
  v_team_count integer := 0;
  v_player_count integer := 0;
  v_golden_boot_count integer := 0;
  v_error_count integer := 0;
  v_errors text[] := '{}';
begin
  if not public.is_admin() then
    raise exception 'admin role required';
  end if;

  if p_payload is null then
    raise exception 'payload is required';
  end if;

  if jsonb_typeof(p_payload) = 'array' then
    v_rows := p_payload;
  elsif jsonb_typeof(p_payload) = 'object' then
    if jsonb_typeof(p_payload->'rows') = 'array' then
      v_rows := v_rows || (p_payload->'rows');
    end if;
    if jsonb_typeof(p_payload->'teams') = 'array' then
      v_rows := v_rows || (p_payload->'teams');
    end if;
    if jsonb_typeof(p_payload->'players') = 'array' then
      v_rows := v_rows || (p_payload->'players');
    end if;
    if jsonb_array_length(v_rows) = 0 then
      v_rows := jsonb_build_array(p_payload);
    end if;
  else
    raise exception 'payload must be a JSON object or array';
  end if;

  for v_row in select value from jsonb_array_elements(v_rows)
  loop
    v_team_code := upper(coalesce(
      nullif(v_row->>'team_code', ''),
      nullif(v_row->>'teamCode', ''),
      nullif(v_row->>'code', '')
    ));
    if v_team_code is null then
      v_error_count := v_error_count + 1;
      v_errors := array_append(v_errors, 'Missing team_code');
      continue;
    end if;

    select id into v_team_id
    from public.teams
    where code = v_team_code;

    if v_team_id is null then
      v_error_count := v_error_count + 1;
      v_errors := array_append(v_errors, 'Unknown team_code: ' || v_team_code);
      continue;
    end if;

    v_team_tm_id := coalesce(
      nullif(v_row->>'transfermarkt_team_id', ''),
      nullif(v_row->>'transfermarktTeamId', ''),
      nullif(v_row->>'team_transfermarkt_id', ''),
      nullif(v_row->>'teamTransfermarktId', '')
    );
    v_team_url := coalesce(
      nullif(v_row->>'team_transfermarkt_url', ''),
      nullif(v_row->>'teamTransfermarktUrl', ''),
      nullif(v_row->>'team_url', ''),
      nullif(v_row->>'teamUrl', '')
    );
    v_team_value_label := coalesce(
      nullif(v_row->>'squad_market_value_label', ''),
      nullif(v_row->>'squadMarketValueLabel', ''),
      nullif(v_row->>'team_market_value_label', ''),
      nullif(v_row->>'teamMarketValueLabel', '')
    );
    v_team_value_text := coalesce(
      nullif(v_row->>'squad_market_value_eur', ''),
      nullif(v_row->>'squadMarketValueEur', ''),
      nullif(v_row->>'team_market_value_eur', ''),
      nullif(v_row->>'teamMarketValueEur', '')
    );
    v_rank_text := coalesce(
      nullif(v_row->>'squad_value_rank', ''),
      nullif(v_row->>'squadValueRank', ''),
      nullif(v_row->>'team_rank', ''),
      nullif(v_row->>'teamRank', '')
    );
    v_source := coalesce(
      nullif(v_row->>'source', ''),
      nullif(v_row->>'source_url', ''),
      nullif(v_row->>'sourceUrl', ''),
      'transfermarkt-import'
    );
    v_team_value := case when v_team_value_text ~ '^[0-9]+(\.[0-9]+)?$' then v_team_value_text::numeric(14, 2) else null end;
    v_rank := case when v_rank_text ~ '^[0-9]+$' then v_rank_text::integer else null end;

    if v_team_tm_id is not null or v_team_url is not null or v_team_value is not null or v_team_value_label is not null or v_rank is not null then
      update public.teams
      set transfermarkt_team_id = coalesce(v_team_tm_id, transfermarkt_team_id),
          transfermarkt_url = coalesce(v_team_url, transfermarkt_url),
          squad_market_value_eur = coalesce(v_team_value, squad_market_value_eur),
          squad_market_value_label = coalesce(v_team_value_label, squad_market_value_label),
          squad_value_rank = coalesce(v_rank, squad_value_rank),
          squad_value_updated_at = v_updated_at,
          squad_value_source = v_source
      where id = v_team_id;
      v_team_count := v_team_count + 1;
    end if;

    v_player_tm_id := coalesce(
      nullif(v_row->>'transfermarkt_player_id', ''),
      nullif(v_row->>'transfermarktPlayerId', ''),
      nullif(v_row->>'player_transfermarkt_id', ''),
      nullif(v_row->>'playerTransfermarktId', '')
    );
    v_player_name := coalesce(
      nullif(v_row->>'player_name', ''),
      nullif(v_row->>'playerName', '')
    );
    if v_player_name is null and v_player_tm_id is null then
      continue;
    end if;
    if v_player_name is null then
      v_error_count := v_error_count + 1;
      v_errors := array_append(v_errors, 'Missing player_name for team ' || v_team_code);
      continue;
    end if;

    v_position := coalesce(nullif(v_row->>'position', ''), nullif(v_row->>'player_position', ''));
    v_club := coalesce(nullif(v_row->>'club', ''), nullif(v_row->>'player_club', ''));
    v_player_url := coalesce(
      nullif(v_row->>'player_url', ''),
      nullif(v_row->>'playerUrl', ''),
      nullif(v_row->>'transfermarkt_url', ''),
      nullif(v_row->>'transfermarktUrl', '')
    );
    v_player_value_label := coalesce(
      nullif(v_row->>'market_value_label', ''),
      nullif(v_row->>'marketValueLabel', ''),
      nullif(v_row->>'player_market_value_label', ''),
      nullif(v_row->>'playerMarketValueLabel', '')
    );
    v_player_value_text := coalesce(
      nullif(v_row->>'market_value_eur', ''),
      nullif(v_row->>'marketValueEur', ''),
      nullif(v_row->>'player_market_value_eur', ''),
      nullif(v_row->>'playerMarketValueEur', '')
    );
    v_player_value := case when v_player_value_text ~ '^[0-9]+(\.[0-9]+)?$' then v_player_value_text::numeric(14, 2) else null end;

    v_player_id := null;
    if v_player_tm_id is not null then
      select id into v_player_id
      from public.team_players
      where transfermarkt_player_id = v_player_tm_id;
    end if;
    if v_player_id is null then
      select id into v_player_id
      from public.team_players
      where team_id = v_team_id
        and lower(name) = lower(v_player_name)
      order by updated_at desc
      limit 1;
    end if;

    if v_player_id is null then
      insert into public.team_players (
        team_id, provider_id, name, position, club, transfermarkt_player_id,
        transfermarkt_url, market_value_eur, market_value_label,
        market_value_updated_at, market_value_source, source, updated_at
      )
      values (
        v_team_id,
        case when v_player_tm_id is not null then 'tm-' || v_player_tm_id else null end,
        v_player_name,
        v_position,
        v_club,
        v_player_tm_id,
        v_player_url,
        v_player_value,
        v_player_value_label,
        v_updated_at,
        v_source,
        'transfermarkt_import',
        v_updated_at
      );
    else
      update public.team_players
      set name = v_player_name,
          position = coalesce(v_position, position),
          club = coalesce(v_club, club),
          transfermarkt_player_id = coalesce(v_player_tm_id, transfermarkt_player_id),
          transfermarkt_url = coalesce(v_player_url, transfermarkt_url),
          market_value_eur = coalesce(v_player_value, market_value_eur),
          market_value_label = coalesce(v_player_value_label, market_value_label),
          market_value_updated_at = v_updated_at,
          market_value_source = v_source,
          updated_at = v_updated_at
      where id = v_player_id;
    end if;
    v_player_count := v_player_count + 1;
  end loop;

  if v_player_count > 0 then
    v_golden_boot_count := public.ensure_golden_boot_markets();
  end if;

  insert into public.audit_logs (actor_id, action, entity_type, details_json)
  values (
    auth.uid(),
    'transfermarkt.import',
    'transfermarkt',
    jsonb_build_object(
      'teams', v_team_count,
      'players', v_player_count,
      'golden_boot_markets', v_golden_boot_count,
      'errors', v_error_count
    )
  );

  return jsonb_build_object(
    'status', case when v_error_count > 0 then 'partial' else 'success' end,
    'teams', v_team_count,
    'players', v_player_count,
    'golden_boot_markets', v_golden_boot_count,
    'errors', v_error_count,
    'messages', to_jsonb(v_errors)
  );
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

create or replace function public.admin_soft_delete_user(
  p_user_id uuid,
  p_reason text default 'Admin deleted account'
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
  if p_user_id = auth.uid() then
    raise exception 'cannot delete your own account';
  end if;

  select * into v_profile
  from public.profiles
  where id = p_user_id
  for update;

  if not found then
    raise exception 'user not found';
  end if;
  if v_profile.deleted_at is not null then
    return v_profile;
  end if;

  update public.profiles
  set is_active = false,
      deleted_at = now(),
      deleted_by = auth.uid(),
      deleted_reason = coalesce(nullif(p_reason, ''), 'Admin deleted account')
  where id = p_user_id
  returning * into v_profile;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, details_json)
  values (
    auth.uid(),
    'admin.user_delete',
    'profile',
    p_user_id::text,
    jsonb_build_object(
      'username', v_profile.username,
      'display_name', v_profile.display_name,
      'reason', v_profile.deleted_reason
    )
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
  v_balance numeric(18, 2);
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
  v_payout numeric(18, 2);
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
  if v_market.market_key in ('tournament_winner', 'golden_boot') and v_market.source <> 'odds-api' then
    raise exception 'outright market requires bookmaker odds';
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
  v_payout numeric(18, 2);
  v_delta numeric(18, 2);
  v_bonus numeric(18, 2);
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
      v_bonus := 40;
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

create or replace function public.settle_golden_boot(p_top_scorer_key text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bet public.bets%rowtype;
  v_won boolean;
  v_payout numeric(18, 2);
  v_delta numeric(18, 2);
  v_bonus numeric(18, 2);
  v_count integer := 0;
begin
  if not public.is_admin() then
    raise exception 'admin role required';
  end if;

  update public.outright_markets
  set is_open = false
  where market_key = 'golden_boot';

  for v_bet in
    select * from public.bets
    where market_key = 'golden_boot' and status = 'placed'
  loop
    v_won := v_bet.selection_key = p_top_scorer_key;
    if v_won then
      v_payout := round(v_bet.stake * v_bet.locked_multiplier, 2);
      v_delta := v_payout - v_bet.stake;
      v_bonus := 50;
      update public.bets set status = 'won', points_delta = v_delta, prediction_bonus = v_bonus, settled_at = now() where id = v_bet.id;
      update public.profiles set wallet_balance = wallet_balance + v_payout where id = v_bet.user_id;
      insert into public.wallet_ledger (user_id, actor_id, amount, kind, reason, balance_after)
      select
        v_bet.user_id,
        auth.uid(),
        v_payout,
        'bet_payout',
        'Golden boot payout: ' || v_bet.selection_label,
        wallet_balance
      from public.profiles
      where id = v_bet.user_id;
      insert into public.settlements (bet_id, result, status, payout, reason)
      values (v_bet.id, p_top_scorer_key, 'won', v_payout, 'Golden boot matched; leaderboard bonus applied.');
    else
      v_payout := 0;
      v_delta := -v_bet.stake;
      v_bonus := 0;
      update public.bets set status = 'lost', points_delta = v_delta, prediction_bonus = v_bonus, settled_at = now() where id = v_bet.id;
      insert into public.settlements (bet_id, result, status, payout, reason)
      values (v_bet.id, p_top_scorer_key, 'lost', v_payout, 'Golden boot did not match.');
    end if;
    v_count := v_count + 1;
  end loop;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, details_json)
  values (
    auth.uid(),
    'settlement.golden_boot',
    'golden_boot',
    p_top_scorer_key,
    jsonb_build_object('top_scorer_key', p_top_scorer_key, 'settled_bets', v_count)
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
  v_home public.teams%rowtype;
  v_away public.teams%rowtype;
  v_home_strength numeric;
  v_away_strength numeric;
  v_home_win_odds numeric;
  v_away_win_odds numeric;
  v_draw_odds numeric;
  v_home_dnb_odds numeric;
  v_away_dnb_odds numeric;
  v_count integer := 0;
begin
  if not (public.is_admin() or auth.role() = 'service_role') then
    raise exception 'admin role required';
  end if;

  select * into v_match from public.matches where id = p_match_id;
  if not found then
    raise exception 'match not found';
  end if;

  select * into v_home from public.teams where id = v_match.home_team_id;
  select * into v_away from public.teams where id = v_match.away_team_id;
  v_home_strength := public.team_strength_score(v_home.fifa_rank, v_home.squad_market_value_eur, v_home.squad_value_rank);
  v_away_strength := public.team_strength_score(v_away.fifa_rank, v_away.squad_market_value_eur, v_away.squad_value_rank);
  v_home_win_odds := public.team_win_multiplier(v_home_strength, v_away_strength, 1.35, 4.50);
  v_away_win_odds := public.team_win_multiplier(v_away_strength, v_home_strength, 1.35, 4.50);
  v_draw_odds := round(greatest(2.70, least(3.80, 2.95 + abs(v_home_strength - v_away_strength) / 45))::numeric, 2);
  v_home_dnb_odds := public.team_win_multiplier(v_home_strength, v_away_strength, 1.15, 3.20);
  v_away_dnb_odds := public.team_win_multiplier(v_away_strength, v_home_strength, 1.15, 3.20);

  insert into public.match_markets (match_id, market_key, label, selection_key, selection_label, line, odds_multiplier, source, closes_at)
  values
    (v_match.id, 'correct_score', 'Dự đoán tỷ số', 'exact', 'Tỷ số chính xác', null, 6.00, 'internal', v_match.starts_at),
    (v_match.id, 'match_result', 'Kết quả 1X2', 'home', coalesce(v_home.name, 'Đội nhà') || ' thắng', null, v_home_win_odds, 'internal', v_match.starts_at),
    (v_match.id, 'match_result', 'Kết quả 1X2', 'draw', 'Hòa', null, v_draw_odds, 'internal', v_match.starts_at),
    (v_match.id, 'match_result', 'Kết quả 1X2', 'away', coalesce(v_away.name, 'Đội khách') || ' thắng', null, v_away_win_odds, 'internal', v_match.starts_at),
    (v_match.id, 'draw_no_bet', 'Draw no bet', 'home', coalesce(v_home.name, 'Đội nhà') || ' DNB', null, v_home_dnb_odds, 'internal', v_match.starts_at),
    (v_match.id, 'draw_no_bet', 'Draw no bet', 'away', coalesce(v_away.name, 'Đội khách') || ' DNB', null, v_away_dnb_odds, 'internal', v_match.starts_at),
    (v_match.id, 'total_goals', 'Tổng bàn thắng 2.5', 'over', 'Tài 2.5', 2.5, 1.92, 'internal', v_match.starts_at),
    (v_match.id, 'total_goals', 'Tổng bàn thắng 2.5', 'under', 'Xỉu 2.5', 2.5, 1.88, 'internal', v_match.starts_at),
    (v_match.id, 'btts', 'Hai đội cùng ghi bàn', 'yes', 'Có', null, 1.95, 'internal', v_match.starts_at),
    (v_match.id, 'btts', 'Hai đội cùng ghi bàn', 'no', 'Không', null, 1.82, 'internal', v_match.starts_at),
    (v_match.id, 'corners_total', 'Tổng phạt góc 8.5', 'over', 'Tài góc 8.5', 8.5, 1.90, 'internal', v_match.starts_at),
    (v_match.id, 'corners_total', 'Tổng phạt góc 8.5', 'under', 'Xỉu góc 8.5', 8.5, 1.90, 'internal', v_match.starts_at),
    (v_match.id, 'cards_total', 'Tổng thẻ 3.5', 'over', 'Tài thẻ 3.5', 3.5, 1.90, 'internal', v_match.starts_at),
    (v_match.id, 'cards_total', 'Tổng thẻ 3.5', 'under', 'Xỉu thẻ 3.5', 3.5, 1.90, 'internal', v_match.starts_at)
  on conflict (match_id, market_key, selection_key, line_key) do update
  set label = excluded.label,
      selection_label = excluded.selection_label,
      odds_multiplier = excluded.odds_multiplier,
      closes_at = excluded.closes_at
  where public.match_markets.source = 'internal';

  insert into public.match_markets (match_id, market_key, label, selection_key, selection_label, line, odds_multiplier, source, closes_at)
  values
    (v_match.id, 'asian_handicap', 'Keo Chau A -0.5', 'home', coalesce(v_home.name, 'Home') || ' -0.5', -0.5, greatest(1.28, least(3.50, v_home_win_odds)), 'internal', v_match.starts_at),
    (v_match.id, 'asian_handicap', 'Keo Chau A -0.5', 'away', coalesce(v_away.name, 'Away') || ' +0.5', -0.5, greatest(1.35, least(2.80, round((v_home_win_odds / greatest(0.1, v_home_win_odds - 1)) * 0.97, 2))), 'internal', v_match.starts_at),
    (v_match.id, 'asian_handicap', 'Keo Chau A +0.5', 'home', coalesce(v_home.name, 'Home') || ' +0.5', 0.5, greatest(1.35, least(2.80, round((v_away_win_odds / greatest(0.1, v_away_win_odds - 1)) * 0.97, 2))), 'internal', v_match.starts_at),
    (v_match.id, 'asian_handicap', 'Keo Chau A +0.5', 'away', coalesce(v_away.name, 'Away') || ' -0.5', 0.5, greatest(1.28, least(3.50, v_away_win_odds)), 'internal', v_match.starts_at)
  on conflict (match_id, market_key, selection_key, line_key) do update
  set label = excluded.label,
      selection_label = excluded.selection_label,
      odds_multiplier = excluded.odds_multiplier,
      closes_at = excluded.closes_at
  where public.match_markets.source = 'internal';

  update public.match_markets
  set is_open = false
  where match_id = v_match.id
    and (
      market_key = 'draw_no_bet'
      or (market_key = 'asian_handicap' and source <> 'odds-api')
      or (market_key = 'correct_score' and source = 'internal')
      or (public.is_knockout_match(v_match) and market_key = 'match_result' and source <> 'odds-api')
    );

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- Round of 32 group-stage allocation helpers.
-- The third-place path table mirrors the 495 combinations from FIFA World Cup 26 Regulations Annex C.
create table if not exists public.bracket_third_place_paths (
  qualified_groups text primary key check (qualified_groups ~ '^[A-L]{8}$'),
  winner_a_opponent_group text not null check (winner_a_opponent_group ~ '^[A-L]$'),
  winner_b_opponent_group text not null check (winner_b_opponent_group ~ '^[A-L]$'),
  winner_d_opponent_group text not null check (winner_d_opponent_group ~ '^[A-L]$'),
  winner_e_opponent_group text not null check (winner_e_opponent_group ~ '^[A-L]$'),
  winner_g_opponent_group text not null check (winner_g_opponent_group ~ '^[A-L]$'),
  winner_i_opponent_group text not null check (winner_i_opponent_group ~ '^[A-L]$'),
  winner_k_opponent_group text not null check (winner_k_opponent_group ~ '^[A-L]$'),
  winner_l_opponent_group text not null check (winner_l_opponent_group ~ '^[A-L]$')
);

alter table public.bracket_third_place_paths enable row level security;

drop policy if exists public_read_bracket_third_place_paths on public.bracket_third_place_paths;
create policy public_read_bracket_third_place_paths on public.bracket_third_place_paths
  for select to authenticated using (true);

drop policy if exists admin_write_bracket_third_place_paths on public.bracket_third_place_paths;
create policy admin_write_bracket_third_place_paths on public.bracket_third_place_paths
  for all using (public.is_admin()) with check (public.is_admin());

insert into public.bracket_third_place_paths (
  qualified_groups,
  winner_a_opponent_group,
  winner_b_opponent_group,
  winner_d_opponent_group,
  winner_e_opponent_group,
  winner_g_opponent_group,
  winner_i_opponent_group,
  winner_k_opponent_group,
  winner_l_opponent_group
)
values
  ('EFGHIJKL', 'E', 'J', 'I', 'F', 'H', 'G', 'L', 'K'),
  ('DFGHIJKL', 'H', 'G', 'I', 'D', 'J', 'F', 'L', 'K'),
  ('DEGHIJKL', 'E', 'J', 'I', 'D', 'H', 'G', 'L', 'K'),
  ('DEFHIJKL', 'E', 'J', 'I', 'D', 'H', 'F', 'L', 'K'),
  ('DEFGIJKL', 'E', 'G', 'I', 'D', 'J', 'F', 'L', 'K'),
  ('DEFGHJKL', 'E', 'G', 'J', 'D', 'H', 'F', 'L', 'K'),
  ('DEFGHIKL', 'E', 'G', 'I', 'D', 'H', 'F', 'L', 'K'),
  ('DEFGHIJL', 'E', 'G', 'J', 'D', 'H', 'F', 'L', 'I'),
  ('DEFGHIJK', 'E', 'G', 'J', 'D', 'H', 'F', 'I', 'K'),
  ('CFGHIJKL', 'H', 'G', 'I', 'C', 'J', 'F', 'L', 'K'),
  ('CEGHIJKL', 'E', 'J', 'I', 'C', 'H', 'G', 'L', 'K'),
  ('CEFHIJKL', 'E', 'J', 'I', 'C', 'H', 'F', 'L', 'K'),
  ('CEFGIJKL', 'E', 'G', 'I', 'C', 'J', 'F', 'L', 'K'),
  ('CEFGHJKL', 'E', 'G', 'J', 'C', 'H', 'F', 'L', 'K'),
  ('CEFGHIKL', 'E', 'G', 'I', 'C', 'H', 'F', 'L', 'K'),
  ('CEFGHIJL', 'E', 'G', 'J', 'C', 'H', 'F', 'L', 'I'),
  ('CEFGHIJK', 'E', 'G', 'J', 'C', 'H', 'F', 'I', 'K'),
  ('CDGHIJKL', 'H', 'G', 'I', 'C', 'J', 'D', 'L', 'K'),
  ('CDFHIJKL', 'C', 'J', 'I', 'D', 'H', 'F', 'L', 'K'),
  ('CDFGIJKL', 'C', 'G', 'I', 'D', 'J', 'F', 'L', 'K'),
  ('CDFGHJKL', 'C', 'G', 'J', 'D', 'H', 'F', 'L', 'K'),
  ('CDFGHIKL', 'C', 'G', 'I', 'D', 'H', 'F', 'L', 'K'),
  ('CDFGHIJL', 'C', 'G', 'J', 'D', 'H', 'F', 'L', 'I'),
  ('CDFGHIJK', 'C', 'G', 'J', 'D', 'H', 'F', 'I', 'K'),
  ('CDEHIJKL', 'E', 'J', 'I', 'C', 'H', 'D', 'L', 'K'),
  ('CDEGIJKL', 'E', 'G', 'I', 'C', 'J', 'D', 'L', 'K'),
  ('CDEGHJKL', 'E', 'G', 'J', 'C', 'H', 'D', 'L', 'K'),
  ('CDEGHIKL', 'E', 'G', 'I', 'C', 'H', 'D', 'L', 'K'),
  ('CDEGHIJL', 'E', 'G', 'J', 'C', 'H', 'D', 'L', 'I'),
  ('CDEGHIJK', 'E', 'G', 'J', 'C', 'H', 'D', 'I', 'K'),
  ('CDEFIJKL', 'C', 'J', 'E', 'D', 'I', 'F', 'L', 'K'),
  ('CDEFHJKL', 'C', 'J', 'E', 'D', 'H', 'F', 'L', 'K'),
  ('CDEFHIKL', 'C', 'E', 'I', 'D', 'H', 'F', 'L', 'K'),
  ('CDEFHIJL', 'C', 'J', 'E', 'D', 'H', 'F', 'L', 'I'),
  ('CDEFHIJK', 'C', 'J', 'E', 'D', 'H', 'F', 'I', 'K'),
  ('CDEFGJKL', 'C', 'G', 'E', 'D', 'J', 'F', 'L', 'K'),
  ('CDEFGIKL', 'C', 'G', 'E', 'D', 'I', 'F', 'L', 'K'),
  ('CDEFGIJL', 'C', 'G', 'E', 'D', 'J', 'F', 'L', 'I'),
  ('CDEFGIJK', 'C', 'G', 'E', 'D', 'J', 'F', 'I', 'K'),
  ('CDEFGHKL', 'C', 'G', 'E', 'D', 'H', 'F', 'L', 'K'),
  ('CDEFGHJL', 'C', 'G', 'J', 'D', 'H', 'F', 'L', 'E'),
  ('CDEFGHJK', 'C', 'G', 'J', 'D', 'H', 'F', 'E', 'K'),
  ('CDEFGHIL', 'C', 'G', 'E', 'D', 'H', 'F', 'L', 'I'),
  ('CDEFGHIK', 'C', 'G', 'E', 'D', 'H', 'F', 'I', 'K'),
  ('CDEFGHIJ', 'C', 'G', 'J', 'D', 'H', 'F', 'E', 'I'),
  ('BFGHIJKL', 'H', 'J', 'B', 'F', 'I', 'G', 'L', 'K'),
  ('BEGHIJKL', 'E', 'J', 'I', 'B', 'H', 'G', 'L', 'K'),
  ('BEFHIJKL', 'E', 'J', 'B', 'F', 'I', 'H', 'L', 'K'),
  ('BEFGIJKL', 'E', 'J', 'B', 'F', 'I', 'G', 'L', 'K'),
  ('BEFGHJKL', 'E', 'J', 'B', 'F', 'H', 'G', 'L', 'K'),
  ('BEFGHIKL', 'E', 'G', 'B', 'F', 'I', 'H', 'L', 'K'),
  ('BEFGHIJL', 'E', 'J', 'B', 'F', 'H', 'G', 'L', 'I'),
  ('BEFGHIJK', 'E', 'J', 'B', 'F', 'H', 'G', 'I', 'K'),
  ('BDGHIJKL', 'H', 'J', 'B', 'D', 'I', 'G', 'L', 'K'),
  ('BDFHIJKL', 'H', 'J', 'B', 'D', 'I', 'F', 'L', 'K'),
  ('BDFGIJKL', 'I', 'G', 'B', 'D', 'J', 'F', 'L', 'K'),
  ('BDFGHJKL', 'H', 'G', 'B', 'D', 'J', 'F', 'L', 'K'),
  ('BDFGHIKL', 'H', 'G', 'B', 'D', 'I', 'F', 'L', 'K'),
  ('BDFGHIJL', 'H', 'G', 'B', 'D', 'J', 'F', 'L', 'I'),
  ('BDFGHIJK', 'H', 'G', 'B', 'D', 'J', 'F', 'I', 'K'),
  ('BDEHIJKL', 'E', 'J', 'B', 'D', 'I', 'H', 'L', 'K'),
  ('BDEGIJKL', 'E', 'J', 'B', 'D', 'I', 'G', 'L', 'K'),
  ('BDEGHJKL', 'E', 'J', 'B', 'D', 'H', 'G', 'L', 'K'),
  ('BDEGHIKL', 'E', 'G', 'B', 'D', 'I', 'H', 'L', 'K'),
  ('BDEGHIJL', 'E', 'J', 'B', 'D', 'H', 'G', 'L', 'I'),
  ('BDEGHIJK', 'E', 'J', 'B', 'D', 'H', 'G', 'I', 'K'),
  ('BDEFIJKL', 'E', 'J', 'B', 'D', 'I', 'F', 'L', 'K'),
  ('BDEFHJKL', 'E', 'J', 'B', 'D', 'H', 'F', 'L', 'K'),
  ('BDEFHIKL', 'E', 'I', 'B', 'D', 'H', 'F', 'L', 'K'),
  ('BDEFHIJL', 'E', 'J', 'B', 'D', 'H', 'F', 'L', 'I'),
  ('BDEFHIJK', 'E', 'J', 'B', 'D', 'H', 'F', 'I', 'K'),
  ('BDEFGJKL', 'E', 'G', 'B', 'D', 'J', 'F', 'L', 'K'),
  ('BDEFGIKL', 'E', 'G', 'B', 'D', 'I', 'F', 'L', 'K'),
  ('BDEFGIJL', 'E', 'G', 'B', 'D', 'J', 'F', 'L', 'I'),
  ('BDEFGIJK', 'E', 'G', 'B', 'D', 'J', 'F', 'I', 'K'),
  ('BDEFGHKL', 'E', 'G', 'B', 'D', 'H', 'F', 'L', 'K'),
  ('BDEFGHJL', 'H', 'G', 'B', 'D', 'J', 'F', 'L', 'E'),
  ('BDEFGHJK', 'H', 'G', 'B', 'D', 'J', 'F', 'E', 'K'),
  ('BDEFGHIL', 'E', 'G', 'B', 'D', 'H', 'F', 'L', 'I'),
  ('BDEFGHIK', 'E', 'G', 'B', 'D', 'H', 'F', 'I', 'K'),
  ('BDEFGHIJ', 'H', 'G', 'B', 'D', 'J', 'F', 'E', 'I'),
  ('BCGHIJKL', 'H', 'J', 'B', 'C', 'I', 'G', 'L', 'K'),
  ('BCFHIJKL', 'H', 'J', 'B', 'C', 'I', 'F', 'L', 'K'),
  ('BCFGIJKL', 'I', 'G', 'B', 'C', 'J', 'F', 'L', 'K'),
  ('BCFGHJKL', 'H', 'G', 'B', 'C', 'J', 'F', 'L', 'K'),
  ('BCFGHIKL', 'H', 'G', 'B', 'C', 'I', 'F', 'L', 'K'),
  ('BCFGHIJL', 'H', 'G', 'B', 'C', 'J', 'F', 'L', 'I'),
  ('BCFGHIJK', 'H', 'G', 'B', 'C', 'J', 'F', 'I', 'K'),
  ('BCEHIJKL', 'E', 'J', 'B', 'C', 'I', 'H', 'L', 'K'),
  ('BCEGIJKL', 'E', 'J', 'B', 'C', 'I', 'G', 'L', 'K'),
  ('BCEGHJKL', 'E', 'J', 'B', 'C', 'H', 'G', 'L', 'K'),
  ('BCEGHIKL', 'E', 'G', 'B', 'C', 'I', 'H', 'L', 'K'),
  ('BCEGHIJL', 'E', 'J', 'B', 'C', 'H', 'G', 'L', 'I'),
  ('BCEGHIJK', 'E', 'J', 'B', 'C', 'H', 'G', 'I', 'K'),
  ('BCEFIJKL', 'E', 'J', 'B', 'C', 'I', 'F', 'L', 'K'),
  ('BCEFHJKL', 'E', 'J', 'B', 'C', 'H', 'F', 'L', 'K'),
  ('BCEFHIKL', 'E', 'I', 'B', 'C', 'H', 'F', 'L', 'K'),
  ('BCEFHIJL', 'E', 'J', 'B', 'C', 'H', 'F', 'L', 'I'),
  ('BCEFHIJK', 'E', 'J', 'B', 'C', 'H', 'F', 'I', 'K'),
  ('BCEFGJKL', 'E', 'G', 'B', 'C', 'J', 'F', 'L', 'K'),
  ('BCEFGIKL', 'E', 'G', 'B', 'C', 'I', 'F', 'L', 'K'),
  ('BCEFGIJL', 'E', 'G', 'B', 'C', 'J', 'F', 'L', 'I'),
  ('BCEFGIJK', 'E', 'G', 'B', 'C', 'J', 'F', 'I', 'K'),
  ('BCEFGHKL', 'E', 'G', 'B', 'C', 'H', 'F', 'L', 'K'),
  ('BCEFGHJL', 'H', 'G', 'B', 'C', 'J', 'F', 'L', 'E'),
  ('BCEFGHJK', 'H', 'G', 'B', 'C', 'J', 'F', 'E', 'K'),
  ('BCEFGHIL', 'E', 'G', 'B', 'C', 'H', 'F', 'L', 'I'),
  ('BCEFGHIK', 'E', 'G', 'B', 'C', 'H', 'F', 'I', 'K'),
  ('BCEFGHIJ', 'H', 'G', 'B', 'C', 'J', 'F', 'E', 'I'),
  ('BCDHIJKL', 'H', 'J', 'B', 'C', 'I', 'D', 'L', 'K'),
  ('BCDGIJKL', 'I', 'G', 'B', 'C', 'J', 'D', 'L', 'K'),
  ('BCDGHJKL', 'H', 'G', 'B', 'C', 'J', 'D', 'L', 'K'),
  ('BCDGHIKL', 'H', 'G', 'B', 'C', 'I', 'D', 'L', 'K'),
  ('BCDGHIJL', 'H', 'G', 'B', 'C', 'J', 'D', 'L', 'I'),
  ('BCDGHIJK', 'H', 'G', 'B', 'C', 'J', 'D', 'I', 'K'),
  ('BCDFIJKL', 'C', 'J', 'B', 'D', 'I', 'F', 'L', 'K'),
  ('BCDFHJKL', 'C', 'J', 'B', 'D', 'H', 'F', 'L', 'K'),
  ('BCDFHIKL', 'C', 'I', 'B', 'D', 'H', 'F', 'L', 'K'),
  ('BCDFHIJL', 'C', 'J', 'B', 'D', 'H', 'F', 'L', 'I'),
  ('BCDFHIJK', 'C', 'J', 'B', 'D', 'H', 'F', 'I', 'K'),
  ('BCDFGJKL', 'C', 'G', 'B', 'D', 'J', 'F', 'L', 'K'),
  ('BCDFGIKL', 'C', 'G', 'B', 'D', 'I', 'F', 'L', 'K'),
  ('BCDFGIJL', 'C', 'G', 'B', 'D', 'J', 'F', 'L', 'I'),
  ('BCDFGIJK', 'C', 'G', 'B', 'D', 'J', 'F', 'I', 'K'),
  ('BCDFGHKL', 'C', 'G', 'B', 'D', 'H', 'F', 'L', 'K'),
  ('BCDFGHJL', 'C', 'G', 'B', 'D', 'H', 'F', 'L', 'J'),
  ('BCDFGHJK', 'H', 'G', 'B', 'C', 'J', 'F', 'D', 'K'),
  ('BCDFGHIL', 'C', 'G', 'B', 'D', 'H', 'F', 'L', 'I'),
  ('BCDFGHIK', 'C', 'G', 'B', 'D', 'H', 'F', 'I', 'K'),
  ('BCDFGHIJ', 'H', 'G', 'B', 'C', 'J', 'F', 'D', 'I'),
  ('BCDEIJKL', 'E', 'J', 'B', 'C', 'I', 'D', 'L', 'K'),
  ('BCDEHJKL', 'E', 'J', 'B', 'C', 'H', 'D', 'L', 'K'),
  ('BCDEHIKL', 'E', 'I', 'B', 'C', 'H', 'D', 'L', 'K'),
  ('BCDEHIJL', 'E', 'J', 'B', 'C', 'H', 'D', 'L', 'I'),
  ('BCDEHIJK', 'E', 'J', 'B', 'C', 'H', 'D', 'I', 'K'),
  ('BCDEGJKL', 'E', 'G', 'B', 'C', 'J', 'D', 'L', 'K'),
  ('BCDEGIKL', 'E', 'G', 'B', 'C', 'I', 'D', 'L', 'K'),
  ('BCDEGIJL', 'E', 'G', 'B', 'C', 'J', 'D', 'L', 'I'),
  ('BCDEGIJK', 'E', 'G', 'B', 'C', 'J', 'D', 'I', 'K'),
  ('BCDEGHKL', 'E', 'G', 'B', 'C', 'H', 'D', 'L', 'K'),
  ('BCDEGHJL', 'H', 'G', 'B', 'C', 'J', 'D', 'L', 'E'),
  ('BCDEGHJK', 'H', 'G', 'B', 'C', 'J', 'D', 'E', 'K'),
  ('BCDEGHIL', 'E', 'G', 'B', 'C', 'H', 'D', 'L', 'I'),
  ('BCDEGHIK', 'E', 'G', 'B', 'C', 'H', 'D', 'I', 'K'),
  ('BCDEGHIJ', 'H', 'G', 'B', 'C', 'J', 'D', 'E', 'I'),
  ('BCDEFJKL', 'C', 'J', 'B', 'D', 'E', 'F', 'L', 'K'),
  ('BCDEFIKL', 'C', 'E', 'B', 'D', 'I', 'F', 'L', 'K'),
  ('BCDEFIJL', 'C', 'J', 'B', 'D', 'E', 'F', 'L', 'I'),
  ('BCDEFIJK', 'C', 'J', 'B', 'D', 'E', 'F', 'I', 'K'),
  ('BCDEFHKL', 'C', 'E', 'B', 'D', 'H', 'F', 'L', 'K'),
  ('BCDEFHJL', 'C', 'J', 'B', 'D', 'H', 'F', 'L', 'E'),
  ('BCDEFHJK', 'C', 'J', 'B', 'D', 'H', 'F', 'E', 'K'),
  ('BCDEFHIL', 'C', 'E', 'B', 'D', 'H', 'F', 'L', 'I'),
  ('BCDEFHIK', 'C', 'E', 'B', 'D', 'H', 'F', 'I', 'K'),
  ('BCDEFHIJ', 'C', 'J', 'B', 'D', 'H', 'F', 'E', 'I'),
  ('BCDEFGKL', 'C', 'G', 'B', 'D', 'E', 'F', 'L', 'K'),
  ('BCDEFGJL', 'C', 'G', 'B', 'D', 'J', 'F', 'L', 'E'),
  ('BCDEFGJK', 'C', 'G', 'B', 'D', 'J', 'F', 'E', 'K'),
  ('BCDEFGIL', 'C', 'G', 'B', 'D', 'E', 'F', 'L', 'I'),
  ('BCDEFGIK', 'C', 'G', 'B', 'D', 'E', 'F', 'I', 'K'),
  ('BCDEFGIJ', 'C', 'G', 'B', 'D', 'J', 'F', 'E', 'I'),
  ('BCDEFGHL', 'C', 'G', 'B', 'D', 'H', 'F', 'L', 'E'),
  ('BCDEFGHK', 'C', 'G', 'B', 'D', 'H', 'F', 'E', 'K'),
  ('BCDEFGHJ', 'H', 'G', 'B', 'C', 'J', 'F', 'D', 'E'),
  ('BCDEFGHI', 'C', 'G', 'B', 'D', 'H', 'F', 'E', 'I'),
  ('AFGHIJKL', 'H', 'J', 'I', 'F', 'A', 'G', 'L', 'K'),
  ('AEGHIJKL', 'E', 'J', 'I', 'A', 'H', 'G', 'L', 'K'),
  ('AEFHIJKL', 'E', 'J', 'I', 'F', 'A', 'H', 'L', 'K'),
  ('AEFGIJKL', 'E', 'J', 'I', 'F', 'A', 'G', 'L', 'K'),
  ('AEFGHJKL', 'E', 'G', 'J', 'F', 'A', 'H', 'L', 'K'),
  ('AEFGHIKL', 'E', 'G', 'I', 'F', 'A', 'H', 'L', 'K'),
  ('AEFGHIJL', 'E', 'G', 'J', 'F', 'A', 'H', 'L', 'I'),
  ('AEFGHIJK', 'E', 'G', 'J', 'F', 'A', 'H', 'I', 'K'),
  ('ADGHIJKL', 'H', 'J', 'I', 'D', 'A', 'G', 'L', 'K'),
  ('ADFHIJKL', 'H', 'J', 'I', 'D', 'A', 'F', 'L', 'K'),
  ('ADFGIJKL', 'I', 'G', 'J', 'D', 'A', 'F', 'L', 'K'),
  ('ADFGHJKL', 'H', 'G', 'J', 'D', 'A', 'F', 'L', 'K'),
  ('ADFGHIKL', 'H', 'G', 'I', 'D', 'A', 'F', 'L', 'K'),
  ('ADFGHIJL', 'H', 'G', 'J', 'D', 'A', 'F', 'L', 'I'),
  ('ADFGHIJK', 'H', 'G', 'J', 'D', 'A', 'F', 'I', 'K'),
  ('ADEHIJKL', 'E', 'J', 'I', 'D', 'A', 'H', 'L', 'K'),
  ('ADEGIJKL', 'E', 'J', 'I', 'D', 'A', 'G', 'L', 'K'),
  ('ADEGHJKL', 'E', 'G', 'J', 'D', 'A', 'H', 'L', 'K'),
  ('ADEGHIKL', 'E', 'G', 'I', 'D', 'A', 'H', 'L', 'K'),
  ('ADEGHIJL', 'E', 'G', 'J', 'D', 'A', 'H', 'L', 'I'),
  ('ADEGHIJK', 'E', 'G', 'J', 'D', 'A', 'H', 'I', 'K'),
  ('ADEFIJKL', 'E', 'J', 'I', 'D', 'A', 'F', 'L', 'K'),
  ('ADEFHJKL', 'H', 'J', 'E', 'D', 'A', 'F', 'L', 'K'),
  ('ADEFHIKL', 'H', 'E', 'I', 'D', 'A', 'F', 'L', 'K'),
  ('ADEFHIJL', 'H', 'J', 'E', 'D', 'A', 'F', 'L', 'I'),
  ('ADEFHIJK', 'H', 'J', 'E', 'D', 'A', 'F', 'I', 'K'),
  ('ADEFGJKL', 'E', 'G', 'J', 'D', 'A', 'F', 'L', 'K'),
  ('ADEFGIKL', 'E', 'G', 'I', 'D', 'A', 'F', 'L', 'K'),
  ('ADEFGIJL', 'E', 'G', 'J', 'D', 'A', 'F', 'L', 'I'),
  ('ADEFGIJK', 'E', 'G', 'J', 'D', 'A', 'F', 'I', 'K'),
  ('ADEFGHKL', 'H', 'G', 'E', 'D', 'A', 'F', 'L', 'K'),
  ('ADEFGHJL', 'H', 'G', 'J', 'D', 'A', 'F', 'L', 'E'),
  ('ADEFGHJK', 'H', 'G', 'J', 'D', 'A', 'F', 'E', 'K'),
  ('ADEFGHIL', 'H', 'G', 'E', 'D', 'A', 'F', 'L', 'I'),
  ('ADEFGHIK', 'H', 'G', 'E', 'D', 'A', 'F', 'I', 'K'),
  ('ADEFGHIJ', 'H', 'G', 'J', 'D', 'A', 'F', 'E', 'I'),
  ('ACGHIJKL', 'H', 'J', 'I', 'C', 'A', 'G', 'L', 'K'),
  ('ACFHIJKL', 'H', 'J', 'I', 'C', 'A', 'F', 'L', 'K'),
  ('ACFGIJKL', 'I', 'G', 'J', 'C', 'A', 'F', 'L', 'K'),
  ('ACFGHJKL', 'H', 'G', 'J', 'C', 'A', 'F', 'L', 'K'),
  ('ACFGHIKL', 'H', 'G', 'I', 'C', 'A', 'F', 'L', 'K'),
  ('ACFGHIJL', 'H', 'G', 'J', 'C', 'A', 'F', 'L', 'I'),
  ('ACFGHIJK', 'H', 'G', 'J', 'C', 'A', 'F', 'I', 'K'),
  ('ACEHIJKL', 'E', 'J', 'I', 'C', 'A', 'H', 'L', 'K'),
  ('ACEGIJKL', 'E', 'J', 'I', 'C', 'A', 'G', 'L', 'K'),
  ('ACEGHJKL', 'E', 'G', 'J', 'C', 'A', 'H', 'L', 'K'),
  ('ACEGHIKL', 'E', 'G', 'I', 'C', 'A', 'H', 'L', 'K'),
  ('ACEGHIJL', 'E', 'G', 'J', 'C', 'A', 'H', 'L', 'I'),
  ('ACEGHIJK', 'E', 'G', 'J', 'C', 'A', 'H', 'I', 'K'),
  ('ACEFIJKL', 'E', 'J', 'I', 'C', 'A', 'F', 'L', 'K'),
  ('ACEFHJKL', 'H', 'J', 'E', 'C', 'A', 'F', 'L', 'K'),
  ('ACEFHIKL', 'H', 'E', 'I', 'C', 'A', 'F', 'L', 'K'),
  ('ACEFHIJL', 'H', 'J', 'E', 'C', 'A', 'F', 'L', 'I'),
  ('ACEFHIJK', 'H', 'J', 'E', 'C', 'A', 'F', 'I', 'K'),
  ('ACEFGJKL', 'E', 'G', 'J', 'C', 'A', 'F', 'L', 'K'),
  ('ACEFGIKL', 'E', 'G', 'I', 'C', 'A', 'F', 'L', 'K'),
  ('ACEFGIJL', 'E', 'G', 'J', 'C', 'A', 'F', 'L', 'I'),
  ('ACEFGIJK', 'E', 'G', 'J', 'C', 'A', 'F', 'I', 'K'),
  ('ACEFGHKL', 'H', 'G', 'E', 'C', 'A', 'F', 'L', 'K'),
  ('ACEFGHJL', 'H', 'G', 'J', 'C', 'A', 'F', 'L', 'E'),
  ('ACEFGHJK', 'H', 'G', 'J', 'C', 'A', 'F', 'E', 'K'),
  ('ACEFGHIL', 'H', 'G', 'E', 'C', 'A', 'F', 'L', 'I'),
  ('ACEFGHIK', 'H', 'G', 'E', 'C', 'A', 'F', 'I', 'K'),
  ('ACEFGHIJ', 'H', 'G', 'J', 'C', 'A', 'F', 'E', 'I'),
  ('ACDHIJKL', 'H', 'J', 'I', 'C', 'A', 'D', 'L', 'K'),
  ('ACDGIJKL', 'I', 'G', 'J', 'C', 'A', 'D', 'L', 'K'),
  ('ACDGHJKL', 'H', 'G', 'J', 'C', 'A', 'D', 'L', 'K'),
  ('ACDGHIKL', 'H', 'G', 'I', 'C', 'A', 'D', 'L', 'K'),
  ('ACDGHIJL', 'H', 'G', 'J', 'C', 'A', 'D', 'L', 'I'),
  ('ACDGHIJK', 'H', 'G', 'J', 'C', 'A', 'D', 'I', 'K'),
  ('ACDFIJKL', 'C', 'J', 'I', 'D', 'A', 'F', 'L', 'K'),
  ('ACDFHJKL', 'H', 'J', 'F', 'C', 'A', 'D', 'L', 'K'),
  ('ACDFHIKL', 'H', 'F', 'I', 'C', 'A', 'D', 'L', 'K'),
  ('ACDFHIJL', 'H', 'J', 'F', 'C', 'A', 'D', 'L', 'I'),
  ('ACDFHIJK', 'H', 'J', 'F', 'C', 'A', 'D', 'I', 'K'),
  ('ACDFGJKL', 'C', 'G', 'J', 'D', 'A', 'F', 'L', 'K'),
  ('ACDFGIKL', 'C', 'G', 'I', 'D', 'A', 'F', 'L', 'K'),
  ('ACDFGIJL', 'C', 'G', 'J', 'D', 'A', 'F', 'L', 'I'),
  ('ACDFGIJK', 'C', 'G', 'J', 'D', 'A', 'F', 'I', 'K'),
  ('ACDFGHKL', 'H', 'G', 'F', 'C', 'A', 'D', 'L', 'K'),
  ('ACDFGHJL', 'C', 'G', 'J', 'D', 'A', 'F', 'L', 'H'),
  ('ACDFGHJK', 'H', 'G', 'J', 'C', 'A', 'F', 'D', 'K'),
  ('ACDFGHIL', 'H', 'G', 'F', 'C', 'A', 'D', 'L', 'I'),
  ('ACDFGHIK', 'H', 'G', 'F', 'C', 'A', 'D', 'I', 'K'),
  ('ACDFGHIJ', 'H', 'G', 'J', 'C', 'A', 'F', 'D', 'I'),
  ('ACDEIJKL', 'E', 'J', 'I', 'C', 'A', 'D', 'L', 'K'),
  ('ACDEHJKL', 'H', 'J', 'E', 'C', 'A', 'D', 'L', 'K'),
  ('ACDEHIKL', 'H', 'E', 'I', 'C', 'A', 'D', 'L', 'K'),
  ('ACDEHIJL', 'H', 'J', 'E', 'C', 'A', 'D', 'L', 'I'),
  ('ACDEHIJK', 'H', 'J', 'E', 'C', 'A', 'D', 'I', 'K'),
  ('ACDEGJKL', 'E', 'G', 'J', 'C', 'A', 'D', 'L', 'K'),
  ('ACDEGIKL', 'E', 'G', 'I', 'C', 'A', 'D', 'L', 'K'),
  ('ACDEGIJL', 'E', 'G', 'J', 'C', 'A', 'D', 'L', 'I'),
  ('ACDEGIJK', 'E', 'G', 'J', 'C', 'A', 'D', 'I', 'K'),
  ('ACDEGHKL', 'H', 'G', 'E', 'C', 'A', 'D', 'L', 'K'),
  ('ACDEGHJL', 'H', 'G', 'J', 'C', 'A', 'D', 'L', 'E'),
  ('ACDEGHJK', 'H', 'G', 'J', 'C', 'A', 'D', 'E', 'K'),
  ('ACDEGHIL', 'H', 'G', 'E', 'C', 'A', 'D', 'L', 'I'),
  ('ACDEGHIK', 'H', 'G', 'E', 'C', 'A', 'D', 'I', 'K'),
  ('ACDEGHIJ', 'H', 'G', 'J', 'C', 'A', 'D', 'E', 'I'),
  ('ACDEFJKL', 'C', 'J', 'E', 'D', 'A', 'F', 'L', 'K'),
  ('ACDEFIKL', 'C', 'E', 'I', 'D', 'A', 'F', 'L', 'K'),
  ('ACDEFIJL', 'C', 'J', 'E', 'D', 'A', 'F', 'L', 'I'),
  ('ACDEFIJK', 'C', 'J', 'E', 'D', 'A', 'F', 'I', 'K'),
  ('ACDEFHKL', 'H', 'E', 'F', 'C', 'A', 'D', 'L', 'K'),
  ('ACDEFHJL', 'H', 'J', 'F', 'C', 'A', 'D', 'L', 'E'),
  ('ACDEFHJK', 'H', 'J', 'E', 'C', 'A', 'F', 'D', 'K'),
  ('ACDEFHIL', 'H', 'E', 'F', 'C', 'A', 'D', 'L', 'I'),
  ('ACDEFHIK', 'H', 'E', 'F', 'C', 'A', 'D', 'I', 'K'),
  ('ACDEFHIJ', 'H', 'J', 'E', 'C', 'A', 'F', 'D', 'I'),
  ('ACDEFGKL', 'C', 'G', 'E', 'D', 'A', 'F', 'L', 'K'),
  ('ACDEFGJL', 'C', 'G', 'J', 'D', 'A', 'F', 'L', 'E'),
  ('ACDEFGJK', 'C', 'G', 'J', 'D', 'A', 'F', 'E', 'K'),
  ('ACDEFGIL', 'C', 'G', 'E', 'D', 'A', 'F', 'L', 'I'),
  ('ACDEFGIK', 'C', 'G', 'E', 'D', 'A', 'F', 'I', 'K'),
  ('ACDEFGIJ', 'C', 'G', 'J', 'D', 'A', 'F', 'E', 'I'),
  ('ACDEFGHL', 'H', 'G', 'F', 'C', 'A', 'D', 'L', 'E'),
  ('ACDEFGHK', 'H', 'G', 'E', 'C', 'A', 'F', 'D', 'K'),
  ('ACDEFGHJ', 'H', 'G', 'J', 'C', 'A', 'F', 'D', 'E'),
  ('ACDEFGHI', 'H', 'G', 'E', 'C', 'A', 'F', 'D', 'I'),
  ('ABGHIJKL', 'H', 'J', 'B', 'A', 'I', 'G', 'L', 'K'),
  ('ABFHIJKL', 'H', 'J', 'B', 'A', 'I', 'F', 'L', 'K'),
  ('ABFGIJKL', 'I', 'J', 'B', 'F', 'A', 'G', 'L', 'K'),
  ('ABFGHJKL', 'H', 'J', 'B', 'F', 'A', 'G', 'L', 'K'),
  ('ABFGHIKL', 'H', 'G', 'B', 'A', 'I', 'F', 'L', 'K'),
  ('ABFGHIJL', 'H', 'J', 'B', 'F', 'A', 'G', 'L', 'I'),
  ('ABFGHIJK', 'H', 'J', 'B', 'F', 'A', 'G', 'I', 'K'),
  ('ABEHIJKL', 'E', 'J', 'B', 'A', 'I', 'H', 'L', 'K'),
  ('ABEGIJKL', 'E', 'J', 'B', 'A', 'I', 'G', 'L', 'K'),
  ('ABEGHJKL', 'E', 'J', 'B', 'A', 'H', 'G', 'L', 'K'),
  ('ABEGHIKL', 'E', 'G', 'B', 'A', 'I', 'H', 'L', 'K'),
  ('ABEGHIJL', 'E', 'J', 'B', 'A', 'H', 'G', 'L', 'I'),
  ('ABEGHIJK', 'E', 'J', 'B', 'A', 'H', 'G', 'I', 'K'),
  ('ABEFIJKL', 'E', 'J', 'B', 'A', 'I', 'F', 'L', 'K'),
  ('ABEFHJKL', 'E', 'J', 'B', 'F', 'A', 'H', 'L', 'K'),
  ('ABEFHIKL', 'E', 'I', 'B', 'F', 'A', 'H', 'L', 'K'),
  ('ABEFHIJL', 'E', 'J', 'B', 'F', 'A', 'H', 'L', 'I'),
  ('ABEFHIJK', 'E', 'J', 'B', 'F', 'A', 'H', 'I', 'K'),
  ('ABEFGJKL', 'E', 'J', 'B', 'F', 'A', 'G', 'L', 'K'),
  ('ABEFGIKL', 'E', 'G', 'B', 'A', 'I', 'F', 'L', 'K'),
  ('ABEFGIJL', 'E', 'J', 'B', 'F', 'A', 'G', 'L', 'I'),
  ('ABEFGIJK', 'E', 'J', 'B', 'F', 'A', 'G', 'I', 'K'),
  ('ABEFGHKL', 'E', 'G', 'B', 'F', 'A', 'H', 'L', 'K'),
  ('ABEFGHJL', 'H', 'J', 'B', 'F', 'A', 'G', 'L', 'E'),
  ('ABEFGHJK', 'H', 'J', 'B', 'F', 'A', 'G', 'E', 'K'),
  ('ABEFGHIL', 'E', 'G', 'B', 'F', 'A', 'H', 'L', 'I'),
  ('ABEFGHIK', 'E', 'G', 'B', 'F', 'A', 'H', 'I', 'K'),
  ('ABEFGHIJ', 'H', 'J', 'B', 'F', 'A', 'G', 'E', 'I'),
  ('ABDHIJKL', 'I', 'J', 'B', 'D', 'A', 'H', 'L', 'K'),
  ('ABDGIJKL', 'I', 'J', 'B', 'D', 'A', 'G', 'L', 'K'),
  ('ABDGHJKL', 'H', 'J', 'B', 'D', 'A', 'G', 'L', 'K'),
  ('ABDGHIKL', 'I', 'G', 'B', 'D', 'A', 'H', 'L', 'K'),
  ('ABDGHIJL', 'H', 'J', 'B', 'D', 'A', 'G', 'L', 'I'),
  ('ABDGHIJK', 'H', 'J', 'B', 'D', 'A', 'G', 'I', 'K'),
  ('ABDFIJKL', 'I', 'J', 'B', 'D', 'A', 'F', 'L', 'K'),
  ('ABDFHJKL', 'H', 'J', 'B', 'D', 'A', 'F', 'L', 'K'),
  ('ABDFHIKL', 'H', 'I', 'B', 'D', 'A', 'F', 'L', 'K'),
  ('ABDFHIJL', 'H', 'J', 'B', 'D', 'A', 'F', 'L', 'I'),
  ('ABDFHIJK', 'H', 'J', 'B', 'D', 'A', 'F', 'I', 'K'),
  ('ABDFGJKL', 'F', 'J', 'B', 'D', 'A', 'G', 'L', 'K'),
  ('ABDFGIKL', 'I', 'G', 'B', 'D', 'A', 'F', 'L', 'K'),
  ('ABDFGIJL', 'F', 'J', 'B', 'D', 'A', 'G', 'L', 'I'),
  ('ABDFGIJK', 'F', 'J', 'B', 'D', 'A', 'G', 'I', 'K'),
  ('ABDFGHKL', 'H', 'G', 'B', 'D', 'A', 'F', 'L', 'K'),
  ('ABDFGHJL', 'H', 'G', 'B', 'D', 'A', 'F', 'L', 'J'),
  ('ABDFGHJK', 'H', 'G', 'B', 'D', 'A', 'F', 'J', 'K'),
  ('ABDFGHIL', 'H', 'G', 'B', 'D', 'A', 'F', 'L', 'I'),
  ('ABDFGHIK', 'H', 'G', 'B', 'D', 'A', 'F', 'I', 'K'),
  ('ABDFGHIJ', 'H', 'G', 'B', 'D', 'A', 'F', 'I', 'J'),
  ('ABDEIJKL', 'E', 'J', 'B', 'A', 'I', 'D', 'L', 'K'),
  ('ABDEHJKL', 'E', 'J', 'B', 'D', 'A', 'H', 'L', 'K'),
  ('ABDEHIKL', 'E', 'I', 'B', 'D', 'A', 'H', 'L', 'K'),
  ('ABDEHIJL', 'E', 'J', 'B', 'D', 'A', 'H', 'L', 'I'),
  ('ABDEHIJK', 'E', 'J', 'B', 'D', 'A', 'H', 'I', 'K'),
  ('ABDEGJKL', 'E', 'J', 'B', 'D', 'A', 'G', 'L', 'K'),
  ('ABDEGIKL', 'E', 'G', 'B', 'A', 'I', 'D', 'L', 'K'),
  ('ABDEGIJL', 'E', 'J', 'B', 'D', 'A', 'G', 'L', 'I'),
  ('ABDEGIJK', 'E', 'J', 'B', 'D', 'A', 'G', 'I', 'K'),
  ('ABDEGHKL', 'E', 'G', 'B', 'D', 'A', 'H', 'L', 'K'),
  ('ABDEGHJL', 'H', 'J', 'B', 'D', 'A', 'G', 'L', 'E'),
  ('ABDEGHJK', 'H', 'J', 'B', 'D', 'A', 'G', 'E', 'K'),
  ('ABDEGHIL', 'E', 'G', 'B', 'D', 'A', 'H', 'L', 'I'),
  ('ABDEGHIK', 'E', 'G', 'B', 'D', 'A', 'H', 'I', 'K'),
  ('ABDEGHIJ', 'H', 'J', 'B', 'D', 'A', 'G', 'E', 'I'),
  ('ABDEFJKL', 'E', 'J', 'B', 'D', 'A', 'F', 'L', 'K'),
  ('ABDEFIKL', 'E', 'I', 'B', 'D', 'A', 'F', 'L', 'K'),
  ('ABDEFIJL', 'E', 'J', 'B', 'D', 'A', 'F', 'L', 'I'),
  ('ABDEFIJK', 'E', 'J', 'B', 'D', 'A', 'F', 'I', 'K'),
  ('ABDEFHKL', 'H', 'E', 'B', 'D', 'A', 'F', 'L', 'K'),
  ('ABDEFHJL', 'H', 'J', 'B', 'D', 'A', 'F', 'L', 'E'),
  ('ABDEFHJK', 'H', 'J', 'B', 'D', 'A', 'F', 'E', 'K'),
  ('ABDEFHIL', 'H', 'E', 'B', 'D', 'A', 'F', 'L', 'I'),
  ('ABDEFHIK', 'H', 'E', 'B', 'D', 'A', 'F', 'I', 'K'),
  ('ABDEFHIJ', 'H', 'J', 'B', 'D', 'A', 'F', 'E', 'I'),
  ('ABDEFGKL', 'E', 'G', 'B', 'D', 'A', 'F', 'L', 'K'),
  ('ABDEFGJL', 'E', 'G', 'B', 'D', 'A', 'F', 'L', 'J'),
  ('ABDEFGJK', 'E', 'G', 'B', 'D', 'A', 'F', 'J', 'K'),
  ('ABDEFGIL', 'E', 'G', 'B', 'D', 'A', 'F', 'L', 'I'),
  ('ABDEFGIK', 'E', 'G', 'B', 'D', 'A', 'F', 'I', 'K'),
  ('ABDEFGIJ', 'E', 'G', 'B', 'D', 'A', 'F', 'I', 'J'),
  ('ABDEFGHL', 'H', 'G', 'B', 'D', 'A', 'F', 'L', 'E'),
  ('ABDEFGHK', 'H', 'G', 'B', 'D', 'A', 'F', 'E', 'K'),
  ('ABDEFGHJ', 'H', 'G', 'B', 'D', 'A', 'F', 'E', 'J'),
  ('ABDEFGHI', 'H', 'G', 'B', 'D', 'A', 'F', 'E', 'I'),
  ('ABCHIJKL', 'I', 'J', 'B', 'C', 'A', 'H', 'L', 'K'),
  ('ABCGIJKL', 'I', 'J', 'B', 'C', 'A', 'G', 'L', 'K'),
  ('ABCGHJKL', 'H', 'J', 'B', 'C', 'A', 'G', 'L', 'K'),
  ('ABCGHIKL', 'I', 'G', 'B', 'C', 'A', 'H', 'L', 'K'),
  ('ABCGHIJL', 'H', 'J', 'B', 'C', 'A', 'G', 'L', 'I'),
  ('ABCGHIJK', 'H', 'J', 'B', 'C', 'A', 'G', 'I', 'K'),
  ('ABCFIJKL', 'I', 'J', 'B', 'C', 'A', 'F', 'L', 'K'),
  ('ABCFHJKL', 'H', 'J', 'B', 'C', 'A', 'F', 'L', 'K'),
  ('ABCFHIKL', 'H', 'I', 'B', 'C', 'A', 'F', 'L', 'K'),
  ('ABCFHIJL', 'H', 'J', 'B', 'C', 'A', 'F', 'L', 'I'),
  ('ABCFHIJK', 'H', 'J', 'B', 'C', 'A', 'F', 'I', 'K'),
  ('ABCFGJKL', 'C', 'J', 'B', 'F', 'A', 'G', 'L', 'K'),
  ('ABCFGIKL', 'I', 'G', 'B', 'C', 'A', 'F', 'L', 'K'),
  ('ABCFGIJL', 'C', 'J', 'B', 'F', 'A', 'G', 'L', 'I'),
  ('ABCFGIJK', 'C', 'J', 'B', 'F', 'A', 'G', 'I', 'K'),
  ('ABCFGHKL', 'H', 'G', 'B', 'C', 'A', 'F', 'L', 'K'),
  ('ABCFGHJL', 'H', 'G', 'B', 'C', 'A', 'F', 'L', 'J'),
  ('ABCFGHJK', 'H', 'G', 'B', 'C', 'A', 'F', 'J', 'K'),
  ('ABCFGHIL', 'H', 'G', 'B', 'C', 'A', 'F', 'L', 'I'),
  ('ABCFGHIK', 'H', 'G', 'B', 'C', 'A', 'F', 'I', 'K'),
  ('ABCFGHIJ', 'H', 'G', 'B', 'C', 'A', 'F', 'I', 'J'),
  ('ABCEIJKL', 'E', 'J', 'B', 'A', 'I', 'C', 'L', 'K'),
  ('ABCEHJKL', 'E', 'J', 'B', 'C', 'A', 'H', 'L', 'K'),
  ('ABCEHIKL', 'E', 'I', 'B', 'C', 'A', 'H', 'L', 'K'),
  ('ABCEHIJL', 'E', 'J', 'B', 'C', 'A', 'H', 'L', 'I'),
  ('ABCEHIJK', 'E', 'J', 'B', 'C', 'A', 'H', 'I', 'K'),
  ('ABCEGJKL', 'E', 'J', 'B', 'C', 'A', 'G', 'L', 'K'),
  ('ABCEGIKL', 'E', 'G', 'B', 'A', 'I', 'C', 'L', 'K'),
  ('ABCEGIJL', 'E', 'J', 'B', 'C', 'A', 'G', 'L', 'I'),
  ('ABCEGIJK', 'E', 'J', 'B', 'C', 'A', 'G', 'I', 'K'),
  ('ABCEGHKL', 'E', 'G', 'B', 'C', 'A', 'H', 'L', 'K'),
  ('ABCEGHJL', 'H', 'J', 'B', 'C', 'A', 'G', 'L', 'E'),
  ('ABCEGHJK', 'H', 'J', 'B', 'C', 'A', 'G', 'E', 'K'),
  ('ABCEGHIL', 'E', 'G', 'B', 'C', 'A', 'H', 'L', 'I'),
  ('ABCEGHIK', 'E', 'G', 'B', 'C', 'A', 'H', 'I', 'K'),
  ('ABCEGHIJ', 'H', 'J', 'B', 'C', 'A', 'G', 'E', 'I'),
  ('ABCEFJKL', 'E', 'J', 'B', 'C', 'A', 'F', 'L', 'K'),
  ('ABCEFIKL', 'E', 'I', 'B', 'C', 'A', 'F', 'L', 'K'),
  ('ABCEFIJL', 'E', 'J', 'B', 'C', 'A', 'F', 'L', 'I'),
  ('ABCEFIJK', 'E', 'J', 'B', 'C', 'A', 'F', 'I', 'K'),
  ('ABCEFHKL', 'H', 'E', 'B', 'C', 'A', 'F', 'L', 'K'),
  ('ABCEFHJL', 'H', 'J', 'B', 'C', 'A', 'F', 'L', 'E'),
  ('ABCEFHJK', 'H', 'J', 'B', 'C', 'A', 'F', 'E', 'K'),
  ('ABCEFHIL', 'H', 'E', 'B', 'C', 'A', 'F', 'L', 'I'),
  ('ABCEFHIK', 'H', 'E', 'B', 'C', 'A', 'F', 'I', 'K'),
  ('ABCEFHIJ', 'H', 'J', 'B', 'C', 'A', 'F', 'E', 'I'),
  ('ABCEFGKL', 'E', 'G', 'B', 'C', 'A', 'F', 'L', 'K'),
  ('ABCEFGJL', 'E', 'G', 'B', 'C', 'A', 'F', 'L', 'J'),
  ('ABCEFGJK', 'E', 'G', 'B', 'C', 'A', 'F', 'J', 'K'),
  ('ABCEFGIL', 'E', 'G', 'B', 'C', 'A', 'F', 'L', 'I'),
  ('ABCEFGIK', 'E', 'G', 'B', 'C', 'A', 'F', 'I', 'K'),
  ('ABCEFGIJ', 'E', 'G', 'B', 'C', 'A', 'F', 'I', 'J'),
  ('ABCEFGHL', 'H', 'G', 'B', 'C', 'A', 'F', 'L', 'E'),
  ('ABCEFGHK', 'H', 'G', 'B', 'C', 'A', 'F', 'E', 'K'),
  ('ABCEFGHJ', 'H', 'G', 'B', 'C', 'A', 'F', 'E', 'J'),
  ('ABCEFGHI', 'H', 'G', 'B', 'C', 'A', 'F', 'E', 'I'),
  ('ABCDIJKL', 'I', 'J', 'B', 'C', 'A', 'D', 'L', 'K'),
  ('ABCDHJKL', 'H', 'J', 'B', 'C', 'A', 'D', 'L', 'K'),
  ('ABCDHIKL', 'H', 'I', 'B', 'C', 'A', 'D', 'L', 'K'),
  ('ABCDHIJL', 'H', 'J', 'B', 'C', 'A', 'D', 'L', 'I'),
  ('ABCDHIJK', 'H', 'J', 'B', 'C', 'A', 'D', 'I', 'K'),
  ('ABCDGJKL', 'C', 'J', 'B', 'D', 'A', 'G', 'L', 'K'),
  ('ABCDGIKL', 'I', 'G', 'B', 'C', 'A', 'D', 'L', 'K'),
  ('ABCDGIJL', 'C', 'J', 'B', 'D', 'A', 'G', 'L', 'I'),
  ('ABCDGIJK', 'C', 'J', 'B', 'D', 'A', 'G', 'I', 'K'),
  ('ABCDGHKL', 'H', 'G', 'B', 'C', 'A', 'D', 'L', 'K'),
  ('ABCDGHJL', 'H', 'G', 'B', 'C', 'A', 'D', 'L', 'J'),
  ('ABCDGHJK', 'H', 'G', 'B', 'C', 'A', 'D', 'J', 'K'),
  ('ABCDGHIL', 'H', 'G', 'B', 'C', 'A', 'D', 'L', 'I'),
  ('ABCDGHIK', 'H', 'G', 'B', 'C', 'A', 'D', 'I', 'K'),
  ('ABCDGHIJ', 'H', 'G', 'B', 'C', 'A', 'D', 'I', 'J'),
  ('ABCDFJKL', 'C', 'J', 'B', 'D', 'A', 'F', 'L', 'K'),
  ('ABCDFIKL', 'C', 'I', 'B', 'D', 'A', 'F', 'L', 'K'),
  ('ABCDFIJL', 'C', 'J', 'B', 'D', 'A', 'F', 'L', 'I'),
  ('ABCDFIJK', 'C', 'J', 'B', 'D', 'A', 'F', 'I', 'K'),
  ('ABCDFHKL', 'H', 'F', 'B', 'C', 'A', 'D', 'L', 'K'),
  ('ABCDFHJL', 'C', 'J', 'B', 'D', 'A', 'F', 'L', 'H'),
  ('ABCDFHJK', 'H', 'J', 'B', 'C', 'A', 'F', 'D', 'K'),
  ('ABCDFHIL', 'H', 'F', 'B', 'C', 'A', 'D', 'L', 'I'),
  ('ABCDFHIK', 'H', 'F', 'B', 'C', 'A', 'D', 'I', 'K'),
  ('ABCDFHIJ', 'H', 'J', 'B', 'C', 'A', 'F', 'D', 'I'),
  ('ABCDFGKL', 'C', 'G', 'B', 'D', 'A', 'F', 'L', 'K'),
  ('ABCDFGJL', 'C', 'G', 'B', 'D', 'A', 'F', 'L', 'J'),
  ('ABCDFGJK', 'C', 'G', 'B', 'D', 'A', 'F', 'J', 'K'),
  ('ABCDFGIL', 'C', 'G', 'B', 'D', 'A', 'F', 'L', 'I'),
  ('ABCDFGIK', 'C', 'G', 'B', 'D', 'A', 'F', 'I', 'K'),
  ('ABCDFGIJ', 'C', 'G', 'B', 'D', 'A', 'F', 'I', 'J'),
  ('ABCDFGHL', 'C', 'G', 'B', 'D', 'A', 'F', 'L', 'H'),
  ('ABCDFGHK', 'H', 'G', 'B', 'C', 'A', 'F', 'D', 'K'),
  ('ABCDFGHJ', 'H', 'G', 'B', 'C', 'A', 'F', 'D', 'J'),
  ('ABCDFGHI', 'H', 'G', 'B', 'C', 'A', 'F', 'D', 'I'),
  ('ABCDEJKL', 'E', 'J', 'B', 'C', 'A', 'D', 'L', 'K'),
  ('ABCDEIKL', 'E', 'I', 'B', 'C', 'A', 'D', 'L', 'K'),
  ('ABCDEIJL', 'E', 'J', 'B', 'C', 'A', 'D', 'L', 'I'),
  ('ABCDEIJK', 'E', 'J', 'B', 'C', 'A', 'D', 'I', 'K'),
  ('ABCDEHKL', 'H', 'E', 'B', 'C', 'A', 'D', 'L', 'K'),
  ('ABCDEHJL', 'H', 'J', 'B', 'C', 'A', 'D', 'L', 'E'),
  ('ABCDEHJK', 'H', 'J', 'B', 'C', 'A', 'D', 'E', 'K'),
  ('ABCDEHIL', 'H', 'E', 'B', 'C', 'A', 'D', 'L', 'I'),
  ('ABCDEHIK', 'H', 'E', 'B', 'C', 'A', 'D', 'I', 'K'),
  ('ABCDEHIJ', 'H', 'J', 'B', 'C', 'A', 'D', 'E', 'I'),
  ('ABCDEGKL', 'E', 'G', 'B', 'C', 'A', 'D', 'L', 'K'),
  ('ABCDEGJL', 'E', 'G', 'B', 'C', 'A', 'D', 'L', 'J'),
  ('ABCDEGJK', 'E', 'G', 'B', 'C', 'A', 'D', 'J', 'K'),
  ('ABCDEGIL', 'E', 'G', 'B', 'C', 'A', 'D', 'L', 'I'),
  ('ABCDEGIK', 'E', 'G', 'B', 'C', 'A', 'D', 'I', 'K'),
  ('ABCDEGIJ', 'E', 'G', 'B', 'C', 'A', 'D', 'I', 'J'),
  ('ABCDEGHL', 'H', 'G', 'B', 'C', 'A', 'D', 'L', 'E'),
  ('ABCDEGHK', 'H', 'G', 'B', 'C', 'A', 'D', 'E', 'K'),
  ('ABCDEGHJ', 'H', 'G', 'B', 'C', 'A', 'D', 'E', 'J'),
  ('ABCDEGHI', 'H', 'G', 'B', 'C', 'A', 'D', 'E', 'I'),
  ('ABCDEFKL', 'C', 'E', 'B', 'D', 'A', 'F', 'L', 'K'),
  ('ABCDEFJL', 'C', 'J', 'B', 'D', 'A', 'F', 'L', 'E'),
  ('ABCDEFJK', 'C', 'J', 'B', 'D', 'A', 'F', 'E', 'K'),
  ('ABCDEFIL', 'C', 'E', 'B', 'D', 'A', 'F', 'L', 'I'),
  ('ABCDEFIK', 'C', 'E', 'B', 'D', 'A', 'F', 'I', 'K'),
  ('ABCDEFIJ', 'C', 'J', 'B', 'D', 'A', 'F', 'E', 'I'),
  ('ABCDEFHL', 'H', 'F', 'B', 'C', 'A', 'D', 'L', 'E'),
  ('ABCDEFHK', 'H', 'E', 'B', 'C', 'A', 'F', 'D', 'K'),
  ('ABCDEFHJ', 'H', 'J', 'B', 'C', 'A', 'F', 'D', 'E'),
  ('ABCDEFHI', 'H', 'E', 'B', 'C', 'A', 'F', 'D', 'I'),
  ('ABCDEFGL', 'C', 'G', 'B', 'D', 'A', 'F', 'L', 'E'),
  ('ABCDEFGK', 'C', 'G', 'B', 'D', 'A', 'F', 'E', 'K'),
  ('ABCDEFGJ', 'C', 'G', 'B', 'D', 'A', 'F', 'E', 'J'),
  ('ABCDEFGI', 'C', 'G', 'B', 'D', 'A', 'F', 'E', 'I'),
  ('ABCDEFGH', 'H', 'G', 'B', 'C', 'A', 'F', 'D', 'E')
on conflict (qualified_groups) do update
set winner_a_opponent_group = excluded.winner_a_opponent_group,
    winner_b_opponent_group = excluded.winner_b_opponent_group,
    winner_d_opponent_group = excluded.winner_d_opponent_group,
    winner_e_opponent_group = excluded.winner_e_opponent_group,
    winner_g_opponent_group = excluded.winner_g_opponent_group,
    winner_i_opponent_group = excluded.winner_i_opponent_group,
    winner_k_opponent_group = excluded.winner_k_opponent_group,
    winner_l_opponent_group = excluded.winner_l_opponent_group;

create or replace function public.worldcup_group_key(p_group_name text)
returns text
language sql
immutable
as $$
  select nullif(substring(regexp_replace(upper(trim(coalesce(p_group_name, ''))), '^GROUP[\s_-]*', '') from '^[A-L]'), '');
$$;

create or replace function public.group_stage_standings()
returns table (
  group_name text,
  team_id bigint,
  team_name text,
  team_code text,
  played integer,
  wins integer,
  draws integer,
  losses integer,
  goals_for integer,
  goals_against integer,
  goal_difference integer,
  points integer,
  h2h_points integer,
  h2h_goal_difference integer,
  h2h_goals_for integer,
  fair_play_points integer,
  group_rank integer
)
language sql
stable
security definer
set search_path = public
as $$
  with team_groups as (
    select
      t.id,
      t.name,
      t.code,
      t.fifa_rank,
      public.worldcup_group_key(t.group_name) as group_name
    from public.teams t
    where public.worldcup_group_key(t.group_name) is not null
  ),
  completed_matches as (
    select
      public.worldcup_group_key(m.group_name) as group_name,
      m.home_team_id,
      m.away_team_id,
      m.home_score,
      m.away_score,
      coalesce(ms.yellow_cards_home, 0) as yellow_cards_home,
      coalesce(ms.yellow_cards_away, 0) as yellow_cards_away,
      coalesce(ms.red_cards_home, 0) as red_cards_home,
      coalesce(ms.red_cards_away, 0) as red_cards_away
    from public.matches m
    left join public.match_stats ms on ms.match_id = m.id
    where public.worldcup_group_key(m.group_name) is not null
      and m.status in ('FT', 'AET', 'PEN', 'FT_PEN')
      and m.home_score is not null
      and m.away_score is not null
  ),
  team_match_rows as (
    select
      group_name,
      home_team_id as team_id,
      away_team_id as opponent_team_id,
      home_score as gf,
      away_score as ga,
      case when home_score > away_score then 3 when home_score = away_score then 1 else 0 end as points,
      -(yellow_cards_home + red_cards_home * 3) as fair_play_points
    from completed_matches
    union all
    select
      group_name,
      away_team_id as team_id,
      home_team_id as opponent_team_id,
      away_score as gf,
      home_score as ga,
      case when away_score > home_score then 3 when away_score = home_score then 1 else 0 end as points,
      -(yellow_cards_away + red_cards_away * 3) as fair_play_points
    from completed_matches
  ),
  totals as (
    select
      tg.group_name,
      tg.id as team_id,
      tg.name as team_name,
      tg.code as team_code,
      tg.fifa_rank,
      count(tmr.team_id)::integer as played,
      coalesce(sum((tmr.gf > tmr.ga)::integer), 0)::integer as wins,
      coalesce(sum((tmr.gf = tmr.ga)::integer), 0)::integer as draws,
      coalesce(sum((tmr.gf < tmr.ga)::integer), 0)::integer as losses,
      coalesce(sum(tmr.gf), 0)::integer as goals_for,
      coalesce(sum(tmr.ga), 0)::integer as goals_against,
      coalesce(sum(tmr.gf - tmr.ga), 0)::integer as goal_difference,
      coalesce(sum(tmr.points), 0)::integer as points,
      coalesce(sum(tmr.fair_play_points), 0)::integer as fair_play_points
    from team_groups tg
    left join team_match_rows tmr on tmr.team_id = tg.id and tmr.group_name = tg.group_name
    group by tg.group_name, tg.id, tg.name, tg.code, tg.fifa_rank
  ),
  tie_sets as (
    select
      totals.*,
      count(*) over (partition by group_name, points, goal_difference, goals_for) as tie_count
    from totals
  ),
  h2h as (
    select
      ts.group_name,
      ts.team_id,
      coalesce(sum(tmr.points), 0)::integer as h2h_points,
      coalesce(sum(tmr.gf - tmr.ga), 0)::integer as h2h_goal_difference,
      coalesce(sum(tmr.gf), 0)::integer as h2h_goals_for
    from tie_sets ts
    left join team_match_rows tmr on tmr.group_name = ts.group_name and tmr.team_id = ts.team_id
    left join tie_sets opp on opp.group_name = ts.group_name
      and opp.team_id = tmr.opponent_team_id
      and opp.points = ts.points
      and opp.goal_difference = ts.goal_difference
      and opp.goals_for = ts.goals_for
    where ts.tie_count > 1 and opp.team_id is not null
    group by ts.group_name, ts.team_id
  )
  select
    ts.group_name,
    ts.team_id,
    ts.team_name,
    ts.team_code,
    ts.played,
    ts.wins,
    ts.draws,
    ts.losses,
    ts.goals_for,
    ts.goals_against,
    ts.goal_difference,
    ts.points,
    coalesce(h2h.h2h_points, 0) as h2h_points,
    coalesce(h2h.h2h_goal_difference, 0) as h2h_goal_difference,
    coalesce(h2h.h2h_goals_for, 0) as h2h_goals_for,
    ts.fair_play_points,
    row_number() over (
      partition by ts.group_name
      order by
        ts.points desc,
        ts.goal_difference desc,
        ts.goals_for desc,
        case when ts.tie_count > 1 then coalesce(h2h.h2h_points, 0) else 0 end desc,
        case when ts.tie_count > 1 then coalesce(h2h.h2h_goal_difference, 0) else 0 end desc,
        case when ts.tie_count > 1 then coalesce(h2h.h2h_goals_for, 0) else 0 end desc,
        ts.fair_play_points desc,
        ts.fifa_rank asc nulls last,
        ts.team_name asc,
        ts.team_id asc
    )::integer as group_rank
  from tie_sets ts
  left join h2h on h2h.group_name = ts.group_name and h2h.team_id = ts.team_id;
$$;

create or replace function public.group_stage_complete()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select count(*) >= 72
    and count(*) filter (
      where status not in ('FT', 'AET', 'PEN', 'FT_PEN')
        or home_score is null
        or away_score is null
    ) = 0
  from public.matches
  where public.worldcup_group_key(group_name) is not null;
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
  if not (public.is_admin() or auth.role() = 'service_role') then
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

create or replace function public.allocate_round_of_32_bracket()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_path public.bracket_third_place_paths%rowtype;
  v_third_groups text;
  v_updated integer := 0;
  v_created integer := 0;
  v_match_no integer;
begin
  if not (public.is_admin() or auth.role() = 'service_role') then
    raise exception 'admin role required';
  end if;

  if not public.group_stage_complete() then
    return 0;
  end if;

  select string_agg(group_name, '' order by group_name)
  into v_third_groups
  from (
    select group_name
    from public.group_stage_standings()
    where group_rank = 3
    order by points desc, goal_difference desc, goals_for desc, fair_play_points desc, team_name asc, team_id asc
    limit 8
  ) third_teams;

  if v_third_groups is null or length(v_third_groups) <> 8 then
    return 0;
  end if;

  select * into v_path
  from public.bracket_third_place_paths
  where qualified_groups = v_third_groups;

  if not found then
    raise exception 'third-place bracket path not found for groups %', v_third_groups;
  end if;

  with standings as (
    select * from public.group_stage_standings()
  ),
  third_qualified as (
    select group_name, team_id, team_name
    from standings
    where group_rank = 3
    order by points desc, goal_difference desc, goals_for desc, fair_play_points desc, team_name asc, team_id asc
    limit 8
  ),
  fixed_slots(match_no, slot, group_name, group_rank) as (
    values
      (73, 'home', 'A', 2), (73, 'away', 'B', 2),
      (74, 'home', 'E', 1),
      (75, 'home', 'F', 1), (75, 'away', 'C', 2),
      (76, 'home', 'C', 1), (76, 'away', 'F', 2),
      (77, 'home', 'I', 1),
      (78, 'home', 'E', 2), (78, 'away', 'I', 2),
      (79, 'home', 'A', 1),
      (80, 'home', 'L', 1),
      (81, 'home', 'D', 1),
      (82, 'home', 'G', 1),
      (83, 'home', 'K', 2), (83, 'away', 'L', 2),
      (84, 'home', 'H', 1), (84, 'away', 'J', 2),
      (85, 'home', 'B', 1),
      (86, 'home', 'J', 1), (86, 'away', 'H', 2),
      (87, 'home', 'K', 1),
      (88, 'home', 'D', 2), (88, 'away', 'G', 2)
  ),
  third_slots(match_no, slot, group_name, group_rank) as (
    values
      (79, 'away', v_path.winner_a_opponent_group, 3),
      (85, 'away', v_path.winner_b_opponent_group, 3),
      (81, 'away', v_path.winner_d_opponent_group, 3),
      (74, 'away', v_path.winner_e_opponent_group, 3),
      (82, 'away', v_path.winner_g_opponent_group, 3),
      (77, 'away', v_path.winner_i_opponent_group, 3),
      (87, 'away', v_path.winner_k_opponent_group, 3),
      (80, 'away', v_path.winner_l_opponent_group, 3)
  ),
  slot_updates as (
    select * from fixed_slots
    union all
    select * from third_slots
  ),
  resolved_slots as (
    select
      su.match_no,
      su.slot,
      coalesce(s.team_id, tq.team_id) as team_id,
      coalesce(s.team_name, tq.team_name) as team_name
    from slot_updates su
    left join standings s on s.group_name = su.group_name and s.group_rank = su.group_rank and su.group_rank <> 3
    left join third_qualified tq on tq.group_name = su.group_name and su.group_rank = 3
  ),
  match_updates as (
    select
      match_no,
      max(team_id) filter (where slot = 'home') as home_team_id,
      max(team_id) filter (where slot = 'away') as away_team_id,
      max(team_name) filter (where slot = 'home') as home_label,
      max(team_name) filter (where slot = 'away') as away_label
    from resolved_slots
    group by match_no
    having count(*) = 2 and count(team_id) = 2
  )
  update public.bracket_matches bm
  set home_team_id = mu.home_team_id,
      away_team_id = mu.away_team_id,
      home_label = mu.home_label,
      away_label = mu.away_label,
      is_confirmed = true,
      source = 'group_standings',
      updated_at = now()
  from match_updates mu
  where bm.match_no = mu.match_no
    and bm.match_no between 73 and 88
    and (
      bm.home_team_id is distinct from mu.home_team_id
      or bm.away_team_id is distinct from mu.away_team_id
      or bm.home_label is distinct from mu.home_label
      or bm.away_label is distinct from mu.away_label
      or bm.is_confirmed is distinct from true
      or bm.source is distinct from 'group_standings'
    );

  get diagnostics v_updated = row_count;

  if v_updated = 0 then
    return 0;
  end if;

  for v_match_no in
    select match_no
    from public.bracket_matches
    where match_no between 73 and 88
      and home_team_id is not null
      and away_team_id is not null
    order by match_no
  loop
    perform public.ensure_bracket_match(v_match_no);
    v_created := v_created + 1;
  end loop;

  insert into public.audit_logs (actor_id, action, entity_type, details_json)
  values (
    auth.uid(),
    'bracket.allocate_round_of_32',
    'bracket',
    jsonb_build_object('third_place_groups', v_third_groups, 'updated_matches', v_updated, 'ensured_matches', v_created)
  );

  return v_updated;
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
  if not (public.is_admin() or auth.role() = 'service_role') then
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
  v_payout numeric(18, 2);
  v_delta numeric(18, 2);
  v_bonus numeric(18, 2);
  v_total_goals numeric;
  v_total_corners numeric;
  v_total_cards numeric;
  v_count integer := 0;
  v_advanced integer := 0;
  v_round_of_32 integer := 0;
  v_ah_adjusted numeric;
  v_winner_team_id bigint;
begin
  if not (public.is_admin() or auth.role() = 'service_role') then
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
    if v_bet.market_key = 'match_winner' then
      v_winner_team_id := public.match_winner_team_id(p_match_id);
      if v_winner_team_id is null then
        continue;
      end if;
      v_won := (v_bet.selection_key = 'home' and v_winner_team_id = v_match.home_team_id)
        or (v_bet.selection_key = 'away' and v_winner_team_id = v_match.away_team_id);
    elsif v_bet.market_key = 'qualification_method' then
      v_winner_team_id := public.match_winner_team_id(p_match_id);
      if v_winner_team_id is null then
        continue;
      end if;
      v_won := (v_bet.selection_key = 'home_extra_time' and v_match.status = 'AET' and v_winner_team_id = v_match.home_team_id)
        or (v_bet.selection_key = 'away_extra_time' and v_match.status = 'AET' and v_winner_team_id = v_match.away_team_id)
        or (v_bet.selection_key = 'home_penalties' and v_match.status in ('PEN', 'FT_PEN') and v_winner_team_id = v_match.home_team_id)
        or (v_bet.selection_key = 'away_penalties' and v_match.status in ('PEN', 'FT_PEN') and v_winner_team_id = v_match.away_team_id);
    elsif v_bet.market_key = 'correct_score' then
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
      if v_total_goals = v_bet.line then
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
          'Total goals push: ' || v_bet.selection_label,
          wallet_balance
        from public.profiles
        where id = v_bet.user_id;
        insert into public.settlements (bet_id, result, status, payout, reason)
        values (v_bet.id, 'push', 'refunded', v_payout, 'Total goals market pushed; stake refunded.');
        v_count := v_count + 1;
        continue;
      end if;
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
    elsif v_bet.market_key = 'asian_handicap' then
      -- line is handicap applied to home team (negative = home gives goals, positive = home receives)
      v_ah_adjusted := coalesce(v_match.home_score, 0) + coalesce(v_bet.line, 0);
      if v_ah_adjusted = coalesce(v_match.away_score, 0) then
        -- Push: refund stake
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
          'Asian handicap push: ' || v_bet.selection_label,
          wallet_balance
        from public.profiles
        where id = v_bet.user_id;
        insert into public.settlements (bet_id, result, status, payout, reason)
        values (v_bet.id, 'draw', 'refunded', v_payout, 'Asian handicap push; adjusted scores tied; stake refunded.');
        v_count := v_count + 1;
        continue;
      end if;
      v_won := (v_bet.selection_key = 'home' and v_ah_adjusted > coalesce(v_match.away_score, 0))
        or (v_bet.selection_key = 'away' and v_ah_adjusted < coalesce(v_match.away_score, 0));
    end if;

    if v_won then
      v_payout := round(v_bet.stake * v_bet.locked_multiplier, 2);
      v_delta := v_payout - v_bet.stake;
      v_bonus := case
        when v_bet.market_key = 'correct_score' then 50
        when v_bet.market_key = 'match_result' then 10
        when v_bet.market_key = 'match_winner' then 10
        when v_bet.market_key = 'qualification_method' then 15
        when v_bet.market_key in ('draw_no_bet', 'total_goals', 'btts') then 8
        when v_bet.market_key in ('corners_total', 'cards_total') then 6
        when v_bet.market_key = 'asian_handicap' then 8
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
      values (
        v_bet.id,
        'win',
        'won',
        v_payout,
        case
          when v_bet.market_key = 'match_winner' then 'Selection matched the team that advanced; leaderboard bonus applied.'
          when v_bet.market_key = 'qualification_method' then 'Selection matched the knockout qualification method; leaderboard bonus applied.'
          else 'Selection matched the final 90-minute result; leaderboard bonus applied.'
        end
      );
    else
      v_payout := 0;
      v_delta := -v_bet.stake;
      v_bonus := 0;
      update public.bets set status = 'lost', points_delta = v_delta, prediction_bonus = v_bonus, settled_at = now() where id = v_bet.id;
      insert into public.settlements (bet_id, result, status, payout, reason)
      values (
        v_bet.id,
        'loss',
        'lost',
        v_payout,
        case
          when v_bet.market_key = 'match_winner' then 'Selection did not match the team that advanced.'
          when v_bet.market_key = 'qualification_method' then 'Selection did not match the knockout qualification method.'
          else 'Selection did not match the final 90-minute result.'
        end
      );
    end if;

    v_count := v_count + 1;
  end loop;

  v_advanced := public.advance_knockout_match(p_match_id);
  if public.worldcup_group_key(v_match.group_name) is not null then
    v_round_of_32 := public.allocate_round_of_32_bracket();
  end if;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, details_json)
  values (
    auth.uid(),
    'settlement.match',
    'match',
    p_match_id::text,
    jsonb_build_object(
      'match_id', p_match_id,
      'status', v_match.status,
      'settled_bets', v_count,
      'advanced_slots', v_advanced,
      'round_of_32_slots', v_round_of_32
    )
  );

  return v_count;
end;
$$;
