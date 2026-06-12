import asyncio
from contextlib import suppress

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import admin, auth, matches
from app.config import get_settings
from app.database import Base, SessionLocal, engine
from app.seed import seed_database
from app.services.sync_service import run_result_sync


settings = get_settings()
app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    if settings.result_sync_enabled:
        app.state.result_sync_task = asyncio.create_task(_result_sync_loop())


@app.on_event("shutdown")
async def on_shutdown() -> None:
    task = getattr(app.state, "result_sync_task", None)
    if task:
        task.cancel()
        with suppress(asyncio.CancelledError):
            await task


async def _result_sync_loop() -> None:
    while True:
        db = SessionLocal()
        try:
            await run_result_sync(db)
        except Exception:
            pass
        finally:
            db.close()
        await asyncio.sleep(settings.result_sync_interval_seconds)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(auth.router, prefix="/api")
app.include_router(matches.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
