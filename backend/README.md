# WorldCup Predict Backend

FastAPI service for the private World Cup 2026 points prediction app.

## Local Run

```powershell
cd backend
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements.txt
Copy-Item .env.example .env
.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

Seed accounts:

- Admin: `admin` / `admin123`
- Player: `demo` / `demo123`

## Data Providers

The app runs with seeded data by default. Add `API_FOOTBALL_KEY` and `ODDS_API_KEY` in `.env` to enable provider sync jobs.
