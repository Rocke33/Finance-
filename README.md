# AIFinance: AI-Powered Personal Finance Assistant

[![Python 3.11](https://img.shields.io/badge/Python-3.11.8-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.143.2-009688.svg)](https://fastapi.tiangolo.com/)
[![React 19](https://img.shields.io/badge/React-19.3.1-61DAFB.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.3.0-646CFF.svg)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.3.3-38B2AC.svg)](https://tailwindcss.com/)
[![Gemini 3.8](https://img.shields.io/badge/Google%20GenAI-Gemini%203.8%20Flash-FF6F00.svg)](https://ai.google.dev/)
[![Tests Passing](https://img.shields.io/badge/Tests-13%2F13%20Passing-success.svg)](backend/test_api_verification.py)

An intelligent, full-stack personal finance web application built for students, young professionals, and individuals who manage physical cash alongside digital Mobile Financial Services (MFS). **AIFinance** introduces a deterministic **Fixed Two-Wallet Accounting Model** (Cash vs. Online), an automated **Gemini Vision OCR Receipt Scanner**, and a **Context-Aware AI Financial Advisor** grounded in real-time user balances and category budgets.

---

## Team & University Information

- **Project Title:** AIFinance (AI-Powered Personal Finance Assistant)
- **Team Name:** JU_CSE_33
- **Institution:** Department of Computer Science & Engineering (CSE), Jahangirnagar University, Bangladesh
- **Event:** 2026 Shenzhen International FinTech Competition – International Track.

### Development Team Members:

| Team Member | Role | Core Responsibilities |
|---|---|---|
| **Md Rocke Ahamed** | **Backend Engineer** | FastAPI REST engine, SQLAlchemy ORM, two-wallet double-entry solvency engine, Supabase PostgreSQL with RLS, stateless JWT auth & Bcrypt security. |
| **Nadia Akter Mou** | **Frontend Engineer** | React 19 SPA, Tailwind CSS v4 design system, HeroBalanceCard, WalletsCarousel, zero-dependency pure SVG visualizations, floating AI chat UI. |
| **Naeem Khandoker** | **QA Engineer** | Automated test suite (13/13 passing tests), Google GenAI SDK integration, Gemini 3.8 Flash OCR vision pipeline, edge-case failure testing & schema auditing. |
| **Tasniha Prionti** | **Presentation & Documentation** | Hackathon pitch deck, technical documentation authoring, user manual walkthroughs, ReportLab PDF compilation, Word (.docx) technical report. |

---

## 1. Project Architecture Overview

```
                          +---------------------------------------+
                          |       React 19 + Vite Frontend        |
                          |   (Tailwind CSS v4, Lucide Icons)     |
                          |        Runs on: localhost:5173        |
                          +-------------------+-------------------+
                                              |
                            /api REST calls   | (Vite Reverse Proxy)
                            + Bearer JWT      |
                                              v
                          +-------------------+-------------------+
                          |         FastAPI Python Backend        |
                          |   (Pydantic v2, Uvicorn, PyJWT,       |
                          |    Passlib Bcrypt, Python-Multipart)  |
                          |        Runs on: localhost:8000        |
                          +---------+-------------------+---------+
                                    |                   |
                   SQLAlchemy Engine|                   | Google GenAI SDK (2.31.0)
                                    v                   v
                  +-----------------+---+   +-----------+-----------+
                  |    Database Layer   |   |   Gemini 3.8 Flash    |
                  | Local SQLite (zero- |   | Receipt Vision OCR &  |
                  | config) OR Supabase |   | Grounded Chat Advisor |
                  |   PostgreSQL (RLS)  |   +-----------------------+
                  +---------------------+
```

### Core Implemented Innovations:

1. **Deterministic Two-Wallet Solvency Engine:**
   - Explicitly partitions funds into **Cash** (physical currency in hand) and **Online** (bKash, Nagad, bank debit cards).
   - Enforces pre-condition solvency checks: rejects expenses if the chosen wallet lacks sufficient balance, eliminating accidental overdrafts and phantom liquidity.
   - Atomically credits the refunded amount back to the exact payment wallet upon transaction deletion (`DELETE /api/transactions/{id}`).
   - Enables seamless inter-wallet transfers (`POST /api/wallets/transfer`) while preserving total balance invariants.

2. **Multimodal Gemini Vision OCR (`gemini-3.8-flash`):**
   - Upload paper receipts, supermarket chits, or mobile transaction screenshots (JPEG, PNG, WebP up to 5MB).
   - Automated server-side Pillow image verification and structured JSON schema extraction.
   - Extracts merchant name, amount, date, and suggested category in under 2 seconds.
   - Human-in-the-loop review modal: user inspects and edits data, assigns the payment wallet, and confirms before database insertion.

3. **Context-Grounded AI Financial Advisor Chat:**
   - Draggable floating AI chat bubble (screen coordinates persisted across sessions via `localStorage`).
   - Dynamically injects live user financial state: total balance, cash/online breakdown, monthly income, total budget, burn rate, and category spending.
   - Eliminates LLM hallucinations by grounding financial suggestions strictly in verified user numbers in Bangladeshi Taka (BDT / ৳) and USD ($).

4. **Zero-Dependency Pure React SVG Visualizations:**
   - **Daily Spend Trend:** Custom cubic bezier spline curves (`C` path commands) with responsive 7-day and 30-day views.
   - **Financial Health Score Gauge:** Circular progress score synthesizing savings rate and budget discipline.
   - **Spending Forecast Card:** Computes projected month-end burn rate against total budget capacity.
   - **Donut Geometry Chart:** Calculates polar-to-cartesian arcs for category expense distributions without heavy charting libraries.

5. **Stateless JWT Security & Multi-Tenant Data Isolation:**
   - Cryptographic password salting and hashing via **Bcrypt**.
   - Stateless HMAC-SHA256 **JSON Web Tokens (JWT)** for protected endpoints with automatic bearer dependency injection.
   - Supabase **Row-Level Security (RLS)** restricting all database queries by `auth.uid() == user_id`.

---

## 2. Prerequisites & Environment

- **Operating System**: Windows 10 / 11 (PowerShell) or Linux / macOS
- **Python**: Version 3.11.x (tested on Python 3.11.8)
- **Node.js**: Version 20.x or higher (tested on Node v24.16.0, npm 11.13.0)
- **Database**: Zero-configuration local SQLite (`finance.db`) built-in; optional Supabase PostgreSQL
- **Google Gemini API Key**: For live AI vision OCR & grounded chat (built-in offline mock fallback provided if omitted)

---

## 3. Windows PowerShell Setup & Running

Open **two** separate Windows PowerShell terminals: one for the Backend and one for the Frontend.

### Terminal 1: Backend Setup & Startup

1. Navigate to the backend directory:
   ```powershell
   cd c:\Users\User\Desktop\ROCKE\project\finance\backend
   ```

2. (Optional) Create and activate a Python virtual environment:
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
   # Required for Live Gemini Vision OCR and AI Chat
   GEMINI_API_KEY=your_gemini_api_key_here

   # Database URL (Defaults to local zero-config SQLite)
   DATABASE_URL=sqlite:///./finance.db

   # Supabase Configuration (Optional - for cloud PostgreSQL sync)
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your_supabase_anon_or_service_key

   # JWT Secret Key
   SECRET_KEY=your_secure_random_jwt_secret_key_here

   # CORS Allowed Origins
   CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
   ```

5. Start the FastAPI ASGI server:
   ```powershell
   python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
   ```
   - **Backend URL:** `http://127.0.0.1:8000`
   - **Interactive API Documentation (Swagger UI):** `http://127.0.0.1:8000/docs`

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

3. Start the Vite development server:
   ```powershell
   npm run dev
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:5173
   ```

---

## 4. API Endpoints & Specification

All API endpoints are prefixed with `/api` and validated with Pydantic schemas:

| Method | Endpoint | Category | Description | Auth Required |
|---|---|---|---|---|
| `GET` | `/` | System | Health check, engine status, and runtime confirmation | No |
| `POST` | `/api/auth/register` | Authentication | Register a new user with Bcrypt password hashing | No |
| `POST` | `/api/auth/login` | Authentication | Authenticate credentials and return signed JWT token | No |
| `GET` | `/api/auth/me` | Authentication | Retrieve profile details of authenticated user | Yes (Bearer JWT) |
| `GET` | `/api/dashboard` | Analytics | Aggregated income, budget, total spending, burn rate, and wallets | Optional |
| `GET` | `/api/wallets` | Wallets | Retrieve Cash and Online wallet balances | Optional |
| `POST` | `/api/wallets/set-balance` | Wallets | Update Cash or Online balance after manual reconciliation | Optional |
| `POST` | `/api/wallets/transfer` | Wallets | Atomic transfer between Cash and Online with solvency check | Optional |
| `GET` | `/api/transactions` | Transactions | Chronological transaction list with optional `?category=` filter | Optional |
| `POST` | `/api/transactions` | Transactions | Create transaction with required wallet deduction | Optional |
| `DELETE`| `/api/transactions/{id}` | Transactions | Delete transaction and automatically refund origin wallet | Optional |
| `POST` | `/api/upload-receipt` | AI Vision | Upload receipt photo for Gemini 3.8 Flash OCR extraction | Optional |
| `POST` | `/api/ai/chat` | AI Advisory | Multi-turn financial advice grounded in user figures | Optional |
| `GET` | `/api/insights` | AI Insights | Automated rule-based and AI budget alerts and advice | Optional |

---

## 5. Database Architecture & Supabase Migration

AIFinance utilizes an adaptable dual-database architecture:
- **Local Development:** Standalone, zero-config SQLite (`finance.db`) automatically seeded on initial server run.
- **Production Cloud:** Supabase PostgreSQL with `Numeric(12, 2)` monetary columns and Row-Level Security.

### Running Cloud Supabase Migration:
1. Log in to your [Supabase Dashboard](https://supabase.com).
2. Navigate to the **SQL Editor**.
3. Copy and execute the contents of `backend/schema.sql`:
   - Creates `users`, `budgets`, `wallets`, and `transactions` tables.
   - Enforces Foreign Key constraints with `ON DELETE CASCADE`.
   - Enables Row-Level Security (RLS) policies protecting user records.
4. Update `DATABASE_URL` in `backend/.env` with your Supabase pooler connection string.

---

## 6. Testing & Automated Verification

A comprehensive 13-point integration test suite is located in `backend/test_api_verification.py`.

### 1. Run Backend Automated API Test Suite:
```powershell
cd c:\Users\User\Desktop\ROCKE\project\finance\backend
python test_api_verification.py
```
**Verification Coverage (13/13 Pass):**
1. Health check verification (`GET /`)
2. Dashboard analytics response (`GET /api/dashboard`)
3. Transaction retrieval (`GET /api/transactions`)
4. Cash expense creation and atomic deduction (`POST /api/transactions`)
5. Online expense creation and solvency verification
6. Rejection of negative / zero amounts (HTTP 422)
7. Inter-wallet funds transfer (`POST /api/wallets/transfer`)
8. Set wallet balance reconciliation (`POST /api/wallets/set-balance`)
9. Solvency enforcement (rejection of transfer exceeding balance)
10. Transaction deletion and automatic balance refund (`DELETE /api/transactions/{id}`)
11. AI financial insights endpoint (`GET /api/insights`)
12. Receipt upload and OCR validation (`POST /api/upload-receipt`)
13. Live context-grounded AI chat advisor (`POST /api/ai/chat`)

### 2. Verify Frontend Production Build:
```powershell
cd c:\Users\User\Desktop\ROCKE\project\finance\my-app
npm run build
```
*(Produces a production bundle in `dist/` with 0 TypeScript or Tailwind errors in 1.8s).*

---

## 7. Hackathon Technical Documentation Deliverables

Complete technical documentation compiled specifically for hackathon evaluation:

| Deliverable | File Path | Format & Details |
|---|---|---|
| **Technical Overview PDF** | [`AI_Powered_Personal_Finance_Assistant_Project_Overview.pdf`](AI_Powered_Personal_Finance_Assistant_Project_Overview.pdf) | **29 Pages** (3.03 MB), Two-Pass ReportLab PDF with AIFinance cover page, team photos, architecture diagrams, and user manual. |
| **Word Edition (DOCX)** | [`AI_Powered_Personal_Finance_Assistant_Project_Overview.docx`](AI_Powered_Personal_Finance_Assistant_Project_Overview.docx) | **1.88 MB** fully editable Word document with formatted tables, team cards, and high-res system diagrams. |
| **Markdown Edition** | [`AI_Powered_Personal_Finance_Assistant_Project_Overview.md`](AI_Powered_Personal_Finance_Assistant_Project_Overview.md) | **39.5 KB** comprehensive GitHub Flavored Markdown specification. |

---

## 8. License & Acknowledgments

Developed by **Team Never Existed** from **Jahangirnagar University, CSE, Bangladesh** for the University Hackathon 2026. Built with FastAPI, React 19, Supabase, Tailwind CSS, and Google GenAI.
