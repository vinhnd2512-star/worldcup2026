from dataclasses import dataclass, field
from typing import Any

import httpx


API_FOOTBALL_BASE_URL = "https://v3.football.api-sports.io"
WORLD_CUP_LEAGUE_ID = 1
WORLD_CUP_SEASON = 2026


@dataclass
class ProviderResponse:
    ok: bool
    requests: int = 0
    message: str = ""
    data: list[dict[str, Any]] = field(default_factory=list)


class ApiFootballClient:
    def __init__(self, api_key: str, timeout: float = 20.0) -> None:
        self.api_key = api_key
        self.timeout = timeout

    async def get_fixtures(self) -> ProviderResponse:
        if not self.api_key:
            return ProviderResponse(ok=False, message="API_FOOTBALL_KEY is not configured")
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.get(
                f"{API_FOOTBALL_BASE_URL}/fixtures",
                params={"league": WORLD_CUP_LEAGUE_ID, "season": WORLD_CUP_SEASON},
                headers={"x-apisports-key": self.api_key},
            )
            response.raise_for_status()
            payload = response.json()
            return ProviderResponse(ok=True, requests=1, message="fixtures fetched", data=payload.get("response", []))

    async def get_odds_for_fixture(self, fixture_id: int) -> ProviderResponse:
        if not self.api_key:
            return ProviderResponse(ok=False, message="API_FOOTBALL_KEY is not configured")
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.get(
                f"{API_FOOTBALL_BASE_URL}/odds",
                params={"fixture": fixture_id},
                headers={"x-apisports-key": self.api_key},
            )
            response.raise_for_status()
            payload = response.json()
            return ProviderResponse(ok=True, requests=1, message="odds fetched", data=payload.get("response", []))
