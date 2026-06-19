# P7 Analytics Bundle (G-03 to G-07)

**Issue:** [ALSAA-62](/ALSAA/issues/ALSAA-62) · **Parent:** [ALSAA-57](/ALSAA/issues/ALSAA-57) · **Epic:** [ALSAA-54](/ALSAA/issues/ALSAA-54)

Wave 2 backend scaffold for the five P7 gap modules from the [feature matrix §11](/ALSAA/issues/ALSAA-55#document-feature-matrix). Follows the same stub-first pattern as [G-01 Feedback Completion Engine](./g01-feedback-completion-engine.md).

## Scope delivered (Wave 2 stub)

| Gap | Module | Status | Location |
|-----|--------|--------|----------|
| G-03 | Curriculum Copilot (full) | Stub + in-memory data | `GET /api/v1/ld/curriculum-copilot/recommendations` |
| G-04 | Batch Cohort Comparison | Stub + in-memory data | `GET /api/v1/ld/reports/cohort-comparison` |
| G-05 | Top Performer Identifier | Stub + in-memory data | `GET /api/v1/ld/reports/top-performers/:batchId` |
| G-06 | Executive Report Generator | Job stub + async endpoint | `POST /api/v1/ld/reports/executive` |
| G-07 | Smart Reminder Timing ML | Job stub + read endpoint | `GET /api/v1/ld/batches/:batchId/reminder-timing` |

All routes require `ld` role. Responses include `privacy: batch-aggregate-only`.

## Issue breakdown (Wave 3+ child work)

| Child scope | Owner | Depends on | Deliverable |
|-------------|-------|------------|-------------|
| G-03 LLM synthesis | AI Engineer | P2 pulse + transcript data stable | GPT-4o curriculum recommendations from real cross-batch signals |
| G-04 Mongo aggregation | Backend Architect | ALSAA-14 session data | Replace in-memory cohort metrics with batch aggregation pipeline |
| G-05 Composite scoring | Backend Architect | Quiz + readiness modules (P3) | Real composite score formula + SONIC/STRIDE nomination workflow |
| G-06 PDF/Excel export | Software Architect | G-04/G-05 data | Report renderer + download storage (Azure Blob) |
| G-07 ML send-time model | Behavioral Nudge Engine | G-01 engagement events | Replace stub-v1 with engagement-history model; wire into `send-feedback-reminder` |

## REST API contracts

### G-03 — Curriculum Copilot

```
GET /api/v1/ld/curriculum-copilot/recommendations?batchIds=B-2025-13,B-2025-14
Authorization: Bearer <jwt> (role: ld)
```

**Response (200):**

```json
{
  "batchIds": ["B-2025-13", "B-2025-14"],
  "recommendations": [
    {
      "topic": "Async JavaScript patterns",
      "confidencePercent": 82,
      "rationale": "Confusion spikes in 3 sessions across batches...",
      "affectedBatchIds": ["B-2025-13", "B-2025-14"],
      "suggestedAction": "extend-session"
    }
  ],
  "generatedAt": "2026-05-31T08:00:00.000Z",
  "privacy": "batch-aggregate-only"
}
```

### G-04 — Batch Cohort Comparison

```
GET /api/v1/ld/reports/cohort-comparison?batchA=B-2025-13&batchB=B-2025-14
Authorization: Bearer <jwt> (role: ld)
```

**Response (200):**

```json
{
  "batchA": { "batchId": "B-2025-13", "metrics": { "feedbackCompletionPercent": 70, "quizAverage": 78, "readinessScore": 72, "streamDistribution": { "full-stack": 3, "data": 2 } } },
  "batchB": { "batchId": "B-2025-14", "metrics": { "feedbackCompletionPercent": 85, "quizAverage": 82, "readinessScore": 79, "streamDistribution": { "full-stack": 2, "cloud": 3 } } },
  "metrics": {
    "feedbackCompletion": { "batchA": 70, "batchB": 85, "delta": 15 },
    "quizAverage": { "batchA": 78, "batchB": 82, "delta": 4 },
    "readinessScore": { "batchA": 72, "batchB": 79, "delta": 7 }
  },
  "insights": ["B-2025-14 feedback completion is 15pp higher than B-2025-13."],
  "privacy": "batch-aggregate-only"
}
```

### G-05 — Top Performer Identifier

```
GET /api/v1/ld/reports/top-performers/:batchId
Authorization: Bearer <jwt> (role: ld)
```

**Response (200):**

```json
{
  "batchId": "B-2025-13",
  "topPercentile": 10,
  "totalMavericks": 10,
  "performers": [
    {
      "maverickId": "mav-001",
      "displayName": "Alex Chen",
      "compositeScore": 94,
      "rank": 1,
      "sonicNominationEligible": true,
      "strideFastTrackEligible": true
    }
  ],
  "privacy": "batch-aggregate-only"
}
```

### G-06 — Executive Report Generator

```
POST /api/v1/ld/reports/executive
Authorization: Bearer <jwt> (role: ld)
Content-Type: application/json

{ "batchId": "B-2025-13", "format": "pdf" }
```

**Response (202):**

```json
{
  "status": "accepted",
  "jobId": "42",
  "batchId": "B-2025-13",
  "format": "pdf"
}
```

Job handler: `generate-executive-report` — builds AI narrative paragraphs + stub download URL.

### G-07 — Smart Reminder Timing

```
GET /api/v1/ld/batches/:batchId/reminder-timing
Authorization: Bearer <jwt> (role: ld)
```

**Response (200):**

```json
{
  "batchId": "B-2025-13",
  "modelVersion": "stub-v1",
  "maverickTimings": [
    {
      "maverickId": "mav-004",
      "optimalHourUtc": 14,
      "engagementScore": 0.82,
      "preferredChannel": "email"
    }
  ],
  "privacy": "batch-aggregate-only"
}
```

Job handler: `compute-reminder-timing` — integrates with G-01 `send-feedback-reminder` in Wave 3.

## Source layout

```
nextsteps-api/src/
├── types/p7-analytics.ts
├── repositories/p7-analytics.ts
├── repositories/in-memory-p7-analytics.ts
├── routes/p7-analytics.ts
├── schemas/p7-analytics-params.ts
└── worker/jobs/
    ├── generate-executive-report.ts   # G-06
    └── compute-reminder-timing.ts     # G-07
```

## Verification

```bash
cd nextsteps-api
npm test -- tests/routes/p7-analytics.test.ts tests/worker/p7-analytics-jobs.test.ts
npm run build
```

## References

- Gap register: `docs/nextsteps-alsaa54-phased-feature-matrix.md` §11
- Master prompt §8.3 L&D features: `docs/nextsteps-master-prompt.txt`
- Prior Wave 1 pattern: `docs/engineering/g01-feedback-completion-engine.md`
