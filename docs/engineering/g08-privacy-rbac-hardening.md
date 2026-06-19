# G-08 Privacy / RBAC Hardening (E-10)

**Issue:** [ALSAA-61](/ALSAA/issues/ALSAA-61) · **Parent:** [ALSAA-57](/ALSAA/issues/ALSAA-57) · **Spec:** `docs/nextsteps-maverick-platform-spec.md` §6

## Scope delivered

| Requirement | Implementation |
|-------------|----------------|
| RBAC on ALSAA-59 routes | `requireRoles('ld'|'trainer'|'maverick')` + batch/session assignment checks unchanged; verified in `tests/routes/privacy-rbac.test.ts` |
| Aggregate-only trainer/L&D views | `sanitizeBatchFeedbackDashboard()` strips `pendingMaverickIds`; responses include `privacy: 'batch-aggregate-only'` |
| k-anonymity (default k=5) | Session breakdowns suppressed when cohort size < threshold; `kAnonymityApplied` flag on dashboard response |
| Audit logs on sensitive reads | `AuditLogRepository` + `createAuditService()` wired into feedback-dashboard, session-analytics, transcript-summary routes |
| Retention jobs (spec §6.4) | `purge-expired-data` worker stub: feedback 24mo, transcript raw 90d, AI copilot logs 30d |

## Key files

- `nextsteps-api/src/services/privacy.ts` — k-anonymity + aggregate sanitization
- `nextsteps-api/src/services/audit.ts` — sensitive read audit helper
- `nextsteps-api/src/repositories/audit-log.ts` — audit log interface
- `nextsteps-api/src/routes/feedback-completion.ts` — sanitized L&D/trainer dashboards
- `nextsteps-api/src/routes/analytics.ts` — audit on analytics/transcript reads
- `nextsteps-api/src/worker/jobs/purge-expired-data.ts` — retention job stub
- `nextsteps-api/tests/routes/privacy-rbac.test.ts` — G-08 acceptance tests

## Privacy fix (Wave 1 regression)

The in-memory feedback dashboard previously leaked `pendingMaverickIds` in API responses — named surveillance on trainer/L&D routes. G-08 removes this at the response boundary while keeping internal reminder job payloads unchanged.

## Security sign-off checklist (spec §6)

- [x] Trainer/L&D dashboard responses contain no named Maverick identifiers
- [x] k-anonymity enforced on session breakdowns (k=5 default)
- [x] Audit entries recorded for transcript-summary, session-analytics, feedback-dashboard reads
- [x] Retention job registered with spec §6.4 windows
- [x] Wrong-role requests return 403 on protected routes
- [ ] Field-level encryption at rest (deferred — Mongo SSE-KMS in production infra)
- [ ] Penetration review (Security Architect — separate track)

**CTO sign-off:** Internal privacy checklist passes for Wave 2 pilot gate. Field-level encryption and pen test remain pre-production hardening items.
