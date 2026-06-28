export type DecimalLike = string | number;

export interface Role {
  name: "admin" | "player" | string;
}

export interface User {
  id: number;
  username: string;
  display_name: string;
  email?: string | null;
  role: Role;
  is_active: boolean;
  wallet_balance: DecimalLike;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Team {
  id: number;
  code: string;
  name: string;
  country: string;
  logo_url?: string | null;
}

export interface MatchMarket {
  id: number;
  market_key: string;
  label: string;
  selection_key: string;
  selection_label: string;
  line?: DecimalLike | null;
  odds_multiplier: DecimalLike;
  is_open: boolean;
  source: string;
  closes_at: string;
}

export interface Match {
  id: number;
  stage: string;
  group_name?: string | null;
  starts_at: string;
  status: string;
  home_score?: number | null;
  away_score?: number | null;
  home_penalties?: number | null;
  away_penalties?: number | null;
  venue?: string | null;
  city?: string | null;
  current_minute?: number | null;
  home_team: Team;
  away_team: Team;
  markets: MatchMarket[];
}

export interface Bet {
  id: number;
  match_id?: number | null;
  market_key: string;
  selection_key: string;
  selection_label: string;
  stake: DecimalLike;
  locked_multiplier: DecimalLike;
  potential_payout: DecimalLike;
  status: string;
  points_delta: DecimalLike;
  selection_json: Record<string, unknown>;
  placed_at: string;
  settled_at?: string | null;
}

export interface AdminBet extends Bet {
  user: User;
}

export interface LeaderboardRow {
  rank: number;
  user_id: number;
  display_name: string;
  username: string;
  score: DecimalLike;
  settled_bets: number;
  won_bets: number;
  accuracy: number;
  roi: number;
}

export interface PlaceBetPayload {
  match_id: number;
  market_id?: number;
  market_key: string;
  selection_key: string;
  selection_label?: string;
  selection: Record<string, unknown>;
  stake: DecimalLike;
}

export interface AdminReport {
  players: number;
  total_wallet_balance: DecimalLike;
  total_staked: DecimalLike;
  settled_net_points: DecimalLike;
  open_bets: number;
  settled_bets: number;
  top_markets: Array<{ market: string; bets: number }>;
}

export interface SyncRun {
  id: number;
  provider: string;
  job_type: string;
  status: string;
  started_at: string;
  finished_at?: string | null;
  request_count: number;
  message: string;
}

export type TabKey = "matches" | "detail" | "leaderboard" | "history" | "admin";
