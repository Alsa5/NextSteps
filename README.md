# NextSteps

Maverick Experience Platform monorepo.

## Structure

| Package | Path | Description |
|---------|------|-------------|
| **nextsteps-app** | `nextsteps-app/` | React + Vite SPA (MSAL SSO, role-based dashboards) |
| **nextsteps-api** | `nextsteps-api/` | Express REST API + BullMQ background workers |
| **docs** | `docs/` | Platform specs, architecture, ADO state |

## Quick start

### Frontend

```bash
cd nextsteps-app
npm install
npm run dev
```

Runs at http://localhost:5173 — proxies `/api` to the API on port 3001.

### API (includes workers)

```bash
cd nextsteps-api
npm install
npm run build
npm start
```

Runs at http://localhost:3001. Background workers (Meet transcript ingest, etc.) start automatically when Redis is available.

### From repo root

```bash
npm run dev:app
npm run dev:api
```

## Environment

- **App:** `nextsteps-app/.env` — `VITE_AZURE_CLIENT_ID`, `VITE_AZURE_TENANT_ID`
- **API:** `nextsteps-api/.env` — MongoDB, JWT, Azure AD, Redis

See each package's `.env.example` for details.
