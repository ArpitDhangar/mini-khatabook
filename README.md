# Khatabook — Dairy Shop Credit Manager

A full-stack web app for small dairy/milk shops to track customer credit, auto-generate daily ledger entries, and manage payments.

---

## Project Structure

```
khatabook/
├── backend/          Node.js + Express + MongoDB
└── frontend/         React + Vite + Tailwind CSS
```

---

## Quick Start

### 1. Clone & install dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure environment variables

```bash
# Backend
cd backend
cp .env.example .env
# Edit .env and set your MONGODB_URI
```

```bash
# Frontend
cd frontend
cp .env.example .env
# Edit .env and set VITE_API_URL if needed
```

### 3. Run in development

```bash
# Terminal 1 — Backend
cd backend
npm run dev     # runs on http://localhost:5000

# Terminal 2 — Frontend
cd frontend
npm run dev     # runs on http://localhost:5173
```

---

## Deployment

### Backend → Render

1. Push `backend/` to a GitHub repo
2. Create a new **Web Service** on Render
3. Set **Root Directory** to `backend`
4. Set **Build Command**: `npm install`
5. Set **Start Command**: `node server.js`
6. Add environment variables:
   - `MONGODB_URI` — your Atlas connection string
   - `NODE_ENV` — `production`
   - `FRONTEND_URL` — your Vercel frontend URL

### Frontend → Vercel

1. Push `frontend/` to a GitHub repo
2. Import project in Vercel
3. Set **Root Directory** to `frontend`
4. Add environment variable:
   - `VITE_API_URL` — your Render backend URL + `/api`
5. Deploy

---

## API Reference

### Customers

| Method | Endpoint                    | Description                    |
|--------|-----------------------------|--------------------------------|
| GET    | `/api/customers`            | List all active customers      |
| GET    | `/api/customers/stats`      | Dashboard aggregate stats      |
| POST   | `/api/customers`            | Create new customer            |
| GET    | `/api/customers/:id`        | Get single customer            |
| PUT    | `/api/customers/:id`        | Update customer                |
| DELETE | `/api/customers/:id`        | Soft-deactivate customer       |
| PATCH  | `/api/customers/:id/pause`  | Toggle pause/resume            |
| GET    | `/api/customers/:id/summary`| Financial summary + monthly    |

### Ledger

| Method | Endpoint                    | Description                    |
|--------|-----------------------------|--------------------------------|
| GET    | `/api/ledger/:customerId`   | Get entries (with filters)     |
| POST   | `/api/ledger`               | Create manual entry (payment)  |
| PUT    | `/api/ledger/:id`           | Edit entry (with audit log)    |
| DELETE | `/api/ledger/:id`           | Soft-delete entry              |
| POST   | `/api/ledger/generate`      | Generate all missing entries   |

---

## Key Features

- **Auto daily entries** — Cron job runs at midnight to create debit entries for all active customers
- **Fallback recovery** — On page load, missing entries are auto-generated (handles server downtime)
- **Pause/Resume** — Skip entries for specific date ranges when customers are on holiday
- **Amount history** — Change daily amount from a specific date without affecting past records
- **Soft delete** — Nothing is ever permanently deleted; full audit trail
- **Edit history** — Every edit to a ledger entry is logged
- **Monthly summary** — View per-month breakdown of debits, credits, and balance
