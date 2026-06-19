# G-01 Feedback Completion Engine

**Issue:** [ALSAA-59](/ALSAA/issues/ALSAA-59) · **Parent:** [ALSAA-57](/ALSAA/issues/ALSAA-57) · **Pulse pipeline:** [ALSAA-14](/ALSAA/issues/ALSAA-14)

Wave 1 backend scaffold for the 3-tier feedback reminder engine, live batch completion dashboard, and 90% batch XP bonus hook. This extends the ALSAA-14 pulse pipeline — it does **not** duplicate session logger or pulse capture work.

## Scope delivered

| Capability | Status | Location |
|------------|--------|----------|
| Live batch feedback % dashboard API | Stub + in-memory data | `GET /api/v1/ld/batches/:batchId/feedback-dashboard`, `GET /api/v1/trainer/batches/:batchId/feedback-dashboard` |
| 3-tier reminder job (`send-feedback-reminder`) | Job stub + worker | `src/worker/jobs/send-feedback-reminder.ts` |
| 90% batch XP bonus hook (`evaluate-batch-xp-bonus`) | Job stub + worker | `src/worker/jobs/evaluate-batch-xp-bonus.ts` |
| Pulse pipeline integration webhook | Public webhook | `POST /api/v1/webhooks/pulse/feedback-submitted` |

## Reminder tiers

| Tier | Day | Audience | Action |
|------|-----|----------|--------|
| 0 | Session end (Day 0) | Pending Mavericks | Email/SMS nudge stub |
| 1 | Day 1 | Pending Mavericks | Follow-up reminder stub |
| 2 | Day 2 | Pending Mavericks + Trainer | Escalation to assigned trainer stub |

Cron scheduling for Day 1/2 is **out of scope** for Wave 1 — document integration point only (see below).

## REST API

### L&D dashboard

```
GET /api/v1/ld/batches/:batchId/feedback-dashboard
Authorization: Bearer <jwt> (role: ld)
```

**Response (200):**

```json
{
  "batchId": "B-2025-13",
  "completionPercent": 70,
  "submittedCount": 7,
  "totalSlots": 10,
  "xpBonusThresholdPercent": 90,
  "xpBonusEligible": false,
  "xpBonusAwarded": false,
  "submissionsAwayFromXpBonus": 2,
  "sessions": [
    {
      "sessionId": "ses-001",
      "submittedCount": 4,
      "pendingCount": 1,
      "completionPercent": 80,
      "pendingMaverickIds": ["mav-005"]
    }
  ],
  "reminderTiers": { "day0": true, "day1": false, "day2": false },
  "privacy": "batch-aggregate-only"
}
```

### Trainer dashboard

```
GET /api/v1/trainer/batches/:batchId/feedback-dashboard
Authorization: Bearer <jwt> (role: trainer, assigned to batch)
```

Same payload shape; returns `403` if trainer is not assigned to the batch.

### Pulse feedback webhook (ALSAA-14 extension)

```
POST /api/v1/webhooks/pulse/feedback-submitted
Content-Type: application/json

{
  "sessionId": "ses-001",
  "maverickId": "mav-004",
  "batchId": "B-2025-13"
}
```

**Behavior:**

1. Records submission via `FeedbackCompletionRepository.recordFeedbackSubmission` (does not re-implement pulse capture).
2. Enqueues `evaluate-batch-xp-bonus` to check 90% threshold.
3. Returns `202` with `jobId`.

## Background jobs

| Job name | Queue constant | Trigger | Stub behavior |
|----------|----------------|---------|---------------|
| `send-feedback-reminder` | `JOB_SEND_FEEDBACK_REMINDER` | Session end / cron | Email stub per pending Maverick; trainer escalation on tier 2 |
| `evaluate-batch-xp-bonus` | `JOB_EVALUATE_BATCH_XP_BONUS` | After pulse submission | Awards 200 XP batch bonus once when completion ≥ 90% |

### Enqueue reminder (internal / cron stub)

```typescript
await enqueueSendFeedbackReminder({
  sessionId: 'ses-001',
  batchId: 'B-2025-13',
  tier: 0,
  pendingMaverickIds: ['mav-004', 'mav-005'],
  trainerId: 'tr-001', // required for tier 2
});
```

## Frontend integration points

| UI surface | API / event | Owner |
|------------|-------------|-------|
| L&D Ops dashboard — batch feedback % widget | `GET .../ld/batches/:batchId/feedback-dashboard` | Software Architect / Wave 1 frontend |
| Trainer session analytics — completion bar | Existing `feedbackCompletion` on session analytics + batch dashboard | ALSAA-14 frontend |
| Maverick pulse submit success | Pulse pipeline POST → webhook above | ALSAA-14 backend (emit after save) |
| Batch gamification toast (“2 away from 90%”) | `submissionsAwayFromXpBonus` field | Wave 1 frontend |
| XP bonus celebration modal | Poll dashboard or subscribe to XP events (future) | ALSAA-18 gamification |

## ALSAA-14 coordination (no duplication)

| ALSAA-14 owns | G-01 owns |
|---------------|-----------|
| Session logger, pulse/deep feedback capture | Completion % aggregation + reminder orchestration |
| Maverick/trainer session endpoints | Batch-level dashboard + reminder/XP jobs |
| Feedback form UX | Webhook consumer + job enqueue only |

When ALSAA-26 lands Mongo repositories, replace `createInMemoryFeedbackCompletionRepository` with a shared pulse-read model — do not fork submission storage.

## Verification

```bash
cd nextsteps-api
npm test
```

Targeted suites:

- `tests/services/feedback-completion.test.ts`
- `tests/routes/feedback-completion.test.ts`
- `tests/worker/send-feedback-reminder.test.ts`
- `tests/worker/evaluate-batch-xp-bonus.test.ts`

## Follow-ups (delegated, not blocking Wave 1)

1. Cron scheduler for Day 1/2 reminders (tie to session `endedAt`).
2. Wire session-end webhook to enqueue tier-0 reminder alongside transcript ingest.
3. Mongo-backed `FeedbackCompletionRepository` when ALSAA-26 schema lands.
4. Real email/SMS provider behind notification stubs.
