import { useCallback, useEffect, useMemo, useState } from "react";

import { api } from "./api/client";
import {
  AdminView,
  HistoryView,
  LeaderboardView,
  LoginScreen,
  MatchDetailView,
  MatchesView,
  Shell
} from "./components/views";
import type { AdminReport, Bet, LeaderboardRow, Match, PlaceBetPayload, SyncRun, TabKey, User } from "./types";

const TOKEN_STORAGE_KEY = "worldcup_predict_token";
const AUTO_REFRESH_MS = 60_000;

function isOpenUpcomingMatch(match: Match): boolean {
  return ["SCHEDULED", "NS", "TBD"].includes(match.status) && new Date(match.starts_at).getTime() > Date.now();
}

export default function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [user, setUser] = useState<User | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [history, setHistory] = useState<Bet[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [report, setReport] = useState<AdminReport | null>(null);
  const [syncRuns, setSyncRuns] = useState<SyncRun[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("matches");
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedMatch = useMemo(
    () => matches.find((match) => match.id === selectedMatchId) ?? matches.find(isOpenUpcomingMatch) ?? matches[0],
    [matches, selectedMatchId]
  );

  const loadPrivateData = useCallback(async (nextToken: string, nextUser: User) => {
    const [matchData, leaderboardData, historyData] = await Promise.all([
      api.matches(nextToken),
      api.leaderboard(nextToken),
      api.history(nextToken)
    ]);
    setMatches(matchData);
    setLeaderboard(leaderboardData);
    setHistory(historyData);
    if (!selectedMatchId && matchData.length) {
      setSelectedMatchId(matchData.find(isOpenUpcomingMatch)?.id ?? matchData[0].id);
    }
    if (nextUser.role.name === "admin") {
      const [usersData, reportData, syncData] = await Promise.all([
        api.users(nextToken),
        api.reports(nextToken),
        api.syncRuns(nextToken)
      ]);
      setUsers(usersData);
      setReport(reportData);
      setSyncRuns(syncData);
    }
  }, [selectedMatchId]);

  useEffect(() => {
    if (!token) {
      return;
    }
    setLoading(true);
    api
      .me(token)
      .then((me) => {
        setUser(me);
        return loadPrivateData(token, me);
      })
      .catch((err: Error) => {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        setToken(null);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [loadPrivateData, token]);

  useEffect(() => {
    if (!token || !user) {
      return;
    }
    const timer = window.setInterval(() => {
      void loadPrivateData(token, user).catch((err: Error) => setError(err.message));
    }, AUTO_REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [loadPrivateData, token, user]);

  async function handleLogin(username: string, password: string) {
    setLoading(true);
    setError(null);
    try {
      const response = await api.login(username, password);
      localStorage.setItem(TOKEN_STORAGE_KEY, response.access_token);
      setToken(response.access_token);
      setUser(response.user);
      await loadPrivateData(response.access_token, response.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể đăng nhập");
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
    setUser(null);
    setMatches([]);
    setLeaderboard([]);
    setHistory([]);
    setActiveTab("matches");
  }

  async function refresh() {
    if (!token || !user) {
      return;
    }
    await loadPrivateData(token, user);
  }

  async function handlePlaceBet(payload: PlaceBetPayload) {
    if (!token) {
      return;
    }
    setPlacing(true);
    setError(null);
    setMessage(null);
    try {
      await api.placeBet(token, payload);
      setMessage("Đã ghi nhận dự đoán và trừ điểm cược.");
      await refresh();
      setActiveTab("history");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể đặt cược");
    } finally {
      setPlacing(false);
    }
  }

  async function handleCreateUser(payload: { username: string; display_name: string; password: string; starting_points: number }) {
    if (!token) return;
    try {
      await api.createUser(token, payload);
      setMessage("Đã tạo tài khoản người chơi.");
      setError(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tạo tài khoản");
    }
  }

  async function handleTopUp(userId: number, amount: number, reason: string) {
    if (!token) return;
    try {
      await api.topUp(token, userId, amount, reason);
      setMessage("Đã cập nhật điểm tài khoản.");
      setError(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể cập nhật điểm");
    }
  }

  async function handleToggleUser(userId: number, isActive: boolean) {
    if (!token) return;
    try {
      await api.updateUserStatus(token, userId, isActive);
      setMessage(isActive ? "Đã mở tài khoản." : "Đã khóa tài khoản.");
      setError(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể cập nhật tài khoản");
    }
  }

  async function handleResetPassword(userId: number, password: string) {
    if (!token) return;
    try {
      await api.resetPassword(token, userId, password);
      setMessage("Đã reset mật khẩu.");
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể reset mật khẩu");
    }
  }

  async function handleRetrySettlements() {
    if (!token) return;
    try {
      const result = await api.retrySettlements(token);
      setMessage(`Đã settle ${result.settled} cược.`);
      setError(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể settle");
    }
  }

  async function handleMetadataSync() {
    if (!token) return;
    try {
      const result = await api.syncMetadata(token);
      setMessage(result.message);
      setError(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể chạy sync");
    }
  }

  async function handleResultSync() {
    if (!token) return;
    try {
      const result = await api.syncResults(token);
      setMessage(result.message);
      setError(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể cập nhật kết quả");
    }
  }

  if (!user) {
    return <LoginScreen loading={loading} error={error} onLogin={handleLogin} />;
  }

  return (
    <Shell user={user} activeTab={activeTab} onTabChange={setActiveTab} onLogout={logout}>
      {message && <div className="toast success">{message}</div>}
      {error && <div className="toast error">{error}</div>}
      {loading && <div className="toast">Đang tải dữ liệu...</div>}

      {activeTab === "matches" && (
        <MatchesView
          matches={matches}
          leaderboard={leaderboard}
          onSelectMatch={(match) => {
            setSelectedMatchId(match.id);
            setActiveTab("detail");
          }}
        />
      )}
      {activeTab === "detail" && selectedMatch && (
        <MatchDetailView match={selectedMatch} onPlaceBet={handlePlaceBet} placing={placing} />
      )}
      {activeTab === "leaderboard" && <LeaderboardView rows={leaderboard} currentUserId={user.id} />}
      {activeTab === "history" && <HistoryView history={history} matches={matches} />}
      {activeTab === "admin" && user.role.name === "admin" && (
        <AdminView
          users={users}
          report={report}
          syncRuns={syncRuns}
          onCreateUser={handleCreateUser}
          onTopUp={handleTopUp}
          onToggleUser={handleToggleUser}
          onResetPassword={handleResetPassword}
          onRetrySettlements={handleRetrySettlements}
          onMetadataSync={handleMetadataSync}
          onResultSync={handleResultSync}
        />
      )}
    </Shell>
  );
}
