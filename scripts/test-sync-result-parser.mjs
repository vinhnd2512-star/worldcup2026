import assert from "node:assert/strict";
import test from "node:test";

import {
  espnRegularTimeScore,
  extractEspnFixtures,
  mergeEspnSummaryPeriodScores
} from "../vercel-static/api/sync-football-data.js";

function competitor(homeAway, abbreviation, score, linescores) {
  return {
    homeAway,
    score,
    team: { abbreviation },
    ...(linescores ? { linescores: linescores.map((displayValue) => ({ displayValue })) } : {})
  };
}

test("ESPN AET result uses the first two periods as the 90-minute score", () => {
  const home = competitor("home", "ARG", "3", ["1", "0", "1", "1"]);
  const away = competitor("away", "CPV", "2", ["0", "1", "1", "0"]);
  assert.deepEqual(espnRegularTimeScore(home, away), { home: 1, away: 1 });

  const [fixture] = extractEspnFixtures({
    events: [{
      id: "760500",
      date: "2026-07-03T22:00Z",
      competitions: [{
        status: { type: { name: "STATUS_FINAL_AET", state: "post" } },
        competitors: [home, away]
      }]
    }]
  });

  assert.equal(fixture.status, "AET");
  assert.deepEqual(
    {
      homeScore: fixture.homeScore,
      awayScore: fixture.awayScore,
      homeFinalScore: fixture.homeFinalScore,
      awayFinalScore: fixture.awayFinalScore
    },
    { homeScore: 1, awayScore: 1, homeFinalScore: 3, awayFinalScore: 2 }
  );
});

test("ESPN scoreboard can be enriched from summary period scores", () => {
  const event = {
    competitions: [{
      competitors: [
        competitor("home", "ARG", "3"),
        competitor("away", "CPV", "2")
      ]
    }]
  };
  const summary = {
    header: {
      competitions: [{
        competitors: [
          competitor("home", "ARG", "3", ["1", "0", "1", "1"]),
          competitor("away", "CPV", "2", ["0", "1", "1", "0"])
        ]
      }]
    }
  };

  assert.equal(mergeEspnSummaryPeriodScores(event, summary), true);
  const [home, away] = event.competitions[0].competitors;
  assert.deepEqual(espnRegularTimeScore(home, away), { home: 1, away: 1 });
});

test("AET without period scores stays unsettled instead of using the final score", () => {
  const [fixture] = extractEspnFixtures({
    events: [{
      id: "760500",
      competitions: [{
        status: { type: { name: "STATUS_FINAL_AET", state: "post" } },
        competitors: [
          competitor("home", "ARG", "3"),
          competitor("away", "CPV", "2")
        ]
      }]
    }]
  });

  assert.equal(fixture.homeScore, null);
  assert.equal(fixture.awayScore, null);
  assert.equal(fixture.homeFinalScore, 3);
  assert.equal(fixture.awayFinalScore, 2);
});
