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
  outrightMarkets: [],
  bets: [],
  leaderboard: [],
  users: [],
  report: null,
  syncRuns: [],
  adminBets: [],
  walletLedger: [],
  auditLogs: [],
  userReport: [],
  marketReport: [],
  deploymentHealth: null,
  adminFilters: {
    userId: "",
    dateFrom: "",
    dateTo: ""
  },
  active: "matches",
  selectedMatchId: null,
  selectedTeamId: null,
  selectedRoleGroup: "",
  betModalMatchId: null,
  betModalMarketGroup: "basic",
  goldenBootSearch: "",
  winnerSearch: "",
  lastPredictionBetId: null,
  isSubmittingBet: false,
  predictionStatsTab: "upcoming",
  matchFilter: "upcoming",
  matchSearch: "",
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
  ["groups", "Groups"],
  ["detail", "Dự đoán"],
  ["bracket", "Bracket"],
  ["leaderboard", "Bảng xếp hạng"],
  ["predictionStats", "Thống kê dự đoán"],
  ["guide", "Hướng dẫn"]
];

const fmt = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 });
const fmtOne = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 });

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

function renderConfigScreen() {
  app.innerHTML = `
    <main class="login-screen">
      <section class="login-card glass-card">
        <div class="brand-mark">WC</div>
        <h1>WorldCup Predict</h1>
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
  app.innerHTML = `
    <main class="login-screen">
      <section class="login-card glass-card">
        <div class="brand-mark">WC</div>
        <h1>WorldCup Predict</h1>
        <p>Private play-points league cho World Cup 2026.</p>
        ${state.error ? `<p class="error">${escapeHtml(state.error)}</p>` : ""}
        <form class="form-grid" id="login-form">
          <label>Tài khoản<input id="login-username" value="demo" autocomplete="username"></label>
          <label>Mật khẩu<input id="login-password" type="password" value="demo123" autocomplete="current-password"></label>
          <button class="primary-button wide">Đăng nhập</button>
        </form>
        <div class="demo-row">
          <span>player do admin cấp</span>
          <span>admin / password bạn tạo</span>
        </div>
      </section>
    </main>
  `;
  document.getElementById("login-form").addEventListener("submit", login);
}

async function login(event) {
  event.preventDefault();
  state.error = "";
  const raw = document.getElementById("login-username").value.trim().toLowerCase();
  const password = document.getElementById("login-password").value;
  const email = raw.includes("@") ? raw : `${raw}@worldcup.local`;
  const { data, error } = await state.client.auth.signInWithPassword({ email, password });
  if (error) {
    state.error = error.message;
    renderLogin();
    return;
  }
  state.session = data.session;
  await loadData();
}

async function loadData() {
  state.error = "";
  try {
    const profileResult = await state.client.from("profiles").select("*").eq("id", state.session.user.id).single();
    throwIfError(profileResult.error);
    state.profile = profileResult.data;

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

    const bracketResult = await state.client
      .from("bracket_matches")
      .select("*,home_team:teams!bracket_matches_home_team_id_fkey(*),away_team:teams!bracket_matches_away_team_id_fkey(*),match:matches!bracket_matches_match_id_fkey(*,home_team:teams!matches_home_team_id_fkey(*),away_team:teams!matches_away_team_id_fkey(*))")
      .order("display_order", { ascending: true });
    state.bracketMatches = bracketResult.error ? [] : bracketResult.data || [];

    let outrightQuery = state.client
      .from("outright_markets")
      .select("*")
      .order("odds_multiplier", { ascending: true });
    if (state.profile?.role !== "admin") {
      outrightQuery = outrightQuery.eq("is_open", true);
    }
    const outrightResult = await outrightQuery;
    throwIfError(outrightResult.error);
    state.outrightMarkets = outrightResult.data || [];

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

      const reportResult = await state.client.from("admin_report").select("*").single();
      throwIfError(reportResult.error);
      state.report = reportResult.data;

      const syncResult = await state.client.from("sync_runs").select("*").order("started_at", { ascending: false }).limit(10);
      throwIfError(syncResult.error);
      state.syncRuns = syncResult.data || [];

      let adminBetsQuery = state.client
        .from("bets")
        .select("*,user:profiles!bets_user_id_fkey(username,display_name),match:matches(*,home_team:teams!matches_home_team_id_fkey(*),away_team:teams!matches_away_team_id_fkey(*))")
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
  const reminders = getBetReminders();
  app.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar">
        <div><div class="brand">WorldCup Predict</div><small>Group Stage Live</small></div>
        <nav class="nav-stack">
          ${items.map(([key, label]) => `<button class="nav-button ${state.active === key ? "active" : ""}" data-tab="${key}">${label}</button>`).join("")}
        </nav>
        <button class="primary-button wide" data-tab="detail">Dự đoán</button>
        <button class="ghost-button" id="logout-button">Logout</button>
      </aside>
      <main class="workspace">
        <header class="topbar">
          <div class="brand">WorldCup Predict</div>
          <div class="top-actions">
            ${reminders.length ? `<button class="reminder-chip" data-reminder-focus>Alerts ${fmt.format(reminders.length)}</button>` : ""}
            <div class="wallet-chip">${fmt.format(number(state.profile.wallet_balance))} pts</div>
            <div class="avatar">${initials(state.profile.display_name)}</div>
          </div>
        </header>
        <section class="page">
          ${state.message ? `<div class="toast success">${escapeHtml(state.message)}</div>` : ""}
          ${state.error ? `<div class="toast error">${escapeHtml(state.error)}</div>` : ""}
          ${renderActiveView()}
        </section>
      </main>
      <nav class="mobile-nav">
        ${items.map(([key, label]) => `<button class="${state.active === key ? "active" : ""}" data-tab="${key}">${label}</button>`).join("")}
      </nav>
    </div>
  `;
  bindShellEvents();
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
  const reminders = getBetReminders();
  const filteredMatches = filteredScheduleMatches();
  const featured = filteredMatches.find((match) => match.status === "SCHEDULED") || filteredMatches[0] || state.matches.find((match) => match.status === "SCHEDULED") || state.matches[0];
  if (!featured) {
    return `<section class="glass-card panel"><h2>Chưa có lịch đấu</h2><p>Hãy chạy Supabase seed.</p></section>`;
  }
  const visibleMatches = filteredMatches.filter((match) => match.id !== featured.id);
  const summaryMatches = visibleMatches.slice(0, 6);
  const odd = featured.match_markets.find((market) => market.market_key === "correct_score")?.odds_multiplier || 6.00;
  return `
    <div class="dashboard-grid">
      <div class="stack">
        ${renderReminderPanel(reminders)}
        ${renderScheduleFilters()}
        <section class="hero stadium-surface">
          <span class="kicker">Trận đấu tâm điểm</span>
          <div class="hero-versus">
            ${teamLockup(featured.home_team, true)}
            <span class="vs-text">VS</span>
            ${teamLockup(featured.away_team, true)}
          </div>
          <div class="hero-meta">
            <span>${dateText(featured.starts_at)}</span>
            <span>${escapeHtml(featured.stage)}</span>
            <span>${escapeHtml(matchLocation(featured))}</span>
            <span>x${fmtOne.format(number(odd))} pts</span>
          </div>
          <p><button class="primary-button" data-open-bet-modal="${featured.id}">Dự đoán ngay</button></p>
        </section>
        <div class="section-heading"><h2>Lịch thi đấu</h2><span>${fmt.format(filteredMatches.length)} trận</span></div>
        ${renderFixtureTable(filteredMatches)}
        <div class="section-heading"><h2>Trận nổi bật tiếp theo</h2><span>${fmt.format(summaryMatches.length)} trận</span></div>
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

function renderFixtureTable(matches) {
  return `
    <section class="fixture-table glass-card">
      <div class="section-heading">
        <h2>Tất cả cặp trận</h2>
        <span>${fmt.format(matches.length)} trận để dự đoán</span>
      </div>
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

function renderFixtureRow(match) {
  const openMarkets = (match.match_markets || []).filter((market) => market.is_open).length;
  const group = match.group_name ? formatGroupName(match.group_name) : "Knockout";
  return `
    <article class="fixture-row" data-group="${escapeHtml(match.group_name || "knockout")}">
      <span class="fixture-number">#${escapeHtml(fixtureNumber(match))}</span>
      <time>${dateText(match.starts_at)}</time>
      <div class="fixture-pair">
        ${fixtureTeam(match.home_team)}
        <b>VS</b>
        ${fixtureTeam(match.away_team)}
      </div>
      <div class="fixture-meta">
        <strong><span class="group-badge">${escapeHtml(group)}</span></strong>
        <small>${escapeHtml(matchLocation(match))}</small>
      </div>
      <span class="fixture-market-count">${fmt.format(openMarkets)} open</span>
      <button class="compact-button primary-button" data-open-bet-modal="${match.id}">Dự đoán</button>
    </article>
  `;
}

function fixtureTeam(team) {
  return `
    <span class="fixture-team">
      <span class="fixture-flag">${teamFlagContent(team)}</span>
      <span>${escapeHtml(team?.name || "TBA")}</span>
      <small>${escapeHtml(team?.code || "TBA")}</small>
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
  const openMarkets = match.match_markets.filter((market) => market.is_open).length;
  return `
    <article class="match-card glass-card">
      <div class="section-heading"><span>${dateText(match.starts_at)}</span><span>${escapeHtml(match.status)}</span></div>
      <div class="match-teams">${teamLockup(match.home_team)}<span class="muted">VS</span>${teamLockup(match.away_team)}</div>
      <div class="match-meta-grid">
        <span>${escapeHtml(scheduleLabel(match))}</span>
        <span>${escapeHtml(matchLocation(match))}</span>
        <span>${fmt.format(openMarkets)} markets open</span>
        <span>x${fmtOne.format(number(odd))}</span>
      </div>
      <div class="consensus"><div style="width:58%"></div></div>
      <p><button class="ghost-button wide" data-open-bet-modal="${match.id}">Dự đoán ngay</button></p>
    </article>
  `;
}

function renderScheduleFilters() {
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
      <label class="search-field">
        Search
        <input id="match-search" value="${escapeHtml(state.matchSearch)}" placeholder="Group A, Mexico, match 1...">
      </label>
      <div class="filter-scroll">
        ${filters.map(([key, label]) => `<button class="filter-pill ${state.matchFilter === key ? "active" : ""}" data-match-filter="${escapeHtml(key)}">${escapeHtml(label)}</button>`).join("")}
      </div>
    </section>
  `;
}

function filteredScheduleMatches() {
  const now = new Date();
  const todayKey = localDateKey(now);
  const search = state.matchSearch.trim().toLowerCase();
  return state.matches.filter((match) => {
    let matchesFilter = false;
    if (state.matchFilter === "all") matchesFilter = true;
    else if (state.matchFilter === "today") matchesFilter = localDateKey(new Date(match.starts_at)) === todayKey;
    else if (state.matchFilter === "knockout") matchesFilter = isKnockoutMatch(match);
    else if (state.matchFilter?.startsWith("group:")) matchesFilter = match.group_name === state.matchFilter.slice(6);
    else matchesFilter = new Date(match.starts_at).getTime() >= now.getTime() && match.status === "SCHEDULED";
    if (!matchesFilter) return false;
    if (!search) return true;
    const haystack = [
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
    ].join(" ").toLowerCase();
    return haystack.includes(search);
  });
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
          <h1>Group Standings</h1>
          <p>Tables are calculated from settled group-stage match results.</p>
        </div>
        <span>${fmt.format(groups.length)} groups</span>
      </div>
      <section class="groups-grid">
        ${groups.map(renderGroupCard).join("") || `<section class="glass-card panel"><h2>No groups</h2><p>Run supabase/seed.sql.</p></section>`}
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
  return `
    <article class="group-card glass-card">
      <div class="group-card-top">
        <div>
          <h2>${escapeHtml(formatGroupName(groupName))}</h2>
          <small>${fmt.format(rows.length)} teams</small>
        </div>
        <span class="group-badge">${escapeHtml(formatGroupName(groupName))}</span>
      </div>
      <div class="standings-table">
        <div class="standings-row standings-head">
          <span>#</span><span>Team</span><span>P</span><span>W</span><span>D</span><span>L</span><span>GD</span><span>Pts</span><span></span>
        </div>
        ${rows.map(renderStandingRow).join("")}
      </div>
    </article>
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
      <button class="ghost-button compact-button" data-team-roster="${row.team.id}">Players</button>
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

function upcomingGroupMatchesByGroup() {
  const groups = new Map();
  state.matches
    .filter((match) => match.group_name && canPredictMatch(match))
    .sort((left, right) => {
      const groupCompare = String(left.group_name).localeCompare(String(right.group_name), "en", { numeric: true });
      if (groupCompare) return groupCompare;
      return new Date(left.starts_at).getTime() - new Date(right.starts_at).getTime();
    })
    .forEach((match) => {
      const key = match.group_name || "Knockout";
      groups.set(key, [...(groups.get(key) || []), match]);
    });
  return [...groups.entries()];
}

function renderMatchValueForecast(match) {
  const forecast = matchValueForecast(match);
  const homePct = forecast?.homePct ?? 50;
  const awayPct = forecast?.awayPct ?? 50;
  const leader = homePct === awayPct ? "even" : homePct > awayPct ? "home" : "away";
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
        ${renderForecastTeamPanel(match.home_team, homePct)}
        ${renderForecastTeamPanel(match.away_team, awayPct)}
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
      ${renderUpcomingGroupMatches()}
    </section>
  `;
}

function renderForecastTeamPanel(team, pct) {
  return `
    <article class="forecast-team-panel">
      <div class="forecast-team-title">
        <span class="fixture-flag">${teamFlagContent(team)}</span>
        <h3>${escapeHtml(team?.name || "TBA")}</h3>
      </div>
      <p>${escapeHtml(teamRankingText(team))}</p>
      <p>Giá trị đội hình: <strong>${escapeHtml(eurValueText(team?.squad_market_value_eur, team?.squad_market_value_label))}</strong></p>
      <p>Tỷ lệ thắng: <strong>${fmt.format(pct)}%</strong></p>
    </article>
  `;
}

function renderUpcomingGroupMatches() {
  const groups = upcomingGroupMatchesByGroup();
  return `
    <section class="upcoming-groups-panel">
      <div class="section-heading">
        <h2>Sắp diễn ra</h2>
        <span>${fmt.format(groups.reduce((sum, [, matches]) => sum + matches.length, 0))} trận</span>
      </div>
      <div class="upcoming-groups-grid">
        ${groups.map(([groupName, matches]) => renderUpcomingGroupBlock(groupName, matches)).join("") || `<p class="empty-copy">Chưa có trận vòng bảng đang mở dự đoán.</p>`}
      </div>
    </section>
  `;
}

function renderUpcomingGroupBlock(groupName, matches) {
  return `
    <article class="upcoming-group-block">
      <div class="upcoming-group-title">
        <span class="group-badge">${escapeHtml(formatGroupName(groupName))}</span>
        <small>${fmt.format(matches.length)} trận</small>
      </div>
      <div class="upcoming-match-list">
        ${matches.map(renderUpcomingGroupMatch).join("")}
      </div>
    </article>
  `;
}

function renderUpcomingGroupMatch(match) {
  const selected = Number(match.id) === Number(state.selectedMatchId);
  const openMarkets = (match.match_markets || []).filter((market) => market.is_open).length;
  return `
    <button class="upcoming-group-match ${selected ? "selected" : ""}" type="button" data-open-bet-modal="${match.id}">
      <span>
        <strong>${escapeHtml(match.home_team?.code || "TBA")} vs ${escapeHtml(match.away_team?.code || "TBA")}</strong>
        <small>${escapeHtml(match.home_team?.name || "TBA")} - ${escapeHtml(match.away_team?.name || "TBA")}</small>
      </span>
      <span>
        <time>${dateText(match.starts_at)}</time>
        <small>${fmt.format(openMarkets)} kèo</small>
      </span>
    </button>
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
  const matches = filteredScheduleMatches()
    .filter((match) => canPredictMatch(match))
    .sort((left, right) => new Date(left.starts_at).getTime() - new Date(right.starts_at).getTime());
  return `
    <div class="stack prediction-schedule-page">
      <div class="section-heading">
        <div>
          <h1>Dự đoán</h1>
          <p>Chọn trận theo ngày, giờ và bảng; cửa sổ cược sẽ mở ngay trên lịch.</p>
        </div>
        <span>${fmt.format(matches.length)} trận mở cược</span>
      </div>
      ${renderScheduleFilters()}
      ${matches.length ? renderMatchValueForecast(state.matches.find((match) => match.id === state.selectedMatchId) || matches[0]) : ""}
      ${renderPredictionSchedule(matches)}
      ${state.betModalMatchId ? renderBetModal() : ""}
    </div>
  `;
}

function renderPredictionSchedule(matches) {
  const groups = groupMatchesByVnDate(matches);
  return `
    <section class="glass-card prediction-schedule">
      <div class="section-heading">
        <h2>Lịch cược</h2>
        <span>Asia/Ho_Chi_Minh</span>
      </div>
      ${groups.map(([dateKey, dayMatches]) => renderPredictionDayGroup(dateKey, dayMatches)).join("") || `<p class="empty-copy">Không có trận đang mở cược trong bộ lọc này.</p>`}
    </section>
  `;
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
  const openMarkets = (match.match_markets || []).filter((market) => market.is_open).length;
  return `
    <button class="prediction-match-row" type="button" data-open-bet-modal="${match.id}">
      <time>${timeText(match.starts_at)}</time>
      <span class="group-badge">${escapeHtml(match.group_name ? formatGroupName(match.group_name) : "Knockout")}</span>
      <span class="prediction-pair">
        <strong>${escapeHtml(match.home_team?.name || "TBA")}</strong>
        <b>VS</b>
        <strong>${escapeHtml(match.away_team?.name || "TBA")}</strong>
      </span>
      <span>${escapeHtml(matchLocation(match))}</span>
      <span>${fmt.format(openMarkets)} kèo</span>
    </button>
  `;
}

function renderBetModal() {
  const match = state.matches.find((item) => item.id === state.betModalMatchId) || selectedMatch();
  if (!match) return "";
  const allOpenMarkets = (match.match_markets || []).filter((market) => market.is_open);
  const basicMarkets = allOpenMarkets.filter((market) => isBasicMarket(market.market_key));
  const advancedMarkets = allOpenMarkets.filter((market) => !isBasicMarket(market.market_key));
  const activeMarkets = state.betModalMarketGroup === "advanced" ? advancedMarkets : basicMarkets;
  const scoreMarket = basicMarkets.find((market) => market.market_key === "correct_score");
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
        <div class="bet-modal-toolbar">
          <label>Điểm cược<input id="bet-modal-stake" type="number" min="10" step="10" value="100"></label>
          <div class="segmented-control">
            <button type="button" class="${state.betModalMarketGroup === "basic" ? "active" : ""}" data-bet-modal-tab="basic">Cơ bản</button>
            <button type="button" class="${state.betModalMarketGroup === "advanced" ? "active" : ""}" data-bet-modal-tab="advanced">Nâng cao</button>
          </div>
        </div>
        <div class="modal-market-stack">
          ${state.betModalMarketGroup === "basic" && scoreMarket ? renderModalScoreMarket(match, scoreMarket) : ""}
          ${renderModalMarketSections(activeMarkets.filter((market) => market.market_key !== "correct_score"))}
        </div>
      </section>
    </div>
  `;
}

function renderModalScoreMarket(match, market) {
  return `
    <form class="modal-market-card" id="modal-score-bet-form">
      <div class="section-heading">
        <h3>Dự đoán tỷ số</h3>
        <span>x${fmtOne.format(number(market.odds_multiplier))}</span>
      </div>
      <div class="score-picker compact">
        ${scoreStepper("modal-home-score", match.home_team.name, 1)}
        <span class="vs-text">-</span>
        ${scoreStepper("modal-away-score", match.away_team.name, 0)}
      </div>
      <button class="primary-button wide" ${state.isSubmittingBet ? "disabled" : ""}>Đặt tỷ số chính xác</button>
    </form>
  `;
}

function renderModalMatchForecast(match) {
  const forecast = matchValueForecast(match);
  const homePct = forecast?.homePct ?? 50;
  const awayPct = forecast?.awayPct ?? 50;
  const leader = homePct === awayPct ? "even" : homePct > awayPct ? "home" : "away";
  return `
    <section class="modal-forecast value-forecast ${leader}-lean">
      <div class="forecast-heading">
        <div>
          <h3>Đánh giá trận đấu</h3>
          <p>${forecast ? "Dựa trên FIFA rank, điểm rating và giá trị đội hình." : "Chưa đủ dữ liệu, tạm cân bằng 50/50."}</p>
        </div>
      </div>
      <div class="forecast-team-grid">
        ${renderForecastTeamPanel(match.home_team, homePct)}
        ${renderForecastTeamPanel(match.away_team, awayPct)}
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

function renderModalMarketSections(markets) {
  if (!markets.length) return `<p class="empty-copy">Chưa có kèo trong nhóm này.</p>`;
  const groups = new Map();
  markets.forEach((market) => {
    groups.set(market.label, [...(groups.get(market.label) || []), market]);
  });
  return [...groups.entries()].map(([label, items]) => `
    <section class="modal-market-card">
      <div class="section-heading"><h3>${escapeHtml(label)}</h3><span>${fmt.format(items.length)} lựa chọn</span></div>
      <div class="market-grid compact">
        ${items.map(renderModalMarketButton).join("")}
      </div>
    </section>
  `).join("");
}

function renderModalMarketButton(market) {
  return `
    <button class="market-button" data-modal-market="${market.id}" ${state.isSubmittingBet ? "disabled" : ""}>
      <strong>${escapeHtml(market.selection_label)}</strong>
      <small>x${fmtOne.format(number(market.odds_multiplier))} · ${escapeHtml(oddsFreshnessLabel(market))}</small>
    </button>
  `;
}

function isBasicMarket(key) {
  return ["match_result", "draw_no_bet", "correct_score"].includes(key);
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
  const query = state[searchKey].trim().toLowerCase();
  const filtered = markets.filter((market) => outrightSearchText(market).includes(query)).slice(0, 80);
  const emptyCopy = isGoldenBoot
    ? "Chưa có danh sách cầu thủ. Admin cần sync/import team_players trước."
    : "Chưa có kèo vô địch.";

  if (!markets.length) return `<p class="empty-copy">${emptyCopy}</p>`;

  return `
    <form class="outright-search-card" id="${formId}" data-outright-key="${marketKey}">
      <label class="search-field">
        Search
        <input id="${inputId}" value="${escapeHtml(state[searchKey])}" placeholder="${isGoldenBoot ? "Tên cầu thủ, đội, CLB..." : "Tên đội, mã đội..."}">
      </label>
      <label>
        ${isGoldenBoot ? "Cầu thủ" : "Đội tuyển"}
        <select id="${selectId}" required>
          ${filtered.map((market) => `<option value="${market.id}">${escapeHtml(outrightOptionLabel(market, isGoldenBoot))}</option>`).join("")}
        </select>
      </label>
      <label>
        Điểm cược
        <input id="${stakeId}" type="number" min="10" step="10" value="100">
      </label>
      <button class="primary-button wide" ${filtered.length ? "" : "disabled"}>${isGoldenBoot ? "Đặt Vua phá lưới" : "Đặt vô địch"}</button>
    </form>
  `;
}

function openOutrightMarkets(marketKey) {
  const markets = state.outrightMarkets.filter((market) => market.market_key === marketKey && market.is_open);
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
          <h1>Knockout Bracket</h1>
          <p>FIFA World Cup 2026 match 73-104. Group-stage fixtures stay in Matches.</p>
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
  return `
    <div class="stack">
      <div class="section-heading"><div><h1>Bảng xếp hạng</h1><p>Thống kê theo cược đã đặt, ví hiện tại và lãi/lỗ đã settle.</p></div></div>
      <section class="podium">
        ${state.leaderboard.slice(0, 3).map((row) => `
          <article class="podium-card">
            <div class="avatar">${initials(row.display_name)}</div>
            <span>#${row.rank}</span>
            <h2>${escapeHtml(row.display_name)}</h2>
            <strong class="score-value">${fmt.format(number(row.wallet_balance))} pts</strong>
            <small>${fmt.format(number(row.total_bets))} cược · ${fmtOne.format(number(row.accuracy))}% đúng</small>
          </article>
        `).join("")}
      </section>
      <section class="glass-card table-card">
        <div class="table-row table-head leaderboard-row">
          <span>Hạng</span><span>Người chơi</span><span>Số trận cược</span><span>Tỷ lệ đúng</span><span>Số tiền cược</span><span>Số tiền hiện tại</span><span>Lãi/Lỗ</span><span>% Lãi/Lỗ</span>
        </div>
        ${state.leaderboard.map((row) => `
          <div class="table-row leaderboard-row">
            <strong>#${row.rank}</strong>
            <span>${escapeHtml(row.display_name)}</span>
            <span>${fmt.format(number(row.total_bets ?? row.settled_bets))}</span>
            <span>${fmtOne.format(number(row.accuracy))}%</span>
            <span>${fmt.format(number(row.total_staked))} pts</span>
            <span>${fmt.format(number(row.wallet_balance))} pts</span>
            <b class="${number(row.profit_loss ?? row.score) >= 0 ? "success" : "error"}">${number(row.profit_loss ?? row.score) >= 0 ? "+" : ""}${fmt.format(number(row.profit_loss ?? row.score))} pts</b>
            <span>${fmtOne.format(number(row.profit_loss_pct ?? row.roi))}%</span>
          </div>
        `).join("")}
      </section>
    </div>
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
          <h2>3. Điểm và payout</h2>
          <p>Điểm cược bị trừ khỏi ví khi đặt. Nếu đúng, ví nhận stake nhân với hệ số đang khóa tại thời điểm cược.</p>
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
        <p>Ví điểm đã được cập nhật.</p>
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
        ${profileMetric("Điểm còn lại", `${fmt.format(remaining)} pts`)}
        ${profileMetric("Điểm cược", `${fmt.format(number(bet.stake))} pts`)}
        ${profileMetric("Payout dự kiến", `${fmt.format(number(bet.potential_payout))} pts`)}
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
        <p>${fmt.format(upcomingMatchCount)} trận đang dự đoán · ${fmt.format(upcoming.length)} phiếu mở · ${fmt.format(totalStake)} pts đang mở · Net ${fmt.format(net)} pts</p>
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
      <div><small>Stake</small><b>${fmt.format(number(bet.stake))} pts</b></div>
      <div><small>Payout</small><b>${fmt.format(number(bet.potential_payout))} pts</b></div>
      ${
        editable
          ? `<form class="update-bet-form" data-update-bet="${bet.id}">
              ${
                bet.market_key === "correct_score"
                  ? `<label>Home<input name="home_score" type="number" min="0" step="1" value="${homeScore}"></label>
                     <label>Away<input name="away_score" type="number" min="0" step="1" value="${awayScore}"></label>`
                  : `<label>Selection<input value="${escapeHtml(bet.selection_label)}" disabled></label>`
              }
              <label>Stake<input name="stake" type="number" min="1" step="1" value="${number(bet.stake)}"></label>
              <button class="primary-button compact-button" ${state.isSubmittingBet ? "disabled" : ""}>Cập nhật</button>
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

function renderHistory() {
  state.predictionStatsTab = "history";
  return renderPredictionStats();
  const net = state.bets.reduce((sum, bet) => sum + number(bet.points_delta) + number(bet.prediction_bonus), 0);
  return `
    <div class="stack">
      <section class="hero stadium-surface">
        <span class="pill">Premium Predictor</span>
        <h1>Người chơi #123</h1>
        <p>Net ${fmt.format(net)} pts · ${state.bets.length} dự đoán</p>
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
  const title = match ? `${match.home_team.name} vs ${match.away_team.name}` : bet.market_key;
  const delta = number(bet.points_delta);
  const bonus = number(bet.prediction_bonus);
  return `
    <article class="history-row ${escapeHtml(bet.status)}">
      <div><strong>${escapeHtml(title)}</strong><small>${dateText(bet.placed_at)}</small></div>
      <div><small>Dự đoán</small><b>${escapeHtml(bet.selection_label)}</b></div>
      <div><small>Stake</small><b>${fmt.format(number(bet.stake))}</b></div>
      <div><small>${escapeHtml(bet.status)}${bonus ? ` · bonus ${fmt.format(bonus)}` : ""}</small><b class="${delta + bonus >= 0 ? "success" : "error"}">${delta + bonus >= 0 ? "+" : ""}${fmt.format(delta + bonus)} pts</b></div>
    </article>
  `;
}

function renderAdmin() {
  const players = state.users.filter((user) => user.role === "player");
  const report = state.report || {};
  const marketOptions = adminMarketOptions();
  const outrightOptions = adminOutrightOptions();
  const transfermarktRun = state.syncRuns.find((run) => run.provider === "transfermarkt");
  return `
    <div class="stack">
      <div class="section-heading">
        <div><h1>Admin Dashboard</h1><p>Quản lý tài khoản, ví điểm và settlement.</p></div>
        <div class="admin-actions">
          <button class="ghost-button" id="export-leaderboard-button">Export rankings</button>
          <button class="ghost-button" id="export-bets-button">Export bets</button>
          <button class="ghost-button" id="export-ledger-button">Export ledger</button>
          <button class="ghost-button" id="export-audit-button">Export audit</button>
          <button class="ghost-button" id="export-reports-button">Export reports</button>
          <button class="ghost-button" id="provider-sync-button">Sync providers</button>
          <button class="ghost-button" id="transfermarkt-sync-button">Sync Transfermarkt</button>
          <button class="primary-button" id="refresh-button">Refresh</button>
        </div>
      </div>
      <section class="metric-grid">
        ${metric("Players", report.players || players.length)}
        ${metric("Wallet balance", `${fmt.format(number(report.total_wallet_balance))} pts`)}
        ${metric("Total staked", `${fmt.format(number(report.total_staked))} pts`)}
        ${metric("Settled net", `${fmt.format(number(report.settled_net_points))} pts`)}
        ${metric("Prediction bonus", `${fmt.format(number(report.prediction_bonus_points))} pts`)}
        ${metric("Open bets", report.open_bets || 0)}
        ${metric("Settled bets", report.settled_bets || 0)}
      </section>
      ${renderDeploymentHealth()}
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
          <label>Password<input id="new-password" value="demo123" required></label>
          <label>Điểm ban đầu<input id="new-points" type="number" value="1000"></label>
          <button class="primary-button">Tạo user</button>
        </form>
        <form class="glass-card form-card form-grid" id="top-up-form">
          <h2>Nạp / trừ điểm</h2>
          <label>Người chơi<select id="topup-user">${players.map((user) => `<option value="${user.id}">${escapeHtml(user.display_name)}</option>`).join("")}</select></label>
          <label>Số điểm<input id="topup-amount" type="number" value="500"></label>
          <label>Lý do<input id="topup-reason" value="Admin top-up"></label>
          <button class="primary-button">Cập nhật điểm</button>
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
          <label>New password<input id="reset-password" value="demo123" minlength="6" required></label>
          <button class="primary-button">Reset password</button>
        </form>
        <form class="glass-card form-card form-grid" id="tournament-winner-form">
          <h2>Settle vô địch</h2>
          <label>Đội vô địch<select id="winner-key">${state.outrightMarkets.filter((market) => market.market_key === "tournament_winner").map((market) => `<option value="${market.selection_key}">${escapeHtml(market.selection_label)}</option>`).join("")}</select></label>
          <button class="primary-button">Settle outright</button>
        </form>
      </section>
      <section class="glass-card panel">
        <div class="section-heading"><h2>Tài khoản</h2><span>${state.users.length} user</span></div>
        ${state.users.map(renderUserRow).join("")}
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
          <h2>Bracket confirmation</h2>
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

function renderUserRow(user) {
  return `
    <div class="user-row">
      <div class="avatar small">${initials(user.display_name)}</div>
      <div><strong>${escapeHtml(user.display_name)}</strong><small>@${escapeHtml(user.username)} · ${escapeHtml(user.role)}</small></div>
      <b class="score-value">${fmt.format(number(user.wallet_balance))} pts</b>
      <button class="ghost-button" data-toggle-user="${user.id}" data-active="${user.is_active ? "false" : "true"}">${user.is_active ? "Khóa" : "Mở"}</button>
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
        <span>${fmt.format(number(row.wallet_balance))} pts</span>
        <span>${fmt.format(number(row.net_points))}</span>
        <span>${fmt.format(number(row.bonus_points))}</span>
        <span>${fmt.format(number(row.score))}</span>
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
      <span>${fmt.format(number(row.total_staked))}</span>
      <span>${number(row.roi)}%</span>
      <span>${fmt.format(number(row.score))}</span>
    </div>
  `);
  return rows.join("") || `<div class="table-row"><span>No markets</span><span>-</span><span>-</span><span>-</span><span>-</span></div>`;
}

function renderAdminBetRow(bet) {
  const match = bet.match;
  const title = match ? `${match.home_team.name} vs ${match.away_team.name}` : bet.market_key;
  const delta = number(bet.points_delta);
  const bonus = number(bet.prediction_bonus);
  return `
    <article class="history-row ${escapeHtml(bet.status)}">
      <div><strong>${escapeHtml(bet.user?.display_name || bet.user_id)}</strong><small>${dateText(bet.placed_at)}</small></div>
      <div><small>${escapeHtml(title)}</small><b>${escapeHtml(bet.selection_label)}</b></div>
      <div><small>${escapeHtml(bet.market_key)}</small><b>${fmt.format(number(bet.stake))} pts · x${fmtOne.format(number(bet.locked_multiplier))}</b></div>
      <div>
        <small>${escapeHtml(bet.status)}${bonus ? ` · bonus ${fmt.format(bonus)}` : ""}</small>
        <b class="${delta + bonus >= 0 ? "success" : "error"}">${delta + bonus >= 0 ? "+" : ""}${fmt.format(delta + bonus)} pts</b>
        ${bet.status === "placed" ? `<button class="ghost-button compact-button" data-void-bet="${bet.id}">Void</button>` : ""}
      </div>
    </article>
  `;
}

function renderLedgerRow(entry) {
  return `
    <div class="table-row">
      <span>${dateText(entry.created_at)}</span>
      <span>${escapeHtml(entry.user?.display_name || entry.user_id)}</span>
      <span>${escapeHtml(entry.kind)}</span>
      <span>${fmt.format(number(entry.amount))}</span>
      <span>${fmt.format(number(entry.balance_after))}</span>
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

function bindShellEvents() {
  document.querySelectorAll("[data-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      state.active = button.dataset.tab;
      state.message = "";
      state.error = "";
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
      const matchId = Number(button.dataset.openBetModal);
      state.selectedMatchId = matchId;
      state.betModalMatchId = matchId;
      state.betModalMarketGroup = "basic";
      state.active = "detail";
      renderApp();
    });
  });

  document.querySelectorAll("[data-close-bet-modal]").forEach((target) => {
    target.addEventListener("click", (event) => {
      if (event.target.closest("[data-modal-panel]") && !event.target.closest(".icon-button")) return;
      state.betModalMatchId = null;
      renderApp();
    });
  });

  document.querySelectorAll("[data-bet-modal-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      state.betModalMarketGroup = button.dataset.betModalTab;
      renderApp();
    });
  });

  document.querySelectorAll("[data-match-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      state.matchFilter = button.dataset.matchFilter;
      renderApp();
    });
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

  document.getElementById("logout-button")?.addEventListener("click", async () => {
    await state.client.auth.signOut();
    state.session = null;
    state.profile = null;
    renderLogin();
  });

  document.getElementById("score-bet-form")?.addEventListener("submit", placeScoreBet);
  document.getElementById("modal-score-bet-form")?.addEventListener("submit", placeModalScoreBet);
  document.querySelectorAll(".update-bet-form").forEach((form) => {
    form.addEventListener("submit", updateBet);
  });
  document.querySelectorAll("[data-market]").forEach((button) => {
    button.addEventListener("click", () => placeMarketBet(Number(button.dataset.market)));
  });
  document.querySelectorAll("[data-modal-market]").forEach((button) => {
    button.addEventListener("click", () => placeModalMarketBet(Number(button.dataset.modalMarket)));
  });
  document.querySelectorAll("[data-outright]").forEach((button) => {
    button.addEventListener("click", () => placeOutrightBet(Number(button.dataset.outright)));
  });
  document.getElementById("golden-boot-search")?.addEventListener("input", (event) => {
    state.goldenBootSearch = event.target.value;
    renderApp();
    document.getElementById("golden-boot-search")?.focus();
  });
  document.getElementById("winner-search")?.addEventListener("input", (event) => {
    state.winnerSearch = event.target.value;
    renderApp();
    document.getElementById("winner-search")?.focus();
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
  document.getElementById("tournament-winner-form")?.addEventListener("submit", settleTournamentWinner);
  document.getElementById("refresh-button")?.addEventListener("click", () => loadData());
  document.getElementById("provider-sync-button")?.addEventListener("click", syncProviders);
  document.getElementById("transfermarkt-sync-button")?.addEventListener("click", () => syncTransfermarktValues());
  document.getElementById("transfermarkt-import-form")?.addEventListener("submit", importTransfermarktValues);
  document.getElementById("export-leaderboard-button")?.addEventListener("click", exportLeaderboardCsv);
  document.getElementById("export-bets-button")?.addEventListener("click", exportBetsCsv);
  document.getElementById("export-ledger-button")?.addEventListener("click", exportLedgerCsv);
  document.getElementById("export-audit-button")?.addEventListener("click", exportAuditCsv);
  document.getElementById("export-reports-button")?.addEventListener("click", exportReportsCsv);
  document.querySelectorAll("[data-toggle-user]").forEach((button) => {
    button.addEventListener("click", () => toggleUser(button.dataset.toggleUser, button.dataset.active === "true"));
  });
  document.querySelectorAll("[data-void-bet]").forEach((button) => {
    button.addEventListener("click", () => voidBet(Number(button.dataset.voidBet)));
  });
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

async function updateBet(event) {
  event.preventDefault();
  if (state.isSubmittingBet) return;
  const form = event.currentTarget;
  const bet = state.bets.find((item) => item.id === Number(form.dataset.updateBet));
  if (!bet) return;
  const match = matchForBet(bet);
  const market = marketForBet(bet, match);
  if (!match || !market) {
    state.error = "Không tìm thấy market để cập nhật dự đoán.";
    state.message = "";
    renderApp();
    return;
  }

  const stake = Number(form.elements.stake.value);
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
  const market = match.match_markets.find((item) => item.market_key === "correct_score");
  if (!market) {
    state.error = "Trận này chưa có kèo tỷ số.";
    state.message = "";
    renderApp();
    return;
  }
  const homeScore = Number(document.getElementById("home-score").value);
  const awayScore = Number(document.getElementById("away-score").value);
  const stake = Number(document.getElementById("stake").value);
  await placeBet({
    p_match_id: match.id,
    p_market_id: market.id,
    p_selection_key: `${homeScore}-${awayScore}`,
    p_selection_label: `${homeScore} - ${awayScore}`,
    p_stake: stake,
    p_selection_json: { home_score: homeScore, away_score: awayScore }
  });
}

async function placeModalScoreBet(event) {
  event.preventDefault();
  const match = state.matches.find((item) => item.id === state.betModalMatchId) || selectedMatch();
  const market = match?.match_markets.find((item) => item.market_key === "correct_score");
  if (!match || !market) {
    state.error = "Trận này chưa có kèo tỷ số.";
    state.message = "";
    renderApp();
    return;
  }
  const homeScore = Number(document.getElementById("modal-home-score").value);
  const awayScore = Number(document.getElementById("modal-away-score").value);
  const stake = Number(document.getElementById("bet-modal-stake")?.value || 0);
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
  const stake = Number(prompt("Điểm cược", "100") || 0);
  if (!market || !stake) return;
  await placeBet({
    p_match_id: match.id,
    p_market_id: market.id,
    p_selection_key: market.selection_key,
    p_selection_label: market.selection_label,
    p_stake: stake,
    p_selection_json: { line: market.line }
  });
}

async function placeModalMarketBet(marketId) {
  if (state.isSubmittingBet) return;
  const match = state.matches.find((item) => item.id === state.betModalMatchId) || selectedMatch();
  const market = match?.match_markets.find((item) => item.id === marketId);
  const stake = Number(document.getElementById("bet-modal-stake")?.value || 0);
  if (!match || !market || !stake) return;
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
  const stake = Number(prompt("Điểm cược", "100") || 0);
  if (!market || !stake) return;
  await submitOutrightBet(market.id, stake);
}

async function placeSelectedOutrightBet(event, marketKey) {
  event.preventDefault();
  if (state.isSubmittingBet) return;
  const selectId = marketKey === "golden_boot" ? "golden-boot-select" : "winner-select";
  const stakeId = marketKey === "golden_boot" ? "golden-boot-stake" : "winner-stake";
  const marketId = Number(document.getElementById(selectId)?.value || 0);
  const stake = Number(document.getElementById(stakeId)?.value || 0);
  if (!marketId || !stake) return;
  await submitOutrightBet(marketId, stake);
}

async function submitOutrightBet(marketId, stake) {
  const market = state.outrightMarkets.find((item) => item.id === marketId);
  if (!market || !stake) return;
  state.isSubmittingBet = true;
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
  try {
    const { data, error } = await state.client.rpc("place_bet", payload);
    if (error) {
      state.error = error.message;
      state.message = "";
    } else {
      state.message = "Đã ghi nhận dự đoán và trừ điểm cược.";
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
  const payload = {
    username: document.getElementById("new-username").value.trim().toLowerCase(),
    display_name: document.getElementById("new-display-name").value.trim(),
    password: document.getElementById("new-password").value,
    starting_points: Number(document.getElementById("new-points").value || 0)
  };
  const response = await fetch("/api/admin-create-user", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${state.session.access_token}`
    },
    body: JSON.stringify(payload)
  });
  const result = await response.json();
  if (!response.ok) {
    state.error = result.error || "Không thể tạo user";
  } else {
    state.message = "Đã tạo tài khoản người chơi.";
    state.error = "";
  }
  await loadData();
}

async function adjustWallet(event) {
  event.preventDefault();
  const { error } = await state.client.rpc("admin_adjust_wallet", {
    p_user_id: document.getElementById("topup-user").value,
    p_amount: Number(document.getElementById("topup-amount").value || 0),
    p_reason: document.getElementById("topup-reason").value
  });
  state.message = error ? "" : "Đã cập nhật điểm.";
  state.error = error ? error.message : "";
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
  const payload = {
    user_id: document.getElementById("reset-user").value,
    password: document.getElementById("reset-password").value
  };
  const response = await fetch("/api/admin-reset-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${state.session.access_token}`
    },
    body: JSON.stringify(payload)
  });
  const result = await response.json();
  if (!response.ok) {
    state.error = result.error || "Cannot reset password";
    state.message = "";
  } else {
    state.message = "Password reset.";
    state.error = "";
  }
  await loadData();
}

async function settleTournamentWinner(event) {
  event.preventDefault();
  const winnerKey = document.getElementById("winner-key").value;
  const { data, error } = await state.client.rpc("settle_tournament_winner", { p_winner_key: winnerKey });
  state.message = error ? "" : `Đã settle ${data} kèo vô địch.`;
  state.error = error ? error.message : "";
  await loadData();
}

async function syncProviders() {
  const response = await fetch("/api/sync-football-data", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${state.session.access_token}`
    },
    body: JSON.stringify({ includeOdds: true, includeRankings: true, includeFifaProfiles: true, includeSquads: true })
  });
  const result = await response.json();
  if (!response.ok) {
    state.error = result.error || "Provider sync failed";
    state.message = "";
  } else {
    const fixtureStatus = result.fixtureResult?.status || "unknown";
    const footballDataStatus = result.footballDataResult?.status || "unknown";
    const statsStatus = result.statsResult?.status || "unknown";
    const rankingStatus = result.rankingResult?.status || "unknown";
    const fifaProfileStatus = result.fifaProfileResult?.status || "unknown";
    const squadStatus = result.squadResult?.status || "unknown";
    const oddsStatus = result.oddsResult?.status || "unknown";
    state.message = `Provider sync finished. API-FOOTBALL: ${fixtureStatus}; football-data.org: ${footballDataStatus}; stats: ${statsStatus}; rankings: ${rankingStatus}; FIFA profiles: ${fifaProfileStatus}; squads: ${squadStatus}; odds: ${oddsStatus}.`;
    state.error = "";
  }
  await loadData();
}

async function syncTransfermarktValues(teamCode = "") {
  const maxInput = teamCode ? "1" : (prompt("Max Transfermarkt teams", "48") || "48");
  const maxTransfermarktTeams = Math.max(1, Math.min(64, Number(maxInput) || 48));
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
      includeFifaProfiles: false,
      includeSquads: false,
      includeTransfermarkt: true,
      fifaTeamCode: teamCode,
      maxTransfermarktTeams
    })
  });
  const result = await response.json();
  if (!response.ok) {
    state.error = result.error || "Transfermarkt sync failed";
    state.message = "";
  } else {
    const tm = result.transfermarktResult || {};
    state.message = `Transfermarkt sync ${tm.status || "unknown"}: ${fmt.format(tm.teams || 0)} teams; ${fmt.format(tm.players || 0)} players; ${fmt.format(tm.errors || 0)} errors.`;
    state.error = tm.error || "";
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
    selection: bet.selection_label,
    stake: bet.stake,
    locked_multiplier: bet.locked_multiplier,
    potential_payout: bet.potential_payout,
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
      <b>${fmt.format(number(row.wallet_balance))}</b>
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

function teamLockup(team, large = false) {
  const rating = teamRatingLabel(team);
  return `
    <div class="team-lockup">
      <div class="flag-orb ${large ? "large" : ""}">${teamFlagContent(team)}</div>
      <strong>${escapeHtml(team?.name || "TBA")}</strong>
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
        <strong id="${id}-display">${value}</strong>
        <button type="button" data-inc="${id}">+</button>
      </div>
      <input id="${id}" type="hidden" value="${value}">
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
  const display = document.getElementById(`${id}-display`);
  const next = Math.max(0, Number(input.value) + (inc ? 1 : -1));
  input.value = String(next);
  display.textContent = String(next);
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

function number(value) {
  return Number(value || 0);
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
