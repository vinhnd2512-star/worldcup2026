from datetime import datetime, timezone
from decimal import Decimal

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.deps import CurrentUser, DbSession
from app.models import Bet, Match, MatchMarket, User, WalletLedger
from app.schemas import BetOut, LeaderboardRow, MatchOut, PlaceBetRequest


router = APIRouter(tags=["player"])


def as_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


@router.get("/matches", response_model=list[MatchOut])
def list_matches(db: DbSession) -> list[Match]:
    statement = (
        select(Match)
        .options(
            selectinload(Match.home_team),
            selectinload(Match.away_team),
            selectinload(Match.markets),
        )
        .order_by(Match.starts_at.asc())
    )
    return list(db.scalars(statement).all())


@router.get("/matches/{match_id}", response_model=MatchOut)
def get_match(match_id: int, db: DbSession) -> Match:
    match = db.scalar(
        select(Match)
        .where(Match.id == match_id)
        .options(selectinload(Match.home_team), selectinload(Match.away_team), selectinload(Match.markets))
    )
    if match is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found")
    return match


@router.post("/bets", response_model=BetOut)
def place_bet(payload: PlaceBetRequest, db: DbSession, user: CurrentUser) -> Bet:
    match = db.scalar(select(Match).where(Match.id == payload.match_id))
    if match is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found")
    if match.status not in {"SCHEDULED", "NS", "TBD"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This match is not open for pre-match bets")

    if payload.market_id is not None:
        market = db.scalar(
            select(MatchMarket).where(
                MatchMarket.id == payload.market_id,
                MatchMarket.match_id == payload.match_id,
                MatchMarket.market_key == payload.market_key,
                MatchMarket.selection_key == payload.selection_key,
            )
        )
    else:
        market = db.scalar(
            select(MatchMarket).where(
                MatchMarket.match_id == payload.match_id,
                MatchMarket.market_key == payload.market_key,
                MatchMarket.selection_key == payload.selection_key,
            )
        )
    if market is None and payload.market_key == "correct_score":
        market = db.scalar(
            select(MatchMarket).where(
                MatchMarket.match_id == payload.match_id,
                MatchMarket.market_key == payload.market_key,
            )
        )
    if market is None or not market.is_open:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Market is not available")
    if as_utc(market.closes_at) <= datetime.now(timezone.utc):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Betting is locked for this match")

    stake = Decimal(payload.stake)
    if user.wallet_balance < stake:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Insufficient point balance")

    selection_label = payload.selection_label or market.selection_label
    potential_payout = (stake * market.odds_multiplier).quantize(Decimal("0.01"))
    user.wallet_balance = (user.wallet_balance - stake).quantize(Decimal("0.01"))
    bet = Bet(
        user_id=user.id,
        match_id=match.id,
        market_key=payload.market_key,
        selection_key=payload.selection_key,
        selection_label=selection_label,
        stake=stake,
        locked_multiplier=market.odds_multiplier,
        potential_payout=potential_payout,
        status="placed",
        selection_json={**payload.selection, "line": str(market.line) if market.line is not None else payload.selection.get("line")},
    )
    db.add(bet)
    db.add(
        WalletLedger(
            user_id=user.id,
            actor_id=user.id,
            amount=Decimal("0.00") - stake,
            kind="bet_stake",
            reason=f"Placed {payload.market_key}: {selection_label}",
            balance_after=user.wallet_balance,
        )
    )
    db.commit()
    db.refresh(bet)
    return bet


@router.get("/me/history", response_model=list[BetOut])
def my_history(db: DbSession, user: CurrentUser) -> list[Bet]:
    return list(db.scalars(select(Bet).where(Bet.user_id == user.id).order_by(Bet.placed_at.desc())).all())


@router.get("/leaderboard", response_model=list[LeaderboardRow])
def leaderboard(db: DbSession) -> list[LeaderboardRow]:
    players = list(db.scalars(select(User).where(User.is_active.is_(True))).all())
    rows: list[dict] = []
    for player in players:
        if player.role.name == "admin":
            continue
        bets = list(db.scalars(select(Bet).where(Bet.user_id == player.id)).all())
        settled = [bet for bet in bets if bet.status in {"won", "lost", "refunded"}]
        won = [bet for bet in settled if bet.status == "won"]
        total_staked = sum((bet.stake for bet in settled if bet.status != "refunded"), Decimal("0.00"))
        score = sum((bet.points_delta for bet in settled), Decimal("0.00"))
        accuracy = (len(won) / len([bet for bet in settled if bet.status != "refunded"]) * 100) if settled else 0.0
        roi = (float(score / total_staked * Decimal("100")) if total_staked > 0 else 0.0)
        rows.append(
            {
                "user_id": player.id,
                "display_name": player.display_name,
                "username": player.username,
                "score": score,
                "settled_bets": len(settled),
                "won_bets": len(won),
                "accuracy": round(accuracy, 1),
                "roi": round(roi, 1),
            }
        )
    rows.sort(key=lambda item: item["score"], reverse=True)
    return [LeaderboardRow(rank=index + 1, **row) for index, row in enumerate(rows)]
