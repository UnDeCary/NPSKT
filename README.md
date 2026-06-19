# Dashboard NPS KT

Fullstack MVP for the Kazakhtelecom NPS dashboard described in `TZ_NPS_dashboard_KT.docx`.

## Stack

- Backend: FastAPI, SQLAlchemy, PostgreSQL, JWT auth, `openpyxl` XLSX parsing.
- Frontend: React, TypeScript, Vite, TanStack Query, Recharts, lucide icons.
- Local infrastructure: Docker Compose with PostgreSQL, backend, and frontend services.

## Local Run

```bash
docker compose up
```

Then open:

- Frontend: `http://localhost:5173`
- Backend health: `http://localhost:8000/api/health`
- Default admin: `admin / admin123`

## Manual Backend Run

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python -m app.cli
uvicorn app.main:app --reload
```

## Manual Frontend Run

```bash
cd frontend
npm install
npm run dev
```

## Verification

```bash
cd backend
pytest

cd ../frontend
npm test
npm run build
```

## Implemented MVP Scope

- Login with confidentiality acceptance gate and forgot-password helper flow.
- Role-aware dashboard shell with dark sidebar and admin-only navigation.
- Dashboard pages: main, B2C overview, B2B overview, B2C Internet, B2C TV, B2C FMS, field control.
- Admin upload flow for NPS and call-control XLSX files with validation, duplicates, commit, upload history.
- Aggregates for NPS, base size, promoter/neutral/detractor shares, plan/fact, completion, small-base flags.
- Admin views for users, dictionaries, plans, and minimum bases.
- PDF export endpoints are present under the approved public interface.

## Deferred

Regions map, B2B product detail pages, rollback UI, backup automation UI, final Excel export format, and advanced chart hover linking.
