# Paperclip → ADO routing matrix (NextSteps)

**Maintainer:** Scrum Master. **Canonical for NextSteps project workspace.**  
**Plan source:** ALSAA-11 revision `1.0.0-draft` — `docs/plans/nextsteps-ado-feature-ladder-plan.md`

---

## Project routing

| Paperclip project | ADO team project | Area path | Assignee |
|-------------------|------------------|-----------|----------|
| NextSteps | Lab AI Tools | `Lab AI Tools\NextSteps` | Sakthi Alagappan (`2000147951@hexaware.com`) |

**Iteration standard:** `Lab AI Tools\Sprint N` (Mon–Fri; Sprint 1 anchor 2026-05-19).  
**Current (2026-05-29):** Sprint 2 (2026-05-26 → 2026-05-30).

**Do not use:** legacy `Iteration N` or date-only iteration paths for new assignments.

---

## Standing mirrors (populate after ALSAA-11 implementation)

| Paperclip | Phase | ADO Feature | ADO User Story |
|-----------|-------|-------------|----------------|
| ALSAA-12 | P0 / 0.1.0 | *pending* | *pending* |
| ALSAA-13 | P1 / 0.2.0 | *pending* | *pending* |
| ALSAA-14 | P2 / 0.3.0 | *pending* | *pending* |
| ALSAA-15 | P3 / 0.4.0 | *pending* | *pending* |
| ALSAA-16 | P4 / 0.5.0 | *pending* | *pending* |
| ALSAA-17 | P5 / 0.6.0 | *pending* | *pending* |
| ALSAA-18 | P6 / 0.7.0 | *pending* | *pending* |

---

## Feature ladder (Friday semver)

| Semver | Feature title | Target Friday | Sprint |
|--------|---------------|---------------|--------|
| 0.1.0 | NextSteps Release 0.1.0 — MERN Foundation | 2026-05-30 | Sprint 2 |
| 0.2.0 | NextSteps Release 0.2.0 — Maverick Mission HQ | 2026-06-06 | Sprint 3 |
| 0.3.0 | NextSteps Release 0.3.0 — Trainer Pulse | 2026-06-13 | Sprint 4 |
| 0.4.0 | NextSteps Release 0.4.0 — L&D Intelligence | 2026-06-20 | Sprint 5 |
| 0.5.0 | NextSteps Release 0.5.0 — Session Intelligence | 2026-06-27 | Sprint 6 |
| 0.6.0 | NextSteps Release 0.6.0 — Deployment Bridge | 2026-07-04 | Sprint 7 |
| 0.7.0 | NextSteps Release 0.7.0 — Gamification | 2026-07-11 | Sprint 8 |

**Delivery plan:** [Mimir Delivery Plan](https://dev.azure.com/Innovation-Lab-Pipelines/Lab%20AI%20Tools/_deliveryplans/plan/96deb8f6-a004-4ca3-a6b0-b824cc877632) (NextSteps cards filtered by area).

---

## Work item conventions

- **Hierarchy:** Feature → User Story → Task / Bug
- **Tags:** `nextsteps`, `paperclip` on SM-created items
- **Description:** include `Paperclip: {identifier}` and issue URL
- **IC escalation:** engineering agents request SM linkage via Paperclip comment; SM creates/updates ADO

---

## WIQL snippets

**Open NextSteps User Stories:**

```wiql
SELECT [System.Id], [System.Title], [System.State], [System.IterationPath]
FROM WorkItems
WHERE [System.TeamProject] = 'Lab AI Tools'
  AND [System.AreaPath] UNDER 'Lab AI Tools\NextSteps'
  AND [System.WorkItemType] = 'User Story'
  AND [System.State] <> 'Closed'
ORDER BY [Microsoft.VSTS.Common.Priority]
```

**Stories missing Definition of Ready:**

```wiql
SELECT [System.Id], [System.Title]
FROM WorkItems
WHERE [System.TeamProject] = 'Lab AI Tools'
  AND [System.AreaPath] UNDER 'Lab AI Tools\NextSteps'
  AND [System.WorkItemType] = 'User Story'
  AND [System.State] IN ('Active', 'New')
  AND [Microsoft.VSTS.Common.AcceptanceCriteria] = ''
```

---

## Changelog

| Date | Change |
|------|--------|
| 2026-05-29 | Initial NextSteps routing + Feature ladder (ALSAA-11 plan `1.0.0-draft`) |
