import { Readable } from "node:stream";

import syncFootballData from "./sync-football-data.js";

export default async function handler(request, response) {
  const body = JSON.stringify({
    includeFixtures: false,
    includeOdds: false,
    includeStats: true,
    includeRankings: false,
    includeSquads: false,
    includeFifaProfiles: false,
    includeTransfermarkt: false,
    includeFifaResults: true,
    includeFifaCalendar: true,
    autoSettle: true,
    maxStatsFixtures: 20
  });

  const wrapped = Readable.from([Buffer.from(body)]);
  wrapped.method = "POST";
  wrapped.headers = request.headers || {};
  return syncFootballData(wrapped, response);
}
