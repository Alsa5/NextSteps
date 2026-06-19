# Changelog

## [Unreleased]

### Added
- Microsoft SSO (Sanctuary Azure AD app / MSAL) on NextSteps frontend with unified login
- `POST /api/v1/auth/sso` and `GET /api/v1/auth/me` auth endpoints
- MongoDB `nextsteps` database with `users` and `role_mappings` collections
- Designation- and email-based RBAC resolver for maverick, trainer, ld, manager roles
- Admin CRUD routes under `/api/v1/admin/roles` for role mapping management
- Vite dev proxy for `/api` → nextsteps-api

### Changed
- Merged `nextsteps-worker` into `nextsteps-api/src/worker/` (single backend package)
- Monorepo layout: frontend moved to `nextsteps-app/`
- Login page replaced mock role picker with Microsoft SSO sign-in
- App routing now resolves dashboard from backend-assigned role after SSO
