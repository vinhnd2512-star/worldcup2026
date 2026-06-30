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
    home_final_score: int | None = None
    away_final_score: int | None = None
    home_penalties: int | None = None
    away_penalties: int | None = None
    corners_home: int = 0
    corners_away: int = 0
    yellow_cards_home: int = 0
    yellow_cards_away: int = 0
    red_cards_home: int = 0
    red_cards_away: int = 0
    top_scorer_player_id: int | None = None
    tournament_winner_team_code: str | None = None


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

    if bet.market_key == "match_winner":
        winner = _match_winner_selection_key(result)
        if winner is None:
            return SettlementOutcome(
                status="pending",
                result="pending",
                payout=Decimal("0.00"),
                net_points=Decimal("0.00"),
                prediction_bonus=Decimal("0.00"),
                reason="Knockout winner is not final until a team advances.",
            )
        won = bet.selection_key == winner
        if won:
            payout = money(bet.stake * bet.multiplier)
            return SettlementOutcome(
                status="won",
                result="win",
                payout=payout,
                net_points=money(payout - bet.stake),
                prediction_bonus=prediction_bonus(bet.market_key),
                reason="Selection matched the team that advanced; leaderboard bonus applied.",
            )
        return SettlementOutcome(
            status="lost",
            result="loss",
            payout=Decimal("0.00"),
            net_points=money(Decimal("0.00") - bet.stake),
            prediction_bonus=Decimal("0.00"),
            reason="Selection did not match the team that advanced.",
        )

    if bet.market_key == "qualification_method":
        winner = _match_winner_selection_key(result)
        if winner is None:
            return SettlementOutcome(
                status="pending",
                result="pending",
                payout=Decimal("0.00"),
                net_points=Decimal("0.00"),
                prediction_bonus=Decimal("0.00"),
                reason="Knockout qualification method is not final until a team advances.",
            )
        won = (
            (bet.selection_key == "home_extra_time" and result.status == "AET" and winner == "home")
            or (bet.selection_key == "away_extra_time" and result.status == "AET" and winner == "away")
            or (bet.selection_key == "home_penalties" and result.status in {"PEN", "FT_PEN"} and winner == "home")
            or (bet.selection_key == "away_penalties" and result.status in {"PEN", "FT_PEN"} and winner == "away")
        )
        if won:
            payout = money(bet.stake * bet.multiplier)
            return SettlementOutcome(
                status="won",
                result="win",
                payout=payout,
                net_points=money(payout - bet.stake),
                prediction_bonus=prediction_bonus(bet.market_key),
                reason="Selection matched the knockout qualification method; leaderboard bonus applied.",
            )
        return SettlementOutcome(
            status="lost",
            result="loss",
            payout=Decimal("0.00"),
            net_points=money(Decimal("0.00") - bet.stake),
            prediction_bonus=Decimal("0.00"),
            reason="Selection did not match the knockout qualification method.",
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

    if bet.market_key == "total_goals":
        line = Decimal(str(bet.selection.get("line", "2.5")))
        if Decimal(result.home_score + result.away_score) == line:
            return SettlementOutcome(
                status="refunded",
                result="push",
                payout=money(bet.stake),
                net_points=Decimal("0.00"),
                prediction_bonus=Decimal("0.00"),
                reason="Total goals market pushed; stake refunded.",
            )

    if bet.market_key == "penalty_score":
        if result.status in {"PEN", "FT_PEN"} and (result.home_penalties is None or result.away_penalties is None):
            return SettlementOutcome(
                status="pending",
                result="pending",
                payout=Decimal("0.00"),
                net_points=Decimal("0.00"),
                prediction_bonus=Decimal("0.00"),
                reason="Penalty shootout score is not final.",
            )
        won = (
            result.status in {"PEN", "FT_PEN"}
            and int(bet.selection.get("home_score", -1)) == result.home_penalties
            and int(bet.selection.get("away_score", -1)) == result.away_penalties
        )
    elif bet.market_key in {"handicap", "asian_handicap"}:
        handicap_result = _handicap_adjusted_result(bet, result)
        if handicap_result == 0:
            return SettlementOutcome(
                status="refunded",
                result="push",
                payout=money(bet.stake),
                net_points=Decimal("0.00"),
                prediction_bonus=Decimal("0.00"),
                reason="Handicap market pushed; stake refunded.",
            )
        won = handicap_result > 0
    else:
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
    """
    Prediction bonuses by market type.
    
    Bonus values reflect difficulty:
    - Easy markets (1X2, totals): 8-10 points
    - Medium markets (correct_score, BTTS): 25-50 points
    - Hard outrights (tournament_winner, golden_boot): 30-50 points
      * Calculated from xG simulation and team strength models
      * Fair odds: 1 / probability
      * Bonus range: 30-50 for high-difficulty long-term bets
    """
    bonuses = {
        "correct_score": Decimal("50.00"),
        "penalty_score": Decimal("35.00"),
        "match_result": Decimal("10.00"),
        "match_winner": Decimal("10.00"),
        "qualification_method": Decimal("15.00"),
        "draw_no_bet": Decimal("8.00"),
        "handicap": Decimal("8.00"),
        "asian_handicap": Decimal("8.00"),
        "total_goals": Decimal("8.00"),
        "btts": Decimal("8.00"),
        "corners_total": Decimal("6.00"),
        "cards_total": Decimal("6.00"),
        "tournament_winner": Decimal("40.00"),
        "golden_boot": Decimal("50.00"),
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

    if bet.market_key in {"handicap", "asian_handicap"}:
        line = Decimal(str(bet.selection.get("line", "0")))
        if bet.selection_key == "home":
            return Decimal(result.home_score) + line > Decimal(result.away_score)
        if bet.selection_key == "away":
            return Decimal(result.away_score) + line > Decimal(result.home_score)
        return False

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

    if bet.market_key == "golden_boot":
        return result.top_scorer_player_id is not None and bet.selection_key == f"player:{result.top_scorer_player_id}"

    if bet.market_key == "tournament_winner":
        return result.tournament_winner_team_code is not None and bet.selection_key == result.tournament_winner_team_code

    return False


def _handicap_adjusted_result(bet: BetSelection, result: MatchResult) -> int:
    line = Decimal(str(bet.selection.get("line", "0")))
    if bet.selection_key == "home":
        selected = Decimal(result.home_score or 0) + line
        opponent = Decimal(result.away_score or 0)
    elif bet.selection_key == "away":
        selected = Decimal(result.away_score or 0) + line
        opponent = Decimal(result.home_score or 0)
    else:
        return -1
    if selected > opponent:
        return 1
    if selected == opponent:
        return 0
    return -1


def _match_winner_selection_key(result: MatchResult) -> str | None:
    home_final = result.home_final_score if result.home_final_score is not None else result.home_score
    away_final = result.away_final_score if result.away_final_score is not None else result.away_score
    if home_final is None or away_final is None:
        return None
    if home_final > away_final:
        return "home"
    if away_final > home_final:
        return "away"
    if result.status not in {"PEN", "FT_PEN"}:
        return None
    if result.home_penalties is None or result.away_penalties is None:
        return None
    if result.home_penalties > result.away_penalties:
        return "home"
    if result.away_penalties > result.home_penalties:
        return "away"
    return None
