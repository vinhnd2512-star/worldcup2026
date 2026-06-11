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
