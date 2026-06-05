from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP


WIN_STATUSES = {"FT", "AET", "PEN", "FT_PEN"}
VOID_STATUSES = {"PST", "CANC", "ABD", "SUSP", "VOID"}


@dataclass(frozen=True)
class MatchResult:
    status: str
    home_score: int | None = None
    away_score: int | None = None
    corners_home: int = 0
    corners_away: int = 0
    yellow_cards_home: int = 0
    yellow_cards_away: int = 0
    red_cards_home: int = 0
    red_cards_away: int = 0


@dataclass(frozen=True)
class BetSelection:
    market_key: str
    selection_key: str
    stake: Decimal
    multiplier: Decimal
    selection: dict


@dataclass(frozen=True)
class SettlementOutcome:
    status: str
    result: str
    payout: Decimal
    net_points: Decimal
    prediction_bonus: Decimal
    reason: str


def money(value: Decimal) -> Decimal:
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def settle_bet(bet: BetSelection, result: MatchResult) -> SettlementOutcome:
    if result.status in VOID_STATUSES:
        return SettlementOutcome(
            status="refunded",
            result="void",
            payout=money(bet.stake),
            net_points=Decimal("0.00"),
            prediction_bonus=Decimal("0.00"),
            reason="Match void/postponed/cancelled; stake refunded.",
        )

    if result.status not in WIN_STATUSES or result.home_score is None or result.away_score is None:
        return SettlementOutcome(
            status="pending",
            result="pending",
            payout=Decimal("0.00"),
            net_points=Decimal("0.00"),
            prediction_bonus=Decimal("0.00"),
            reason="Match result is not final.",
        )

    if bet.market_key == "draw_no_bet" and result.home_score == result.away_score:
        return SettlementOutcome(
            status="refunded",
            result="draw",
            payout=money(bet.stake),
            net_points=Decimal("0.00"),
            prediction_bonus=Decimal("0.00"),
            reason="Draw no bet market refunded because the match was drawn.",
        )

    won = _is_winning_selection(bet, result)
    if won:
        payout = money(bet.stake * bet.multiplier)
        return SettlementOutcome(
            status="won",
            result="win",
            payout=payout,
            net_points=money(payout - bet.stake),
            prediction_bonus=prediction_bonus(bet.market_key),
            reason="Selection matched the final 90-minute result; leaderboard bonus applied.",
        )

    return SettlementOutcome(
        status="lost",
        result="loss",
        payout=Decimal("0.00"),
        net_points=money(Decimal("0.00") - bet.stake),
        prediction_bonus=Decimal("0.00"),
        reason="Selection did not match the final 90-minute result.",
    )


def prediction_bonus(market_key: str) -> Decimal:
    bonuses = {
        "correct_score": Decimal("50.00"),
        "match_result": Decimal("10.00"),
        "draw_no_bet": Decimal("8.00"),
        "total_goals": Decimal("8.00"),
        "btts": Decimal("8.00"),
        "corners_total": Decimal("6.00"),
        "cards_total": Decimal("6.00"),
        "tournament_winner": Decimal("25.00"),
    }
    return bonuses.get(market_key, Decimal("0.00"))


def _is_winning_selection(bet: BetSelection, result: MatchResult) -> bool:
    total_goals = result.home_score + result.away_score
    total_corners = result.corners_home + result.corners_away
    total_cards = result.yellow_cards_home + result.yellow_cards_away + result.red_cards_home + result.red_cards_away

    if bet.market_key == "correct_score":
        return (
            int(bet.selection.get("home_score", -1)) == result.home_score
            and int(bet.selection.get("away_score", -1)) == result.away_score
        )

    if bet.market_key == "match_result":
        actual = "draw"
        if result.home_score > result.away_score:
            actual = "home"
        elif result.away_score > result.home_score:
            actual = "away"
        return bet.selection_key == actual

    if bet.market_key == "draw_no_bet":
        return (bet.selection_key == "home" and result.home_score > result.away_score) or (
            bet.selection_key == "away" and result.away_score > result.home_score
        )

    if bet.market_key == "total_goals":
        line = Decimal(str(bet.selection.get("line", "2.5")))
        return (bet.selection_key == "over" and Decimal(total_goals) > line) or (
            bet.selection_key == "under" and Decimal(total_goals) < line
        )

    if bet.market_key == "btts":
        actual_yes = result.home_score > 0 and result.away_score > 0
        return (bet.selection_key == "yes" and actual_yes) or (bet.selection_key == "no" and not actual_yes)

    if bet.market_key == "corners_total":
        line = Decimal(str(bet.selection.get("line", "8.5")))
        return (bet.selection_key == "over" and Decimal(total_corners) > line) or (
            bet.selection_key == "under" and Decimal(total_corners) < line
        )

    if bet.market_key == "cards_total":
        line = Decimal(str(bet.selection.get("line", "3.5")))
        return (bet.selection_key == "over" and Decimal(total_cards) > line) or (
            bet.selection_key == "under" and Decimal(total_cards) < line
        )

    return False
