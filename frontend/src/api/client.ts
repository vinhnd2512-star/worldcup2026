import type {
  AdminBet,
  AdminReport,
  Bet,
  LeaderboardRow,
  Match,
  PlaceBetPayload,
  SyncRun,
  TokenResponse,
  User
} from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api";

async function request<T>(path: string, token?: string | null, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  if (!response.ok) {
    let message = `Request failed: ${response.status}`;
    try {
      const payload = await response.json();
      message = typeof payload.detail === "string" ? payload.detail : message;
    } catch {
      // Keep generic message.
    }
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

export const api = {
  login: (username: string, password: string) =>
    request<TokenResponse>("/auth/login", null, {
      method: "POST",
      body: JSON.stringify({ username, password })
    }),
  me: (token: string) => request<User>("/auth/me", token),
  matches: (token: string) => request<Match[]>("/matches", token),
  match: (token: string, id: number) => request<Match>(`/matches/${id}`, token),
  leaderboard: (token: string) => request<LeaderboardRow[]>("/leaderboard", token),
  history: (token: string) => request<Bet[]>("/me/history", token),
  placeBet: (token: string, payload: PlaceBetPayload) =>
    request<Bet>("/bets", token, {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  users: (token: string) => request<User[]>("/admin/users", token),
  adminBets: (token: string) => request<AdminBet[]>("/admin/bets", token),
  createUser: (token: string, payload: { username: string; display_name: string; password: string; starting_points: number }) =>
    request<User>("/admin/users", token, {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  topUp: (token: string, userId: number, amount: number, reason: string) =>
    request<User>(`/admin/users/${userId}/top-up`, token, {
      method: "POST",
      body: JSON.stringify({ amount, reason })
    }),
  updateUserStatus: (token: string, userId: number, is_active: boolean) =>
    request<User>(`/admin/users/${userId}/status`, token, {
      method: "PATCH",
      body: JSON.stringify({ is_active })
    }),
  resetPassword: (token: string, userId: number, password: string) =>
    request<User>(`/admin/users/${userId}/reset-password`, token, {
      method: "POST",
      body: JSON.stringify({ password })
    }),
  reports: (token: string) => request<AdminReport>("/admin/reports", token),
  syncRuns: (token: string) => request<SyncRun[]>("/admin/sync-runs", token),
  retrySettlements: (token: string) =>
    request<{ settled: number }>("/admin/settlements/retry", token, {
      method: "POST",
      body: JSON.stringify({})
    }),
  syncMetadata: (token: string) =>
    request<{ status: string; requests: number; message: string }>("/admin/sync/metadata", token, {
      method: "POST",
      body: JSON.stringify({})
    }),
  syncResults: (token: string) =>
    request<{ status: string; requests: number; message: string }>("/admin/sync/results", token, {
      method: "POST",
      body: JSON.stringify({})
    }),
  updateMatchScore: (token: string, matchId: number, payload: { home_score?: number | null; away_score?: number | null; home_penalties?: number | null; away_penalties?: number | null; status?: string }) =>
    request<{ match_id: number; home_score: number | null; away_score: number | null; home_penalties: number | null; away_penalties: number | null; status: string; settled: number }>(
      `/admin/matches/${matchId}/score`, token, {
        method: "PATCH",
        body: JSON.stringify(payload)
      })
};
