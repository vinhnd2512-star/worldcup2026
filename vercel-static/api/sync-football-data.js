const API_FOOTBALL_BASE_URL = "https://v3.football.api-sports.io";
const ODDS_API_BASE_URL = "https://api.the-odds-api.com/v4";
const FOOTBALL_DATA_BASE_URL = "https://api.football-data.org/v4";
const ESPN_SOCCER_BASE = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world";
const WORLD_CUP_LEAGUE_ID = 1;
const WORLD_CUP_SEASON = 2026;
const FOOTBALL_DATA_WORLD_CUP_CODE = "WC";
const WORLD_CUP_SPORT_KEY = "soccer_fifa_world_cup";
const WORLD_CUP_WINNER_SPORT_KEY = "soccer_fifa_world_cup_winner";
const FIFA_RANKING_URL = "https://inside.fifa.com/fifa-world-ranking/men";
const FIFA_FANTASY_ROUNDS_URL = "https://play.fifa.com/json/fantasy/rounds.json";
const FIFA_CALENDAR_MATCHES_URL = `https://api.fifa.com/api/v3/calendar/matches`;
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
const ODDS_API_MAIN_MARKETS = "h2h,totals,spreads";
const ODDS_API_TOTALS_FALLBACK_MARKETS = "h2h,totals";
const ODDS_API_MATCH_FALLBACK_MARKETS = "h2h";
const ODDS_API_OUTRIGHT_MARKETS = "outrights";
const PROVIDER_MANAGED_MARKETS = ["match_result", "total_goals", "correct_score", "asian_handicap"];
const DEFAULT_ODDS_API_REGIONS = "eu";
const WORLD_CUP_TITLE_YEARS = {
  ARG: [1978, 1986, 2022],
  BRA: [1958, 1962, 1970, 1994, 2002],
  ENG: [1966],
  ESP: [2010],
  FRA: [1998, 2018],
  GER: [1954, 1974, 1990, 2014],
  URU: [1930, 1950]
};

const ODDS_TEAM_ALIASES = {
  "bosnia herzegovina": "bosnia and herzegovina",
  "cabo verde": "cape verde",
  "cote d ivoire": "ivory coast",
  "czech republic": "czechia",
  "congo dr": "democratic republic of the congo",
  "democratic republic of congo": "democratic republic of the congo",
  "dr congo": "democratic republic of the congo",
  "iran": "ir iran",
  "korea republic": "south korea",
  "turkiye": "turkey",
  "united states": "usa"
};

const ODDS_TEAM_CODE_ALIASES = {
  "argentina": "ARG",
  "australia": "AUS",
  "austria": "AUT",
  "belgium": "BEL",
  "bosnia and herzegovina": "BIH",
  "bosnia herzegovina": "BIH",
  "brazil": "BRA",
  "cabo verde": "CPV",
  "cape verde": "CPV",
  "canada": "CAN",
  "colombia": "COL",
  "congo dr": "COD",
  "cote d ivoire": "CIV",
  "curacao": "CUW",
  "czechia": "CZE",
  "czech republic": "CZE",
  "democratic republic of congo": "COD",
  "democratic republic of the congo": "COD",
  "dr congo": "COD",
  "ecuador": "ECU",
  "egypt": "EGY",
  "england": "ENG",
  "france": "FRA",
  "germany": "GER",
  "ghana": "GHA",
  "haiti": "HAI",
  "iran": "IRN",
  "ir iran": "IRN",
  "iraq": "IRQ",
  "ivory coast": "CIV",
  "japan": "JPN",
  "jordan": "JOR",
  "mexico": "MEX",
  "morocco": "MAR",
  "netherlands": "NED",
  "new zealand": "NZL",
  "norway": "NOR",
  "panama": "PAN",
  "paraguay": "PAR",
  "portugal": "POR",
  "qatar": "QAT",
  "saudi arabia": "KSA",
  "scotland": "SCO",
  "senegal": "SEN",
  "south africa": "RSA",
  "south korea": "KOR",
  "spain": "ESP",
  "sweden": "SWE",
  "switzerland": "SUI",
  "tunisia": "TUN",
  "turkey": "TUR",
  "turkiye": "TUR",
  "united states": "USA",
  "uruguay": "URU",
  "usa": "USA",
  "uzbekistan": "UZB"
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
  const quota = oddsQuotaFromHeaders(response);
  if (!response.ok) {
    throw new Error(`The Odds API ${path} failed: ${response.status} ${await response.text()}`);
  }
  return { data: await response.json(), quota };
}

function oddsQuotaFromHeaders(response) {
  const value = (name) => {
    const raw = response.headers.get(name);
    if (raw === null || raw === "") return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : raw;
  };
  return {
    remaining: value("x-requests-remaining"),
    used: value("x-requests-used"),
    last: value("x-requests-last")
  };
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
  "bosnia and herzegovina": "BIH",
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

function isMissingRelationError(error) {
  const message = error instanceof Error ? error.message : String(error || "");
  return message.includes("PGRST205") || message.includes("Could not find the table");
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

function completedMatchResultRows(matches, provider, source) {
  return (matches || [])
    .filter((match) =>
      match?.id &&
      isFinalResultStatus(match.status) &&
      match.home_score !== null &&
      match.home_score !== undefined &&
      match.away_score !== null &&
      match.away_score !== undefined
    )
    .map((match) => ({
      match_id: match.id,
      home_team_id: match.home_team_id,
      away_team_id: match.away_team_id,
      status: match.status,
      home_score: match.home_score,
      away_score: match.away_score,
      home_penalties: match.home_penalties ?? null,
      away_penalties: match.away_penalties ?? null,
      provider,
      source,
      provider_payload: {
        provider_id: match.provider_id || null,
        starts_at: match.starts_at || null
      },
      finished_at: match.updated_at || new Date().toISOString(),
      synced_at: new Date().toISOString()
    }));
}

async function upsertCompletedMatchResults(matches, provider, source) {
  const rows = completedMatchResultRows(matches, provider, source);
  if (!rows.length) return { resultRows: 0, completedMatchIds: [] };
  try {
    const saved = await upsertJson("match_results", rows, "match_id");
    return {
      resultRows: saved.length,
      completedMatchIds: rows.map((row) => row.match_id)
    };
  } catch (error) {
    if (!isMissingRelationError(error)) throw error;
    return { resultRows: 0, completedMatchIds: rows.map((row) => row.match_id) };
  }
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
    "/rest/v1/matches?select=id,starts_at,status,home_team_id,away_team_id,home_team:teams!matches_home_team_id_fkey(id,code,name),away_team:teams!matches_away_team_id_fkey(id,code,name)&order=starts_at.asc"
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
  const normalized = String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .toLowerCase()
    .replace(/\b(fc|cf|sc|the|national|team)\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  return ODDS_TEAM_ALIASES[normalized] || normalized;
}

function oddsTeamCode(value) {
  return ODDS_TEAM_CODE_ALIASES[normalizeTeamName(value)] || "";
}

function teamCodeOrAlias(team) {
  return String(team?.code || "").toUpperCase() || oddsTeamCode(team?.name);
}

function sameOddsTeam(providerName, localTeam) {
  const providerCode = oddsTeamCode(providerName);
  const localCode = teamCodeOrAlias(localTeam);
  if (providerCode && localCode) return providerCode === localCode;
  return normalizeTeamName(providerName) === normalizeTeamName(localTeam?.name);
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
  const candidates = [];

  for (const match of matches) {
    const timeDelta = hoursBetween(event.commence_time, match.starts_at);
    if (timeDelta > ODDS_MATCH_WINDOW_HOURS) continue;

    const sameOrder = sameOddsTeam(event.home_team, match.home_team) && sameOddsTeam(event.away_team, match.away_team);
    const reversed = sameOddsTeam(event.home_team, match.away_team) && sameOddsTeam(event.away_team, match.home_team);
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

function invertLine(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? decimal(-numeric) : null;
}

function formatSignedLine(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "";
  return `${numeric > 0 ? "+" : ""}${Number(numeric.toFixed(2))}`;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function commaList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function oddsApiBookmakers() {
  return commaList(env("ODDS_API_BOOKMAKERS"));
}

function oddsApiRequestParams(markets) {
  const bookmakers = oddsApiBookmakers();
  const params = {
    markets,
    oddsFormat: "decimal"
  };
  if (bookmakers.length) {
    params.bookmakers = bookmakers.join(",");
  } else {
    params.regions = env("ODDS_API_REGIONS") || DEFAULT_ODDS_API_REGIONS;
  }
  return params;
}

function bookmakerIdentity(bookmaker) {
  return [
    String(bookmaker?.key || ""),
    normalizeTeamName(bookmaker?.key),
    normalizeTeamName(bookmaker?.title)
  ].filter(Boolean);
}

function preferredBookmakerRank(bookmaker, preferredBookmakers) {
  if (!preferredBookmakers.length) return Number.MAX_SAFE_INTEGER;
  const identities = new Set(bookmakerIdentity(bookmaker));
  const index = preferredBookmakers.findIndex((item) => identities.has(item) || identities.has(normalizeTeamName(item)));
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

function shouldReplaceOddsCandidate(current, candidate, preferredBookmakers) {
  if (!current) return true;
  if (!preferredBookmakers.length) {
    return candidate.odds_multiplier > current.odds_multiplier;
  }
  if (candidate.bookmaker_rank !== current.bookmaker_rank) {
    return candidate.bookmaker_rank < current.bookmaker_rank;
  }
  return new Date(candidate.bookmaker_last_update || 0).getTime() > new Date(current.bookmaker_last_update || 0).getTime();
}

function poissonDistribution(lambda, maxGoals = 6) {
  const values = [];
  let sum = 0;
  for (let goals = 0; goals <= maxGoals; goals += 1) {
    const probability = Math.exp(-lambda) * Math.pow(lambda, goals) / factorial(goals);
    values.push(probability);
    sum += probability;
  }
  return values.map((probability) => probability / (sum || 1));
}

function factorial(value) {
  let result = 1;
  for (let index = 2; index <= value; index += 1) result *= index;
  return result;
}

function scoreDistribution(homeXg, awayXg, maxGoals = 6) {
  const home = poissonDistribution(homeXg, maxGoals);
  const away = poissonDistribution(awayXg, maxGoals);
  const scores = [];
  let total = 0;
  for (let homeGoals = 0; homeGoals <= maxGoals; homeGoals += 1) {
    for (let awayGoals = 0; awayGoals <= maxGoals; awayGoals += 1) {
      const probability = home[homeGoals] * away[awayGoals];
      total += probability;
      scores.push({ homeGoals, awayGoals, probability });
    }
  }
  return scores.map((score) => ({ ...score, probability: score.probability / (total || 1) }));
}

function scoreModelStats(homeXg, awayXg) {
  const scores = scoreDistribution(homeXg, awayXg);
  return scores.reduce((stats, score) => {
    if (score.homeGoals > score.awayGoals) stats.home += score.probability;
    else if (score.homeGoals === score.awayGoals) stats.draw += score.probability;
    else stats.away += score.probability;
    stats.totalGoals += (score.homeGoals + score.awayGoals) * score.probability;
    return stats;
  }, { home: 0, draw: 0, away: 0, totalGoals: 0, scores });
}

function deriveExpectedTotalGoals(totalMarkets) {
  const byLine = new Map();
  for (const market of totalMarkets) {
    const line = Number(market.line);
    if (!Number.isFinite(line)) continue;
    const row = byLine.get(line) || { line };
    row[market.selection_key] = Number(market.odds_multiplier);
    byLine.set(line, row);
  }

  const pairs = [...byLine.values()]
    .filter((row) => row.over > 1 && row.under > 1)
    .map((row) => {
      const overRaw = 1 / row.over;
      const underRaw = 1 / row.under;
      const margin = overRaw + underRaw;
      const pOver = margin ? overRaw / margin : 0.5;
      return {
        line: row.line,
        pOver,
        estimate: row.line + (pOver - 0.5) * 1.5,
        distance: Math.abs(pOver - 0.5)
      };
    });

  if (!pairs.length) return 2.5;
  pairs.sort((left, right) => left.distance - right.distance || left.line - right.line);
  return clamp(pairs[0].estimate, 0.8, 5.5);
}

function correctScoreCandidateFromMarkets(candidates, match) {
  const resultMarkets = Object.fromEntries(candidates
    .filter((candidate) => candidate.market_key === "match_result")
    .map((candidate) => [candidate.selection_key, candidate]));
  const totalMarkets = candidates.filter((candidate) => candidate.market_key === "total_goals");
  if (!resultMarkets.home || !resultMarkets.draw || !resultMarkets.away || totalMarkets.length < 2) return null;

  const homeRaw = 1 / Number(resultMarkets.home.odds_multiplier);
  const drawRaw = 1 / Number(resultMarkets.draw.odds_multiplier);
  const awayRaw = 1 / Number(resultMarkets.away.odds_multiplier);
  const margin = homeRaw + drawRaw + awayRaw;
  if (!Number.isFinite(margin) || margin <= 0) return null;

  const pHome = homeRaw / margin;
  const pDraw = drawRaw / margin;
  const pAway = awayRaw / margin;
  const expectedTotalGoals = deriveExpectedTotalGoals(totalMarkets);
  const initialGoalDiff = clamp((pHome - pAway) * 2.2, -expectedTotalGoals + 0.1, expectedTotalGoals - 0.1);
  const initialHomeXg = Math.max(0.05, (expectedTotalGoals + initialGoalDiff) / 2);
  const initialAwayXg = Math.max(0.05, (expectedTotalGoals - initialGoalDiff) / 2);

  let best = null;
  for (let homeXg = Math.max(0.05, initialHomeXg - 1.25); homeXg <= initialHomeXg + 1.25; homeXg += 0.05) {
    for (let awayXg = Math.max(0.05, initialAwayXg - 1.25); awayXg <= initialAwayXg + 1.25; awayXg += 0.05) {
      const stats = scoreModelStats(Number(homeXg.toFixed(2)), Number(awayXg.toFixed(2)));
      const error = Math.pow(stats.home - pHome, 2)
        + Math.pow(stats.draw - pDraw, 2)
        + Math.pow(stats.away - pAway, 2)
        + Math.pow(stats.totalGoals - expectedTotalGoals, 2) * 0.15;
      if (!best || error < best.error) {
        best = { ...stats, homeXg: Number(homeXg.toFixed(2)), awayXg: Number(awayXg.toFixed(2)), error };
      }
    }
  }
  if (!best) return null;

  const scoreRows = best.scores
    .map((score) => {
      const resultType = score.homeGoals > score.awayGoals ? "home_win" : score.homeGoals === score.awayGoals ? "draw" : "away_win";
      const totalGoals = score.homeGoals + score.awayGoals;
      return {
        score: `${score.homeGoals}-${score.awayGoals}`,
        probability: Number(score.probability.toFixed(6)),
        fair_odds: Number(clamp(1 / Math.max(score.probability, 0.0001), 1.01, 300).toFixed(2)),
        result_type: resultType,
        total_goals: totalGoals,
        over_under_group: totalGoals > expectedTotalGoals ? "over" : totalGoals < expectedTotalGoals ? "under" : "push"
      };
    })
    .sort((left, right) => right.probability - left.probability);
  const scoreOdds = Object.fromEntries(scoreRows.map((row) => [row.score, row]));
  const mostLikely = scoreRows[0];

  return {
    match_id: match.id,
    market_key: "correct_score",
    label: "Dự đoán tỷ số",
    selection_key: "exact",
    selection_label: "Tỷ số chính xác",
    line: null,
    odds_multiplier: mostLikely?.fair_odds || 6,
    bookmaker: "model",
    bookmaker_key: "derived_correct_score",
    bookmaker_rank: Number.MAX_SAFE_INTEGER,
    bookmaker_last_update: new Date().toISOString(),
    extra_json: {
      provider: "model-from-odds-api",
      model: "poisson_1x2_totals_v1",
      source_markets: ["h2h", "totals"],
      p_home: Number(pHome.toFixed(6)),
      p_draw: Number(pDraw.toFixed(6)),
      p_away: Number(pAway.toFixed(6)),
      expected_total_goals: Number(expectedTotalGoals.toFixed(3)),
      home_xg: best.homeXg,
      away_xg: best.awayXg,
      model_error: Number(best.error.toFixed(6)),
      most_likely_score: mostLikely?.score || "",
      score_odds: scoreOdds,
      top_scores: scoreRows.slice(0, 12)
    },
    payload_json: { model: "poisson_1x2_totals_v1", score_odds: scoreOdds }
  };
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
  const preferredBookmakers = oddsApiBookmakers().map((bookmaker) => normalizeTeamName(bookmaker));

  function setBest(key, candidate) {
    const current = prices.get(key);
    if (shouldReplaceOddsCandidate(current, candidate, preferredBookmakers)) {
      prices.set(key, candidate);
    }
  }

  for (const bookmaker of event.bookmakers || []) {
    const bookmakerRank = preferredBookmakerRank(bookmaker, preferredBookmakers);
    if (preferredBookmakers.length && bookmakerRank === Number.MAX_SAFE_INTEGER) continue;

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
            bookmaker_key: bookmaker.key,
            bookmaker_rank: bookmakerRank,
            bookmaker_last_update: bookmaker.last_update,
            payload_json: { event_id: event.id, market: market.key, outcome, bookmaker }
          });
        }
      }

      if (market.key === "draw_no_bet") continue;

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
            bookmaker_key: bookmaker.key,
            bookmaker_rank: bookmakerRank,
            bookmaker_last_update: bookmaker.last_update,
            payload_json: { event_id: event.id, market: market.key, outcome, bookmaker }
          });
        }
      }

      if (market.key === "spreads") {
        for (const outcome of market.outcomes || []) {
          const outcomeName = normalizeTeamName(outcome.name);
          const point = decimal(outcome.point);
          let selectionKey = null;
          let selectionLabel = outcome.name;
          let line = null;
          if (outcomeName === normalizeTeamName(event.home_team)) {
            selectionKey = reversed ? "away" : "home";
            selectionLabel = `${selectionKey === "home" ? "Home" : "Away"} ${formatSignedLine(point)}`;
            line = reversed ? invertLine(point) : point;
          } else if (outcomeName === normalizeTeamName(event.away_team)) {
            selectionKey = reversed ? "home" : "away";
            selectionLabel = `${selectionKey === "home" ? "Home" : "Away"} ${formatSignedLine(point)}`;
            line = reversed ? point : invertLine(point);
          }
          if (!selectionKey || line === null) continue;

          setBest(`asian_handicap:${selectionKey}:${line}`, {
            match_id: match.id,
            market_key: "asian_handicap",
            label: `Keo Chau A ${formatSignedLine(line)}`,
            selection_key: selectionKey,
            selection_label: selectionLabel,
            line,
            odds_multiplier: decimal(outcome.price),
            bookmaker: bookmaker.title || bookmaker.key,
            bookmaker_key: bookmaker.key,
            bookmaker_rank: bookmakerRank,
            bookmaker_last_update: bookmaker.last_update,
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
  const row = marketRowFromOddsCandidate(candidate);

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

function marketRowFromOddsCandidate(candidate) {
  return {
    match_id: candidate.match_id,
    market_key: candidate.market_key,
    label: candidate.label,
    selection_key: candidate.selection_key,
    selection_label: candidate.selection_label,
    line: candidate.line,
    odds_multiplier: candidate.odds_multiplier,
    is_open: true,
    source: candidate.source || (candidate.market_key === "correct_score" ? "odds-model" : "odds-api"),
    closes_at: candidate.closes_at,
    extra_json: {
      provider: "the-odds-api",
      bookmaker: candidate.bookmaker,
      bookmaker_key: candidate.bookmaker_key,
      bookmaker_last_update: candidate.bookmaker_last_update,
      selection_mode: oddsApiBookmakers().length ? "preferred_bookmaker" : "best_available",
      updated_at: new Date().toISOString(),
      ...(candidate.extra_json || {})
    }
  };
}

function marketIdentity(row) {
  const line = row.line === null || row.line === undefined ? "" : String(Number(row.line));
  return `${row.match_id}|${row.market_key}|${row.selection_key}|${line}`;
}

async function upsertMarketsFromOdds(candidates) {
  if (!candidates.length) return [];
  const rows = candidates.map(marketRowFromOddsCandidate);
  const response = await supabaseFetch("/rest/v1/match_markets?on_conflict=match_id,market_key,selection_key,line_key", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify(rows)
  });
  if (response.ok) {
    const markets = await response.json();
    const byIdentity = new Map(markets.map((market) => [marketIdentity(market), market]));
    return candidates.map((candidate, index) => byIdentity.get(marketIdentity(candidate)) || markets[index]).filter(Boolean);
  }

  return Promise.all(candidates.map((candidate) => upsertMarketFromOdds(candidate)));
}

function marketSourceRank(source) {
  if (source === "odds-api") return 3;
  if (source === "admin") return 2;
  if (source === "internal") return 1;
  return 0;
}

function currentMarketCandidateFromRow(row) {
  return {
    match_id: row.match_id,
    market_key: row.market_key,
    label: row.label,
    selection_key: row.selection_key,
    selection_label: row.selection_label,
    line: row.line === null || row.line === undefined ? null : decimal(row.line),
    odds_multiplier: decimal(row.odds_multiplier),
    source: row.source,
    bookmaker: row.extra_json?.bookmaker || row.extra_json?.provider || row.source || "current-market",
    bookmaker_key: row.extra_json?.bookmaker_key || row.source || "current-market",
    bookmaker_rank: marketSourceRank(row.source),
    bookmaker_last_update: row.extra_json?.updated_at || row.closes_at || new Date().toISOString(),
    closes_at: row.closes_at,
    payload_json: { source_market_id: row.id, source: row.source }
  };
}

function currentMarketCandidates(rows) {
  const byIdentity = new Map();
  for (const row of rows || []) {
    if (!row?.match_id || !row.market_key || !row.selection_key) continue;
    const candidate = currentMarketCandidateFromRow(row);
    if (!candidate.odds_multiplier || candidate.odds_multiplier <= 1) continue;
    const line = candidate.line === null ? "" : String(candidate.line);
    const key = `${candidate.match_id}|${candidate.market_key}|${candidate.selection_key}|${line}`;
    const current = byIdentity.get(key);
    if (!current || marketSourceRank(candidate.source) > marketSourceRank(current.source)) {
      byIdentity.set(key, candidate);
    }
  }
  return [...byIdentity.values()];
}

async function ensureCorrectScoreMarketsFromCurrentMarkets(matches) {
  const ids = [...new Set((matches || []).map((match) => Number(match.id)).filter(Boolean))];
  if (!ids.length) return 0;

  const response = await supabaseFetch(
    `/rest/v1/match_markets?select=id,match_id,market_key,label,selection_key,selection_label,line,odds_multiplier,is_open,source,closes_at,extra_json&match_id=in.(${ids.join(",")})&market_key=in.(match_result,total_goals)&is_open=eq.true`
  );
  if (!response.ok) {
    throw new Error(`Supabase read current markets for correct score failed: ${response.status} ${await response.text()}`);
  }

  const rows = await response.json();
  const candidatesByMatch = new Map();
  for (const candidate of currentMarketCandidates(rows)) {
    candidatesByMatch.set(candidate.match_id, [...(candidatesByMatch.get(candidate.match_id) || []), candidate]);
  }

  const correctScoreCandidates = [];
  for (const match of matches || []) {
    const candidates = candidatesByMatch.get(Number(match.id)) || [];
    const correctScoreCandidate = correctScoreCandidateFromMarkets(candidates, match);
    if (correctScoreCandidate) {
      correctScoreCandidates.push({
        ...correctScoreCandidate,
        closes_at: match.starts_at,
        source: "odds-model",
        extra_json: {
          ...correctScoreCandidate.extra_json,
          provider: "model-from-current-markets",
          source_markets: ["current_match_result", "current_total_goals"]
        }
      });
    }
  }

  const markets = await upsertMarketsFromOdds(correctScoreCandidates);
  return markets.length;
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

async function insertOddsSnapshots(markets, candidates) {
  const rows = markets.map((market, index) => {
    const candidate = candidates[index];
    if (!market || !candidate) return null;
    return {
      match_market_id: market.id,
      provider: "the-odds-api",
      bookmaker: candidate.bookmaker,
      multiplier: candidate.odds_multiplier,
      payload_json: candidate.payload_json
    };
  }).filter(Boolean);
  if (!rows.length) return 0;

  const response = await supabaseFetch("/rest/v1/odds_snapshots", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(rows)
  });
  if (response.ok) return rows.length;

  let inserted = 0;
  for (let index = 0; index < markets.length; index += 1) {
    await insertOddsSnapshot(markets[index], candidates[index]);
    inserted += 1;
  }
  return inserted;
}

function bestOutrightPrices(events, teams) {
  const teamsByName = new Map(teams.map((team) => [normalizeTeamName(team.name), team]));
  const prices = new Map();
  const preferredBookmakers = oddsApiBookmakers().map((bookmaker) => normalizeTeamName(bookmaker));

  function setBest(team, candidate) {
    const current = prices.get(team.code);
    if (shouldReplaceOddsCandidate(current, candidate, preferredBookmakers)) {
      prices.set(team.code, candidate);
    }
  }

  for (const event of events) {
    for (const bookmaker of event.bookmakers || []) {
      const bookmakerRank = preferredBookmakerRank(bookmaker, preferredBookmakers);
      if (preferredBookmakers.length && bookmakerRank === Number.MAX_SAFE_INTEGER) continue;

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
            bookmaker_key: bookmaker.key,
            bookmaker_rank: bookmakerRank,
            bookmaker_last_update: bookmaker.last_update,
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
        bookmaker_key: candidate.bookmaker_key,
        bookmaker_last_update: candidate.bookmaker_last_update,
        selection_mode: oddsApiBookmakers().length ? "preferred_bookmaker" : "best_available",
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

// ── FIFA Fantasy + FIFA Calendar match result sync ──────────────────────────

function scoreOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function isFinalResultStatus(status) {
  return ["FT", "AET", "PEN", "FT_PEN"].includes(String(status || ""));
}

function hasScoreFixture(fixture) {
  return isFinalResultStatus(fixture?.status)
    && fixture.homeScore !== null
    && fixture.homeScore !== undefined
    && fixture.awayScore !== null
    && fixture.awayScore !== undefined;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function resultStatusFromDateAndScore({ rawStatus, resultType, homeScore, awayScore, kickOff }) {
  const status = String(rawStatus ?? "").toLowerCase();
  const numericStatus = Number(rawStatus);
  if ([5, 10].includes(numericStatus)) return "FT";
  if ([2, 3, 4].includes(numericStatus)) return "1H";
  if (status.includes("finish") || status.includes("complet") || status === "ft" || status === "full_time") return "FT";
  if (status.includes("penalty") || status === "pen") return "PEN";
  if (status.includes("extra") || status === "et") return "AET";
  if (status.includes("live") || status.includes("progress") || status.includes("playing") || status.includes("1h") || status.includes("2h")) return "1H";
  if (status.includes("half")) return "HT";
  if (status.includes("postpone")) return "PST";
  if (status.includes("cancel")) return "CANC";

  const hasScore = homeScore !== null && homeScore !== undefined && awayScore !== null && awayScore !== undefined;
  const startedAt = Date.parse(kickOff || "");
  const kickoffWasLongAgo = Number.isFinite(startedAt) && Date.now() - startedAt > 105 * 60 * 1000;
  if ((Number(resultType) === 1 || kickoffWasLongAgo) && hasScore) return "FT";
  return "SCHEDULED";
}

function matchDistanceMs(match, kickOff) {
  const fixtureTime = Date.parse(kickOff || "");
  const matchTime = Date.parse(match?.starts_at || "");
  if (!Number.isFinite(fixtureTime) || !Number.isFinite(matchTime)) return Number.POSITIVE_INFINITY;
  return Math.abs(matchTime - fixtureTime);
}

function findDbMatchForFixture(fixture, homeTeam, awayTeam, dbMatches) {
  const candidates = dbMatches.filter((match) =>
    Number(match.home_team_id) === Number(homeTeam.id) && Number(match.away_team_id) === Number(awayTeam.id)
  );
  if (!candidates.length) return null;
  const ordered = candidates
    .map((match) => ({ match, distance: matchDistanceMs(match, fixture.kickOff) }))
    .sort((left, right) => left.distance - right.distance || Number(left.match.id) - Number(right.match.id));
  return ordered[0].match;
}

function extractFifaFantasyFixtures(payload) {
  const rounds = Array.isArray(payload) ? payload : (payload?.rounds || payload?.data?.rounds || []);
  const fixtures = [];
  for (const round of rounds) {
    const list = [
      ...asArray(round.fixtures),
      ...asArray(round.matches),
      ...asArray(round.games),
      ...asArray(round.tournaments)
    ];
    for (const f of list) {
      const home = f.homeTeam || f.home_team || f.home || {};
      const away = f.awayTeam || f.away_team || f.away || {};
      const homeCode = String(f.homeSquadAbbr || home.teamCode || home.code || home.abbreviation || home.tla || "").toUpperCase();
      const awayCode = String(f.awaySquadAbbr || away.teamCode || away.code || away.abbreviation || away.tla || "").toUpperCase();
      if (!homeCode || !awayCode) continue;
      const homeScore = scoreOrNull(f.homeScore ?? f.home_score ?? f.result?.home ?? f.score?.home ?? null);
      const awayScore = scoreOrNull(f.awayScore ?? f.away_score ?? f.result?.away ?? f.score?.away ?? null);
      const kickOff = f.kickOff || f.kickoff || f.matchDate || f.date || f.startDate || null;
      const status = resultStatusFromDateAndScore({
        rawStatus: f.status || f.matchStatus || f.state || f.period || "",
        resultType: f.resultType,
        homeScore,
        awayScore,
        kickOff
      });
      fixtures.push({
        homeCode,
        awayCode,
        homeScore,
        awayScore,
        homePenalties: scoreOrNull(f.homePenaltyScore ?? f.homePenalties ?? f.penalties?.home ?? null),
        awayPenalties: scoreOrNull(f.awayPenaltyScore ?? f.awayPenalties ?? f.penalties?.away ?? null),
        status,
        kickOff,
        provider: "fifa-fantasy",
        payload: f
      });
    }
  }
  return fixtures;
}

function extractFifaCalendarFixtures(payload) {
  // FIFA API v3 /calendar/matches returns { Results: [{ IdMatch, Home/Away, HomeTeamScore, AwayTeamScore, MatchStatus, Date }] }
  const results = payload?.Results || payload?.results || payload?.matches || [];
  const fixtures = [];
  for (const m of results) {
    const home = m.HomeTeam || m.homeTeam || m.Home || m.home || {};
    const away = m.AwayTeam || m.awayTeam || m.Away || m.away || {};
    const homeCode = String(home.Abbreviation || home.abbreviation || home.TeamCode || home.code || home.IdCountry || "").toUpperCase();
    const awayCode = String(away.Abbreviation || away.abbreviation || away.TeamCode || away.code || away.IdCountry || "").toUpperCase();
    if (!homeCode || !awayCode) continue;
    const rawStatus = m.MatchStatus ?? m.matchStatus ?? m.Status ?? m.status ?? "";
    const homeScore = scoreOrNull(m.HomeTeamScore ?? m.homeScore ?? home.Score ?? m.score?.home ?? null);
    const awayScore = scoreOrNull(m.AwayTeamScore ?? m.awayScore ?? away.Score ?? m.score?.away ?? null);
    const kickOff = m.Date || m.date || m.MatchDay || null;
    let status = resultStatusFromDateAndScore({
      rawStatus,
      resultType: m.ResultType ?? m.resultType,
      homeScore,
      awayScore,
      kickOff
    });
    if ([1, "1"].includes(m.MatchStatus) && status === "FT") status = "SCHEDULED";
    if ([3, "3"].includes(m.MatchStatus)) status = "1H";
    fixtures.push({
      homeCode,
      awayCode,
      homeScore,
      awayScore,
      homePenalties: scoreOrNull(m.HomeTeamPenaltyScore ?? home.PenaltyScore ?? null),
      awayPenalties: scoreOrNull(m.AwayTeamPenaltyScore ?? away.PenaltyScore ?? null),
      status,
      kickOff,
      provider: "fifa-calendar",
      source: `fifa-calendar:${m.IdMatch || m.id || ""}`,
      payload: m
    });
  }
  return fixtures;
}

async function upsertMatchResultsByCode(fixtures) {
  if (!fixtures || !fixtures.length) return { updated: 0, results: 0, completedScores: 0, completedMatchIds: [] };
  const codes = [...new Set(fixtures.flatMap((f) => [f.homeCode, f.awayCode]))];
  const teamsByCode = await getTeamsByCodes(codes);
  const matchesRes = await supabaseFetch(
    "/rest/v1/matches?select=id,provider_id,status,home_score,away_score,home_penalties,away_penalties,home_team_id,away_team_id,starts_at,updated_at&order=starts_at.asc"
  );
  if (!matchesRes.ok) throw new Error(`Supabase read matches failed: ${matchesRes.status}`);
  const dbMatches = await matchesRes.json();

  let updated = 0;
  const resultRows = [];
  const completedMatchIds = [];
  for (const f of fixtures) {
    const homeTeam = teamsByCode.get(f.homeCode);
    const awayTeam = teamsByCode.get(f.awayCode);
    if (!homeTeam || !awayTeam) continue;
    const dbMatch = findDbMatchForFixture(f, homeTeam, awayTeam, dbMatches);
    if (!dbMatch) continue;
    const wasCompleted = ["FT", "AET", "PEN", "FT_PEN"].includes(dbMatch.status);
    const nowCompleted = ["FT", "AET", "PEN", "FT_PEN"].includes(f.status);
    const scoredResult = hasScoreFixture(f);
    // Only update if score or status changed
    if (
      dbMatch.status === f.status &&
      dbMatch.home_score === f.homeScore &&
      dbMatch.away_score === f.awayScore
    ) {
      if (scoredResult) {
        resultRows.push({
          match_id: dbMatch.id,
          home_team_id: dbMatch.home_team_id,
          away_team_id: dbMatch.away_team_id,
          status: f.status,
          home_score: f.homeScore,
          away_score: f.awayScore,
          home_penalties: f.homePenalties ?? null,
          away_penalties: f.awayPenalties ?? null,
          provider: f.provider || "unknown",
          source: f.source || f.provider || "provider",
          provider_payload: f.payload || {},
          finished_at: f.finishedAt || f.kickOff || dbMatch.updated_at || new Date().toISOString(),
          synced_at: new Date().toISOString()
        });
      }
      continue;
    }
    const patchRes = await supabaseFetch(
      `/rest/v1/matches?id=eq.${dbMatch.id}`,
      {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({
          status: f.status,
          home_score: f.homeScore,
          away_score: f.awayScore,
          home_penalties: f.homePenalties ?? null,
          away_penalties: f.awayPenalties ?? null,
          updated_at: new Date().toISOString()
        })
      }
    );
    if (!patchRes.ok) continue;
    updated += 1;
    if (scoredResult) {
      resultRows.push({
        match_id: dbMatch.id,
        home_team_id: dbMatch.home_team_id,
        away_team_id: dbMatch.away_team_id,
        status: f.status,
        home_score: f.homeScore,
        away_score: f.awayScore,
        home_penalties: f.homePenalties ?? null,
        away_penalties: f.awayPenalties ?? null,
        provider: f.provider || "unknown",
        source: f.source || f.provider || "provider",
        provider_payload: f.payload || {},
        finished_at: f.finishedAt || f.kickOff || new Date().toISOString(),
        synced_at: new Date().toISOString()
      });
    }
    if (!wasCompleted && nowCompleted) completedMatchIds.push(dbMatch.id);
  }
  let resultUpserts = [];
  try {
    resultUpserts = await upsertJson("match_results", resultRows, "match_id");
  } catch (error) {
    if (!isMissingRelationError(error)) throw error;
  }
  return {
    updated,
    results: resultUpserts.length,
    completedScores: resultRows.length,
    completedMatchIds
  };
}

async function autoSettleMatches(matchIds, accessToken) {
  if (!matchIds.length) return 0;
  const serviceKey = env("SUPABASE_SERVICE_ROLE_KEY");
  const settlementToken = accessToken || serviceKey;
  let totalSettled = 0;
  for (const matchId of matchIds) {
    try {
      const res = await fetch(`${env("SUPABASE_URL")}/rest/v1/rpc/settle_match_bets`, {
        method: "POST",
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${settlementToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ p_match_id: matchId })
      });
      if (res.ok) {
        const count = await res.json();
        totalSettled += Number(count) || 0;
      }
    } catch {
      // Non-fatal: individual match settlement failure shouldn't abort others
    }
  }
  return totalSettled;
}

function extractEspnFixtures(payload) {
  const events = payload?.events || [];
  const fixtures = [];
  for (const ev of events) {
    const comp = (ev.competitions || [])[0];
    if (!comp) continue;
    const homeComp = comp.competitors?.find((c) => c.homeAway === "home");
    const awayComp = comp.competitors?.find((c) => c.homeAway === "away");
    if (!homeComp || !awayComp) continue;
    const homeCode = String(homeComp.team?.abbreviation || homeComp.team?.shortDisplayName || "").toUpperCase();
    const awayCode = String(awayComp.team?.abbreviation || awayComp.team?.shortDisplayName || "").toUpperCase();
    if (!homeCode || !awayCode) continue;
    const statusName = String(comp.status?.type?.name || "").toUpperCase();
    const statusState = String(comp.status?.type?.state || "").toLowerCase();
    let status = "SCHEDULED";
    if (statusName === "STATUS_FINAL" || statusState === "post") status = "FT";
    else if (statusName === "STATUS_FINAL_AET") status = "AET";
    else if (statusName === "STATUS_FINAL_PEN") status = "PEN";
    else if (statusState === "in") status = "1H";
    else if (statusName === "STATUS_HALFTIME") status = "HT";
    else if (statusName === "STATUS_POSTPONED") status = "PST";
    else if (statusName === "STATUS_CANCELED" || statusName === "STATUS_CANCELLED") status = "CANC";
    const homeScore = statusState === "post" || statusState === "in" ? scoreOrNull(homeComp.score) : null;
    const awayScore = statusState === "post" || statusState === "in" ? scoreOrNull(awayComp.score) : null;
    fixtures.push({ homeCode, awayCode, homeScore, awayScore, status, kickOff: ev.date || comp.date || null, provider: "espn", payload: ev });
  }
  return fixtures;
}

async function syncEspnResults() {
  // Fetch the full WC2026 schedule in one call (Jun 11 – Jul 19 2026)
  const url = `${ESPN_SOCCER_BASE}/scoreboard?dates=20260611-20260720&limit=200`;
  let payload;
  try {
    const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 12000);
    const res = await fetch(url, { headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0" }, signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) throw new Error(`ESPN scoreboard failed: ${res.status}`);
    payload = await res.json();
  } catch (err) {
    await recordSyncRun({ provider: "espn", jobType: "results", status: "failed", requestCount: 1, message: String(err.message) });
    return { provider: "espn", status: "failed", requests: 1, updated: 0, completedMatchIds: [] };
  }
  const fixtures = extractEspnFixtures(payload);
  const { updated, results, completedScores, completedMatchIds } = await upsertMatchResultsByCode(fixtures);
  await recordSyncRun({
    provider: "espn",
    jobType: "results",
    status: "success",
    requestCount: 1,
    message: `ESPN: ${fixtures.length} fixtures parsed, ${updated} matches updated, ${results} result rows saved, ${completedScores} completed scores found, ${(completedMatchIds || []).length} newly completed.`
  });
  return { provider: "espn", status: "success", requests: 1, updated, results, completedScores, completedMatchIds };
}
async function syncFifaFantasyResults() {
  let payload;
  try {
    const ctrl1 = new AbortController(); const t1 = setTimeout(() => ctrl1.abort(), 10000);
    const res = await fetch(FIFA_FANTASY_ROUNDS_URL, {
      headers: { Accept: "application/json", "User-Agent": "WorldCup Predict result sync" },
      signal: ctrl1.signal
    });
    clearTimeout(t1);
    if (!res.ok) throw new Error(`FIFA Fantasy rounds.json failed: ${res.status}`);
    payload = await res.json();
  } catch (err) {
    await recordSyncRun({ provider: "fifa-fantasy", jobType: "results", status: "failed", requestCount: 1, message: String(err.message) });
    return { provider: "fifa-fantasy", status: "failed", requests: 1, updated: 0, completedMatchIds: [] };
  }
  const fixtures = extractFifaFantasyFixtures(payload);
  const { updated, results, completedScores, completedMatchIds } = await upsertMatchResultsByCode(fixtures);
  await recordSyncRun({
    provider: "fifa-fantasy",
    jobType: "results",
    status: "success",
    requestCount: 1,
    message: `Parsed ${fixtures.length} fixtures from FIFA Fantasy; updated ${updated} matches; saved ${results} result rows; ${completedScores} completed scores; ${(completedMatchIds || []).length} newly completed.`
  });
  return { provider: "fifa-fantasy", status: "success", requests: 1, updated, results, completedScores, completedMatchIds };
}

async function syncFifaCalendarResults() {
  let payload;
  try {
    const ctrl2 = new AbortController(); const t2 = setTimeout(() => ctrl2.abort(), 10000);
    const res = await fetch(
      `${FIFA_CALENDAR_MATCHES_URL}?idSeason=${FIFA_WORLD_CUP_SEASON_ID}&idCompetition=${FIFA_WORLD_CUP_COMPETITION_ID}&count=100&language=en`,
      { headers: { Accept: "application/json", "User-Agent": "WorldCup Predict result sync" }, signal: ctrl2.signal }
    );
    clearTimeout(t2);
    if (!res.ok) throw new Error(`FIFA Calendar API failed: ${res.status}`);
    payload = await res.json();
  } catch (err) {
    await recordSyncRun({ provider: "fifa-calendar", jobType: "results", status: "failed", requestCount: 1, message: String(err.message) });
    return { provider: "fifa-calendar", status: "failed", requests: 1, updated: 0, completedMatchIds: [] };
  }
  const fixtures = extractFifaCalendarFixtures(payload);
  const { updated, results, completedScores, completedMatchIds } = await upsertMatchResultsByCode(fixtures);
  await recordSyncRun({
    provider: "fifa-calendar",
    jobType: "results",
    status: "success",
    requestCount: 1,
    message: `Parsed ${fixtures.length} fixtures from FIFA Calendar API; updated ${updated} matches; saved ${results} result rows; ${completedScores} completed scores; ${(completedMatchIds || []).length} newly completed.`
  });
  return { provider: "fifa-calendar", status: "success", requests: 1, updated, results, completedScores, completedMatchIds };
}

// ── End FIFA result sync ─────────────────────────────────────────────────────

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
      home_penalties: fixture.score?.penalty?.home ?? null,
      away_penalties: fixture.score?.penalty?.away ?? null,
      venue: fixture.fixture.venue?.name || null,
      city: fixture.fixture.venue?.city || null,
      current_minute: fixture.fixture.status?.elapsed || null,
      updated_at: new Date().toISOString()
    }))
    .filter((match) => match.home_team_id && match.away_team_id);

  const syncedMatches = await upsertJson("matches", matches, "provider_id");
  const completed = await upsertCompletedMatchResults(syncedMatches, "api-football", "fixtures");
  await recordSyncRun({
    provider: "api-football",
    jobType: "fixtures",
    status: "success",
    requestCount: 1,
    message: `Synced ${matches.length} fixtures and ${teamsByProvider.size} teams for World Cup 2026; linked ${teamSync.linkedExisting} seeded teams by code; saved ${completed.resultRows} completed results.`
  });

  return {
    provider: "api-football",
    status: "success",
    requests: 1,
    teams: teamsByProvider.size,
    matches: matches.length,
    results: completed.resultRows,
    completedMatchIds: completed.completedMatchIds
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
      home_penalties: match.score?.penalties?.home ?? null,
      away_penalties: match.score?.penalties?.away ?? null,
      venue: match.venue || null,
      city: null,
      current_minute: match.minute || null,
      updated_at: new Date().toISOString()
    }))
    .filter((match) => match.home_team_id && match.away_team_id && match.starts_at);

  const syncedMatches = await upsertJson("matches", matches, "provider_id");
  const completed = await upsertCompletedMatchResults(syncedMatches, "football-data.org", "fixtures");
  const defaultMarkets = await ensureDefaultMarketsForMatches(syncedMatches);
  const correctScoreMarkets = await ensureCorrectScoreMarketsFromCurrentMarkets(syncedMatches);
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
    message: `Synced ${matches.length} World Cup fixtures and ${teamsByProvider.size} teams from football-data.org; saved ${completed.resultRows} completed results; added ${defaultMarkets} default markets and ${correctScoreMarkets} correct-score model markets; linked ${bracketLinks} bracket matches.`
  });

  return {
    provider: "football-data.org",
    status: "success",
    requests: 1,
    teams: teamsByProvider.size,
    matches: matches.length,
    results: completed.resultRows,
    completedMatchIds: completed.completedMatchIds,
    bracketLinks,
    defaultMarkets,
    correctScoreMarkets
  };
}

async function ensureDefaultMarketsForMatches(matches) {
  const teams = await fetchTeamsForDefaultMarkets(matches);
  const rows = [];
  for (const match of matches || []) {
    if (!match.id || !match.starts_at) continue;
    const homeTeam = teams.get(Number(match.home_team_id)) || {};
    const awayTeam = teams.get(Number(match.away_team_id)) || {};
    const homeStrength = teamStrengthScore(homeTeam);
    const awayStrength = teamStrengthScore(awayTeam);
    const homeWinOdds = teamWinMultiplier(homeStrength, awayStrength, 1.35, 4.50);
    const awayWinOdds = teamWinMultiplier(awayStrength, homeStrength, 1.35, 4.50);
    const drawOdds = roundOdds(Math.max(2.70, Math.min(3.80, 2.95 + Math.abs(homeStrength - awayStrength) / 45)));
    rows.push(
      defaultMarket(match, "match_result", "Kết quả 1X2", "home", `${homeTeam.name || "Đội nhà"} thắng`, null, homeWinOdds, "internal"),
      defaultMarket(match, "match_result", "Kết quả 1X2", "draw", "Hòa", null, drawOdds, "internal"),
      defaultMarket(match, "match_result", "Kết quả 1X2", "away", `${awayTeam.name || "Đội khách"} thắng`, null, awayWinOdds, "internal"),
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

async function resetProviderManagedMarketsToInternal(matches) {
  const ids = [...new Set((matches || []).map((match) => Number(match.id)).filter(Boolean))];
  if (!ids.length) return 0;

  const closeResponse = await supabaseFetch(
    `/rest/v1/match_markets?match_id=in.(${ids.join(",")})&source=in.(odds-api,odds-model)&market_key=in.(${PROVIDER_MANAGED_MARKETS.join(",")})`,
    {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ is_open: false })
    }
  );
  if (!closeResponse.ok) {
    throw new Error(`Supabase close stale odds markets failed: ${closeResponse.status} ${await closeResponse.text()}`);
  }

  const teams = await fetchTeamsForDefaultMarkets(matches);
  const rows = [];
  for (const match of matches || []) {
    if (!match.id || !match.starts_at) continue;
    const homeTeam = teams.get(Number(match.home_team?.id || match.home_team_id)) || {};
    const awayTeam = teams.get(Number(match.away_team?.id || match.away_team_id)) || {};
    const homeStrength = teamStrengthScore(homeTeam);
    const awayStrength = teamStrengthScore(awayTeam);
    const homeWinOdds = teamWinMultiplier(homeStrength, awayStrength, 1.35, 4.50);
    const awayWinOdds = teamWinMultiplier(awayStrength, homeStrength, 1.35, 4.50);
    const drawOdds = roundOdds(Math.max(2.70, Math.min(3.80, 2.95 + Math.abs(homeStrength - awayStrength) / 45)));
    rows.push(
      defaultMarket(match, "match_result", "Káº¿t quáº£ 1X2", "home", `${homeTeam.name || "Äá»™i nhÃ "} tháº¯ng`, null, homeWinOdds, "internal"),
      defaultMarket(match, "match_result", "Káº¿t quáº£ 1X2", "draw", "HÃ²a", null, drawOdds, "internal"),
      defaultMarket(match, "match_result", "Káº¿t quáº£ 1X2", "away", `${awayTeam.name || "Äá»™i khÃ¡ch"} tháº¯ng`, null, awayWinOdds, "internal"),
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
  await upsertJson("match_markets", rows, "match_id,market_key,selection_key,line_key");
  return rows.length;
}

async function closeInternalMarketFallbacks(matchIds, marketKey) {
  const ids = [...new Set((matchIds || []).map(Number).filter(Boolean))];
  if (!ids.length) return 0;
  const response = await supabaseFetch(
    `/rest/v1/match_markets?match_id=in.(${ids.join(",")})&market_key=eq.${encodeURIComponent(marketKey)}&source=eq.internal`,
    {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ is_open: false })
    }
  );
  if (!response.ok) {
    throw new Error(`Supabase close internal ${marketKey} fallback failed: ${response.status} ${await response.text()}`);
  }
  return ids.length;
}

async function closeMatchMarketByKey(matchIds, marketKey) {
  const ids = [...new Set((matchIds || []).map(Number).filter(Boolean))];
  if (!ids.length) return 0;
  const response = await supabaseFetch(
    `/rest/v1/match_markets?match_id=in.(${ids.join(",")})&market_key=eq.${encodeURIComponent(marketKey)}`,
    {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ is_open: false })
    }
  );
  if (!response.ok) {
    throw new Error(`Supabase close ${marketKey} markets failed: ${response.status} ${await response.text()}`);
  }
  return ids.length;
}

async function closeOutrightMarkets(marketKey, sourceFilter = "") {
  const filters = [`market_key=eq.${encodeURIComponent(marketKey)}`];
  if (sourceFilter) filters.push(`source=${sourceFilter}`);
  const response = await supabaseFetch(`/rest/v1/outright_markets?${filters.join("&")}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ is_open: false })
  });
  if (!response.ok) {
    throw new Error(`Supabase close ${marketKey} outrights failed: ${response.status} ${await response.text()}`);
  }
  return 1;
}

async function closeInternalTotalGoalFallbacks(matchIds) {
  return closeInternalMarketFallbacks(matchIds, "total_goals");
}

async function closeInternalHandicapFallbacks(matchIds) {
  return closeInternalMarketFallbacks(matchIds, "asian_handicap");
}

async function closeLockedMarketFallbacks(matchIds) {
  await closeMatchMarketByKey(matchIds, "draw_no_bet");
  await closeInternalMarketFallbacks(matchIds, "asian_handicap");
}

async function fetchTeamsForDefaultMarkets(matches) {
  const ids = [...new Set((matches || [])
    .flatMap((match) => [match.home_team_id, match.away_team_id, match.home_team?.id, match.away_team?.id])
    .filter(Boolean)
    .map(Number))];
  if (!ids.length) return new Map();
  const response = await supabaseFetch(`/rest/v1/teams?id=in.(${ids.join(",")})&select=id,code,name,fifa_rank,squad_market_value_eur,squad_value_rank`);
  if (!response.ok) {
    throw new Error(`Supabase fetch teams for markets failed: ${response.status} ${await response.text()}`);
  }
  const rows = await response.json();
  return new Map((rows || []).map((team) => [Number(team.id), team]));
}

async function ensureGoldenBootMarkets() {
  const response = await supabaseFetch("/rest/v1/rpc/ensure_golden_boot_markets", {
    method: "POST",
    body: JSON.stringify({})
  });
  if (!response.ok) {
    throw new Error(`Supabase ensure golden_boot markets failed: ${response.status} ${await response.text()}`);
  }
  return response.json();
}

function teamStrengthScore(team) {
  const fifaRank = Number(team?.fifa_rank || 0);
  const marketValue = Number(team?.squad_market_value_eur || 0);
  const valueRank = Number(team?.squad_value_rank || 0);
  const rankScore = fifaRank > 0 ? Math.max(0, 110 - fifaRank) * 0.55 : 28;
  const valueScore = marketValue > 0 ? Math.log((marketValue / 1000000) + 1) * 7 : 0;
  const squadRankScore = valueRank > 0 ? Math.max(0, 58 - valueRank) * 0.45 : 0;
  return Number((rankScore + valueScore + squadRankScore).toFixed(4));
}

function teamWinMultiplier(teamStrength, opponentStrength, floor, ceiling) {
  const sum = Number(teamStrength || 0) + Number(opponentStrength || 0);
  const share = sum <= 0 ? 0.5 : Number(teamStrength || 0) / sum;
  return roundOdds(Math.max(floor, Math.min(ceiling, 1.25 + (1 - share) * 3.2)));
}

function roundOdds(value) {
  return Number(Number(value).toFixed(2));
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
  const goldenBootMarkets = await ensureGoldenBootMarkets();
  await recordSyncRun({
    provider: "fifa",
    jobType: "squads",
    status: "success",
    requestCount: requests,
    message: `Synced ${rows.length} squad players for ${teams.length} teams from ${FIFA_SQUAD_SOURCE}; golden boot markets: ${goldenBootMarkets}.`
  });

  return {
    provider: "fifa",
    status: "success",
    requests,
    teams: teams.length,
    players: rows.length,
    goldenBootMarkets,
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
  const goldenBootMarkets = await ensureGoldenBootMarkets();

  const status = errors.length || unmatched.length ? "partial" : "success";
  await recordSyncRun({
    provider: "transfermarkt",
    jobType: "market-values",
    status,
    requestCount: requests,
    message: `Updated ${matchedTeams.length}/${localTeams.length} teams and ${updatedPlayers + insertedPlayers.length} players from ${TRANSFERMARKT_SOURCE}; golden boot markets: ${goldenBootMarkets}; unmatched: ${unmatched.slice(0, 8).join(", ") || "none"}; errors: ${errors.slice(0, 5).join(" | ") || "none"}.`
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
    goldenBootMarkets,
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

  const matchOdds = await fetchMatchOddsEvents();
  const events = matchOdds.events;
  const matchQuota = matchOdds.quota;
  const outrightOdds = await fetchOutrightOddsEvents();

  const matches = await getMatchesForOddsMapping();
  await resetProviderManagedMarketsToInternal(matches);
  await closeLockedMarketFallbacks(matches.map((match) => match.id));
  await closeOutrightMarkets("tournament_winner", "eq.internal");
  await closeOutrightMarkets("golden_boot", "neq.odds-api");
  let matchedEvents = 0;
  let updatedMarkets = 0;
  let updatedOutrights = 0;
  const providerTotalMatchIds = new Set();
  const providerHandicapMatchIds = new Set();

  for (const event of events) {
    const matched = matchOddsEvent(event, matches);
    if (!matched) continue;
    matchedEvents += 1;
    const candidates = bestPricesForEvent(event, matched.match, matched.reversed)
      .map((candidate) => ({ ...candidate, closes_at: matched.match.starts_at }));
    const correctScoreCandidate = correctScoreCandidateFromMarkets(candidates, matched.match);
    if (correctScoreCandidate) {
      candidates.push({ ...correctScoreCandidate, closes_at: matched.match.starts_at });
    }

    const markets = await upsertMarketsFromOdds(candidates);
    await insertOddsSnapshots(markets, candidates);
    for (const candidate of candidates) {
      if (candidate.market_key === "total_goals") {
        providerTotalMatchIds.add(Number(candidate.match_id));
      }
      if (candidate.market_key === "asian_handicap") {
        providerHandicapMatchIds.add(Number(candidate.match_id));
      }
      updatedMarkets += 1;
    }
  }

  await closeInternalTotalGoalFallbacks([...providerTotalMatchIds]);
  await closeInternalHandicapFallbacks([...providerHandicapMatchIds]);
  const derivedCorrectScoreMarkets = await ensureCorrectScoreMarketsFromCurrentMarkets(matches);
  updatedMarkets += derivedCorrectScoreMarkets;

  const teams = await getTeamsForOutrightMapping();
  const outrightCandidates = bestOutrightPrices(outrightOdds.events, teams);
  const outrightClosesAt = matches
    .map((match) => match.starts_at)
    .filter(Boolean)
    .sort()[0] || "2026-06-11T19:00:00+00:00";
  for (const candidate of outrightCandidates) {
    const rows = await upsertOutrightMarketFromOdds(candidate, outrightClosesAt);
    updatedOutrights += Array.isArray(rows) ? rows.length : 1;
  }

  const totalEvents = events.length + outrightOdds.events.length;
  const quota = mergeOddsQuota(matchQuota, outrightOdds.quota);
  const requests = matchOdds.requests + (outrightOdds.attempted ? 1 : 0);
  const oddsDataStatus = oddsProviderDataStatus(totalEvents, matchedEvents, updatedMarkets, updatedOutrights);
  const quotaText = oddsQuotaText(quota);
  const warningText = [matchOdds.warning, outrightOdds.error].filter(Boolean).join(" ");
  const message = oddsSyncMessage(oddsDataStatus, events.length, outrightOdds.events.length, matchedEvents, updatedMarkets, updatedOutrights, quotaText, warningText);

  await recordSyncRun({
    provider: "the-odds-api",
    jobType: "odds",
    status: "success",
    requestCount: requests,
    message
  });
  return {
    provider: "the-odds-api",
    status: "success",
    dataStatus: oddsDataStatus,
    requests,
    events: totalEvents,
    matchEvents: events.length,
    outrightEvents: outrightOdds.events.length,
    matchedEvents,
    updatedMarkets,
    updatedOutrights,
    quota,
    matchWarning: matchOdds.warning,
    outrightError: outrightOdds.error,
    message
  };
}

function oddsProviderDataStatus(events, matchedEvents, updatedMarkets, updatedOutrights) {
  if (!events) return "no_data";
  if (updatedMarkets || updatedOutrights) return "updated";
  if (!matchedEvents) return "unmatched";
  return "no_updates";
}

async function fetchOutrightOddsEvents() {
  try {
    const result = await oddsApi(`/sports/${WORLD_CUP_WINNER_SPORT_KEY}/odds`, oddsApiRequestParams(ODDS_API_OUTRIGHT_MARKETS));
    return { events: result.data, quota: result.quota, attempted: true, error: "" };
  } catch (error) {
    return {
      events: [],
      quota: null,
      attempted: true,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

async function fetchMatchOddsEvents() {
  try {
    // The /odds endpoint cannot mix outrights with match markets.
    const result = await oddsApi(`/sports/${WORLD_CUP_SPORT_KEY}/odds`, oddsApiRequestParams(ODDS_API_MAIN_MARKETS));
    return { events: result.data, quota: result.quota, requests: 1, warning: "" };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!isOddsMarketCompatibilityError(message)) throw error;
    try {
      const totalsFallback = await oddsApi(`/sports/${WORLD_CUP_SPORT_KEY}/odds`, oddsApiRequestParams(ODDS_API_TOTALS_FALLBACK_MARKETS));
      return {
        events: totalsFallback.data,
        quota: totalsFallback.quota,
        requests: 2,
        warning: `Match odds request with ${ODDS_API_MAIN_MARKETS} failed; retried with ${ODDS_API_TOTALS_FALLBACK_MARKETS}.`
      };
    } catch (fallbackError) {
      const fallbackMessage = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
      if (!isOddsMarketCompatibilityError(fallbackMessage)) throw fallbackError;
      const h2hFallback = await oddsApi(`/sports/${WORLD_CUP_SPORT_KEY}/odds`, oddsApiRequestParams(ODDS_API_MATCH_FALLBACK_MARKETS));
      return {
        events: h2hFallback.data,
        quota: h2hFallback.quota,
        requests: 3,
        warning: `Match odds request with ${ODDS_API_MAIN_MARKETS} failed; retried with ${ODDS_API_TOTALS_FALLBACK_MARKETS}, then ${ODDS_API_MATCH_FALLBACK_MARKETS}.`
      };
    }
  }
}

function isOddsMarketCompatibilityError(message) {
  return /INVALID_MARKET|INVALID_MARKET_COMBO|422/.test(String(message || ""));
}

function mergeOddsQuota(...quotas) {
  const present = quotas.filter(Boolean);
  if (!present.length) return null;
  const latest = [...present].reverse().find((quota) => quota.remaining !== null && quota.remaining !== undefined) || present[present.length - 1];
  const lastValues = present
    .map((quota) => Number(quota.last))
    .filter((value) => Number.isFinite(value));
  const usedValues = present
    .map((quota) => Number(quota.used))
    .filter((value) => Number.isFinite(value));
  return {
    remaining: latest.remaining ?? null,
    used: usedValues.length ? Math.max(...usedValues) : latest.used ?? null,
    last: lastValues.length ? lastValues.reduce((sum, value) => sum + value, 0) : latest.last ?? null
  };
}

function oddsQuotaText(quota) {
  if (!quota || quota.remaining === null || quota.remaining === undefined) return "";
  const parts = [`còn ${quota.remaining} API calls`];
  if (quota.used !== null && quota.used !== undefined) parts.push(`đã dùng ${quota.used}`);
  if (quota.last !== null && quota.last !== undefined) parts.push(`lần này ${quota.last}`);
  return parts.join(", ");
}

function oddsSyncMessage(dataStatus, matchEvents, outrightEvents, matchedEvents, updatedMarkets, updatedOutrights, quotaText = "", warning = "") {
  const suffix = quotaText ? ` Quota: ${quotaText}.` : "";
  const eventText = `${matchEvents} match events, ${outrightEvents} outright events`;
  const warningText = warning ? ` Warning: ${warning}` : "";
  if (dataStatus === "no_data") {
    return `The Odds API chưa trả World Cup odds events cho request hiện tại.${warningText}${suffix}`;
  }
  if (dataStatus === "unmatched") {
    return `Fetched ${eventText} nhưng chưa match được với lịch Supabase; chưa cập nhật market.${warningText}${suffix}`;
  }
  if (dataStatus === "no_updates") {
    return `Fetched ${eventText}, matched ${matchedEvents}, nhưng không có market/outright mới để cập nhật.${warningText}${suffix}`;
  }
  return `Fetched ${eventText}; matched ${matchedEvents}; updated ${updatedMarkets} match markets and ${updatedOutrights} outrights.${warningText}${suffix}`;
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
  try {
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

    // Admin-triggered calls settle as the admin; cron/secret calls settle as service role.
    const settlementToken = auth.mode === "admin"
      ? (request.headers.authorization || "").replace(/^Bearer\s+/i, "")
      : null;

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
    const includeFifaResults = body.includeFifaResults !== false; // defaults to true
    const includeFifaCalendar = body.includeFifaCalendar === true; // opt-in secondary FIFA source
    const autoSettle = body.autoSettle !== false; // defaults to true when caller token is available
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

    // ── ESPN result sync (primary result source, no API key needed) ───────
    const espnResult = includeFifaResults
      ? await runProviderJob({
          provider: "espn",
          jobType: "results",
          fallback: { updated: 0, results: 0, completedScores: 0, completedMatchIds: [] },
          task: syncEspnResults
        })
      : { provider: "espn", status: "skipped", requests: 0, updated: 0, results: 0, completedScores: 0, completedMatchIds: [] };

    // FIFA Fantasy fallback (if ESPN found nothing)
    const fifaFantasyResult = (includeFifaResults && (espnResult.status !== "success" || Number(espnResult.completedScores || 0) === 0))
      ? await runProviderJob({
          provider: "fifa-fantasy",
          jobType: "results",
          fallback: { updated: 0, results: 0, completedScores: 0, completedMatchIds: [] },
          task: syncFifaFantasyResults
        })
      : { provider: "fifa-fantasy", status: "skipped", requests: 0, updated: 0, results: 0, completedScores: 0, completedMatchIds: [] };

    // FIFA Calendar fallback (if ESPN + FIFA Fantasy both failed)
    const fifaCalendarResult = (includeFifaResults && Number(espnResult.completedScores || 0) === 0 && Number(fifaFantasyResult.completedScores || 0) === 0) || includeFifaCalendar
      ? await runProviderJob({
          provider: "fifa-calendar",
          jobType: "results",
          fallback: { updated: 0, results: 0, completedScores: 0, completedMatchIds: [] },
          task: syncFifaCalendarResults
        })
      : { provider: "fifa-calendar", status: "skipped", requests: 0, updated: 0, results: 0, completedScores: 0, completedMatchIds: [] };

    // Collect all newly-completed match IDs from all result sources
    const newlyCompletedIds = [
      ...(espnResult.completedMatchIds || []),
      ...(fifaFantasyResult.completedMatchIds || []),
      ...(fifaCalendarResult.completedMatchIds || [])
    ];

    // ── API-Football fixture sync ────────────────────────────────────────
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

    // Also collect matches that API-Football marked as completed
    if (fixtureResult.completedMatchIds) newlyCompletedIds.push(...fixtureResult.completedMatchIds);
    if (footballDataResult.completedMatchIds) newlyCompletedIds.push(...footballDataResult.completedMatchIds);

    // ── Auto-settle newly completed matches ───────────────────────────────
    let settledBets = 0;
    if (autoSettle) {
      // Settle newly-completed + any FT matches that still have unsettled bets
      const toSettle = [...new Set(newlyCompletedIds)];
      try {
        const ftRes = await supabaseFetch("/rest/v1/matches?status=in.(FT,AET,PEN,FT_PEN)&select=id");
        if (ftRes.ok) {
          const ftMatches = await ftRes.json();
          const ftIds = ftMatches.map((m) => m.id);
          if (ftIds.length) {
            const betsRes = await supabaseFetch(`/rest/v1/bets?status=eq.placed&match_id=in.(${ftIds.join(",")})&select=match_id`);
            if (betsRes.ok) {
              const unsettled = await betsRes.json();
              const unsettledIds = [...new Set(unsettled.map((b) => b.match_id))];
              for (const id of unsettledIds) { if (!toSettle.includes(id)) toSettle.push(id); }
            }
          }
        }
      } catch { /* non-fatal */ }
      if (toSettle.length) settledBets = await autoSettleMatches(toSettle, settlementToken);
    }

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

    const results = [espnResult, fifaFantasyResult, fifaCalendarResult, fixtureResult, footballDataResult, statsResult, rankingResult, fifaProfileResult, squadResult, transfermarktResult, oddsResult];
    const status = results.some((result) => result.status === "failed" || result.status === "partial") ? "partial" : "ok";
    return send(response, 200, {
      status,
      settledBets,
      newlyCompleted: newlyCompletedIds.length,
      espnResult,
      fifaFantasyResult,
      fifaCalendarResult,
      fixtureResult,
      footballDataResult,
      statsResult,
      rankingResult,
      fifaProfileResult,
      squadResult,
      transfermarktResult,
      oddsResult
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return send(response, 500, { error: message });
  }
}
