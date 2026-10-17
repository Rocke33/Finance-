# AI-Powered Personal Finance Assistant

An intelligent, full-stack personal finance application designed for students, young professionals, and individuals who want clear visibility over their income, expenses, budgets, and automated receipt processing.

---

## 1. Project Architecture Overview

```
                      +---------------------------------------+
                      |       React 19 + Vite Frontend        |
                      |   (Tailwind CSS, TypeScript, Lucide)  |
                      |        Runs on: localhost:5173        |
                      +-------------------+-------------------+
                                          |
                        /api REST calls   | (Vite Proxy)
                                          v
                      +-------------------+-------------------+
                      |         FastAPI Python Backend        |
                      |   (Pydantic, Uvicorn, Multipart)      |
                      |        Runs on: localhost:8000        |
                      +---------+-------------------+---------+
                                |                   |
               SQLAlchemy Engine|                   | Google GenAI SDK
                                v                   v
              +-----------------+---+   +-----------+-----------+
              |    Database Layer   |   |   Gemini 3.8 Flash    |
              | Local SQLite (zero- |   | Receipt OCR & Vision  |
              | config) OR Supabase |   | Extractor & Insights  |
              |     PostgreSQL      |   +-----------------------+
              +---------------------+
```

### Core Features:
- **Financial Dashboard**: Instant visibility into monthly income, total budget, total spending, and remaining balance.
- **Budget Pacing & Status Indicators**: Dynamic categorization with `normal` (<80%), `warning` (≥80%), and `danger` (≥100%) alerts.
- **Visual Budget Comparison**: Responsive bar charts comparing allocated budgets vs. actual spending.
- **Interactive Transaction Management**: Full filtering by category, search by merchant, and responsive table/mobile card list.
- **AI-Powered Receipt Scanning**: Upload receipts (JPEG, PNG, WebP) to extract merchant, amount, date, and suggested category using Gemini Vision (`gemini-3.8-flash`), with review/edit confirmation before saving.
- **AI Financial Insights**: Automated spending alerts and actionable savings recommendations.
- **Dual Mode (Live Backend & Offline Demo Fallback)**: Smooth fallback to offline demo data if the backend is temporarily offline, with a status toggle in the UI.

---

## 2. Prerequisites & Environment

- **Operating System**: Windows 10 / 11 (PowerShell)
- **Python**: Version 3.11.x or higher (tested on Python 3.11.8)
- **Node.js**: Version 20.x or higher (tested on Node v24.16.0, npm 11.13.0)
- **Supabase**: PostgreSQL database (optional cloud sync)
- **Google Gemini API Key**: For live AI vision OCR (optional; built-in testable fallback provided when omitted)

---

## 3. Windows PowerShell Setup & Running

Open **two** separate Windows PowerShell terminals: one for the Backend and one for the Frontend.

### Terminal 1: Backend Setup & Startup

1. Open PowerShell and navigate to the project directory:
   ```powershell
   cd c:\Users\User\Desktop\ROCKE\project\finance\backend
   ```

2. (Optional) Create and activate a fresh Python virtual environment:
   ```powershell
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   ```

3. Install required Python packages:
   ```powershell
   python -m pip install -r requirements.txt
   ```

4. Configure your environment variables:
   ```powershell
   Copy-Item .env.example .env
   ```
   Open `backend\.env` in your editor and configure:
   ```ini
   # Required for Live Gemini Vision OCR
   GEMINI_API_KEY=your_gemini_api_key_here

   # Supabase Configuration (Optional - defaults to SQLite finance.db)
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your_supabase_publishable_or_service_key

   # Database URL
   DATABASE_URL=sqlite:///./finance.db

   # CORS Allowed Origins
   CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
   ```

5. Start the FastAPI server:
   ```powershell
   python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
   ```
   The backend will be running at: `http://127.0.0.1:8000`
   Interactive API docs (Swagger): `http://127.0.0.1:8000/docs`

---

### Terminal 2: Frontend Setup & Startup

1. Open a new PowerShell terminal and navigate to `my-app`:
   ```powershell
   cd c:\Users\User\Desktop\ROCKE\project\finance\my-app
   ```

2. Install Node dependencies:
   ```powershell
   npm install
   ```

3. (Optional) Configure environment variables:
   ```powershell
   Copy-Item .env.example .env
   ```

4. Build or start the development server:
   ```powershell
   # Run development server
   npm run dev

   # Or build for production preview
   npm run build
   ```
   The frontend will open at: `http://localhost:5173`

---

## 4. Database Setup & Supabase Migration

The backend includes a zero-configuration SQLite database (`finance.db`) that initializes and seeds demo data automatically on startup.

### Migrating to Supabase (PostgreSQL):
1. Log into your Supabase Dashboard at `https://supabase.com`.
2. Go to the **SQL Editor**.
3. Open `backend/schema.sql` from this repository.
4. Paste the entire SQL script and click **Run**.
   - This sets up `users`, `budgets`, and `transactions` tables with `NUMERIC(12, 2)` precision-safe monetary types.
   - Enables Row-Level Security (RLS) policies protecting user records.
5. In your `backend/.env`, set:
   ```ini
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.your-project.supabase.co:5432/postgres
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your_supabase_key
   ```

---

## 5. API Endpoints & Contract

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Health check and engine status |
| `GET` | `/api/dashboard` | Aggregated income, budget, total spending, remaining balance, and categories |
| `GET` | `/api/transactions` | Chronological transaction history with optional `?category=` filter |
| `POST` | `/api/transactions` | Create a verified transaction record |
| `GET` | `/api/insights` | AI-generated spending warnings, alerts, and recommendations |
| `POST` | `/api/upload-receipt` | Multipart form-data upload with Gemini Vision OCR extraction |

### Sample Logical Transaction Contract:
```json
{
  "id": "tx_101",
  "merchant": "Sultan's Dine",
  "category": "Food",
  "amount": 1450.00,
  "date": "2026-10-14",
  "receipt_url": null
}
```

### Sample Dashboard Summary Contract:
```json
{
  "monthly_income": 60000.00,
  "total_budget": 53000.00,
  "total_spent": 15890.00,
  "remaining": 37110.00,
  "categories": [
    {
      "name": "Food",
      "allocated": 10000.00,
      "spent": 2840.00,
      "status": "normal"
    },
    {
      "name": "Groceries",
      "allocated": 15000.00,
      "spent": 3200.00,
      "status": "normal"
    }
  ]
}
```

---

## 6. Team Branch Integration Guide

Our hackathon team works across dedicated Git branches:

- `frontend/mou`:
  - **Files**: `my-app/src/*`, `my-app/package.json`, `my-app/vite.config.ts`, `my-app/tsconfig.json`, `my-app/index.html`.
  - **Work Done**: React 19 + Tailwind v4 component architecture, responsive mobile drawer, overview cards, budget pacing badges, spending comparison charts, search/filter transaction table, AI insights UI, and receipt upload review modal with demo mode support.
- `backend/rocke`:
  - **Files**: `backend/database.py`, `backend/schemas.py`, `backend/schema.sql`, `backend/requirements.txt`, `backend/.env.example`.
  - **Work Done**: SQLAlchemy precision-safe `Numeric(12, 2)` data models (`UserDB`, `BudgetDB`, `TransactionDB`), seed logic, database repository calculations, Supabase PostgreSQL schema with RLS policies, and CORS configuration.
- `ai-api/naeem`:
  - **Files**: `backend/ai_service.py`, `backend/main.py` receipt processing routes.
  - **Work Done**: Lazy initialization of `google-genai` client, multipart upload validation (file size < 5MB and image MIME verification), structured Gemini Vision OCR prompt (`gemini-3.8-flash`), fallback parser when `GEMINI_API_KEY` is not configured, and AI financial insight generator based on budget capacity.

---

## 7. Testing & Verification

Run these commands in Windows PowerShell to verify system integrity:

### 1. Test Backend Endpoints & Logic:
```powershell
cd backend
python -c "
from starlette.testclient import TestClient
from main import app
client = TestClient(app)
assert client.get('/').status_code == 200
assert client.get('/api/dashboard').status_code == 200
assert client.get('/api/transactions').status_code == 200
assert client.get('/api/insights').status_code == 200
print('All backend API tests PASSED!')
"
```

### 2. Test Frontend Production Build:
```powershell
cd my-app
npm run build
```
*(Produces a minified, type-checked production bundle in `dist/` with 0 errors).*

---

## 8. Current Status & Known Next Steps

- [x] Full audit and error resolution (fixed ~1500 committed venv files, broken paths, missing packages, UTF-16 encoding).
- [x] Precision-safe database implementation with SQLite local zero-config and Supabase schema with RLS.
- [x] All required API routes implemented (`GET /api/dashboard`, `GET /api/transactions`, `POST /api/transactions`, `GET /api/insights`, `POST /api/upload-receipt`).
- [x] Resilient Gemini Vision OCR pipeline with lazy client loading and testable fallback mode.
- [x] Complete responsive UI with mobile drawer, overview cards, budget progress indicators, spending chart, and editable receipt scanner.
- [ ] **Next Step**: Add user authentication flow (e.g. Supabase Auth) in the frontend to support multi-user login and session persistence.