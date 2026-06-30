from datetime import datetime
from decimal import Decimal
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class RoleOut(BaseModel):
    name: str

    model_config = ConfigDict(from_attributes=True)


class UserOut(BaseModel):
    id: int
    username: str
    display_name: str
    email: str | None
    role: RoleOut
    is_active: bool
    wallet_balance: Decimal

    model_config = ConfigDict(from_attributes=True)


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class TeamOut(BaseModel):
    id: int
    code: str
    name: str
    country: str
    logo_url: str | None = None

    model_config = ConfigDict(from_attributes=True)


class MatchMarketOut(BaseModel):
    id: int
    market_key: str
    label: str
    selection_key: str
    selection_label: str
    line: Decimal | None
    odds_multiplier: Decimal
    is_open: bool
    source: str
    closes_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MatchOut(BaseModel):
    id: int
    stage: str
    group_name: str | None
    starts_at: datetime
    status: str
    home_score: int | None
    away_score: int | None
    home_final_score: int | None = None
    away_final_score: int | None = None
    home_penalties: int | None = None
    away_penalties: int | None = None
    venue: str | None
    city: str | None
    current_minute: int | None
    home_team: TeamOut
    away_team: TeamOut
    markets: list[MatchMarketOut]

    model_config = ConfigDict(from_attributes=True)


class PlaceBetRequest(BaseModel):
    match_id: int
    market_id: int | None = None
    market_key: str
    selection_key: str
    selection_label: str | None = None
    selection: dict[str, Any] = Field(default_factory=dict)
    stake: Decimal = Field(gt=Decimal("0"))


class BetOut(BaseModel):
    id: int
    match_id: int | None
    market_key: str
    selection_key: str
    selection_label: str
    stake: Decimal
    locked_multiplier: Decimal
    potential_payout: Decimal
    status: str
    points_delta: Decimal
    selection_json: dict[str, Any]
    placed_at: datetime
    settled_at: datetime | None

    model_config = ConfigDict(from_attributes=True)


class AdminBetOut(BetOut):
    user: UserOut


class LeaderboardRow(BaseModel):
    rank: int
    user_id: int
    display_name: str
    username: str
    score: Decimal
    settled_bets: int
    won_bets: int
    accuracy: float
    roi: float


class CreateUserRequest(BaseModel):
    username: str
    display_name: str
    password: str
    email: str | None = None
    role: str = "player"
    starting_points: Decimal = Decimal("1000")


class TopUpRequest(BaseModel):
    amount: Decimal
    reason: str = "Admin adjustment"


class UserStatusRequest(BaseModel):
    is_active: bool


class ResetPasswordRequest(BaseModel):
    password: str


class AdminReport(BaseModel):
    players: int
    total_wallet_balance: Decimal
    total_staked: Decimal
    settled_net_points: Decimal
    open_bets: int
    settled_bets: int
    top_markets: list[dict[str, Any]]


class UpdateScoreRequest(BaseModel):
    home_score: int | None = None
    away_score: int | None = None
    home_final_score: int | None = None
    away_final_score: int | None = None
    home_penalties: int | None = None
    away_penalties: int | None = None
    status: str | None = None


class SyncRunOut(BaseModel):
    id: int
    provider: str
    job_type: str
    status: str
    started_at: datetime
    finished_at: datetime | None
    request_count: int
    message: str

    model_config = ConfigDict(from_attributes=True)
