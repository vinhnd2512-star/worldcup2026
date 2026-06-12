from datetime import datetime, timezone
from decimal import Decimal

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import func, select

from app.api.deps import AdminUser, DbSession
from app.models import Bet, Match, Role, SyncRun, User, WalletLedger
from app.schemas import AdminReport, CreateUserRequest, ResetPasswordRequest, SyncRunOut, TopUpRequest, UpdateScoreRequest, UserOut, UserStatusRequest
from app.security import create_password_hash
from app.services.settlement_service import FINAL_OR_VOID_STATUSES, settle_pending_bets
from app.services.sync_service import run_metadata_sync, run_result_sync


router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/users", response_model=list[UserOut])
def list_users(db: DbSession, _: AdminUser) -> list[User]:
    return list(db.scalars(select(User).order_by(User.created_at.desc())).all())


@router.post("/users", response_model=UserOut)
def create_user(payload: CreateUserRequest, db: DbSession, admin: AdminUser) -> User:
    existing = db.scalar(select(User).where(User.username == payload.username))
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already exists")
    role = db.scalar(select(Role).where(Role.name == payload.role))
    if role is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid role")
    user = User(
        username=payload.username,
        display_name=payload.display_name,
        email=payload.email,
        password_hash=create_password_hash(payload.password),
        role_id=role.id,
        wallet_balance=payload.starting_points,
    )
    db.add(user)
    db.flush()
    if payload.starting_points:
        db.add(
            WalletLedger(
                user_id=user.id,
                actor_id=admin.id,
                amount=payload.starting_points,
                kind="admin_topup",
                reason="Initial points",
                balance_after=user.wallet_balance,
            )
        )
    db.commit()
    db.refresh(user)
    return user


@router.patch("/users/{user_id}/status", response_model=UserOut)
def update_user_status(user_id: int, payload: UserStatusRequest, db: DbSession, _: AdminUser) -> User:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user.is_active = payload.is_active
    db.commit()
    db.refresh(user)
    return user


@router.post("/users/{user_id}/reset-password", response_model=UserOut)
def reset_password(user_id: int, payload: ResetPasswordRequest, db: DbSession, _: AdminUser) -> User:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user.password_hash = create_password_hash(payload.password)
    db.commit()
    db.refresh(user)
    return user


@router.post("/users/{user_id}/top-up", response_model=UserOut)
def top_up_user(user_id: int, payload: TopUpRequest, db: DbSession, admin: AdminUser) -> User:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    next_balance = (user.wallet_balance + payload.amount).quantize(Decimal("0.01"))
    if next_balance < 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Wallet balance cannot be negative")
    user.wallet_balance = next_balance
    db.add(
        WalletLedger(
            user_id=user.id,
            actor_id=admin.id,
            amount=payload.amount,
            kind="admin_topup" if payload.amount >= 0 else "admin_deduction",
            reason=payload.reason,
            balance_after=user.wallet_balance,
        )
    )
    db.commit()
    db.refresh(user)
    return user


@router.get("/reports", response_model=AdminReport)
def reports(
    db: DbSession,
    _: AdminUser,
    date_from: datetime | None = Query(default=None),
    date_to: datetime | None = Query(default=None),
) -> AdminReport:
    bet_statement = select(Bet)
    if date_from:
        bet_statement = bet_statement.where(Bet.placed_at >= date_from)
    if date_to:
        bet_statement = bet_statement.where(Bet.placed_at <= date_to)
    bets = list(db.scalars(bet_statement).all())
    players = db.scalar(select(func.count(User.id)).join(Role).where(Role.name == "player")) or 0
    balance = db.scalar(select(func.coalesce(func.sum(User.wallet_balance), 0))) or Decimal("0.00")
    total_staked = sum((bet.stake for bet in bets), Decimal("0.00"))
    settled = [bet for bet in bets if bet.status in {"won", "lost", "refunded"}]
    net_points = sum((bet.points_delta for bet in settled), Decimal("0.00"))
    market_counts: dict[str, int] = {}
    for bet in bets:
        market_counts[bet.market_key] = market_counts.get(bet.market_key, 0) + 1
    top_markets = [{"market": key, "bets": value} for key, value in sorted(market_counts.items(), key=lambda item: item[1], reverse=True)]
    return AdminReport(
        players=players,
        total_wallet_balance=balance,
        total_staked=total_staked,
        settled_net_points=net_points,
        open_bets=len([bet for bet in bets if bet.status == "placed"]),
        settled_bets=len(settled),
        top_markets=top_markets[:6],
    )


@router.get("/sync-runs", response_model=list[SyncRunOut])
def sync_runs(db: DbSession, _: AdminUser) -> list[SyncRun]:
    return list(db.scalars(select(SyncRun).order_by(SyncRun.started_at.desc()).limit(30)).all())


@router.post("/settlements/retry")
def retry_settlements(db: DbSession, _: AdminUser) -> dict[str, int]:
    settled = settle_pending_bets(db)
    return {"settled": settled}


@router.patch("/matches/{match_id}/score")
def update_match_score(match_id: int, payload: UpdateScoreRequest, db: DbSession, _: AdminUser) -> dict:
    match = db.get(Match, match_id)
    if match is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found")
    if payload.home_score is not None:
        match.home_score = payload.home_score
    if payload.away_score is not None:
        match.away_score = payload.away_score
    if payload.status is not None:
        match.status = payload.status
    db.commit()
    db.refresh(match)
    settled = settle_pending_bets(db) if match.status in FINAL_OR_VOID_STATUSES else 0
    return {
        "match_id": match.id,
        "home_score": match.home_score,
        "away_score": match.away_score,
        "status": match.status,
        "settled": settled,
    }


@router.post("/sync/metadata")
def trigger_metadata_sync(db: DbSession, _: AdminUser) -> dict[str, str | int]:
    run = run_metadata_sync(db, now=datetime.now(timezone.utc))
    return {"status": run.status, "requests": run.request_count, "message": run.message}


@router.post("/sync/results")
async def trigger_result_sync(db: DbSession, _: AdminUser) -> dict[str, str | int]:
    run = await run_result_sync(db, now=datetime.now(timezone.utc))
    return {"status": run.status, "requests": run.request_count, "message": run.message}
