const app = document.getElementById("app");

const state = {
  client: null,
  session: null,
  profile: null,
  matches: [],
  bracketMatches: [],
  teams: [],
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
  matchFilter: "upcoming",
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
  ["matches", "Matches"],
  ["detail", "Predict"],
  ["bracket", "Bracket"],
  ["leaderboard", "Rankings"],
  ["history", "History"]
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
        <button class="primary-button wide" data-tab="detail">Place Prediction</button>
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
  if (state.active === "detail") return renderDetail();
  if (state.active === "bracket") return renderBracket();
  if (state.active === "leaderboard") return renderLeaderboard();
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
  const odd = featured.match_markets.find((market) => market.market_key === "correct_score")?.odds_multiplier || 2.45;
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
          <p><button class="primary-button" data-match="${featured.id}">Dự đoán ngay</button></p>
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
          <div class="section-heading"><h2>MVP Markets</h2><span>Free-first</span></div>
          <p>Correct score · 1X2 · draw_no_bet · Over/Under · BTTS · Góc/Thẻ nội bộ · Vô địch giải.</p>
        </section>
        <section class="glass-card panel">
          <div class="section-heading"><h2>Vô địch giải</h2><span>${state.outrightMarkets.length} lựa chọn</span></div>
          <div class="outright-list">
            ${state.outrightMarkets.filter((market) => market.is_open).slice(0, 8).map(renderOutrightButton).join("") || "<p>Chưa có kèo vô địch.</p>"}
          </div>
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
        <span>${fmt.format(matches.length)} trận để predict</span>
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
  return `
    <article class="fixture-row">
      <span class="fixture-number">#${escapeHtml(fixtureNumber(match))}</span>
      <time>${dateText(match.starts_at)}</time>
      <div class="fixture-pair">
        ${fixtureTeam(match.home_team)}
        <b>VS</b>
        ${fixtureTeam(match.away_team)}
      </div>
      <div class="fixture-meta">
        <strong>${escapeHtml(scheduleLabel(match))}</strong>
        <small>${escapeHtml(matchLocation(match))}</small>
      </div>
      <span class="fixture-market-count">${fmt.format(openMarkets)} open</span>
      <button class="compact-button primary-button" data-match="${match.id}">Predict</button>
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
      <p><button class="ghost-button wide" data-match="${match.id}">Dự đoán ngay</button></p>
    </article>
  `;
}

function renderScheduleFilters() {
  const base = [
    ["upcoming", "Upcoming"],
    ["today", "Today"],
    ["knockout", "Knockout"],
    ["all", "All"]
  ];
  const groups = [...new Set(state.matches.map((match) => match.group_name).filter(Boolean))]
    .sort()
    .map((group) => [`group:${group}`, formatGroupName(group)]);
  const filters = [...base, ...groups];
  return `
    <section class="schedule-toolbar glass-card">
      <div>
        <h2>Lịch & bảng đấu</h2>
        <p>Xem theo ngày, bảng hoặc vòng knockout. Bấm trận để vào trang cược.</p>
      </div>
      <div class="filter-scroll">
        ${filters.map(([key, label]) => `<button class="filter-pill ${state.matchFilter === key ? "active" : ""}" data-match-filter="${escapeHtml(key)}">${escapeHtml(label)}</button>`).join("")}
      </div>
    </section>
  `;
}

function filteredScheduleMatches() {
  const now = new Date();
  const todayKey = localDateKey(now);
  return state.matches.filter((match) => {
    if (state.matchFilter === "all") return true;
    if (state.matchFilter === "today") return localDateKey(new Date(match.starts_at)) === todayKey;
    if (state.matchFilter === "knockout") return isKnockoutMatch(match);
    if (state.matchFilter?.startsWith("group:")) return match.group_name === state.matchFilter.slice(6);
    return new Date(match.starts_at).getTime() >= now.getTime() && match.status === "SCHEDULED";
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
            <button data-match="${reminder.match.id}">
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

function renderDetail() {
  const match = selectedMatch();
  if (!match) return `<section class="glass-card panel"><h2>Không có trận để dự đoán</h2></section>`;
  const scoreMarket = match.match_markets.find((market) => market.market_key === "correct_score") || match.match_markets[0];
  if (!scoreMarket) {
    return `<section class="glass-card panel"><h2>Chưa có kèo cho trận này</h2><p>Admin hãy chạy Sync providers hoặc tạo market trước khi người chơi đặt cược.</p></section>`;
  }
  const multiplier = number(scoreMarket?.odds_multiplier || 1);
  return `
    <div class="stack">
      <section class="score-hero stadium-surface">
        ${teamLockup(match.home_team, true)}
        <div class="score-center">
          <span class="pill">${escapeHtml(match.status)}</span>
          <div class="score-display">${match.home_score ?? "?"} : ${match.away_score ?? "?"}</div>
          <span class="muted">${escapeHtml(match.stage)}</span>
        </div>
        ${teamLockup(match.away_team, true)}
      </section>
      <section class="detail-grid">
        <form class="glass-card panel" id="score-bet-form">
          <div class="section-heading"><h2>Dự đoán tỷ số</h2><span>Lock: ${dateText(match.starts_at)}</span></div>
          <div class="score-picker">
            ${scoreStepper("home-score", match.home_team.name, 2)}
            <span class="vs-text">-</span>
            ${scoreStepper("away-score", match.away_team.name, 1)}
          </div>
          <label>Điểm cược<input id="stake" type="number" min="10" step="10" value="100"></label>
          <p><button class="primary-button wide">Xác nhận dự đoán · x${fmtOne.format(multiplier)}</button></p>
        </form>
        <section class="glass-card panel">
          <h2>Points at stake</h2>
          <p>Hệ số nhân <strong class="score-value">x${fmtOne.format(multiplier)}</strong></p>
          <p><small>${escapeHtml(oddsFreshnessLabel(scoreMarket))}</small></p>
          <p>Điểm cược sẽ bị trừ ngay khi đặt. Nếu thắng, ví sẽ nhận stake × multiplier.</p>
          <div class="meter"><div style="width:${Math.min(100, multiplier * 28)}%"></div></div>
        </section>
      </section>
      <section class="glass-card panel">
        <div class="section-heading"><h2>Chọn kèo khác</h2><span>90 phút chính thức</span></div>
        <div class="market-grid">
          ${match.match_markets.filter((market) => market.market_key !== "correct_score").map(renderMarketButton).join("")}
        </div>
      </section>
    </div>
  `;
}

function renderMarketButton(market) {
  return `
    <button class="market-button" data-market="${market.id}">
      <span>${escapeHtml(market.label)}</span>
      <strong>${escapeHtml(market.selection_label)}</strong>
      <small>x${fmtOne.format(number(market.odds_multiplier))} · ${escapeHtml(oddsFreshnessLabel(market))}</small>
    </button>
  `;
}

function renderOutrightButton(market) {
  return `
    <button class="outright-button" data-outright="${market.id}">
      <span class="outright-label">
        <span>${escapeHtml(market.selection_label)}</span>
        <small>${escapeHtml(oddsFreshnessLabel(market))}</small>
      </span>
      <strong>x${fmtOne.format(number(market.odds_multiplier))}</strong>
    </button>
  `;
}

function oddsFreshnessLabel(market) {
  if (!market) return "internal fixed odds";
  const extra = typeof market.extra_json === "string" ? safeJson(market.extra_json) : (market.extra_json || {});
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
  const rounds = [
    ["round_of_32", "Round of 32"],
    ["round_of_16", "Round of 16"],
    ["quarter_final", "Quarter-finals"],
    ["semi_final", "Semi-finals"],
    ["third_place", "Third-place"],
    ["final", "Final"]
  ];
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
          ? `<div class="bracket-board">${rounds.map(([key, label]) => renderBracketRound(key, label)).join("")}${renderChampionTile()}</div>`
          : `<section class="glass-card panel"><h2>No bracket data</h2><p>Run supabase/seed_bracket.sql after schema.sql.</p></section>`
      }
    </section>
  `;
}

function renderBracketRound(roundKey, fallbackLabel) {
  const matches = state.bracketMatches.filter((match) => match.round_key === roundKey);
  if (!matches.length) return "";
  return `
    <section class="bracket-round">
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
  const location = linked ? matchLocation(match.match) : `${match.venue}${match.city ? ` · ${match.city}` : ""}`;
  const statusLabel = linked ? "Predict open" : match.is_confirmed ? "Confirmed" : "Pending";
  const content = `
    <div class="bracket-match-top">
      <span>Match ${fmt.format(match.match_no)}</span>
      <time>${escapeHtml(displayDate)}</time>
    </div>
    <div class="bracket-team">${escapeHtml(homeLabel)}</div>
    <div class="bracket-team">${escapeHtml(awayLabel)}</div>
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
  const final = state.bracketMatches.find((match) => match.match_no === 104);
  const winner = final?.match ? matchWinner(final.match) : null;
  return `
    <section class="bracket-round champion-round">
      <h3>Champion</h3>
      <article class="bracket-match champion-card glass-card">
        <div class="bracket-match-top"><span>World Cup 2026</span><span>Final path</span></div>
        <div class="bracket-team">${escapeHtml(winner?.name || "Champion")}</div>
        <small>${winner ? "Confirmed from final result" : "Winner match 104"}</small>
      </article>
    </section>
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
      <div class="section-heading"><div><h1>Bảng Xếp Hạng</h1><p>Dựa trên net points từ các cược đã settle.</p></div></div>
      <section class="podium">
        ${state.leaderboard.slice(0, 3).map((row) => `
          <article class="podium-card">
            <div class="avatar">${initials(row.display_name)}</div>
            <span>#${row.rank}</span>
            <h2>${escapeHtml(row.display_name)}</h2>
            <strong class="score-value">${fmt.format(number(row.score))}</strong>
            <small>${row.accuracy}% Accuracy</small>
          </article>
        `).join("")}
      </section>
      <section class="glass-card table-card">
        <div class="table-row table-head"><span>Hạng</span><span>Người chơi</span><span>Đúng</span><span>Bonus</span><span>Điểm</span></div>
        ${state.leaderboard.map((row) => `
          <div class="table-row">
            <strong>#${row.rank}</strong>
            <span>${escapeHtml(row.display_name)}</span>
            <span>${row.accuracy}%</span>
            <span>${fmt.format(number(row.bonus_points))}</span>
            <b class="score-value">${fmt.format(number(row.score))}</b>
          </div>
        `).join("")}
      </section>
    </div>
  `;
}

function renderHistory() {
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
  const match = bet.match;
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
          <label>Đội vô địch<select id="winner-key">${state.outrightMarkets.map((market) => `<option value="${market.selection_key}">${escapeHtml(market.selection_label)}</option>`).join("")}</select></label>
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

  document.querySelectorAll("[data-match-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      state.matchFilter = button.dataset.matchFilter;
      renderApp();
    });
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
  document.querySelectorAll("[data-market]").forEach((button) => {
    button.addEventListener("click", () => placeMarketBet(Number(button.dataset.market)));
  });
  document.querySelectorAll("[data-outright]").forEach((button) => {
    button.addEventListener("click", () => placeOutrightBet(Number(button.dataset.outright)));
  });
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

async function placeMarketBet(marketId) {
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

async function placeOutrightBet(marketId) {
  const market = state.outrightMarkets.find((item) => item.id === marketId);
  const stake = Number(prompt("Điểm cược", "100") || 0);
  if (!market || !stake) return;
  const { error } = await state.client.rpc("place_outright_bet", {
    p_outright_market_id: market.id,
    p_stake: stake
  });
  if (error) {
    state.error = error.message;
    state.message = "";
  } else {
    state.message = `Đã đặt kèo vô địch: ${market.selection_label}.`;
    state.error = "";
    state.active = "history";
  }
  await loadData();
}

async function placeBet(payload) {
  const { error } = await state.client.rpc("place_bet", payload);
  if (error) {
    state.error = error.message;
    state.message = "";
  } else {
    state.message = "Đã ghi nhận dự đoán và trừ điểm cược.";
    state.error = "";
    state.active = "history";
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
    body: JSON.stringify({ includeOdds: true })
  });
  const result = await response.json();
  if (!response.ok) {
    state.error = result.error || "Provider sync failed";
    state.message = "";
  } else {
    const fixtureStatus = result.fixtureResult?.status || "unknown";
    const footballDataStatus = result.footballDataResult?.status || "unknown";
    const statsStatus = result.statsResult?.status || "unknown";
    const oddsStatus = result.oddsResult?.status || "unknown";
    state.message = `Provider sync finished. API-FOOTBALL: ${fixtureStatus}; football-data.org: ${footballDataStatus}; stats: ${statsStatus}; odds: ${oddsStatus}.`;
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
    rank: row.rank,
    username: row.username,
    display_name: row.display_name,
    score: row.score,
    net_points: row.net_points,
    bonus_points: row.bonus_points,
    settled_bets: row.settled_bets,
    won_bets: row.won_bets,
    correct_score_count: row.correct_score_count,
    accuracy: row.accuracy,
    roi: row.roi
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

function selectedMatch() {
  return state.matches.find((match) => match.id === state.selectedMatchId) || state.matches[0];
}

function renderLeaderRow(row) {
  return `
    <div class="leader-row">
      <span>#${row.rank}</span>
      <div class="avatar small">${initials(row.display_name)}</div>
      <div><strong>${escapeHtml(row.display_name)}</strong><small>${row.accuracy}% Accuracy</small></div>
      <b>${fmt.format(number(row.score))}</b>
    </div>
  `;
}

function teamFlagContent(team) {
  const code = team?.code;
  if (flagImages[code]) {
    return `<img src="${escapeHtml(flagImages[code])}" alt="${escapeHtml(team?.name || code)} flag" loading="lazy">`;
  }
  return flags[code] || "🏆";
}

function teamLockup(team, large = false) {
  return `
    <div class="team-lockup">
      <div class="flag-orb ${large ? "large" : ""}">${teamFlagContent(team)}</div>
      <strong>${escapeHtml(team?.name || "TBA")}</strong>
      <small>${escapeHtml(team?.code || "TBA")}</small>
    </div>
  `;
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
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function dateOnlyText(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("vi-VN", {
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
