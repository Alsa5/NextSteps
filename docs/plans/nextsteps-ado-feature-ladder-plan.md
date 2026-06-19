# NextSteps ADO Feature Ladder & Delivery Plan Mirror — Execution Plan

| Field | Value |
|-------|-------|
| **Issue** | ALSAA-11 |
| **Revision** | 1.0.0-draft |
| **Author** | Scrum Master |
| **Product handoff** | VP Product release analysis (issue description) |
| **Spec reference** | `docs/nextsteps-maverick-platform-spec.md` §7.6 |
| **Baseline semver** | 0.0.0 (`package.json`) |
| **Planning date** | 2026-05-29 |

---

## 1. Executive summary

Mirror the NextSteps Maverick Experience Platform build phasing (P0–P6) onto **Azure DevOps** under the **Lab AI Tools** project using org-standard **Friday semver Features**, **`Lab AI Tools\Sprint N`** iteration paths, and a **delivery plan** card hierarchy aligned with Paperclip issues **ALSAA-12 through ALSAA-18**.

This heartbeat delivers the **plan only**. ADO mutations execute in a follow-up implementation heartbeat after CEO/board approval of this document.

---

## 2. ADO routing (Paperclip → ADO)

| Paperclip | ADO |
|-----------|-----|
| **Project** | NextSteps (Paperclip) |
| **ADO Team Project** | `Lab AI Tools` |
| **ADO Team** | `Lab AI Tools Team` (default) |
| **Area Path** | `Lab AI Tools\NextSteps` *(create if missing; board confirm)* |
| **Iteration root** | `Lab AI Tools\Sprint N` (Mon–Fri; anchor 2026-05-19 = Sprint 1) |
| **Current iteration** | `Lab AI Tools\Sprint 2` (2026-05-26 → 2026-05-30) |
| **Board assignee** | `Sakthi Alagappan` (`2000147951@hexaware.com`) |
| **Process template** | Agile (Feature → User Story → Task / Bug) |
| **Traceability tag** | `nextsteps` on all created items |
| **Description line** | `Paperclip: {identifier}` + issue URL |

### Delivery plan target

| Option | Recommendation |
|--------|----------------|
| **A — Extend Mimir Delivery Plan** | Add NextSteps Feature cards under existing [Mimir Delivery Plan](https://dev.azure.com/Innovation-Lab-Pipelines/Lab%20AI%20Tools/_deliveryplans/plan/96deb8f6-a004-4ca3-a6b0-b824cc877632) with `Area Path = Lab AI Tools\NextSteps` filter |
| **B — Dedicated plan** | Create **NextSteps Delivery Plan** if board wants isolation from Mimir semver rows |

**Default:** Option A unless CEO directs separate plan (lower ops overhead; same Sprint N ladder).

---

## 3. Version ladder & Friday targets

Product handoff maps **7 semver Features** (P0–P6 → v0.1.0–v0.7.0). Friday `TargetDate` on each Feature; card subtitle `Friday release milestone — v{semver}`.

| # | Phase | Feature title | Semver | Target Friday | Primary Sprint | Paperclip |
|---|-------|---------------|--------|---------------|----------------|-----------|
| 1 | P0 | NextSteps Release 0.1.0 — MERN Foundation | 0.1.0 | **2026-05-30** | Sprint 2 | ALSAA-12 ✓ |
| 2 | P1 | NextSteps Release 0.2.0 — Maverick Mission HQ | 0.2.0 | 2026-06-06 | Sprint 3 | ALSAA-13 |
| 3 | P2 | NextSteps Release 0.3.0 — Trainer Pulse | 0.3.0 | 2026-06-13 | Sprint 4 | ALSAA-14 |
| 4 | P3 | NextSteps Release 0.4.0 — L&D Intelligence | 0.4.0 | 2026-06-20 | Sprint 5 | ALSAA-15 |
| 5 | P4 | NextSteps Release 0.5.0 — Session Intelligence | 0.5.0 | 2026-06-27 | Sprint 6 | ALSAA-16 |
| 6 | P5 | NextSteps Release 0.6.0 — Deployment Bridge | 0.6.0 | 2026-07-04 | Sprint 7 | ALSAA-17 |
| 7 | P6 | NextSteps Release 0.7.0 — Gamification | 0.7.0 | 2026-07-11 | Sprint 8 | ALSAA-18 |

**Note:** P0 (ALSAA-12) completed 2026-05-29 during Sprint 2; v0.1.0 Feature should land **Closed** or **Resolved** on first ADO sync with `TargetDate = 2026-05-30`.

---

## 4. Hierarchy model

```
Epic (optional) — "NextSteps Maverick Experience Platform"
└── Feature — NextSteps Release {semver} — {theme}
    └── User Story — mirrors Paperclip phase issue (ALSAA-1x)
        └── Task — engineering decomposition (created by IC agents; SM links)
            └── Bug — QA/security (SM files; eng fixes via child issues)
```

### User Story field defaults (per phase)

| Field | Value |
|-------|-------|
| `System.Title` | Same as Paperclip title (e.g. `NextSteps P1: Maverick pre-deploy auth + dashboard + passport`) |
| `System.State` | Map from Paperclip: `done`→`Closed`, `in_progress`→`Active`, `blocked`→`Active` + blocker comment |
| `System.IterationPath` | Sprint containing target Friday (table §3) |
| `Microsoft.VSTS.Common.AcceptanceCriteria` | Copy from Paperclip description **Acceptance** section |
| `System.Tags` | `nextsteps; paperclip` |
| Parent link | `System.LinkTypes.Hierarchy-Reverse` → parent Feature |

### Definition of Ready (committed stories)

Before iteration commit per POU-46:

- ≥1 child **Task**
- Non-empty **Acceptance Criteria**
- Paperclip link in description

SM runs WIQL hygiene scan after initial mirror.

---

## 5. Paperclip → ADO story map

| Paperclip | Phase | ADO User Story title | Parent Feature | Story state (Paperclip) |
|-----------|-------|----------------------|----------------|-------------------------|
| ALSAA-12 | P0 | NextSteps P0: MERN monorepo scaffold (web + api + worker) | 0.1.0 | done |
| ALSAA-13 | P1 | NextSteps P1: Maverick pre-deploy auth + dashboard + passport | 0.2.0 | blocked |
| ALSAA-14 | P2 | NextSteps P2: Trainer session logger + pulse feedback pipeline | 0.3.0 | in_progress |
| ALSAA-15 | P3 | NextSteps P3: L&D batch segregation + document parse jobs | 0.4.0 | done |
| ALSAA-16 | P4 | NextSteps P4: Google Meet transcript + sentiment jobs | 0.5.0 | in_progress |
| ALSAA-17 | P5 | NextSteps P5: Manager reviews + deployment auth migration | 0.6.0 | in_progress |
| ALSAA-18 | P6 | NextSteps P6: Gamification leaderboard cache + badge rules | 0.7.0 | done |

**Discovery artifacts (no Feature parent):** ALSAA-7/8/9 remain Paperclip-only unless board requests ADO User Stories under a **Discovery** Feature — **out of scope** for this ladder unless CEO adds.

---

## 6. Implementation steps (post-approval heartbeat)

Execute in order; idempotent read-before-create.

### Step 1 — Preconditions

- [ ] Confirm ADO MCP `ado-official` auth (401/403 → block, escalate board)
- [ ] Verify `Lab AI Tools\NextSteps` area exists; create if absent
- [ ] Confirm Sprint 2 is team current iteration; note rollover to Sprint 3 on 2026-05-31 UTC

### Step 2 — Create Features (7)

For each row in §3:

1. Search ADO: `[System.TeamProject] = 'Lab AI Tools' AND [System.WorkItemType] = 'Feature' AND [System.Title] CONTAINS 'NextSteps Release'`
2. Create if missing:
   - Title: `NextSteps Release {semver} — {theme}`
   - `Microsoft.VSTS.Scheduling.TargetDate`: Friday from table
   - `System.AreaPath`: `Lab AI Tools\NextSteps`
   - `System.IterationPath`: matching Sprint N
   - Description: changelog bullets from issue + `Paperclip: ALSAA-11`
3. Comment each id on ALSAA-11 with ADO URL

### Step 3 — Create / link User Stories (7)

For ALSAA-12…18:

1. Search by `Paperclip: ALSAA-{n}` in description
2. Create User Story if missing; set AC from Paperclip
3. Link parent → Feature (§5)
4. Patch iteration + state from §5
5. Back-link: comment on Paperclip issue with ADO id + URL

### Step 4 — Delivery plan cards

- Add/update cards on chosen plan (§2)
- Card title = Feature title; child stories roll up
- Verify hierarchy read-back matches ADO

### Step 5 — Routing matrix

Update canonical `docs/ado-routing-matrix.md` (SM workspace + NextSteps workspace copy):

- NextSteps row in Paperclip → ADO table
- Standing mirror: ALSAA-12…18 ↔ ADO story ids (populate after create)
- Sprint N ladder reference
- WIQL snippets for open NextSteps work

### Step 6 — Wiki (POU-79)

Append to ADO Wiki **Changelog**:

- Discovery complete; platform spec v1.1.0
- Feature ladder 0.1.0–0.7.0 created
- Four roles; Mentor omitted

### Step 7 — Read-back & close

Post table on ALSAA-11:

| Feature | ADO ID | URL | Child stories | States |
|---------|--------|-----|---------------|--------|

Mark ALSAA-11 **done** when read-back matches §5 and delivery plan cards exist.

---

## 7. Child issue (delegated execution)

After plan approval, SM creates:

**Title:** `NextSteps: Execute ADO Feature ladder mirror (ALSAA-11 implementation)`  
**Owner:** Scrum Master  
**Blocked by:** ALSAA-11 plan approval  
**Acceptance:** §6 complete with read-back table

IC agents **do not** create board items; they comment on Paperclip with `{identifier}` when needing SM linkage.

---

## 8. Risks & blockers

| Risk | Mitigation | Owner |
|------|------------|-------|
| ADO auth failure | Block implementation; escalate board for PAT/service connection | Board |
| `Lab AI Tools\NextSteps` area missing | Create via ADO project settings or SM area API | SM |
| Paperclip/ADO state drift (e.g. ALSAA-13 blocked) | Mirror state + comment; do not auto-close blocked stories | SM |
| Shared Mimir delivery plan clutter | Filter by Area Path; or CEO picks Option B | CEO |
| Sprint rollover mid-execution | Re-read Sprint N from matrix before iteration patches | SM |

---

## 9. Acceptance criteria (ALSAA-11 planning)

- [x] Plan document published on ALSAA-11 (`plan` key)
- [x] Version ladder 0.1.0–0.7.0 with Friday dates and Sprint mapping
- [x] Paperclip ALSAA-12…18 → Feature/Story map
- [x] Implementation steps for post-approval ADO execution
- [x] Routing matrix update specified
- [ ] CEO/board approval via `request_confirmation` *(pending)*

---

## 10. References

- `docs/nextsteps-maverick-platform-spec.md` §7.6 build phasing
- ALSAA-1 plan revision `de3e5fa9` (NEXUS pipeline)
- Org: POU-25, POU-62, POU-64, POU-73, POU-79
- [Mimir Delivery Plan](https://dev.azure.com/Innovation-Lab-Pipelines/Lab%20AI%20Tools/_deliveryplans/plan/96deb8f6-a004-4ca3-a6b0-b824cc877632)
