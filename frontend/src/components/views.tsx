import {
  Activity,
  BarChart3,
  Bell,
  CheckCircle2,
  ClipboardList,
  Database,
  History,
  LockKeyhole,
  LogOut,
  Minus,
  Plus,
  RotateCcw,
  Shield,
  Target,
  Trophy,
  UserCircle,
  Users,
  Wallet
} from "lucide-react";
import { FormEvent, ReactNode, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";

import { flagFor } from "../data/flags";
import type { AdminBet, AdminReport, Bet, LeaderboardRow, Match, PlaceBetPayload, SyncRun, TabKey, User } from "../types";

type LoginScreenProps = {
  loading: boolean;
  error: string | null;
  onLogin: (username: string, password: string) => Promise<void>;
};

type ShellProps = {
  user: User;
  activeTab: TabKey;
  children: ReactNode;
  onTabChange: (tab: TabKey) => void;
  onLogout: () => void;
};

type NavItem = {
  key: TabKey;
  label: string;
  icon: LucideIcon;
};

const fmt = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 });
const fmtOne = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 });
const marketOrder = ["match_result", "handicap", "total_goals", "draw_no_bet", "btts", "corners_total", "cards_total"];

function num(value: string | number | null | undefined): number {
  return Number(value ?? 0);
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function isOpenUpcomingMatch(match: Match): boolean {
  return ["SCHEDULED", "NS", "TBD"].includes(match.status) && new Date(match.starts_at).getTime() > Date.now();
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function LoginScreen({ loading, error, onLogin }: LoginScreenProps) {
  const [username, setUsername] = useState("demo");
  const [password, setPassword] = useState("demo123");

  async function submit(event: FormEvent) {
    event.preventDefault();
    await onLogin(username, password);
  }

  return (
    <main className="login-screen">
      <section className="login-panel glass-card">
        <div className="brand-lockup">
          <div className="brand-mark">
            <Trophy size={28} />
          </div>
          <div>
            <h1>WorldCup Predict</h1>
            <p>Private points league</p>
          </div>
        </div>

        <form className="login-form" onSubmit={submit}>
          <label>
            Tài khoản
            <input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" />
          </label>
          <label>
            Mật khẩu
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
            />
          </label>
          <button className="primary-button" disabled={loading}>
            <LockKeyhole size={18} />
            Đăng nhập
          </button>
        </form>

        {error && <div className="form-error">{error}</div>}
        <div className="demo-credentials">
          <span>demo / demo123</span>
          <span>admin / admin123</span>
        </div>
      </section>

      <section className="login-visual">
        <div className="stadium-card">
          <div className="live-pill">World Cup 2026</div>
          <div className="hero-teams">
            <div className="flag-orb">🇧🇷</div>
            <span>VS</span>
            <div className="flag-orb">🇫🇷</div>
          </div>
          <h2>Predict every match. Climb the table.</h2>
          <div className="visual-stats">
            <div>
              <strong>104</strong>
              <span>Matches</span>
            </div>
            <div>
              <strong>12</strong>
              <span>Groups</span>
            </div>
            <div>
              <strong>1</strong>
              <span>Champion</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export function Shell({ user, activeTab, children, onTabChange, onLogout }: ShellProps) {
  const navItems: NavItem[] = [
    { key: "matches", label: "Matches", icon: Activity },
    { key: "detail", label: "Predict", icon: Target },
    { key: "leaderboard", label: "Rankings", icon: BarChart3 },
    { key: "history", label: "History", icon: History }
  ];
  if (user.role.name === "admin") {
    navItems.push({ key: "admin", label: "Admin", icon: Shield });
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span>WorldCup Predict</span>
          <small>Group Stage Live</small>
        </div>
        <nav className="nav-stack">
          {navItems.map((item) => (
            <button
              key={item.key}
              className={`nav-button ${activeTab === item.key ? "active" : ""}`}
              onClick={() => onTabChange(item.key)}
            >
              <item.icon size={20} />
              {item.label}
            </button>
          ))}
        </nav>
        <button className="primary-button wide" onClick={() => onTabChange("detail")}>
          Place Prediction
        </button>
        <button className="nav-button subtle" onClick={onLogout}>
          <LogOut size={20} />
          Logout
        </button>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div className="topbar-brand">WorldCup Predict</div>
          <div className="topbar-actions">
            <div className="wallet-chip">
              <Wallet size={16} />
              <span>{fmt.format(num(user.wallet_balance))} pts</span>
            </div>
            <button className="icon-button" aria-label="Notifications">
              <Bell size={20} />
            </button>
            <div className="avatar">{initials(user.display_name)}</div>
          </div>
        </header>
        <div className="page-content">{children}</div>
      </main>

      <nav className="mobile-nav">
        {navItems.map((item) => (
          <button key={item.key} className={activeTab === item.key ? "active" : ""} onClick={() => onTabChange(item.key)}>
            <item.icon size={21} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

export function MatchesView({
  matches,
  leaderboard,
  onSelectMatch
}: {
  matches: Match[];
  leaderboard: LeaderboardRow[];
  onSelectMatch: (match: Match) => void;
}) {
  const featured = matches.find(isOpenUpcomingMatch) ?? matches[0];
  const upcoming = matches.filter((match) => isOpenUpcomingMatch(match) && match.id !== featured?.id).slice(0, 3);
  const featuredOdd = featured?.markets.find((market) => market.market_key === "correct_score")?.odds_multiplier ?? "2.45";

  if (!featured) {
    return <EmptyState title="Chưa có lịch đấu" body="Backend chưa có dữ liệu trận đấu." />;
  }

  return (
    <div className="dashboard-grid">
      <section className="main-column">
        <div className="hero-match stadium-surface">
          <div className="hero-match-copy">
            <span className="section-kicker">Trận đấu tâm điểm</span>
            <div className="hero-versus">
              <TeamLockup team={featured.home_team} large />
              <span className="vs-text">VS</span>
              <TeamLockup team={featured.away_team} large />
            </div>
            <div className="hero-meta">
              <span>{formatDate(featured.starts_at)}</span>
              <span>{featured.stage}</span>
              <span>x{fmtOne.format(num(featuredOdd))} pts</span>
            </div>
            <button className="primary-button hero-cta" onClick={() => onSelectMatch(featured)}>
              Dự đoán ngay
            </button>
          </div>
        </div>

        <div className="section-heading">
          <h2>Trận đấu sắp tới</h2>
          <span>{upcoming.length + 1} trận mở kèo</span>
        </div>

        <div className="match-card-grid">
          {upcoming.map((match) => (
            <MatchCard key={match.id} match={match} onSelect={() => onSelectMatch(match)} />
          ))}
        </div>
      </section>

      <aside className="side-column">
        <section className="glass-card compact">
          <div className="card-title">
            <Trophy size={18} />
            Bảng Xếp Hạng
          </div>
          <div className="mini-leaderboard">
            {leaderboard.slice(0, 5).map((row) => (
              <div key={row.user_id} className="mini-row">
                <span className="rank">{row.rank}</span>
                <div className="avatar small">{initials(row.display_name)}</div>
                <div>
                  <strong>{row.display_name}</strong>
                  <small>{row.accuracy}% Accuracy</small>
                </div>
                <b>{fmt.format(num(row.score))}</b>
              </div>
            ))}
          </div>
        </section>

        <section className="glass-card compact">
          <div className="card-title">
            <ClipboardList size={18} />
            MVP Markets
          </div>
          <div className="market-list">
            <span>Correct score</span>
            <span>1X2</span>
            <span>Over / Under</span>
            <span>BTTS</span>
            <span>Góc / Thẻ nội bộ</span>
          </div>
        </section>
      </aside>
    </div>
  );
}

function MatchCard({ match, onSelect }: { match: Match; onSelect: () => void }) {
  const homeOdd = match.markets.find((market) => market.market_key === "match_result" && market.selection_key === "home");
  return (
    <article className="match-card glass-card">
      <div className="match-card-top">
        <span>{formatDate(match.starts_at)}</span>
        <span>↗ x{fmtOne.format(num(homeOdd?.odds_multiplier ?? 1.8))}</span>
      </div>
      <div className="match-card-teams">
        <TeamLockup team={match.home_team} />
        <span className="muted">VS</span>
        <TeamLockup team={match.away_team} />
      </div>
      <div className="consensus-bar">
        <div style={{ width: "58%" }} />
      </div>
      <button className="ghost-button" onClick={onSelect}>
        Dự đoán ngay
      </button>
    </article>
  );
}

export function MatchDetailView({
  match,
  placing,
  onPlaceBet
}: {
  match: Match;
  placing: boolean;
  onPlaceBet: (payload: PlaceBetPayload) => Promise<void>;
}) {
  const [homeScore, setHomeScore] = useState(2);
  const [awayScore, setAwayScore] = useState(1);
  const [stake, setStake] = useState(100);
  const [activeMarketId, setActiveMarketId] = useState<number | null>(null);

  const scoreMarket = match.markets.find((market) => market.market_key === "correct_score");
  const selectedMarket = match.markets.find((market) => market.id === activeMarketId) ?? scoreMarket;
  const multiplier = num(selectedMarket?.odds_multiplier ?? 1);
  const potential = stake * multiplier;
  const groupedMarkets = useMemo(() => {
    const markets = match.markets.filter((market) => market.market_key !== "correct_score");
    const knownGroups = marketOrder
      .map((key) => {
        const items = markets.filter((market) => market.market_key === key);
        return items.length ? { key, label: items[0].label, items } : null;
      })
      .filter(Boolean) as Array<{ key: string; label: string; items: typeof markets }>;
    const knownKeys = new Set(marketOrder);
    const extraGroups = markets
      .filter((market) => !knownKeys.has(market.market_key))
      .reduce<Array<{ key: string; label: string; items: typeof markets }>>((groups, market) => {
        const group = groups.find((item) => item.key === market.market_key);
        if (group) {
          group.items.push(market);
        } else {
          groups.push({ key: market.market_key, label: market.label, items: [market] });
        }
        return groups;
      }, []);
    return [...knownGroups, ...extraGroups];
  }, [match.markets]);

  async function submitScoreBet() {
    await onPlaceBet({
      match_id: match.id,
      market_key: "correct_score",
      selection_key: `${homeScore}-${awayScore}`,
      selection_label: `${homeScore} - ${awayScore}`,
      selection: { home_score: homeScore, away_score: awayScore },
      stake
    });
  }

  async function submitMarketBet(marketId: number) {
    const market = match.markets.find((item) => item.id === marketId);
    if (!market) return;
    await onPlaceBet({
      match_id: match.id,
      market_id: market.id,
      market_key: market.market_key,
      selection_key: market.selection_key,
      selection_label: market.selection_label,
      selection: { line: market.line },
      stake
    });
  }

  return (
    <div className="detail-page">
      <section className="score-hero stadium-surface">
        <TeamLockup team={match.home_team} large />
        <div className="score-center">
          <span className={match.status === "SCHEDULED" ? "status-pill" : "status-pill live"}>{match.status}</span>
          <div className="score-display">
            {match.home_score ?? "?"} : {match.away_score ?? "?"}
          </div>
          <span>{match.stage}</span>
        </div>
        <TeamLockup team={match.away_team} large />
      </section>

      <div className="detail-grid">
        <section className="glass-card prediction-card">
          <div className="section-heading inline">
            <h2>Dự đoán tỷ số</h2>
            <span>Hạn chót: {formatDate(match.starts_at)}</span>
          </div>
          <div className="score-picker">
            <ScoreStepper label={match.home_team.name} value={homeScore} onChange={setHomeScore} />
            <span className="score-dash">-</span>
            <ScoreStepper label={match.away_team.name} value={awayScore} onChange={setAwayScore} />
          </div>
          <label className="stake-input">
            Điểm cược
            <input type="number" min={10} step={10} value={stake} onChange={(event) => setStake(Number(event.target.value))} />
          </label>
          <button className="primary-button wide" disabled={placing} onClick={submitScoreBet}>
            <CheckCircle2 size={18} />
            Xác nhận dự đoán
          </button>
        </section>

        <section className="glass-card points-card">
          <h2>Points at stake</h2>
          <div className="points-row">
            <span>Hệ số nhân</span>
            <strong>x{fmtOne.format(multiplier)}</strong>
          </div>
          <div className="points-row">
            <span>Điểm cược</span>
            <strong>{fmt.format(stake)} pts</strong>
          </div>
          <div className="points-row highlight">
            <span>Lợi nhuận dự kiến</span>
            <strong>+{fmt.format(potential - stake)} pts</strong>
          </div>
          <div className="payout-meter">
            <div style={{ width: `${Math.min(100, multiplier * 28)}%` }} />
          </div>
        </section>
      </div>

      <section className="glass-card markets-panel">
        <div className="section-heading inline">
          <h2>Chọn kèo khác</h2>
          <span>90 phút chính thức</span>
        </div>
        <div className="market-group-list">
          {groupedMarkets.map((group) => (
            <div className="market-group" key={group.key}>
              <div className="market-group-title">
                <h3>{group.label}</h3>
                <span>{group.items.length} lựa chọn</span>
              </div>
              <div className={`market-options count-${Math.min(group.items.length, 3)}`}>
                {group.items.map((market) => (
                  <button
                    key={market.id}
                    className={`market-choice ${activeMarketId === market.id ? "active" : ""}`}
                    onClick={() => {
                      setActiveMarketId(market.id);
                      void submitMarketBet(market.id);
                    }}
                    disabled={placing}
                  >
                    <strong>{market.selection_label}</strong>
                    {market.line != null && <span>Chấp {market.line}</span>}
                    <small>x{fmtOne.format(num(market.odds_multiplier))} · {market.source}</small>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ScoreStepper({ label, value, onChange }: { label: string; value: number; onChange: (next: number) => void }) {
  return (
    <div className="score-stepper">
      <span>{label}</span>
      <div>
        <button onClick={() => onChange(Math.max(0, value - 1))}>
          <Minus size={16} />
        </button>
        <strong>{value}</strong>
        <button onClick={() => onChange(value + 1)}>
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}

export function LeaderboardView({ rows, currentUserId }: { rows: LeaderboardRow[]; currentUserId: number }) {
  return (
    <section className="leaderboard-page">
      <div className="section-heading">
        <div>
          <h1>Bảng Xếp Hạng</h1>
          <p>Dựa trên net points từ các cược đã settle.</p>
        </div>
        <div className="segmented">
          <button className="active">Tuần này</button>
          <button>Cả mùa</button>
        </div>
      </div>

      <div className="podium">
        {rows.slice(0, 3).map((row) => (
          <article key={row.user_id} className={`podium-card rank-${row.rank}`}>
            <div className="avatar large">{initials(row.display_name)}</div>
            <span>#{row.rank}</span>
            <h2>{row.display_name}</h2>
            <strong>{fmt.format(num(row.score))}</strong>
            <small>{row.accuracy}% Accuracy</small>
          </article>
        ))}
      </div>

      <div className="table-card glass-card">
        <div className="table-row table-head">
          <span>Hạng</span>
          <span>Người chơi</span>
          <span>Tỉ lệ đúng</span>
          <span>ROI</span>
          <span>Điểm</span>
        </div>
        {rows.map((row) => (
          <div key={row.user_id} className={`table-row ${row.user_id === currentUserId ? "current" : ""}`}>
            <strong>#{row.rank}</strong>
            <span>{row.display_name}</span>
            <span>{row.accuracy}%</span>
            <span>{row.roi}%</span>
            <b>{fmt.format(num(row.score))}</b>
          </div>
        ))}
      </div>
    </section>
  );
}

export function HistoryView({ history, matches }: { history: Bet[]; matches: Match[] }) {
  const matchMap = useMemo(() => new Map(matches.map((match) => [match.id, match])), [matches]);
  const total = history.reduce((sum, bet) => sum + num(bet.points_delta), 0);
  const won = history.filter((bet) => bet.status === "won").length;

  return (
    <section className="history-page">
      <div className="profile-hero stadium-surface">
        <div className="avatar profile">YOU</div>
        <div>
          <span className="status-pill">Premium Predictor</span>
          <h1>Người chơi #123</h1>
          <p>{won} dự đoán thắng · Net {fmt.format(total)} pts</p>
        </div>
      </div>

      <div className="stats-strip">
        <div className="glass-card">
          <span>Tổng net</span>
          <strong>{fmt.format(total)} pts</strong>
        </div>
        <div className="glass-card">
          <span>Dự đoán thắng</span>
          <strong>{won}</strong>
        </div>
        <div className="glass-card">
          <span>Lịch sử</span>
          <strong>{history.length}</strong>
        </div>
      </div>

      <div className="section-heading">
        <h2>Lịch sử dự đoán</h2>
        <span>{history.length} bet</span>
      </div>
      <div className="history-list">
        {history.map((bet) => {
          const match = bet.match_id ? matchMap.get(bet.match_id) : null;
          return (
            <article key={bet.id} className={`history-card ${bet.status}`}>
              <div>
                <strong>
                  {match ? `${match.home_team.name} vs ${match.away_team.name}` : bet.market_key}
                </strong>
                <span>{formatDate(bet.placed_at)}</span>
              </div>
              <div>
                <small>Dự đoán</small>
                <b>{bet.selection_label}</b>
              </div>
              <div>
                <small>Stake</small>
                <b>{fmt.format(num(bet.stake))}</b>
              </div>
              <div className="history-result">
                <span>{bet.status}</span>
                <strong>{num(bet.points_delta) >= 0 ? "+" : ""}{fmt.format(num(bet.points_delta))} pts</strong>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function AdminView({
  users,
  adminBets,
  matches,
  report,
  syncRuns,
  onCreateUser,
  onTopUp,
  onToggleUser,
  onResetPassword,
  onRetrySettlements,
  onMetadataSync,
  onResultSync,
  onUpdateScore
}: {
  users: User[];
  adminBets: AdminBet[];
  matches: Match[];
  report: AdminReport | null;
  syncRuns: SyncRun[];
  onCreateUser: (payload: { username: string; display_name: string; password: string; starting_points: number }) => Promise<void>;
  onTopUp: (userId: number, amount: number, reason: string) => Promise<void>;
  onToggleUser: (userId: number, isActive: boolean) => Promise<void>;
  onResetPassword: (userId: number, password: string) => Promise<void>;
  onRetrySettlements: () => Promise<void>;
  onMetadataSync: () => Promise<void>;
  onResultSync: () => Promise<void>;
  onUpdateScore: (matchId: number, homeScore: number, awayScore: number, status: string) => Promise<void>;
}) {
  const [createForm, setCreateForm] = useState({ username: "", display_name: "", password: "demo123", starting_points: 1000 });
  const [topUp, setTopUp] = useState({ userId: 0, amount: 500, reason: "Admin top-up" });
  const [resetPassword, setResetPassword] = useState("demo123");
  const [scoreForm, setScoreForm] = useState({ matchId: 0, homeScore: 0, awayScore: 0, status: "FT" });

  const playerOptions = users.filter((user) => user.role.name === "player");

  async function submitCreate(event: FormEvent) {
    event.preventDefault();
    await onCreateUser(createForm);
    setCreateForm({ username: "", display_name: "", password: "demo123", starting_points: 1000 });
  }

  async function submitTopUp(event: FormEvent) {
    event.preventDefault();
    const userId = topUp.userId || playerOptions[0]?.id;
    if (userId) {
      await onTopUp(userId, topUp.amount, topUp.reason);
    }
  }

  return (
    <section className="admin-page">
      <div className="section-heading">
        <div>
          <h1>Admin Dashboard</h1>
          <p>Quản lý tài khoản, điểm và settlement.</p>
        </div>
        <div className="admin-actions">
          <button className="ghost-button" onClick={() => void onMetadataSync()}>
            <Database size={16} />
            Sync metadata
          </button>
          <button className="ghost-button" onClick={() => void onResultSync()}>
            <RotateCcw size={16} />
            Sync results
          </button>
          <button className="primary-button" onClick={() => void onRetrySettlements()}>
            <RotateCcw size={16} />
            Retry settlement
          </button>
        </div>
      </div>

      <div className="admin-metrics">
        <MetricCard icon={Users} label="Players" value={report?.players ?? 0} />
        <MetricCard icon={Wallet} label="Wallet balance" value={`${fmt.format(num(report?.total_wallet_balance))} pts`} />
        <MetricCard icon={Target} label="Total staked" value={`${fmt.format(num(report?.total_staked))} pts`} />
        <MetricCard icon={Trophy} label="Settled net" value={`${fmt.format(num(report?.settled_net_points))} pts`} />
      </div>

      <div className="admin-grid">
        <form className="glass-card admin-form" onSubmit={submitCreate}>
          <h2>Tạo tài khoản</h2>
          <input placeholder="username" value={createForm.username} onChange={(event) => setCreateForm({ ...createForm, username: event.target.value })} />
          <input placeholder="Tên hiển thị" value={createForm.display_name} onChange={(event) => setCreateForm({ ...createForm, display_name: event.target.value })} />
          <input placeholder="Mật khẩu" value={createForm.password} onChange={(event) => setCreateForm({ ...createForm, password: event.target.value })} />
          <input
            type="number"
            placeholder="Điểm ban đầu"
            value={createForm.starting_points}
            onChange={(event) => setCreateForm({ ...createForm, starting_points: Number(event.target.value) })}
          />
          <button className="primary-button">Tạo user</button>
        </form>

        <form className="glass-card admin-form" onSubmit={submitTopUp}>
          <h2>Nạp / trừ điểm</h2>
          <select value={topUp.userId} onChange={(event) => setTopUp({ ...topUp, userId: Number(event.target.value) })}>
            <option value={0}>Chọn người chơi</option>
            {playerOptions.map((player) => (
              <option key={player.id} value={player.id}>
                {player.display_name}
              </option>
            ))}
          </select>
          <input type="number" value={topUp.amount} onChange={(event) => setTopUp({ ...topUp, amount: Number(event.target.value) })} />
          <input value={topUp.reason} onChange={(event) => setTopUp({ ...topUp, reason: event.target.value })} />
          <button className="primary-button">Cập nhật điểm</button>
        </form>

        <section className="glass-card admin-form">
          <h2>Reset mật khẩu</h2>
          <input value={resetPassword} onChange={(event) => setResetPassword(event.target.value)} />
          <div className="user-action-grid">
            {playerOptions.slice(0, 4).map((player) => (
              <button key={player.id} className="ghost-button" onClick={() => void onResetPassword(player.id, resetPassword)}>
                {player.display_name}
              </button>
            ))}
          </div>
        </section>
      </div>

      <section className="glass-card users-table">
        <div className="section-heading inline">
          <h2>Tài khoản</h2>
          <span>{users.length} user</span>
        </div>
        {users.map((item) => (
          <div key={item.id} className="user-row">
            <div className="avatar small">{initials(item.display_name)}</div>
            <div>
              <strong>{item.display_name}</strong>
              <small>@{item.username} · {item.role.name}</small>
            </div>
            <b>{fmt.format(num(item.wallet_balance))} pts</b>
            <button className={item.is_active ? "ghost-button danger" : "ghost-button"} onClick={() => void onToggleUser(item.id, !item.is_active)}>
              {item.is_active ? "Khóa" : "Mở"}
            </button>
          </div>
        ))}
      </section>

      <section className="glass-card admin-bets-table">
        <div className="section-heading inline">
          <h2>Cược gần nhất</h2>
          <span>{adminBets.length} bet</span>
        </div>
        {adminBets.slice(0, 20).map((bet) => {
          const match = bet.match_id ? matches.find((item) => item.id === bet.match_id) : null;
          return (
            <div key={bet.id} className={`admin-bet-row ${bet.status}`}>
              <div>
                <strong>{bet.user.display_name}</strong>
                <small>@{bet.user.username} · {formatDate(bet.placed_at)}</small>
              </div>
              <div>
                <small>{match ? `${match.home_team.name} vs ${match.away_team.name}` : bet.market_key}</small>
                <b>{bet.selection_label}</b>
              </div>
              <div>
                <small>{bet.market_key}</small>
                <b>{fmt.format(num(bet.stake))} pts · x{fmtOne.format(num(bet.locked_multiplier))}</b>
              </div>
              <div className="history-result">
                <span>{bet.status}</span>
                <strong>{num(bet.points_delta) >= 0 ? "+" : ""}{fmt.format(num(bet.points_delta))} pts</strong>
              </div>
            </div>
          );
        })}
        {!adminBets.length && <p className="empty-copy">Chưa có cược nào.</p>}
      </section>

      <section className="glass-card score-update-panel">
        <div className="section-heading inline">
          <h2>Cập nhật tỷ số</h2>
          <span>Settle tự động khi kết thúc</span>
        </div>
        <div className="score-update-grid">
          <select
            value={scoreForm.matchId}
            onChange={(e) => {
              const match = matches.find((m) => m.id === Number(e.target.value));
              setScoreForm({
                matchId: Number(e.target.value),
                homeScore: match?.home_score ?? 0,
                awayScore: match?.away_score ?? 0,
                status: match?.status ?? "FT",
              });
            }}
          >
            <option value={0}>Chọn trận đấu</option>
            {matches.map((m) => (
              <option key={m.id} value={m.id}>
                {m.home_team.name} vs {m.away_team.name} · {m.status} {m.home_score ?? "-"}:{m.away_score ?? "-"}
              </option>
            ))}
          </select>
          <div className="score-inputs">
            <input
              type="number"
              min={0}
              placeholder="Nhà"
              value={scoreForm.homeScore}
              onChange={(e) => setScoreForm({ ...scoreForm, homeScore: Number(e.target.value) })}
            />
            <span className="score-sep">-</span>
            <input
              type="number"
              min={0}
              placeholder="Khách"
              value={scoreForm.awayScore}
              onChange={(e) => setScoreForm({ ...scoreForm, awayScore: Number(e.target.value) })}
            />
          </div>
          <select value={scoreForm.status} onChange={(e) => setScoreForm({ ...scoreForm, status: e.target.value })}>
            <option value="SCHEDULED">SCHEDULED</option>
            <option value="NS">NS (Not Started)</option>
            <option value="1H">1H (Hiệp 1)</option>
            <option value="HT">HT (Nghỉ giải lao)</option>
            <option value="2H">2H (Hiệp 2)</option>
            <option value="FT">FT (Kết thúc)</option>
            <option value="AET">AET (Hiệp phụ)</option>
            <option value="PEN">PEN (Penalty)</option>
            <option value="PST">PST (Hoãn)</option>
            <option value="CANC">CANC (Hủy)</option>
          </select>
          <button
            className="primary-button"
            disabled={!scoreForm.matchId}
            onClick={() => void onUpdateScore(scoreForm.matchId, scoreForm.homeScore, scoreForm.awayScore, scoreForm.status)}
          >
            Cập nhật &amp; Settle
          </button>
        </div>

        <div className="matches-score-table">
          {matches.map((m) => (
            <div key={m.id} className="match-score-row">
              <span className="match-score-teams">
                {m.home_team.name} <b>vs</b> {m.away_team.name}
              </span>
              <span className={`status-pill ${["FT","AET","PEN"].includes(m.status) ? "live" : ""}`}>{m.status}</span>
              <strong className="match-score-result">
                {m.home_score ?? "?"} : {m.away_score ?? "?"}
              </strong>
            </div>
          ))}
        </div>
      </section>

      <section className="glass-card sync-table">
        <div className="section-heading inline">
          <h2>Sync runs</h2>
          <span>{syncRuns.length} jobs</span>
        </div>
        {syncRuns.slice(0, 5).map((run) => (
          <div key={run.id} className="sync-row">
            <span>{run.provider}</span>
            <strong>{run.job_type}</strong>
            <b>{run.status}</b>
            <small>{run.message}</small>
          </div>
        ))}
      </section>
    </section>
  );
}

function MetricCard({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string | number }) {
  return (
    <div className="glass-card metric-card">
      <Icon size={20} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function TeamLockup({ team, large = false }: { team: Match["home_team"]; large?: boolean }) {
  return (
    <div className={`team-lockup ${large ? "large" : ""}`}>
      <div className="flag-orb">{flagFor(team.code)}</div>
      <strong>{team.name}</strong>
      <small>{team.code}</small>
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <section className="empty-state glass-card">
      <Trophy size={32} />
      <h2>{title}</h2>
      <p>{body}</p>
    </section>
  );
}
