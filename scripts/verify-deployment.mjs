const deploymentUrl = normalizeBaseUrl(process.argv[2] || process.env.DEPLOYMENT_URL || "");
const shouldSync = process.argv.includes("--sync");
const cronSecret = process.env.CRON_SECRET || "";

const requiredChecks = [
  "supabaseUrl",
  "supabaseAnonKey",
  "supabaseServiceRoleKey",
  "cronSecret",
  "apiFootballKey",
  "oddsApiKey"
];

function normalizeBaseUrl(value) {
  const trimmed = String(value || "").trim().replace(/\/+$/, "");
  if (!trimmed) return "";
  if (!/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function readJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  let payload = {};
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`${url} did not return JSON: ${text.slice(0, 160)}`);
  }
  if (!response.ok) {
    throw new Error(`${url} failed with ${response.status}: ${JSON.stringify(payload)}`);
  }
  return payload;
}

async function verifyHealth() {
  const health = await readJson(`${deploymentUrl}/api/health`);
  const missing = requiredChecks.filter((key) => health.checks?.[key] !== true);
  assert(missing.length === 0, `Deployment env is missing: ${missing.join(", ")}`);
  console.log(`pass deployment health (${deploymentUrl})`);
  console.log(`pass max stats fixtures: ${Number(health.maxStatsFixtures || 12)}`);
}

async function verifySync() {
  assert(cronSecret, "Set CRON_SECRET in the local shell before running --sync.");
  const payload = await readJson(`${deploymentUrl}/api/sync-football-data`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cronSecret}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ includeOdds: true, includeStats: true })
  });

  assert(payload.status === "ok", `Provider sync did not return ok: ${JSON.stringify(payload)}`);
  console.log(`pass provider sync: fixtures=${payload.fixtureResult?.status}, stats=${payload.statsResult?.status}, odds=${payload.oddsResult?.status}`);
  console.log(
    `sync counts: matches=${payload.fixtureResult?.matches ?? 0}, stats=${payload.statsResult?.stats ?? 0}, oddsEvents=${payload.oddsResult?.events ?? 0}, matchedOdds=${payload.oddsResult?.matchedEvents ?? 0}`
  );
}

async function main() {
  assert(deploymentUrl, "Usage: node scripts/verify-deployment.mjs <vercel-url> [--sync]");
  await verifyHealth();
  if (shouldSync) {
    await verifySync();
  } else {
    console.log("skip provider sync (add --sync and set local CRON_SECRET to test it)");
  }
  console.log("deployment verification passed");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
