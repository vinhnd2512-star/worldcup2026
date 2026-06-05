const API_FOOTBALL_BASE_URL = "https://v3.football.api-sports.io";
const ODDS_API_BASE_URL = "https://api.the-odds-api.com/v4";
const FOOTBALL_DATA_BASE_URL = "https://api.football-data.org/v4";
const WORLD_CUP_LEAGUE_ID = 1;
const WORLD_CUP_SEASON = 2026;
const FOOTBALL_DATA_WORLD_CUP_CODE = "WC";
const WORLD_CUP_SPORT_KEY = "soccer_fifa_world_cup";
const ODDS_MATCH_WINDOW_HOURS = 36;
const DEFAULT_MAX_STATS_FIXTURES = 12;
const STAT_SYNC_WINDOW_HOURS = 96;
const LIVE_STATUSES = new Set(["1H", "HT", "2H", "ET", "BT", "P", "INT", "LIVE"]);
const FINAL_STATUSES = new Set(["FT", "AET", "PEN", "FT_PEN"]);

async function readJson(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function send(response, status, payload) {
  response.status(status).json(payload);
}

function env(name) {
  return process.env[name] || "";
}

async function supabaseFetch(path, options = {}) {
  const serviceKey = env("SUPABASE_SERVICE_ROLE_KEY");
  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
    ...(options.headers || {})
  };
  return fetch(`${env("SUPABASE_URL")}${path}`, { ...options, headers });
}

async function requireAdminOrSecret(request) {
  const syncSecret = env("CRON_SECRET") || env("SYNC_SECRET");
  const authorization = request.headers.authorization || "";
  if (syncSecret && authorization === `Bearer ${syncSecret}`) {
    return { mode: "secret" };
  }

  const serviceKey = env("SUPABASE_SERVICE_ROLE_KEY");
  const callerToken = authorization.replace(/^Bearer\s+/i, "");
  if (!callerToken) {
    return { error: "Missing bearer token", status: 401 };
  }

  const callerResponse = await fetch(`${env("SUPABASE_URL")}/auth/v1/user`, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${callerToken}`
    }
  });
  if (!callerResponse.ok) {
    return { error: "Invalid caller token", status: 401 };
  }

  const caller = await callerResponse.json();
  const profileResponse = await supabaseFetch(`/rest/v1/profiles?id=eq.${caller.id}&select=role,is_active`);
  if (!profileResponse.ok) {
    return { error: "Cannot verify admin profile", status: 403 };
  }
  const profiles = await profileResponse.json();
  if (!profiles[0] || profiles[0].role !== "admin" || profiles[0].is_active !== true) {
    return { error: "Admin role required", status: 403 };
  }
  return { mode: "admin", caller };
}

async function recordSyncRun({ provider, jobType, status, requestCount, message }) {
  await supabaseFetch("/rest/v1/sync_runs", {
    method: "POST",
    body: JSON.stringify({
      provider,
      job_type: jobType,
      status,
      finished_at: new Date().toISOString(),
      request_count: requestCount,
      message
    })
  });
}

async function apiFootball(path, params) {
  const url = new URL(`${API_FOOTBALL_BASE_URL}${path}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, String(value)));
  const response = await fetch(url, {
    headers: { "x-apisports-key": env("API_FOOTBALL_KEY") }
  });
  if (!response.ok) {
    throw new Error(`API-FOOTBALL ${path} failed: ${response.status} ${await response.text()}`);
  }
  return response.json();
}

async function oddsApi(path, params) {
  const url = new URL(`${ODDS_API_BASE_URL}${path}`);
  Object.entries({ apiKey: env("ODDS_API_KEY"), ...params }).forEach(([key, value]) => url.searchParams.set(key, String(value)));
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`The Odds API ${path} failed: ${response.status} ${await response.text()}`);
  }
  return response.json();
}

async function footballData(path, params = {}) {
  const url = new URL(`${FOOTBALL_DATA_BASE_URL}${path}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, String(value)));
  const response = await fetch(url, {
    headers: { "X-Auth-Token": env("FOOTBALL_DATA_API_TOKEN") }
  });
  if (!response.ok) {
    throw new Error(`football-data.org ${path} failed: ${response.status} ${await response.text()}`);
  }
  return response.json();
}

function normalizeStatus(shortStatus) {
  if (["NS", "TBD"].includes(shortStatus)) return "SCHEDULED";
  if (["FT", "AET", "PEN"].includes(shortStatus)) return shortStatus;
  if (["PST", "CANC", "ABD", "SUSP"].includes(shortStatus)) return shortStatus;
  return shortStatus || "SCHEDULED";
}

function normalizeFootballDataStatus(status) {
  if (["TIMED", "SCHEDULED"].includes(status)) return "SCHEDULED";
  if (status === "FINISHED") return "FT";
  if (status === "POSTPONED") return "PST";
  if (status === "CANCELLED") return "CANC";
  if (status === "SUSPENDED") return "SUSP";
  return status || "SCHEDULED";
}

function teamFromFixtureTeam(team) {
  return {
    provider_id: String(team.id),
    code: String(team.code || team.name.slice(0, 3)).toUpperCase(),
    name: team.name,
    country: team.name,
    logo_url: team.logo || null
  };
}

function teamFromFootballData(team) {
  return {
    provider_id: `fd-${team.id}`,
    code: String(team.tla || team.shortName || team.name.slice(0, 3)).toUpperCase(),
    name: team.name,
    country: team.name,
    logo_url: team.crest || null
  };
}

async function upsertJson(table, rows, onConflict) {
  if (!rows.length) return [];
  const response = await supabaseFetch(`/rest/v1/${table}?on_conflict=${encodeURIComponent(onConflict)}`, {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify(rows)
  });
  if (!response.ok) {
    throw new Error(`Supabase upsert ${table} failed: ${response.status} ${await response.text()}`);
  }
  return response.json();
}

async function upsertJsonMinimal(table, rows, onConflict) {
  if (!rows.length) return 0;
  const response = await supabaseFetch(`/rest/v1/${table}?on_conflict=${encodeURIComponent(onConflict)}`, {
    method: "POST",
    headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
    body: JSON.stringify(rows)
  });
  if (!response.ok) {
    throw new Error(`Supabase upsert ${table} failed: ${response.status} ${await response.text()}`);
  }
  return rows.length;
}

async function patchJson(table, filters, row) {
  const response = await supabaseFetch(`/rest/v1/${table}?${filters.join("&")}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(row)
  });
  if (!response.ok) {
    throw new Error(`Supabase patch ${table} failed: ${response.status} ${await response.text()}`);
  }
  return response.json();
}

async function getTeamsByProviderIds(providerIds) {
  if (!providerIds.length) return new Map();
  const response = await supabaseFetch(`/rest/v1/teams?provider_id=in.(${providerIds.map(encodeURIComponent).join(",")})&select=id,provider_id`);
  if (!response.ok) {
    throw new Error(`Supabase read teams failed: ${response.status} ${await response.text()}`);
  }
  const teams = await response.json();
  return new Map(teams.map((team) => [team.provider_id, team.id]));
}

async function getMatchesForOddsMapping() {
  const response = await supabaseFetch(
    "/rest/v1/matches?select=id,starts_at,status,home_team:teams!matches_home_team_id_fkey(id,code,name),away_team:teams!matches_away_team_id_fkey(id,code,name)&order=starts_at.asc"
  );
  if (!response.ok) {
    throw new Error(`Supabase read matches failed: ${response.status} ${await response.text()}`);
  }
  return response.json();
}

async function getTeamsForOutrightMapping() {
  const response = await supabaseFetch("/rest/v1/teams?select=id,code,name&order=name.asc");
  if (!response.ok) {
    throw new Error(`Supabase read teams failed: ${response.status} ${await response.text()}`);
  }
  return response.json();
}

async function getMatchesForStatsSync(maxFixtures) {
  const response = await supabaseFetch(
    "/rest/v1/matches?provider_id=not.is.null&select=id,provider_id,status,starts_at,home_team:teams!matches_home_team_id_fkey(provider_id),away_team:teams!matches_away_team_id_fkey(provider_id)&order=starts_at.desc&limit=80"
  );
  if (!response.ok) {
    throw new Error(`Supabase read matches for stats failed: ${response.status} ${await response.text()}`);
  }
  const now = Date.now();
  const matches = await response.json();
  return matches
    .filter((match) => {
      const status = String(match.status || "");
      if (LIVE_STATUSES.has(status)) return true;
      if (!FINAL_STATUSES.has(status)) return false;
      const hoursSinceKickoff = (now - new Date(match.starts_at).getTime()) / 36e5;
      return hoursSinceKickoff >= 0 && hoursSinceKickoff <= STAT_SYNC_WINDOW_HOURS;
    })
    .slice(0, maxFixtures);
}

function normalizeTeamName(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\b(fc|cf|sc|the|national|team)\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function hoursBetween(left, right) {
  return Math.abs(new Date(left).getTime() - new Date(right).getTime()) / 36e5;
}

function matchOddsEvent(event, matches) {
  const eventHome = normalizeTeamName(event.home_team);
  const eventAway = normalizeTeamName(event.away_team);
  const candidates = [];

  for (const match of matches) {
    const matchHome = normalizeTeamName(match.home_team?.name);
    const matchAway = normalizeTeamName(match.away_team?.name);
    const timeDelta = hoursBetween(event.commence_time, match.starts_at);
    if (timeDelta > ODDS_MATCH_WINDOW_HOURS) continue;

    const sameOrder = eventHome === matchHome && eventAway === matchAway;
    const reversed = eventHome === matchAway && eventAway === matchHome;
    if (sameOrder || reversed) {
      candidates.push({ match, reversed, timeDelta });
    }
  }

  candidates.sort((a, b) => a.timeDelta - b.timeDelta);
  return candidates[0] || null;
}

function decimal(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Number(numeric.toFixed(2)) : null;
}

function integerStat(value) {
  if (value === null || value === undefined || value === "") return 0;
  const numeric = Number.parseInt(String(value).replace("%", ""), 10);
  return Number.isFinite(numeric) ? numeric : 0;
}

function findStatistic(stats, type) {
  const item = (stats || []).find((stat) => stat.type === type);
  return integerStat(item?.value);
}

function teamStatsByProviderId(payload) {
  const map = new Map();
  for (const row of payload.response || []) {
    map.set(String(row.team?.id), row.statistics || []);
  }
  return map;
}

function bestPricesForEvent(event, match, reversed) {
  const prices = new Map();

  function setBest(key, candidate) {
    const current = prices.get(key);
    if (!current || candidate.odds_multiplier > current.odds_multiplier) {
      prices.set(key, candidate);
    }
  }

  for (const bookmaker of event.bookmakers || []) {
    for (const market of bookmaker.markets || []) {
      if (market.key === "h2h") {
        for (const outcome of market.outcomes || []) {
          const outcomeName = normalizeTeamName(outcome.name);
          let selectionKey = null;
          let selectionLabel = outcome.name;
          if (outcomeName === "draw") {
            selectionKey = "draw";
            selectionLabel = "Hòa";
          } else if (outcomeName === normalizeTeamName(event.home_team)) {
            selectionKey = reversed ? "away" : "home";
            selectionLabel = reversed ? "Đội khách thắng" : "Đội nhà thắng";
          } else if (outcomeName === normalizeTeamName(event.away_team)) {
            selectionKey = reversed ? "home" : "away";
            selectionLabel = reversed ? "Đội nhà thắng" : "Đội khách thắng";
          }
          if (!selectionKey) continue;

          setBest(`match_result:${selectionKey}:`, {
            match_id: match.id,
            market_key: "match_result",
            label: "Kết quả 1X2",
            selection_key: selectionKey,
            selection_label: selectionLabel,
            line: null,
            odds_multiplier: decimal(outcome.price),
            bookmaker: bookmaker.title || bookmaker.key,
            payload_json: { event_id: event.id, market: market.key, outcome, bookmaker }
          });
        }
      }

      if (market.key === "draw_no_bet") {
        for (const outcome of market.outcomes || []) {
          const outcomeName = normalizeTeamName(outcome.name);
          let selectionKey = null;
          let selectionLabel = outcome.name;
          if (outcomeName === normalizeTeamName(event.home_team)) {
            selectionKey = reversed ? "away" : "home";
            selectionLabel = reversed ? "Away DNB" : "Home DNB";
          } else if (outcomeName === normalizeTeamName(event.away_team)) {
            selectionKey = reversed ? "home" : "away";
            selectionLabel = reversed ? "Home DNB" : "Away DNB";
          }
          if (!selectionKey) continue;

          setBest(`draw_no_bet:${selectionKey}:`, {
            match_id: match.id,
            market_key: "draw_no_bet",
            label: "Draw no bet",
            selection_key: selectionKey,
            selection_label: selectionLabel,
            line: null,
            odds_multiplier: decimal(outcome.price),
            bookmaker: bookmaker.title || bookmaker.key,
            payload_json: { event_id: event.id, market: market.key, outcome, bookmaker }
          });
        }
      }

      if (market.key === "totals") {
        for (const outcome of market.outcomes || []) {
          const selectionKey = normalizeTeamName(outcome.name);
          if (!["over", "under"].includes(selectionKey)) continue;
          const line = decimal(outcome.point);
          if (line === null) continue;
          setBest(`total_goals:${selectionKey}:${line}`, {
            match_id: match.id,
            market_key: "total_goals",
            label: `Tổng bàn thắng ${line}`,
            selection_key: selectionKey,
            selection_label: selectionKey === "over" ? `Tài ${line}` : `Xỉu ${line}`,
            line,
            odds_multiplier: decimal(outcome.price),
            bookmaker: bookmaker.title || bookmaker.key,
            payload_json: { event_id: event.id, market: market.key, outcome, bookmaker }
          });
        }
      }
    }
  }

  return [...prices.values()].filter((price) => price.odds_multiplier !== null);
}

function marketFilterPath(candidate) {
  const filters = [
    `match_id=eq.${candidate.match_id}`,
    `market_key=eq.${encodeURIComponent(candidate.market_key)}`,
    `selection_key=eq.${encodeURIComponent(candidate.selection_key)}`,
    candidate.line === null ? "line=is.null" : `line=eq.${candidate.line}`
  ];
  return `/rest/v1/match_markets?${filters.join("&")}`;
}

async function findExistingMarket(candidate) {
  const response = await supabaseFetch(`${marketFilterPath(candidate)}&select=id`);
  if (!response.ok) {
    throw new Error(`Supabase read match_market failed: ${response.status} ${await response.text()}`);
  }
  const rows = await response.json();
  return rows[0] || null;
}

async function upsertMarketFromOdds(candidate) {
  const row = {
    match_id: candidate.match_id,
    market_key: candidate.market_key,
    label: candidate.label,
    selection_key: candidate.selection_key,
    selection_label: candidate.selection_label,
    line: candidate.line,
    odds_multiplier: candidate.odds_multiplier,
    is_open: true,
    source: "odds-api",
    closes_at: candidate.closes_at,
    extra_json: {
      provider: "the-odds-api",
      bookmaker: candidate.bookmaker,
      updated_at: new Date().toISOString()
    }
  };

  const existing = await findExistingMarket(candidate);
  if (existing) {
    const response = await supabaseFetch(`/rest/v1/match_markets?id=eq.${existing.id}`, {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(row)
    });
    if (!response.ok) {
      throw new Error(`Supabase update match_market failed: ${response.status} ${await response.text()}`);
    }
    return (await response.json())[0];
  }

  const response = await supabaseFetch("/rest/v1/match_markets", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(row)
  });
  if (!response.ok) {
    throw new Error(`Supabase insert match_market failed: ${response.status} ${await response.text()}`);
  }
  return (await response.json())[0];
}

async function insertOddsSnapshot(market, candidate) {
  const response = await supabaseFetch("/rest/v1/odds_snapshots", {
    method: "POST",
    body: JSON.stringify({
      match_market_id: market.id,
      provider: "the-odds-api",
      bookmaker: candidate.bookmaker,
      multiplier: candidate.odds_multiplier,
      payload_json: candidate.payload_json
    })
  });
  if (!response.ok) {
    throw new Error(`Supabase insert odds_snapshot failed: ${response.status} ${await response.text()}`);
  }
}

function bestOutrightPrices(events, teams) {
  const teamsByName = new Map(teams.map((team) => [normalizeTeamName(team.name), team]));
  const prices = new Map();

  function setBest(team, candidate) {
    const current = prices.get(team.code);
    if (!current || candidate.odds_multiplier > current.odds_multiplier) {
      prices.set(team.code, candidate);
    }
  }

  for (const event of events) {
    for (const bookmaker of event.bookmakers || []) {
      for (const market of bookmaker.markets || []) {
        if (market.key !== "outrights") continue;
        for (const outcome of market.outcomes || []) {
          const team = teamsByName.get(normalizeTeamName(outcome.name));
          const multiplier = decimal(outcome.price);
          if (!team || multiplier === null) continue;
          setBest(team, {
            market_key: "tournament_winner",
            label: "Vô địch World Cup 2026",
            selection_key: team.code,
            selection_label: team.name,
            odds_multiplier: multiplier,
            bookmaker: bookmaker.title || bookmaker.key,
            payload_json: { event_id: event.id, market: market.key, outcome, bookmaker }
          });
        }
      }
    }
  }

  return [...prices.values()];
}

async function upsertOutrightMarketFromOdds(candidate, closesAt) {
  const response = await supabaseFetch("/rest/v1/outright_markets?on_conflict=market_key,selection_key", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify({
      market_key: candidate.market_key,
      label: candidate.label,
      selection_key: candidate.selection_key,
      selection_label: candidate.selection_label,
      odds_multiplier: candidate.odds_multiplier,
      is_open: true,
      source: "odds-api",
      closes_at: closesAt,
      extra_json: {
        provider: "the-odds-api",
        bookmaker: candidate.bookmaker,
        updated_at: new Date().toISOString(),
        payload: candidate.payload_json
      }
    })
  });
  if (!response.ok) {
    throw new Error(`Supabase upsert outright_market failed: ${response.status} ${await response.text()}`);
  }
  return response.json();
}

async function syncApiFootballFixtures() {
  if (!env("API_FOOTBALL_KEY")) {
    await recordSyncRun({
      provider: "api-football",
      jobType: "fixtures",
      status: "skipped",
      requestCount: 0,
      message: "API_FOOTBALL_KEY is not configured."
    });
    return { provider: "api-football", status: "skipped", requests: 0, teams: 0, matches: 0 };
  }

  const payload = await apiFootball("/fixtures", { league: WORLD_CUP_LEAGUE_ID, season: WORLD_CUP_SEASON });
  const fixtures = payload.response || [];
  const teamsByProvider = new Map();
  for (const fixture of fixtures) {
    teamsByProvider.set(String(fixture.teams.home.id), teamFromFixtureTeam(fixture.teams.home));
    teamsByProvider.set(String(fixture.teams.away.id), teamFromFixtureTeam(fixture.teams.away));
  }

  await upsertJson("teams", [...teamsByProvider.values()], "provider_id");
  const teamIdMap = await getTeamsByProviderIds([...teamsByProvider.keys()]);
  const matches = fixtures
    .map((fixture) => ({
      provider_id: String(fixture.fixture.id),
      stage: fixture.league.round || "World Cup 2026",
      group_name: fixture.league.round?.includes("Group") ? fixture.league.round : null,
      home_team_id: teamIdMap.get(String(fixture.teams.home.id)),
      away_team_id: teamIdMap.get(String(fixture.teams.away.id)),
      starts_at: fixture.fixture.date,
      status: normalizeStatus(fixture.fixture.status?.short),
      home_score: fixture.goals.home,
      away_score: fixture.goals.away,
      venue: fixture.fixture.venue?.name || null,
      city: fixture.fixture.venue?.city || null,
      current_minute: fixture.fixture.status?.elapsed || null,
      updated_at: new Date().toISOString()
    }))
    .filter((match) => match.home_team_id && match.away_team_id);

  await upsertJson("matches", matches, "provider_id");
  await recordSyncRun({
    provider: "api-football",
    jobType: "fixtures",
    status: "success",
    requestCount: 1,
    message: `Synced ${matches.length} fixtures and ${teamsByProvider.size} teams for World Cup 2026.`
  });

  return {
    provider: "api-football",
    status: "success",
    requests: 1,
    teams: teamsByProvider.size,
    matches: matches.length
  };
}

async function syncFootballDataFixtures() {
  if (!env("FOOTBALL_DATA_API_TOKEN")) {
    await recordSyncRun({
      provider: "football-data.org",
      jobType: "fixtures",
      status: "skipped",
      requestCount: 0,
      message: "FOOTBALL_DATA_API_TOKEN is not configured."
    });
    return { provider: "football-data.org", status: "skipped", requests: 0, teams: 0, matches: 0 };
  }

  const payload = await footballData(`/competitions/${FOOTBALL_DATA_WORLD_CUP_CODE}/matches`, { season: WORLD_CUP_SEASON });
  const matchesPayload = payload.matches || [];
  const teamsByProvider = new Map();
  for (const match of matchesPayload) {
    if (match.homeTeam?.id) teamsByProvider.set(`fd-${match.homeTeam.id}`, teamFromFootballData(match.homeTeam));
    if (match.awayTeam?.id) teamsByProvider.set(`fd-${match.awayTeam.id}`, teamFromFootballData(match.awayTeam));
  }

  await upsertJson("teams", [...teamsByProvider.values()], "provider_id");
  const teamIdMap = await getTeamsByProviderIds([...teamsByProvider.keys()]);
  const matches = matchesPayload
    .map((match) => ({
      provider_id: `fd-${match.id}`,
      stage: match.stage || "World Cup 2026",
      group_name: match.group || null,
      home_team_id: teamIdMap.get(`fd-${match.homeTeam?.id}`),
      away_team_id: teamIdMap.get(`fd-${match.awayTeam?.id}`),
      starts_at: match.utcDate,
      status: normalizeFootballDataStatus(match.status),
      home_score: match.score?.fullTime?.home ?? match.score?.regularTime?.home ?? null,
      away_score: match.score?.fullTime?.away ?? match.score?.regularTime?.away ?? null,
      venue: match.venue || null,
      city: null,
      current_minute: match.minute || null,
      updated_at: new Date().toISOString()
    }))
    .filter((match) => match.home_team_id && match.away_team_id && match.starts_at);

  const syncedMatches = await upsertJson("matches", matches, "provider_id");
  const defaultMarkets = await ensureDefaultMarketsForMatches(syncedMatches);
  let bracketLinks = 0;
  try {
    bracketLinks = await linkFootballDataBracketMatches(matchesPayload, syncedMatches);
  } catch (error) {
    await recordSyncRun({
      provider: "football-data.org",
      jobType: "bracket-links",
      status: "failed",
      requestCount: 0,
      message: error instanceof Error ? error.message : String(error)
    });
  }
  await recordSyncRun({
    provider: "football-data.org",
    jobType: "fixtures",
    status: "success",
    requestCount: 1,
    message: `Synced ${matches.length} World Cup fixtures and ${teamsByProvider.size} teams from football-data.org; added ${defaultMarkets} default markets; linked ${bracketLinks} bracket matches.`
  });

  return {
    provider: "football-data.org",
    status: "success",
    requests: 1,
    teams: teamsByProvider.size,
    matches: matches.length,
    bracketLinks,
    defaultMarkets
  };
}

async function ensureDefaultMarketsForMatches(matches) {
  const rows = [];
  for (const match of matches || []) {
    if (!match.id || !match.starts_at) continue;
    rows.push(
      defaultMarket(match, "correct_score", "Dự đoán tỷ số", "exact", "Tỷ số chính xác", null, 2.45, "internal"),
      defaultMarket(match, "match_result", "Kết quả 1X2", "home", "Đội nhà thắng", null, 1.85, "internal"),
      defaultMarket(match, "match_result", "Kết quả 1X2", "draw", "Hòa", null, 3.10, "internal"),
      defaultMarket(match, "match_result", "Kết quả 1X2", "away", "Đội khách thắng", null, 2.05, "internal"),
      defaultMarket(match, "draw_no_bet", "Draw no bet", "home", "Home DNB", null, 1.65, "internal"),
      defaultMarket(match, "draw_no_bet", "Draw no bet", "away", "Away DNB", null, 1.75, "internal"),
      defaultMarket(match, "total_goals", "Tổng bàn thắng 2.5", "over", "Tài 2.5", 2.5, 1.92, "internal"),
      defaultMarket(match, "total_goals", "Tổng bàn thắng 2.5", "under", "Xỉu 2.5", 2.5, 1.88, "internal"),
      defaultMarket(match, "btts", "Hai đội cùng ghi bàn", "yes", "Có", null, 1.95, "internal"),
      defaultMarket(match, "btts", "Hai đội cùng ghi bàn", "no", "Không", null, 1.82, "internal"),
      defaultMarket(match, "corners_total", "Tổng phạt góc 8.5", "over", "Tài góc 8.5", 8.5, 1.90, "internal"),
      defaultMarket(match, "corners_total", "Tổng phạt góc 8.5", "under", "Xỉu góc 8.5", 8.5, 1.90, "internal"),
      defaultMarket(match, "cards_total", "Tổng thẻ 3.5", "over", "Tài thẻ 3.5", 3.5, 1.90, "internal"),
      defaultMarket(match, "cards_total", "Tổng thẻ 3.5", "under", "Xỉu thẻ 3.5", 3.5, 1.90, "internal")
    );
  }
  return upsertJsonMinimal("match_markets", rows, "match_id,market_key,selection_key,line_key");
}

function defaultMarket(match, marketKey, label, selectionKey, selectionLabel, line, oddsMultiplier, source) {
  return {
    match_id: match.id,
    market_key: marketKey,
    label,
    selection_key: selectionKey,
    selection_label: selectionLabel,
    line,
    odds_multiplier: oddsMultiplier,
    is_open: true,
    source,
    closes_at: match.starts_at,
    extra_json: { provider: "default-market", generated_at: new Date().toISOString() }
  };
}

async function linkFootballDataBracketMatches(matchesPayload, syncedMatches) {
  const idByProvider = new Map((syncedMatches || []).map((match) => [match.provider_id, match.id]));
  const ordered = [...(matchesPayload || [])]
    .filter((match) => match.id && match.utcDate)
    .sort((left, right) => new Date(left.utcDate).getTime() - new Date(right.utcDate).getTime() || Number(left.id) - Number(right.id));

  if (ordered.length < 104) {
    return 0;
  }

  let linked = 0;
  for (let index = 72; index < Math.min(104, ordered.length); index += 1) {
    const matchNo = index + 1;
    const matchId = idByProvider.get(`fd-${ordered[index].id}`);
    if (!matchId) continue;
    await patchJson("bracket_matches", [`match_no=eq.${matchNo}`], { match_id: matchId, updated_at: new Date().toISOString() });
    linked += 1;
  }
  return linked;
}

async function syncApiFootballStats(maxFixtures = DEFAULT_MAX_STATS_FIXTURES) {
  if (!env("API_FOOTBALL_KEY")) {
    await recordSyncRun({
      provider: "api-football",
      jobType: "statistics",
      status: "skipped",
      requestCount: 0,
      message: "API_FOOTBALL_KEY is not configured."
    });
    return { provider: "api-football", status: "skipped", requests: 0, matches: 0, stats: 0 };
  }

  const matches = await getMatchesForStatsSync(maxFixtures);
  if (!matches.length) {
    await recordSyncRun({
      provider: "api-football",
      jobType: "statistics",
      status: "skipped",
      requestCount: 0,
      message: "No live or recently finished matches need statistics sync."
    });
    return { provider: "api-football", status: "skipped", requests: 0, matches: 0, stats: 0 };
  }

  const rows = [];
  let requests = 0;
  for (const match of matches) {
    const payload = await apiFootball("/fixtures/statistics", { fixture: match.provider_id });
    requests += 1;
    const statsByTeam = teamStatsByProviderId(payload);
    const homeStats = statsByTeam.get(String(match.home_team?.provider_id));
    const awayStats = statsByTeam.get(String(match.away_team?.provider_id));
    if (!homeStats || !awayStats) continue;

    rows.push({
      match_id: match.id,
      corners_home: findStatistic(homeStats, "Corner Kicks"),
      corners_away: findStatistic(awayStats, "Corner Kicks"),
      yellow_cards_home: findStatistic(homeStats, "Yellow Cards"),
      yellow_cards_away: findStatistic(awayStats, "Yellow Cards"),
      red_cards_home: findStatistic(homeStats, "Red Cards"),
      red_cards_away: findStatistic(awayStats, "Red Cards"),
      payload_json: payload,
      updated_at: new Date().toISOString()
    });
  }

  await upsertJson("match_stats", rows, "match_id");
  await recordSyncRun({
    provider: "api-football",
    jobType: "statistics",
    status: "success",
    requestCount: requests,
    message: `Synced statistics for ${rows.length}/${matches.length} candidate matches.`
  });

  return {
    provider: "api-football",
    status: "success",
    requests,
    matches: matches.length,
    stats: rows.length
  };
}

async function syncOddsSummary() {
  if (!env("ODDS_API_KEY")) {
    await recordSyncRun({
      provider: "the-odds-api",
      jobType: "odds",
      status: "skipped",
      requestCount: 0,
      message: "ODDS_API_KEY is not configured."
    });
    return { provider: "the-odds-api", status: "skipped", requests: 0, events: 0 };
  }

  const events = await oddsApi(`/sports/${WORLD_CUP_SPORT_KEY}/odds`, {
    regions: "eu",
    markets: "h2h,totals,draw_no_bet,outrights",
    oddsFormat: "decimal"
  });

  const matches = await getMatchesForOddsMapping();
  const teams = await getTeamsForOutrightMapping();
  const outrightClosesAt = matches[0]?.starts_at || "2026-06-11T19:00:00Z";
  let matchedEvents = 0;
  let updatedMarkets = 0;
  let updatedOutrights = 0;

  for (const event of events) {
    const matched = matchOddsEvent(event, matches);
    if (!matched) continue;
    matchedEvents += 1;
    const candidates = bestPricesForEvent(event, matched.match, matched.reversed)
      .map((candidate) => ({ ...candidate, closes_at: matched.match.starts_at }));

    for (const candidate of candidates) {
      const market = await upsertMarketFromOdds(candidate);
      await insertOddsSnapshot(market, candidate);
      updatedMarkets += 1;
    }
  }

  for (const candidate of bestOutrightPrices(events, teams)) {
    await upsertOutrightMarketFromOdds(candidate, outrightClosesAt);
    updatedOutrights += 1;
  }

  await recordSyncRun({
    provider: "the-odds-api",
    jobType: "odds",
    status: "success",
    requestCount: 1,
    message: `Fetched ${events.length} World Cup odds events; matched ${matchedEvents}; updated ${updatedMarkets} match markets and ${updatedOutrights} outrights.`
  });
  return { provider: "the-odds-api", status: "success", requests: 1, events: events.length, matchedEvents, updatedMarkets, updatedOutrights };
}

async function runProviderJob({ provider, jobType, fallback, task }) {
  try {
    return await task();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await recordSyncRun({
      provider,
      jobType,
      status: "failed",
      requestCount: 0,
      message
    });
    return {
      provider,
      status: "failed",
      requests: 0,
      error: message,
      ...fallback
    };
  }
}

export default async function handler(request, response) {
  if (!["GET", "POST"].includes(request.method)) {
    return send(response, 405, { error: "Method not allowed" });
  }
  if (!env("SUPABASE_URL") || !env("SUPABASE_SERVICE_ROLE_KEY")) {
    return send(response, 500, { error: "Supabase service env vars are missing" });
  }

  const auth = await requireAdminOrSecret(request);
  if (auth.error) {
    return send(response, auth.status, { error: auth.error });
  }

  let body = {};
  if (request.method === "POST") {
    body = await readJson(request);
  }
  const includeOdds = body.includeOdds !== false;
  const includeStats = body.includeStats !== false;
  const maxStatsFixtures = Math.max(
    0,
    Math.min(50, Number(body.maxStatsFixtures || env("MAX_STATS_FIXTURES") || DEFAULT_MAX_STATS_FIXTURES))
  );

  const fixtureResult = await runProviderJob({
    provider: "api-football",
    jobType: "fixtures",
    fallback: { teams: 0, matches: 0 },
    task: syncApiFootballFixtures
  });
  const footballDataResult = fixtureResult.status === "failed"
    ? await runProviderJob({
        provider: "football-data.org",
        jobType: "fixtures",
        fallback: { teams: 0, matches: 0 },
        task: syncFootballDataFixtures
      })
    : { provider: "football-data.org", status: "skipped", requests: 0, teams: 0, matches: 0 };
  const statsResult = includeStats
    ? await runProviderJob({
        provider: "api-football",
        jobType: "statistics",
        fallback: { matches: 0, stats: 0 },
        task: () => syncApiFootballStats(maxStatsFixtures)
      })
    : { provider: "api-football", status: "skipped", requests: 0, matches: 0, stats: 0 };
  const oddsResult = includeOdds
    ? await runProviderJob({
        provider: "the-odds-api",
        jobType: "odds",
        fallback: { events: 0, matchedEvents: 0, updatedMarkets: 0, updatedOutrights: 0 },
        task: syncOddsSummary
      })
    : { provider: "the-odds-api", status: "skipped", requests: 0, events: 0 };

  const results = [fixtureResult, footballDataResult, statsResult, oddsResult];
  const status = results.some((result) => result.status === "failed") ? "partial" : "ok";
  return send(response, 200, { status, fixtureResult, footballDataResult, statsResult, oddsResult });
}
