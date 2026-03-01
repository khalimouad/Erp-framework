# NextERP Framework

A modular, open-source ERP framework built with **FastAPI + SQLAlchemy + React**.
Inspired by Odoo's module system — each business domain is a self-contained addon.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend API | FastAPI (Python 3.12) |
| ORM | SQLAlchemy 2.0 (async) + Alembic |
| Database | PostgreSQL 16 |
| Auth | JWT (python-jose) + bcrypt |
| Frontend | React 18 + TypeScript + Vite |
| State | Zustand + TanStack Query |
| Styling | Tailwind CSS |
| Containerization | Docker + Docker Compose |

---

## Modules

| Module | Description |
|---|---|
| `users` | User management, roles, JWT authentication |
| `companies` | Multi-company support |
| `crm` | Leads, opportunities, activities pipeline |
| `inventory` | Products, warehouses, stock movements |
| `hr` | Employees, departments, leave requests |

---

## Quick Start

### With Docker (recommended)

```bash
# Clone and start
git clone <repo-url>
cd Erp-framework

# Copy env file
cp backend/.env.example backend/.env

# Start all services
docker compose up --build
```

- Frontend: http://localhost
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

Default credentials: `admin@nexterp.com` / `admin123`

---

### Local Development

**Backend**
```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Set up .env
cp .env.example .env
# Edit DATABASE_URL to point to your local Postgres

uvicorn app.main:app --reload --port 8000
```

**Frontend**
```bash
cd frontend
npm install
npm run dev   # http://localhost:5173
```

---

## Creating a New Module

1. Create `backend/app/modules/<your_module>/`
2. Add these files:
   - `__init__.py`
   - `models.py` — SQLAlchemy models (import `Base` from `app.database`)
   - `schemas.py` — Pydantic schemas
   - `service.py` — Business logic
   - `router.py` — FastAPI router (must export `router`)
3. Add the module name to `INSTALLED_MODULES` in `app/core/module_loader.py`
4. Create the corresponding frontend page in `frontend/src/pages/<module>/`
5. Add the nav entry in `frontend/src/components/Layout/Sidebar.tsx`

---

## API Documentation

FastAPI auto-generates interactive docs at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

---

## Project Structure

```
Erp-framework/
├── backend/
│   ├── app/
│   │   ├── main.py              # App entry point + lifespan
│   │   ├── config.py            # Settings (pydantic-settings)
│   │   ├── database.py          # Async SQLAlchemy engine + session
│   │   ├── core/
│   │   │   ├── auth.py          # JWT dependency injection
│   │   │   ├── security.py      # Password hashing + token creation
│   │   │   └── module_loader.py # Dynamic module registration
│   │   └── modules/
│   │       ├── users/
│   │       ├── companies/
│   │       ├── crm/
│   │       ├── inventory/
│   │       └── hr/
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── api/client.ts        # Axios instance + API helpers
│   │   ├── store/auth.ts        # Zustand auth store
│   │   ├── components/          # Shared UI components
│   │   ├── pages/               # Module pages
│   │   └── types/               # TypeScript interfaces
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## License

MIT
