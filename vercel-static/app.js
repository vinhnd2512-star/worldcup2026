const app = document.getElementById("app");

const state = {
  client: null,
  session: null,
  profile: null,
  matches: [],
  bracketMatches: [],
  teams: [],
  teamPlayers: [],
  teamLineups: [],
  matchStats: [],
  outrightMarkets: [],
  bets: [],
  leaderboard: [],
  selectedLeaderboardUserId: "",
  selectedLeaderboardBets: null,
  leaderboardDetailError: "",
  users: [],
  report: null,
  syncRuns: [],
  matchResults: [],
  adminBets: [],
  walletLedger: [],
  auditLogs: [],
  userReport: [],
  marketReport: [],
  deploymentHealth: null,
  providerSync: {
    isRunning: false,
    startedAt: "",
    finishedAt: "",
    result: null,
    error: ""
  },
  adminFilters: {
    userId: "",
    dateFrom: "",
    dateTo: ""
  },
  adminPredictionUserId: "",
  adminPredictionBets: null,
  adminPredictionError: "",
  active: "matches",
  selectedMatchId: null,
  selectedTeamId: null,
  selectedRoleGroup: "",
  betModalMatchId: null,
  betModalMarketGroup: "basic",
  betModalDraft: {},
  confirmRebetMatchId: null,
  notificationPanelOpen: false,
  profileMenuOpen: false,
  passwordChange: {
    open: false,
    loading: false,
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  },
  goldenBootSearch: "",
  winnerSearch: "",
  lastPredictionBetId: null,
  isSubmittingBet: false,
  authLoading: "",
  authDraft: {
    loginUsername: "",
    signupUsername: "",
    signupDisplayName: ""
  },
  actionLoading: "",
  predictionStatsTab: "upcoming",
  matchFilter: "upcoming",
  scheduleSheet: "upcoming",
  groupResultsOpen: {},
  syncHelpOpen: false,
  adminSyncMenuOpen: false,
  adminExportMenuOpen: false,
  matchSearch: "",
  matchSearchPanelOpen: false,
  matchSearchQuery: "",
  selectedCalendarDate: "",
  calendarMonth: "",
  sidebarCollapsed: localStorage.getItem("WCP_SIDEBAR_COLLAPSED") === "true",
  message: "",
  error: ""
};

const flags = {
  ALG: "🇩🇿",
  ARG: "🇦🇷",
  AUS: "🇦🇺",
  AUT: "🇦🇹",
  BEL: "🇧🇪",
  BIH: "🇧🇦",
  BRA: "🇧🇷",
  CAN: "🇨🇦",
  CIV: "🇨🇮",
  COD: "🇨🇩",
  COL: "🇨🇴",
  CPV: "🇨🇻",
  CRO: "🇭🇷",
  CUW: "🇨🇼",
  CZE: "🇨🇿",
  ECU: "🇪🇨",
  EGY: "🇪🇬",
  ENG: "🏴",
  ESP: "🇪🇸",
  FRA: "🇫🇷",
  GER: "🇩🇪",
  GHA: "🇬🇭",
  HAI: "🇭🇹",
  IRQ: "🇮🇶",
  IRN: "🇮🇷",
  JOR: "🇯🇴",
  JPN: "🇯🇵",
  KOR: "🇰🇷",
  KSA: "🇸🇦",
  MAR: "🇲🇦",
  MEX: "🇲🇽",
  NED: "🇳🇱",
  NOR: "🇳🇴",
  NZL: "🇳🇿",
  PAN: "🇵🇦",
  PAR: "🇵🇾",
  POR: "🇵🇹",
  QAT: "🇶🇦",
  RSA: "🇿🇦",
  SCO: "🏴",
  SEN: "🇸🇳",
  SUI: "🇨🇭",
  SWE: "🇸🇪",
  TUN: "🇹🇳",
  TUR: "🇹🇷",
  URU: "🇺🇾",
  USA: "🇺🇸",
  UZB: "🇺🇿"
};

const flagImages = {
  ENG: "https://flagcdn.com/w40/gb-eng.png",
  SCO: "https://flagcdn.com/w40/gb-sct.png"
};

const navItems = [
  ["matches", "Lịch thi đấu"],
  ["groups", "Bảng kết quả (Vòng loại)"],
  ["detail", "Dự đoán"],
  ["bracket", "Nhánh đấu (sau vòng loại)"],
  ["leaderboard", "Bảng xếp hạng"],
  ["predictionStats", "Thống kê dự đoán"],
  ["guide", "Hướng dẫn"]
];

const fmt = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 });
const fmtOne = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 });
const stakeFmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const moneyFmt = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const betDetailSelect = "*,user:profiles!bets_user_id_fkey(username,display_name),match:matches(*,home_team:teams!matches_home_team_id_fkey(*),away_team:teams!matches_away_team_id_fkey(*))";

boot();

async function boot() {
  const config = await loadConfig();
  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    renderConfigScreen();
    return;
  }

  state.client = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
  const { data } = await state.client.auth.getSession();
  state.session = data.session;
  state.client.auth.onAuthStateChange((_event, session) => {
    state.session = session;
    if (!session) {
      state.profile = null;
      renderLogin();
    }
  });

  if (!state.session) {
    renderLogin();
    return;
  }
  await loadData();
}

async function loadConfig() {
  try {
    const response = await fetch("/api/config");
    if (response.ok) {
      const remote = await response.json();
      if (remote.supabaseUrl && remote.supabaseAnonKey) {
        return remote;
      }
    }
  } catch {
    // Local file preview has no Vercel function.
  }
  return {
    supabaseUrl: localStorage.getItem("WCP_SUPABASE_URL") || "",
    supabaseAnonKey: localStorage.getItem("WCP_SUPABASE_ANON_KEY") || ""
  };
}

function renderWorldCupLogo(variant = "shell") {
  return `
    <span class="wc-logo wc-logo-${escapeHtml(variant)}" aria-hidden="true">
      <svg viewBox="0 0 64 64" role="img" focusable="false">
        <path class="wc-logo-cup" d="M21 10h22v9c0 8-4.7 14.7-11 16.2C25.7 33.7 21 27 21 19v-9Z" />
        <path class="wc-logo-handle" d="M21 15h-7c0 8.2 4.8 13 11 13M43 15h7c0 8.2-4.8 13-11 13" />
        <path class="wc-logo-stem" d="M32 35v9M24 50h16M27 44h10" />
        <circle class="wc-logo-ball" cx="46" cy="46" r="10" />
        <path class="wc-logo-ball-line" d="M46 36v20M36 46h20M39 39c4 3.2 9.8 3.2 14 0M39 53c4-3.2 9.8-3.2 14 0" />
      </svg>
    </span>
  `;
}

function renderBouncingBall(label = "Loading", size = "small") {
  return `
    <span class="bouncing-ball-loader ${escapeHtml(size)}" role="status" aria-live="polite">
      <span class="bouncing-ball" aria-hidden="true">
        <svg viewBox="0 0 64 64" focusable="false">
          <circle cx="32" cy="32" r="27" />
          <path d="M32 5v54M5 32h54M13 14c11 8 27 8 38 0M13 50c11-8 27-8 38 0" />
        </svg>
      </span>
      <span>${escapeHtml(label)}</span>
    </span>
  `;
}

function friendlyAuthError(error) {
  const message = error?.message || String(error || "");
  const lower = message.toLowerCase();
  if (lower.includes("already registered") || lower.includes("already exists") || lower.includes("duplicate")) {
    return "Tài khoản hoặc email này đã tồn tại. Hãy đăng nhập hoặc chọn username khác.";
  }
  if (lower.includes("signup") && lower.includes("disabled")) {
    return "Supabase đang tắt public signup. Hãy bật Auth > Signups hoặc nhờ admin tạo tài khoản.";
  }
  if (lower.includes("password")) {
    return "Mật khẩu chưa hợp lệ. Vui lòng dùng mật khẩu tối thiểu 6 ký tự.";
  }
  if (lower.includes("database") || lower.includes("profile") || lower.includes("trigger")) {
    return "Không thể tạo hồ sơ người chơi. Hãy thử username khác hoặc báo admin kiểm tra trigger profiles.";
  }
  if (lower.includes("invalid login") || lower.includes("invalid credentials")) {
    return "Sai tài khoản hoặc mật khẩu.";
  }
  return message || "Không thể xử lý yêu cầu đăng nhập.";
}

function renderConfigScreen() {
  app.innerHTML = `
    <main class="login-screen">
      <section class="login-card glass-card">
        <div class="brand-mark">${renderWorldCupLogo("hero")}<span>WC</span></div>
        <h1>WC 2026</h1>
        <h2>WorldCup Predict</h2>
        <p>Nhập cấu hình Supabase để chạy bản static không cần cài package.</p>
        <form class="form-grid" id="config-form">
          <label>Supabase URL<input id="supabase-url" placeholder="https://xxxx.supabase.co" required></label>
          <label>Anon key<input id="supabase-anon-key" required></label>
          <button class="primary-button wide">Lưu cấu hình</button>
        </form>
      </section>
    </main>
  `;
  document.getElementById("config-form").addEventListener("submit", (event) => {
    event.preventDefault();
    localStorage.setItem("WCP_SUPABASE_URL", document.getElementById("supabase-url").value.trim());
    localStorage.setItem("WCP_SUPABASE_ANON_KEY", document.getElementById("supabase-anon-key").value.trim());
    window.location.reload();
  });
}

function renderLogin() {
  const isLoginLoading = state.authLoading === "login";
  const isSignupLoading = state.authLoading === "signup";
  const isAuthLoading = Boolean(state.authLoading);
  app.innerHTML = `
    <main class="login-screen">
      <section class="login-card glass-card">
        <div class="brand-mark">${renderWorldCupLogo("hero")}<span>WC</span></div>
        <h1>WC 2026</h1>
        <h2>WorldCup Predict</h2>
        <p>Private play-points league cho World Cup 2026.</p>
        ${state.message ? `<p class="success">${escapeHtml(state.message)}</p>` : ""}
        ${state.error ? `<p class="error">${escapeHtml(state.error)}</p>` : ""}
        <form class="form-grid" id="login-form">
          <label>Tài khoản<input id="login-username" autocomplete="username"></label>
          <label>Mật khẩu<input id="login-password" type="password" autocomplete="current-password"></label>
          <button class="primary-button wide">Đăng nhập</button>
        </form>
        <div class="auth-divider"><span>hoặc</span></div>
        <form class="form-grid signup-form" id="signup-form">
          <h3>Tạo tài khoản mới</h3>
          <label>Tài khoản<input id="signup-username" autocomplete="username" required></label>
          <label>Tên hiển thị<input id="signup-display-name" autocomplete="name" required></label>
          <label>Mật khẩu<input id="signup-password" type="password" autocomplete="new-password" minlength="6" required></label>
          <button class="ghost-button wide">Tạo tài khoản</button>
        </form>
        <div class="demo-row">
          <span>player do admin cấp</span>
          <span>admin / password bạn tạo</span>
        </div>
      </section>
    </main>
  `;
  const loginUsername = document.getElementById("login-username");
  const signupUsername = document.getElementById("signup-username");
  const signupDisplayName = document.getElementById("signup-display-name");
  if (loginUsername) loginUsername.value = state.authDraft.loginUsername || "";
  if (signupUsername) signupUsername.value = state.authDraft.signupUsername || "";
  if (signupDisplayName) signupDisplayName.value = state.authDraft.signupDisplayName || "";
  if (isAuthLoading) {
    document.querySelectorAll("#login-form input, #signup-form input, #login-form button, #signup-form button").forEach((node) => {
      node.disabled = true;
    });
  }
  if (isLoginLoading) {
    const button = document.querySelector("#login-form button");
    if (button) button.innerHTML = renderBouncingBall("Dang dang nhap...");
  }
  if (isSignupLoading) {
    const button = document.querySelector("#signup-form button");
    if (button) button.innerHTML = renderBouncingBall("Dang tao tai khoan...");
  }
  document.getElementById("login-form").addEventListener("submit", login);
  document.getElementById("signup-form").addEventListener("submit", createPublicAccount);
}

async function login(event) {
  event.preventDefault();
  state.error = "";
  state.message = "";
  const raw = document.getElementById("login-username").value.trim().toLowerCase();
  const password = document.getElementById("login-password").value;
  const email = raw.includes("@") ? raw : `${raw}@worldcup.local`;
  state.authDraft.loginUsername = raw;
  state.authLoading = "login";
  renderLogin();
  const { data, error } = await state.client.auth.signInWithPassword({ email, password });
  if (error) {
    state.error = friendlyAuthError(error);
    state.authLoading = "";
    renderLogin();
    return;
  }
  state.session = data.session;
  state.authLoading = "";
  await loadData();
}

async function createPublicAccount(event) {
  event.preventDefault();
  state.error = "";
  state.message = "";
  const raw = document.getElementById("signup-username").value.trim().toLowerCase();
  const displayName = document.getElementById("signup-display-name").value.trim();
  const password = document.getElementById("signup-password").value;
  const username = raw.replace(/[^a-z0-9._-]/g, "");
  state.authDraft.signupUsername = username || raw;
  state.authDraft.signupDisplayName = displayName;
  if (!username || !displayName || password.length < 6) {
    state.error = "Vui lòng nhập tài khoản, tên hiển thị và mật khẩu tối thiểu 6 ký tự.";
    state.authLoading = "";
    renderLogin();
    return;
  }
  const email = `${username}@worldcup.local`;
  state.authLoading = "signup";
  renderLogin();
  try {
    await safeFetchJson("/api/public-signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, display_name: displayName, password })
    });
    const { data, error } = await state.client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    state.session = data.session;
    state.authLoading = "";
    state.message = "";
    await loadData();
    return;
  } catch (error) {
    state.error = friendlyAuthError(error);
    state.authLoading = "";
    renderLogin();
    return;
  }
}

async function loadData() {
  state.error = "";
  try {
    const profileResult = await state.client.from("profiles").select("*").eq("id", state.session.user.id).single();
    throwIfError(profileResult.error);
    state.profile = profileResult.data;
    if (state.profile.deleted_at || state.profile.is_active === false) {
      const deleted = Boolean(state.profile.deleted_at);
      await state.client.auth.signOut();
      state.session = null;
      state.profile = null;
      state.error = deleted
        ? "Tài khoản này đã bị xoá. Vui lòng liên hệ admin."
        : "Tài khoản này đang bị khóa. Vui lòng liên hệ admin.";
      renderLogin();
      return;
    }

    const teamsResult = await state.client.from("teams").select("*").order("group_name", { ascending: true }).order("group_slot", { ascending: true }).order("name", { ascending: true });
    throwIfError(teamsResult.error);
    state.teams = teamsResult.data || [];

    const playersResult = await state.client
      .from("team_players")
      .select("*,team:teams(*)")
      .order("team_id", { ascending: true })
      .order("position", { ascending: true })
      .order("shirt_number", { ascending: true });
    state.teamPlayers = playersResult.error ? [] : playersResult.data || [];

    const lineupsResult = await state.client
      .from("team_lineups")
      .select("*,match:matches(*)")
      .order("updated_at", { ascending: false });
    state.teamLineups = lineupsResult.error ? [] : lineupsResult.data || [];

    const matchResult = await state.client
      .from("matches")
      .select("*,home_team:teams!matches_home_team_id_fkey(*),away_team:teams!matches_away_team_id_fkey(*),match_markets(*)")
      .order("starts_at", { ascending: true });
    throwIfError(matchResult.error);
    state.matches = (matchResult.data || []).map((match) => ({
      ...match,
      match_markets: [...(match.match_markets || [])].sort((a, b) => a.id - b.id)
    }));
    state.selectedMatchId ||= state.matches.find((match) => match.status === "SCHEDULED")?.id || state.matches[0]?.id || null;

    const matchStatsResult = await state.client.from("match_stats").select("*");
    state.matchStats = matchStatsResult.error ? [] : matchStatsResult.data || [];

    const bracketResult = await state.client
      .from("bracket_matches")
      .select("*,home_team:teams!bracket_matches_home_team_id_fkey(*),away_team:teams!bracket_matches_away_team_id_fkey(*),match:matches!bracket_matches_match_id_fkey(*,home_team:teams!matches_home_team_id_fkey(*),away_team:teams!matches_away_team_id_fkey(*))")
      .order("display_order", { ascending: true });
    state.bracketMatches = bracketResult.error ? [] : bracketResult.data || [];

    const outrightMarketKeys = ["tournament_winner", "golden_boot"];
    const outrightResults = await Promise.all(outrightMarketKeys.map((marketKey) => {
      let query = state.client
        .from("outright_markets")
        .select("*")
        .eq("market_key", marketKey)
        .order("odds_multiplier", { ascending: true })
        .order("selection_label", { ascending: true })
        .limit(marketKey === "golden_boot" ? 1000 : 100);
      if (state.profile?.role !== "admin") {
        query = query.eq("is_open", true);
      }
      return query;
    }));
    outrightResults.forEach((result) => throwIfError(result.error));
    state.outrightMarkets = outrightResults.flatMap((result) => result.data || []);

    const leaderboardResult = await state.client.from("leaderboard").select("*").order("rank", { ascending: true });
    throwIfError(leaderboardResult.error);
    state.leaderboard = leaderboardResult.data || [];

    const betResult = await state.client
      .from("bets")
      .select("*,match:matches(*,home_team:teams!matches_home_team_id_fkey(*),away_team:teams!matches_away_team_id_fkey(*))")
      .eq("user_id", state.profile.id)
      .order("placed_at", { ascending: false });
    throwIfError(betResult.error);
    state.bets = betResult.data || [];

    if (state.profile.role === "admin") {
      const usersResult = await state.client.from("profiles").select("*").order("created_at", { ascending: false });
      throwIfError(usersResult.error);
      state.users = usersResult.data || [];
      if (state.adminPredictionUserId && !state.users.some((user) => user.id === state.adminPredictionUserId && user.role === "player" && !user.deleted_at)) {
        state.adminPredictionUserId = "";
        state.adminPredictionBets = null;
        state.adminPredictionError = "";
      }

      const reportResult = await state.client.from("admin_report").select("*").single();
      throwIfError(reportResult.error);
      state.report = reportResult.data;

      const syncResult = await state.client.from("sync_runs").select("*").order("started_at", { ascending: false }).limit(10);
      throwIfError(syncResult.error);
      state.syncRuns = syncResult.data || [];

      const matchResultsResult = await state.client
        .from("match_results")
        .select("*,match:matches(*),home_team:teams!match_results_home_team_id_fkey(*),away_team:teams!match_results_away_team_id_fkey(*)")
        .order("finished_at", { ascending: false })
        .limit(200);
      state.matchResults = matchResultsResult.error ? [] : matchResultsResult.data || [];

      let adminBetsQuery = state.client
        .from("bets")
        .select(betDetailSelect)
        .order("placed_at", { ascending: false })
        .limit(100);
      adminBetsQuery = applyAdminFilters(adminBetsQuery, "placed_at", "user_id");
      const adminBetsResult = await adminBetsQuery;
      throwIfError(adminBetsResult.error);
      state.adminBets = adminBetsResult.data || [];

      let ledgerQuery = state.client
        .from("wallet_ledger")
        .select("*,user:profiles!wallet_ledger_user_id_fkey(username,display_name),actor:profiles!wallet_ledger_actor_id_fkey(username,display_name)")
        .order("created_at", { ascending: false })
        .limit(100);
      ledgerQuery = applyAdminFilters(ledgerQuery, "created_at", "user_id");
      const ledgerResult = await ledgerQuery;
      throwIfError(ledgerResult.error);
      state.walletLedger = ledgerResult.data || [];

      let auditQuery = state.client
        .from("audit_logs")
        .select("*,actor:profiles!audit_logs_actor_id_fkey(username,display_name)")
        .order("created_at", { ascending: false })
        .limit(100);
      auditQuery = applyAdminFilters(auditQuery, "created_at", "actor_id");
      const auditResult = await auditQuery;
      throwIfError(auditResult.error);
      state.auditLogs = auditResult.data || [];

      const userReportResult = await state.client.from("admin_user_report").select("*").order("score", { ascending: false });
      throwIfError(userReportResult.error);
      state.userReport = userReportResult.data || [];

      const marketReportResult = await state.client.from("admin_market_report").select("*").order("total_staked", { ascending: false });
      throwIfError(marketReportResult.error);
      state.marketReport = marketReportResult.data || [];

      state.deploymentHealth = await loadDeploymentHealth();
    }
    renderApp();
  } catch (error) {
    state.error = error.message || String(error);
    renderApp();
  }
}


function applyAdminFilters(query, dateColumn, userColumn) {
  const { userId, dateFrom, dateTo } = state.adminFilters;
  let next = query;
  if (userId) next = next.eq(userColumn, userId);
  if (dateFrom) next = next.gte(dateColumn, dateInputToIsoStart(dateFrom));
  if (dateTo) next = next.lt(dateColumn, dateInputToIsoEnd(dateTo));
  return next;
}

async function loadDeploymentHealth() {
  try {
    const response = await fetch("/api/health");
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

function renderApp() {
  const items = state.profile.role === "admin" ? [...navItems, ["admin", "Admin"]] : navItems;
  const notifications = getNotificationItems();
  const unreadCount = notifications.filter((item) => !item.read).length;
  app.innerHTML = `
    <div class="app-shell ${state.sidebarCollapsed ? "sidebar-collapsed" : ""}">
      <aside class="sidebar">
        <div class="sidebar-head">
          <div class="app-brand-lockup">
            ${renderWorldCupLogo("shell")}
            <div><div class="brand">WorldCup Predict</div><small>WC 2026 Live</small></div>
          </div>
          <button class="icon-button sidebar-toggle-button" type="button" data-sidebar-toggle aria-label="Đóng thanh menu">
            <span class="sidebar-toggle-icon close" aria-hidden="true"><span></span><span></span></span>
          </button>
        </div>
        <nav class="nav-stack">
          ${items.map(([key, label]) => `<button class="nav-button ${state.active === key ? "active" : ""}" data-tab="${key}">${label}</button>`).join("")}
        </nav>
        <button class="primary-button wide" data-tab="detail">Dự đoán</button>
        <button class="ghost-button" id="logout-button">Logout</button>
      </aside>
      <main class="workspace">
        <header class="topbar">
          <div class="topbar-brand-row">
            <button class="icon-button sidebar-open-button" type="button" data-sidebar-toggle aria-label="${state.sidebarCollapsed ? "Mở thanh menu" : "Đóng thanh menu"}">
              <span class="sidebar-toggle-icon menu" aria-hidden="true"><span></span><span></span><span></span></span>
            </button>
            ${renderWorldCupLogo("topbar")}
            <div class="brand">WorldCup Predict</div>
          </div>
          <div class="top-actions">
            ${renderNotificationCenter(notifications, unreadCount)}
            <div class="wallet-chip">${money(state.profile.wallet_balance)}</div>
            ${renderProfileMenu(items)}
          </div>
        </header>
        ${renderNotificationTicker(notifications)}
        <section class="page">
          ${state.message ? `<div class="toast success">${escapeHtml(state.message)}</div>` : ""}
          ${state.error ? `<div class="toast error">${escapeHtml(state.error)}</div>` : ""}
          ${renderActiveView()}
        </section>
      </main>
    </div>
  `;
  bindShellEvents();
}

function renderProfileMenu(items) {
  const passwordDraft = state.passwordChange || {};
  const showPasswordForm = Boolean(passwordDraft.open);
  const isChangingPassword = Boolean(passwordDraft.loading);
  return `
    <div class="profile-menu ${state.profileMenuOpen ? "open" : ""}">
      <button class="profile-button" type="button" data-profile-toggle aria-label="Tài khoản">
        <span class="avatar">${initials(state.profile.display_name)}</span>
      </button>
      ${
        state.profileMenuOpen
          ? `<section class="profile-popover" aria-label="Tài khoản">
              <div class="profile-summary">
                <strong>${escapeHtml(state.profile.display_name)}</strong>
                <span>${money(state.profile.wallet_balance)}</span>
              </div>
              <div class="profile-menu-nav">
                ${items.map(([key, label]) => `<button class="${state.active === key ? "active" : ""}" data-tab="${key}">${label}</button>`).join("")}
              </div>
              <button class="ghost-button wide" type="button" data-password-toggle>${showPasswordForm ? "Đóng đổi mật khẩu" : "Đổi mật khẩu"}</button>
              ${
                showPasswordForm
                  ? `<form class="profile-password-form" id="change-password-form">
                      <label>Mật khẩu hiện tại<input id="current-password" name="currentPassword" type="password" autocomplete="current-password" value="${escapeHtml(passwordDraft.currentPassword || "")}" required></label>
                      <label>Mật khẩu mới<input id="new-self-password" name="newPassword" type="password" autocomplete="new-password" minlength="6" value="${escapeHtml(passwordDraft.newPassword || "")}" required></label>
                      <label>Xác nhận mật khẩu mới<input id="confirm-self-password" name="confirmPassword" type="password" autocomplete="new-password" minlength="6" value="${escapeHtml(passwordDraft.confirmPassword || "")}" required></label>
                      <button class="primary-button wide" type="submit" ${isChangingPassword ? "disabled" : ""}>${isChangingPassword ? renderBouncingBall("Dang doi mat khau...") : "Lưu mật khẩu mới"}</button>
                    </form>`
                  : ""
              }
              <button class="ghost-button wide profile-logout" id="profile-logout-button">Logout</button>
            </section>`
          : ""
      }
    </div>
  `;
}

function currentUserEmail() {
  return state.session?.user?.email || (state.profile?.username ? `${state.profile.username}@worldcup.local` : "");
}

function readPasswordChangeForm(form) {
  return {
    open: true,
    loading: false,
    currentPassword: form?.elements?.currentPassword?.value || document.getElementById("current-password")?.value || "",
    newPassword: form?.elements?.newPassword?.value || document.getElementById("new-self-password")?.value || "",
    confirmPassword: form?.elements?.confirmPassword?.value || document.getElementById("confirm-self-password")?.value || ""
  };
}

function resetPasswordChangeState(open = false) {
  state.passwordChange = {
    open,
    loading: false,
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  };
}

async function changeOwnPassword(event) {
  event.preventDefault();
  if (state.passwordChange?.loading) return;
  const form = event.currentTarget;
  const draft = readPasswordChangeForm(form);
  state.passwordChange = draft;
  state.message = "";
  state.error = "";

  if (!draft.currentPassword) {
    state.error = "Vui lòng nhập mật khẩu hiện tại.";
    renderApp();
    return;
  }
  if (draft.newPassword.length < 6) {
    state.error = "Mật khẩu mới cần tối thiểu 6 ký tự.";
    renderApp();
    return;
  }
  if (draft.newPassword !== draft.confirmPassword) {
    state.error = "Xác nhận mật khẩu mới chưa khớp.";
    renderApp();
    return;
  }

  const email = currentUserEmail();
  if (!email) {
    state.error = "Không tìm thấy email đăng nhập để xác thực mật khẩu hiện tại.";
    renderApp();
    return;
  }

  state.passwordChange = { ...draft, loading: true };
  renderApp();
  try {
    const verifyResult = await state.client.auth.signInWithPassword({
      email,
      password: draft.currentPassword
    });
    if (verifyResult.error) {
      throw new Error("Mật khẩu hiện tại không đúng.");
    }
    const updateResult = await state.client.auth.updateUser({ password: draft.newPassword });
    if (updateResult.error) {
      throw updateResult.error;
    }
    resetPasswordChangeState(false);
    state.profileMenuOpen = true;
    state.message = "Đã đổi mật khẩu. Bạn vẫn đang đăng nhập.";
    state.error = "";
  } catch (error) {
    state.passwordChange = { ...draft, loading: false };
    state.message = "";
    state.error = error instanceof Error ? error.message : String(error);
  }
  renderApp();
}

function renderActiveView() {
  if (state.active === "predictionSuccess") return renderPredictionSuccess();
  if (state.active === "teamProfile") return renderTeamProfile();
  if (state.active === "detail") return renderDetail();
  if (state.active === "groups") return renderGroups();
  if (state.active === "bracket") return renderBracket();
  if (state.active === "leaderboard") return renderLeaderboard();
  if (state.active === "predictionStats") return renderPredictionStats();
  if (state.active === "guide") return renderGuide();
  if (state.active === "history") return renderHistory();
  if (state.active === "admin" && state.profile.role === "admin") return renderAdmin();
  return renderMatches();
}

function renderMatches() {
  const filteredMatches = filteredScheduleMatches({ includeAllStatusesForTabs: true });
  const upcomingMatches = filteredMatches.filter((match) => !isCompletedScore(match));
  const completedMatches = filteredMatches.filter(isCompletedScore);
  const activeSheet = state.scheduleSheet === "completed" ? "completed" : "upcoming";
  const activeMatches = activeSheet === "completed" ? completedMatches : upcomingMatches;
  const featured = spotlightMatchFor(upcomingMatches) || spotlightMatchFor(filteredScheduleMatches()) || spotlightMatchFor(filteredMatches) || spotlightMatchFor(state.matches);
  if (!featured) {
    return `<section class="glass-card panel"><h2>Chưa có lịch đấu</h2><p>Hãy chạy Supabase seed.</p></section>`;
  }
  const visibleMatches = activeMatches.filter((match) => match.id !== featured.id);
  const summaryMatches = visibleMatches.slice(0, 6);
  const odd = featured.match_markets.find((market) => market.market_key === "correct_score" && isBettableMarket(market))?.odds_multiplier || 6.00;
  return `
    <div class="dashboard-grid">
      <div class="stack">
        ${renderScheduleFilters()}
        <section class="hero stadium-surface">
          <span class="kicker">Trận đấu tâm điểm</span>
          <div class="hero-versus">
            ${teamLockup(featured.home_team, true, "home")}
            <span class="vs-text">VS</span>
            ${teamLockup(featured.away_team, true, "away")}
          </div>
          <div class="hero-meta">
            <span>${dateText(featured.starts_at)}</span>
            <span>${escapeHtml(featured.stage)}</span>
            <span>${escapeHtml(matchLocation(featured))}</span>
            <span>x${fmtOne.format(number(odd))}</span>
          </div>
          <p><button class="primary-button" data-open-bet-modal="${featured.id}">Dự đoán ngay</button></p>
        </section>
        <div class="section-heading"><h2>Lịch thi đấu</h2><span>${fmt.format(activeMatches.length)} trận</span></div>
        ${renderFixtureTable(activeMatches, { activeSheet, upcomingCount: upcomingMatches.length, completedCount: completedMatches.length })}
        <div class="section-heading"><h2>${activeSheet === "completed" ? "Trận đã kết thúc gần đây" : "Trận nổi bật tiếp theo"}</h2><span>${fmt.format(summaryMatches.length)} trận</span></div>
        <section class="card-grid">${summaryMatches.map(renderMatchCard).join("") || "<p>Không có trận trong bộ lọc này.</p>"}</section>
      </div>
      <aside class="stack">
        <section class="glass-card panel">
          <div class="section-heading"><h2>Bảng Xếp Hạng</h2><span>Top 5</span></div>
          ${state.leaderboard.slice(0, 5).map(renderLeaderRow).join("")}
        </section>
        <section class="glass-card panel">
          <div class="section-heading"><h2>Dự đoán Vua phá lưới</h2><span>${fmt.format(openOutrightMarkets("golden_boot").length)} lựa chọn</span></div>
          ${renderOutrightSearchCard("golden_boot")}
        </section>
        <section class="glass-card panel">
          <div class="section-heading"><h2>Vô địch giải</h2><span>${fmt.format(openOutrightMarkets("tournament_winner").length)} đội</span></div>
          ${renderOutrightSearchCard("tournament_winner")}
        </section>
      </aside>
    </div>
  `;
}

function renderFixtureTable(matches, options = {}) {
  const activeSheet = options.activeSheet === "completed" ? "completed" : "upcoming";
  const tableTitle = activeSheet === "completed" ? "Trận đã kết thúc" : "Trận sắp diễn ra";
  const tableHint = activeSheet === "completed" ? "trận có kết quả" : "trận để dự đoán";
  return `
    <section class="fixture-table glass-card">
      <div class="section-heading">
        <h2>${tableTitle}</h2>
        <span>${fmt.format(matches.length)} ${tableHint}</span>
      </div>
      ${renderScheduleSheetTabs(activeSheet, options)}
      <div class="fixture-head">
        <span>Trận</span>
        <span>Thời gian</span>
        <span>Cặp đấu</span>
        <span>Bảng / sân</span>
        <span>Markets</span>
        <span></span>
      </div>
      <div class="fixture-list">
        ${matches.map(renderFixtureRow).join("") || `<p class="empty-copy">Không có trận trong bộ lọc này.</p>`}
      </div>
    </section>
  `;
}

function renderScheduleSheetTabs(activeSheet, options = {}) {
  const tabs = [
    ["upcoming", "Sắp diễn ra", options.upcomingCount || 0],
    ["completed", "Đã kết thúc", options.completedCount || 0]
  ];
  return `
    <div class="schedule-sheet-tabs" role="tablist" aria-label="Schedule sheets">
      ${tabs.map(([key, label, count]) => `
        <button class="sheet-tab ${activeSheet === key ? "active" : ""}" type="button" role="tab" aria-selected="${activeSheet === key ? "true" : "false"}" data-schedule-sheet="${key}">
          <span>${label}</span>
          <b>${fmt.format(count)}</b>
        </button>
      `).join("")}
    </div>
  `;
}

function renderFixtureRow(match) {
  const openMarkets = (match.match_markets || []).filter(isBettableMarket).length;
  const group = match.group_name ? formatGroupName(match.group_name) : "Knockout";
  const done = isCompletedScore(match);
  const scoreSep = done
    ? `<b class="fixture-score">${match.home_score} - ${match.away_score}</b>`
    : `<b>VS</b>`;
  return `
    <article class="fixture-row${done ? " fixture-row--done" : ""}" data-group="${escapeHtml(match.group_name || "knockout")}">
      <span class="fixture-number">#${escapeHtml(fixtureNumber(match))}</span>
      <time>${dateText(match.starts_at)}</time>
      <div class="fixture-pair">
        ${fixtureTeam(match.home_team, "home")}
        ${scoreSep}
        ${fixtureTeam(match.away_team, "away")}
      </div>
      <div class="fixture-meta">
        <strong><span class="group-badge">${escapeHtml(group)}</span></strong>
        <small>${escapeHtml(matchLocation(match))}</small>
      </div>
      <span class="fixture-market-count">${done ? escapeHtml(match.status) : `${fmt.format(openMarkets)} open`}</span>
      ${done ? renderCompletedFixtureBetSummary(match) : ""}
      <button class="compact-button${done ? "" : " primary-button"}" data-open-bet-modal="${match.id}">${done ? "Xem chi tiết" : "Dự đoán"}</button>
    </article>
  `;
}

function renderCompletedFixtureBetSummary(match) {
  const bets = betsForMatch(match);
  if (!bets.length) {
    return `<div class="fixture-bet-summary"><span class="fixture-bet-empty">Bạn chưa bet trận này.</span></div>`;
  }
  return `
    <div class="fixture-bet-summary">
      ${bets.map(renderFixtureBetSummaryItem).join("")}
    </div>
  `;
}

function betsForMatch(match) {
  return (state.bets || [])
    .filter((bet) => Number(bet.match_id) === Number(match.id))
    .sort((left, right) => new Date(right.placed_at || 0).getTime() - new Date(left.placed_at || 0).getTime());
}

function renderFixtureBetSummaryItem(bet) {
  const outcome = betOutcome(bet);
  const score = betScoreAmount(bet);
  const receivedLabel = bet.status === "placed" ? `Potential ${money(betReceivedAmount(bet))}` : money(betReceivedAmount(bet));
  return `
    <div class="fixture-bet-item">
      <div><small>Kèo đã bet</small><b>${escapeHtml(betMarketTitle(bet))}</b></div>
      <div><small>Dự đoán</small><b>${escapeHtml(bet.selection_label || "-")}</b><span>${money(bet.stake)} x${fmtOne.format(number(bet.locked_multiplier))}</span></div>
      <div><small>Thực tế</small><b>${escapeHtml(betActualText(bet))}</b></div>
      <div><small>Kết luận</small><b class="${escapeHtml(outcome.className)}">${escapeHtml(outcome.label)}</b><span>Nhận về: ${escapeHtml(receivedLabel)} | Điểm: ${score >= 0 ? "+" : ""}${money(score)}</span></div>
    </div>
  `;
}

function fixtureTeam(team, side = "") {
  return `
    <span class="fixture-team">
      <span class="fixture-flag">${teamFlagContent(team)}</span>
      <span>${escapeHtml(team?.name || "TBA")}</span>
      <small>${escapeHtml(team?.code || "TBA")}</small>
      ${homeAwayBadge(side)}
    </span>
  `;
}

function fixtureNumber(match) {
  const providerNumber = String(match.provider_id || "").match(/(\d+)$/)?.[1];
  if (providerNumber) return String(Number(providerNumber));
  return match.id || "-";
}

function renderMatchCard(match) {
  const odd = match.match_markets.find((market) => market.market_key === "match_result" && market.selection_key === "home")?.odds_multiplier || 1.8;
  const openMarkets = match.match_markets.filter(isBettableMarket).length;
  const done = isCompletedScore(match);
  const separator = done
    ? `<span class="match-score-result">${match.home_score} - ${match.away_score}</span>`
    : `<span class="muted">VS</span>`;
  return `
    <article class="match-card glass-card${done ? " match-card--done" : ""}">
      <div class="section-heading"><span>${dateText(match.starts_at)}</span><span class="status-badge status-${match.status.toLowerCase()}">${escapeHtml(match.status)}</span></div>
      <div class="match-teams">${teamLockup(match.home_team, false, "home")}${separator}${teamLockup(match.away_team, false, "away")}</div>
      <div class="match-meta-grid">
        <span>${escapeHtml(scheduleLabel(match))}</span>
        <span>${escapeHtml(matchLocation(match))}</span>
        ${done ? `<span class="result-final">Kết quả chính thức</span>` : `<span>${fmt.format(openMarkets)} markets open</span>`}
        ${done ? "" : `<span>x${fmtOne.format(number(odd))}</span>`}
      </div>
      <div class="consensus"><div style="width:58%"></div></div>
      <p><button class="ghost-button wide" data-open-bet-modal="${match.id}">${done ? "Xem chi tiết" : "Dự đoán ngay"}</button></p>
    </article>
  `;
}

function renderScheduleFilters(options = {}) {
  const includeSearchPanel = options.includeSearchPanel === true;
  const base = [
    ["upcoming", "Upcoming"],
    ["today", "Today"],
    ["all", "All"],
    ["knockout", "Knockout"]
  ];
  const groups = [...new Set(state.matches.map((match) => match.group_name).filter(Boolean))]
    .sort()
    .map((group) => [`group:${group}`, formatGroupName(group)]);
  const filters = [...base, ...groups];
  return `
    <section class="schedule-toolbar glass-card">
      <div>
        <h2>Lịch & bảng đấu</h2>
        <p>Xem theo ngày, bảng hoặc vòng knockout. Bấm trận để mở cửa sổ cược.</p>
      </div>
      ${
        includeSearchPanel
          ? renderPredictionMatchSearchPanel()
          : `<label class="search-field">
              Search
              <input id="match-search" value="${escapeHtml(state.matchSearch)}" placeholder="Group A, Mexico, match 1...">
            </label>`
      }
      <div class="filter-scroll">
        ${filters.map(([key, label]) => `<button class="filter-pill ${state.matchFilter === key ? "active" : ""}" data-match-filter="${escapeHtml(key)}">${escapeHtml(label)}</button>`).join("")}
      </div>
    </section>
  `;
}

function filteredScheduleMatches(options = {}) {
  const now = new Date();
  const todayKey = localDateKey(now);
  const useSearch = options.useSearch !== false;
  const includeAllStatusesForTabs = options.includeAllStatusesForTabs === true;
  const selectedDate = options.dateKey || "";
  const search = searchNormalize(state.matchSearch);
  return state.matches.filter((match) => {
    let matchesFilter = false;
    if (selectedDate) matchesFilter = vnDateKey(match.starts_at) === selectedDate;
    else if (state.matchFilter === "all") matchesFilter = true;
    else if (state.matchFilter === "today") matchesFilter = localDateKey(new Date(match.starts_at)) === todayKey;
    else if (state.matchFilter === "knockout") matchesFilter = isKnockoutMatch(match);
    else if (state.matchFilter?.startsWith("group:")) matchesFilter = match.group_name === state.matchFilter.slice(6);
    else if (includeAllStatusesForTabs) matchesFilter = true;
    else { const ms = new Date(match.starts_at).getTime(); const threeDaysAgo = now.getTime() - 3 * 86400000; matchesFilter = (ms >= now.getTime() && match.status === "SCHEDULED") || (ms >= threeDaysAgo && ["FT","AET","PEN","FT_PEN","1H","2H","HT"].includes(match.status)); }
    if (!matchesFilter) return false;
    if (!useSearch || !search) return true;
    return searchNormalize(matchSearchText(match)).includes(search);
  });
}

function matchRankQuality(team) {
  const rank = number(team?.fifa_rank);
  return rank ? Math.max(0, 220 - rank) : 0;
}

function matchSpotlightScore(match) {
  return matchRankQuality(match?.home_team)
    + matchRankQuality(match?.away_team)
    + teamStrengthScore(match?.home_team)
    + teamStrengthScore(match?.away_team);
}

function compareSpotlightMatches(left, right) {
  const leftScore = matchSpotlightScore(left);
  const rightScore = matchSpotlightScore(right);
  if (rightScore !== leftScore) return rightScore - leftScore;
  return new Date(left.starts_at).getTime() - new Date(right.starts_at).getTime();
}

function spotlightMatchFor(matches, options = {}) {
  const list = (matches || []).filter(Boolean);
  if (!list.length) return null;
  if (options.preferSelected) {
    const selected = list.find((match) => Number(match.id) === Number(state.selectedMatchId));
    if (selected) return selected;
  }

  const playable = list.filter((match) => canPredictMatch(match));
  const scheduled = list.filter((match) => ["SCHEDULED", "NS", "TBD"].includes(String(match.status || "")));
  const base = playable.length ? playable : (scheduled.length ? scheduled : list);
  const now = Date.now();
  const future = base.filter((match) => new Date(match.starts_at).getTime() >= now);
  const pool = future.length ? future : base;
  const nearestDay = pool
    .map((match) => vnDateKey(match.starts_at))
    .sort()[0];
  const sameDay = pool.filter((match) => vnDateKey(match.starts_at) === nearestDay);
  return [...sameDay].sort(compareSpotlightMatches)[0] || [...pool].sort(compareSpotlightMatches)[0] || list[0];
}

function renderPredictionMatchSearchPanel() {
  const open = state.matchSearchPanelOpen;
  const resultCount = filteredGroupTeamMatches(state.matchSearchQuery).length;
  return `
    <section class="match-search-panel ${open ? "open" : ""}">
      <button class="match-search-toggle" type="button" data-match-search-toggle>
        <span>
          <strong>Tìm theo bảng / đội</strong>
          <small>${open ? "Nhập bảng, tên đội hoặc mã đội để mở danh sách phụ." : "Option phụ, lịch ngày vẫn là luồng chính."}</small>
        </span>
        <b>${open ? "Đóng" : "Mở"}</b>
      </button>
      ${
        open
          ? `<div class="match-search-body">
              <label class="search-field">
                Search
                <input id="group-team-search" value="${escapeHtml(state.matchSearchQuery)}" placeholder="Bảng A, Group A, MEX, Mexico...">
              </label>
              <div class="match-search-meta">${state.matchSearchQuery ? `${fmt.format(resultCount)} trận phù hợp` : "Gõ bảng hoặc đội để xem trận liên quan."}</div>
              <div class="match-search-results" id="match-search-results">
                ${renderMatchSearchResults()}
              </div>
            </div>`
          : ""
      }
    </section>
  `;
}

function matchSearchText(match) {
  return [
    fixtureNumber(match),
    match.stage,
    match.group_name,
    formatGroupName(match.group_name),
    match.home_team?.name,
    match.home_team?.code,
    match.away_team?.name,
    match.away_team?.code,
    match.venue,
    match.city
  ].filter(Boolean).join(" ");
}

function filteredGroupTeamMatches(query) {
  const normalized = searchNormalize(query);
  if (!normalized) return [];
  const openMatches = predictionOpenMatches();
  const exactGroup = matchingGroupForQuery(normalized);
  const matches = exactGroup
    ? openMatches.filter((match) => match.group_name === exactGroup)
    : openMatches.filter((match) => searchNormalize(matchSearchText(match)).includes(normalized));
  return matches.sort((left, right) => new Date(left.starts_at).getTime() - new Date(right.starts_at).getTime());
}

function matchingGroupForQuery(normalizedQuery) {
  const compactQuery = normalizedQuery.replace(/\s+/g, "");
  const groups = [...new Set(state.matches.map((match) => match.group_name).filter(Boolean))];
  return groups.find((groupName) => {
    const groupCode = groupCodeFromName(groupName);
    const variants = [
      groupName,
      formatGroupName(groupName),
      groupCode,
      groupCode ? `Group ${groupCode}` : "",
      groupCode ? `Bang ${groupCode}` : "",
      groupCode ? `Bảng ${groupCode}` : ""
    ]
      .filter(Boolean)
      .map(searchNormalize);
    return variants.some((variant) => variant === normalizedQuery || variant.replace(/\s+/g, "") === compactQuery);
  }) || null;
}

function groupCodeFromName(groupName) {
  const formatted = searchNormalize(formatGroupName(groupName));
  const raw = searchNormalize(groupName);
  const formattedMatch = formatted.match(/(?:group|bang)\s*([a-z0-9]+)/);
  const rawMatch = raw.match(/(?:group|bang)\s*([a-z0-9]+)/);
  if (formattedMatch?.[1]) return formattedMatch[1].toUpperCase();
  if (rawMatch?.[1]) return rawMatch[1].toUpperCase();
  if (/^[a-z0-9]{1,2}$/.test(raw)) return raw.toUpperCase();
  return "";
}

function renderMatchSearchResults() {
  if (!searchNormalize(state.matchSearchQuery)) {
    return `<p class="empty-copy">Search theo bảng hoặc đội là option phụ; lịch cược theo ngày vẫn nằm bên dưới.</p>`;
  }
  const matches = filteredGroupTeamMatches(state.matchSearchQuery);
  if (!matches.length) {
    return `<p class="empty-copy">Không tìm thấy trận đang mở cược cho từ khóa này.</p>`;
  }
  return groupMatchesByGroup(matches).map(([groupName, groupMatches]) => `
    <section class="match-search-group">
      <div class="match-search-group-head">
        <strong>${escapeHtml(groupName ? formatGroupName(groupName) : "Knockout")}</strong>
        <span>${fmt.format(groupMatches.length)} trận</span>
      </div>
      <div class="prediction-match-list">
        ${groupMatches.map(renderMatchSearchRow).join("")}
      </div>
    </section>
  `).join("");
}

function groupMatchesByGroup(matches) {
  const groups = new Map();
  matches.forEach((match) => {
    const key = match.group_name || match.stage || "Knockout";
    groups.set(key, [...(groups.get(key) || []), match]);
  });
  return [...groups.entries()]
    .map(([groupName, groupMatches]) => [
      groupName,
      groupMatches.sort((left, right) => new Date(left.starts_at).getTime() - new Date(right.starts_at).getTime())
    ])
    .sort(([leftGroup, leftMatches], [rightGroup, rightMatches]) => {
      const leftDate = new Date(leftMatches[0]?.starts_at || 0).getTime();
      const rightDate = new Date(rightMatches[0]?.starts_at || 0).getTime();
      return String(leftGroup).localeCompare(String(rightGroup), "en", { numeric: true }) || leftDate - rightDate;
    });
}

function renderMatchSearchRow(match) {
  const openMarkets = (match.match_markets || []).filter(isBettableMarket).length;
  const betSummary = matchBetSummary(match);
  const urgency = matchUrgency(match);
  return `
    <button class="prediction-match-row search-match-row ${betSummary.hasBets ? "has-open-bet" : ""} ${urgency.className}" type="button" data-open-bet-modal="${match.id}">
      <time>${dateText(match.starts_at)}</time>
      <span class="group-badge">${escapeHtml(match.group_name ? formatGroupName(match.group_name) : "Knockout")}</span>
      <span class="prediction-pair">
        <strong>${escapeHtml(match.home_team?.name || "TBA")}</strong>
        <b>VS</b>
        <strong>${escapeHtml(match.away_team?.name || "TBA")}</strong>
      </span>
      <span>${escapeHtml(matchLocation(match))}</span>
      <span class="prediction-status-stack">
        ${urgency.badgeHtml}
        ${betSummary.badgeHtml}
        <small>${fmt.format(openMarkets)} kèo</small>
      </span>
    </button>
  `;
}

function renderReminderPanel(reminders) {
  if (!reminders.length) return "";
  return `
    <section class="reminder-panel glass-card" id="bet-reminders">
      <div class="section-heading"><h2>Sắp khóa cược</h2><span>${fmt.format(reminders.length)} cảnh báo</span></div>
      <div class="reminder-list">
        ${reminders.slice(0, 6).map((reminder) => `
          <article class="reminder-item">
            <button data-open-bet-modal="${reminder.match.id}">
              <strong>${escapeHtml(matchTitle(reminder.match))}</strong>
              <span>${escapeHtml(reminder.label)} · lock ${dateText(reminder.closesAt)}</span>
            </button>
            <button class="compact-button ghost-button" data-reminder-dismiss="${escapeHtml(reminder.id)}">Dismiss</button>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function renderNotificationCenter(notifications, unreadCount) {
  const total = notifications.length;
  const hasUnread = unreadCount > 0;
  return `
    <div class="notification-center ${state.notificationPanelOpen ? "open" : ""}">
      <button class="notification-button ${hasUnread ? "has-unread" : ""}" type="button" data-notification-toggle aria-label="Thông báo">
        <span class="notification-bell-icon" aria-hidden="true"></span>
        ${total ? `<span class="notification-count">${fmt.format(hasUnread ? unreadCount : total)}</span>` : ""}
      </button>
      ${
        state.notificationPanelOpen
          ? `<section class="notification-popover" aria-label="Thông báo">
              <div class="notification-head">
                <strong>Thông báo</strong>
                <span>${total ? `${fmt.format(total)} tin` : "Không có tin mới"}</span>
              </div>
              <div class="notification-list">
                ${notifications.length ? notifications.slice(0, 12).map(renderNotificationItem).join("") : `<p class="notification-empty">Chưa có cảnh báo sắp khóa cược hoặc kết quả mới.</p>`}
              </div>
            </section>`
          : ""
      }
    </div>
  `;
}

function renderNotificationTicker(notifications) {
  const reminders = notifications.filter((item) => item.type === "reminder").slice(0, 6);
  if (!reminders.length) return "";
  const tickerItems = reminders.map((item) => `
    <button class="notification-ticker-item" type="button" data-open-bet-modal="${item.match.id}" data-notification-read="${escapeHtml(item.id)}">
      <strong>${escapeHtml(item.title)}</strong>
      <span>${escapeHtml(item.body)}</span>
    </button>
  `).join("");
  return `
    <div class="notification-ticker" role="status" aria-live="polite">
      <div class="notification-ticker-track">
        ${tickerItems}
        ${tickerItems}
      </div>
    </div>
  `;
}

function renderNotificationItem(item) {
  const actionAttrs = item.type === "reminder"
    ? `data-notification-bet="${item.match.id}"`
    : `data-notification-history`;
  return `
    <button class="notification-item ${escapeHtml(item.type)} ${item.read ? "" : "unread"}" type="button" data-notification-read="${escapeHtml(item.id)}" ${actionAttrs}>
      <span class="notification-dot" aria-hidden="true"></span>
      <span>
        <strong>${escapeHtml(item.title)}</strong>
        <small>${escapeHtml(item.body)}</small>
      </span>
      <time>${escapeHtml(item.timeText)}</time>
    </button>
  `;
}

function getNotificationItems() {
  const readIds = readNotificationIds();
  return [
    ...getReminderNotifications(),
    ...getSettlementNotifications(),
    ...getMatchResultNotifications()
  ]
    .map((item) => ({ ...item, read: readIds.has(item.id) }))
    .sort((left, right) => right.priority - left.priority || right.sortTime - left.sortTime)
    .slice(0, 24);
}

function getMatchResultNotifications() {
  const bettedMatchIds = new Set((state.bets || []).map((b) => b.match_id));
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000; // last 7 days
  return (state.matches || [])
    .filter((m) => {
      if (!isCompletedScore(m)) return false;
      if (bettedMatchIds.has(m.id)) return false; // has bet → already in settlement notifications
      const updatedAt = new Date(m.updated_at || m.starts_at || 0).getTime();
      return updatedAt >= cutoff;
    })
    .map((m) => {
      const updatedAt = new Date(m.updated_at || m.starts_at || 0);
      const home = m.home_team?.name || m.home_team?.code || "?";
      const away = m.away_team?.name || m.away_team?.code || "?";
      return {
        id: `result:${m.id}:${m.home_score}-${m.away_score}`,
        type: "match-result",
        priority: 12,
        sortTime: updatedAt.getTime(),
        title: `Kết quả: ${home} ${m.home_score} – ${m.away_score} ${away}`,
        body: `Trận đấu kết thúc (${m.status}). Bạn chưa đặt cược trận này.`,
        timeText: dateText(updatedAt)
      };
    });
}

function getReminderNotifications() {
  return getBetReminders().map((reminder) => ({
    id: `reminder:${reminder.id}`,
    type: "reminder",
    priority: reminder.windowHours === 1 ? 30 : reminder.windowHours === 6 ? 20 : 10,
    sortTime: reminder.closesAt.getTime(),
    match: reminder.match,
    title: `Sắp khóa cược: ${matchTitle(reminder.match)}`,
    body: `${reminder.label} - khóa lúc ${dateText(reminder.closesAt)}. Bấm để vào cược.`,
    timeText: dateText(reminder.closesAt)
  }));
}

function getSettlementNotifications() {
  return state.bets
    .filter((bet) => ["won", "lost", "refunded"].includes(String(bet.status || "")))
    .map((bet) => {
      const match = matchForBet(bet);
      const settledAt = new Date(bet.settled_at || bet.updated_at || bet.placed_at || Date.now());
      const net = number(bet.points_delta) + number(bet.prediction_bonus);
      const statusLabel = bet.status === "won" ? "Cược thắng" : bet.status === "refunded" ? "Hoàn tiền" : "Cược thua";
      const amountText = bet.status === "won"
        ? `Ví nhận ${money(bet.potential_payout)}${net ? `, lãi ${net >= 0 ? "+" : ""}${money(net)}` : ""}`
        : bet.status === "refunded"
          ? `Hoàn lại ${money(bet.stake)}`
          : `Đã ghi nhận thua ${money(Math.abs(net || number(bet.stake)))}`;
      return {
        id: `settled:${bet.id}:${bet.status}:${bet.settled_at || bet.placed_at || ""}`,
        type: bet.status === "won" ? "settlement-win" : bet.status === "refunded" ? "settlement-refund" : "settlement-loss",
        priority: bet.status === "won" ? 25 : 15,
        sortTime: Number.isFinite(settledAt.getTime()) ? settledAt.getTime() : 0,
        title: `${statusLabel}: ${match ? matchTitle(match) : bet.market_key}`,
        body: `${amountText} - ${bet.selection_label || bet.market_key}`,
        timeText: Number.isFinite(settledAt.getTime()) ? dateText(settledAt) : ""
      };
    });
}

function notificationStorageKey() {
  return `WCP_READ_NOTIFICATIONS:${state.profile?.id || "anon"}`;
}

function readNotificationIds() {
  return new Set(safeJson(localStorage.getItem(notificationStorageKey()) || "[]"));
}

function markNotificationsRead(ids) {
  const readIds = readNotificationIds();
  ids.filter(Boolean).forEach((id) => readIds.add(id));
  localStorage.setItem(notificationStorageKey(), JSON.stringify([...readIds].slice(-240)));
}

function getBetReminders() {
  const now = Date.now();
  return state.matches
    .map((match) => {
      const closesAt = matchReminderCloseTime(match);
      if (!closesAt) return null;
      const hours = (closesAt.getTime() - now) / 36e5;
      const windowHours = reminderWindow(hours);
      if (!windowHours) return null;
      const id = reminderId(match.id, windowHours);
      if (isReminderDismissed(id)) return null;
      return {
        id,
        match,
        closesAt,
        windowHours,
        label: hours <= 1 ? "Còn dưới 1 giờ" : hours <= 6 ? "Còn dưới 6 giờ" : "Còn dưới 24 giờ"
      };
    })
    .filter(Boolean)
    .sort((left, right) => left.closesAt.getTime() - right.closesAt.getTime());
}

function matchReminderCloseTime(match) {
  const now = Date.now();
  const closeTimes = (match.match_markets || [])
    .filter((market) => market.is_open !== false)
    .map((market) => new Date(market.closes_at || match.starts_at))
    .filter((date) => Number.isFinite(date.getTime()) && date.getTime() > now);
  if (!closeTimes.length) return null;
  closeTimes.sort((left, right) => left.getTime() - right.getTime());
  return closeTimes[0];
}

function reminderWindow(hours) {
  if (hours <= 0 || hours > 24) return null;
  if (hours <= 1) return 1;
  if (hours <= 6) return 6;
  return 24;
}

function reminderId(matchId, windowHours) {
  return `${state.profile?.id || "anon"}:${matchId}:${windowHours}h`;
}

function reminderStorageKey() {
  return `WCP_DISMISSED_REMINDERS:${state.profile?.id || "anon"}`;
}

function dismissedReminderIds() {
  return new Set(safeJson(localStorage.getItem(reminderStorageKey()) || "[]"));
}

function isReminderDismissed(id) {
  return dismissedReminderIds().has(id);
}

function dismissReminder(id) {
  const ids = dismissedReminderIds();
  ids.add(id);
  localStorage.setItem(reminderStorageKey(), JSON.stringify([...ids].slice(-100)));
}

function localDateKey(date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function isKnockoutMatch(match) {
  const text = `${match.stage || ""} ${match.group_name || ""}`.toLowerCase();
  return !match.group_name || /round|last|quarter|semi|final|knockout|third/.test(text);
}

function formatGroupName(groupName) {
  return String(groupName || "")
    .replace(/^GROUP[_\s-]?/i, "Group ")
    .replace(/^Bảng\s*/i, "Group ")
    .replaceAll("_", " ");
}

function scheduleLabel(match) {
  return match.group_name ? formatGroupName(match.group_name) : match.stage || "World Cup 2026";
}

function matchLocation(match) {
  return [match.venue, match.city].filter(Boolean).join(" · ") || "Venue TBA";
}

function matchTitle(match) {
  if (!match) return "World Cup match";
  return `${match.home_team?.name || "TBA"} vs ${match.away_team?.name || "TBA"}`;
}

function renderGroups() {
  const groups = groupNames();
  return `
    <div class="stack">
      <div class="section-heading">
        <div>
          <h1>Bảng kết quả (Vòng loại)</h1>
          <p>Bảng điểm được tính từ kết quả các trận vòng loại đã hoàn tất.</p>
        </div>
        <span>${fmt.format(groups.length)} bảng</span>
      </div>
      <section class="groups-grid">
        ${groups.map(renderGroupCard).join("") || `<section class="glass-card panel"><h2>Chưa có bảng đấu</h2><p>Hãy chạy supabase/seed.sql.</p></section>`}
      </section>
    </div>
  `;
}

function groupNames() {
  return [...new Set(state.teams.map((team) => team.group_name).filter(Boolean))]
    .sort((left, right) => String(left).localeCompare(String(right), "en", { numeric: true }));
}

function renderGroupCard(groupName) {
  const rows = groupStandings(groupName);
  const completedMatches = state.matches
    .filter((m) => m.group_name === groupName && isCompletedScore(m))
    .sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));
  const resultsOpen = Boolean(state.groupResultsOpen?.[groupName]);
  return `
    <article class="group-card glass-card">
      <div class="group-card-top">
        <div>
          <h2>${escapeHtml(formatGroupName(groupName))}</h2>
          <small>${fmt.format(rows.length)} đội</small>
        </div>
        <span class="group-badge">${escapeHtml(formatGroupName(groupName))}</span>
      </div>
      <div class="standings-table">
        <div class="standings-row standings-head">
          <span>#</span><span>Đội</span><span>Tr</span><span>T</span><span>H</span><span>B</span><span>HS</span><span>Đ</span><span></span>
        </div>
        ${rows.map(renderStandingRow).join("")}
      </div>
      ${completedMatches.length ? `
        <button class="ghost-button compact-button group-results-toggle" type="button" data-toggle-group-results="${escapeHtml(groupName)}">
          ${resultsOpen ? "Ẩn kết quả" : "Xem kết quả"} (${fmt.format(completedMatches.length)})
        </button>
      ` : ""}
      ${completedMatches.length && resultsOpen ? `
        <div class="group-results">
          <div class="group-results-head">Kết quả</div>
          ${completedMatches.map(renderGroupMatchResult).join("")}
        </div>
      ` : ""}
    </article>
  `;
}

function renderGroupMatchResult(match) {
  const home = match.home_team?.name || match.home_team?.code || "?";
  const away = match.away_team?.name || match.away_team?.code || "?";
  const homeCode = match.home_team?.code || "";
  const awayCode = match.away_team?.code || "";
  const homeWon = number(match.home_score) > number(match.away_score);
  const awayWon = number(match.away_score) > number(match.home_score);
  return `
    <div class="group-result-row" data-open-bet-modal="${match.id}">
      <span class="group-result-team ${homeWon ? "winner" : ""}">
        <span class="fixture-flag">${teamFlagContent(match.home_team)}</span>
        <span class="group-result-name">${escapeHtml(homeCode)}</span>
      </span>
      <span class="group-result-score">
        <b class="${homeWon ? "score-win" : ""}">${match.home_score}</b>
        <span>–</span>
        <b class="${awayWon ? "score-win" : ""}">${match.away_score}</b>
      </span>
      <span class="group-result-team away ${awayWon ? "winner" : ""}">
        <span class="group-result-name">${escapeHtml(awayCode)}</span>
        <span class="fixture-flag">${teamFlagContent(match.away_team)}</span>
      </span>
      <span class="group-result-status">${escapeHtml(match.status)}</span>
    </div>
  `;
}

function renderStandingRow(row, index) {
  const gd = row.goalsFor - row.goalsAgainst;
  const rating = row.team.fifa_rank ? `FIFA #${fmt.format(number(row.team.fifa_rank))}` : (row.team.rating_source ? row.team.rating_source : "Rating TBA");
  return `
    <div class="standings-row">
      <span>${index + 1}</span>
      <span class="standing-team">
        <span class="fixture-flag">${teamFlagContent(row.team)}</span>
        <strong>${escapeHtml(row.team.name)}</strong>
        <small>${escapeHtml(row.team.code)} · ${escapeHtml(rating)}</small>
      </span>
      <span>${fmt.format(row.played)}</span>
      <span>${fmt.format(row.won)}</span>
      <span>${fmt.format(row.drawn)}</span>
      <span>${fmt.format(row.lost)}</span>
      <span>${gd > 0 ? "+" : ""}${fmt.format(gd)}</span>
      <b>${fmt.format(row.points)}</b>
      <button class="ghost-button compact-button" data-team-roster="${row.team.id}">Cầu thủ</button>
    </div>
  `;
}

function groupStandings(groupName) {
  const rows = state.teams
    .filter((team) => team.group_name === groupName)
    .map((team) => ({
      team,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0
    }));
  const byId = new Map(rows.map((row) => [row.team.id, row]));
  state.matches
    .filter((match) => match.group_name === groupName && isCompletedScore(match))
    .forEach((match) => {
      const home = byId.get(match.home_team_id);
      const away = byId.get(match.away_team_id);
      if (!home || !away) return;
      const homeScore = number(match.home_score);
      const awayScore = number(match.away_score);
      home.played += 1;
      away.played += 1;
      home.goalsFor += homeScore;
      home.goalsAgainst += awayScore;
      away.goalsFor += awayScore;
      away.goalsAgainst += homeScore;
      if (homeScore > awayScore) {
        home.won += 1;
        away.lost += 1;
        home.points += 3;
      } else if (awayScore > homeScore) {
        away.won += 1;
        home.lost += 1;
        away.points += 3;
      } else {
        home.drawn += 1;
        away.drawn += 1;
        home.points += 1;
        away.points += 1;
      }
    });
  return rows.sort((left, right) => {
    const leftGd = left.goalsFor - left.goalsAgainst;
    const rightGd = right.goalsFor - right.goalsAgainst;
    return right.points - left.points
      || rightGd - leftGd
      || right.goalsFor - left.goalsFor
      || number(left.team.group_slot) - number(right.team.group_slot)
      || left.team.name.localeCompare(right.team.name);
  });
}

function isCompletedScore(match) {
  return ["FT", "AET", "PEN", "FT_PEN"].includes(match.status)
    && match.home_score !== null
    && match.away_score !== null;
}

function teamPlayersFor(teamId) {
  return state.teamPlayers
    .filter((player) => player.team_id === teamId)
    .sort((left, right) => {
      const leftNo = number(left.shirt_number) || 999;
      const rightNo = number(right.shirt_number) || 999;
      return positionSortValue(left.position) - positionSortValue(right.position)
        || leftNo - rightNo
        || String(left.name || "").localeCompare(String(right.name || ""));
    });
}

function positionSortValue(position) {
  const text = String(position || "").toLowerCase();
  if (/goal|keeper|gk/.test(text)) return 0;
  if (/def|back/.test(text)) return 1;
  if (/mid/.test(text)) return 2;
  if (/for|att|wing|striker|fw/.test(text)) return 3;
  return 4;
}

function eurValueText(value, label = "") {
  if (label) return label;
  const numeric = number(value);
  if (!numeric) return "Value TBA";
  if (numeric >= 1000000000) return `€${fmtOne.format(numeric / 1000000000)}bn`;
  if (numeric >= 1000000) return `€${fmtOne.format(numeric / 1000000)}m`;
  if (numeric >= 1000) return `€${fmtOne.format(numeric / 1000)}k`;
  return `€${fmt.format(numeric)}`;
}

function topMarketPlayersForTeam(teamId, limit = 5) {
  return state.teamPlayers
    .filter((player) => player.team_id === teamId && number(player.market_value_eur) > 0)
    .sort((left, right) => number(right.market_value_eur) - number(left.market_value_eur) || String(left.name || "").localeCompare(String(right.name || "")))
    .slice(0, limit);
}

function teamStrengthScore(team) {
  if (!team) return 0;
  const value = number(team.squad_market_value_eur);
  const valueScore = value > 0 ? Math.log10(value / 1000000 + 1) * 18 : 0;
  const rankScore = team.fifa_rank ? Math.max(0, 110 - number(team.fifa_rank)) * 0.55 : 0;
  const squadRankScore = team.squad_value_rank ? Math.max(0, 58 - number(team.squad_value_rank)) * 0.45 : 0;
  return valueScore + rankScore + squadRankScore;
}

function matchValueForecast(match) {
  const homeScore = teamStrengthScore(match?.home_team);
  const awayScore = teamStrengthScore(match?.away_team);
  if (!homeScore && !awayScore) return null;
  const total = homeScore + awayScore || 1;
  const homePct = Math.round((homeScore / total) * 100);
  const awayPct = 100 - homePct;
  return { homePct, awayPct };
}

function teamRankingText(team) {
  const rank = team?.fifa_rank ? `FIFA #${fmt.format(number(team.fifa_rank))}` : "FIFA chưa cập nhật";
  const points = team?.fifa_points ? fmtOne.format(number(team.fifa_points)) : "chưa có";
  return `Xếp hạng: ${rank} - Điểm ratings: ${points}`;
}

function canPredictMatch(match) {
  if (!match || !["SCHEDULED", "NS", "TBD"].includes(match.status)) return false;
  return (match.match_markets || []).some((market) => {
    const closeTime = new Date(market.closes_at || match.starts_at).getTime();
    return market.is_open !== false && Number.isFinite(closeTime) && closeTime > Date.now();
  });
}

function renderMatchValueForecast(match) {
  const forecast = matchValueForecast(match);
  const homePct = forecast?.homePct ?? 50;
  const awayPct = forecast?.awayPct ?? 50;
  const leader = matchLeader(match, homePct, awayPct);
  return `
    <section class="glass-card value-forecast ${leader}-lean">
      <div class="forecast-heading">
        <div>
          <h2>Đánh giá trận đấu</h2>
          <p>${forecast ? "Dựa trên FIFA rank, điểm rating và định giá đội hình." : "Chưa đủ dữ liệu FIFA/Transfermarkt, tạm cân bằng 50/50."}</p>
        </div>
        <span class="pill">${escapeHtml(scheduleLabel(match))}</span>
      </div>
      <div class="forecast-team-grid">
        ${renderForecastTeamPanel(match.home_team, homePct, leader === "home", "home")}
        ${renderForecastTeamPanel(match.away_team, awayPct, leader === "away", "away")}
      </div>
      <div class="win-rate-block">
        <div class="win-rate-labels">
          <span>${escapeHtml(match.home_team.name)} ${homePct}%</span>
          <span>${escapeHtml(match.away_team.name)} ${awayPct}%</span>
        </div>
        <div class="forecast-meter win-rate-meter">
          <div class="home-rate" style="width:${homePct}%"></div>
        </div>
      </div>
    </section>
  `;
}

function matchLeader(match, homePct, awayPct) {
  if (isCompletedScore(match)) {
    if (number(match.home_score) > number(match.away_score)) return "home";
    if (number(match.away_score) > number(match.home_score)) return "away";
    return "even";
  }
  if (homePct === awayPct) return "even";
  return homePct > awayPct ? "home" : "away";
}

function renderForecastTeamPanel(team, pct, isWinner = false, side = "") {
  return `
    <article class="forecast-team-panel ${isWinner ? "forecast-winner" : ""}">
      <div class="forecast-team-title">
        <span class="fixture-flag">${teamFlagContent(team)}</span>
        <h3>${escapeHtml(team?.name || "TBA")}</h3>
        ${homeAwayBadge(side)}
      </div>
      <p>${escapeHtml(teamRankingText(team))}</p>
      <p>Giá trị đội hình: <strong>${escapeHtml(eurValueText(team?.squad_market_value_eur, team?.squad_market_value_label))}</strong></p>
      <p>Tỷ lệ thắng: <strong>${fmt.format(pct)}%</strong></p>
      ${isWinner ? `<span class="winner-strip">Đang dẫn</span>` : ""}
    </article>
  `;
}

function playerPositionGroup(player) {
  const text = String(player.position || "").toLowerCase();
  if (/goal|keeper|gk/.test(text)) return "GK";
  if (/def|back/.test(text)) return "DEF";
  if (/mid/.test(text)) return "MID";
  if (/for|att|wing|striker|fw/.test(text)) return "FWD";
  return "OTHER";
}

function selectedTeamLineup(team) {
  return state.teamLineups
    .filter((lineup) => lineup.team_id === team.id)
    .sort((left, right) => new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime())[0] || null;
}

function projectedLineup(team) {
  const official = selectedTeamLineup(team);
  if (Array.isArray(official?.lineup_json) && official.lineup_json.length) {
    return {
      source: official.source || "fifa-live",
      formation: official.formation || "Official",
      players: official.lineup_json
    };
  }
  const players = teamPlayersFor(team.id);
  const groups = {
    GK: players.filter((player) => playerPositionGroup(player) === "GK"),
    DEF: players.filter((player) => playerPositionGroup(player) === "DEF"),
    MID: players.filter((player) => playerPositionGroup(player) === "MID"),
    FWD: players.filter((player) => playerPositionGroup(player) === "FWD")
  };
  const picked = [
    ...groups.GK.slice(0, 1),
    ...groups.DEF.slice(0, 4),
    ...groups.MID.slice(0, 3),
    ...groups.FWD.slice(0, 3)
  ];
  const pickedIds = new Set(picked.map((player) => player.id));
  for (const player of players) {
    if (picked.length >= 11) break;
    if (!pickedIds.has(player.id)) picked.push(player);
  }
  return {
    source: "projected",
    formation: "4-3-3",
    players: picked.slice(0, 11)
  };
}

function renderTeamProfile() {
  const team = state.teams.find((item) => item.id === state.selectedTeamId) || state.teams[0];
  if (!team) return `<section class="glass-card panel"><h2>No team selected</h2><p>Run supabase/seed.sql first.</p></section>`;
  const players = teamPlayersFor(team.id);
  const topMarketPlayers = topMarketPlayersForTeam(team.id);
  const squadValue = eurValueText(team.squad_market_value_eur, team.squad_market_value_label);
  const squadValueRank = team.squad_value_rank ? `#${fmt.format(number(team.squad_value_rank))}` : "Rank TBA";
  const ranking = team.fifa_rank
    ? `FIFA #${fmt.format(number(team.fifa_rank))}${team.fifa_points ? ` · ${fmtOne.format(number(team.fifa_points))} pts` : ""}`
    : "FIFA ranking TBA";
  const titleYears = Array.isArray(team.world_cup_title_years) ? team.world_cup_title_years : [];
  const titleCopy = number(team.world_cup_titles)
    ? `${fmt.format(number(team.world_cup_titles))} titles · ${titleYears.join(", ")}`
    : "No World Cup titles yet";
  const lineup = projectedLineup(team);
  const sourceLabel = lineup.source === "fifa-live" ? "FIFA live" : "Dự kiến tự động";
  return `
    <div class="stack team-profile-page">
      <section class="team-profile-hero stadium-surface">
        <div>
          <button class="ghost-button compact-button" data-back-groups>Back</button>
          <span class="kicker">Team profile</span>
          <h1>${teamFlagContent(team)} ${escapeHtml(team.name)}</h1>
          <p>${escapeHtml(team.country || team.name)} · ${escapeHtml(team.group_name ? formatGroupName(team.group_name) : "World Cup 2026")} · ${escapeHtml(team.confederation || "Confederation TBA")}</p>
        </div>
        <div class="team-profile-actions">
          ${state.profile?.role === "admin" ? `
            <button class="ghost-button" data-refresh-all-fifa-teams>Cập nhật tất cả đội bóng</button>
            <button class="ghost-button" data-refresh-transfermarkt-team="${escapeHtml(team.code)}">Sync Transfermarkt</button>
            <button class="primary-button" data-refresh-fifa-team="${escapeHtml(team.code)}">Cập nhật FIFA</button>
          ` : ""}
          <span class="pill">${escapeHtml(ranking)}</span>
        </div>
      </section>
      <section class="team-profile-grid">
        ${profileMetric("Coach", team.coach_name || "TBA")}
        ${profileMetric("World Cup history", titleCopy)}
        ${profileMetric("Squad", `${fmt.format(players.length)} players`)}
        ${profileMetric("Squad value", squadValue)}
        ${profileMetric("Value rank", squadValueRank)}
        ${profileMetric("Transfermarkt ID", team.transfermarkt_team_id || "Not synced")}
      </section>
      <section class="team-sheet-grid">
        <article class="glass-card panel">
          <div class="section-heading">
            <h2>Đội hình ra sân dự kiến</h2>
            <span>${escapeHtml(sourceLabel)} · ${escapeHtml(lineup.formation)}</span>
          </div>
          ${renderInteractivePitch(lineup)}
        </article>
        <article class="glass-card panel">
          <div class="section-heading"><h2>Hồ sơ đội bóng</h2><span>${escapeHtml(team.profile_updated_at ? dateText(team.profile_updated_at) : "seed")}</span></div>
          <p>${escapeHtml(team.name)} đang ở ${escapeHtml(team.group_name ? formatGroupName(team.group_name) : "World Cup 2026")} với ${escapeHtml(ranking)}.</p>
          <p><b>Huấn luyện viên:</b> ${escapeHtml(team.coach_name || "TBA")}</p>
          <p><b>Lịch sử vô địch:</b> ${escapeHtml(titleCopy)}</p>
          <p><b>Squad value:</b> ${escapeHtml(squadValue)}${team.squad_value_updated_at ? ` · ${escapeHtml(dateText(team.squad_value_updated_at))}` : ""}</p>
        </article>
      </section>
      <section class="glass-card panel">
        <div class="section-heading"><h2>Top 5 market values</h2><span>${escapeHtml(squadValue)}</span></div>
        <div class="top-value-list">
          ${topMarketPlayers.map(renderTopMarketPlayer).join("") || `<p class="empty-copy">Transfermarkt values are not synced yet.</p>`}
        </div>
      </section>
      <section class="team-sheet-grid">
        <article class="glass-card panel">
          <div class="section-heading"><h2>Value ranking</h2><span>${escapeHtml(squadValueRank)}</span></div>
          <p>Squad value: <b>${escapeHtml(squadValue)}</b></p>
          <p>FIFA rank: <b>${escapeHtml(ranking)}</b></p>
        </article>
      </section>
      <section class="glass-card roster-panel">
        <div class="section-heading">
          <div>
            <h2>Full squad</h2>
            <p>${escapeHtml(players.length ? "Synced from FIFA squad API" : "Player list is not updated yet")}</p>
          </div>
          <span>${fmt.format(players.length)} players</span>
        </div>
        ${
          players.length
            ? renderRoleSquadSections(players)
            : `<p class="empty-copy">Chưa có roster. Admin bấm Cập nhật FIFA hoặc Sync providers để lấy cầu thủ từ FIFA.</p>`
        }
      </section>
    </div>
  `;
}

function renderTopMarketPlayer(player, index) {
  return `
    <article class="top-value-player">
      <span>#${index + 1}</span>
      <strong>${escapeHtml(player.name)}</strong>
      <small>${escapeHtml(player.position || "Position TBA")} · ${escapeHtml(player.club || "Club TBA")}</small>
      <b>${escapeHtml(eurValueText(player.market_value_eur, player.market_value_label))}</b>
    </article>
  `;
}

function profileMetric(label, value) {
  return `<div class="glass-card metric team-profile-metric"><span>${escapeHtml(label)}</span><strong>${escapeHtml(String(value || "TBA"))}</strong></div>`;
}

function roleDefinitions() {
  return [
    { key: "GK", label: "Goalkeepers", short: "GK", zone: "goalkeeper" },
    { key: "DEF", label: "Defenders", short: "DEF", zone: "defenders" },
    { key: "MID", label: "Midfielders", short: "MID", zone: "midfielders" },
    { key: "FWD", label: "Forwards", short: "FWD", zone: "forwards" }
  ];
}

function roleLabel(key) {
  return roleDefinitions().find((role) => role.key === key)?.label || "Other / Unknown";
}

function groupedPlayersByRole(players) {
  const grouped = { GK: [], DEF: [], MID: [], FWD: [], OTHER: [] };
  for (const player of players) {
    grouped[playerPositionGroup(player)].push(player);
  }
  return grouped;
}

function renderInteractivePitch(lineup) {
  const players = Array.isArray(lineup.players) ? lineup.players : [];
  const grouped = groupedPlayersByRole(players);
  const selected = state.selectedRoleGroup;
  if (!players.length) {
    return `<p class="empty-copy">Chưa có cầu thủ để dựng đội hình dự kiến.</p>`;
  }
  return `
    <div class="pitch-shell">
      <div class="role-filter-row">
        <button class="filter-pill ${selected ? "" : "active"}" data-role-filter="">All roles</button>
        ${roleDefinitions().map((role) => `
          <button class="filter-pill ${selected === role.key ? "active" : ""}" data-role-filter="${role.key}">
            ${role.short} · ${fmt.format(grouped[role.key].length)}
          </button>
        `).join("")}
      </div>
      <div class="football-pitch" aria-label="Interactive projected lineup pitch">
        <div class="pitch-halfway"></div>
        <div class="pitch-center-circle"></div>
        <div class="pitch-box own"></div>
        <div class="pitch-box away"></div>
        ${roleDefinitions().map((role) => renderPitchRoleZone(role, grouped[role.key])).join("")}
      </div>
    </div>
  `;
}

function renderPitchRoleZone(role, players) {
  const selected = state.selectedRoleGroup === role.key;
  return `
    <button class="pitch-role-zone ${role.zone} ${selected ? "active" : ""}" data-role-filter="${role.key}">
      <span class="pitch-role-label">${role.label}</span>
      <strong>${fmt.format(players.length)}</strong>
      <div class="pitch-role-players">
        ${players.map(renderPitchPlayerMarker).join("") || `<span class="pitch-empty-marker">No players</span>`}
      </div>
    </button>
  `;
}

function renderPitchPlayerMarker(player) {
  const label = player.shirt_number ? String(player.shirt_number) : initials(player.name);
  const shortName = String(player.name || "TBA").split(" ").slice(-1)[0] || "TBA";
  return `
    <span class="pitch-player-marker" title="${escapeHtml(player.name || "TBA")}">
      <b>${escapeHtml(label)}</b>
      <small>${escapeHtml(shortName)}</small>
    </span>
  `;
}

function renderRoleSquadSections(players) {
  const grouped = groupedPlayersByRole(players);
  const sections = [
    ...roleDefinitions(),
    ...(grouped.OTHER.length ? [{ key: "OTHER", label: "Other / Unknown", short: "OTHER" }] : [])
  ];
  const selected = state.selectedRoleGroup;
  return `
    <div class="role-squad-layout">
      ${sections.map((role) => {
        const rolePlayers = grouped[role.key] || [];
        const hidden = selected && selected !== role.key;
        return `
          <section class="role-squad-section ${selected === role.key ? "active" : ""} ${hidden ? "dimmed" : ""}" id="role-section-${role.key}">
            <div class="section-heading">
              <h3>${escapeHtml(role.label)}</h3>
              <span>${fmt.format(rolePlayers.length)} players</span>
            </div>
            ${rolePlayers.length ? `<div class="roster-grid">${rolePlayers.map(renderPlayerCard).join("")}</div>` : `<p class="empty-copy">No players in this role.</p>`}
          </section>
        `;
      }).join("")}
    </div>
  `;
}

function renderLineupPlayer(player) {
  const name = player.name || player.player_name || "TBA";
  const position = player.position || player.role || "TBA";
  const shirt = player.shirt_number || player.number || "";
  return `
    <div class="lineup-player">
      <b>${shirt ? `#${escapeHtml(String(shirt))}` : "-"}</b>
      <span>${escapeHtml(name)}</span>
      <small>${escapeHtml(position)}</small>
    </div>
  `;
}

function renderRosterPanel(team) {
  const players = state.teamPlayers
    .filter((player) => player.team_id === team.id)
    .sort((left, right) => String(left.position || "").localeCompare(String(right.position || "")) || number(left.shirt_number) - number(right.shirt_number) || left.name.localeCompare(right.name));
  const ranking = team.fifa_rank
    ? `FIFA #${fmt.format(number(team.fifa_rank))}${team.fifa_points ? ` · ${fmtOne.format(number(team.fifa_points))} pts` : ""}`
    : "Team rating not synced yet";
  return `
    <section class="roster-panel glass-card">
      <div class="section-heading">
        <div>
          <h2>${teamFlagContent(team)} ${escapeHtml(team.name)} players</h2>
          <p>${escapeHtml(team.group_name ? formatGroupName(team.group_name) : "World Cup 2026")} roster · ${escapeHtml(ranking)}</p>
        </div>
        <button class="ghost-button" data-close-roster>Close</button>
      </div>
      ${
        players.length
          ? `<div class="roster-grid">${players.map(renderPlayerCard).join("")}</div>`
          : `<p class="empty-copy">Player list is not updated yet. Add real roster rows to public.team_players when available.</p>`
      }
    </section>
  `;
}

function renderPlayerCard(player) {
  const rating = player.overall_rating ? `OVR ${fmt.format(number(player.overall_rating))}` : (player.rating_source ? "Rating pending" : "OVR TBA");
  const marketValue = number(player.market_value_eur) ? eurValueText(player.market_value_eur, player.market_value_label) : "";
  const club = player.club || player.source || "Club TBA";
  const bio = [
    player.shirt_number ? `#${fmt.format(player.shirt_number)}` : "No number",
    player.height_cm ? `${fmt.format(number(player.height_cm))} cm` : null,
    player.weight_kg ? `${fmt.format(number(player.weight_kg))} kg` : null
  ].filter(Boolean).join(" · ");
  return `
    <article class="player-card">
      ${player.photo_url ? `<img src="${escapeHtml(player.photo_url)}" alt="${escapeHtml(player.name)}" loading="lazy">` : ""}
      <strong>${escapeHtml(player.name)}</strong>
      <span>${escapeHtml(player.position || "Position TBA")}</span>
      <small>${escapeHtml(bio)} · ${escapeHtml(club)}</small>
      <b>${escapeHtml(marketValue || rating)}</b>
    </article>
  `;
}

function renderDetail() {
  const selectedDate = state.selectedCalendarDate;
  const matches = filteredScheduleMatches({ useSearch: false, dateKey: selectedDate })
    .filter((match) => canPredictMatch(match))
    .sort((left, right) => new Date(left.starts_at).getTime() - new Date(right.starts_at).getTime());
  const forecastMatch = spotlightMatchFor(matches, { preferSelected: true });
  return `
    <div class="stack prediction-schedule-page">
      <div class="section-heading">
        <div>
          <h1>Dự đoán</h1>
          <p>Chọn trận theo ngày, giờ và bảng; cửa sổ cược sẽ mở ngay trên lịch.</p>
        </div>
        <span>${fmt.format(matches.length)} trận mở cược</span>
      </div>
      ${renderScheduleFilters({ includeSearchPanel: true })}
      ${forecastMatch ? renderMatchValueForecast(forecastMatch) : ""}
      <div class="prediction-layout">
        <div class="prediction-main-column">
          ${renderPredictionSchedule(matches)}
        </div>
        <aside class="prediction-side-column">
          ${renderPredictionMiniCalendar()}
        </aside>
      </div>
      ${state.confirmRebetMatchId ? renderRebetConfirmModal() : ""}
      ${state.betModalMatchId ? renderBetModal() : ""}
    </div>
  `;
}

function renderPredictionSchedule(matches) {
  const groups = groupMatchesByVnDate(matches);
  const selectedDate = state.selectedCalendarDate;
  return `
    <section class="glass-card prediction-schedule">
      <div class="section-heading">
        <div>
          <h2>Lịch cược</h2>
          ${selectedDate ? `<p>Đang xem ${escapeHtml(dateHeadingText(selectedDate))}</p>` : ""}
        </div>
        <span>Asia/Ho_Chi_Minh</span>
      </div>
      ${selectedDate ? `<button class="ghost-button compact-button calendar-clear-button" type="button" data-calendar-clear>Bỏ lọc ngày</button>` : ""}
      ${groups.map(([dateKey, dayMatches]) => renderPredictionDayGroup(dateKey, dayMatches)).join("") || `<p class="empty-copy">Không có trận đang mở cược trong bộ lọc này.</p>`}
    </section>
  `;
}

function renderPredictionMiniCalendar() {
  const monthKey = activeCalendarMonth();
  const density = calendarDaysWithMatchDensity(monthKey);
  const selectedDate = state.selectedCalendarDate;
  const selectedMatches = selectedDate
    ? predictionOpenMatches().filter((match) => vnDateKey(match.starts_at) === selectedDate)
    : [];
  return `
    <section class="glass-card prediction-calendar">
      <div class="calendar-head">
        <div>
          <h2>Lịch tháng</h2>
          <span>${escapeHtml(calendarMonthLabel(monthKey))}</span>
        </div>
        <div class="calendar-nav">
          <button class="icon-button" type="button" data-calendar-month="-1" aria-label="Tháng trước">‹</button>
          <button class="icon-button" type="button" data-calendar-month="1" aria-label="Tháng sau">›</button>
        </div>
      </div>
      <div class="calendar-weekdays">
        ${["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((day) => `<span>${day}</span>`).join("")}
      </div>
      <div class="calendar-grid">
        ${calendarCells(monthKey, density, selectedDate).join("")}
      </div>
      <div class="calendar-legend">
        <span><i class="density-low"></i>Ít</span>
        <span><i class="density-medium"></i>Vừa</span>
        <span><i class="density-high"></i>Nhiều</span>
      </div>
      ${
        selectedDate
          ? `<div class="calendar-day-preview">
              <div>
                <strong>${escapeHtml(dateHeadingText(selectedDate))}</strong>
                <span>${fmt.format(selectedMatches.length)} trận mở cược</span>
              </div>
              ${selectedMatches.slice(0, 4).map((match) => `
                <button type="button" data-open-bet-modal="${match.id}">
                  <span>${escapeHtml(matchTitle(match))}</span>
                  <small>${timeText(match.starts_at)}</small>
                </button>
              `).join("")}
              <button class="ghost-button compact-button" type="button" data-calendar-clear>Bỏ chọn ngày</button>
            </div>`
          : `<p class="empty-copy">Ngày có nhiều trận sẽ được tô đậm hơn. Bấm vào ngày để lọc Lịch cược.</p>`
      }
    </section>
  `;
}

function predictionOpenMatches() {
  return state.matches
    .filter((match) => canPredictMatch(match))
    .sort((left, right) => new Date(left.starts_at).getTime() - new Date(right.starts_at).getTime());
}

function activeCalendarMonth() {
  if (state.selectedCalendarDate) {
    state.calendarMonth = monthKeyFromDateKey(state.selectedCalendarDate);
    return state.calendarMonth;
  }
  const fallback = calendarMonthForOpenMatches();
  const openMonths = openCalendarMonths();
  if (!state.calendarMonth || (openMonths.length && !openMonths.includes(state.calendarMonth))) {
    state.calendarMonth = fallback;
  }
  return state.calendarMonth;
}

function calendarMonthForOpenMatches() {
  const matches = predictionOpenMatches();
  if (!matches.length) return monthKeyFromDate(new Date());
  const now = Date.now();
  const upcoming = matches.find((match) => new Date(match.starts_at).getTime() >= now) || matches[0];
  return monthKeyFromDate(upcoming.starts_at);
}

function openCalendarMonths() {
  return [...new Set(predictionOpenMatches().map((match) => monthKeyFromDate(match.starts_at)))]
    .sort((left, right) => left.localeCompare(right));
}

function adjacentCalendarMonth(currentMonth, direction) {
  const months = openCalendarMonths();
  const currentIndex = months.indexOf(currentMonth);
  if (currentIndex >= 0) {
    const nextIndex = currentIndex + direction;
    if (months[nextIndex]) return months[nextIndex];
  }
  return addMonthsToMonthKey(currentMonth, direction);
}

function calendarDaysWithMatchDensity(monthKey) {
  const days = new Map();
  predictionOpenMatches().forEach((match) => {
    const dateKey = vnDateKey(match.starts_at);
    if (!dateKey.startsWith(monthKey)) return;
    const current = days.get(dateKey) || { count: 0, matches: [] };
    current.count += 1;
    current.matches.push(match);
    days.set(dateKey, current);
  });
  return days;
}

function calendarCells(monthKey, density, selectedDate) {
  const [year, month] = monthKey.split("-").map(Number);
  const firstDay = new Date(Date.UTC(year, month - 1, 1));
  const offset = (firstDay.getUTCDay() + 6) % 7;
  const dayCount = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells = Array.from({ length: offset }, () => `<span class="calendar-day empty"></span>`);
  for (let day = 1; day <= dayCount; day += 1) {
    const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const info = density.get(dateKey);
    const count = info?.count || 0;
    const densityClass = calendarDensityClass(count);
    const selectedClass = selectedDate === dateKey ? "selected" : "";
    const label = count ? `${fmt.format(count)} trận` : "Không có trận mở cược";
    cells.push(`
      <button class="calendar-day ${densityClass} ${selectedClass}" type="button" data-calendar-date="${dateKey}" ${count ? "" : "disabled"} aria-label="${escapeHtml(`${day}: ${label}`)}">
        <span>${day}</span>
        ${count ? `<small>${count}</small>` : ""}
      </button>
    `);
  }
  return cells;
}

function calendarDensityClass(count) {
  if (count >= 4) return "density-high";
  if (count >= 2) return "density-medium";
  if (count >= 1) return "density-low";
  return "";
}

function monthKeyFromDate(value) {
  return vnDateKey(value).slice(0, 7);
}

function monthKeyFromDateKey(dateKey) {
  return String(dateKey || "").slice(0, 7) || monthKeyFromDate(new Date());
}

function addMonthsToMonthKey(monthKey, delta) {
  const [year, month] = String(monthKey || monthKeyFromDate(new Date())).split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function calendarMonthLabel(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "UTC",
    month: "long",
    year: "numeric"
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

function groupMatchesByVnDate(matches) {
  const groups = new Map();
  matches.forEach((match) => {
    const key = vnDateKey(match.starts_at);
    groups.set(key, [...(groups.get(key) || []), match]);
  });
  return [...groups.entries()];
}

function renderPredictionDayGroup(dateKey, matches) {
  return `
    <section class="prediction-day-group">
      <div class="prediction-day-heading">
        <h3>${escapeHtml(dateHeadingText(dateKey))}</h3>
        <span>${fmt.format(matches.length)} trận</span>
      </div>
      <div class="prediction-match-list">
        ${matches.map(renderPredictionMatchRow).join("")}
      </div>
    </section>
  `;
}

function renderPredictionMatchRow(match) {
  const openMarkets = (match.match_markets || []).filter(isBettableMarket).length;
  const betSummary = matchBetSummary(match);
  const urgency = matchUrgency(match);
  return `
    <button class="prediction-match-row ${betSummary.hasBets ? "has-open-bet" : ""} ${urgency.className}" type="button" data-open-bet-modal="${match.id}">
      <time>${timeText(match.starts_at)}</time>
      <span class="group-badge">${escapeHtml(match.group_name ? formatGroupName(match.group_name) : "Knockout")}</span>
      <span class="prediction-pair">
        <strong>${escapeHtml(match.home_team?.name || "TBA")}</strong>
        <b>VS</b>
        <strong>${escapeHtml(match.away_team?.name || "TBA")}</strong>
      </span>
      <span>${escapeHtml(matchLocation(match))}</span>
      <span class="prediction-status-stack">
        ${urgency.badgeHtml}
        ${betSummary.badgeHtml}
        <small>${fmt.format(openMarkets)} kèo</small>
      </span>
    </button>
  `;
}

function userOpenBetsForMatch(match) {
  if (!match) return [];
  return state.bets
    .filter((bet) => bet.status === "placed" && Number(bet.match_id) === Number(match.id))
    .sort((left, right) => String(left.market_key || "").localeCompare(String(right.market_key || ""), "vi"));
}

function matchBetSummary(match) {
  const bets = userOpenBetsForMatch(match);
  if (!bets.length) {
    return { hasBets: false, bets, correctScoreBet: null, label: "", badgeHtml: "" };
  }
  const correctScoreBet = bets.find((bet) => bet.market_key === "correct_score") || null;
  const label = correctScoreBet
    ? `Đã cược tỷ số: ${scoreLabelFromBet(correctScoreBet)}`
    : `Đã cược ${fmt.format(bets.length)} mục`;
  return {
    hasBets: true,
    bets,
    correctScoreBet,
    label,
    badgeHtml: `<span class="bet-status-badge">${escapeHtml(label)}</span>`
  };
}

function scoreLabelFromBet(bet) {
  const json = bet?.selection_json || {};
  if (json.home_score !== undefined && json.away_score !== undefined) {
    return `${number(json.home_score)} - ${number(json.away_score)}`;
  }
  const parsed = String(bet?.selection_key || "").match(/^(\d+)-(\d+)$/);
  if (parsed) return `${Number(parsed[1])} - ${Number(parsed[2])}`;
  return bet?.selection_label || "-";
}

function shouldConfirmRebet(match) {
  return userOpenBetsForMatch(match).length > 0;
}

function matchCloseTime(match) {
  const now = Date.now();
  const closeTimes = (match?.match_markets || [])
    .filter((market) => market.is_open !== false)
    .map((market) => new Date(market.closes_at || match.starts_at))
    .filter((date) => Number.isFinite(date.getTime()) && date.getTime() > now)
    .sort((left, right) => left.getTime() - right.getTime());
  return closeTimes[0] || null;
}

function matchUrgency(match) {
  const closeTime = matchCloseTime(match);
  if (!closeTime) return { level: "", className: "", badgeHtml: "" };
  const hours = (closeTime.getTime() - Date.now()) / 36e5;
  if (hours <= 24) {
    return {
      level: "lock",
      className: "urgency-lock",
      badgeHtml: `<span class="urgency-badge lock">Sắp khóa</span>`
    };
  }
  if (hours <= 72) {
    return {
      level: "soon",
      className: "urgency-soon",
      badgeHtml: `<span class="urgency-badge soon">Sắp diễn ra</span>`
    };
  }
  return { level: "", className: "", badgeHtml: "" };
}

function renderRebetConfirmModal() {
  const match = state.matches.find((item) => Number(item.id) === Number(state.confirmRebetMatchId));
  if (!match) return "";
  const summary = matchBetSummary(match);
  return `
    <div class="modal-backdrop rebet-backdrop" data-rebet-backdrop>
      <section class="rebet-modal glass-card" role="dialog" aria-modal="true" aria-label="Xác nhận cập nhật cược" data-rebet-panel>
        <div class="modal-head">
          <div>
            <span class="pill">${escapeHtml(scheduleLabel(match))}</span>
            <h2>Bạn đã cược trận này</h2>
            <p>${escapeHtml(matchTitle(match))} · ${dateText(match.starts_at)}</p>
          </div>
          <button class="icon-button" type="button" data-cancel-rebet aria-label="Đóng">×</button>
        </div>
        <div class="rebet-summary">
          <strong>${escapeHtml(summary.label)}</strong>
          <div class="rebet-bet-list">
            ${summary.bets.map((bet) => `
              <span>
                <b>${escapeHtml(modalMarketTitle(bet.market_key, bet.market_key))}</b>
                ${escapeHtml(bet.market_key === "correct_score" ? scoreLabelFromBet(bet) : bet.selection_label)} · ${money(bet.stake)}
              </span>
            `).join("")}
          </div>
        </div>
        <p class="empty-copy">Bạn có muốn mở lại kèo đấu để cập nhật lựa chọn hoặc số tiền cược không?</p>
        <div class="modal-submit-row">
          <button class="ghost-button" type="button" data-cancel-rebet>Hủy</button>
          <button class="primary-button" type="button" data-confirm-rebet="${match.id}">Tiếp tục cập nhật</button>
        </div>
      </section>
    </div>
  `;
}

function renderBetModal() {
  const match = state.matches.find((item) => item.id === state.betModalMatchId) || selectedMatch();
  if (!match) return "";
  if (state.betModalMarketGroup === "advanced") state.betModalMarketGroup = "basic";
  const allOpenMarkets = (match.match_markets || []).filter(isBettableMarket);
  const basicMarkets = allOpenMarkets.filter((market) => isBasicMarket(market.market_key, market));
  const activeGroups = modalMarketGroups(basicMarkets, "basic");
  return `
    <div class="modal-backdrop" data-close-bet-modal>
      <section class="bet-modal glass-card" role="dialog" aria-modal="true" aria-label="Đặt cược ${escapeHtml(matchTitle(match))}" data-modal-panel>
        <div class="modal-head">
          <div>
            <span class="pill">${escapeHtml(scheduleLabel(match))}</span>
            <h2>${escapeHtml(matchTitle(match))}</h2>
            <p>${dateText(match.starts_at)} · ${escapeHtml(matchLocation(match))}</p>
          </div>
          <button class="icon-button" type="button" data-close-bet-modal aria-label="Đóng">×</button>
        </div>
        ${renderModalMatchForecast(match)}
        <form class="modal-bet-form" id="modal-bulk-bet-form">
          <div class="bet-modal-toolbar">
            <div class="modal-wallet-summary">
              <span>Ví còn lại</span>
              <strong>${money(state.profile?.wallet_balance)}</strong>
            </div>
            <div class="segmented-control">
              <button type="button" class="${state.betModalMarketGroup === "basic" ? "active" : ""}" data-bet-modal-tab="basic">Cơ bản</button>
            </div>
          </div>
          <div class="modal-market-stack">
            ${activeGroups.map((group) => renderModalBetSection(match, group)).join("") || `<p class="empty-copy">Chưa có kèo trong nhóm này.</p>`}
          </div>
          <div class="modal-submit-row">
            <span>${escapeHtml(modalSelectedSummary(match))}</span>
            <button class="primary-button" ${state.isSubmittingBet ? "disabled" : ""}>${state.isSubmittingBet ? renderBouncingBall("Dang luu cuoc...") : "Lưu mục đã chọn"}</button>
          </div>
        </form>
      </section>
    </div>
  `;
}

function renderModalMatchForecast(match) {
  const forecast = matchValueForecast(match);
  const homePct = forecast?.homePct ?? 50;
  const awayPct = forecast?.awayPct ?? 50;
  const leader = matchLeader(match, homePct, awayPct);
  return `
    <section class="modal-forecast value-forecast ${leader}-lean">
      <div class="forecast-heading">
        <div>
          <h3>Đánh giá trận đấu</h3>
          <p>${forecast ? "Dựa trên FIFA rank, điểm rating và giá trị đội hình." : "Chưa đủ dữ liệu, tạm cân bằng 50/50."}</p>
        </div>
      </div>
      <div class="forecast-team-grid">
        ${renderForecastTeamPanel(match.home_team, homePct, leader === "home", "home")}
        ${renderForecastTeamPanel(match.away_team, awayPct, leader === "away", "away")}
      </div>
      <div class="win-rate-block">
        <div class="win-rate-labels">
          <span>${escapeHtml(match.home_team.name)} ${homePct}%</span>
          <span>${escapeHtml(match.away_team.name)} ${awayPct}%</span>
        </div>
        <div class="forecast-meter win-rate-meter">
          <div class="home-rate" style="width:${homePct}%"></div>
        </div>
      </div>
    </section>
  `;
}

function modalMarketGroups(markets, group) {
  const groups = new Map();
  markets.forEach((market) => {
    groups.set(market.market_key, [...(groups.get(market.market_key) || []), market]);
  });
  const order = group === "basic" ? ["correct_score", "total_goals", "match_result", "asian_handicap"] : [];
  return [...groups.entries()]
    .map(([marketKey, items]) => ({ marketKey, label: modalMarketTitle(marketKey, items[0]?.label), markets: sortMarketsForDisplay(items) }))
    .sort((left, right) => {
      const leftIndex = order.indexOf(left.marketKey);
      const rightIndex = order.indexOf(right.marketKey);
      if (leftIndex >= 0 || rightIndex >= 0) return (leftIndex < 0 ? 999 : leftIndex) - (rightIndex < 0 ? 999 : rightIndex);
      return left.label.localeCompare(right.label, "vi");
    });
}

function sortMarketsForDisplay(markets) {
  return [...(markets || [])].sort((left, right) => {
    if (["total_goals", "asian_handicap"].includes(left.market_key) && left.market_key === right.market_key) {
      return number(left.line) - number(right.line)
        || marketSelectionOrder(left.selection_key) - marketSelectionOrder(right.selection_key)
        || Number(left.id) - Number(right.id);
    }
    return marketSelectionOrder(left.selection_key) - marketSelectionOrder(right.selection_key)
      || Number(left.id) - Number(right.id);
  });
}

function marketSelectionOrder(selectionKey) {
  return { home: 1, draw: 2, away: 3, over: 4, under: 5, yes: 6, no: 7, exact: 8 }[selectionKey] || 99;
}

function renderModalBetSection(match, group) {
  const draft = ensureBetModalDraft(match, group.marketKey, group.markets);
  const existing = existingOpenBet(match, group.marketKey);
  const selectedMarket = selectedDraftMarket(group.markets, draft);
  const enabled = Boolean(draft.enabled);
  const stake = number(draft.stake || existing?.stake || 100);
  const displayMultiplier = modalMarketMultiplier(group.marketKey, selectedMarket, draft);
  const payout = selectedMarket ? stake * displayMultiplier : 0;
  const helpText = modalMarketHelpText(group.marketKey);
  const multiplierText = group.marketKey === "correct_score" && !displayMultiplier
    ? "No odds"
    : `x${fmtOne.format(displayMultiplier || number(group.markets[0]?.odds_multiplier || 1))}`;
  return `
    <section class="modal-market-card ${enabled ? "open" : ""}" data-bet-market-card="${escapeHtml(group.marketKey)}">
      <div class="modal-market-card-head">
        <label class="modal-market-toggle">
          <input type="checkbox" data-modal-market-toggle="${escapeHtml(group.marketKey)}" ${enabled ? "checked" : ""}>
          <span class="toggle-box"></span>
          <span>
            <strong class="modal-market-title">
              ${escapeHtml(group.label)}
              ${helpText ? `<span class="market-help" tabindex="0" aria-label="${escapeHtml(helpText)}" data-tooltip="${escapeHtml(helpText)}">?</span>` : ""}
            </strong>
            <small>${existing ? `Đang mở: ${escapeHtml(existing.selection_label)} · ${money(existing.stake)}` : `${fmt.format(group.markets.length)} lựa chọn`}</small>
          </span>
        </label>
        <span class="pill">${multiplierText}</span>
      </div>
      ${
        enabled
          ? `<div class="modal-market-card-body">
              ${
                group.marketKey === "correct_score"
                  ? `<div class="score-picker compact">
                      ${scoreStepper("modal-score-home", match.home_team?.name || "Đội nhà", number(draft.homeScore ?? 1))}
                      <span class="vs-text">-</span>
                      ${scoreStepper("modal-score-away", match.away_team?.name || "Đội khách", number(draft.awayScore ?? 0))}
                    </div>
                    <small class="score-odds-hint">${escapeHtml(correctScoreOddsHint(selectedMarket, draft))}</small>`
                  : renderModalSelectionOptions(group, draft)
              }
              <div class="modal-stake-grid">
                <label>Tiền cược<input data-modal-market-stake="${escapeHtml(group.marketKey)}" type="text" inputmode="numeric" autocomplete="off" value="${formatStakeInput(stake)}">${renderStakeWalletShare(stake, { marketKey: group.marketKey })}</label>
                <div>
                  <small>Payout dự kiến</small>
                  <strong>${money(payout)}</strong>
                </div>
              </div>
            </div>`
          : ""
      }
    </section>
  `;
}

function renderModalSelectionOptions(group, draft) {
  return `
    <div class="modal-selection-list">
      ${group.markets.map((market) => {
        const checked = Number(draft.marketId) === Number(market.id);
        return `
          <label class="modal-selection-card ${checked ? "selected" : ""}">
            <input type="radio" name="modal-market-${escapeHtml(group.marketKey)}" data-modal-market-choice="${escapeHtml(group.marketKey)}" value="${market.id}" ${checked ? "checked" : ""}>
            <span>
              <strong>${escapeHtml(market.selection_label)}</strong>
              <small>x${fmtOne.format(number(market.odds_multiplier))} · ${escapeHtml(oddsFreshnessLabel(market))}</small>
            </span>
          </label>
        `;
      }).join("")}
    </div>
  `;
}

function modalMarketTitle(marketKey, fallback = "") {
  const labels = {
    correct_score: "Dự đoán tỷ số",
    match_result: "Đội thắng / hòa / thua",
    draw_no_bet: "Draw no bet",
    total_goals: "Tài/Xỉu bàn thắng",
    btts: "Hai đội cùng ghi bàn",
    corners_total: "Tổng phạt góc",
    cards_total: "Tổng thẻ",
    asian_handicap: "Kèo châu Á (Handicap)"
  };
  return labels[marketKey] || fallback || marketKey;
}

function modalMarketHelpText(marketKey) {
  if (marketKey === "correct_score") {
    return "The Odds API khong tra truc tiep correct_score; he thong suy ra fair odds tung ty so tu keo 1X2 va Tai/Xiu bang mo hinh Poisson.";
  }
  const notes = {
    total_goals: "Tài/Xỉu dùng đúng line nhà cái trả về cho từng trận. Nếu provider chưa có totals thì mới dùng fallback internal.",
    asian_handicap: "Kèo châu Á chỉ mở khi có handicap/spreads từ nhà cái. Nếu tỷ số sau handicap bằng nhau, cược được hoàn tiền."
  };
  return notes[marketKey] || "";
}

function ensureBetModalDraft(match, marketKey, markets) {
  if (!state.betModalDraft) state.betModalDraft = {};
  const existing = existingOpenBet(match, marketKey);
  const existingMarket = existing ? markets.find((market) => Number(market.id) === Number(existing.market_id)) : null;
  const fallbackMarket = existingMarket || markets[0] || null;
  if (!state.betModalDraft[marketKey]) {
    const score = marketKey === "correct_score" ? scoreFromExistingBet(existing) : { homeScore: 1, awayScore: 0 };
    state.betModalDraft[marketKey] = {
      enabled: Boolean(existing),
      stake: number(existing?.stake || 100),
      marketId: fallbackMarket?.id || null,
      homeScore: score.homeScore,
      awayScore: score.awayScore
    };
  }
  const draft = state.betModalDraft[marketKey];
  if (!markets.some((market) => Number(market.id) === Number(draft.marketId))) {
    draft.marketId = fallbackMarket?.id || null;
  }
  return draft;
}

function scoreFromExistingBet(existing) {
  const json = existing?.selection_json || {};
  if (json.home_score !== undefined && json.away_score !== undefined) {
    return { homeScore: number(json.home_score), awayScore: number(json.away_score) };
  }
  const parsed = String(existing?.selection_key || "").match(/^(\d+)-(\d+)$/);
  if (parsed) {
    return { homeScore: Number(parsed[1]), awayScore: Number(parsed[2]) };
  }
  return { homeScore: 1, awayScore: 0 };
}

function selectedDraftMarket(markets, draft) {
  return markets.find((market) => Number(market.id) === Number(draft.marketId)) || markets[0] || null;
}

function modalMarketMultiplier(marketKey, market, draft = {}) {
  if (!market) return 0;
  if (marketKey !== "correct_score") return number(market.odds_multiplier);
  const homeScore = Math.max(0, number(draft.homeScore ?? 0));
  const awayScore = Math.max(0, number(draft.awayScore ?? 0));
  return correctScoreFairOdds(market, homeScore, awayScore);
}

function correctScoreFairOdds(market, homeScore, awayScore) {
  const extra = marketExtra(market);
  const score = `${Math.max(0, number(homeScore))}-${Math.max(0, number(awayScore))}`;
  const row = extra.score_odds?.[score];
  return number(row?.fair_odds || 0);
}

function correctScoreOddsHint(market, draft = {}) {
  const homeScore = Math.max(0, number(draft.homeScore ?? 0));
  const awayScore = Math.max(0, number(draft.awayScore ?? 0));
  const score = `${homeScore}-${awayScore}`;
  const multiplier = correctScoreFairOdds(market, homeScore, awayScore);
  const extra = marketExtra(market);
  if (!extra.score_odds?.[score]) return `Ty le ${score}: chua co odds nha cai`;
  return `Ty le ${score}: x${fmtOne.format(multiplier)} (model nha cai)`;
}

function existingOpenBet(match, marketKey) {
  if (!match) return null;
  return state.bets
    .filter((bet) => bet.status === "placed" && Number(bet.match_id) === Number(match.id) && bet.market_key === marketKey)
    .sort((left, right) => new Date(right.placed_at).getTime() - new Date(left.placed_at).getTime())[0] || null;
}

function syncBetModalDraftFromDom() {
  const panel = document.querySelector("[data-modal-panel]");
  if (!panel) return;
  panel.querySelectorAll("[data-bet-market-card]").forEach((card) => {
    const marketKey = card.dataset.betMarketCard;
    if (!marketKey) return;
    const draft = state.betModalDraft[marketKey] || (state.betModalDraft[marketKey] = {});
    const toggle = card.querySelector("[data-modal-market-toggle]");
    const choice = card.querySelector("[data-modal-market-choice]:checked");
    const stake = card.querySelector("[data-modal-market-stake]");
    draft.enabled = Boolean(toggle?.checked);
    if (choice) draft.marketId = Number(choice.value);
    if (stake) draft.stake = parseStakeInput(stake.value);
    if (marketKey === "correct_score") {
      draft.homeScore = Number(document.getElementById("modal-score-home")?.value || draft.homeScore || 0);
      draft.awayScore = Number(document.getElementById("modal-score-away")?.value || draft.awayScore || 0);
    }
  });
}

function prepareStakeInput(input) {
  if (!input) return;
  input.type = "text";
  input.inputMode = "numeric";
  input.value = formatStakeInput(parseStakeInput(input.value));
}

function handleStakeInput(event) {
  const input = event.currentTarget;
  input.value = formatStakeInput(parseStakeInput(input.value));
  updateStakeShareForInput(input);
}

function updateModalDerivedValues() {
  const match = state.matches.find((item) => item.id === state.betModalMatchId) || selectedMatch();
  if (!match) return;
  syncBetModalDraftFromDom();
  const allOpenMarkets = (match.match_markets || []).filter(isBettableMarket);
  for (const group of modalMarketGroups(allOpenMarkets, "all")) {
    const draft = state.betModalDraft?.[group.marketKey] || {};
    const selectedMarket = selectedDraftMarket(group.markets, draft);
    const multiplier = modalMarketMultiplier(group.marketKey, selectedMarket, draft);
    const payoutNode = document.querySelector(`[data-bet-market-card="${group.marketKey}"] .modal-stake-grid strong`);
    if (payoutNode) payoutNode.textContent = money(number(draft.stake) * multiplier);
    const shareNode = document.querySelector(`[data-stake-wallet-share="${group.marketKey}"]`);
    if (shareNode) {
      shareNode.textContent = stakeWalletShare(draft.stake);
      shareNode.classList.toggle("over", stakeWalletShareClass(draft.stake) === "over");
    }
    const pillNode = document.querySelector(`[data-bet-market-card="${group.marketKey}"] .modal-market-card-head .pill`);
    if (pillNode) {
      pillNode.textContent = group.marketKey === "correct_score" && !multiplier
        ? "No odds"
        : `x${fmtOne.format(multiplier || number(selectedMarket?.odds_multiplier || 1))}`;
    }
    const scoreHintNode = document.querySelector(`[data-bet-market-card="${group.marketKey}"] .score-odds-hint`);
    if (scoreHintNode && group.marketKey === "correct_score") scoreHintNode.textContent = correctScoreOddsHint(selectedMarket, draft);
  }
  const summary = document.querySelector("#modal-bulk-bet-form .modal-submit-row span");
  if (summary) summary.textContent = modalSelectedSummary(match);
}

function modalSelectedSummary(match) {
  const { payloads, totalExtra } = collectModalBetPayloads(match, { quiet: true });
  if (!payloads.length) return "Tick chọn một hoặc nhiều mục để đặt cược.";
  return `${fmt.format(payloads.length)} mục đã chọn · cần thêm ${money(totalExtra)} từ ví`;
}

function collectModalBetPayloads(match, options = {}) {
  if (!options.quiet) syncBetModalDraftFromDom();
  const allOpenMarkets = (match?.match_markets || []).filter(isBettableMarket);
  const groups = modalMarketGroups(allOpenMarkets, "all");
  const payloads = [];
  let netStakeDelta = 0;
  for (const group of groups) {
    const draft = state.betModalDraft?.[group.marketKey];
    if (!draft?.enabled) continue;
    const market = selectedDraftMarket(group.markets, draft);
    const stake = number(draft.stake);
    if (!market || stake <= 0) {
      if (options.quiet) continue;
      throw new Error(`Vui lòng nhập tiền cược hợp lệ cho ${group.label}.`);
    }
    const existing = existingOpenBet(match, group.marketKey);
    const stakeDelta = stake - number(existing?.stake);
    netStakeDelta += stakeDelta;
    if (group.marketKey === "correct_score") {
      if (!modalMarketMultiplier(group.marketKey, market, draft)) {
        if (options.quiet) continue;
        throw new Error("Ty so da chon chua co odds nha cai.");
      }
      const homeScore = Math.max(0, number(draft.homeScore));
      const awayScore = Math.max(0, number(draft.awayScore));
      payloads.push({
        _stake_delta: stakeDelta,
        p_match_id: match.id,
        p_market_id: market.id,
        p_selection_key: `${homeScore}-${awayScore}`,
        p_selection_label: `${homeScore} - ${awayScore}`,
        p_stake: stake,
        p_selection_json: { home_score: homeScore, away_score: awayScore }
      });
    } else {
      payloads.push({
        _stake_delta: stakeDelta,
        p_match_id: match.id,
        p_market_id: market.id,
        p_selection_key: market.selection_key,
        p_selection_label: market.selection_label,
        p_stake: stake,
        p_selection_json: { line: market.line }
      });
    }
  }
  const orderedPayloads = payloads
    .sort((left, right) => left._stake_delta - right._stake_delta)
    .map(({ _stake_delta, ...payload }) => payload);
  return { payloads: orderedPayloads, totalExtra: Math.max(0, netStakeDelta) };
}

function isBasicMarket(key, market = null) {
  if (key === "total_goals") return true;
  if (key === "draw_no_bet") return false;
  if (key === "asian_handicap") return market?.source === "odds-api";
  if (key === "correct_score") return market?.source === "odds-model" && Boolean(marketExtra(market).score_odds);
  return key === "match_result";
}

function isBettableMarket(market) {
  if (!market || market.is_open !== true) return false;
  if (market.market_key === "draw_no_bet") return false;
  if (market.market_key === "asian_handicap") return market.source === "odds-api";
  if (market.market_key === "correct_score") return market.source === "odds-model" && Boolean(marketExtra(market).score_odds);
  return true;
}

function renderMarketButton(market) {
  return `
    <button class="market-button" data-market="${market.id}" ${state.isSubmittingBet ? "disabled" : ""}>
      <span>${escapeHtml(market.label)}</span>
      <strong>${escapeHtml(market.selection_label)}</strong>
      <small>x${fmtOne.format(number(market.odds_multiplier))} · ${escapeHtml(oddsFreshnessLabel(market))}</small>
    </button>
  `;
}

function renderOutrightButton(market) {
  return `
    <button class="outright-button" data-outright="${market.id}" ${state.isSubmittingBet ? "disabled" : ""}>
      <span class="outright-label">
        <span>${escapeHtml(market.selection_label)}</span>
        <small>${escapeHtml(oddsFreshnessLabel(market))}</small>
      </span>
      <strong>x${fmtOne.format(number(market.odds_multiplier))}</strong>
    </button>
  `;
}

function renderOutrightSearchCard(marketKey) {
  const isGoldenBoot = marketKey === "golden_boot";
  const searchKey = isGoldenBoot ? "goldenBootSearch" : "winnerSearch";
  const inputId = isGoldenBoot ? "golden-boot-search" : "winner-search";
  const selectId = isGoldenBoot ? "golden-boot-select" : "winner-select";
  const stakeId = isGoldenBoot ? "golden-boot-stake" : "winner-stake";
  const formId = isGoldenBoot ? "golden-boot-form" : "winner-form";
  const markets = openOutrightMarkets(marketKey);
  const filtered = filteredOutrightMarkets(marketKey);
  const emptyCopy = isGoldenBoot
    ? "Chưa có odds nhà cái cho Vua phá lưới."
    : "Chưa có kèo vô địch từ nhà cái.";

  if (!markets.length) return `<p class="empty-copy">${emptyCopy}</p>`;

  return `
    <form class="outright-search-card" id="${formId}" data-outright-key="${marketKey}">
      <label class="search-field">
        Search
        <input id="${inputId}" value="${escapeHtml(state[searchKey])}" placeholder="${isGoldenBoot ? "Tên cầu thủ, đội, CLB..." : "Tên đội, mã đội..."}">
      </label>
      <label>
        ${isGoldenBoot ? "Cầu thủ" : "Đội tuyển"}
        <select id="${selectId}" required ${filtered.length ? "" : "disabled"}>
          ${outrightOptionsHtml(filtered, isGoldenBoot)}
        </select>
      </label>
      <label>
        Tiền cược
        <input id="${stakeId}" type="text" inputmode="numeric" autocomplete="off" value="${formatStakeInput(100)}">
        ${renderStakeWalletShare(100, { forId: stakeId })}
      </label>
      <button class="primary-button wide" type="submit" ${filtered.length && !state.isSubmittingBet ? "" : "disabled"}>${state.isSubmittingBet ? renderBouncingBall("Dang dat cuoc...") : (isGoldenBoot ? "Đặt Vua phá lưới" : "Đặt vô địch")}</button>
    </form>
  `;
}

function filteredOutrightMarkets(marketKey) {
  const isGoldenBoot = marketKey === "golden_boot";
  const searchKey = isGoldenBoot ? "goldenBootSearch" : "winnerSearch";
  const query = searchNormalize(state[searchKey]);
  return openOutrightMarkets(marketKey)
    .filter((market) => searchNormalize(outrightSearchText(market)).includes(query))
    .slice(0, 80);
}

function outrightOptionsHtml(markets, isGoldenBoot) {
  return markets.length
    ? markets.map((market) => `<option value="${market.id}">${escapeHtml(outrightOptionLabel(market, isGoldenBoot))}</option>`).join("")
    : `<option value="">Không tìm thấy lựa chọn phù hợp</option>`;
}

function updateOutrightSearchResults(marketKey) {
  const isGoldenBoot = marketKey === "golden_boot";
  const selectId = isGoldenBoot ? "golden-boot-select" : "winner-select";
  const formId = isGoldenBoot ? "golden-boot-form" : "winner-form";
  const select = document.getElementById(selectId);
  const button = document.querySelector(`#${formId} button[type="submit"]`);
  if (!select || !button) return;
  const previous = select.value;
  const filtered = filteredOutrightMarkets(marketKey);
  select.innerHTML = outrightOptionsHtml(filtered, isGoldenBoot);
  if (filtered.some((market) => String(market.id) === previous)) {
    select.value = previous;
  }
  select.disabled = filtered.length === 0;
  button.disabled = filtered.length === 0 || state.isSubmittingBet;
}

function openOutrightMarkets(marketKey) {
  const markets = state.outrightMarkets.filter((market) => market.market_key === marketKey && market.is_open && market.source === "odds-api");
  if (marketKey === "tournament_winner") {
    return markets.sort((a, b) => {
      const teamA = teamByCode(a.selection_key);
      const teamB = teamByCode(b.selection_key);
      return number(teamA?.fifa_rank || 999) - number(teamB?.fifa_rank || 999)
        || number(a.odds_multiplier) - number(b.odds_multiplier)
        || a.selection_label.localeCompare(b.selection_label);
    });
  }
  return markets.sort((a, b) => number(a.odds_multiplier) - number(b.odds_multiplier) || a.selection_label.localeCompare(b.selection_label));
}

function outrightOptionLabel(market, isGoldenBoot) {
  const extra = marketExtra(market);
  const teamCode = extra.team_code || (!isGoldenBoot ? market.selection_key : "");
  const detail = isGoldenBoot
    ? [teamCode, extra.position, extra.club].filter(Boolean).join(" · ")
    : `FIFA #${teamByCode(market.selection_key)?.fifa_rank || "?"}`;
  return `${market.selection_label}${detail ? ` · ${detail}` : ""} · x${fmtOne.format(number(market.odds_multiplier))}`;
}

function outrightSearchText(market) {
  const extra = marketExtra(market);
  return [
    market.selection_key,
    market.selection_label,
    extra.team_code,
    extra.position,
    extra.club
  ].filter(Boolean).join(" ").toLowerCase();
}

function searchNormalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function marketExtra(market) {
  return typeof market?.extra_json === "string" ? safeJson(market.extra_json) : (market?.extra_json || {});
}

function oddsFreshnessLabel(market) {
  if (!market) return "internal fixed odds";
  const extra = marketExtra(market);
  const source = market.source === "odds-api" ? "The Odds API" : market.source || "internal";
  const bookmaker = extra.bookmaker ? ` · ${extra.bookmaker}` : "";
  const updated = extra.updated_at ? ` · updated ${dateText(extra.updated_at)}` : "";
  return `${source}${bookmaker}${updated}`;
}

function safeJson(value) {
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

function renderBracket() {
  const stages = bracketStages();
  const byMatchNo = new Map(state.bracketMatches.map((match) => [Number(match.match_no), match]));
  const thirdPlace = state.bracketMatches.filter((match) => match.round_key === "third_place");
  const hasBracket = state.bracketMatches.length > 0;
  return `
    <section class="view-shell">
      <div class="section-heading">
        <div>
          <h1>Nhánh đấu (sau vòng loại)</h1>
          <p>FIFA World Cup 2026 match 73-104. Group-stage fixtures stay in Lịch thi đấu.</p>
        </div>
        <span>${hasBracket ? "FIFA source" : "not seeded"}</span>
      </div>
      ${
        hasBracket
          ? `<div class="bracket-scroll"><div class="bracket-board bracket-tree linked-bracket">${stages.map((stage) => renderBracketStage(stage, byMatchNo)).join("")}</div></div>
             ${thirdPlace.length ? `<section class="third-place-row">${renderBracketRound("third_place", "Third-place")}</section>` : ""}`
          : `<section class="glass-card panel"><h2>No bracket data</h2><p>Run supabase/seed_bracket.sql after schema.sql.</p></section>`
      }
    </section>
  `;
}

function bracketStages() {
  return [
    {
      key: "round_of_32",
      label: "Round of 32",
      span: 1,
      matches: [74, 77, 73, 75, 83, 84, 81, 82, 76, 78, 79, 80, 86, 88, 85, 87]
    },
    { key: "round_of_16", label: "Round of 16", span: 2, matches: [89, 90, 93, 94, 91, 92, 95, 96] },
    { key: "quarter_final", label: "Quarter-finals", span: 4, matches: [97, 98, 99, 100] },
    { key: "semi_final", label: "Semi-finals", span: 8, matches: [101, 102] },
    { key: "final", label: "Final", span: 16, matches: [104] },
    { key: "champion", label: "Champion", span: 16, matches: ["champion"] }
  ];
}

function renderBracketStage(stage, byMatchNo) {
  return `
    <section class="bracket-round bracket-stage" data-round="${escapeHtml(stage.key)}">
      <h3>${escapeHtml(stage.label)}</h3>
      <div class="bracket-stage-grid">
        ${stage.matches.map((matchNo, index) => renderBracketNode(stage, matchNo, index, byMatchNo)).join("")}
      </div>
    </section>
  `;
}

function renderBracketNode(stage, matchNo, index, byMatchNo) {
  const start = index * stage.span + 1;
  const isSourceRound = stage.span === 1;
  const content = matchNo === "champion"
    ? renderChampionCard()
    : byMatchNo.has(matchNo)
      ? renderBracketMatch(byMatchNo.get(matchNo))
      : `<article class="bracket-match glass-card muted"><div class="bracket-match-top"><span>Match ${escapeHtml(matchNo)}</span><span>TBA</span></div><div class="bracket-team"><span class="slot-box"></span><span>Path pending</span></div></article>`;
  return `
    <div class="bracket-node span-${stage.span} ${isSourceRound ? "source-node" : "merge-node"} ${matchNo === "champion" ? "champion-node" : ""}" style="grid-row: ${start} / span ${stage.span}">
      ${content}
    </div>
  `;
}

function renderBracketRound(roundKey, fallbackLabel) {
  const matches = state.bracketMatches.filter((match) => match.round_key === roundKey);
  if (!matches.length) return "";
  return `
    <section class="bracket-round" data-round="${escapeHtml(roundKey)}">
      <h3>${escapeHtml(matches[0]?.round_label || fallbackLabel)}</h3>
      ${matches.map(renderBracketMatch).join("")}
    </section>
  `;
}

function renderBracketMatch(match) {
  const linked = match.match_id && match.match;
  const displayDate = linked ? dateText(match.match.starts_at) : match.starts_at ? dateText(match.starts_at) : dateOnlyText(match.match_date);
  const homeLabel = linked ? match.match.home_team?.name : match.home_team?.name || match.home_label;
  const awayLabel = linked ? match.match.away_team?.name : match.away_team?.name || match.away_label;
  const homeTeam = linked ? match.match.home_team : match.home_team;
  const awayTeam = linked ? match.match.away_team : match.away_team;
  const location = linked ? matchLocation(match.match) : `${match.venue}${match.city ? ` · ${match.city}` : ""}`;
  const statusLabel = linked ? "Dự đoán mở" : match.is_confirmed ? "Confirmed" : "Pending";
  const content = `
    <div class="bracket-match-top">
      <span>Match ${fmt.format(match.match_no)}</span>
      <time>${escapeHtml(displayDate)}</time>
    </div>
    <div class="bracket-team">${homeTeam ? `<span class="fixture-flag">${teamFlagContent(homeTeam)}</span>` : `<span class="slot-box"></span>`}<span>${escapeHtml(homeLabel)}</span></div>
    <div class="bracket-team">${awayTeam ? `<span class="fixture-flag">${teamFlagContent(awayTeam)}</span>` : `<span class="slot-box"></span>`}<span>${escapeHtml(awayLabel)}</span></div>
    <small>${escapeHtml(location)} · ${escapeHtml(statusLabel)}</small>
  `;
  if (linked) {
    return `<button class="bracket-match glass-card linked" data-match="${match.match_id}">${content}</button>`;
  }
  return `
    <article class="bracket-match glass-card">
      ${content}
    </article>
  `;
}

function renderChampionTile() {
  return `
    <section class="bracket-round champion-round">
      <h3>Champion</h3>
      ${renderChampionCard()}
    </section>
  `;
}

function renderChampionCard() {
  const final = state.bracketMatches.find((match) => match.match_no === 104);
  const winner = final?.match ? matchWinner(final.match) : null;
  return `
    <article class="bracket-match champion-card glass-card">
      <div class="bracket-match-top"><span>World Cup 2026</span><span>Final path</span></div>
      <div class="bracket-team">${winner ? `<span class="fixture-flag">${teamFlagContent(winner)}</span>` : `<span class="slot-box"></span>`}<span>${escapeHtml(winner?.name || "Champion")}</span></div>
      <small>${winner ? "Confirmed from final result" : "Winner match 104"}</small>
    </article>
  `;
}

function matchWinner(match) {
  if (!match || !["FT", "AET", "PEN", "FT_PEN"].includes(match.status)) return null;
  if (number(match.home_score) > number(match.away_score)) return match.home_team;
  if (number(match.away_score) > number(match.home_score)) return match.away_team;
  return null;
}

function renderLeaderboard() {
  const selectedRow = state.leaderboard.find((row) => row.user_id === state.selectedLeaderboardUserId) || null;
  return `
    <div class="stack">
      <div class="section-heading"><div><h1>Bảng xếp hạng</h1><p>Thống kê theo cược đã đặt, ví hiện tại và lãi/lỗ đã settle.</p></div></div>
      <section class="podium">
        ${state.leaderboard.slice(0, 3).map((row) => `
          <article class="podium-card">
            <div class="avatar">${initials(row.display_name)}</div>
            <span>#${row.rank}</span>
            <h2>${escapeHtml(row.display_name)}</h2>
            <strong class="score-value">${money(row.wallet_balance)}</strong>
            <small>${fmt.format(number(row.total_bets))} cược · ${fmtOne.format(number(row.accuracy))}% đúng</small>
          </article>
        `).join("")}
      </section>
      <section class="glass-card table-card">
        <div class="table-row table-head leaderboard-row">
          <span>Hạng</span><span>Người chơi</span><span>Số trận cược</span><span>Tỷ lệ đúng</span><span>Số tiền cược</span><span>Số tiền hiện tại</span><span>Lãi/Lỗ</span><span>% Lãi/Lỗ</span>
        </div>
        ${state.leaderboard.map((row) => {
          const canInspect = canInspectLeaderboardBets(row.user_id);
          const tag = canInspect ? "button" : "div";
          const attrs = canInspect ? `type="button" data-leaderboard-user="${escapeHtml(row.user_id)}"` : "";
          return `
          <${tag} class="table-row leaderboard-row ${canInspect ? "clickable-row" : ""} ${state.selectedLeaderboardUserId === row.user_id ? "active" : ""}" ${attrs}>
            <strong>#${row.rank}</strong>
            <span>${escapeHtml(row.display_name)}</span>
            <span>${fmt.format(number(row.total_bets ?? row.settled_bets))}</span>
            <span>${fmtOne.format(number(row.accuracy))}%</span>
            <span>${money(row.total_staked)}</span>
            <span>${money(row.wallet_balance)}</span>
            <b class="${number(row.profit_loss ?? row.score) >= 0 ? "success" : "error"}">${number(row.profit_loss ?? row.score) >= 0 ? "+" : ""}${money(row.profit_loss ?? row.score)}</b>
            <span>${fmtOne.format(number(row.profit_loss_pct ?? row.roi))}%</span>
          </${tag}>
        `;
        }).join("")}
      </section>
      ${selectedRow ? renderLeaderboardPlayerDetails(selectedRow) : ""}
    </div>
  `;
}

function canInspectLeaderboardBets(userId) {
  return state.profile?.role === "admin" || state.profile?.id === userId;
}

function renderLeaderboardPlayerDetails(row) {
  const bets = state.selectedLeaderboardBets;
  return `
    <section class="glass-card panel leaderboard-detail-panel">
      <div class="section-heading">
        <div>
          <h2>${escapeHtml(row.display_name)}</h2>
          <p>#${escapeHtml(row.rank)} · ${fmt.format(number(row.total_bets ?? row.settled_bets))} bets · ${fmtOne.format(number(row.accuracy))}% accuracy · score ${money(row.score)}</p>
        </div>
        <button class="ghost-button compact-button" data-clear-leaderboard-user>Close</button>
      </div>
      ${state.leaderboardDetailError ? `<p class="error">${escapeHtml(state.leaderboardDetailError)}</p>` : ""}
      ${
        bets === null
          ? `<p>Loading player predictions...</p>`
          : bets.length
            ? `<div class="stack compact-stack">${bets.map(renderLeaderboardBetRow).join("")}</div>`
            : `<p>No readable predictions for this player.</p>`
      }
    </section>
  `;
}

function renderLeaderboardBetRow(bet) {
  return `
    <article class="history-row bet-detail-row ${escapeHtml(bet.status)}">
      ${renderBetDetailCells(bet)}
    </article>
  `;
}

function renderGuide() {
  return `
    <div class="stack guide-page">
      <div class="section-heading">
        <div>
          <h1>Hướng dẫn</h1>
          <p>Luồng chơi nhanh cho người mới tham gia league dự đoán World Cup.</p>
        </div>
      </div>
      <section class="guide-grid">
        <article class="glass-card panel">
          <h2>1. Chọn trận</h2>
          <p>Vào sheet Dự đoán, lọc theo ngày hoặc bảng, rồi bấm một trận để mở cửa sổ cược ngay trên lịch.</p>
        </article>
        <article class="glass-card panel">
          <h2>2. Chọn loại cược</h2>
          <p>Nhóm Cơ bản gồm 1X2, Draw no bet và tỷ số chính xác. Nhóm Nâng cao gồm tổng bàn, BTTS, góc, thẻ và các market admin mở thêm.</p>
        </article>
        <article class="glass-card panel">
          <h2>3. Tiền cược và payout</h2>
          <p>Tiền cược bị trừ khỏi ví khi đặt. Nếu đúng, ví nhận stake nhân với hệ số đang khóa tại thời điểm cược.</p>
        </article>
        <article class="glass-card panel">
          <h2>4. Odds mạnh/yếu</h2>
          <p>Đội được đánh giá mạnh hơn có hệ số thấp hơn; đội yếu hơn có hệ số cao hơn. Admin có thể cập nhật odds trước giờ khóa.</p>
        </article>
        <article class="glass-card panel">
          <h2>5. Kèo dài hạn</h2>
          <p>Ở Lịch thi đấu, dùng dropdown/search để cược Vua phá lưới hoặc đội vô địch giải.</p>
        </article>
        <article class="glass-card panel">
          <h2>6. Theo dõi kết quả</h2>
          <p>Xem lịch sử trong Thống kê dự đoán và xem thứ hạng, ví hiện tại, lãi/lỗ tại Bảng xếp hạng.</p>
        </article>
      </section>
    </div>
  `;
}

function renderPredictionSuccess() {
  const bet = state.bets.find((item) => item.id === state.lastPredictionBetId) || state.bets[0];
  if (!bet) {
    return `
      <section class="glass-card panel">
        <h1>Đã lưu dự đoán</h1>
        <p>Ví tiền đã được cập nhật.</p>
        <button class="primary-button" data-success-continue>Tiếp tục dự đoán</button>
      </section>
    `;
  }
  const match = matchForBet(bet);
  const title = match ? `${match.home_team.name} vs ${match.away_team.name}` : bet.market_key;
  const remaining = number(state.profile?.wallet_balance);
  return `
    <div class="stack prediction-success-page">
      <section class="success-hero stadium-surface">
        <span class="pill">Đã lưu dự đoán</span>
        <h1>Dự đoán thành công</h1>
        <p>${escapeHtml(title)} · ${escapeHtml(bet.selection_label)}</p>
      </section>
      <section class="prediction-success-grid">
        ${profileMetric("Tiền còn lại", money(remaining))}
        ${profileMetric("Tiền cược", money(bet.stake))}
        ${profileMetric("Payout dự kiến", money(bet.potential_payout))}
        ${profileMetric("Hệ số", `x${fmtOne.format(number(bet.locked_multiplier))}`)}
      </section>
      <article class="glass-card panel prediction-success-card">
        <div>
          <h2>${escapeHtml(title)}</h2>
          <p>${escapeHtml(bet.market_key)} · ${escapeHtml(bet.selection_label)} · ${dateText(bet.placed_at)}</p>
        </div>
        <div class="success-actions">
          <button class="primary-button" data-success-continue>Tiếp tục dự đoán</button>
          <button class="ghost-button" data-success-history>Xem lịch sử dự đoán</button>
        </div>
      </article>
    </div>
  `;
}

function renderPredictionStats() {
  const upcoming = state.bets.filter((bet) => bet.status === "placed");
  const upcomingMatchCount = new Set(upcoming.map((bet) => bet.match_id).filter(Boolean)).size;
  const totalStake = upcoming.reduce((sum, bet) => sum + number(bet.stake), 0);
  const net = state.bets.reduce((sum, bet) => sum + number(bet.points_delta) + number(bet.prediction_bonus), 0);
  const won = state.bets.filter((bet) => bet.status === "won").length;
  const activeList = state.predictionStatsTab === "upcoming" ? upcoming : state.bets;
  return `
    <div class="stack">
      <section class="hero stadium-surface">
        <span class="pill">Premium Predictor</span>
        <h1>Thống kê dự đoán</h1>
        <p>${fmt.format(upcomingMatchCount)} trận đang dự đoán · ${fmt.format(upcoming.length)} phiếu mở · ${money(totalStake)} đang mở · Net ${money(net)}</p>
      </section>
      <section class="prediction-metrics">
        <div class="glass-card metric"><span>Trận đang dự đoán</span><strong>${fmt.format(upcomingMatchCount)}</strong></div>
        <div class="glass-card metric"><span>Phiếu đang mở</span><strong>${fmt.format(upcoming.length)}</strong></div>
        <div class="glass-card metric"><span>Đã dự đoán</span><strong>${fmt.format(state.bets.length)}</strong></div>
        <div class="glass-card metric"><span>Dự đoán thắng</span><strong>${fmt.format(won)}</strong></div>
      </section>
      <div class="segmented stats-tabs">
        <button class="${state.predictionStatsTab === "upcoming" ? "active" : ""}" data-prediction-stats-tab="upcoming">Sắp diễn ra</button>
        <button class="${state.predictionStatsTab === "history" ? "active" : ""}" data-prediction-stats-tab="history">Đã dự đoán</button>
      </div>
      <div class="section-heading">
        <h2>${state.predictionStatsTab === "upcoming" ? "Dự đoán đang mở" : "Lịch sử dự đoán"}</h2>
        <span>${fmt.format(activeList.length)} bet</span>
      </div>
      <section class="stack">
        ${activeList.map((bet) => state.predictionStatsTab === "upcoming" ? renderUpcomingBetRow(bet) : renderHistoryRow(bet)).join("") || `<div class="glass-card panel"><p>Chưa có dự đoán trong nhóm này.</p></div>`}
      </section>
    </div>
  `;
}

function renderUpcomingBetRow(bet) {
  const match = matchForBet(bet);
  const market = marketForBet(bet, match);
  const title = match ? `${match.home_team.name} vs ${match.away_team.name}` : bet.market_key;
  const locked = number(bet.locked_multiplier);
  const current = number(market?.odds_multiplier || bet.locked_multiplier);
  const closesAt = market?.closes_at || match?.starts_at || bet.placed_at;
  const editable = canUpdateBet(bet, match, market);
  const homeScore = Number(bet.selection_json?.home_score ?? 0);
  const awayScore = Number(bet.selection_json?.away_score ?? 0);
  return `
    <article class="history-row upcoming">
      <div>
        <strong>${escapeHtml(title)}</strong>
        <small>${match ? `${dateText(match.starts_at)} · lock ${dateText(closesAt)}` : dateText(bet.placed_at)}</small>
      </div>
      <div><small>Market</small><b>${escapeHtml(bet.market_key)}</b></div>
      <div><small>Dự đoán</small><b>${escapeHtml(bet.selection_label)}</b></div>
      <div><small>Hệ số</small><b>x${fmtOne.format(locked)} / x${fmtOne.format(current)}</b></div>
      <div><small>Stake</small><b>${money(bet.stake)}</b></div>
      <div><small>Payout</small><b>${money(bet.potential_payout)}</b></div>
      ${
        editable
          ? `<form class="update-bet-form" data-update-bet="${bet.id}">
              ${
                bet.market_key === "correct_score"
                  ? `<label>Home<input name="home_score" type="number" min="0" step="1" value="${homeScore}"></label>
                     <label>Away<input name="away_score" type="number" min="0" step="1" value="${awayScore}"></label>`
                  : `<label>Selection<input value="${escapeHtml(bet.selection_label)}" disabled></label>`
              }
              <label>Stake<input id="update-stake-${bet.id}" name="stake" type="text" inputmode="numeric" autocomplete="off" value="${formatStakeInput(bet.stake)}">${renderStakeWalletShare(bet.stake, { forId: `update-stake-${bet.id}` })}</label>
              <button class="primary-button compact-button" ${state.isSubmittingBet ? "disabled" : ""}>${state.isSubmittingBet ? renderBouncingBall("Dang cap nhat...") : "Cập nhật"}</button>
            </form>`
          : `<div class="locked-copy"><small>Không thể sửa</small><b>${match ? escapeHtml(match.status) : "Outright"}</b></div>`
      }
    </article>
  `;
}

function matchForBet(bet) {
  return state.matches.find((match) => match.id === bet.match_id) || bet.match || null;
}

function marketForBet(bet, match = matchForBet(bet)) {
  if (!match) return null;
  return (match.match_markets || []).find((market) => market.id === bet.market_id)
    || (match.match_markets || []).find((market) => market.market_key === bet.market_key && market.selection_key === bet.selection_key)
    || (match.match_markets || []).find((market) => market.market_key === bet.market_key)
    || null;
}

function canUpdateBet(bet, match = matchForBet(bet), market = marketForBet(bet, match)) {
  if (!match || !market || bet.status !== "placed") return false;
  if (!["SCHEDULED", "NS", "TBD"].includes(match.status)) return false;
  const closeTime = new Date(market.closes_at || match.starts_at).getTime();
  return Number.isFinite(closeTime) && closeTime > Date.now() && market.is_open !== false;
}

function statsForMatch(match) {
  if (!match) return null;
  return state.matchStats.find((stats) => Number(stats.match_id) === Number(match.id)) || null;
}

function settledMatchStatus(match) {
  return Boolean(match && ["FT", "AET", "PEN", "FT_PEN", "PST", "CANC", "ABD", "SUSP", "VOID"].includes(String(match.status || "")));
}

function matchScoreText(match) {
  if (!match) return "Outright market";
  const home = match.home_team?.code || match.home_team?.name || "Home";
  const away = match.away_team?.code || match.away_team?.name || "Away";
  if (match.home_score === null || match.home_score === undefined || match.away_score === null || match.away_score === undefined) {
    return `${home} vs ${away} · ${match.status || "pending"}`;
  }
  const penalty = match.home_penalties !== null && match.home_penalties !== undefined && match.away_penalties !== null && match.away_penalties !== undefined
    ? ` · pens ${match.home_penalties}-${match.away_penalties}`
    : "";
  return `${home} ${match.home_score}-${match.away_score} ${away}${penalty} · ${match.status || "FT"}`;
}

function matchResultText(match) {
  if (!match || match.home_score === null || match.home_score === undefined || match.away_score === null || match.away_score === undefined) return "pending";
  if (number(match.home_score) > number(match.away_score)) return `${match.home_team?.name || "Home"} win`;
  if (number(match.away_score) > number(match.home_score)) return `${match.away_team?.name || "Away"} win`;
  return "Draw";
}

function betActualText(bet) {
  const match = matchForBet(bet);
  const market = marketForBet(bet, match);
  if (!match) {
    if (bet.status === "placed") return "Pending outright result";
    if (bet.status === "won") return `Settled winner: ${bet.selection_label}`;
    if (bet.status === "lost") return "Settled outright: selection did not win";
    if (bet.status === "refunded") return "Outright refunded";
    return bet.status || "Outright market";
  }
  if (["PST", "CANC", "ABD", "SUSP", "VOID"].includes(String(match.status || ""))) {
    return `${matchScoreText(match)} · match void/refunded`;
  }
  if (!settledMatchStatus(match)) return `${matchScoreText(match)} · not settled`;

  const stats = statsForMatch(match);
  const totalGoals = number(match.home_score) + number(match.away_score);
  const line = market?.line === null || market?.line === undefined ? null : number(market.line);
  if (bet.market_key === "match_result") return `${matchScoreText(match)} · ${matchResultText(match)}`;
  if (bet.market_key === "draw_no_bet") return `${matchScoreText(match)} · ${matchResultText(match)}${number(match.home_score) === number(match.away_score) ? " · stake refunded" : ""}`;
  if (bet.market_key === "total_goals") return `${matchScoreText(match)} · total goals ${fmtOne.format(totalGoals)}${line !== null ? ` vs line ${fmtOne.format(line)}` : ""}`;
  if (bet.market_key === "btts") return `${matchScoreText(match)} · BTTS ${number(match.home_score) > 0 && number(match.away_score) > 0 ? "Yes" : "No"}`;
  if (bet.market_key === "corners_total") {
    const totalCorners = stats ? number(stats.corners_home) + number(stats.corners_away) : null;
    return `${matchScoreText(match)} · corners ${totalCorners === null ? "not synced" : fmtOne.format(totalCorners)}${line !== null ? ` vs line ${fmtOne.format(line)}` : ""}`;
  }
  if (bet.market_key === "cards_total") {
    const totalCards = stats ? number(stats.yellow_cards_home) + number(stats.yellow_cards_away) + number(stats.red_cards_home) + number(stats.red_cards_away) : null;
    return `${matchScoreText(match)} · cards ${totalCards === null ? "not synced" : fmtOne.format(totalCards)}${line !== null ? ` vs line ${fmtOne.format(line)}` : ""}`;
  }
  if (bet.market_key === "asian_handicap") {
    const adjusted = number(match.home_score) + number(line || 0);
    return `${matchScoreText(match)} · AH adjusted home ${fmtOne.format(adjusted)} vs away ${fmtOne.format(number(match.away_score))}`;
  }
  return matchScoreText(match);
}

function betOutcome(bet) {
  if (bet.status === "won") return { label: "WIN", className: "success" };
  if (bet.status === "lost") return { label: "LOSS", className: "error" };
  if (bet.status === "refunded") return { label: "REFUND", className: "muted" };
  return { label: "OPEN", className: "muted" };
}

function betReceivedAmount(bet) {
  if (bet.status === "won") return number(bet.potential_payout);
  if (bet.status === "refunded") return number(bet.stake);
  if (bet.status === "lost") return 0;
  return number(bet.potential_payout);
}

function betScoreAmount(bet) {
  return number(bet.points_delta) + number(bet.prediction_bonus);
}

function betMarketTitle(bet) {
  return modalMarketTitle(bet.market_key, bet.market_key);
}

function renderBetDetailCells(bet, { includeUser = false, allowVoid = false } = {}) {
  const match = matchForBet(bet) || bet.match;
  const title = match ? `${match.home_team.name} vs ${match.away_team.name}` : betMarketTitle(bet);
  const outcome = betOutcome(bet);
  const score = betScoreAmount(bet);
  const receivedLabel = bet.status === "placed" ? `Potential ${money(betReceivedAmount(bet))}` : money(betReceivedAmount(bet));
  const outcomeClass = `outcome-${String(bet.status || "placed")}`;
  return `
    ${includeUser ? `<div><small>User</small><strong>${escapeHtml(bet.user?.display_name || bet.user_id)}</strong><small>${dateText(bet.placed_at)}</small></div>` : `<div><small>Match</small><strong>${escapeHtml(title)}</strong><small>${dateText(bet.placed_at)}</small></div>`}
    <div><small>Bet type</small><b>${escapeHtml(betMarketTitle(bet))}</b><small>${escapeHtml(bet.market_key)}</small></div>
    <div class="prediction-cell ${escapeHtml(outcomeClass)}"><small>Prediction</small><b>${escapeHtml(bet.selection_label)}</b><small>${money(bet.stake)} · x${fmtOne.format(number(bet.locked_multiplier))}</small></div>
    <div><small>Actual</small><b>${escapeHtml(betActualText(bet))}</b></div>
    <div class="outcome-cell ${escapeHtml(outcomeClass)}">
      <small>Outcome</small>
      <b class="${escapeHtml(outcome.className)}">${escapeHtml(outcome.label)}</b>
      <small>Received: ${escapeHtml(receivedLabel)}</small>
      <small>Score: ${score >= 0 ? "+" : ""}${money(score)}${number(bet.prediction_bonus) ? ` · bonus ${money(bet.prediction_bonus)}` : ""}</small>
      ${allowVoid && bet.status === "placed" ? `<button class="ghost-button compact-button" data-void-bet="${bet.id}">Void</button>` : ""}
    </div>
  `;
}

function renderHistory() {
  state.predictionStatsTab = "history";
  return renderPredictionStats();
  const net = state.bets.reduce((sum, bet) => sum + number(bet.points_delta) + number(bet.prediction_bonus), 0);
  return `
    <div class="stack">
      <section class="hero stadium-surface">
        <span class="pill">Premium Predictor</span>
        <h1>Người chơi #123</h1>
        <p>Net ${money(net)} · ${state.bets.length} dự đoán</p>
      </section>
      <div class="section-heading"><h2>Lịch sử dự đoán</h2><span>${state.bets.length} bet</span></div>
      <section class="stack">
        ${state.bets.map(renderHistoryRow).join("") || `<div class="glass-card panel"><p>Chưa có lịch sử.</p></div>`}
      </section>
    </div>
  `;
}

function renderHistoryRow(bet) {
  const match = matchForBet(bet) || bet.match;
  const market = marketForBet(bet, match);
  if (canUpdateBet(bet, match, market)) return renderUpcomingBetRow(bet);
  const title = match ? `${match.home_team.name} vs ${match.away_team.name}` : bet.market_key;
  const delta = number(bet.points_delta);
  const bonus = number(bet.prediction_bonus);
  return `
    <article class="history-row ${escapeHtml(bet.status)}">
      <div><strong>${escapeHtml(title)}</strong><small>${dateText(bet.placed_at)}</small></div>
      <div><small>Dự đoán</small><b>${escapeHtml(bet.selection_label)}</b></div>
      <div><small>Stake</small><b>${money(bet.stake)}</b></div>
      <div><small>${escapeHtml(bet.status)}${bonus ? ` · bonus ${money(bonus)}` : ""}</small><b class="${delta + bonus >= 0 ? "success" : "error"}">${delta + bonus >= 0 ? "+" : ""}${money(delta + bonus)}</b></div>
    </article>
  `;
}

function renderSyncHelpPanel() {
  if (!state.syncHelpOpen) return "";
  const items = [
    ["Sync odds", "Cap nhat keo nha cai va odds dang mo cho cac tran."],
    ["Sync fixtures/FIFA", "Cap nhat lich thi dau, thong tin FIFA, ranking, doi hinh va du lieu tran."],
    ["Sync ket qua nhanh", "Chi lay ket qua moi nhat va settle cac bet lien quan nhanh hon."],
    ["Sync day du", "Chay dong bo tong hop tu cac provider dang cau hinh."],
    ["Sync Transfermarkt", "Cap nhat gia tri cau thu/doi tu Transfermarkt de phuc vu ranking suc manh."],
    ["Settle tat ca FT", "Tinh win/loss/refund cho nhung tran da co trang thai FT/AET/PEN/FT_PEN."]
  ];
  return `
    <section class="glass-card panel sync-help-panel">
      <div class="section-heading"><h2>Sync help</h2><span>${fmt.format(items.length)} actions</span></div>
      <div class="sync-help-grid">
        ${items.map(([title, text]) => `<div><b>${escapeHtml(title)}</b><span>${escapeHtml(text)}</span></div>`).join("")}
      </div>
    </section>
  `;
}

function renderAdmin() {
  const players = state.users.filter((user) => user.role === "player" && !user.deleted_at);
  const deletedPlayers = state.users.filter((user) => user.role === "player" && user.deleted_at);
  const report = state.report || {};
  const marketOptions = adminMarketOptions();
  const outrightOptions = adminOutrightOptions();
  const transfermarktRun = state.syncRuns.find((run) => run.provider === "transfermarkt");
  return `
    <div class="stack">
      <div class="section-heading">
        <div><h1>Admin Dashboard</h1><p>Quản lý tài khoản, ví tiền và settlement.</p></div>
        <div class="admin-actions">
          <details class="admin-action-menu">
            <summary>Sync</summary>
            <div class="admin-action-menu-panel">
              <button class="primary-button" id="quick-results-sync-button" ${state.providerSync.isRunning ? "disabled" : ""}>${state.providerSync.isRunning ? renderBouncingBall("Syncing...") : "Sync kết quả nhanh"}</button>
              <button class="ghost-button" id="sync-odds-button" ${state.providerSync.isRunning ? "disabled" : ""}>${state.providerSync.isRunning ? renderBouncingBall("Syncing...") : "Sync odds"}</button>
              <button class="ghost-button" id="sync-data-button" ${state.providerSync.isRunning ? "disabled" : ""}>${state.providerSync.isRunning ? renderBouncingBall("Syncing...") : "Sync fixtures/FIFA"}</button>
              <button class="ghost-button" id="provider-sync-button" ${state.providerSync.isRunning ? "disabled" : ""}>${state.providerSync.isRunning ? renderBouncingBall("Syncing...") : "Sync đầy đủ"}</button>
              <button class="ghost-button" id="transfermarkt-sync-button">Sync Transfermarkt</button>
              <button class="ghost-button" id="settle-all-button">Settle tất cả FT</button>
              <button class="ghost-button" type="button" data-sync-help-toggle>Sync help</button>
            </div>
          </details>
          <details class="admin-action-menu">
            <summary>Export</summary>
            <div class="admin-action-menu-panel">
              <button class="ghost-button" id="export-leaderboard-button">Rankings</button>
              <button class="ghost-button" id="export-bets-button">Bets</button>
              <button class="ghost-button" id="export-ledger-button">Ledger</button>
              <button class="ghost-button" id="export-audit-button">Audit</button>
              <button class="ghost-button" id="export-reports-button">Reports</button>
              <button class="ghost-button" id="export-results-button">Results</button>
              <button class="ghost-button" id="export-odds-report-button">Odds</button>
            </div>
          </details>
          <button class="primary-button" id="refresh-button">Refresh</button>
        </div>
      </div>
      <section class="metric-grid">
        ${metric("Players", report.players || players.length)}
        ${metric("Wallet balance", money(report.total_wallet_balance))}
        ${metric("Total staked", money(report.total_staked))}
        ${metric("Settled net", money(report.settled_net_points))}
        ${metric("Prediction bonus", money(report.prediction_bonus_points))}
        ${metric("Open bets", report.open_bets || 0)}
        ${metric("Settled bets", report.settled_bets || 0)}
      </section>
      ${renderSyncHelpPanel()}
      ${renderDeploymentHealth()}
      ${renderProviderSyncPanel()}
      ${renderOddsTrackingReport()}
      ${renderBracketAdminPanel()}
      <section class="admin-grid">
        <form class="glass-card form-card form-grid" id="admin-filter-form">
          <h2>Report filters</h2>
          <label>User<select id="filter-user"><option value="">All users</option>${players.map((user) => `<option value="${user.id}" ${state.adminFilters.userId === user.id ? "selected" : ""}>${escapeHtml(user.display_name)}</option>`).join("")}</select></label>
          <label>From<input id="filter-date-from" type="date" value="${escapeHtml(state.adminFilters.dateFrom)}"></label>
          <label>To<input id="filter-date-to" type="date" value="${escapeHtml(state.adminFilters.dateTo)}"></label>
          <button class="primary-button">Apply filters</button>
          <button class="ghost-button" id="clear-admin-filters" type="button">Clear filters</button>
        </form>
        <form class="glass-card form-card form-grid" id="create-user-form">
          <h2>Tạo tài khoản</h2>
          <label>Username<input id="new-username" required></label>
          <label>Tên hiển thị<input id="new-display-name" required></label>
          <label>Password<div class="input-action-row"><input id="new-password" value="demo123" required><button class="ghost-button compact-button" type="button" data-generate-pass="new-password">Generate</button></div></label>
          <label>Tiền ban đầu<input id="new-points" type="number" value="1000"></label>
          <button class="primary-button" ${state.actionLoading === "createUser" ? "disabled" : ""}>${state.actionLoading === "createUser" ? renderBouncingBall("Dang tao user...") : "Tạo user"}</button>
        </form>
        <form class="glass-card form-card form-grid" id="top-up-form">
          <h2>Nạp / trừ tiền</h2>
          <label>Người chơi<select id="topup-user">${players.map((user) => `<option value="${user.id}">${escapeHtml(user.display_name)}</option>`).join("")}</select></label>
          <label>Số tiền<input id="topup-amount" type="number" value="500"></label>
          <label>Lý do<input id="topup-reason" value="Admin top-up"></label>
          <button class="primary-button" ${state.actionLoading === "wallet" ? "disabled" : ""}>${state.actionLoading === "wallet" ? renderBouncingBall("Dang cap nhat...") : "Cập nhật ví"}</button>
        </form>
        <form class="glass-card form-card form-grid transfermarkt-import-form" id="transfermarkt-import-form">
          <h2>Transfermarkt import</h2>
          <p><small>${transfermarktRun ? `${escapeHtml(transfermarktRun.status)} · ${escapeHtml(transfermarktRun.message || "")}` : "No Transfermarkt sync yet."}</small></p>
          <textarea id="transfermarkt-import-text" rows="8" placeholder="Paste JSON rows or CSV with team_code, player_name, market_value_eur..."></textarea>
          <button class="primary-button">Import values</button>
        </form>
        <form class="glass-card form-card form-grid" id="result-form">
          <h2>Kết quả & settle</h2>
          <label>Trận<select id="result-match">${state.matches.map((match) => `<option value="${match.id}">${escapeHtml(match.home_team.code)} vs ${escapeHtml(match.away_team.code)}</option>`).join("")}</select></label>
          <label>Status<select id="result-status"><option>FT</option><option>AET</option><option>PEN</option><option>FT_PEN</option><option>PST</option><option>CANC</option><option>SCHEDULED</option></select></label>
          <label>Tỷ số<input id="result-score" value="2-1"></label>
          <label>Penalty<input id="result-penalties" placeholder="5-4, chỉ dùng khi PEN/FT_PEN"></label>
          <button class="primary-button">Lưu & settle</button>
        </form>
        <form class="glass-card form-card form-grid" id="market-control-form">
          <h2>Market controls</h2>
          <p><small>Odds custom chỉ áp dụng cho các cược mới. Cược đã đặt giữ nguyên multiplier đã khóa.</small></p>
          <label>Kèo<select id="admin-market-id">${marketOptions}</select></label>
          <label>Multiplier<input id="admin-market-multiplier" type="number" min="1" step="0.01" value="2.00"></label>
          <label>Lock time<input id="admin-market-closes-at" type="datetime-local"></label>
          <label>Status<select id="admin-market-open"><option value="true">Open</option><option value="false">Closed</option></select></label>
          <button class="primary-button">Update market</button>
        </form>
        <form class="glass-card form-card form-grid" id="outright-control-form">
          <h2>Outright controls</h2>
          <label>Kèo vô địch<select id="admin-outright-id">${outrightOptions}</select></label>
          <label>Multiplier<input id="admin-outright-multiplier" type="number" min="1" step="0.01" value="8.00"></label>
          <label>Lock time<input id="admin-outright-closes-at" type="datetime-local"></label>
          <label>Status<select id="admin-outright-open"><option value="true">Open</option><option value="false">Closed</option></select></label>
          <button class="primary-button">Update outright</button>
        </form>
        <form class="glass-card form-card form-grid" id="reset-password-form">
          <h2>Reset password</h2>
          <label>Player<select id="reset-user">${players.map((user) => `<option value="${user.id}">${escapeHtml(user.display_name)}</option>`).join("")}</select></label>
          <label>New password<div class="input-action-row"><input id="reset-password" value="demo123" minlength="6" required><button class="ghost-button compact-button" type="button" data-generate-pass="reset-password">Generate</button></div></label>
          <button class="primary-button" ${state.actionLoading === "resetPassword" ? "disabled" : ""}>${state.actionLoading === "resetPassword" ? renderBouncingBall("Dang reset...") : "Reset password"}</button>
        </form>
        <form class="glass-card form-card form-grid" id="tournament-winner-form">
          <h2>Settle vô địch</h2>
          <label>Đội vô địch<select id="winner-key">${state.outrightMarkets.filter((market) => market.market_key === "tournament_winner").map((market) => `<option value="${market.selection_key}">${escapeHtml(market.selection_label)}</option>`).join("")}</select></label>
          <button class="primary-button">Settle outright</button>
        </form>
        <form class="glass-card form-card form-grid" id="golden-boot-settle-form">
          <h2>Settle Golden Boot</h2>
          <label>Top scorer<select id="golden-boot-key">${state.outrightMarkets.filter((market) => market.market_key === "golden_boot").map((market) => `<option value="${market.selection_key}">${escapeHtml(market.selection_label)}</option>`).join("")}</select></label>
          <button class="primary-button">Settle Golden Boot</button>
        </form>
      </section>
      <section class="glass-card panel">
        <div class="section-heading"><h2>Tài khoản</h2><span>${state.users.length} user</span></div>
        ${players.map(renderUserRow).join("") || "<p>Chưa có tài khoản người chơi.</p>"}
        ${deletedPlayers.length ? `<details class="deleted-users-panel"><summary>Deleted accounts (${fmt.format(deletedPlayers.length)})</summary>${deletedPlayers.map(renderUserRow).join("")}</details>` : ""}
      </section>
      <section class="glass-card table-card">
        <div class="section-heading"><h2>Player report</h2><span>profit · bonus · accuracy</span></div>
        <div class="table-row table-head"><span>Player</span><span>Wallet</span><span>Net</span><span>Bonus</span><span>Score</span></div>
        ${renderUserReportRows(players)}
      </section>
      <section class="glass-card table-card">
        <div class="section-heading"><h2>Market report</h2><span>stake · ROI · accuracy</span></div>
        <div class="table-row table-head"><span>Market</span><span>Bets</span><span>Stake</span><span>ROI</span><span>Score</span></div>
        ${renderMarketReportRows()}
      </section>
      <section class="glass-card panel">
        <div class="section-heading"><h2>Recent predictions</h2><span>${state.adminBets.length} latest · ${escapeHtml(adminFilterLabel())}</span></div>
        ${state.adminBets.slice(0, 12).map(renderAdminBetRow).join("") || "<p>Chưa có dự đoán.</p>"}
      </section>
      ${renderAdminPredictionExplorer(players)}
      <section class="glass-card table-card">
        <div class="section-heading"><h2>Wallet ledger</h2><span>${state.walletLedger.length} latest · ${escapeHtml(adminFilterLabel())}</span></div>
        <div class="table-row table-head"><span>Time</span><span>User</span><span>Kind</span><span>Amount</span><span>Balance</span></div>
        ${state.walletLedger.slice(0, 20).map(renderLedgerRow).join("") || "<p>Chưa có lịch sử ví.</p>"}
      </section>
      <section class="glass-card table-card">
        <div class="section-heading"><h2>Audit log</h2><span>${state.auditLogs.length} latest · ${escapeHtml(adminFilterLabel())}</span></div>
        <div class="table-row table-head"><span>Time</span><span>Actor</span><span>Action</span><span>Entity</span><span>Details</span></div>
        ${state.auditLogs.slice(0, 20).map(renderAuditRow).join("") || "<p>Chưa có audit log.</p>"}
      </section>
      <section class="glass-card panel">
        <div class="section-heading"><h2>Sync runs</h2><span>${state.syncRuns.length} jobs</span></div>
        ${state.syncRuns.map((run) => `<p><b>${escapeHtml(run.provider)}</b> · ${escapeHtml(run.job_type)} · ${escapeHtml(run.status)}<br><small>${escapeHtml(run.message || "")}</small></p>`).join("") || "<p>Chưa có sync run.</p>"}
      </section>
      ${state.providerSync.isRunning ? renderProviderSyncOverlay() : ""}
    </div>
  `;
}

function renderBracketAdminPanel() {
  const roundOf32 = state.bracketMatches.filter((match) => match.round_key === "round_of_32");
  const matchOptions = roundOf32.map((match) => `
    <option value="${match.match_no}">
      Match ${fmt.format(match.match_no)} · ${escapeHtml(match.home_team?.name || match.home_label)} vs ${escapeHtml(match.away_team?.name || match.away_label)}
    </option>
  `).join("");
  const teamOptions = state.teams.map((team) => `
    <option value="${team.id}">${escapeHtml(team.group_name ? `Group ${team.group_name} · ` : "")}${escapeHtml(team.code)} · ${escapeHtml(team.name)}</option>
  `).join("");
  return `
    <section class="glass-card panel">
      <div class="section-heading">
        <div>
          <h2>Xác nhận nhánh đấu</h2>
          <p>Confirm Round of 32 teams when the API or group standings are ready. Winners advance automatically after settlement.</p>
        </div>
        <span>${fmt.format(roundOf32.filter((match) => match.is_confirmed).length)} confirmed</span>
      </div>
      <form class="bracket-admin-form" id="bracket-slot-form">
        <label>Match<select id="bracket-match-no">${matchOptions}</select></label>
        <label>Slot<select id="bracket-slot"><option value="home">Home</option><option value="away">Away</option></select></label>
        <label>Team<select id="bracket-team-id">${teamOptions}</select></label>
        <button class="primary-button">Confirm slot</button>
      </form>
      <div class="bracket-admin-grid">
        ${roundOf32.map((match) => `
          <article>
            <b>Match ${fmt.format(match.match_no)}</b>
            <span>${escapeHtml(match.home_team?.name || match.home_label)} vs ${escapeHtml(match.away_team?.name || match.away_label)}</span>
            <small>${match.is_confirmed ? "Confirmed" : "Pending"}${match.match_id ? " · markets ready" : ""}</small>
          </article>
        `).join("") || "<p>Run seed_bracket.sql to load bracket slots.</p>"}
      </div>
    </section>
  `;
}

function adminFilterLabel() {
  const parts = [];
  const user = state.users.find((item) => item.id === state.adminFilters.userId);
  if (user) parts.push(user.display_name);
  if (state.adminFilters.dateFrom) parts.push(`from ${state.adminFilters.dateFrom}`);
  if (state.adminFilters.dateTo) parts.push(`to ${state.adminFilters.dateTo}`);
  return parts.join(" · ") || "all time";
}

function adminMarketOptions() {
  const options = [];
  for (const match of state.matches) {
    for (const market of match.match_markets || []) {
      options.push(`
        <option value="${market.id}" data-multiplier="${number(market.odds_multiplier)}" data-open="${market.is_open ? "true" : "false"}" data-closes-at="${escapeHtml(toDateTimeLocal(market.closes_at))}">
          ${escapeHtml(match.home_team.code)} vs ${escapeHtml(match.away_team.code)} · ${escapeHtml(market.label)} · ${escapeHtml(market.selection_label)} · x${fmtOne.format(number(market.odds_multiplier))}
        </option>
      `);
    }
  }
  return options.join("") || `<option value="">No markets</option>`;
}

function adminOutrightOptions() {
  return state.outrightMarkets.map((market) => `
    <option value="${market.id}" data-multiplier="${number(market.odds_multiplier)}" data-open="${market.is_open ? "true" : "false"}" data-closes-at="${escapeHtml(toDateTimeLocal(market.closes_at))}">
      ${escapeHtml(market.selection_label)} · x${fmtOne.format(number(market.odds_multiplier))} · ${market.is_open ? "open" : "closed"}
    </option>
  `).join("") || `<option value="">No outrights</option>`;
}

function renderDeploymentHealth() {
  const health = state.deploymentHealth;
  if (!health) {
    return `
      <section class="glass-card panel">
        <div class="section-heading"><h2>Deployment health</h2><span>local preview</span></div>
        <p>Health endpoint is unavailable in local file preview. On Vercel, this panel checks required server environment variables.</p>
      </section>
    `;
  }

  const labels = {
    supabaseUrl: "Supabase URL",
    supabaseAnonKey: "Supabase anon key",
    supabaseServiceRoleKey: "Supabase service role",
    cronSecret: "Cron secret",
    apiFootballKey: "API-FOOTBALL key",
    oddsApiKey: "The Odds API key"
  };
  const checks = Object.entries(health.checks || {});

  return `
    <section class="glass-card panel">
      <div class="section-heading">
        <h2>Deployment health</h2>
        <span>${health.ok ? "ready" : "missing env"}</span>
      </div>
      <div class="health-grid">
        ${checks.map(([key, value]) => `
          <div class="health-item ${value ? "ok" : "missing"}">
            <span>${escapeHtml(labels[key] || key)}</span>
            <b>${value ? "OK" : "Missing"}</b>
          </div>
        `).join("")}
      </div>
      <p><small>MAX_STATS_FIXTURES: ${fmt.format(number(health.maxStatsFixtures || 12))}. Secret values are never returned by this endpoint.</small></p>
    </section>
  `;
}

function renderProviderSyncPanel() {
  const sync = state.providerSync || {};
  const result = sync.result;
  const oddsResult = result?.oddsResult || null;
  const latestOddsRun = state.syncRuns.find((run) => run.provider === "the-odds-api" && run.job_type === "odds");
  const statusLabel = sync.isRunning ? "Đang cập nhật" : result ? providerSyncStatusLabel(result.status) : "Sẵn sàng";
  const details = result ? providerSyncResultItems(result) : [];
  return `
    <section class="glass-card panel sync-status-panel ${sync.isRunning ? "running" : ""}">
      <div class="section-heading">
        <div>
          <h2>Provider sync</h2>
          <p>${sync.isRunning ? "Đang gọi dữ liệu từ các nguồn, vui lòng chờ đến khi có output cuối cùng." : providerSyncPanelCopy(result, latestOddsRun)}</p>
        </div>
        <span>${escapeHtml(statusLabel)}</span>
      </div>
      ${
        sync.isRunning
          ? `<div class="sync-running-row">
              ${renderBouncingBall("Syncing data...")}
              <div>
                <strong>Đang sync fixtures, stats, FIFA data và odds...</strong>
                <small>Bắt đầu ${escapeHtml(sync.startedAt ? dateText(sync.startedAt) : "vừa xong")}. Không đóng tab cho đến khi có kết quả.</small>
              </div>
            </div>`
          : ""
      }
      ${
        result
          ? `<div class="sync-status-grid">
              ${details.map((item) => `
                <article class="sync-status-item ${escapeHtml(item.kind)}">
                  <span>${escapeHtml(item.label)}</span>
                  <strong>${escapeHtml(item.value)}</strong>
                  ${item.copy ? `<small>${escapeHtml(item.copy)}</small>` : ""}
                </article>
              `).join("")}
            </div>
            <div class="sync-output ${providerOddsOutputKind(oddsResult)}">
              <strong>${escapeHtml(providerOddsOutputTitle(oddsResult))}</strong>
              <span>${escapeHtml(providerOddsOutputCopy(oddsResult))}</span>
              ${providerQuotaText(oddsResult?.quota) ? `<small>${escapeHtml(providerQuotaText(oddsResult.quota))}</small>` : ""}
            </div>`
          : sync.error
            ? `<div class="sync-output failed"><strong>Sync failed</strong><span>${escapeHtml(sync.error)}</span></div>`
            : latestOddsRun
              ? `<div class="sync-output idle"><strong>Lần odds sync gần nhất</strong><span>${escapeHtml(latestOddsRun.message || `${latestOddsRun.status} · ${latestOddsRun.request_count} requests`)}</span></div>`
              : `<div class="sync-output idle"><strong>Chưa có lần sync odds</strong><span>Bấm Sync providers để kiểm tra nguồn và cập nhật market.</span></div>`
      }
    </section>
  `;
}

function renderProviderSyncOverlay() {
  return `
    <div class="sync-loading-backdrop" role="status" aria-live="polite">
      <section class="sync-loading-card glass-card">
        ${renderBouncingBall("Dang cap nhat...", "large")}
        <div>
          <h2>Đang cập nhật dữ liệu</h2>
          <p>Hệ thống đang gọi provider và sẽ tự hiển thị output khi xong.</p>
        </div>
      </section>
    </div>
  `;
}

function providerSyncPanelCopy(result, latestOddsRun) {
  if (result) return "Kết quả lần sync vừa chạy, bao gồm trạng thái odds và quota nếu nguồn trả về.";
  if (latestOddsRun) return "Theo dõi kết quả sync provider và số lượt gọi API còn lại.";
  return "Bấm Sync providers để cập nhật dữ liệu từ nguồn server-side.";
}

function providerSyncStatusLabel(status = "") {
  if (status === "ok") return "Hoàn tất";
  if (status === "partial") return "Hoàn tất một phần";
  return status || "Hoàn tất";
}

function providerSyncResultItems(result) {
  const odds = result.oddsResult || {};
  const resultRows = number(result.espnResult?.results) + number(result.fifaFantasyResult?.results) + number(result.fifaCalendarResult?.results);
  const completedScores = number(result.espnResult?.completedScores) + number(result.fifaFantasyResult?.completedScores) + number(result.fifaCalendarResult?.completedScores);
  return [
    {
      label: "Results sheet",
      value: fmt.format(resultRows),
      copy: `${fmt.format(completedScores)} completed scores`,
      kind: resultRows ? "ok" : "idle"
    },
    {
      label: "API-FOOTBALL",
      value: result.fixtureResult?.status || "unknown",
      copy: `${fmt.format(number(result.fixtureResult?.matches))} matches`,
      kind: syncResultKind(result.fixtureResult)
    },
    {
      label: "Stats",
      value: result.statsResult?.status || "unknown",
      copy: `${fmt.format(number(result.statsResult?.stats))} rows`,
      kind: syncResultKind(result.statsResult)
    },
    {
      label: "FIFA squads",
      value: result.squadResult?.status || "unknown",
      copy: `${fmt.format(number(result.squadResult?.players))} players`,
      kind: syncResultKind(result.squadResult)
    },
    {
      label: "Odds events",
      value: odds.dataStatus ? providerOddsDataStatusLabel(odds.dataStatus) : (odds.status || "unknown"),
      copy: `${fmt.format(number(odds.events))} events · ${fmt.format(number(odds.matchedEvents))} matched`,
      kind: providerOddsOutputKind(odds)
    },
    {
      label: "Markets updated",
      value: fmt.format(number(odds.updatedMarkets)),
      copy: `${fmt.format(number(odds.updatedOutrights))} outrights`,
      kind: providerOddsOutputKind(odds)
    },
    {
      label: "API calls left",
      value: odds?.quota?.remaining ?? "-",
      copy: providerQuotaText(odds.quota),
      kind: "quota"
    }
  ];
}

function syncResultKind(result) {
  if (!result) return "idle";
  if (result.status === "failed") return "failed";
  if (result.status === "skipped") return "idle";
  if (result.status === "partial") return "warning";
  return "ok";
}

function providerOddsDataStatusLabel(status = "") {
  const labels = {
    updated: "Đã cập nhật",
    no_data: "Chưa có data",
    unmatched: "Chưa match lịch",
    no_updates: "Không có update"
  };
  return labels[status] || status || "unknown";
}

function providerOddsOutputKind(odds = {}) {
  if (!odds) return "idle";
  if (odds.status === "failed") return "failed";
  if (odds.status === "skipped") return "idle";
  if (["no_data", "unmatched", "no_updates"].includes(odds.dataStatus)) return "warning";
  return "ok";
}

function providerOddsOutputTitle(odds = {}) {
  if (!odds) return "Chưa có output odds";
  if (odds.status === "skipped") return "Odds sync bị bỏ qua";
  if (odds.status === "failed") return "Odds sync lỗi";
  if (odds.dataStatus === "no_data") return "Chưa có data từ The Odds API";
  if (odds.dataStatus === "unmatched") return "Có data nhưng chưa match với lịch";
  if (odds.dataStatus === "no_updates") return "Nguồn có data nhưng chưa có update mới";
  return "Đã cập nhật odds thành công";
}

function providerOddsOutputCopy(odds = {}) {
  if (!odds) return "Chưa chạy sync provider trong phiên này.";
  if (odds.error) return odds.error;
  if (odds.message) return odds.message;
  return `${fmt.format(number(odds.events))} events, ${fmt.format(number(odds.matchedEvents))} matched, ${fmt.format(number(odds.updatedMarkets))} markets updated.`;
}

function providerQuotaText(quota = {}) {
  if (!quota || quota.remaining === null || quota.remaining === undefined) return "";
  const parts = [`Còn lại ${quota.remaining} API calls`];
  if (quota.used !== null && quota.used !== undefined) parts.push(`đã dùng ${quota.used}`);
  if (quota.last !== null && quota.last !== undefined) parts.push(`lần gọi này ${quota.last}`);
  return parts.join(" · ");
}

function renderOddsTrackingReport() {
  const rows = oddsTrackingMatches();
  const totalSelections = rows.reduce((sum, row) => sum + row.totalSelections, 0);
  const providerSelections = rows.reduce((sum, row) => sum + row.providerSelections, 0);
  const internalSelections = Math.max(0, totalSelections - providerSelections);
  const latestUpdatedAt = rows
    .flatMap((row) => row.providerMarkets.map((market) => market.updatedAt).filter(Boolean))
    .sort((left, right) => new Date(right).getTime() - new Date(left).getTime())[0] || "";
  return `
    <section class="glass-card table-card odds-report-card">
      <div class="section-heading">
        <div>
          <h2>Odds tracking report</h2>
          <p>Theo doi tung tran: nha cai nao da cap nhat, selection nao van dung internal.</p>
        </div>
        <span>${fmt.format(providerSelections)}/${fmt.format(totalSelections)} bookmaker selections</span>
      </div>
      <div class="odds-report-summary">
        ${oddsReportMetric("Bookmaker", providerSelections)}
        ${oddsReportMetric("Internal fallback", internalSelections)}
        ${oddsReportMetric("Latest update", latestUpdatedAt ? dateText(latestUpdatedAt) : "No provider odds")}
      </div>
      <div class="table-row table-head odds-report-row">
        <span>Match</span><span>Kickoff</span><span>Coverage</span><span>1X2</span><span>Totals</span><span>Updated</span>
      </div>
      ${rows.map(renderOddsTrackingRow).join("") || `<div class="table-row odds-report-row"><span>No upcoming matches</span><span>-</span><span>-</span><span>-</span><span>-</span><span>-</span></div>`}
    </section>
  `;
}

function oddsReportMetric(label, value) {
  return `
    <article>
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(String(value))}</strong>
    </article>
  `;
}

function oddsTrackingMatches() {
  return state.matches
    .filter((match) => ["SCHEDULED", "TBD", "NS"].includes(String(match.status || "SCHEDULED")))
    .slice(0, 16)
    .map((match) => {
      const trackedMarkets = (match.match_markets || [])
        .filter((market) => market.is_open && ["match_result", "total_goals"].includes(market.market_key))
        .map((market) => ({ ...market, extra: marketExtra(market), updatedAt: oddsMarketUpdatedAt(market) }));
      const providerMarkets = trackedMarkets.filter((market) => market.source === "odds-api");
      return {
        match,
        trackedMarkets,
        providerMarkets,
        totalSelections: trackedMarkets.length,
        providerSelections: providerMarkets.length
      };
    });
}

function renderOddsTrackingRow(row) {
  const match = row.match;
  const oneXTwo = ["home", "draw", "away"]
    .map((key) => row.trackedMarkets.find((market) => market.market_key === "match_result" && market.selection_key === key))
    .filter(Boolean);
  const totals = row.trackedMarkets
    .filter((market) => market.market_key === "total_goals")
    .sort((left, right) => number(left.line) - number(right.line) || marketSelectionOrder(left.selection_key) - marketSelectionOrder(right.selection_key))
    .slice(0, 4);
  const latestUpdatedAt = row.providerMarkets
    .map((market) => market.updatedAt)
    .filter(Boolean)
    .sort((left, right) => new Date(right).getTime() - new Date(left).getTime())[0] || "";
  const coverageKind = row.providerSelections === 0 ? "internal" : row.providerSelections === row.totalSelections ? "complete" : "partial";
  const bookmakers = uniqueList(row.providerMarkets.map((market) => market.extra.bookmaker || market.extra.bookmaker_key || "").filter(Boolean)).slice(0, 3);
  return `
    <div class="table-row odds-report-row ${coverageKind}">
      <span><b>${escapeHtml(match.home_team.code)} vs ${escapeHtml(match.away_team.code)}</b><small>${escapeHtml(match.home_team.name)} vs ${escapeHtml(match.away_team.name)}</small></span>
      <span>${escapeHtml(dateText(match.starts_at))}</span>
      <span>${escapeHtml(oddsCoverageText(row))}${bookmakers.length ? `<small>${escapeHtml(bookmakers.join(", "))}</small>` : ""}</span>
      <span>${marketOddsInline(oneXTwo)}</span>
      <span>${marketOddsInline(totals)}</span>
      <span>${latestUpdatedAt ? escapeHtml(dateText(latestUpdatedAt)) : "internal"}<small>${escapeHtml(coverageKind)}</small></span>
    </div>
  `;
}

function marketOddsInline(markets) {
  return markets.length
    ? markets.map((market) => `<b class="${market.source === "odds-api" ? "success" : ""}">${escapeHtml(shortSelectionLabel(market))} x${fmtOne.format(number(market.odds_multiplier))}</b>`).join(" ")
    : "-";
}

function shortSelectionLabel(market) {
  if (market.market_key === "match_result") {
    return { home: "H", draw: "D", away: "A" }[market.selection_key] || market.selection_key;
  }
  const line = market.line === null || market.line === undefined ? "" : ` ${fmtOne.format(number(market.line))}`;
  return `${String(market.selection_key || "").slice(0, 1).toUpperCase()}${line}`;
}

function oddsCoverageText(row) {
  if (!row.totalSelections) return "No tracked markets";
  if (!row.providerSelections) return "Internal only";
  if (row.providerSelections === row.totalSelections) return "Bookmaker complete";
  return `${fmt.format(row.providerSelections)}/${fmt.format(row.totalSelections)} bookmaker`;
}

function oddsMarketUpdatedAt(market) {
  const extra = marketExtra(market);
  return extra.updated_at || extra.bookmaker_last_update || "";
}

function uniqueList(values) {
  return [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))];
}

function generatePassword(length = 10) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const values = new Uint32Array(length);
  crypto.getRandomValues(values);
  return Array.from(values, (value) => alphabet[value % alphabet.length]).join("");
}

function fillGeneratedPassword(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.value = generatePassword();
  input.focus();
  input.select();
}

function renderUserRow(user) {
  const deleted = Boolean(user.deleted_at);
  const canDelete = !deleted && user.id !== state.profile?.id;
  return `
    <div class="user-row ${deleted ? "deleted" : ""}">
      <div class="avatar small">${initials(user.display_name)}</div>
      <div>
        <strong>${escapeHtml(user.display_name)}</strong>
        <small>@${escapeHtml(user.username)} · ${escapeHtml(user.role)}${deleted ? ` · deleted ${dateText(user.deleted_at)}` : ""}</small>
        ${deleted && user.deleted_reason ? `<small>${escapeHtml(user.deleted_reason)}</small>` : ""}
      </div>
      <b class="score-value">${money(user.wallet_balance)}</b>
      <div class="user-actions">
        ${
          deleted
            ? `<span class="pill muted">Deleted</span>`
            : `<button class="ghost-button compact-button" data-toggle-user="${user.id}" data-active="${user.is_active ? "false" : "true"}">${user.is_active ? "Khóa" : "Mở"}</button>
               ${canDelete ? `<button class="danger-button compact-button" data-delete-user="${user.id}">Xóa</button>` : ""}`
        }
      </div>
    </div>
  `;
}

function renderUserReportRows(players) {
  const source = state.userReport.length ? state.userReport : players.map((player) => ({
    ...player,
    ...(state.leaderboard.find((row) => row.user_id === player.id) || {})
  }));
  const rows = source.map((row) => {
    return `
      <div class="table-row">
        <span>${escapeHtml(row.display_name)}</span>
        <span>${money(row.wallet_balance)}</span>
        <span>${money(row.net_points)}</span>
        <span>${money(row.bonus_points)}</span>
        <span>${money(row.score)}</span>
      </div>
    `;
  });
  return rows.join("") || `<div class="table-row"><span>No players</span><span>-</span><span>-</span><span>-</span><span>-</span></div>`;
}

function renderMarketReportRows() {
  const rows = state.marketReport.map((row) => `
    <div class="table-row">
      <span>${escapeHtml(row.market_key)}</span>
      <span>${fmt.format(number(row.total_bets))}</span>
      <span>${money(row.total_staked)}</span>
      <span>${number(row.roi)}%</span>
      <span>${money(row.score)}</span>
    </div>
  `);
  return rows.join("") || `<div class="table-row"><span>No markets</span><span>-</span><span>-</span><span>-</span><span>-</span></div>`;
}

function renderAdminBetRow(bet) {
  return `
    <article class="history-row bet-detail-row ${escapeHtml(bet.status)}">
      ${renderBetDetailCells(bet, { includeUser: true, allowVoid: true })}
    </article>
  `;
}

function renderAdminPredictionExplorer(players) {
  const selectedUser = state.adminPredictionUserId;
  const selectedProfile = players.find((user) => user.id === selectedUser);
  const rows = state.adminPredictionBets;
  return `
    <section class="glass-card panel admin-prediction-explorer">
      <div class="section-heading">
        <div><h2>All player predictions</h2><p>Chọn tài khoản để xem toàn bộ dự đoán của người chơi.</p></div>
        <span>${rows ? `${fmt.format(rows.length)} predictions` : "Chưa tải"}</span>
      </div>
      <div class="admin-prediction-controls">
        <label>Player<select id="admin-prediction-user">
          <option value="">Chọn người chơi</option>
          ${players.map((user) => `<option value="${user.id}" ${selectedUser === user.id ? "selected" : ""}>${escapeHtml(user.display_name)} (@${escapeHtml(user.username)})</option>`).join("")}
        </select></label>
        <button class="ghost-button" id="refresh-admin-predictions" type="button" ${selectedUser ? "" : "disabled"}>Refresh predictions</button>
      </div>
      ${state.adminPredictionError ? `<p class="error">${escapeHtml(state.adminPredictionError)}</p>` : ""}
      ${
        !selectedUser
          ? `<p>Chọn một người chơi để xem lịch sử dự đoán.</p>`
          : rows === null
            ? `<p>Loading predictions for ${escapeHtml(selectedProfile?.display_name || "player")}...</p>`
            : rows.length
              ? `<div class="stack compact-stack">${rows.map(renderAdminBetRow).join("")}</div>`
              : `<p>Người chơi này chưa có dự đoán.</p>`
      }
    </section>
  `;
}

function renderLedgerRow(entry) {
  return `
    <div class="table-row">
      <span>${dateText(entry.created_at)}</span>
      <span>${escapeHtml(entry.user?.display_name || entry.user_id)}</span>
      <span>${escapeHtml(entry.kind)}</span>
      <span>${money(entry.amount)}</span>
      <span>${money(entry.balance_after)}</span>
    </div>
  `;
}

function renderAuditRow(entry) {
  return `
    <div class="table-row">
      <span>${dateText(entry.created_at)}</span>
      <span>${escapeHtml(entry.actor?.display_name || entry.actor_id || "system")}</span>
      <span>${escapeHtml(entry.action)}</span>
      <span>${escapeHtml(`${entry.entity_type}:${entry.entity_id || ""}`)}</span>
      <span>${escapeHtml(compactJson(entry.details_json))}</span>
    </div>
  `;
}

async function selectLeaderboardUser(userId) {
  if (!userId) return;
  if (!canInspectLeaderboardBets(userId)) {
    state.selectedLeaderboardUserId = "";
    state.selectedLeaderboardBets = null;
    state.leaderboardDetailError = "";
    return;
  }
  state.selectedLeaderboardUserId = userId;
  state.selectedLeaderboardBets = null;
  state.leaderboardDetailError = "";
  renderApp();
  try {
    const { data, error } = await state.client
      .from("bets")
      .select(betDetailSelect)
      .eq("user_id", userId)
      .order("placed_at", { ascending: false })
      .limit(300);
    if (error) throw error;
    if (state.selectedLeaderboardUserId !== userId) return;
    state.selectedLeaderboardBets = data || [];
  } catch (error) {
    if (state.selectedLeaderboardUserId !== userId) return;
    state.selectedLeaderboardBets = [];
    state.leaderboardDetailError = error.message || String(error);
  }
  renderApp();
}

function bindShellEvents() {
  document.querySelectorAll("[data-sidebar-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
      localStorage.setItem("WCP_SIDEBAR_COLLAPSED", String(state.sidebarCollapsed));
      state.profileMenuOpen = false;
      renderApp();
    });
  });

  document.querySelectorAll("[data-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      state.active = button.dataset.tab;
      state.notificationPanelOpen = false;
      state.profileMenuOpen = false;
      state.message = "";
      state.error = "";
      renderApp();
    });
  });

  document.querySelectorAll("[data-leaderboard-user]").forEach((button) => {
    button.addEventListener("click", () => selectLeaderboardUser(button.dataset.leaderboardUser));
  });

  document.querySelector("[data-clear-leaderboard-user]")?.addEventListener("click", () => {
    state.selectedLeaderboardUserId = "";
    state.selectedLeaderboardBets = null;
    state.leaderboardDetailError = "";
    renderApp();
  });

  document.querySelector("[data-profile-toggle]")?.addEventListener("click", (event) => {
    event.stopPropagation();
    state.profileMenuOpen = !state.profileMenuOpen;
    state.notificationPanelOpen = false;
    renderApp();
  });

  document.querySelector("[data-password-toggle]")?.addEventListener("click", (event) => {
    event.stopPropagation();
    resetPasswordChangeState(!state.passwordChange?.open);
    state.profileMenuOpen = true;
    state.notificationPanelOpen = false;
    state.message = "";
    state.error = "";
    renderApp();
  });

  document.getElementById("change-password-form")?.addEventListener("submit", changeOwnPassword);

  document.querySelector("[data-notification-toggle]")?.addEventListener("click", (event) => {
    event.stopPropagation();
    const opening = !state.notificationPanelOpen;
    if (opening) {
      markNotificationsRead(getNotificationItems().map((item) => item.id));
    }
    state.notificationPanelOpen = opening;
    state.profileMenuOpen = false;
    renderApp();
  });

  document.querySelectorAll("[data-notification-bet]").forEach((button) => {
    button.addEventListener("click", () => {
      markNotificationsRead([button.dataset.notificationRead]);
      state.notificationPanelOpen = false;
      state.profileMenuOpen = false;
      requestOpenBetModal(Number(button.dataset.notificationBet));
    });
  });

  document.querySelectorAll("[data-notification-history]").forEach((button) => {
    button.addEventListener("click", () => {
      markNotificationsRead([button.dataset.notificationRead]);
      state.notificationPanelOpen = false;
      state.profileMenuOpen = false;
      state.active = "predictionStats";
      state.predictionStatsTab = "history";
      renderApp();
    });
  });

  document.querySelectorAll("[data-match]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedMatchId = Number(button.dataset.match);
      state.active = "detail";
      renderApp();
    });
  });

  document.querySelectorAll("[data-open-bet-modal]").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.closest("#match-search-results")) return;
      if (button.dataset.notificationRead) markNotificationsRead([button.dataset.notificationRead]);
      state.notificationPanelOpen = false;
      state.profileMenuOpen = false;
      requestOpenBetModal(Number(button.dataset.openBetModal));
    });
  });

  document.querySelector("[data-match-search-toggle]")?.addEventListener("click", () => {
    state.matchSearchPanelOpen = !state.matchSearchPanelOpen;
    renderApp();
    if (state.matchSearchPanelOpen) document.getElementById("group-team-search")?.focus();
  });

  document.getElementById("group-team-search")?.addEventListener("input", (event) => {
    state.matchSearchQuery = event.target.value;
    const results = document.getElementById("match-search-results");
    const meta = document.querySelector(".match-search-meta");
    if (results) results.innerHTML = renderMatchSearchResults();
    if (meta) {
      const resultCount = filteredGroupTeamMatches(state.matchSearchQuery).length;
      meta.textContent = state.matchSearchQuery ? `${fmt.format(resultCount)} trận phù hợp` : "Gõ bảng hoặc đội để xem trận liên quan.";
    }
  });

  document.getElementById("match-search-results")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-open-bet-modal]");
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    requestOpenBetModal(Number(button.dataset.openBetModal));
  });

  document.querySelectorAll("[data-calendar-month]").forEach((button) => {
    button.addEventListener("click", () => {
      const direction = Number(button.dataset.calendarMonth);
      state.calendarMonth = adjacentCalendarMonth(activeCalendarMonth(), direction);
      state.selectedCalendarDate = "";
      state.selectedMatchId = null;
      renderApp();
    });
  });

  document.querySelectorAll("[data-calendar-date]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedCalendarDate = button.dataset.calendarDate;
      state.calendarMonth = monthKeyFromDateKey(state.selectedCalendarDate);
      state.matchFilter = "all";
      state.selectedMatchId = null;
      renderApp();
    });
  });

  document.querySelectorAll("[data-calendar-clear]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedCalendarDate = "";
      state.selectedMatchId = null;
      renderApp();
    });
  });

  document.querySelectorAll("[data-confirm-rebet]").forEach((button) => {
    button.addEventListener("click", () => {
      const matchId = Number(button.dataset.confirmRebet);
      state.confirmRebetMatchId = null;
      openBetModal(matchId);
    });
  });

  document.querySelectorAll("[data-cancel-rebet]").forEach((button) => {
    button.addEventListener("click", () => {
      state.confirmRebetMatchId = null;
      renderApp();
    });
  });

  document.querySelector("[data-rebet-backdrop]")?.addEventListener("click", (event) => {
    if (event.target.closest("[data-rebet-panel]")) return;
    state.confirmRebetMatchId = null;
    renderApp();
  });

  document.querySelectorAll("[data-close-bet-modal]").forEach((target) => {
    target.addEventListener("click", (event) => {
      if (event.target.closest("[data-modal-panel]") && !event.target.closest(".icon-button")) return;
      state.betModalMatchId = null;
      state.betModalDraft = {};
      renderApp();
    });
  });

  document.querySelectorAll("[data-bet-modal-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      syncBetModalDraftFromDom();
      state.betModalMarketGroup = button.dataset.betModalTab;
      renderApp();
    });
  });

  document.querySelectorAll("[data-match-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      state.matchFilter = button.dataset.matchFilter;
      state.selectedCalendarDate = "";
      state.selectedMatchId = null;
      renderApp();
    });
  });

  document.querySelectorAll("[data-schedule-sheet]").forEach((button) => {
    button.addEventListener("click", () => {
      state.scheduleSheet = button.dataset.scheduleSheet === "completed" ? "completed" : "upcoming";
      state.selectedMatchId = null;
      renderApp();
    });
  });

  document.querySelectorAll("[data-toggle-group-results]").forEach((button) => {
    button.addEventListener("click", () => {
      const groupName = button.dataset.toggleGroupResults;
      state.groupResultsOpen = {
        ...state.groupResultsOpen,
        [groupName]: !state.groupResultsOpen?.[groupName]
      };
      renderApp();
    });
  });

  document.querySelector("[data-sync-help-toggle]")?.addEventListener("click", () => {
    state.syncHelpOpen = !state.syncHelpOpen;
    renderApp();
  });

  document.querySelectorAll("[data-prediction-stats-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      state.predictionStatsTab = button.dataset.predictionStatsTab;
      renderApp();
    });
  });

  document.querySelector("[data-success-continue]")?.addEventListener("click", () => {
    const bet = state.bets.find((item) => item.id === state.lastPredictionBetId);
    if (bet?.match_id) state.selectedMatchId = bet.match_id;
    state.active = bet?.match_id ? "detail" : "matches";
    state.message = "";
    state.error = "";
    renderApp();
  });

  document.querySelector("[data-success-history]")?.addEventListener("click", () => {
    state.active = "predictionStats";
    state.predictionStatsTab = "history";
    state.message = "";
    state.error = "";
    renderApp();
  });

  document.querySelectorAll("[data-team-roster]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedTeamId = Number(button.dataset.teamRoster);
      state.selectedRoleGroup = "";
      state.active = "teamProfile";
      renderApp();
    });
  });

  document.querySelector("[data-back-groups]")?.addEventListener("click", () => {
    state.active = "groups";
    renderApp();
  });

  document.querySelector("[data-close-roster]")?.addEventListener("click", () => {
    state.selectedTeamId = null;
    renderApp();
  });

  document.querySelectorAll("[data-refresh-fifa-team]").forEach((button) => {
    button.addEventListener("click", () => refreshFifaTeam(button.dataset.refreshFifaTeam));
  });
  document.querySelectorAll("[data-refresh-transfermarkt-team]").forEach((button) => {
    button.addEventListener("click", () => syncTransfermarktValues(button.dataset.refreshTransfermarktTeam));
  });
  document.querySelector("[data-refresh-all-fifa-teams]")?.addEventListener("click", refreshAllFifaTeams);
  document.querySelectorAll("[data-role-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedRoleGroup = button.dataset.roleFilter || "";
      renderApp();
      if (state.selectedRoleGroup) {
        document.getElementById(`role-section-${state.selectedRoleGroup}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  });

  document.getElementById("match-search")?.addEventListener("input", (event) => {
    state.matchSearch = event.target.value;
    state.selectedMatchId = null;
    renderApp();
    document.getElementById("match-search")?.focus();
  });

  document.querySelector("[data-reminder-focus]")?.addEventListener("click", () => {
    state.active = "matches";
    renderApp();
    document.getElementById("bet-reminders")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  document.querySelectorAll("[data-reminder-dismiss]").forEach((button) => {
    button.addEventListener("click", () => {
      dismissReminder(button.dataset.reminderDismiss);
      renderApp();
    });
  });

  document.querySelectorAll("#logout-button, #profile-logout-button").forEach((button) => button.addEventListener("click", async () => {
    await state.client.auth.signOut();
    state.session = null;
    state.profile = null;
    state.profileMenuOpen = false;
    resetPasswordChangeState(false);
    renderLogin();
  }));

  document.getElementById("score-bet-form")?.addEventListener("submit", placeScoreBet);
  document.getElementById("modal-bulk-bet-form")?.addEventListener("submit", submitModalBets);
  enhanceUpdateBetForms();
  document.querySelectorAll("[data-modal-market-toggle]").forEach((input) => {
    input.addEventListener("change", () => {
      syncBetModalDraftFromDom();
      renderApp();
    });
  });
  document.querySelectorAll("[data-modal-market-choice]").forEach((input) => {
    input.addEventListener("change", () => {
      syncBetModalDraftFromDom();
      renderApp();
    });
  });
  document.querySelectorAll("[data-modal-market-stake]").forEach((input) => {
    prepareStakeInput(input);
    input.addEventListener("input", (event) => {
      handleStakeInput(event);
      updateModalDerivedValues();
    });
  });
  document.querySelectorAll(".update-bet-form input[name='stake']").forEach((input) => {
    prepareStakeInput(input);
    input.addEventListener("input", handleStakeInput);
  });
  document.querySelectorAll("#golden-boot-stake, #winner-stake, #stake").forEach((input) => {
    prepareStakeInput(input);
    input.addEventListener("input", handleStakeInput);
  });
  document.querySelectorAll(".update-bet-form").forEach((form) => {
    form.addEventListener("submit", updateBet);
  });
  document.querySelectorAll("[data-market]").forEach((button) => {
    button.addEventListener("click", () => placeMarketBet(Number(button.dataset.market)));
  });
  document.querySelectorAll("[data-outright]").forEach((button) => {
    button.addEventListener("click", () => placeOutrightBet(Number(button.dataset.outright)));
  });
  document.getElementById("golden-boot-search")?.addEventListener("input", (event) => {
    state.goldenBootSearch = event.target.value;
    updateOutrightSearchResults("golden_boot");
  });
  document.getElementById("winner-search")?.addEventListener("input", (event) => {
    state.winnerSearch = event.target.value;
    updateOutrightSearchResults("tournament_winner");
  });
  document.getElementById("golden-boot-form")?.addEventListener("submit", (event) => placeSelectedOutrightBet(event, "golden_boot"));
  document.getElementById("winner-form")?.addEventListener("submit", (event) => placeSelectedOutrightBet(event, "tournament_winner"));
  document.getElementById("create-user-form")?.addEventListener("submit", createUser);
  document.getElementById("admin-filter-form")?.addEventListener("submit", applyAdminReportFilters);
  document.getElementById("clear-admin-filters")?.addEventListener("click", clearAdminReportFilters);
  document.getElementById("top-up-form")?.addEventListener("submit", adjustWallet);
  document.getElementById("result-form")?.addEventListener("submit", updateResultAndSettle);
  document.getElementById("bracket-slot-form")?.addEventListener("submit", setBracketSlot);
  document.getElementById("market-control-form")?.addEventListener("submit", updateMarketControl);
  document.getElementById("admin-market-id")?.addEventListener("change", hydrateMarketControlForm);
  hydrateMarketControlForm();
  document.getElementById("outright-control-form")?.addEventListener("submit", updateOutrightControl);
  document.getElementById("admin-outright-id")?.addEventListener("change", hydrateOutrightControlForm);
  hydrateOutrightControlForm();
  document.getElementById("reset-password-form")?.addEventListener("submit", resetPassword);
  document.querySelectorAll("[data-generate-pass]").forEach((button) => {
    button.addEventListener("click", () => fillGeneratedPassword(button.dataset.generatePass));
  });
  document.getElementById("tournament-winner-form")?.addEventListener("submit", settleTournamentWinner);
  document.getElementById("golden-boot-settle-form")?.addEventListener("submit", settleGoldenBoot);
  document.getElementById("refresh-button")?.addEventListener("click", () => loadData());
  document.getElementById("settle-all-button")?.addEventListener("click", settleAllFt);
  document.getElementById("quick-results-sync-button")?.addEventListener("click", syncResultsOnly);
  document.getElementById("sync-odds-button")?.addEventListener("click", syncOddsOnly);
  document.getElementById("sync-data-button")?.addEventListener("click", syncFixturesAndFifaData);
  document.getElementById("provider-sync-button")?.addEventListener("click", syncProviders);
  document.getElementById("transfermarkt-sync-button")?.addEventListener("click", () => syncTransfermarktValues());
  document.getElementById("transfermarkt-import-form")?.addEventListener("submit", importTransfermarktValues);
  document.getElementById("export-leaderboard-button")?.addEventListener("click", exportLeaderboardCsv);
  document.getElementById("export-bets-button")?.addEventListener("click", exportBetsCsv);
  document.getElementById("export-ledger-button")?.addEventListener("click", exportLedgerCsv);
  document.getElementById("export-audit-button")?.addEventListener("click", exportAuditCsv);
  document.getElementById("export-reports-button")?.addEventListener("click", exportReportsCsv);
  document.getElementById("export-results-button")?.addEventListener("click", exportResultsCsv);
  document.getElementById("export-odds-report-button")?.addEventListener("click", exportOddsReportCsv);
  document.getElementById("admin-prediction-user")?.addEventListener("change", (event) => loadAdminPredictions(event.target.value));
  document.getElementById("refresh-admin-predictions")?.addEventListener("click", () => loadAdminPredictions(state.adminPredictionUserId));
  document.querySelectorAll("[data-toggle-user]").forEach((button) => {
    button.addEventListener("click", () => toggleUser(button.dataset.toggleUser, button.dataset.active === "true"));
  });
  document.querySelectorAll("[data-delete-user]").forEach((button) => {
    button.addEventListener("click", () => softDeleteUser(button.dataset.deleteUser));
  });
  document.querySelectorAll("[data-void-bet]").forEach((button) => {
    button.addEventListener("click", () => voidBet(Number(button.dataset.voidBet)));
  });
}

function requestOpenBetModal(matchId) {
  const match = state.matches.find((item) => Number(item.id) === Number(matchId));
  if (match && shouldConfirmRebet(match)) {
    state.selectedMatchId = matchId;
    state.confirmRebetMatchId = matchId;
    state.betModalMatchId = null;
    state.active = "detail";
    renderApp();
    return;
  }
  openBetModal(matchId);
}

function openBetModal(matchId) {
  state.selectedMatchId = matchId;
  state.betModalMatchId = matchId;
  state.confirmRebetMatchId = null;
  state.betModalMarketGroup = "basic";
  state.betModalDraft = {};
  state.active = "detail";
  renderApp();
}

async function submitModalBets(event) {
  event.preventDefault();
  if (state.isSubmittingBet) return;
  const match = state.matches.find((item) => item.id === state.betModalMatchId) || selectedMatch();
  if (!match) return;
  let collected;
  try {
    collected = collectModalBetPayloads(match);
  } catch (error) {
    state.error = error instanceof Error ? error.message : String(error);
    state.message = "";
    renderApp();
    return;
  }
  const { payloads, totalExtra } = collected;
  const wallet = number(state.profile?.wallet_balance);
  if (!payloads.length) {
    state.error = "Hãy tick chọn ít nhất một mục cược.";
    state.message = "";
    renderApp();
    return;
  }
  if (totalExtra > wallet) {
    state.error = `Tổng tiền cần thêm ${money(totalExtra)} vượt ví còn lại ${money(wallet)}.`;
    state.message = "";
    renderApp();
    return;
  }

  state.isSubmittingBet = true;
  renderApp();
  try {
    let lastBetId = null;
    for (const payload of payloads) {
      const { data, error } = await state.client.rpc("place_bet", payload);
      if (error) throw new Error(error.message);
      lastBetId = data?.id || lastBetId;
    }
    state.message = `Đã lưu ${fmt.format(payloads.length)} mục cược và cập nhật ví.`;
    state.error = "";
    state.lastPredictionBetId = lastBetId;
    state.betModalMatchId = null;
    state.betModalDraft = {};
    state.active = "predictionSuccess";
  } catch (error) {
    state.error = error instanceof Error ? error.message : String(error);
    state.message = "";
  } finally {
    state.isSubmittingBet = false;
  }
  await loadData();
}

async function applyAdminReportFilters(event) {
  event.preventDefault();
  state.adminFilters = {
    userId: document.getElementById("filter-user").value,
    dateFrom: document.getElementById("filter-date-from").value,
    dateTo: document.getElementById("filter-date-to").value
  };
  await loadData();
}

async function clearAdminReportFilters() {
  state.adminFilters = { userId: "", dateFrom: "", dateTo: "" };
  await loadData();
}

function hydrateMarketControlForm() {
  const select = document.getElementById("admin-market-id");
  const option = select?.selectedOptions?.[0];
  if (!option) return;
  document.getElementById("admin-market-multiplier").value = option.dataset.multiplier || "2";
  document.getElementById("admin-market-open").value = option.dataset.open || "true";
  document.getElementById("admin-market-closes-at").value = option.dataset.closesAt || "";
}

function hydrateOutrightControlForm() {
  const select = document.getElementById("admin-outright-id");
  const option = select?.selectedOptions?.[0];
  if (!option) return;
  document.getElementById("admin-outright-multiplier").value = option.dataset.multiplier || "8";
  document.getElementById("admin-outright-open").value = option.dataset.open || "true";
  document.getElementById("admin-outright-closes-at").value = option.dataset.closesAt || "";
}

function enhanceUpdateBetForms() {
  document.querySelectorAll(".update-bet-form").forEach((form) => {
    const bet = state.bets.find((item) => item.id === Number(form.dataset.updateBet));
    const match = matchForBet(bet || {});
    if (!bet || !match || bet.market_key === "correct_score" || form.elements.market_id) return;
    const markets = sortMarketsForDisplay((match.match_markets || [])
      .filter((market) => isBettableMarket(market) && market.market_key === bet.market_key));
    if (!markets.length) return;
    const selectionInput = [...form.querySelectorAll("input")].find((input) => input.disabled);
    const label = selectionInput?.closest("label");
    if (!label) return;
    const select = document.createElement("select");
    select.name = "market_id";
    for (const market of markets) {
      const option = document.createElement("option");
      option.value = String(market.id);
      option.selected = Number(market.id) === Number(bet.market_id);
      option.textContent = `${market.selection_label} · x${fmtOne.format(number(market.odds_multiplier))}`;
      select.appendChild(option);
    }
    label.replaceChildren(document.createTextNode("Selection"), select);
  });
}

async function updateBet(event) {
  event.preventDefault();
  if (state.isSubmittingBet) return;
  const form = event.currentTarget;
  const bet = state.bets.find((item) => item.id === Number(form.dataset.updateBet));
  if (!bet) return;
  const match = matchForBet(bet);
  const selectedMarketId = Number(form.elements.market_id?.value || bet.market_id);
  const market = (match?.match_markets || []).find((item) => Number(item.id) === selectedMarketId)
    || marketForBet(bet, match);
  if (!match || !market) {
    state.error = "Không tìm thấy market để cập nhật dự đoán.";
    state.message = "";
    renderApp();
    return;
  }

  const stake = parseStakeInput(form.elements.stake.value);
  const selectionJson = bet.market_key === "correct_score"
    ? {
        home_score: Number(form.elements.home_score.value),
        away_score: Number(form.elements.away_score.value)
      }
    : { line: market.line };
  const selectionKey = bet.market_key === "correct_score"
    ? `${selectionJson.home_score}-${selectionJson.away_score}`
    : market.selection_key;

  state.isSubmittingBet = true;
  renderApp();
  try {
    const { data, error } = await state.client.rpc("update_bet", {
      p_bet_id: bet.id,
      p_market_id: market.id,
      p_selection_key: selectionKey,
      p_stake: stake,
      p_selection_json: selectionJson
    });
    if (error) {
      state.error = error.message;
      state.message = "";
    } else {
      state.message = "Đã cập nhật dự đoán trước giờ khóa cược.";
      state.error = "";
      state.lastPredictionBetId = data?.id || bet.id;
      state.active = "predictionSuccess";
    }
  } catch (error) {
    state.error = error instanceof Error ? error.message : String(error);
    state.message = "";
  } finally {
    state.isSubmittingBet = false;
  }
  await loadData();
}

async function placeScoreBet(event) {
  event.preventDefault();
  const match = selectedMatch();
  const market = match.match_markets.find((item) => item.market_key === "correct_score" && isBettableMarket(item));
  if (!market) {
    state.error = "Trận này chưa có kèo tỷ số.";
    state.message = "";
    renderApp();
    return;
  }
  const homeScore = Number(document.getElementById("home-score").value);
  const awayScore = Number(document.getElementById("away-score").value);
  const stake = parseStakeInput(document.getElementById("stake")?.value);
  await placeBet({
    p_match_id: match.id,
    p_market_id: market.id,
    p_selection_key: `${homeScore}-${awayScore}`,
    p_selection_label: `${homeScore} - ${awayScore}`,
    p_stake: stake,
    p_selection_json: { home_score: homeScore, away_score: awayScore }
  });
}

async function placeMarketBet(marketId) {
  if (state.isSubmittingBet) return;
  const match = selectedMatch();
  const market = match.match_markets.find((item) => item.id === marketId);
  const stake = parseStakeInput(prompt("Tiền cược ($)", "100") || 0);
  if (!market || !isBettableMarket(market) || !stake) return;
  await placeBet({
    p_match_id: match.id,
    p_market_id: market.id,
    p_selection_key: market.selection_key,
    p_selection_label: market.selection_label,
    p_stake: stake,
    p_selection_json: { line: market.line }
  });
}

async function placeOutrightBet(marketId) {
  if (state.isSubmittingBet) return;
  const market = state.outrightMarkets.find((item) => item.id === marketId);
  const stake = parseStakeInput(prompt("Tiền cược ($)", "100") || 0);
  if (!market || market.source !== "odds-api" || !stake) return;
  await submitOutrightBet(market.id, stake);
}

async function placeSelectedOutrightBet(event, marketKey) {
  event.preventDefault();
  if (state.isSubmittingBet) return;
  const selectId = marketKey === "golden_boot" ? "golden-boot-select" : "winner-select";
  const stakeId = marketKey === "golden_boot" ? "golden-boot-stake" : "winner-stake";
  const marketId = Number(document.getElementById(selectId)?.value || 0);
  const stake = parseStakeInput(document.getElementById(stakeId)?.value);
  if (!marketId || !stake) return;
  await submitOutrightBet(marketId, stake);
}

async function submitOutrightBet(marketId, stake) {
  const market = state.outrightMarkets.find((item) => item.id === marketId);
  if (!market || market.source !== "odds-api" || !stake) return;
  state.isSubmittingBet = true;
  renderApp();
  try {
    const { data, error } = await state.client.rpc("place_outright_bet", {
      p_outright_market_id: market.id,
      p_stake: stake
    });
    if (error) {
      state.error = error.message;
      state.message = "";
    } else {
      const marketName = market.market_key === "golden_boot" ? "Vua phá lưới" : "vô địch";
      state.message = `Đã đặt kèo ${marketName}: ${market.selection_label}.`;
      state.error = "";
      state.lastPredictionBetId = data?.id || null;
      state.betModalMatchId = null;
      state.active = "predictionSuccess";
    }
  } catch (error) {
    state.error = error instanceof Error ? error.message : String(error);
    state.message = "";
  } finally {
    state.isSubmittingBet = false;
  }
  await loadData();
}

async function placeBet(payload) {
  if (state.isSubmittingBet) return;
  state.isSubmittingBet = true;
  renderApp();
  try {
    const { data, error } = await state.client.rpc("place_bet", payload);
    if (error) {
      state.error = error.message;
      state.message = "";
    } else {
      state.message = "Đã ghi nhận dự đoán và trừ tiền cược.";
      state.error = "";
      state.lastPredictionBetId = data?.id || null;
      state.betModalMatchId = null;
      state.active = "predictionSuccess";
    }
  } catch (error) {
    state.error = error instanceof Error ? error.message : String(error);
    state.message = "";
  } finally {
    state.isSubmittingBet = false;
  }
  await loadData();
}

async function createUser(event) {
  event.preventDefault();
  if (state.actionLoading) return;
  const payload = {
    username: document.getElementById("new-username").value.trim().toLowerCase(),
    display_name: document.getElementById("new-display-name").value.trim(),
    password: document.getElementById("new-password").value,
    starting_points: Number(document.getElementById("new-points").value || 0)
  };
  state.actionLoading = "createUser";
  renderApp();
  try {
    await safeFetchJson("/api/admin-create-user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${state.session.access_token}`
      },
      body: JSON.stringify(payload)
    });
    state.message = `Đã tạo tài khoản người chơi. Mật khẩu mới: ${payload.password}`;
    state.error = "";
  } catch (error) {
    state.error = error.message || "Không thể tạo user";
    state.message = "";
  } finally {
    state.actionLoading = "";
  }
  await loadData();
}

async function adjustWallet(event) {
  event.preventDefault();
  if (state.actionLoading) return;
  const userId = document.getElementById("topup-user").value;
  const amount = Number(document.getElementById("topup-amount").value || 0);
  const reason = document.getElementById("topup-reason").value;
  state.actionLoading = "wallet";
  renderApp();
  const { error } = await state.client.rpc("admin_adjust_wallet", {
    p_user_id: userId,
    p_amount: amount,
    p_reason: reason
  });
  state.message = error ? "" : "Đã cập nhật ví.";
  state.error = error ? error.message : "";
  state.actionLoading = "";
  await loadData();
}

async function setBracketSlot(event) {
  event.preventDefault();
  const matchNo = Number(document.getElementById("bracket-match-no").value);
  const slot = document.getElementById("bracket-slot").value;
  const teamId = Number(document.getElementById("bracket-team-id").value);
  const { error } = await state.client.rpc("admin_set_bracket_slot", {
    p_match_no: matchNo,
    p_slot: slot,
    p_team_id: teamId
  });
  state.message = error ? "" : `Updated bracket match ${fmt.format(matchNo)} ${slot} slot.`;
  state.error = error ? error.message : "";
  await loadData();
}

async function updateResultAndSettle(event) {
  event.preventDefault();
  const matchId = Number(document.getElementById("result-match").value);
  const status = document.getElementById("result-status").value;
  const [home, away] = document.getElementById("result-score").value.split("-").map((part) => Number(part.trim()));
  const penaltyValue = document.getElementById("result-penalties").value.trim();
  const [homePenalties, awayPenalties] = penaltyValue
    ? penaltyValue.split("-").map((part) => Number(part.trim()))
    : [null, null];
  const { error: updateError } = await state.client
    .from("matches")
    .update({
      status,
      home_score: home,
      away_score: away,
      home_penalties: Number.isFinite(homePenalties) ? homePenalties : null,
      away_penalties: Number.isFinite(awayPenalties) ? awayPenalties : null,
      updated_at: new Date().toISOString()
    })
    .eq("id", matchId);
  if (updateError) {
    state.error = updateError.message;
    await loadData();
    return;
  }
  const selectedMatch = state.matches.find((match) => Number(match.id) === matchId);
  if (selectedMatch?.home_team_id || selectedMatch?.home_team?.id) {
    await state.client
      .from("match_results")
      .upsert({
        match_id: matchId,
        home_team_id: selectedMatch.home_team_id || selectedMatch.home_team?.id,
        away_team_id: selectedMatch.away_team_id || selectedMatch.away_team?.id,
        status,
        home_score: home,
        away_score: away,
        home_penalties: Number.isFinite(homePenalties) ? homePenalties : null,
        away_penalties: Number.isFinite(awayPenalties) ? awayPenalties : null,
        provider: "admin",
        source: "admin",
        provider_payload: { updated_by: state.profile?.id || null },
        finished_at: new Date().toISOString(),
        synced_at: new Date().toISOString()
      }, { onConflict: "match_id" });
  }
  const { data, error } = await state.client.rpc("settle_match_bets", { p_match_id: matchId });
  state.message = error ? "" : `Đã settle ${data} cược.`;
  state.error = error ? error.message : "";
  await loadData();
}

async function updateMarketControl(event) {
  event.preventDefault();
  const marketId = Number(document.getElementById("admin-market-id").value);
  const multiplier = Number(document.getElementById("admin-market-multiplier").value);
  const closesAtValue = document.getElementById("admin-market-closes-at").value;
  const isOpen = document.getElementById("admin-market-open").value === "true";

  if (!marketId || !multiplier || !closesAtValue) {
    state.error = "Market, multiplier, and lock time are required.";
    state.message = "";
    renderApp();
    return;
  }

  const { error } = await state.client.rpc("admin_update_match_market", {
    p_market_id: marketId,
    p_odds_multiplier: multiplier,
    p_is_open: isOpen,
    p_closes_at: new Date(closesAtValue).toISOString()
  });

  state.message = error ? "" : "Market updated.";
  state.error = error ? error.message : "";
  await loadData();
}

async function updateOutrightControl(event) {
  event.preventDefault();
  const marketId = Number(document.getElementById("admin-outright-id").value);
  const multiplier = Number(document.getElementById("admin-outright-multiplier").value);
  const closesAtValue = document.getElementById("admin-outright-closes-at").value;
  const isOpen = document.getElementById("admin-outright-open").value === "true";

  if (!marketId || !multiplier || !closesAtValue) {
    state.error = "Outright, multiplier, and lock time are required.";
    state.message = "";
    renderApp();
    return;
  }

  const { error } = await state.client.rpc("admin_update_outright_market", {
    p_market_id: marketId,
    p_odds_multiplier: multiplier,
    p_is_open: isOpen,
    p_closes_at: new Date(closesAtValue).toISOString()
  });

  state.message = error ? "" : "Outright updated.";
  state.error = error ? error.message : "";
  await loadData();
}

async function resetPassword(event) {
  event.preventDefault();
  if (state.actionLoading) return;
  const payload = {
    user_id: document.getElementById("reset-user").value,
    password: document.getElementById("reset-password").value
  };
  state.actionLoading = "resetPassword";
  renderApp();
  try {
    await safeFetchJson("/api/admin-reset-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${state.session.access_token}`
      },
      body: JSON.stringify(payload)
    });
    state.message = `Password reset. Mật khẩu mới: ${payload.password}`;
    state.error = "";
  } catch (error) {
    state.error = error.message || "Cannot reset password";
    state.message = "";
  } finally {
    state.actionLoading = "";
  }
  await loadData();
}

async function loadAdminPredictions(userId) {
  if (!userId) {
    state.adminPredictionUserId = "";
    state.adminPredictionBets = null;
    state.adminPredictionError = "";
    renderApp();
    return;
  }
  state.adminPredictionUserId = userId;
  state.adminPredictionBets = null;
  state.adminPredictionError = "";
  renderApp();
  try {
    const { data, error } = await state.client
      .from("bets")
      .select(betDetailSelect)
      .eq("user_id", userId)
      .order("placed_at", { ascending: false })
      .limit(1000);
    if (error) throw error;
    if (state.adminPredictionUserId !== userId) return;
    state.adminPredictionBets = data || [];
    state.adminPredictionError = "";
  } catch (error) {
    if (state.adminPredictionUserId !== userId) return;
    state.adminPredictionBets = [];
    state.adminPredictionError = error.message || String(error);
  }
  renderApp();
}

async function settleTournamentWinner(event) {
  event.preventDefault();
  const winnerKey = document.getElementById("winner-key").value;
  const { data, error } = await state.client.rpc("settle_tournament_winner", { p_winner_key: winnerKey });
  state.message = error ? "" : `Đã settle ${data} kèo vô địch.`;
  state.error = error ? error.message : "";
  await loadData();
}

async function settleGoldenBoot(event) {
  event.preventDefault();
  const topScorerKey = document.getElementById("golden-boot-key").value;
  const { data, error } = await state.client.rpc("settle_golden_boot", { p_top_scorer_key: topScorerKey });
  state.message = error ? "" : `Settled ${data} Golden Boot bets.`;
  state.error = error ? error.message : "";
  await loadData();
}

async function settleAllFt() {
  state.message = ""; state.error = ""; renderApp();
  try {
    const { data: ftMatches, error: e1 } = await state.client
      .from("matches")
      .select("id")
      .in("status", ["FT", "AET", "PEN", "FT_PEN"]);
    if (e1) throw e1;
    if (!ftMatches.length) { state.message = "Không có trận FT nào."; renderApp(); return; }
    const ids = ftMatches.map((m) => m.id);
    const { data: bets, error: e2 } = await state.client
      .from("bets").select("match_id").eq("status", "placed").in("match_id", ids);
    if (e2) throw e2;
    const unsettledIds = [...new Set((bets || []).map((b) => b.match_id))];
    if (!unsettledIds.length) { state.message = "Tất cả cược đã settle rồi."; renderApp(); return; }
    let total = 0;
    for (const matchId of unsettledIds) {
      const { data, error } = await state.client.rpc("settle_match_bets", { p_match_id: matchId });
      if (!error) total += Number(data) || 0;
    }
    state.message = `Settle xong ${total} cược từ ${unsettledIds.length} trận.`;
  } catch (err) {
    state.error = err.message || String(err);
  }
  await loadData();
}
async function syncResultsOnly() {
  if (state.providerSync.isRunning) return;
  state.providerSync = { isRunning: true, startedAt: new Date().toISOString(), finishedAt: "", result: null, error: "" };
  state.message = "";
  state.error = "";
  renderApp();
  try {
    const result = await safeFetchJson("/api/sync-football-data", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${state.session.access_token}` },
      body: JSON.stringify({
        includeFixtures: false, includeOdds: false, includeRankings: false,
        includeFifaProfiles: false, includeSquads: false, includeStats: false,
        includeFifaResults: true, autoSettle: true
      })
    });
    state.providerSync = { isRunning: false, startedAt: state.providerSync.startedAt, finishedAt: new Date().toISOString(), result, error: "" };
    const espnOk = result.espnResult?.status === "success";
    const updated = (result.espnResult?.updated || 0) + (result.fifaFantasyResult?.updated || 0) + (result.fifaCalendarResult?.updated || 0);
    const savedResults = (result.espnResult?.results || 0) + (result.fifaFantasyResult?.results || 0) + (result.fifaCalendarResult?.results || 0);
    const settled = result.settledBets || 0;
    const parts = [];
    if (savedResults > 0) parts.push(`${savedResults} result rows saved`);
    if (espnOk || result.fifaFantasyResult?.status === "success" || result.fifaCalendarResult?.status === "success") parts.push(`${updated} trận cập nhật`);
    if (settled > 0) parts.push(`${settled} cược đã settle`);
    if (!parts.length) parts.push("Không có dữ liệu mới");
    state.message = `Sync kết quả xong. ${parts.join(", ")}.`;
    state.error = "";
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    state.providerSync = { isRunning: false, startedAt: state.providerSync.startedAt, finishedAt: new Date().toISOString(), result: null, error: errorMessage };
    state.error = errorMessage;
    state.message = "";
  }
  await loadData();
}

async function runProviderSyncJob(body, toastBuilder) {
  if (state.providerSync.isRunning) return;
  state.providerSync = { isRunning: true, startedAt: new Date().toISOString(), finishedAt: "", result: null, error: "" };
  state.message = "";
  state.error = "";
  renderApp();
  try {
    const result = await safeFetchJson("/api/sync-football-data", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${state.session.access_token}` },
      body: JSON.stringify(body)
    });
    state.providerSync = { isRunning: false, startedAt: state.providerSync.startedAt, finishedAt: new Date().toISOString(), result, error: "" };
    state.message = toastBuilder ? toastBuilder(result) : providerSyncToast(result);
    state.error = "";
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    state.providerSync = { isRunning: false, startedAt: state.providerSync.startedAt, finishedAt: new Date().toISOString(), result: null, error: errorMessage };
    state.error = errorMessage;
    state.message = "";
  }
  await loadData();
}

async function syncOddsOnly() {
  return runProviderSyncJob({
    includeFixtures: false,
    includeOdds: true,
    includeStats: false,
    includeRankings: false,
    includeFifaProfiles: false,
    includeSquads: false,
    includeFifaResults: false
  }, (result) => {
    const odds = result.oddsResult || {};
    return `Sync odds xong. ${providerOddsOutputCopy(odds)}`;
  });
}

async function syncFixturesAndFifaData() {
  return runProviderSyncJob({
    includeFixtures: true,
    includeOdds: false,
    includeStats: true,
    includeRankings: true,
    includeFifaProfiles: true,
    includeSquads: true,
    includeFifaResults: false
  }, providerSyncToast);
}

async function syncProviders() {
  if (state.providerSync.isRunning) return;
  state.providerSync = {
    isRunning: true,
    startedAt: new Date().toISOString(),
    finishedAt: "",
    result: null,
    error: ""
  };
  state.message = "";
  state.error = "";
  renderApp();
  try {
    const result = await safeFetchJson("/api/sync-football-data", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${state.session.access_token}`
      },
      body: JSON.stringify({ includeOdds: true, includeRankings: true, includeFifaProfiles: true, includeSquads: true })
    });
    state.providerSync = {
      ...state.providerSync,
      isRunning: false,
      finishedAt: new Date().toISOString(),
      result,
      error: ""
    };
    state.message = providerSyncToast(result);
    state.error = "";
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    state.providerSync = {
      ...state.providerSync,
      isRunning: false,
      finishedAt: new Date().toISOString(),
      result: null,
      error: errorMessage
    };
    state.error = errorMessage;
    state.message = "";
  }
  await loadData();
}

function providerSyncToast(result) {
  const fixtureStatus = result.fixtureResult?.status || "unknown";
  const footballDataStatus = result.footballDataResult?.status || "unknown";
  const statsStatus = result.statsResult?.status || "unknown";
  const rankingStatus = result.rankingResult?.status || "unknown";
  const fifaProfileStatus = result.fifaProfileResult?.status || "unknown";
  const squadStatus = result.squadResult?.status || "unknown";
  const oddsLabel = providerOddsDataStatusLabel(result.oddsResult?.dataStatus || result.oddsResult?.status || "unknown");
  const quota = providerQuotaText(result.oddsResult?.quota);
  return `Provider sync finished. API-FOOTBALL: ${fixtureStatus}; football-data.org: ${footballDataStatus}; stats: ${statsStatus}; rankings: ${rankingStatus}; FIFA profiles: ${fifaProfileStatus}; squads: ${squadStatus}; odds: ${oddsLabel}${quota ? `; ${quota}` : ""}.`;
}

async function syncTransfermarktValues(teamCode = "") {
  const maxInput = teamCode ? "1" : (prompt("Max Transfermarkt teams", "48") || "48");
  const maxTransfermarktTeams = Math.max(1, Math.min(64, Number(maxInput) || 48));
  try {
    const result = await safeFetchJson("/api/sync-football-data", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${state.session.access_token}`
      },
      body: JSON.stringify({
        includeFixtures: false,
        includeOdds: false,
        includeStats: false,
        includeRankings: false,
        includeFifaProfiles: false,
        includeSquads: false,
        includeTransfermarkt: true,
        fifaTeamCode: teamCode,
        maxTransfermarktTeams
      })
    });
    const tm = result.transfermarktResult || {};
    state.message = `Transfermarkt sync ${tm.status || "unknown"}: ${fmt.format(tm.teams || 0)} teams; ${fmt.format(tm.players || 0)} players; ${fmt.format(tm.errors || 0)} errors.`;
    state.error = tm.error || "";
  } catch (error) {
    state.error = error.message || "Transfermarkt sync failed";
    state.message = "";
  }
  await loadData();
}

async function importTransfermarktValues(event) {
  event.preventDefault();
  const raw = document.getElementById("transfermarkt-import-text").value.trim();
  if (!raw) return;
  let rows;
  try {
    rows = parseTransfermarktImport(raw);
  } catch (error) {
    state.error = error.message || String(error);
    state.message = "";
    renderApp();
    return;
  }
  const { data, error } = await state.client.rpc("admin_import_transfermarkt_values", {
    p_payload: { rows }
  });
  if (error) {
    state.error = error.message;
    state.message = "";
  } else {
    state.message = `Imported Transfermarkt values: ${fmt.format(data?.teams || 0)} teams; ${fmt.format(data?.players || 0)} players; ${fmt.format(data?.errors || 0)} errors.`;
    state.error = "";
  }
  await loadData();
}

async function refreshFifaTeam(teamCode) {
  const response = await fetch("/api/sync-football-data", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${state.session.access_token}`
    },
    body: JSON.stringify({
      includeFixtures: false,
      includeOdds: false,
      includeStats: false,
      includeRankings: false,
      includeFifaProfiles: true,
      includeSquads: true,
      fifaTeamCode: teamCode,
      maxSquadTeams: 1
    })
  });
  const result = await response.json();
  if (!response.ok) {
    state.error = result.error || "FIFA team refresh failed";
    state.message = "";
  } else {
    state.message = `FIFA refresh finished for ${teamCode}: profiles ${result.fifaProfileResult?.status || "unknown"}; squads ${result.squadResult?.players || 0} players.`;
    state.error = "";
  }
  await loadData();
}

async function refreshAllFifaTeams() {
  const response = await fetch("/api/sync-football-data", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${state.session.access_token}`
    },
    body: JSON.stringify({
      includeFixtures: false,
      includeOdds: false,
      includeStats: false,
      includeRankings: false,
      includeFifaProfiles: true,
      includeSquads: true
    })
  });
  const result = await response.json();
  if (!response.ok) {
    state.error = result.error || "FIFA all-team refresh failed";
    state.message = "";
  } else {
    const teams = result.fifaProfileResult?.matched ?? result.squadResult?.teams ?? 0;
    const players = result.squadResult?.players ?? 0;
    state.message = `FIFA refresh finished for all teams: ${fmt.format(teams)} teams; ${fmt.format(players)} players.`;
    state.error = "";
  }
  await loadData();
}

async function toggleUser(userId, isActive) {
  const { error } = await state.client.from("profiles").update({ is_active: isActive }).eq("id", userId);
  state.message = error ? "" : isActive ? "Đã mở tài khoản." : "Đã khóa tài khoản.";
  state.error = error ? error.message : "";
  await loadData();
}

async function softDeleteUser(userId) {
  const user = state.users.find((item) => item.id === userId);
  const label = user ? `${user.display_name} (@${user.username})` : userId;
  const confirmed = confirm(`Xóa mềm tài khoản ${label}? Người chơi sẽ không đăng nhập được, nhưng lịch sử cược/ví vẫn được giữ.`);
  if (!confirmed) return;
  const reason = prompt("Lý do xoá tài khoản", "Admin deleted account");
  if (!reason) return;
  const { error } = await state.client.rpc("admin_soft_delete_user", {
    p_user_id: userId,
    p_reason: reason
  });
  state.message = error ? "" : "Đã xoá mềm tài khoản. Lịch sử cược và ví vẫn được giữ.";
  state.error = error ? error.message : "";
  if (!error && state.adminPredictionUserId === userId) {
    state.adminPredictionUserId = "";
    state.adminPredictionBets = null;
  }
  await loadData();
}

async function voidBet(betId) {
  const reason = prompt("Reason for void/refund", "Admin voided bet");
  if (!reason) return;
  const { error } = await state.client.rpc("admin_void_bet", {
    p_bet_id: betId,
    p_reason: reason
  });
  state.message = error ? "" : "Bet voided and stake refunded.";
  state.error = error ? error.message : "";
  await loadData();
}

function exportLeaderboardCsv() {
  const rows = state.leaderboard.map((row) => ({
    "Hạng": row.rank,
    "Người chơi": row.display_name,
    "Username": row.username,
    "Số trận cược": row.total_bets ?? row.settled_bets,
    "Tỷ lệ đúng": row.accuracy,
    "Số tiền cược": row.total_staked,
    "Số tiền hiện tại": row.wallet_balance,
    "Lãi/Lỗ": row.profit_loss ?? row.score,
    "% Lãi/Lỗ": row.profit_loss_pct ?? row.roi
  }));
  downloadCsv("worldcup-rankings.csv", rows);
}

function exportBetsCsv() {
  const rows = state.adminBets.map((bet) => ({
    placed_at: bet.placed_at,
    username: bet.user?.username || "",
    display_name: bet.user?.display_name || "",
    match: bet.match ? `${bet.match.home_team.name} vs ${bet.match.away_team.name}` : "",
    market_key: bet.market_key,
    market_type: betMarketTitle(bet),
    selection: bet.selection_label,
    actual_result: betActualText(bet),
    outcome: betOutcome(bet).label,
    stake: bet.stake,
    locked_multiplier: bet.locked_multiplier,
    potential_payout: bet.potential_payout,
    received: betReceivedAmount(bet),
    status: bet.status,
    points_delta: bet.points_delta,
    prediction_bonus: bet.prediction_bonus,
    leaderboard_points: number(bet.points_delta) + number(bet.prediction_bonus),
    settled_at: bet.settled_at || ""
  }));
  downloadCsv("worldcup-bets.csv", rows);
}

function exportLedgerCsv() {
  const rows = state.walletLedger.map((entry) => ({
    created_at: entry.created_at,
    username: entry.user?.username || "",
    display_name: entry.user?.display_name || "",
    actor: entry.actor?.username || "",
    kind: entry.kind,
    amount: entry.amount,
    reason: entry.reason,
    balance_after: entry.balance_after
  }));
  downloadCsv("worldcup-wallet-ledger.csv", rows);
}

function exportAuditCsv() {
  const rows = state.auditLogs.map((entry) => ({
    created_at: entry.created_at,
    actor: entry.actor?.username || "",
    action: entry.action,
    entity_type: entry.entity_type,
    entity_id: entry.entity_id || "",
    details_json: compactJson(entry.details_json)
  }));
  downloadCsv("worldcup-audit-log.csv", rows);
}

function exportReportsCsv() {
  const userRows = state.userReport.map((row) => ({
    report_type: "user",
    key: row.username,
    label: row.display_name,
    total_bets: row.total_bets,
    open_bets: row.open_bets,
    settled_bets: row.settled_bets,
    won_bets: row.won_bets,
    correct_score_count: row.correct_score_count,
    total_staked: row.total_staked,
    net_points: row.net_points,
    bonus_points: row.bonus_points,
    score: row.score,
    accuracy: row.accuracy,
    roi: row.roi
  }));
  const marketRows = state.marketReport.map((row) => ({
    report_type: "market",
    key: row.market_key,
    label: row.market_key,
    total_bets: row.total_bets,
    open_bets: row.open_bets,
    settled_bets: row.settled_bets,
    won_bets: row.won_bets,
    correct_score_count: "",
    total_staked: row.total_staked,
    net_points: row.net_points,
    bonus_points: row.bonus_points,
    score: row.score,
    accuracy: row.accuracy,
    roi: row.roi
  }));
  downloadCsv("worldcup-admin-reports.csv", [...userRows, ...marketRows]);
}

function exportResultsCsv() {
  const rows = state.matchResults.map((row) => {
    const home = row.home_team || row.match?.home_team || {};
    const away = row.away_team || row.match?.away_team || {};
    return {
      match_id: row.match_id,
      finished_at: row.finished_at || "",
      synced_at: row.synced_at || "",
      status: row.status,
      home_code: home.code || "",
      home_team: home.name || "",
      home_score: row.home_score,
      away_score: row.away_score,
      away_code: away.code || "",
      away_team: away.name || "",
      home_penalties: row.home_penalties ?? "",
      away_penalties: row.away_penalties ?? "",
      provider: row.provider,
      source: row.source
    };
  });
  downloadCsv("worldcup-match-results.csv", rows);
}

function exportOddsReportCsv() {
  const rows = oddsTrackingMatches().flatMap((row) => row.trackedMarkets.map((market) => ({
    match_id: row.match.id,
    kickoff: row.match.starts_at,
    match: `${row.match.home_team.name} vs ${row.match.away_team.name}`,
    home_code: row.match.home_team.code,
    away_code: row.match.away_team.code,
    market_key: market.market_key,
    selection_key: market.selection_key,
    selection_label: market.selection_label,
    line: market.line ?? "",
    odds_multiplier: market.odds_multiplier,
    source: market.source,
    bookmaker: market.extra.bookmaker || "",
    bookmaker_key: market.extra.bookmaker_key || "",
    selection_mode: market.extra.selection_mode || "",
    provider_updated_at: oddsMarketUpdatedAt(market),
    is_open: market.is_open
  })));
  downloadCsv("worldcup-odds-tracking.csv", rows);
}

function parseTransfermarktImport(raw) {
  const text = String(raw || "").trim();
  if (!text) return [];
  if (text.startsWith("{") || text.startsWith("[")) {
    const payload = JSON.parse(text);
    let rows;
    if (Array.isArray(payload)) {
      rows = payload;
    } else if (Array.isArray(payload.rows)) {
      rows = payload.rows;
    } else if (Array.isArray(payload.teams) || Array.isArray(payload.players)) {
      rows = [...(payload.teams || []), ...(payload.players || [])];
    } else {
      rows = [payload];
    }
    return rows.map(normalizeTransfermarktImportRow);
  }
  return parseCsvRows(text).map(normalizeTransfermarktImportRow);
}

function parseCsvRows(text) {
  const lines = String(text || "").split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0]).map((header) => header.trim());
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

function normalizeTransfermarktImportRow(row) {
  const next = { ...row };
  normalizeMarketValueFields(next, "team_market_value_eur", "team_market_value_label");
  normalizeMarketValueFields(next, "squad_market_value_eur", "squad_market_value_label");
  normalizeMarketValueFields(next, "market_value_eur", "market_value_label");
  normalizeMarketValueFields(next, "player_market_value_eur", "player_market_value_label");
  return next;
}

function normalizeMarketValueFields(row, valueKey, labelKey) {
  const raw = row[valueKey];
  if (raw === undefined || raw === null || raw === "") return;
  const text = String(raw).trim();
  const parsed = marketValueLabelToEur(text);
  if (parsed && !/^[0-9]+(\.[0-9]+)?$/.test(text)) {
    row[labelKey] ||= text;
    row[valueKey] = parsed;
  }
}

function marketValueLabelToEur(label) {
  const text = String(label || "").replace(/\s+/g, "").trim();
  const match = text.match(/(?:€|EUR)?([0-9]+(?:[.,][0-9]+)?)(bn|m|k)?/i);
  if (!match) return null;
  const amount = Number(match[1].replace(",", "."));
  if (!Number.isFinite(amount)) return null;
  const suffix = String(match[2] || "").toLowerCase();
  const multiplier = suffix === "bn" ? 1000000000 : suffix === "m" ? 1000000 : suffix === "k" ? 1000 : 1;
  return Number((amount * multiplier).toFixed(2));
}

function selectedMatch() {
  return state.matches.find((match) => match.id === state.selectedMatchId) || state.matches[0];
}

function teamByCode(code) {
  return state.teams.find((team) => team.code === code);
}

function renderLeaderRow(row) {
  return `
    <div class="leader-row">
      <span>#${row.rank}</span>
      <div class="avatar small">${initials(row.display_name)}</div>
      <div><strong>${escapeHtml(row.display_name)}</strong><small>${fmtOne.format(number(row.accuracy))}% đúng · ${fmt.format(number(row.total_bets ?? row.settled_bets))} cược</small></div>
      <b>${money(row.wallet_balance)}</b>
    </div>
  `;
}

function teamFlagContent(team) {
  const code = team?.code;
  const imageUrl = team?.flag_url || team?.logo_url || flagImages[code];
  if (imageUrl) {
    return `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(team?.name || code || "Team")} flag" loading="lazy">`;
  }
  if (flagImages[code]) {
    return `<img src="${escapeHtml(flagImages[code])}" alt="${escapeHtml(team?.name || code)} flag" loading="lazy">`;
  }
  return flags[code] || "🏆";
}

function homeAwayBadge(side = "") {
  if (side !== "home" && side !== "away") return "";
  return `<span class="home-away-badge ${side}">${side === "home" ? "Home" : "Away"}</span>`;
}

function teamLockup(team, large = false, side = "") {
  const rating = teamRatingLabel(team);
  return `
    <div class="team-lockup">
      <div class="flag-orb ${large ? "large" : ""}">${teamFlagContent(team)}</div>
      <strong>${escapeHtml(team?.name || "TBA")}</strong>
      ${homeAwayBadge(side)}
      <small>${escapeHtml(team?.code || "TBA")}${large ? ` · ${escapeHtml(rating)}` : ""}</small>
    </div>
  `;
}

function teamRatingLabel(team) {
  if (!team) return "Rating TBA";
  if (team.fifa_rank) {
    return `FIFA #${fmt.format(number(team.fifa_rank))}${team.fifa_points ? ` · ${fmtOne.format(number(team.fifa_points))} pts` : ""}`;
  }
  return team.rating_source ? `${team.rating_source} pending` : "Rating TBA";
}

function scoreStepper(id, label, value) {
  return `
    <div class="score-stepper">
      <span>${escapeHtml(label)}</span>
      <div class="stepper-control">
        <button type="button" data-dec="${id}">-</button>
        <input id="${id}" class="score-stepper-input" type="number" min="0" step="1" inputmode="numeric" value="${value}" aria-label="${escapeHtml(label)}">
        <button type="button" data-inc="${id}">+</button>
      </div>
    </div>
  `;
}

function toDateTimeLocal(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offsetMs = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function dateInputToIsoStart(value) {
  return new Date(`${value}T00:00:00`).toISOString();
}

function dateInputToIsoEnd(value) {
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() + 1);
  return date.toISOString();
}

document.addEventListener("click", (event) => {
  const dec = event.target.closest("[data-dec]");
  const inc = event.target.closest("[data-inc]");
  if (!dec && !inc) return;
  const id = (dec || inc).dataset.dec || (dec || inc).dataset.inc;
  const input = document.getElementById(id);
  if (!input) return;
  const next = Math.max(0, Number(input.value || 0) + (inc ? 1 : -1));
  input.value = String(next);
  if (id === "modal-score-home" || id === "modal-score-away") {
    updateModalDerivedValues();
  }
});

document.addEventListener("input", (event) => {
  const input = event.target.closest(".score-stepper-input");
  if (!input) return;
  const next = Math.max(0, Math.trunc(Number(input.value || 0)));
  input.value = String(next);
  if (input.id === "modal-score-home" || input.id === "modal-score-away") {
    updateModalDerivedValues();
  }
});

function downloadCsv(filename, rows) {
  if (!rows.length) {
    state.message = "Không có dữ liệu để export.";
    state.error = "";
    renderApp();
    return;
  }
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(","))
  ].join("\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function compactJson(value) {
  if (!value || typeof value !== "object") return String(value ?? "");
  return JSON.stringify(value);
}

function metric(label, value) {
  return `<div class="glass-card metric"><span>${escapeHtml(label)}</span><strong>${escapeHtml(String(value))}</strong></div>`;
}

function money(value) {
  return moneyFmt.format(number(value));
}

function stakeWalletShare(stake, wallet = state.profile?.wallet_balance) {
  const walletValue = number(wallet);
  const stakeValue = number(stake);
  if (walletValue <= 0) return "0% ví hiện có";
  return `${((stakeValue / walletValue) * 100).toFixed(1)}% ví hiện có`;
}

function stakeWalletShareClass(stake, wallet = state.profile?.wallet_balance) {
  const walletValue = number(wallet);
  const stakeValue = number(stake);
  return stakeValue > walletValue ? "over" : "";
}

function renderStakeWalletShare(stake, options = {}) {
  const id = options.forId ? ` data-stake-share-for="${escapeHtml(options.forId)}"` : "";
  const marketKey = options.marketKey ? ` data-stake-wallet-share="${escapeHtml(options.marketKey)}"` : "";
  return `<small class="stake-wallet-share ${stakeWalletShareClass(stake)}"${id}${marketKey}>${escapeHtml(stakeWalletShare(stake))}</small>`;
}

function updateStakeShareForInput(input) {
  if (!input?.id) return;
  const node = document.querySelector(`[data-stake-share-for="${input.id}"]`);
  if (!node) return;
  const stake = parseStakeInput(input.value);
  node.textContent = stakeWalletShare(stake);
  node.classList.toggle("over", stakeWalletShareClass(stake) === "over");
}

function parseStakeInput(value) {
  const cleaned = String(value || "").replace(/[^\d]/g, "");
  const numeric = Number(cleaned);
  return Number.isFinite(numeric) ? numeric : 0;
}

function formatStakeInput(value) {
  const numeric = Math.max(0, Math.trunc(parseStakeInput(value)));
  return numeric ? stakeFmt.format(numeric) : "";
}

function number(value) {
  return Number(String(value ?? 0).replace(/,/g, "")) || 0;
}

function dateText(value) {
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function vnDateKey(value) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date(value));
}

function dateHeadingText(dateKey) {
  const [year, month, day] = String(dateKey).split("-").map(Number);
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "UTC",
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function timeText(value) {
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function dateOnlyText(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    month: "short",
    day: "2-digit",
    year: "numeric"
  }).format(new Date(`${value}T00:00:00Z`));
}

function initials(name) {
  return String(name || "?")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function throwIfError(error) {
  if (error) {
    throw error;
  }
}

async function safeFetchJson(path, options = {}) {
  const response = await fetch(path, options);
  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error(`Request failed: ${response.status}`);
  }
  if (!response.ok) {
    throw new Error(payload?.error || payload?.message || `Request failed: ${response.status}`);
  }
  return payload;
}
