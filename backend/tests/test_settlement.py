import unittest
from decimal import Decimal

from app.core.settlement import BetSelection, MatchResult, settle_bet


class SettlementTests(unittest.TestCase):
    def test_correct_score_win(self) -> None:
        outcome = settle_bet(
            BetSelection("correct_score", "2-1", Decimal("100"), Decimal("2.45"), {"home_score": 2, "away_score": 1}),
            MatchResult(status="FT", home_score=2, away_score=1),
        )
        self.assertEqual(outcome.status, "won")
        self.assertEqual(outcome.payout, Decimal("245.00"))
        self.assertEqual(outcome.net_points, Decimal("145.00"))
        self.assertEqual(outcome.prediction_bonus, Decimal("50.00"))

    def test_match_result_loss(self) -> None:
        outcome = settle_bet(
            BetSelection("match_result", "away", Decimal("75"), Decimal("2.00"), {}),
            MatchResult(status="FT", home_score=1, away_score=1),
        )
        self.assertEqual(outcome.status, "lost")
        self.assertEqual(outcome.net_points, Decimal("-75.00"))
        self.assertEqual(outcome.prediction_bonus, Decimal("0.00"))

    def test_match_winner_normal_time(self) -> None:
        outcome = settle_bet(
            BetSelection("match_winner", "home", Decimal("100"), Decimal("1.80"), {}),
            MatchResult(status="FT", home_score=2, away_score=1),
        )
        self.assertEqual(outcome.status, "won")
        self.assertEqual(outcome.payout, Decimal("180.00"))
        self.assertEqual(outcome.prediction_bonus, Decimal("10.00"))

    def test_match_winner_after_extra_time(self) -> None:
        outcome = settle_bet(
            BetSelection("match_winner", "away", Decimal("100"), Decimal("2.20"), {}),
            MatchResult(status="AET", home_score=1, away_score=1, home_final_score=1, away_final_score=2),
        )
        self.assertEqual(outcome.status, "won")
        self.assertEqual(outcome.payout, Decimal("220.00"))

    def test_match_winner_penalties(self) -> None:
        outcome = settle_bet(
            BetSelection("match_winner", "away", Decimal("100"), Decimal("2.00"), {}),
            MatchResult(status="PEN", home_score=1, away_score=1, home_penalties=3, away_penalties=4),
        )
        self.assertEqual(outcome.status, "won")
        self.assertEqual(outcome.reason, "Selection matched the team that advanced; leaderboard bonus applied.")

    def test_match_winner_penalties_when_provider_status_is_ft(self) -> None:
        outcome = settle_bet(
            BetSelection("match_winner", "away", Decimal("100"), Decimal("2.00"), {}),
            MatchResult(status="FT", home_score=1, away_score=1, home_penalties=3, away_penalties=4),
        )
        self.assertEqual(outcome.status, "won")

    def test_match_winner_tied_without_penalties_is_pending(self) -> None:
        outcome = settle_bet(
            BetSelection("match_winner", "home", Decimal("100"), Decimal("1.90"), {}),
            MatchResult(status="PEN", home_score=1, away_score=1),
        )
        self.assertEqual(outcome.status, "pending")

    def test_match_winner_void_refunds(self) -> None:
        outcome = settle_bet(
            BetSelection("match_winner", "home", Decimal("100"), Decimal("1.90"), {}),
            MatchResult(status="CANC"),
        )
        self.assertEqual(outcome.status, "refunded")
        self.assertEqual(outcome.payout, Decimal("100.00"))

    def test_qualification_method_extra_time(self) -> None:
        outcome = settle_bet(
            BetSelection("qualification_method", "home_extra_time", Decimal("100"), Decimal("4.50"), {}),
            MatchResult(status="AET", home_score=1, away_score=1, home_final_score=2, away_final_score=1),
        )
        self.assertEqual(outcome.status, "won")
        self.assertEqual(outcome.payout, Decimal("450.00"))
        self.assertEqual(outcome.prediction_bonus, Decimal("15.00"))

    def test_qualification_method_penalties(self) -> None:
        outcome = settle_bet(
            BetSelection("qualification_method", "away_penalties", Decimal("100"), Decimal("5.00"), {}),
            MatchResult(status="PEN", home_score=1, away_score=1, home_penalties=3, away_penalties=4),
        )
        self.assertEqual(outcome.status, "won")
        self.assertEqual(outcome.reason, "Selection matched the knockout qualification method; leaderboard bonus applied.")

    def test_qualification_method_penalties_when_provider_status_is_ft(self) -> None:
        outcome = settle_bet(
            BetSelection("qualification_method", "away_penalties", Decimal("100"), Decimal("5.00"), {}),
            MatchResult(status="FT", home_score=1, away_score=1, home_penalties=3, away_penalties=4),
        )
        self.assertEqual(outcome.status, "won")

    def test_qualification_method_wrong_method_loses(self) -> None:
        outcome = settle_bet(
            BetSelection("qualification_method", "home_penalties", Decimal("100"), Decimal("5.50"), {}),
            MatchResult(status="AET", home_score=1, away_score=1, home_final_score=2, away_final_score=1),
        )
        self.assertEqual(outcome.status, "lost")
        self.assertEqual(outcome.net_points, Decimal("-100.00"))

    def test_penalty_score_win(self) -> None:
        outcome = settle_bet(
            BetSelection("penalty_score", "3-4", Decimal("100"), Decimal("12.00"), {"home_score": 3, "away_score": 4}),
            MatchResult(status="PEN", home_score=1, away_score=1, home_penalties=3, away_penalties=4),
        )
        self.assertEqual(outcome.status, "won")

    def test_penalty_score_win_when_provider_status_is_ft(self) -> None:
        outcome = settle_bet(
            BetSelection("penalty_score", "3-4", Decimal("100"), Decimal("12.00"), {"home_score": 3, "away_score": 4}),
            MatchResult(status="FT", home_score=1, away_score=1, home_penalties=3, away_penalties=4),
        )
        self.assertEqual(outcome.status, "won")

    def test_penalty_score_loses_when_no_shootout(self) -> None:
        outcome = settle_bet(
            BetSelection("penalty_score", "3-4", Decimal("100"), Decimal("12.00"), {"home_score": 3, "away_score": 4}),
            MatchResult(status="FT", home_score=1, away_score=0),
        )
        self.assertEqual(outcome.status, "lost")

    def test_penalty_score_pending_when_shootout_score_missing(self) -> None:
        outcome = settle_bet(
            BetSelection("penalty_score", "3-4", Decimal("100"), Decimal("12.00"), {"home_score": 3, "away_score": 4}),
            MatchResult(status="PEN", home_score=1, away_score=1),
        )
        self.assertEqual(outcome.status, "pending")

    def test_qualification_method_tied_without_penalties_is_pending(self) -> None:
        outcome = settle_bet(
            BetSelection("qualification_method", "home_penalties", Decimal("100"), Decimal("5.50"), {}),
            MatchResult(status="PEN", home_score=1, away_score=1),
        )
        self.assertEqual(outcome.status, "pending")

    def test_draw_no_bet_win_and_draw_refund(self) -> None:
        win = settle_bet(
            BetSelection("draw_no_bet", "home", Decimal("100"), Decimal("1.65"), {}),
            MatchResult(status="FT", home_score=2, away_score=1),
        )
        refund = settle_bet(
            BetSelection("draw_no_bet", "home", Decimal("100"), Decimal("1.65"), {}),
            MatchResult(status="FT", home_score=1, away_score=1),
        )
        self.assertEqual(win.status, "won")
        self.assertEqual(win.payout, Decimal("165.00"))
        self.assertEqual(win.prediction_bonus, Decimal("8.00"))
        self.assertEqual(refund.status, "refunded")
        self.assertEqual(refund.payout, Decimal("100.00"))
        self.assertEqual(refund.net_points, Decimal("0.00"))

    def test_handicap_win_loss_and_push(self) -> None:
        home_minus_half = settle_bet(
            BetSelection("handicap", "home", Decimal("100"), Decimal("1.91"), {"line": "-0.5"}),
            MatchResult(status="FT", home_score=2, away_score=1),
        )
        away_plus_half = settle_bet(
            BetSelection("handicap", "away", Decimal("100"), Decimal("1.91"), {"line": "-0.5"}),
            MatchResult(status="FT", home_score=2, away_score=1),
        )
        away_plus_half_draw = settle_bet(
            BetSelection("handicap", "away", Decimal("100"), Decimal("1.91"), {"line": "-0.5"}),
            MatchResult(status="FT", home_score=1, away_score=1),
        )
        push = settle_bet(
            BetSelection("handicap", "home", Decimal("100"), Decimal("1.91"), {"line": "-1"}),
            MatchResult(status="FT", home_score=2, away_score=1),
        )
        self.assertEqual(home_minus_half.status, "won")
        self.assertEqual(home_minus_half.payout, Decimal("191.00"))
        self.assertEqual(home_minus_half.prediction_bonus, Decimal("8.00"))
        self.assertEqual(away_plus_half.status, "lost")
        self.assertEqual(away_plus_half_draw.status, "won")
        self.assertEqual(push.status, "refunded")
        self.assertEqual(push.result, "push")
        self.assertEqual(push.payout, Decimal("100.00"))

    def test_quarter_handicap_splits_half_results(self) -> None:
        home_minus_quarter_draw = settle_bet(
            BetSelection("asian_handicap", "home", Decimal("100"), Decimal("1.91"), {"line": "-0.25"}),
            MatchResult(status="FT", home_score=1, away_score=1),
        )
        home_minus_half_draw = settle_bet(
            BetSelection("asian_handicap", "home", Decimal("100"), Decimal("1.91"), {"line": "-0.5"}),
            MatchResult(status="FT", home_score=1, away_score=1),
        )
        away_plus_half_draw = settle_bet(
            BetSelection("asian_handicap", "away", Decimal("100"), Decimal("1.91"), {"line": "-0.5"}),
            MatchResult(status="FT", home_score=1, away_score=1),
        )
        home_minus_three_quarter_win_by_one = settle_bet(
            BetSelection("asian_handicap", "home", Decimal("100"), Decimal("1.91"), {"line": "-0.75"}),
            MatchResult(status="FT", home_score=2, away_score=1),
        )
        home_minus_one_win_by_one = settle_bet(
            BetSelection("asian_handicap", "home", Decimal("100"), Decimal("1.91"), {"line": "-1"}),
            MatchResult(status="FT", home_score=2, away_score=1),
        )

        self.assertEqual(home_minus_quarter_draw.status, "lost")
        self.assertEqual(home_minus_quarter_draw.result, "half_loss")
        self.assertEqual(home_minus_quarter_draw.payout, Decimal("50.00"))
        self.assertEqual(home_minus_quarter_draw.net_points, Decimal("-50.00"))
        self.assertEqual(home_minus_half_draw.status, "lost")
        self.assertEqual(home_minus_half_draw.payout, Decimal("0.00"))
        self.assertEqual(away_plus_half_draw.status, "won")
        self.assertEqual(home_minus_three_quarter_win_by_one.status, "won")
        self.assertEqual(home_minus_three_quarter_win_by_one.result, "half_win")
        self.assertEqual(home_minus_three_quarter_win_by_one.payout, Decimal("145.50"))
        self.assertEqual(home_minus_three_quarter_win_by_one.net_points, Decimal("45.50"))
        self.assertEqual(home_minus_one_win_by_one.status, "refunded")
        self.assertEqual(home_minus_one_win_by_one.result, "push")
        self.assertEqual(home_minus_one_win_by_one.payout, Decimal("100.00"))

    def test_handicap_uses_90_minute_score_not_extra_time(self) -> None:
        outcome = settle_bet(
            BetSelection("asian_handicap", "home", Decimal("100"), Decimal("1.91"), {"line": "-0.5"}),
            MatchResult(status="AET", home_score=1, away_score=1, home_final_score=2, away_final_score=1),
        )
        self.assertEqual(outcome.status, "lost")

    def test_over_under_goals(self) -> None:
        over = settle_bet(
            BetSelection("total_goals", "over", Decimal("50"), Decimal("1.90"), {"line": "2.5"}),
            MatchResult(status="FT", home_score=3, away_score=0),
        )
        under = settle_bet(
            BetSelection("total_goals", "under", Decimal("50"), Decimal("1.90"), {"line": "2.5"}),
            MatchResult(status="FT", home_score=1, away_score=0),
        )
        self.assertEqual(over.status, "won")
        self.assertEqual(under.status, "won")
        self.assertEqual(over.prediction_bonus, Decimal("8.00"))

    def test_total_goals_uses_90_minutes_not_extra_time(self) -> None:
        outcome = settle_bet(
            BetSelection("total_goals", "under", Decimal("50"), Decimal("1.90"), {"line": "2.5"}),
            MatchResult(status="AET", home_score=1, away_score=1, home_final_score=2, away_final_score=1),
        )
        self.assertEqual(outcome.status, "won")
        self.assertEqual(outcome.payout, Decimal("95.00"))

    def test_match_result_draw_after_90_wins_even_if_team_advances(self) -> None:
        outcome = settle_bet(
            BetSelection("match_result", "draw", Decimal("50"), Decimal("3.10"), {}),
            MatchResult(status="AET", home_score=1, away_score=1, home_final_score=2, away_final_score=1),
        )
        self.assertEqual(outcome.status, "won")
        self.assertEqual(outcome.payout, Decimal("155.00"))
        self.assertEqual(outcome.prediction_bonus, Decimal("10.00"))

    def test_total_goals_push_refunds_when_equal_line(self) -> None:
        outcome = settle_bet(
            BetSelection("total_goals", "under", Decimal("50"), Decimal("1.90"), {"line": "3"}),
            MatchResult(status="FT", home_score=3, away_score=0),
        )
        self.assertEqual(outcome.status, "refunded")
        self.assertEqual(outcome.result, "push")
        self.assertEqual(outcome.payout, Decimal("50.00"))
        self.assertEqual(outcome.net_points, Decimal("0.00"))

    def test_btts(self) -> None:
        outcome = settle_bet(
            BetSelection("btts", "yes", Decimal("40"), Decimal("1.95"), {}),
            MatchResult(status="FT", home_score=1, away_score=2),
        )
        self.assertEqual(outcome.status, "won")

    def test_corners_and_cards(self) -> None:
        corners = settle_bet(
            BetSelection("corners_total", "over", Decimal("30"), Decimal("1.90"), {"line": "8.5"}),
            MatchResult(status="FT", home_score=0, away_score=0, corners_home=6, corners_away=4),
        )
        cards = settle_bet(
            BetSelection("cards_total", "under", Decimal("30"), Decimal("1.90"), {"line": "3.5"}),
            MatchResult(status="FT", home_score=0, away_score=0, yellow_cards_home=1, yellow_cards_away=1),
        )
        self.assertEqual(corners.status, "won")
        self.assertEqual(cards.status, "won")

    def test_void_refunds_stake(self) -> None:
        outcome = settle_bet(
            BetSelection("match_result", "home", Decimal("100"), Decimal("2.00"), {}),
            MatchResult(status="PST"),
        )
        self.assertEqual(outcome.status, "refunded")
        self.assertEqual(outcome.payout, Decimal("100.00"))
        self.assertEqual(outcome.net_points, Decimal("0.00"))
        self.assertEqual(outcome.prediction_bonus, Decimal("0.00"))

    def test_pending_before_final(self) -> None:
        outcome = settle_bet(
            BetSelection("match_result", "home", Decimal("100"), Decimal("2.00"), {}),
            MatchResult(status="2H", home_score=2, away_score=1),
        )
        self.assertEqual(outcome.status, "pending")

    def test_tournament_winner_win(self) -> None:
        outcome = settle_bet(
            BetSelection("tournament_winner", "BRA", Decimal("100"), Decimal("50.00"), {}),
            MatchResult(status="FT", home_score=2, away_score=1, tournament_winner_team_code="BRA"),
        )
        self.assertEqual(outcome.status, "won")
        self.assertEqual(outcome.payout, Decimal("5000.00"))
        self.assertEqual(outcome.net_points, Decimal("4900.00"))
        self.assertEqual(outcome.prediction_bonus, Decimal("40.00"))

    def test_tournament_winner_loss(self) -> None:
        outcome = settle_bet(
            BetSelection("tournament_winner", "BRA", Decimal("100"), Decimal("50.00"), {}),
            MatchResult(status="FT", home_score=2, away_score=1, tournament_winner_team_code="ARG"),
        )
        self.assertEqual(outcome.status, "lost")
        self.assertEqual(outcome.net_points, Decimal("-100.00"))
        self.assertEqual(outcome.prediction_bonus, Decimal("0.00"))

    def test_golden_boot_win(self) -> None:
        outcome = settle_bet(
            BetSelection("golden_boot", "player:42", Decimal("50"), Decimal("120.00"), {}),
            MatchResult(status="FT", home_score=1, away_score=0, top_scorer_player_id=42),
        )
        self.assertEqual(outcome.status, "won")
        self.assertEqual(outcome.payout, Decimal("6000.00"))
        self.assertEqual(outcome.net_points, Decimal("5950.00"))
        self.assertEqual(outcome.prediction_bonus, Decimal("50.00"))

    def test_golden_boot_loss(self) -> None:
        outcome = settle_bet(
            BetSelection("golden_boot", "player:42", Decimal("50"), Decimal("120.00"), {}),
            MatchResult(status="FT", home_score=1, away_score=0, top_scorer_player_id=99),
        )
        self.assertEqual(outcome.status, "lost")
        self.assertEqual(outcome.net_points, Decimal("-50.00"))
        self.assertEqual(outcome.prediction_bonus, Decimal("0.00"))


if __name__ == "__main__":
    unittest.main()
