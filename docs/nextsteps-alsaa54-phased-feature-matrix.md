# NextSteps ALSAA-54 — Phased Feature Matrix

| Field | Value |
|-------|-------|
| **Document ID** | `nextsteps-alsaa54-phased-feature-matrix` |
| **Version** | 1.0.0 |
| **Status** | Strategy complete — unblocks [ALSAA-57](/ALSAA/issues/ALSAA-57) |
| **Author** | VP of Product |
| **Issue** | [ALSAA-55](/ALSAA/issues/ALSAA-55) |
| **Parent** | [ALSAA-54](/ALSAA/issues/ALSAA-54) |
| **Inputs** | `docs/nextsteps-master-prompt.txt`, [ALSAA-10](/ALSAA/issues/ALSAA-10), `docs/nextsteps-maverick-platform-spec.md` v1.1.0 |
| **Build tracks** | [ALSAA-12](/ALSAA/issues/ALSAA-12)–[ALSAA-18](/ALSAA/issues/ALSAA-18) |

---

## 1. Executive summary

Every module in the consolidated master prompt is traced to a **build phase (P0–P7)**, **owning agent**, and **Paperclip issue** (or an explicit **GAP** with recommended owner). This matrix is the execution contract for [ALSAA-57](/ALSAA/issues/ALSAA-57) — engineering orchestration must not re-litigate scope.

**Coverage:** 62 modules mapped · 54 issue-linked · 8 gaps flagged (P7 analytics + cross-cutting hardening).

**Phase status snapshot (2026-05-31, CoS monitor):**

| Phase | Issue | Status |
|-------|-------|--------|
| P0 | [ALSAA-12](/ALSAA/issues/ALSAA-12) | done |
| P1 | [ALSAA-13](/ALSAA/issues/ALSAA-13) | done |
| P2 | [ALSAA-14](/ALSAA/issues/ALSAA-14) | in_progress |
| P3 | [ALSAA-15](/ALSAA/issues/ALSAA-15) | done |
| P4 | [ALSAA-16](/ALSAA/issues/ALSAA-16) | in_progress |
| P5 | [ALSAA-17](/ALSAA/issues/ALSAA-17) | in_progress |
| P6 | [ALSAA-18](/ALSAA/issues/ALSAA-18) | done |
| P7 | [ALSAA-62](/ALSAA/issues/ALSAA-62) | done |
| Harden | [ALSAA-61](/ALSAA/issues/ALSAA-61) | done |
| Welcome/theme | [ALSAA-56](/ALSAA/issues/ALSAA-56) | done |

**Epic waves (ALSAA-54 orchestration):**

| Wave | Issues | Status |
|------|--------|--------|
| Wave 1 | [ALSAA-58](/ALSAA/issues/ALSAA-58), [ALSAA-59](/ALSAA/issues/ALSAA-59) | done |
| Wave 2 | [ALSAA-61](/ALSAA/issues/ALSAA-61), [ALSAA-62](/ALSAA/issues/ALSAA-62) | **done** |
| Orchestration | [ALSAA-57](/ALSAA/issues/ALSAA-57) | in_progress |
| Monitor | [ALSAA-63](/ALSAA/issues/ALSAA-63) | in_progress |

**Epic exit:** matrix fully evidenced + [ALSAA-57](/ALSAA/issues/ALSAA-57) closed. **Remaining critical path:** P2/P4/P5 ([ALSAA-14](/ALSAA/issues/ALSAA-14), [ALSAA-16](/ALSAA/issues/ALSAA-16), [ALSAA-17](/ALSAA/issues/ALSAA-17)) — last updated 2026-05-29; VP Engineering hygiene needed.

---

## 2. Phase map (master prompt §18 → build issues)

| Phase | Master prompt scope | Epic(s) | Primary issue | Owner |
|-------|---------------------|---------|---------------|-------|
| **P0** | Monorepo, MongoDB, JWT auth shell, magic link + SSO stubs, role routing | E-01, E-02, E-03 | [ALSAA-12](/ALSAA/issues/ALSAA-12) | VP Engineering |
| **P1** | Maverick pre-deploy auth, welcome journey, Mission HQ, passport | E-03, E-04 | [ALSAA-13](/ALSAA/issues/ALSAA-13) | VP Engineering |
| **P2** | Trainer session logger, pulse feedback, live pulse board | E-05 | [ALSAA-14](/ALSAA/issues/ALSAA-14) | VP Engineering |
| **P3** | L&D batch composer, document upload, AI parse, segregation | E-06 | [ALSAA-15](/ALSAA/issues/ALSAA-15) | VP Engineering |
| **P4** | Meet/Teams transcript, sentiment, confusion jobs | E-07 | [ALSAA-16](/ALSAA/issues/ALSAA-16) | VP Engineering |
| **P5** | Manager reviews, deployment auth migration, effectiveness loop | E-08, E-02 | [ALSAA-17](/ALSAA/issues/ALSAA-17) | VP Engineering |
| **P6** | Gamification leaderboard, badge rules, level progression | E-09 | [ALSAA-18](/ALSAA/issues/ALSAA-18) | VP Engineering |
| **P7** | Executive reports, curriculum copilot (full), top performer ID | — | **GAP → ALSAA-57** | VP Engineering |
| **Harden** | Privacy, RBAC, audit, retention (spec §6) | E-10 | **GAP → ALSAA-57** | CTO + Security |
| **Cross** | Metaverse welcome + theme story | E-03 | [ALSAA-56](/ALSAA/issues/ALSAA-56) | Creative Director |

---

## 3. Cross-cutting platform modules

| Module | Phase | Owner | Issue | Acceptance criteria |
|--------|:-----:|-------|-------|---------------------|
| MERN monorepo (`web` + `api` + `worker`) | P0 | VP Engineering | [ALSAA-12](/ALSAA/issues/ALSAA-12) | `GET /api/v1/health` → 200; worker processes test job; CI green |
| MongoDB + Redis/BullMQ shell | P0 | VP Engineering | [ALSAA-12](/ALSAA/issues/ALSAA-12) | Local stack runs; collections bootstrap documented |
| JWT + four-role RBAC middleware | P0–P5 | VP Engineering | [ALSAA-12](/ALSAA/issues/ALSAA-12), [ALSAA-17](/ALSAA/issues/ALSAA-17) | Wrong-role routes return 403; claims match spec §2.7 |
| Maverick Gmail Magic Link OTP | P0–P1 | VP Engineering | [ALSAA-12](/ALSAA/issues/ALSAA-12), [ALSAA-13](/ALSAA/issues/ALSAA-13) | Magic link verify → JWT; pre-deploy `authMode=magic_link` |
| Trainer vendor Magic Link OTP | P0–P2 | VP Engineering | [ALSAA-12](/ALSAA/issues/ALSAA-12), [ALSAA-14](/ALSAA/issues/ALSAA-14) | Trainer login via vendor email; batch-scoped access only |
| L&D + Manager Hexaware SSO | P0–P5 | VP Engineering | [ALSAA-12](/ALSAA/issues/ALSAA-12), [ALSAA-17](/ALSAA/issues/ALSAA-17) | SSO stub/callback; role resolution from AD profile |
| Deployment SSO cutover (`auth-provider-migrate`) | P5 | VP Engineering | [ALSAA-17](/ALSAA/issues/ALSAA-17), [ALSAA-32](/ALSAA/issues/ALSAA-32) | Webhook flips `authMode`; same `userId`; XP/history preserved |
| Auth migration security gate | P5 | Security Architect | [ALSAA-33](/ALSAA/issues/ALSAA-33) | Threat model + Vigolium sign-off before P5 exit |
| 60-30-10 design tokens + Tailwind layer | P0–P1 | Creative Director | [ALSAA-56](/ALSAA/issues/ALSAA-56), [ALSAA-13](/ALSAA/issues/ALSAA-13) | Tokens match spec §5.1; WCAG AA on login grid |
| R3F lanyard + login role preview | P0–P1 | Creative Director | [ALSAA-56](/ALSAA/issues/ALSAA-56), [ALSAA-13](/ALSAA/issues/ALSAA-13) | Lanyard renders per role on login; no Mentor tile |
| Mentor role removal (all surfaces) | P0–P1 | Creative Director | [ALSAA-56](/ALSAA/issues/ALSAA-56), [ALSAA-13](/ALSAA/issues/ALSAA-13) | Zero Mentor routes, APIs, nav, copy |
| WebSocket live Trainer pulse board | P2 | VP Engineering | [ALSAA-14](/ALSAA/issues/ALSAA-14) | Post-session pulse pushes batch aggregates in real time |
| Background job registry (spec §14) | P0–P4 | VP Engineering | [ALSAA-12](/ALSAA/issues/ALSAA-12)–[ALSAA-16](/ALSAA/issues/ALSAA-16) | All listed jobs registered with idempotent handlers |
| Privacy / RBAC hardening (spec §6) | Harden | CTO | **GAP** | Audit logs on sensitive reads; k-anonymity enforced; retention jobs |
| Notification / comms integration | P2–P3 | VP Engineering | [ALSAA-14](/ALSAA/issues/ALSAA-14), **GAP (reminder engine)** | Email/SMS stubs for reminders; 3-tier engine see §7 |

---

## 4. Maverick modules (master prompt §8.1)

| Module | Journey phase | Build phase | Owner | Issue | Acceptance criteria |
|--------|:-------------:|:-----------:|-------|-------|---------------------|
| Welcome Journey (onboarding wizard) | Ph 0 | P1 + theme | Creative Director | [ALSAA-56](/ALSAA/issues/ALSAA-56), [ALSAA-13](/ALSAA/issues/ALSAA-13) | See §6 Welcome/onboarding AC |
| Mission HQ Dashboard | Ph 0–4 | P1 | VP Engineering | [ALSAA-13](/ALSAA/issues/ALSAA-13) | Dashboard loads from API: phase ring, XP bar, missions, session preview |
| Maverick Passport (R3F lanyard) | Ph 0–5 | P1 | VP Engineering | [ALSAA-13](/ALSAA/issues/ALSAA-13) | Passport shows XP, skills, badges, readiness from MongoDB; PDF export stub |
| Pulse Feedback (30 sec) | Ph 1–2 | P2 | VP Engineering | [ALSAA-14](/ALSAA/issues/ALSAA-14), [ALSAA-26](/ALSAA/issues/ALSAA-26) | 3-question submit; 30 XP credit; auto-close 2h post-session |
| Deep Feedback (8 Q, 24hr) | Ph 1–4 | P2 | VP Engineering | [ALSAA-14](/ALSAA/issues/ALSAA-14) | 8-question form; 80 XP; phase-scoped availability |
| Skill Tree | Ph 2–3 | P1 | VP Engineering | [ALSAA-13](/ALSAA/issues/ALSAA-13) | Locked/unlocked nodes from profile skills; API-backed state |
| AI Stream Recommender | Ph 2–3 | P3 | VP Engineering | [ALSAA-15](/ALSAA/issues/ALSAA-15) | Stream fit scores for 8 domains after Phase 2 completion |
| AI Learning Buddy | Ph 1–4 | P3+ defer | AI Engineer | **GAP (post-P3)** | Phase-scoped chat; 30 queries/day; rate-limited `/ai/buddy` |
| Leaderboard & Badges (Maverick view) | Ph 1–4 | P6 | VP Engineering | [ALSAA-18](/ALSAA/issues/ALSAA-18) | Opt-in batch leaderboard; badge wall from API |
| Phase Path / Timeline | Ph 0–4 | P1 | VP Engineering | [ALSAA-13](/ALSAA/issues/ALSAA-13) | Gantt-style timeline from sessions + phase config |
| Session Transcript (self-study) | Ph 1–4 | P4 | VP Engineering | [ALSAA-16](/ALSAA/issues/ALSAA-16), [ALSAA-23](/ALSAA/issues/ALSAA-23) | Own transcript summary only; RBAC blocks other users |
| QR Attendance | Ph 1–4 | P2 | VP Engineering | [ALSAA-14](/ALSAA/issues/ALSAA-14) | QR scan → attendance record → 50 XP |
| Peer Feedback | Ph 1–2 | P6 | VP Engineering | [ALSAA-18](/ALSAA/issues/ALSAA-18) | Post-group activity submit; 40 XP |
| Status Visibility | Ph 0–5 | P5 | VP Engineering | [ALSAA-17](/ALSAA/issues/ALSAA-17) | Maverick sees active / at-risk / converted / let-down |
| Resume + cert upload (onboarding) | Ph 0 | P3 | VP Engineering | [ALSAA-15](/ALSAA/issues/ALSAA-15) | Upload → encrypted storage → parse job enqueued |
| Daily missions | Ph 1–4 | P6 | VP Engineering | [ALSAA-18](/ALSAA/issues/ALSAA-18) | 3 personalized missions/day from weak-area stub |
| Onboarding Token + PIN setup | Ph 0 | P1 | VP Engineering | [ALSAA-13](/ALSAA/issues/ALSAA-13) | L&D CSV invite → magic link → PIN → profile activated |

---

## 5. Trainer modules (master prompt §8.2)

| Module | Build phase | Owner | Issue | Acceptance criteria |
|--------|:-----------:|-------|-------|---------------------|
| Session Logger | P2 | VP Engineering | [ALSAA-14](/ALSAA/issues/ALSAA-14), [ALSAA-26](/ALSAA/issues/ALSAA-26), [ALSAA-27](/ALSAA/issues/ALSAA-27) | CRUD sessions; QR gen; Meet link field; timer |
| Live Batch Pulse Board | P2 | VP Engineering | [ALSAA-14](/ALSAA/issues/ALSAA-14), [ALSAA-27](/ALSAA/issues/ALSAA-27) | Real-time mood/clarity/pace aggregates; no named rows when n<5 |
| Session Transcript + Insights | P4 | VP Engineering | [ALSAA-16](/ALSAA/issues/ALSAA-16), [ALSAA-23](/ALSAA/issues/ALSAA-23) | Batch confusion timestamps; no individual attribution |
| Struggling Maverick Alerts | P2–P4 | VP Engineering | [ALSAA-14](/ALSAA/issues/ALSAA-14), [ALSAA-22](/ALSAA/issues/ALSAA-22) | Threshold alert → Trainer note → escalate to L&D only |
| My Session Analytics | P2 | VP Engineering | [ALSAA-14](/ALSAA/issues/ALSAA-14) | Per-trainer clarity trends; feedback completion % |
| Assessment Publisher (CodePen) | P2 | VP Engineering | [ALSAA-14](/ALSAA/issues/ALSAA-14) | MCQ + CodePen embed; auto-grade; feeds readiness |
| Attendance & Completion Tracker | P2 | VP Engineering | [ALSAA-14](/ALSAA/issues/ALSAA-14) | Live table; one-click reminder to non-responders |
| Trainer gamification (Top Trainer badge) | P6 | VP Engineering | [ALSAA-18](/ALSAA/issues/ALSAA-18) | Session quality score; badge at 3-session threshold |

---

## 6. Welcome & onboarding — Creative Director handoff AC

**Owner:** [Creative Director](agent://c4aa7a2e-ca2b-4dde-b0cc-1b6a237fd34c) via [ALSAA-56](/ALSAA/issues/ALSAA-56)  
**Engineering consumer:** [ALSAA-13](/ALSAA/issues/ALSAA-13) welcome wizard routes

### 6.1 Story beats (first-run Maverick)

| Step | Beat | Visual / motion | Exit state |
|:----:|------|-----------------|------------|
| 1 | **Arrival** — "Welcome to Hexaware — your training journey starts here" | Hyperspeed/parallax hero; role lanyard teaser animates in | `onboardingStep=arrival` |
| 2 | **Identity** — Profile bootstrap (name, avatar seed, GET/PGET band) | DiceBear avatar preview; 60-30-10 card stack | Profile draft saved |
| 3 | **Credentials** — Resume + cert upload prompt | Document drop zone; progress ring | Upload queued (P3 API) |
| 4 | **Reveal** — Full R3F lanyard unveil | Lanyard spin + XP bar at 0; rank "Spark Initiate" | `lanyardRevealed=true` |
| 5 | **Roadmap** — Phase 0–4 timeline preview | Phase path scroll; deployment date estimate | Timeline viewed |
| 6 | **Cohort** — Batch assignment confirmation | Batch name + trainer intro card | Batch acknowledged |
| 7 | **First mission** — Daily mission #1 surfaced | Mission card CTA → Mission HQ | `onboardingComplete=true` |

### 6.2 Role-specific welcome variants

| Role | First-run experience | Must NOT include |
|------|---------------------|------------------|
| Maverick | Full 7-step wizard above | Mentor references |
| Trainer | Vendor welcome + assigned batches list | Hexaware SSO path |
| L&D Executive | Ops Command Centre tour (3 hotspots) | Individual Maverick surveillance UI |
| Manager | Empty state → "Awaiting deployed Mavericks" | Transcript access |

### 6.3 Theme deliverables (ALSAA-56)

- [ ] Narrative one-pager: **Maverick Nebula** mission framing (GET vs PGET track copy)
- [ ] Motion token notes: parallax intensity, R3F lanyard timing, reduced-motion fallbacks
- [ ] Sign-in splash copy + animation spec per role (post-auth, pre-dashboard)
- [ ] Login split-auth layout: Maverick / Trainer / Hexaware employee paths
- [ ] Deployment badge visual spec (Phase 5 lanyard state change only)

### 6.4 Engineering acceptance (blocks P1 welcome exit)

- [ ] Wizard state persisted in `maverick_profiles.onboarding` — resumable across sessions
- [ ] Skip logic: returning users bypass wizard; deployment re-login shows SSO banner only
- [ ] All copy uses canonical role names (L&D Executive, Manager — never legacy labels)
- [ ] Lighthouse accessibility: login + wizard keyboard-navigable; reduced-motion respected

---

## 7. L&D Executive modules (master prompt §8.3)

| Module | Build phase | Owner | Issue | Acceptance criteria |
|--------|:-----------:|-------|-------|---------------------|
| Unified Ops Dashboard | P3 | VP Engineering | [ALSAA-15](/ALSAA/issues/ALSAA-15) | Active batches, phases, RAG health, feedback % |
| AI Batch Segregation Engine | P3 | VP Engineering | [ALSAA-15](/ALSAA/issues/ALSAA-15) | AI proposal + rationale; L&D approve/adjust one screen |
| Resume & Certificate Parser | P3 | VP Engineering | [ALSAA-15](/ALSAA/issues/ALSAA-15) | `parse-resume` job → skill profile on Maverick |
| Batch Composer | P3 | VP Engineering | [ALSAA-15](/ALSAA/issues/ALSAA-15) | CSV upload + AI groupings + publish workflow |
| Batch Lifecycle Manager | P3–P5 | VP Engineering | [ALSAA-15](/ALSAA/issues/ALSAA-15), [ALSAA-17](/ALSAA/issues/ALSAA-17) | Create batches; assign trainers; conversion/let-down triggers |
| Feedback Completion Engine (3-tier) | P2–P3 | VP Engineering | **GAP → [ALSAA-57](/ALSAA/issues/ALSAA-57)** | Day 0/1/2 reminders; live % dashboard; 90% batch XP bonus |
| Session Transcript Intelligence (cross-batch) | P4 | VP Engineering | [ALSAA-16](/ALSAA/issues/ALSAA-16) | Topic coverage gaps; trainer quality signal |
| Curriculum Copilot (full) | P7 | VP Engineering | **GAP → [ALSAA-57](/ALSAA/issues/ALSAA-57)** | Cross-batch trend synthesis; ranked recs with confidence % |
| Training Effectiveness Loop | P5 | VP Engineering | [ALSAA-17](/ALSAA/issues/ALSAA-17) | Manager ratings linked back to training modules |
| Batch Cohort Comparison | P7 | VP Engineering | **GAP → [ALSAA-57](/ALSAA/issues/ALSAA-57)** | Side-by-side batch metrics + auto insights |
| Top Performer Identifier | P7 | VP Engineering | **GAP → [ALSAA-57](/ALSAA/issues/ALSAA-57)** | Top 10% composite; SONIC/STRIDE nomination flag |
| Executive Report Generator | P7 | VP Engineering | **GAP → [ALSAA-57](/ALSAA/issues/ALSAA-57)** | One-click PDF/Excel + AI narrative paragraphs |
| L&D gamification (Data Champion badge) | P6 | VP Engineering | [ALSAA-18](/ALSAA/issues/ALSAA-18) | Badge at 80%+ feedback completion |
| Session Logger (L&D read) | P2 | VP Engineering | [ALSAA-14](/ALSAA/issues/ALSAA-14) | Read-only session list across batches |

---

## 8. Manager modules (master prompt §8.4)

| Module | Build phase | Owner | Issue | Acceptance criteria |
|--------|:-----------:|-------|-------|---------------------|
| My Mavericks View | P5 | VP Engineering | [ALSAA-17](/ALSAA/issues/ALSAA-17) | Roster with readiness, stream, M1/M3/M6 due dates |
| Maverick Passport View (read-only) | P5 | VP Engineering | [ALSAA-17](/ALSAA/issues/ALSAA-17) | Read-only passport; no edit controls |
| Structured Performance Review | P5 | VP Engineering | [ALSAA-17](/ALSAA/issues/ALSAA-17) | M1/M3/M6 CRUD; 5 dimensions rated 1–5 |
| Early Performance Alert | P5 | VP Engineering | [ALSAA-17](/ALSAA/issues/ALSAA-17) | Underperform flag → L&D notification + program rec |

---

## 9. AI & gamification engine (master prompt §11–12)

| Capability | Build phase | Owner | Issue | Acceptance criteria |
|------------|:-----------:|-------|-------|---------------------|
| XP ledger + level progression (Lv 1–7) | P6 | VP Engineering | [ALSAA-18](/ALSAA/issues/ALSAA-18) | XP events per spec table; ranks unlock features |
| Badge rules engine | P6 | VP Engineering | [ALSAA-18](/ALSAA/issues/ALSAA-18) | All spec badges award on criteria match |
| Streak tracking (7-day bonus) | P6 | VP Engineering | [ALSAA-18](/ALSAA/issues/ALSAA-18) | Streak break/resume; 200 XP bonus at 7 days |
| `compute-leaderboard` job | P6 | VP Engineering | [ALSAA-18](/ALSAA/issues/ALSAA-18) | Nightly cache refresh; opt-in privacy |
| Readiness Score composite | P2–P6 | VP Engineering | [ALSAA-14](/ALSAA/issues/ALSAA-14), [ALSAA-18](/ALSAA/issues/ALSAA-18) | 0–100 on passport from attendance+quiz+feedback+peer |
| Sentiment analysis (pulse text) | P4 | VP Engineering | [ALSAA-22](/ALSAA/issues/ALSAA-22) | Theme cloud; batch-only output |
| Confusion spike detection | P4 | VP Engineering | [ALSAA-22](/ALSAA/issues/ALSAA-22) | Timestamps correlated with low clarity |
| Early warning / anomaly detector | P2–P4 | VP Engineering | [ALSAA-14](/ALSAA/issues/ALSAA-14), [ALSAA-22](/ALSAA/issues/ALSAA-22) | 2-week trajectory flag |
| AI Batch Segregation ML | P3 | AI Engineer | [ALSAA-15](/ALSAA/issues/ALSAA-15) | Skill-to-stream mapping + grouping rationale |
| Mission Generator (daily) | P6 | AI Engineer | [ALSAA-18](/ALSAA/issues/ALSAA-18) | 3 missions from weak-area signals |
| Smart reminder timing | P7 | Behavioral Nudge Engine | **GAP → [ALSAA-57](/ALSAA/issues/ALSAA-57)** | Optimal send-time from engagement history |
| Executive report narrative | P7 | AI Engineer | **GAP → [ALSAA-57](/ALSAA/issues/ALSAA-57)** | Plain-English batch summary paragraphs |

---

## 10. Lifecycle & batch operations (master prompt §13)

| Workflow | Build phase | Owner | Issue | Acceptance criteria |
|----------|:-----------:|-------|-------|---------------------|
| Invited → active_training | P1 | VP Engineering | [ALSAA-13](/ALSAA/issues/ALSAA-13) | Onboarding token → activated profile |
| Batch segregation proposal → publish | P3 | VP Engineering | [ALSAA-15](/ALSAA/issues/ALSAA-15) | L&D approve → Mavericks notified |
| Mid-program batch separation | P3 | VP Engineering | [ALSAA-15](/ALSAA/issues/ALSAA-15) | Reassign Mavericks; history preserved |
| Conversion → Hex ID activation | P5 | VP Engineering | [ALSAA-17](/ALSAA/issues/ALSAA-17), [ALSAA-32](/ALSAA/issues/ALSAA-32) | SSO link; deployment badge on lanyard |
| Let-down + LOI revocation | P5 | VP Engineering | [ALSAA-17](/ALSAA/issues/ALSAA-17) | Access revoke; exit workflow logged |
| Pulse feedback cycle | P2 | VP Engineering | [ALSAA-14](/ALSAA/issues/ALSAA-14) | Post-session prompt → aggregate view |
| Deep feedback cycle | P2 | VP Engineering | [ALSAA-14](/ALSAA/issues/ALSAA-14) | Post-phase form → L&D effectiveness linkage |
| Manager performance review (M1/M3/M6) | P5 | VP Engineering | [ALSAA-17](/ALSAA/issues/ALSAA-17) | Structured review stored; L&D read linkage |

---

## 11. Gap register (explicit — owner assigned)

| Gap ID | Module | Recommended phase | Owner | Action |
|--------|--------|:-----------------:|-------|--------|
| G-01 | Feedback Completion Engine (3-tier reminders) | P2–P3 | VP Engineering | Child issue under [ALSAA-57](/ALSAA/issues/ALSAA-57) |
| G-02 | AI Learning Buddy | P3+ | AI Engineer | Child issue after [ALSAA-15](/ALSAA/issues/ALSAA-15) stable |
| G-03 | Curriculum Copilot (full) | P7 | VP Engineering | New track issue ALSAA-58 (proposed) |
| G-04 | Batch Cohort Comparison | P7 | VP Engineering | Bundle with G-03/G-05 |
| G-05 | Top Performer Identifier | P7 | VP Engineering | Bundle with G-03/G-04 |
| G-06 | Executive Report Generator | P7 | VP Engineering | Bundle with G-03 |
| G-07 | Smart Reminder Timing ML | P7 | Behavioral Nudge Engine | Bundle with G-01 |
| G-08 | Privacy/RBAC Hardening (E-10) | Harden | CTO | Parallel from P2; gate production pilot |

**No duplicate scope:** G-01 through G-08 are net-new beyond [ALSAA-12](/ALSAA/issues/ALSAA-12)–[ALSAA-18](/ALSAA/issues/ALSAA-18). [ALSAA-57](/ALSAA/issues/ALSAA-57) owns gap decomposition into child issues.

---

## 12. Verification checklist (ALSAA-55 acceptance)

- [x] Every master-prompt §8 feature row mapped to phase + owner + issue or GAP
- [x] Cross-cutting auth, jobs, privacy traced
- [x] Welcome/onboarding AC documented for Creative Director ([ALSAA-56](/ALSAA/issues/ALSAA-56))
- [x] 8 gaps flagged with named owners — no orphan modules
- [x] Parent [ALSAA-54](/ALSAA/issues/ALSAA-54) notified via issue comment
- [x] Matrix unblocks [ALSAA-57](/ALSAA/issues/ALSAA-57) orchestration

---

## 13. References

- Master prompt: `docs/nextsteps-master-prompt.txt`
- Platform spec: `docs/nextsteps-maverick-platform-spec.md`
- Epic roadmap: `docs/nextsteps-nexus-strategy-epic-roadmap.md` ([ALSAA-10](/ALSAA/issues/ALSAA-10))
- UI spec: `docs/design/metaverse-ui-ux-specification.md` ([ALSAA-9](/ALSAA/issues/ALSAA-9))
- Orchestration: [ALSAA-57](/ALSAA/issues/ALSAA-57)
- Theme handoff: [ALSAA-56](/ALSAA/issues/ALSAA-56)
