## Ledger Watchdog

A lightweight USDT transaction monitoring and community flagging tool for Solana. Frontend (React + Vite) shows a live feed of recent USDT transfers pulled from Solana RPC. Backend (Node.js + Express + Prisma) stores only user-submitted flags; ordinary transactions are not persisted.

### Highlights
- Live USDT feed from Solana RPC (no vendor lock-in). Default window: last 24 hours; frontend auto-refresh every 30 minutes.
- Store-on-flag: only flagged transactions are written to the DB, keeping storage lean.
- Fully typed TypeScript stack, clean architecture (routes → services → repositories), zod validation, helmet + CORS + rate limiting.
- SQLite for local development via Prisma; swap to Postgres in production if desired.

---

## Features

### Live USDT Transaction Feed (Solana)
- Fetches recent USDT SPL-token transfers from Solana RPC.
- Default lookback: 24 hours; auto-refresh: every 30 minutes.
- No persistence for live feed; data is normalized and returned from the backend per request.

### Transaction Flagging (Persisted)
- Users can open a transaction, provide category, severity, notes, confidence, and evidence URLs.
- On submission, the backend fetches minimal transaction info (if missing) and persists both the transaction and the flag.
- Only flagged transactions are stored.

### Stats & Insights (DB-backed)
- Transaction stats (count, risk distribution, volume, etc.) over stored/flagged data.
- Flag stats (counts, statuses) for moderation and reporting.

### Security & Observability
- Helmet, CORS, rate limiting, content-type checks.
- Structured logging (winston + request IDs) for traceability.

---

## Architecture

### Frontend
- React 18 + TypeScript + Vite
- Tailwind UI components (shadcn/ui)
- Key pages/components:
  - `src/pages/Index.tsx`: Orchestrates feed, filters, drawer, and flag modal
  - `src/components/transactions/TransactionTable.tsx`: Live list
  - `src/components/transactions/TransactionDrawer.tsx`: Transaction details
  - `src/components/transactions/FlagModal.tsx`: Submit flags
  - `src/lib/api.ts`: Real API client (replaces mockData)

### Backend
- Node 20 + Express + TypeScript
- Prisma ORM (SQLite in dev)
- Clean layering: routes → services → repositories
- Key server modules:
  - `server/src/routes/transactions.ts`: Live USDT feed + transaction details
  - `server/src/routes/flags.ts`: Flag submission and queries
  - `server/src/services/solanaService.ts`: Solana RPC integration (feed + lookups)
  - `server/src/services/*.ts`: Business logic
  - `server/src/repositories/*.ts`: DB access via Prisma
  - `server/src/app.ts`: Middleware (helmet, CORS, rate limiting), logging, routes
  - `server/src/index.ts`: Server bootstrap

### Database (Prisma + SQLite)
- `server/prisma/schema.prisma` defines:
  - `Transaction`: normalized fields, indices; stringified arrays for SQLite compatibility
  - `Flag`: user-submitted reports referencing `Transaction.sig`
  - `IngestionCursor`, `SystemMetric` (for future ingestion/ops)

---

## API (Local)

Base URL: `http://localhost:3001/api/v1`

### Transactions
- `GET /transactions`
  - Live USDT feed (no DB). Query params:
    - `limit` (default 50)
    - `lookback` (seconds; default 86400 → 24h)
- `GET /transactions/:sig`
  - Details. DB first; falls back to RPC if not stored.
- `GET /transactions/:sig/flags`
  - All flags for a signature (from DB).
- `GET /transactions/stats`
  - Aggregated stats (DB-backed over stored/flagged data).
- `GET /transactions/debug`
  - Debug RPC connectivity/config (dev helper).

### Flags
- `POST /flags`
  - Body: `{ txSig, category, severity: "low"|"medium"|"high", confidence, notes, evidenceUrls: string[] }`
  - Creates a minimal `Transaction` (if missing) and persists the `Flag`.
- `GET /flags`
  - List/query flags.
- `GET /flags/stats`
  - Aggregated flag stats.

### Health
- `GET /health`
  - Service health, uptime, and DB connectivity.

---

## Run Locally

### Prerequisites
- Node.js ≥ 20
- npm ≥ 9

### 1) Install dependencies
```bash
npm install
cd server && npm install
```

### 2) Configure environment (server)
Copy `server/env.example` to `server/.env` and adjust as needed:
```env
PORT=3001
NODE_ENV=development
DATABASE_URL="file:./dev.db"
SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"  # Free public RPC
USDT_MINT="Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB" # USDT (Solana)
CORS_ORIGIN="http://localhost:8080"
```

### 3) Initialize DB (SQLite via Prisma)
```bash
cd server
npm run db:generate
npm run db:push
# optional: npm run db:studio  # opens Prisma Studio
```

### 4) Start backend (port 3001)
```bash
cd server
npx tsx src/index.ts
# or: npm run dev
```

### 5) Start frontend (port 8080)
```bash
npm run dev
# open http://localhost:8080
```

---

## How to Use (Local)

1) Open the app at `http://localhost:8080`.
2) The Transaction Feed loads live USDT transfers via the backend (`GET /transactions`).
   - Default: last 24h; auto-refresh every 30 minutes.
3) Click a transaction to open the drawer.
4) Click “Flag” to submit an analysis (category, severity, notes, evidence URLs).
   - Backend stores the `Flag` and a minimal `Transaction` row if not already stored.

---

## Verify Data Is Stored

### Prisma Studio (UI)
```bash
cd server
npm run db:studio
# browse tables: transactions, flags
```

### SQLite CLI (direct)
```bash
sqlite3 server/prisma/dev.db
.tables
SELECT COUNT(*) FROM flags;
SELECT id, txSig, category, severity, createdAt FROM flags ORDER BY createdAt DESC LIMIT 10;
SELECT sig, "from", "to", amountUSDT, createdAt FROM transactions ORDER BY createdAt DESC LIMIT 10;
SELECT f.id, f.txSig, t."from", t."to", f.category, f.severity, f.createdAt
FROM flags f JOIN transactions t ON t.sig = f.txSig
ORDER BY f.createdAt DESC LIMIT 10;
```

---

## Configuration Reference (Server)

- `PORT` (default 3001): API port
- `NODE_ENV`: development | production | test
- `DATABASE_URL`: SQLite path (e.g., `file:./dev.db`)
- `SOLANA_RPC_URL`: Solana RPC endpoint (free public by default). For reliability, consider providers like Helius or Alchemy.
- `USDT_MINT`: USDT mint on Solana (`Es9v...`)
- `CORS_ORIGIN`: Allowed origins (use your frontend origin in dev)
- `ingestionIntervalMs`, `logLevel` and others are configurable in `server/src/config/index.ts`

---

## Troubleshooting

### No transactions in the live feed
- Free public RPC can rate-limit (HTTP 429). Try:
  - Reduce lookback when testing: `GET /transactions?lookback=1800` (30m)
  - Increase auto-refresh interval
  - Use a provider key (Helius/Alchemy) via `SOLANA_RPC_URL`

### CORS errors
- Ensure `CORS_ORIGIN` in `server/.env` matches your frontend origin (e.g., `http://localhost:8080`).

### Port is already in use (3001)
```bash
pkill -f "tsx" || true
```

### DB not showing flags
- Flags are only persisted on submission. Submit a test flag via the UI or:
```bash
curl -s -H "Content-Type: application/json" \
  -X POST http://localhost:3001/api/v1/flags \
  -d '{"txSig":"test-sig-1","category":"Test","severity":"medium","confidence":80,"notes":"Test notes >= 20 chars","evidenceUrls":[]}'
```

---

## Scripts

### Server (from `server/`)
```bash
npm run dev           # Dev server (tsx watch)
npm run build         # Build (tsup)
npm run start         # Run built server
npm run db:generate   # Prisma generate
npm run db:push       # Push schema to DB
npm run db:studio     # Prisma Studio
npm run test          # Run tests
```

### Frontend (from repo root)
```bash
npm run dev           # Vite dev server (http://localhost:8080)
```

---

## Roadmap (Next)

- Switch to webhook-based ingestion (Helius) for real-time, low-rate USDT indexing
- Advanced filters (amount thresholds, address labels)
- Moderation workflow for flags
- Production DB (Postgres), observability, and deployment






