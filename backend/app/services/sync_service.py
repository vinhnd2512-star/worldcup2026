from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models import Match, MatchStats, SyncRun
from app.providers.api_football import ApiFootballClient
from app.services.settlement_service import FINAL_OR_VOID_STATUSES, settle_pending_bets


def run_metadata_sync(db: Session, now: datetime | None = None) -> SyncRun:
    settings = get_settings()
    run = SyncRun(
        provider="api-football",
        job_type="metadata",
        status="skipped" if not settings.api_football_key else "queued",
        started_at=now or datetime.now(timezone.utc),
        finished_at=now or datetime.now(timezone.utc),
        request_count=0,
        message=(
            "API_FOOTBALL_KEY is not configured; using seeded World Cup 2026 fixtures."
            if not settings.api_football_key
            else "Provider sync scaffold is ready; schedule worker integration can call ApiFootballClient."
        ),
    )
    db.add(run)
    db.commit()
    db.refresh(run)
    return run


async def run_result_sync(db: Session, now: datetime | None = None) -> SyncRun:
    settings = get_settings()
    started_at = now or datetime.now(timezone.utc)
    run = SyncRun(
        provider="api-football",
        job_type="results",
        status="running",
        started_at=started_at,
        request_count=0,
        message="",
    )
    db.add(run)
    db.commit()
    db.refresh(run)

    if not settings.api_football_key:
        run.status = "skipped"
        run.finished_at = datetime.now(timezone.utc)
        run.message = "API_FOOTBALL_KEY is not configured; final score sync skipped."
        db.commit()
        db.refresh(run)
        return run

    cutoff = started_at - timedelta(minutes=settings.result_sync_after_minutes)
    matches = list(
        db.scalars(
            select(Match)
            .where(
                Match.provider_id.is_not(None),
                Match.status.not_in(FINAL_OR_VOID_STATUSES),
                Match.starts_at <= cutoff,
            )
            .order_by(Match.starts_at.asc())
        ).all()
    )
    client = ApiFootballClient(settings.api_football_key)
    updated = 0
    skipped = 0
    errors: list[str] = []

    for match in matches:
        fixture_id = _fixture_id(match.provider_id)
        if fixture_id is None:
            skipped += 1
            continue
        try:
            fixture_response = await client.get_fixture(fixture_id)
            run.request_count += fixture_response.requests
            if not fixture_response.data:
                skipped += 1
                continue
            if _apply_fixture(match, fixture_response.data[0]):
                updated += 1
            stats_response = await client.get_fixture_statistics(fixture_id)
            run.request_count += stats_response.requests
            _apply_statistics(db, match, stats_response.data)
        except Exception as exc:  # pragma: no cover - provider/network dependent
            errors.append(f"{match.provider_id}: {exc}")

    db.commit()
    settled = settle_pending_bets(db)
    run.finished_at = datetime.now(timezone.utc)
    run.status = "error" if errors else "completed"
    run.message = (
        f"Updated {updated} matches, settled {settled} bets, skipped {skipped}."
        if not errors
        else f"Updated {updated} matches, settled {settled} bets, skipped {skipped}; errors: {'; '.join(errors[:3])}"
    )
    db.commit()
    db.refresh(run)
    return run


def _fixture_id(provider_id: str | None) -> int | None:
    if not provider_id or not provider_id.isdigit():
        return None
    return int(provider_id)


def _apply_fixture(match: Match, payload: dict[str, Any]) -> bool:
    fixture = payload.get("fixture") or {}
    status = fixture.get("status") or {}
    goals = payload.get("goals") or {}
    score = payload.get("score") or {}
    fulltime = score.get("fulltime") or {}
    penalty = score.get("penalty") or {}

    provider_status = status.get("short") or match.status
    home_score = goals.get("home")
    away_score = goals.get("away")
    if home_score is None:
        home_score = fulltime.get("home")
    if away_score is None:
        away_score = fulltime.get("away")

    changed = False
    if match.status != provider_status:
        match.status = provider_status
        changed = True
    if match.current_minute != status.get("elapsed"):
        match.current_minute = status.get("elapsed")
        changed = True
    if home_score is not None and match.home_score != home_score:
        match.home_score = int(home_score)
        changed = True
    if away_score is not None and match.away_score != away_score:
        match.away_score = int(away_score)
        changed = True
    if penalty.get("home") is not None and match.home_penalties != penalty.get("home"):
        match.home_penalties = int(penalty["home"])
        changed = True
    if penalty.get("away") is not None and match.away_penalties != penalty.get("away"):
        match.away_penalties = int(penalty["away"])
        changed = True
    return changed


def _apply_statistics(db: Session, match: Match, payload: list[dict[str, Any]]) -> None:
    if not payload:
        return
    stats = db.scalar(select(MatchStats).where(MatchStats.match_id == match.id))
    if stats is None:
        stats = MatchStats(match_id=match.id)
        db.add(stats)

    by_side = {"home": _empty_stats(), "away": _empty_stats()}
    home_provider_id = str(match.home_team.provider_id) if match.home_team and match.home_team.provider_id else None
    away_provider_id = str(match.away_team.provider_id) if match.away_team and match.away_team.provider_id else None
    for index, team_payload in enumerate(payload):
        team_id = str((team_payload.get("team") or {}).get("id"))
        side = "home" if index == 0 else "away"
        if home_provider_id and team_id == home_provider_id:
            side = "home"
        elif away_provider_id and team_id == away_provider_id:
            side = "away"
        by_side[side] = _extract_stats(team_payload.get("statistics") or [])

    stats.corners_home = by_side["home"]["corners"]
    stats.corners_away = by_side["away"]["corners"]
    stats.yellow_cards_home = by_side["home"]["yellow_cards"]
    stats.yellow_cards_away = by_side["away"]["yellow_cards"]
    stats.red_cards_home = by_side["home"]["red_cards"]
    stats.red_cards_away = by_side["away"]["red_cards"]
    stats.payload_json = {"api_football": payload}


def _empty_stats() -> dict[str, int]:
    return {"corners": 0, "yellow_cards": 0, "red_cards": 0}


def _extract_stats(items: list[dict[str, Any]]) -> dict[str, int]:
    extracted = _empty_stats()
    for item in items:
        stat_type = str(item.get("type") or "").lower()
        value = int(item.get("value") or 0)
        if stat_type == "corner kicks":
            extracted["corners"] = value
        elif stat_type == "yellow cards":
            extracted["yellow_cards"] = value
        elif stat_type == "red cards":
            extracted["red_cards"] = value
    return extracted
