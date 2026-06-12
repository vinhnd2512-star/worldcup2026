from dataclasses import dataclass, field
from typing import Any

import httpx


ODDS_API_BASE_URL = "https://api.the-odds-api.com/v4"
WORLD_CUP_SPORT_KEY = "soccer_fifa_world_cup"


@dataclass
class OddsApiResponse:
    ok: bool
    requests: int = 0
    message: str = ""
    data: list[dict[str, Any]] = field(default_factory=list)


class OddsApiClient:
    def __init__(self, api_key: str, timeout: float = 20.0) -> None:
        self.api_key = api_key
        self.timeout = timeout

    async def get_world_cup_odds(self, regions: str = "eu", markets: str = "h2h,spreads,totals") -> OddsApiResponse:
        if not self.api_key:
            return OddsApiResponse(ok=False, message="ODDS_API_KEY is not configured")
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.get(
                f"{ODDS_API_BASE_URL}/sports/{WORLD_CUP_SPORT_KEY}/odds",
                params={
                    "apiKey": self.api_key,
                    "regions": regions,
                    "markets": markets,
                    "oddsFormat": "decimal",
                },
            )
            response.raise_for_status()
            return OddsApiResponse(ok=True, requests=1, message="world cup odds fetched", data=response.json())
