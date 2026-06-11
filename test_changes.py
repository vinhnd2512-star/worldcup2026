#!/usr/bin/env python3
"""Quick validation of settlement changes"""
import sys
sys.path.insert(0, 'backend')

from app.core.settlement import BetSelection, MatchResult, settle_bet
from decimal import Decimal

print("Testing new settlement logic...\n")

# Test 1: Tournament Winner Win
print("1. Tournament Winner Win:")
outcome = settle_bet(
    BetSelection("tournament_winner", "BRA", Decimal("100"), Decimal("8.00"), {}),
    MatchResult(status="FT", home_score=2, away_score=1, tournament_winner_team_code="BRA"),
)
assert outcome.status == "won", f"Expected won, got {outcome.status}"
assert outcome.payout == Decimal("800.00"), f"Expected 800.00, got {outcome.payout}"
assert outcome.prediction_bonus == Decimal("25.00"), f"Expected bonus 25.00, got {outcome.prediction_bonus}"
print(f"   ✓ Status: {outcome.status}, Payout: {outcome.payout}, Bonus: {outcome.prediction_bonus}\n")

# Test 2: Tournament Winner Loss
print("2. Tournament Winner Loss:")
outcome = settle_bet(
    BetSelection("tournament_winner", "BRA", Decimal("100"), Decimal("8.00"), {}),
    MatchResult(status="FT", home_score=2, away_score=1, tournament_winner_team_code="ARG"),
)
assert outcome.status == "lost", f"Expected lost, got {outcome.status}"
assert outcome.net_points == Decimal("-100.00"), f"Expected -100.00, got {outcome.net_points}"
print(f"   ✓ Status: {outcome.status}, Net Points: {outcome.net_points}\n")

# Test 3: Golden Boot Win
print("3. Golden Boot Win:")
outcome = settle_bet(
    BetSelection("golden_boot", "player:42", Decimal("50"), Decimal("12.00"), {}),
    MatchResult(status="FT", home_score=1, away_score=0, top_scorer_player_id=42),
)
assert outcome.status == "won", f"Expected won, got {outcome.status}"
assert outcome.payout == Decimal("600.00"), f"Expected 600.00, got {outcome.payout}"
assert outcome.prediction_bonus == Decimal("20.00"), f"Expected bonus 20.00, got {outcome.prediction_bonus}"
print(f"   ✓ Status: {outcome.status}, Payout: {outcome.payout}, Bonus: {outcome.prediction_bonus}\n")

# Test 4: Golden Boot Loss
print("4. Golden Boot Loss:")
outcome = settle_bet(
    BetSelection("golden_boot", "player:42", Decimal("50"), Decimal("12.00"), {}),
    MatchResult(status="FT", home_score=1, away_score=0, top_scorer_player_id=99),
)
assert outcome.status == "lost", f"Expected lost, got {outcome.status}"
assert outcome.net_points == Decimal("-50.00"), f"Expected -50.00, got {outcome.net_points}"
print(f"   ✓ Status: {outcome.status}, Net Points: {outcome.net_points}\n")

# Test 5: Existing market still works - Match Result
print("5. Match Result Still Works:")
outcome = settle_bet(
    BetSelection("match_result", "home", Decimal("100"), Decimal("2.00"), {}),
    MatchResult(status="FT", home_score=2, away_score=1),
)
assert outcome.status == "won", f"Expected won, got {outcome.status}"
assert outcome.prediction_bonus == Decimal("10.00"), f"Expected bonus 10.00, got {outcome.prediction_bonus}"
print(f"   ✓ Status: {outcome.status}, Bonus: {outcome.prediction_bonus}\n")

print("✅ All settlement tests passed!")
