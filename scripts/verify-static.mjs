import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const requiredFiles = [
  "vercel-static/index.html",
  "vercel-static/app.js",
  "vercel-static/styles.css",
  "vercel-static/vercel.json",
  "vercel-static/.env.example",
  "vercel-static/api/config.js",
  "vercel-static/api/health.js",
  "vercel-static/api/admin-create-user.js",
  "vercel-static/api/admin-reset-password.js",
  "vercel-static/api/sync-football-data.js",
  "scripts/verify-deployment.mjs",
  "supabase/schema.sql",
  "supabase/seed.sql",
  "supabase/seed_bracket.sql",
  "docs/deploy-checklist.md",
  "docs/launch-smoke-test.md",
  "docs/data-sources-and-markets.md",
  "docs/specs/mvp.md",
  "feature_list.json"
];

const jsFiles = [
  "vercel-static/app.js",
  "vercel-static/api/config.js",
  "vercel-static/api/health.js",
  "vercel-static/api/admin-create-user.js",
  "vercel-static/api/admin-reset-password.js",
  "vercel-static/api/sync-football-data.js",
  "scripts/verify-deployment.mjs"
];

const requiredEnv = [
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "CRON_SECRET",
  "API_FOOTBALL_KEY",
  "ODDS_API_KEY",
  "FOOTBALL_DATA_API_TOKEN"
];

const requiredAppTokens = [
  "place_bet",
  "update_bet",
  "place_outright_bet",
  "settle_tournament_winner",
  "admin_adjust_wallet",
  "admin_update_match_market",
  "admin_update_outright_market",
  "admin_void_bet",
  "admin-create-user",
  "admin-reset-password",
  "sync-football-data",
  "downloadCsv",
  "outright_markets",
  "draw_no_bet",
  "prediction_bonus",
  "wallet_ledger",
  "audit_logs",
  "exportAuditCsv",
  "exportReportsCsv",
  "admin_user_report",
  "admin_market_report",
  "admin_report",
  "Deployment health",
  "oddsFreshnessLabel",
  "bracket_matches",
  "renderBracket",
  "renderReminderPanel",
  "renderPredictionStats",
  "data-prediction-stats-tab",
  "update-bet-form",
  "data-match-filter",
  "matchFilter",
  "predictionStats",
  "renderTeamProfile",
  "teamProfile",
  "projectedLineup",
  "data-refresh-fifa-team",
  "data-refresh-all-fifa-teams",
  "refreshAllFifaTeams",
  "selectedRoleGroup",
  "data-role-filter",
  "renderInteractivePitch",
  "renderRoleSquadSections",
  "football-pitch",
  "Champion",
  "admin-filter-form",
  "applyAdminFilters"
];

const requiredSyncTokens = [
  "ODDS_API_MAIN_MARKETS = \"h2h,totals,outrights\"",
  "FIFA_RANKING_URL",
  "FIFA_RANKING_API_URL",
  "FIFA_RANKING_SOURCE",
  "syncFifaRankings",
  "fifaRankingsLive",
  "fifaRankingDescription",
  "fifaRankingRows",
  "TeamName",
  "Description",
  "TotalPoints",
  "IdCountry",
  "FIFA_WORLD_CUP_COMPETITION_ID",
  "FIFA_WORLD_CUP_SEASON_ID",
  "FIFA_TEAM_SOURCE",
  "FIFA_SQUAD_SOURCE",
  "syncFifaTeamProfiles",
  "syncFifaSquads",
  "/competitions/teams/",
  "/squad",
  "fifa_team_id",
  "bestOutrightPrices",
  "updatedOutrights",
  "syncApiFootballStats",
  "syncFootballDataFixtures",
  "ensureDefaultMarketsForMatches",
  "linkFootballDataBracketMatches",
  "FOOTBALL_DATA_API_TOKEN",
  "football-data.org",
  "/fixtures/statistics",
  "MAX_STATS_FIXTURES",
  "MAX_SQUAD_TEAMS",
  "includeFifaProfiles",
  "includeRankings",
  "includeSquads",
  "match_stats",
  "team_players",
  "/rest/v1/outright_markets"
];

const requiredSqlTokens = [
  "create table if not exists public.profiles",
  "create table if not exists public.wallet_ledger",
  "create table if not exists public.matches",
  "create table if not exists public.match_markets",
  "create table if not exists public.bracket_matches",
  "match_id bigint references public.matches",
  "create table if not exists public.outright_markets",
  "create table if not exists public.bets",
  "create table if not exists public.audit_logs",
  "fifa_rank",
  "fifa_points",
  "fifa_team_id",
  "fifa_profile_json",
  "coach_name",
  "world_cup_titles",
  "world_cup_title_years",
  "overall_rating",
  "height_cm",
  "weight_kg",
  "preferred_foot",
  "fifa_payload_json",
  "create table if not exists public.team_lineups",
  "rating_source",
  "rating_updated_at",
  "create index if not exists bets_user_placed_at_idx",
  "create index if not exists bets_open_match_idx",
  "create index if not exists wallet_ledger_user_created_at_idx",
  "create index if not exists audit_logs_created_at_idx",
  "create index if not exists match_markets_match_open_closes_idx",
  "create or replace view public.leaderboard",
  "create or replace view public.admin_report",
  "create or replace view public.admin_user_report",
  "create or replace view public.admin_market_report",
  "prediction_bonus",
  "draw_no_bet",
  "public_read_bracket_matches",
  "selection does not match selected market",
  "v_selection_label := v_market.selection_label",
  "v_selection_key := (p_selection_json->>'home_score') || '-'",
  "bet_payout",
  "bet_refund",
  "create or replace function public.place_bet",
  "create or replace function public.update_bet",
  "create or replace function public.place_outright_bet",
  "create or replace function public.admin_update_match_market",
  "create or replace function public.admin_update_outright_market",
  "create or replace function public.admin_void_bet",
  "create or replace function public.settle_match_bets",
  "create or replace function public.settle_tournament_winner",
  "bet_stake_adjustment",
  "bet_stake_refund",
  "'bet.update'",
  "enable row level security"
];

const secretScanExemptions = new Set([
  ".env.example",
  "vercel-static/.env",
  "scripts/verify-static.mjs",
  "Harness Engineering/check_secrets.py"
]);

const secretScanExtensions = new Set([
  ".js",
  ".mjs",
  ".ts",
  ".tsx",
  ".html",
  ".css",
  ".sql",
  ".json",
  ".md",
  ".py"
]);

const secretPatterns = [
  [/eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/, "JWT-like token"],
  [/\b(service[_-]?role|anon)[_-]?key\s*[:=]\s*["'][^"']{20,}["']/i, "hardcoded Supabase key"],
  [/\b(api[_-]?key|apikey|secret|password|token)\s*[:=]\s*["'][^"']{12,}["']/i, "hardcoded secret assignment"],
  [/\bsk-[A-Za-z0-9]{32,}\b/, "OpenAI-style secret key"]
];

function read(relativePath) {
  return readFileSync(join(root, relativePath), "utf8");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function checkFiles() {
  for (const file of requiredFiles) {
    assert(existsSync(join(root, file)), `Missing required file: ${file}`);
  }
}

function checkJson() {
  JSON.parse(read("vercel-static/vercel.json"));
  JSON.parse(read("feature_list.json"));
}

function checkJsSyntax() {
  for (const file of jsFiles) {
    execFileSync("node", ["--check", file], { cwd: root, stdio: "pipe" });
  }
}

function checkEnvExample() {
  const envText = read("vercel-static/.env.example");
  for (const key of requiredEnv) {
    assert(new RegExp(`^${key}=`, "m").test(envText), `Missing env key in .env.example: ${key}`);
  }
}

function parseDotEnv(relativePath) {
  if (!existsSync(join(root, relativePath))) {
    return null;
  }

  const values = new Map();
  for (const rawLine of read(relativePath).split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator < 0) continue;
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim().replace(/^["']|["']$/g, "");
    values.set(key, value);
  }
  return values;
}

function envShapeValid(key, value) {
  if (!value) return false;
  const legacyJwt = /^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
  if (key === "SUPABASE_URL") {
    return /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(value);
  }
  if (key === "SUPABASE_ANON_KEY") {
    return legacyJwt.test(value) || /^sb_publishable_[A-Za-z0-9_-]+$/.test(value);
  }
  if (key === "SUPABASE_SERVICE_ROLE_KEY") {
    return legacyJwt.test(value) || /^sb_secret_[A-Za-z0-9_-]+$/.test(value);
  }
  if (key === "MAX_STATS_FIXTURES") {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed >= 0 && parsed <= 50;
  }
  if (key === "MAX_SQUAD_TEAMS") {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed >= 0 && parsed <= 64;
  }
  return value.length >= 12;
}

function reportLocalEnvReadiness() {
  const values = parseDotEnv("vercel-static/.env");
  if (!values) {
    console.log("skip local env readiness (vercel-static/.env not found)");
    return;
  }

  const invalid = [];
  for (const key of [...requiredEnv, "MAX_STATS_FIXTURES", "MAX_SQUAD_TEAMS"]) {
    const value = values.get(key) || "";
    if (!envShapeValid(key, value)) {
      invalid.push(key);
    }
  }

  if (invalid.length) {
    console.log(`warn local env readiness: missing or invalid shape for ${invalid.join(", ")}`);
    return;
  }

  console.log("pass local env readiness");
}

function checkStaticContracts() {
  const index = read("vercel-static/index.html");
  const app = read("vercel-static/app.js");
  const sync = read("vercel-static/api/sync-football-data.js");
  const schema = read("supabase/schema.sql");
  const seed = read("supabase/seed.sql");
  const vercel = JSON.parse(read("vercel-static/vercel.json"));

  assert(index.includes('lang="vi"'), "index.html should declare Vietnamese language.");
  assert(index.includes('charset="utf-8"'), "index.html should declare UTF-8.");
  assert(index.includes("@supabase/supabase-js@2"), "index.html should load Supabase JS v2 from CDN.");

  for (const token of requiredAppTokens) {
    assert(app.includes(token), `app.js missing contract token: ${token}`);
  }
  for (const token of requiredSyncTokens) {
    assert(sync.includes(token), `sync-football-data.js missing contract token: ${token}`);
  }
  for (const token of requiredSqlTokens) {
    assert(schema.includes(token), `schema.sql missing contract token: ${token}`);
  }

  assert(seed.includes("tournament_winner"), "seed.sql should seed tournament winner markets.");
  assert(seed.includes("draw_no_bet"), "seed.sql should seed draw no bet markets.");
  assert(seed.includes("corners_total"), "seed.sql should seed corners markets.");
  assert(seed.includes("cards_total"), "seed.sql should seed cards markets.");
  assert(read("supabase/seed_bracket.sql").includes("(104, 'final'"), "seed_bracket.sql should seed the World Cup final bracket match.");
  assert(schema.includes("line_key"), "schema.sql should include line_key duplicate protection.");
  assert(schema.includes("security_invoker"), "schema.sql should define view security behavior.");

  assert(
    vercel.crons?.some((cron) => cron.path === "/api/sync-football-data"),
    "vercel.json should schedule provider sync cron."
  );
  assert(
    vercel.rewrites?.some((rewrite) => rewrite.destination === "/index.html"),
    "vercel.json should route static app paths to index.html."
  );
}

function checkEncodingSmoke() {
  const files = [
    "vercel-static/index.html",
    "vercel-static/app.js",
    "supabase/seed.sql"
  ];
  const badPatterns = [/�/, /Nháº/, /Ä/, /Ã/];
  for (const file of files) {
    const content = read(file);
    for (const pattern of badPatterns) {
      assert(!pattern.test(content), `${file} appears to contain mojibake: ${pattern}`);
    }
  }
}

function walkFiles(relativeDir = ".") {
  const absoluteDir = join(root, relativeDir);
  const entries = readdirSync(absoluteDir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const relativePath = relativeDir === "." ? entry.name : `${relativeDir}/${entry.name}`;
    const absolutePath = join(root, relativePath);

    if (entry.isDirectory()) {
      if ([".git", "node_modules", "__pycache__", ".vercel", ".venv", "venv", "env", "dist", "build"].includes(entry.name)) {
        continue;
      }
      files.push(...walkFiles(relativePath));
      continue;
    }

    if (!entry.isFile() || statSync(absolutePath).size > 1_000_000) {
      continue;
    }

    const dotIndex = entry.name.lastIndexOf(".");
    const extension = dotIndex >= 0 ? entry.name.slice(dotIndex) : "";
    if (secretScanExtensions.has(extension) || entry.name.startsWith(".env")) {
      files.push(relativePath.replaceAll("\\", "/"));
    }
  }

  return files;
}

function checkNoHardcodedSecrets() {
  for (const file of walkFiles()) {
    if (secretScanExemptions.has(file)) {
      continue;
    }

    const content = read(file);
    for (const [pattern, label] of secretPatterns) {
      assert(!pattern.test(content), `${file} appears to contain ${label}. Use environment variables instead.`);
    }
  }
}

function main() {
  const checks = [
    ["files", checkFiles],
    ["json", checkJson],
    ["js syntax", checkJsSyntax],
    ["env example", checkEnvExample],
    ["secrets", checkNoHardcodedSecrets],
    ["contracts", checkStaticContracts],
    ["encoding", checkEncodingSmoke]
  ];

  for (const [name, check] of checks) {
    check();
    console.log(`pass ${name}`);
  }
  reportLocalEnvReadiness();
  console.log("static verification passed");
}

main();
