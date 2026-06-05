from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.config import get_settings
from app.models import SyncRun


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
