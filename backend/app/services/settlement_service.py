from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.settlement import BetSelection, MatchResult, settle_bet
from app.models import Bet, Match, Settlement, WalletLedger


FINAL_OR_VOID_STATUSES = {"FT", "AET", "PEN", "FT_PEN", "PST", "CANC", "ABD", "SUSP", "VOID"}


def settle_pending_bets(db: Session) -> int:
    bets = list(
        db.scalars(
            select(Bet)
            .where(Bet.status == "placed", Bet.match_id.is_not(None))
            .options(selectinload(Bet.user), selectinload(Bet.match).selectinload(Match.stats))
        ).all()
    )
    count = 0
    for bet in bets:
        if bet.match is None or bet.match.status not in FINAL_OR_VOID_STATUSES:
            continue
        stats = bet.match.stats
        outcome = settle_bet(
            BetSelection(
                market_key=bet.market_key,
                selection_key=bet.selection_key,
                stake=Decimal(bet.stake),
                multiplier=Decimal(bet.locked_multiplier),
                selection=bet.selection_json,
            ),
            MatchResult(
                status=bet.match.status,
                home_score=bet.match.home_score,
                away_score=bet.match.away_score,
                corners_home=stats.corners_home if stats else 0,
                corners_away=stats.corners_away if stats else 0,
                yellow_cards_home=stats.yellow_cards_home if stats else 0,
                yellow_cards_away=stats.yellow_cards_away if stats else 0,
                red_cards_home=stats.red_cards_home if stats else 0,
                red_cards_away=stats.red_cards_away if stats else 0,
            ),
        )
        if outcome.status == "pending":
            continue
        bet.status = outcome.status
        bet.points_delta = outcome.net_points
        bet.settled_at = datetime.now(timezone.utc)
        if outcome.payout:
            bet.user.wallet_balance = (bet.user.wallet_balance + outcome.payout).quantize(Decimal("0.01"))
            db.add(
                WalletLedger(
                    user_id=bet.user_id,
                    actor_id=None,
                    amount=outcome.payout,
                    kind="settlement_payout" if outcome.status == "won" else "stake_refund",
                    reason=outcome.reason,
                    balance_after=bet.user.wallet_balance,
                )
            )
        db.add(
            Settlement(
                bet_id=bet.id,
                result=outcome.result,
                status=outcome.status,
                payout=outcome.payout,
                reason=outcome.reason,
            )
        )
        count += 1
    db.commit()
    return count
