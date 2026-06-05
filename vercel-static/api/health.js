function present(value) {
  return typeof value === "string" && value.trim().length > 0;
}

export default function handler(_request, response) {
  const checks = {
    supabaseUrl: present(process.env.SUPABASE_URL),
    supabaseAnonKey: present(process.env.SUPABASE_ANON_KEY),
    supabaseServiceRoleKey: present(process.env.SUPABASE_SERVICE_ROLE_KEY),
    cronSecret: present(process.env.CRON_SECRET),
    apiFootballKey: present(process.env.API_FOOTBALL_KEY),
    oddsApiKey: present(process.env.ODDS_API_KEY),
    footballDataApiToken: present(process.env.FOOTBALL_DATA_API_TOKEN)
  };

  response.status(200).json({
    ok: Object.values(checks).every(Boolean),
    checks,
    maxStatsFixtures: Number(process.env.MAX_STATS_FIXTURES || 12)
  });
}
