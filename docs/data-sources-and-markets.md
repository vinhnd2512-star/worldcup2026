# Data Sources And Markets

## Recommended Data Sources

### Primary football data: API-FOOTBALL

Use API-FOOTBALL as the primary football provider for the MVP.

- World Cup 2026 uses `league=1` and `season=2026`.
- Use `fixtures?league=1&season=2026` for the 104-match schedule, fixture IDs, UTC kickoff time, venue, and status.
- Use `teams?league=1&season=2026` for the 48 teams.
- Use `/fixtures/rounds`, `/standings`, `/predictions`, `/odds`, and match/player statistics later as quota allows.
- The free API-Sports football plan is suitable for a private MVP only if polling is cached server-side.

Current implementation:

- `vercel-static/api/sync-football-data.js` fetches fixtures from API-FOOTBALL and upserts `teams` and `matches`.
- It syncs match statistics from `/fixtures/statistics` into `match_stats` for live/recently finished matches, capped by `MAX_STATS_FIXTURES`.
- API keys stay in Vercel server-side environment variables.

References:

- https://www.api-football.com/news/post/fifa-world-cup-2026-guide-to-using-data-with-api-sports
- https://api-sports.io/sports/football

### Odds source: The Odds API

Use The Odds API for bookmaker-style markets where available.

- Sport key: `soccer_fifa_world_cup`.
- Start the main match `/odds` sync with endpoint-supported markets: `h2h` and `totals`.
- If the provider rejects the match-market combination for the current plan/region, retry with `h2h` only so 1X2 odds can still update.
- Sync tournament-winner outrights separately from `soccer_fifa_world_cup_winner` with `outrights`, because outrights cannot be mixed with match markets for `soccer_fifa_world_cup`.
- Keep `draw_no_bet` on internal/admin odds unless a separate event-odds sync is added, because The Odds API rejects `draw_no_bet` on the main `/odds` endpoint.
- The Odds API currently rejects direct `correct_score` for `soccer_fifa_world_cup` with `INVALID_MARKET`; derive correct-score fair odds from synced `h2h` and `totals` instead of using a fixed multiplier.
- Keep regions narrow, for example `eu`, because each market/region consumes quota.
- Map odds into `match_markets` conservatively; verify real 2026 provider event names after API keys are configured.

Current implementation:

- `vercel-static/api/sync-football-data.js` fetches World Cup odds events.
- Events map to Supabase matches only when both team names match after normalization and kickoff times are within a 36-hour window.
- Matched events update `match_markets` for 1X2 (`h2h`) and total goals (`totals`).
- Total-goals markets use the provider's line per match, for example 2.25, 2.5, 2.75, or 3.0. The internal 2.5 fallback is closed for matches where provider totals exist, and remains open only when the provider has no totals for that match.
- Correct-score markets store a Poisson model in `match_markets.extra_json.score_odds`. The model normalizes 1X2 probabilities, estimates expected total goals from the closest balanced totals line, calibrates home/away expected goals, then locks the fair odds for the exact submitted score in `place_bet` and `update_bet`.
- Outright outcomes update `outright_markets` for tournament winner when the provider team name matches a Supabase team.
- Provider payloads are stored in `odds_snapshots`.
- Player-facing markets show the odds source, bookmaker when available, and last provider update time from `extra_json`.
- Admin can override match-market multipliers, lock times, and open/closed state through `admin_update_match_market`; manual changes are marked with source `admin` and audited.
- Admin can override tournament-winner outright multipliers, lock times, and open/closed state through `admin_update_outright_market`, so the private game can still run if provider outrights are incomplete.
- Unmatched events are skipped instead of guessed, so the first live provider sync should be reviewed in the Admin tab.

References:

- https://the-odds-api.com/sports/fifa-world-cup-odds.html
- https://the-odds-api.com/liveapi/guides/v4/

### Fallback fixture/result source: football-data.org

Use football-data.org as a fallback for basic fixture/result coverage if API-FOOTBALL quota or availability becomes a blocker. The Vercel sync function calls `/v4/competitions/WC/matches?season=2026` with `X-Auth-Token` when API-FOOTBALL fixture sync fails.

Reference:

- https://www.football-data.org/coverage

### Team ranking and player roster sources

Use FIFA rankings as the authoritative team-strength display and keep the source/date on every imported value.

- FIFA/Coca-Cola Men's World Ranking live API stores team rank and points for `teams.fifa_rank`, `teams.fifa_points`, `teams.rating_source`, and `teams.rating_updated_at`. The sync merges by `TeamName[].Description` first, then falls back to `IdCountry` matching `teams.code`.
- FIFA competition teams (`/api/v3/competitions/teams/285023`) map official `teams.fifa_team_id`, profile payload, coach fallback, and World Cup title metadata.
- FIFA official squad endpoint (`/api/v3/teams/{fifa_team_id}/squad?idCompetition=17&idSeason=285023`) is the authoritative `team_players` source for name, position, shirt number, birth date, height, weight, photo, and raw FIFA payload.
- API-FOOTBALL `players/squads` is no longer the primary roster source, but API-FOOTBALL still powers fixture/stat sync when configured.
- football-data.org team resources can fill basic squad fields when API-FOOTBALL coverage or quota is unavailable.
- EA SPORTS FC ratings can be imported manually for optional `team_players.overall_rating`; treat them as game ratings, not official FIFA ratings.

References:

- https://inside.fifa.com/fifa-world-ranking/men
- https://api.fifa.com/api/v3/fifarankings/rankings/live?gender=1&sportType=0&language=en
- https://api.fifa.com/api/v3/competitions/teams/285023?language=en
- https://api.fifa.com/api/v3/teams/43922/squad?idCompetition=17&idSeason=285023&language=en
- https://www.fifa.com/en/articles/fifa-world-cup-2026-squads-confirmed
- https://www.api-football.com/documentation-v3#operation/get-players-squads
- https://docs.football-data.org/general/v4/team.html
- https://www.ea.com/en/games/ea-sports-fc/ratings

### Official knockout bracket: FIFA

The app includes `supabase/seed_bracket.sql`, which seeds the official FIFA World Cup 2026 knockout path for matches 73-104 into `bracket_matches`. This gives players an in-app bracket even when free fixture APIs do not cover World Cup 2026.

Reference:

- https://www.fifa.com/en/articles/knockout-stage-match-schedule-bracket

## MVP Betting Markets

### Implemented In Schema/Settlement

- Correct score
- 1X2 match result
- Draw no bet
- Over/under total goals
- Both teams to score
- Over/under total corners
- Over/under total cards
- Tournament winner/outright picks

Standard match markets settle on the 90-minute score stored in `matches.home_score` and `matches.away_score`. Markets that settle on qualification or extra-time result should use a different market key and label.

`place_bet` validates and derives the submitted selection server-side. For all option markets, `selection_key` must match the selected `match_markets` row and the stored label/key come from that market row, not from the browser. Correct-score bets are the exception because players enter a free scoreline; those payloads must include non-negative `home_score` and `away_score`, then the stored key/label are derived from those scores.

Tournament winner uses `outright_markets`, can be manually managed by admin, and settles through `settle_tournament_winner`, because it is not tied to one fixture.

## Scoring Formula

Wallet settlement stays bookmaker-style:

- placing a bet deducts stake from wallet;
- a winning bet credits `stake × locked_multiplier` and writes a payout ledger entry;
- a losing bet credits nothing;
- a void/refund credits the original stake and writes a refund ledger entry.

Admin can void a single open bet through `admin_void_bet`. This is for operational correction only: it changes a `placed` bet to `refunded`, returns the stake, records a settlement row, writes a wallet ledger refund, and audits the reason.

Leaderboard score is separate from wallet balance:

```text
leaderboard_score = settled_net_points + prediction_bonus
```

Prediction bonuses reward accuracy and do not top up the wallet:

- correct score win: `+50`
- tournament winner win: `+25`
- 1X2 result win: `+10`
- draw no bet, total goals, or BTTS win: `+8`
- corners/cards internal market win: `+6`

Admin top-ups only affect wallet balance and are excluded from leaderboard score.

### Internal Markets

Corners and cards stay internal until a reliable free odds feed is confirmed. The app settles them from `match_stats` using fixed internal multipliers, with API-FOOTBALL statistics sync filling corner and card counts when available.

### Tournament/Fantasy Extensions

Add these after the core flow is stable:

- group winner/qualified teams;
- clean sheet, first scorer, anytime scorer if provider coverage allows;
- FPL-style bonus points for streaks, accuracy, correct-score count, ROI, and rank movement.

Fantasy reference:

- https://www.premierleague.com/en/news/2174909/fpl-basics-scoring

## Polling Policy

- Never call sports/odds providers from the browser.
- Fixtures/teams: daily, or manual admin sync.
- Odds: every few hours pre-match; tighter near kickoff only if quota allows.
- Live scores/stats: only during active/recently finished match windows, capped by `MAX_STATS_FIXTURES`.
- Settlement: after full time, then retry later for corrections.
