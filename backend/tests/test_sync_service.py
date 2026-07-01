from app.services.sync_service import _final_score, _regular_time_score


def test_regular_time_score_does_not_fallback_to_goals_after_extra_time() -> None:
    home_score, away_score = _regular_time_score(
        "AET",
        fulltime={"home": None, "away": None},
        goals={"home": 2, "away": 1},
    )

    assert home_score is None
    assert away_score is None


def test_final_score_can_use_goals_after_extra_time() -> None:
    home_final, away_final = _final_score(
        "AET",
        extratime={"home": None, "away": None},
        goals={"home": 2, "away": 1},
        home_score=None,
        away_score=None,
    )

    assert home_final == 2
    assert away_final == 1
