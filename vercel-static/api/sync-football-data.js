const API_FOOTBALL_BASE_URL = "https://v3.football.api-sports.io";
const ODDS_API_BASE_URL = "https://api.the-odds-api.com/v4";
const FOOTBALL_DATA_BASE_URL = "https://api.football-data.org/v4";
const WORLD_CUP_LEAGUE_ID = 1;
const WORLD_CUP_SEASON = 2026;
const FOOTBALL_DATA_WORLD_CUP_CODE = "WC";
const WORLD_CUP_SPORT_KEY = "soccer_fifa_world_cup";
const FIFA_RANKING_URL = "https://inside.fifa.com/fifa-world-ranking/men";
const FIFA_RANKING_API_URL = "https://api.fifa.com/api/v3/fifarankings/rankings/live?gender=1&sportType=0&language=en";
const FIFA_RANKING_SOURCE = "FIFA/Coca-Cola Men's World Ranking";
const FIFA_API_BASE_URL = "https://api.fifa.com/api/v3";
const FIFA_WORLD_CUP_COMPETITION_ID = 17;
const FIFA_WORLD_CUP_SEASON_ID = 285023;
const FIFA_TEAM_SOURCE = `FIFA team API (${FIFA_API_BASE_URL}/competitions/teams/${FIFA_WORLD_CUP_SEASON_ID})`;
const FIFA_SQUAD_SOURCE = `FIFA squad API (${FIFA_API_BASE_URL}/teams/{id}/squad?idCompetition=${FIFA_WORLD_CUP_COMPETITION_ID}&idSeason=${FIFA_WORLD_CUP_SEASON_ID})`;
const ODDS_MATCH_WINDOW_HOURS = 36;
const DEFAULT_MAX_STATS_FIXTURES = 12;
const DEFAULT_MAX_SQUAD_TEAMS = 48;
const DEFAULT_MAX_TRANSFERMARKT_TEAMS = 48;
const TRANSFERMARKT_BASE_URL = "https://www.transfermarkt.com";
const TRANSFERMARKT_PARTICIPANTS_URL = `${TRANSFERMARKT_BASE_URL}/world-cup/teilnehmer/pokalwettbewerb/FIWC`;
const TRANSFERMARKT_SOURCE = `${TRANSFERMARKT_PARTICIPANTS_URL} and team squad pages`;
const TRANSFERMARKT_DELAY_MS = 650;
const STAT_SYNC_WINDOW_HOURS = 96;
const LIVE_STATUSES = new Set(["1H", "HT", "2H", "ET", "BT", "P", "INT", "LIVE"]);
const FINAL_STATUSES = new Set(["FT", "AET", "PEN", "FT_PEN"]);
const WORLD_CUP_TITLE_YEARS = {
  ARG: [1978, 1986, 2022],
  BRA: [1958, 1962, 1970, 1994, 2002],
  ENG: [1966],
  ESP: [2010],
  FRA: [1998, 2018],
  GER: [1954, 1974, 1990, 2014],
  URU: [1930, 1950]
};

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

async function fifaRankingPage() {
  const response = await fetch(FIFA_RANKING_URL, {
    headers: {
      Accept: "text/html,application/json",
      "User-Agent": "WorldCup Predict ranking sync (+https://inside.fifa.com/fifa-world-ranking/men)"
    }
  });
  if (!response.ok) {
    throw new Error(`FIFA ranking page failed: ${response.status} ${await response.text()}`);
  }
  return response.text();
}

async function fifaRankingsLive() {
  const response = await fetch(FIFA_RANKING_API_URL, {
    headers: {
      Accept: "application/json",
      "User-Agent": "WorldCup Predict ranking sync (+https://inside.fifa.com/fifa-world-ranking/men)"
    }
  });
  if (!response.ok) {
    throw new Error(`FIFA live ranking API failed: ${response.status} ${await response.text()}`);
  }
  return response.json();
}

async function fifaApi(path, params = {}) {
  const url = new URL(`${FIFA_API_BASE_URL}${path}`);
  Object.entries({ language: "en", ...params }).forEach(([key, value]) => url.searchParams.set(key, String(value)));
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "WorldCup Predict FIFA profile sync (+https://www.fifa.com)"
    }
  });
  if (!response.ok) {
    throw new Error(`FIFA API ${path} failed: ${response.status} ${await response.text()}`);
  }
  return response.json();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function transfermarktFetch(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "WorldCup Predict admin Transfermarkt sync (+private admin-triggered sync)"
      }
    });
    if (!response.ok) {
      throw new Error(`Transfermarkt fetch failed: ${response.status} ${await response.text()}`);
    }
    return response.text();
  } finally {
    clearTimeout(timeout);
  }
}

function decodeHtml(value) {
  return String(value || "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&eacute;/g, "e")
    .replace(/&uuml;/g, "u")
    .replace(/&ccedil;/g, "c")
    .replace(/&ntilde;/g, "n")
    .replace(/&aacute;/g, "a")
    .replace(/&iacute;/g, "i")
    .replace(/&oacute;/g, "o")
    .replace(/&uacute;/g, "u");
}

function stripHtml(value) {
  return decodeHtml(String(value || "").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function attrValue(tag, name) {
  const match = String(tag || "").match(new RegExp(`${name}=["']([^"']+)["']`, "i"));
  return match ? decodeHtml(match[1]) : "";
}

function absoluteTransfermarktUrl(path) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return `${TRANSFERMARKT_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

function parseMarketValueLabel(label) {
  const text = decodeHtml(label).replace(/\s+/g, "").trim();
  const match = text.match(/(?:€|EUR)?([0-9]+(?:[.,][0-9]+)?)(bn|m|k)?/i);
  if (!match) return null;
  const amount = Number(match[1].replace(",", "."));
  if (!Number.isFinite(amount)) return null;
  const suffix = String(match[2] || "").toLowerCase();
  const multiplier = suffix === "bn" ? 1000000000 : suffix === "m" ? 1000000 : suffix === "k" ? 1000 : 1;
  return Number((amount * multiplier).toFixed(2));
}

function marketValueLabels(html) {
  return [...String(html || "").matchAll(/€\s*[0-9]+(?:[.,][0-9]+)?\s*(?:bn|m|k)?/gi)]
    .map((match) => decodeHtml(match[0]).replace(/\s+/g, ""));
}

function transfermarktSquadUrl(teamUrl) {
  const match = String(teamUrl || "").match(/\/([^/]+)\/(?:startseite|kader)\/verein\/(\d+)/);
  if (!match) return "";
  return `${TRANSFERMARKT_BASE_URL}/${match[1]}/kader/verein/${match[2]}/saison_id/2026/sort/marketValueRaw`;
}

const TRANSFERMARKT_TEAM_ALIASES = {
  "bosnia herzegovina": "BIH",
  "cape verde": "CPV",
  "czech republic": "CZE",
  "czechia": "CZE",
  "democratic republic of the congo": "COD",
  "dr congo": "COD",
  "congo dr": "COD",
  "curacao": "CUW",
  "ivory coast": "CIV",
  "cote d ivoire": "CIV",
  "iran": "IRN",
  "ir iran": "IRN",
  "south korea": "KOR",
  "korea republic": "KOR",
  "turkiye": "TUR",
  "turkey": "TUR",
  "united states": "USA",
  "usa": "USA"
};

function transfermarktTeamCodeForName(name) {
  return TRANSFERMARKT_TEAM_ALIASES[normalizeTeamName(name)] || "";
}

function parseTransfermarktParticipants(html) {
  const rows = [...String(html || "").matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
  const teams = [];
  const seenIds = new Set();
  for (const rowMatch of rows) {
    const row = rowMatch[1];
    const linkMatch = row.match(/<a[^>]+href=["']([^"']*\/startseite\/verein\/(\d+)[^"']*)["'][^>]*>([\s\S]*?)<\/a>/i);
    if (!linkMatch || seenIds.has(linkMatch[2])) continue;
    const linkTag = linkMatch[0];
    const name = attrValue(linkTag, "title") || stripHtml(linkMatch[3]);
    if (!name) continue;
    const valueLabels = marketValueLabels(row);
    const squadMarketValueLabel = valueLabels[0] || "";
    teams.push({
      transfermarkt_team_id: linkMatch[2],
      transfermarkt_url: absoluteTransfermarktUrl(linkMatch[1]),
      squad_url: transfermarktSquadUrl(absoluteTransfermarktUrl(linkMatch[1])),
      name,
      alias_code: transfermarktTeamCodeForName(name),
      squad_market_value_label: squadMarketValueLabel,
      squad_market_value_eur: parseMarketValueLabel(squadMarketValueLabel),
      squad_value_rank: teams.length + 1
    });
    seenIds.add(linkMatch[2]);
  }
  return teams;
}

function textLinesFromHtml(html) {
  return decodeHtml(String(html || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(?:div|td|tr|span|a)>/gi, "\n")
    .replace(/<[^>]+>/g, " "))
    .split(/\n+/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function parseTransfermarktSquad(html, team) {
  const rows = [...String(html || "").matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
  const players = [];
  const seenIds = new Set();
  for (const rowMatch of rows) {
    const row = rowMatch[1];
    const playerLinks = [...row.matchAll(/<a[^>]+href=["']([^"']*\/profil\/spieler\/(\d+)[^"']*)["']([^>]*)>([\s\S]*?)<\/a>/gi)];
    let playerLink = null;
    for (const candidate of playerLinks) {
      const candidateName = attrValue(candidate[0], "title") || stripHtml(candidate[4]);
      if (candidateName && !/^\d+$/.test(candidateName)) {
        playerLink = { href: candidate[1], id: candidate[2], name: candidateName };
        break;
      }
    }
    if (!playerLink || seenIds.has(playerLink.id)) continue;
    const valueLabels = marketValueLabels(row);
    const marketValueLabel = valueLabels[valueLabels.length - 1] || "";
    const lines = textLinesFromHtml(row);
    const nameIndex = lines.findIndex((line) => normalizeTeamName(line) === normalizeTeamName(playerLink.name));
    const position = nameIndex >= 0 ? lines.slice(nameIndex + 1).find((line) => !/^\d+$/.test(line) && !/^€/.test(line)) : "";
    const clubImage = [...row.matchAll(/<img[^>]+(?:title|alt)=["']([^"']+)["'][^>]*>/gi)]
      .map((match) => decodeHtml(match[1]))
      .find((title) => title && normalizeTeamName(title) !== normalizeTeamName(team.name) && normalizeTeamName(title) !== normalizeTeamName(playerLink.name));
    players.push({
      team_id: team.id,
      provider_id: `tm-${playerLink.id}`,
      transfermarkt_player_id: playerLink.id,
      transfermarkt_url: absoluteTransfermarktUrl(playerLink.href),
      name: playerLink.name,
      position: position || null,
      club: clubImage || null,
      market_value_label: marketValueLabel || null,
      market_value_eur: parseMarketValueLabel(marketValueLabel),
      market_value_updated_at: new Date().toISOString(),
      market_value_source: TRANSFERMARKT_SOURCE,
      source: "transfermarkt",
      updated_at: new Date().toISOString()
    });
    seenIds.add(playerLink.id);
  }
  return players;
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

async function getTeamsByCodes(codes) {
  const uniqueCodes = [...new Set(codes.filter(Boolean).map((code) => String(code).toUpperCase()))];
  if (!uniqueCodes.length) return new Map();
  const response = await supabaseFetch(
    `/rest/v1/teams?code=in.(${uniqueCodes.map(encodeURIComponent).join(",")})&select=id,code,provider_id`
  );
  if (!response.ok) {
    throw new Error(`Supabase read teams by code failed: ${response.status} ${await response.text()}`);
  }
  const teams = await response.json();
  return new Map(teams.map((team) => [team.code, team]));
}

async function upsertProviderTeamsByCode(teams) {
  const rows = [...teams];
  const existingByCode = await getTeamsByCodes(rows.map((team) => team.code));
  const newOrRefreshRows = [];
  let linkedExisting = 0;

  for (const row of rows) {
    const existing = existingByCode.get(row.code);
    if (!existing) {
      newOrRefreshRows.push(row);
      continue;
    }
    if (existing.provider_id === row.provider_id) {
      newOrRefreshRows.push(row);
      continue;
    }

    await patchJson("teams", [`code=eq.${encodeURIComponent(row.code)}`], {
      provider_id: row.provider_id,
      name: row.name,
      country: row.country,
      logo_url: row.logo_url
    });
    linkedExisting += 1;
  }

  const upserted = await upsertJson("teams", newOrRefreshRows, "provider_id");
  return { upserted, linkedExisting };
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

async function getTeamsForTransfermarktSync(limit, teamCode = "") {
  const filters = [
    "select=id,code,name,country,transfermarkt_team_id",
    "order=name.asc",
    `limit=${limit}`
  ];
  if (teamCode) filters.splice(1, 0, `code=eq.${encodeURIComponent(teamCode)}`);
  const response = await supabaseFetch(`/rest/v1/teams?${filters.join("&")}`);
  if (!response.ok) {
    throw new Error(`Supabase read teams for Transfermarkt sync failed: ${response.status} ${await response.text()}`);
  }
  return response.json();
}

async function getExistingPlayersForTeams(teamIds) {
  const ids = [...new Set(teamIds.filter(Boolean))];
  if (!ids.length) return [];
  const response = await supabaseFetch(
    `/rest/v1/team_players?team_id=in.(${ids.join(",")})&select=id,team_id,name,transfermarkt_player_id`
  );
  if (!response.ok) {
    throw new Error(`Supabase read team_players for Transfermarkt merge failed: ${response.status} ${await response.text()}`);
  }
  return response.json();
}

async function getTeamsForRankingSync() {
  const response = await supabaseFetch("/rest/v1/teams?select=id,code,name,country&order=name.asc");
  if (!response.ok) {
    throw new Error(`Supabase read teams for FIFA ranking sync failed: ${response.status} ${await response.text()}`);
  }
  return response.json();
}

async function getTeamsForFifaSquadSync(limit, teamCode = "") {
  const filters = [
    "select=id,code,name,country,logo_url,flag_url,fifa_team_id,coach_name,world_cup_titles,world_cup_title_years",
    "order=name.asc",
    `limit=${limit}`
  ];
  if (teamCode) filters.splice(1, 0, `code=eq.${encodeURIComponent(teamCode)}`);
  const response = await supabaseFetch(`/rest/v1/teams?${filters.join("&")}`);
  if (!response.ok) {
    throw new Error(`Supabase read teams for FIFA squad sync failed: ${response.status} ${await response.text()}`);
  }
  return response.json();
}

async function getTeamsForApiFootballSquadSync(limit) {
  const response = await supabaseFetch(
    `/rest/v1/teams?select=id,provider_id,code,name&provider_id=not.is.null&order=name.asc&limit=${limit}`
  );
  if (!response.ok) {
    throw new Error(`Supabase read teams for squad sync failed: ${response.status} ${await response.text()}`);
  }
  const teams = await response.json();
  return teams.filter((team) => /^\d+$/.test(String(team.provider_id || "")));
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

function fifaRankingDescription(row) {
  const names = Array.isArray(row?.TeamName) ? row.TeamName : [];
  return names.find((item) => item.Locale === "en-GB")?.Description
    || names.find((item) => String(item.Locale || "").toLowerCase().startsWith("en"))?.Description
    || names[0]?.Description
    || "";
}

function fifaRankingRows(payload) {
  const results = Array.isArray(payload?.Results) ? payload.Results : [];
  return results
    .map((row) => {
      const description = fifaRankingDescription(row);
      const rank = Number(row?.Rank);
      const points = Number(row?.TotalPoints);
      return {
        code: String(row?.IdCountry || "").toUpperCase(),
        description,
        fifa_rank: Number.isInteger(rank) ? rank : null,
        fifa_points: Number.isFinite(points) ? Number(points.toFixed(2)) : null
      };
    })
    .filter((row) => row.description && row.fifa_rank && row.fifa_points !== null);
}

function localizedDescription(value) {
  const rows = Array.isArray(value) ? value : [];
  return rows.find((item) => item.Locale === "en-GB")?.Description
    || rows.find((item) => String(item.Locale || "").toLowerCase().startsWith("en"))?.Description
    || rows[0]?.Description
    || "";
}

function fifaTeamRows(payload) {
  return Array.isArray(payload?.Results) ? payload.Results : Array.isArray(payload) ? payload : [];
}

function fifaTeamName(row) {
  return localizedDescription(row?.TeamName)
    || localizedDescription(row?.ShortClubName)
    || row?.Name
    || row?.TeamName
    || "";
}

function fifaCoachName(row) {
  return localizedDescription(row?.CoachName)
    || localizedDescription(row?.TeamCoachName)
    || localizedDescription(row?.ManagerName)
    || row?.CoachName
    || row?.TeamCoachName
    || row?.ManagerName
    || null;
}

function fifaPictureUrl(value, format = "sq", size = 4) {
  const raw = typeof value === "string" ? value : value?.PictureUrl;
  if (!raw) return null;
  return raw.replaceAll("{format}", format).replaceAll("{size}", String(size));
}

function numberOrNull(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function integerOrNull(value) {
  const numeric = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(numeric) ? numeric : null;
}

function dateOnly(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString().slice(0, 10) : null;
}

function titleYearsForCode(code) {
  return WORLD_CUP_TITLE_YEARS[String(code || "").toUpperCase()] || [];
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

  const teamSync = await upsertProviderTeamsByCode(teamsByProvider.values());
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
    message: `Synced ${matches.length} fixtures and ${teamsByProvider.size} teams for World Cup 2026; linked ${teamSync.linkedExisting} seeded teams by code.`
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
  const byProvider = new Map((syncedMatches || []).map((match) => [match.provider_id, match]));
  const ordered = [...(matchesPayload || [])]
    .filter((match) => match.id && match.utcDate)
    .sort((left, right) => new Date(left.utcDate).getTime() - new Date(right.utcDate).getTime() || Number(left.id) - Number(right.id));

  if (ordered.length < 104) {
    return 0;
  }

  let linked = 0;
  for (let index = 72; index < Math.min(104, ordered.length); index += 1) {
    const matchNo = index + 1;
    const synced = byProvider.get(`fd-${ordered[index].id}`);
    if (!synced?.id) continue;
    await patchJson("bracket_matches", [`match_no=eq.${matchNo}`], {
      match_id: synced.id,
      home_team_id: synced.home_team_id,
      away_team_id: synced.away_team_id,
      starts_at: synced.starts_at,
      is_confirmed: Boolean(synced.home_team_id && synced.away_team_id),
      updated_at: new Date().toISOString()
    });
    linked += 1;
  }
  return linked;
}

async function syncFifaRankings() {
  const payload = await fifaRankingsLive();
  const rows = fifaRankingRows(payload);
  const teams = await getTeamsForRankingSync();
  const teamsByCode = new Map(teams.map((team) => [String(team.code || "").toUpperCase(), team]));
  const teamsByDescription = new Map();
  for (const team of teams) {
    for (const value of [team.name, team.country, team.code]) {
      const key = normalizeTeamName(value);
      if (key && !teamsByDescription.has(key)) {
        teamsByDescription.set(key, team);
      }
    }
  }

  const updatedAt = new Date().toISOString();
  let updated = 0;
  const unmatched = [];
  for (const row of rows) {
    const team = teamsByDescription.get(normalizeTeamName(row.description)) || teamsByCode.get(row.code);
    if (!team) {
      unmatched.push(`${row.description}${row.code ? ` (${row.code})` : ""}`);
      continue;
    }
    const result = await patchJson("teams", [`id=eq.${team.id}`], {
      fifa_rank: row.fifa_rank,
      fifa_points: row.fifa_points,
      rating_source: `${FIFA_RANKING_SOURCE} live API (${FIFA_RANKING_API_URL})`,
      rating_updated_at: updatedAt
    });
    updated += result.length;
  }

  await recordSyncRun({
    provider: "fifa",
    jobType: "rankings",
    status: "success",
    requestCount: 1,
    message: `Applied ${updated}/${rows.length} FIFA live ranking rows from ${FIFA_RANKING_API_URL}; unmatched examples: ${unmatched.slice(0, 8).join(", ") || "none"}.`
  });

  return {
    provider: "fifa",
    status: "success",
    requests: 1,
    rankings: updated,
    fetched: rows.length,
    unmatched: unmatched.length,
    source: FIFA_RANKING_API_URL,
    updatedAt
  };
}

function matchFifaTeamRows(teams, fifaRows) {
  const byCode = new Map();
  const byName = new Map();
  for (const row of fifaRows) {
    const code = String(row?.IdCountry || row?.TeamCode || row?.CountryCode || "").toUpperCase();
    const name = fifaTeamName(row);
    if (code && !byCode.has(code)) byCode.set(code, row);
    const nameKey = normalizeTeamName(name);
    if (nameKey && !byName.has(nameKey)) byName.set(nameKey, row);
  }

  return teams.map((team) => {
    const row = byCode.get(String(team.code || "").toUpperCase())
      || byName.get(normalizeTeamName(team.name))
      || byName.get(normalizeTeamName(team.country));
    return { team, row };
  });
}

async function syncFifaTeamProfiles(maxTeams = DEFAULT_MAX_SQUAD_TEAMS, teamCode = "") {
  const teams = await getTeamsForFifaSquadSync(maxTeams, teamCode);
  if (!teams.length) {
    await recordSyncRun({
      provider: "fifa",
      jobType: "team-profiles",
      status: "skipped",
      requestCount: 0,
      message: teamCode ? `No Supabase team found for ${teamCode}.` : "No Supabase teams are available for FIFA profile sync."
    });
    return { provider: "fifa", status: "skipped", requests: 0, teams: 0, matched: 0 };
  }

  const payload = await fifaApi(`/competitions/teams/${FIFA_WORLD_CUP_SEASON_ID}`);
  const matches = matchFifaTeamRows(teams, fifaTeamRows(payload));
  const updatedAt = new Date().toISOString();
  let matched = 0;
  const unmatched = [];

  for (const { team, row } of matches) {
    const titleYears = titleYearsForCode(team.code);
    if (!row) {
      unmatched.push(`${team.name} (${team.code})`);
      await patchJson("teams", [`id=eq.${team.id}`], {
        world_cup_titles: titleYears.length,
        world_cup_title_years: titleYears,
        coach_name: team.coach_name || "TBA",
        profile_updated_at: updatedAt
      });
      continue;
    }

    const fifaTeamId = row?.IdTeam || row?.TeamId || row?.Id;
    await patchJson("teams", [`id=eq.${team.id}`], {
      fifa_team_id: fifaTeamId ? String(fifaTeamId) : team.fifa_team_id,
      logo_url: fifaPictureUrl(row?.PictureUrl, "sq", 4) || team.logo_url || null,
      flag_url: fifaPictureUrl(row?.PictureUrl, "sq", 4) || team.flag_url || null,
      fifa_profile_json: row,
      coach_name: fifaCoachName(row) || team.coach_name || "TBA",
      world_cup_titles: titleYears.length,
      world_cup_title_years: titleYears,
      profile_updated_at: updatedAt
    });
    matched += 1;
  }

  await recordSyncRun({
    provider: "fifa",
    jobType: "team-profiles",
    status: "success",
    requestCount: 1,
    message: `Mapped ${matched}/${teams.length} teams to FIFA team IDs from ${FIFA_TEAM_SOURCE}; unmatched examples: ${unmatched.slice(0, 8).join(", ") || "none"}.`
  });

  return {
    provider: "fifa",
    status: "success",
    requests: 1,
    teams: teams.length,
    matched,
    unmatched: unmatched.length,
    source: FIFA_TEAM_SOURCE
  };
}

function fifaPlayerRow(player, team) {
  const name = localizedDescription(player?.PlayerName) || localizedDescription(player?.ShortName);
  const providerId = player?.IdPlayer || player?.Properties?.IdIFES;
  const position = localizedDescription(player?.RealPositionLocalized) || localizedDescription(player?.PositionLocalized);
  const photoUrl = fifaPictureUrl(player?.PlayerPicture, "sq", 4)
    || fifaPictureUrl(player?.PictureUrl, "sq", 4)
    || fifaPictureUrl(player?.ThumbnailUrl, "sq", 4);
  if (!name || !providerId) return null;
  return {
    team_id: team.id,
    provider_id: `fifa-${providerId}`,
    name,
    position: position || null,
    shirt_number: integerOrNull(player?.JerseyNum),
    date_of_birth: dateOnly(player?.BirthDate),
    club: player?.ClubName || player?.Club || null,
    photo_url: photoUrl,
    height_cm: numberOrNull(player?.Height),
    weight_kg: numberOrNull(player?.Weight),
    preferred_foot: player?.PreferredFoot ? String(player.PreferredFoot) : null,
    fifa_position_code: integerOrNull(player?.Position),
    real_position: integerOrNull(player?.RealPosition),
    position_side: integerOrNull(player?.RealPositionSide),
    active_status: integerOrNull(player?.ActiveStatus),
    rating_source: FIFA_SQUAD_SOURCE,
    rating_updated_at: new Date().toISOString(),
    source: "fifa",
    fifa_payload_json: player,
    updated_at: new Date().toISOString()
  };
}

async function syncFifaSquads(maxTeams = DEFAULT_MAX_SQUAD_TEAMS, teamCode = "") {
  let teams = await getTeamsForFifaSquadSync(maxTeams, teamCode);
  if (!teams.some((team) => team.fifa_team_id)) {
    await syncFifaTeamProfiles(maxTeams, teamCode);
    teams = await getTeamsForFifaSquadSync(maxTeams, teamCode);
  }
  teams = teams.filter((team) => team.fifa_team_id);
  if (!teams.length) {
    await recordSyncRun({
      provider: "fifa",
      jobType: "squads",
      status: "skipped",
      requestCount: 0,
      message: teamCode
        ? `No FIFA team ID is available for ${teamCode}; run team profile sync first.`
        : "No teams with FIFA team IDs are available for squad sync."
    });
    return { provider: "fifa", status: "skipped", requests: 0, teams: 0, players: 0 };
  }

  const rows = [];
  let requests = 0;
  for (const team of teams) {
    const payload = await fifaApi(`/teams/${team.fifa_team_id}/squad`, {
      idCompetition: FIFA_WORLD_CUP_COMPETITION_ID,
      idSeason: FIFA_WORLD_CUP_SEASON_ID
    });
    requests += 1;
    const squad = Array.isArray(payload?.Players) ? payload.Players : [];
    for (const player of squad) {
      const row = fifaPlayerRow(player, team);
      if (row) rows.push(row);
    }
  }

  await upsertJson("team_players", rows, "provider_id");
  await recordSyncRun({
    provider: "fifa",
    jobType: "squads",
    status: "success",
    requestCount: requests,
    message: `Synced ${rows.length} squad players for ${teams.length} teams from ${FIFA_SQUAD_SOURCE}.`
  });

  return {
    provider: "fifa",
    status: "success",
    requests,
    teams: teams.length,
    players: rows.length,
    source: FIFA_SQUAD_SOURCE
  };
}

function matchTransfermarktTeam(localTeam, transfermarktTeams, maps) {
  if (localTeam.transfermarkt_team_id && maps.byId.has(String(localTeam.transfermarkt_team_id))) {
    return maps.byId.get(String(localTeam.transfermarkt_team_id));
  }
  if (maps.byCode.has(String(localTeam.code || "").toUpperCase())) {
    return maps.byCode.get(String(localTeam.code || "").toUpperCase());
  }
  return maps.byName.get(normalizeTeamName(localTeam.name))
    || maps.byName.get(normalizeTeamName(localTeam.country))
    || transfermarktTeams.find((team) => normalizeTeamName(team.name) === normalizeTeamName(localTeam.name))
    || null;
}

function transfermarktTeamMaps(teams) {
  const byId = new Map();
  const byCode = new Map();
  const byName = new Map();
  for (const team of teams) {
    byId.set(String(team.transfermarkt_team_id), team);
    if (team.alias_code) byCode.set(team.alias_code, team);
    const nameKey = normalizeTeamName(team.name);
    if (nameKey && !byName.has(nameKey)) byName.set(nameKey, team);
  }
  return { byId, byCode, byName };
}

async function syncTransfermarktValues(maxTeams = DEFAULT_MAX_TRANSFERMARKT_TEAMS, teamCode = "") {
  const localTeams = await getTeamsForTransfermarktSync(maxTeams, teamCode);
  if (!localTeams.length) {
    await recordSyncRun({
      provider: "transfermarkt",
      jobType: "market-values",
      status: "skipped",
      requestCount: 0,
      message: teamCode ? `No Supabase team found for ${teamCode}.` : "No Supabase teams are available for Transfermarkt sync."
    });
    return { provider: "transfermarkt", status: "skipped", requests: 0, teams: 0, players: 0, errors: 0 };
  }

  const participantsHtml = await transfermarktFetch(TRANSFERMARKT_PARTICIPANTS_URL);
  let requests = 1;
  const transfermarktTeams = parseTransfermarktParticipants(participantsHtml);
  if (!transfermarktTeams.length) {
    throw new Error("Transfermarkt participants parser returned no teams.");
  }

  const maps = transfermarktTeamMaps(transfermarktTeams);
  const matchedTeams = [];
  const unmatched = [];
  const updatedAt = new Date().toISOString();
  for (const localTeam of localTeams) {
    const transfermarktTeam = matchTransfermarktTeam(localTeam, transfermarktTeams, maps);
    if (!transfermarktTeam) {
      unmatched.push(`${localTeam.name} (${localTeam.code})`);
      continue;
    }
    matchedTeams.push({ localTeam, transfermarktTeam });
    await patchJson("teams", [`id=eq.${localTeam.id}`], {
      transfermarkt_team_id: transfermarktTeam.transfermarkt_team_id,
      transfermarkt_url: transfermarktTeam.transfermarkt_url,
      squad_market_value_eur: transfermarktTeam.squad_market_value_eur,
      squad_market_value_label: transfermarktTeam.squad_market_value_label,
      squad_value_rank: transfermarktTeam.squad_value_rank,
      squad_value_updated_at: updatedAt,
      squad_value_source: TRANSFERMARKT_SOURCE
    });
  }

  const parsedPlayers = [];
  const errors = [];
  for (const { localTeam, transfermarktTeam } of matchedTeams) {
    if (!transfermarktTeam.squad_url) continue;
    if (requests > 1) await sleep(TRANSFERMARKT_DELAY_MS);
    try {
      const squadHtml = await transfermarktFetch(transfermarktTeam.squad_url);
      requests += 1;
      parsedPlayers.push(...parseTransfermarktSquad(squadHtml, {
        id: localTeam.id,
        code: localTeam.code,
        name: transfermarktTeam.name
      }));
    } catch (error) {
      errors.push(`${localTeam.code}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  const existingPlayers = await getExistingPlayersForTeams(matchedTeams.map(({ localTeam }) => localTeam.id));
  const byTransfermarktId = new Map();
  const byTeamName = new Map();
  for (const player of existingPlayers) {
    if (player.transfermarkt_player_id) byTransfermarktId.set(String(player.transfermarkt_player_id), player);
    byTeamName.set(`${player.team_id}:${normalizeTeamName(player.name)}`, player);
  }

  const insertRows = [];
  let updatedPlayers = 0;
  for (const player of parsedPlayers) {
    const existing = byTransfermarktId.get(String(player.transfermarkt_player_id))
      || byTeamName.get(`${player.team_id}:${normalizeTeamName(player.name)}`);
    if (!existing) {
      insertRows.push(player);
      byTransfermarktId.set(String(player.transfermarkt_player_id), player);
      byTeamName.set(`${player.team_id}:${normalizeTeamName(player.name)}`, player);
      continue;
    }
    const { provider_id: _providerId, team_id: _teamId, source: _source, ...patch } = player;
    await patchJson("team_players", [`id=eq.${existing.id}`], patch);
    updatedPlayers += 1;
  }
  const insertedPlayers = await upsertJson("team_players", insertRows, "provider_id");

  const status = errors.length || unmatched.length ? "partial" : "success";
  await recordSyncRun({
    provider: "transfermarkt",
    jobType: "market-values",
    status,
    requestCount: requests,
    message: `Updated ${matchedTeams.length}/${localTeams.length} teams and ${updatedPlayers + insertedPlayers.length} players from ${TRANSFERMARKT_SOURCE}; unmatched: ${unmatched.slice(0, 8).join(", ") || "none"}; errors: ${errors.slice(0, 5).join(" | ") || "none"}.`
  });

  return {
    provider: "transfermarkt",
    status,
    requests,
    teams: matchedTeams.length,
    fetchedTeams: transfermarktTeams.length,
    players: updatedPlayers + insertedPlayers.length,
    insertedPlayers: insertedPlayers.length,
    updatedPlayers,
    unmatched: unmatched.length,
    errors: errors.length,
    source: TRANSFERMARKT_SOURCE
  };
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
  const includeFixtures = body.includeFixtures !== false;
  const includeOdds = body.includeOdds !== false;
  const includeStats = body.includeStats !== false;
  const includeRankings = body.includeRankings !== false;
  const includeSquads = body.includeSquads !== false;
  const includeFifaProfiles = body.includeFifaProfiles !== false;
  const includeTransfermarkt = body.includeTransfermarkt === true;
  const fifaTeamCode = String(body.fifaTeamCode || "").trim().toUpperCase();
  const maxStatsFixtures = Math.max(
    0,
    Math.min(50, Number(body.maxStatsFixtures || env("MAX_STATS_FIXTURES") || DEFAULT_MAX_STATS_FIXTURES))
  );
  const maxSquadTeams = Math.max(
    0,
    Math.min(64, Number(body.maxSquadTeams || env("MAX_SQUAD_TEAMS") || DEFAULT_MAX_SQUAD_TEAMS))
  );
  const maxTransfermarktTeams = Math.max(
    0,
    Math.min(64, Number(body.maxTransfermarktTeams || env("MAX_TRANSFERMARKT_TEAMS") || DEFAULT_MAX_TRANSFERMARKT_TEAMS))
  );

  const fixtureResult = includeFixtures
    ? await runProviderJob({
        provider: "api-football",
        jobType: "fixtures",
        fallback: { teams: 0, matches: 0 },
        task: syncApiFootballFixtures
      })
    : { provider: "api-football", status: "skipped", requests: 0, teams: 0, matches: 0 };
  const footballDataResult = includeFixtures && fixtureResult.status === "failed"
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
  const rankingResult = includeRankings
    ? await runProviderJob({
        provider: "fifa",
        jobType: "rankings",
        fallback: { rankings: 0 },
        task: syncFifaRankings
      })
    : { provider: "fifa", status: "skipped", requests: 0, rankings: 0 };
  const fifaProfileResult = includeFifaProfiles
    ? await runProviderJob({
        provider: "fifa",
        jobType: "team-profiles",
        fallback: { teams: 0, matched: 0 },
        task: () => syncFifaTeamProfiles(maxSquadTeams, fifaTeamCode)
      })
    : { provider: "fifa", status: "skipped", requests: 0, teams: 0, matched: 0 };
  const squadResult = includeSquads
    ? await runProviderJob({
        provider: "fifa",
        jobType: "squads",
        fallback: { teams: 0, players: 0 },
        task: () => syncFifaSquads(maxSquadTeams, fifaTeamCode)
      })
    : { provider: "fifa", status: "skipped", requests: 0, teams: 0, players: 0 };
  const transfermarktResult = includeTransfermarkt
    ? await runProviderJob({
        provider: "transfermarkt",
        jobType: "market-values",
        fallback: { teams: 0, players: 0, errors: 0 },
        task: () => syncTransfermarktValues(maxTransfermarktTeams, fifaTeamCode)
      })
    : { provider: "transfermarkt", status: "skipped", requests: 0, teams: 0, players: 0, errors: 0 };
  const oddsResult = includeOdds
    ? await runProviderJob({
        provider: "the-odds-api",
        jobType: "odds",
        fallback: { events: 0, matchedEvents: 0, updatedMarkets: 0, updatedOutrights: 0 },
        task: syncOddsSummary
      })
    : { provider: "the-odds-api", status: "skipped", requests: 0, events: 0 };

  const results = [fixtureResult, footballDataResult, statsResult, rankingResult, fifaProfileResult, squadResult, transfermarktResult, oddsResult];
  const status = results.some((result) => result.status === "failed" || result.status === "partial") ? "partial" : "ok";
  return send(response, 200, { status, fixtureResult, footballDataResult, statsResult, rankingResult, fifaProfileResult, squadResult, transfermarktResult, oddsResult });
}
