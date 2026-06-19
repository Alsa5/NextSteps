# Architecture

## Overview

NextSteps uses frontend-only MSAL with the **same Azure AD app registration as Sanctuary**. After Azure sign-in, the SPA exchanges the access token for an application JWT via `nextsteps-api`, which validates the token against Microsoft Graph and resolves RBAC from designation or email.

## Monorepo Layout

```
NextSteps/
├── nextsteps-app/      # React + Vite SPA
├── nextsteps-api/      # Express REST API + BullMQ workers (src/worker/)
└── docs/               # Specs and architecture
```

## Components

### Frontend (Vite SPA)
- **Purpose**: MSAL redirect login, Graph profile fetch, role-based routing
- **Location**: `nextsteps-app/src/auth/AzureAuthProvider.jsx`, `nextsteps-app/src/config/azure-auth-config.js`
- **Dependencies**: `@azure/msal-browser`, `@azure/msal-react`

### nextsteps-api
- **Purpose**: SSO exchange, JWT issuance, role resolution, admin role CRUD, webhooks, background jobs
- **Location**: `nextsteps-api/src/routes/`, `nextsteps-api/src/worker/`
- **Dependencies**: Express, MongoDB, BullMQ, jsonwebtoken

### MongoDB (`nextsteps` database)
- **Purpose**: User records and configurable role mappings (same cluster as Sanctuary)
- **Collections**: `users`, `role_mappings`

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/auth/sso` | Exchange Azure token for app JWT + resolved role |
| GET | `/api/v1/auth/me` | Current user profile (app JWT) |
| POST | `/api/v1/auth/switch-role` | App admin role switch |
| GET | `/api/v1/admin/roles/mappings` | List role mappings |
| POST | `/api/v1/admin/roles/mappings/email` | Add email → role mapping |
| POST | `/api/v1/admin/roles/mappings/designation` | Add designation keyword → role mapping |
| PATCH | `/api/v1/admin/roles/users/:email/role` | Override user role |

## Role Resolution Priority

1. Explicit email mapping in `role_mappings`
2. Designation/job title keyword match in `role_mappings`
3. Domain fallback (`@gmail.com` → maverick, `@hexaware.com` → trainer)
4. Default: `trainer`

## Tech Stack

- React 19 + Vite (`nextsteps-app`)
- Express + TypeScript + BullMQ workers (`nextsteps-api`)
- MongoDB (shared cluster, `nextsteps` database)
- Azure AD MSAL (Sanctuary shared app registration)
