# NextSteps Maverick Experience Platform — Metaverse UI/UX Specification (v1)

**Document owner:** Creative Director, Local Lab  
**Audience:** VP of Product (Section 5 ingestion), Engineering handoff  
**Status:** Draft v1 — ready for consolidation into ALSAA-4 system spec  
**Last updated:** 2026-05-29

---

## 1. Design vision

NextSteps is a **story-driven metaverse campus** for Hexaware Mavericks (GETs/PGETs). The interface should feel like stepping into a mission control for your career—not a corporate LMS. Whimsy is intentional: parallax depth, physics-based lanyard badges, XP streaks, and Hyperspeed-style motion reinforce progress without sacrificing clarity.

**North-star feeling:** *“I’m on a quest, and the platform knows where I am in the story.”*

### Role naming (canonical UI copy)

| Canonical role | Internal route key | Login label | Notes |
|----------------|-------------------|-------------|-------|
| **Maverick** | `maverick` | Maverick | GET/PGET trainee |
| **Trainer** | `trainer` | Trainer | Session delivery SME |
| **L&D Executive** | `ld` | L&D Executive | Curriculum owner (replace legacy “L&D Manager”) |
| **Manager** | `supervisor` | Manager | On-project manager post-deployment |

> **Hard constraint:** The **Mentor** role is **omitted entirely**—no login tile, routes, nav items, copy, or empty states. Legacy code references must be removed during revamp.

---

## 2. Global design language

### 2.1 60-30-10 color system

The triad maps to a disciplined 60-30-10 application across every screen:

| Layer | Share | Tokens | Usage |
|-------|-------|--------|-------|
| **60% — Base neutrals** | ~60% of visible pixels | `--base-bg`, `--base-card`, `--base-surface`, `--base-text`, `--base-border` | Page backgrounds, card surfaces, body copy, borders |
| **30% — Secondary brand tints** | ~30% | `--secondary-lavender`, `--secondary-sky`, `--secondary-peach`, `--gradient-sidebar` | Sidebar chrome, section headers, soft card accents, chart fills |
| **10% — Accent triad** | ~10% | `--brand-blue` (#4361EE), `--brand-violet` (#7B5CF5), `--brand-amber` (#F7C948) | CTAs, XP bars, streak flames, active nav, progress rings, badge highlights |

**Rules:**
- Never introduce a fourth chromatic hue. Semantic states (success/warning/error) map to blue/violet/amber tints.
- Dark mode inverts neutrals; accents stay at full saturation for WCAG contrast on interactive elements.
- WebGL (Hyperspeed, lanyard strap) uses the same `BRAND_HEX` / `BRAND_INT` source as CSS.

### 2.2 Typography

- **Family:** Noto Sans (100–900), single voice across roles.
- **Scale:** Page title 28–32px / 700; section 18–20px / 700; body 14–16px / 400–500; meta 12–13px / 500 secondary color.
- **Tone:** Encouraging, mission-oriented (“Keep the streak alive”, “Mission HQ”)—never punitive.

### 2.3 Motion & depth

| Pattern | Library | Where | Reduce motion |
|---------|---------|-------|---------------|
| Page enter | Framer Motion stagger | All dashboards | `prefers-reduced-motion`: opacity-only |
| Card spotlight | Magic Bento / GSAP | Dashboard grids | Disable on mobile |
| Hyperspeed lanes | Three.js | Login splash, sign-in transition | Static gradient fallback |
| Lanyard physics | R3F + Rapier | Login role confirm, Passport | CSS static badge fallback |
| Parallax layers | CSS transform + scroll | Phase Timeline, Skill Tree | Flat scroll |

**Principle:** 3D earns its GPU cost only at **identity moments** (login, passport, level-up)—not on data-dense tables.

### 2.4 Layout shell

```
┌─────────────────────────────────────────────────────────────┐
│ Sidebar (30% tint — gradient-sidebar) │ Main (60% neutral)   │
│ · Logo + theme toggle                 │ · Magic spotlight zone│
│ · Role-scoped nav sections            │ · Page header         │
│ · User chip (DiceBear Personas)       │ · Bento / card grid   │
│ · Sign out (frosted panel)            │ · 10% accent CTAs     │
└─────────────────────────────────────────────────────────────┘
```

- Sidebar width: 260px desktop; drawer overlay ≤768px.
- Main content max-width: 1280px with 24–32px padding.

---

## 3. Lanyard component specification

### 3.1 Purpose

The lanyard is the **identity totem**—a physics-simulated badge on a strap that signals “you belong here.” It appears at high-emotion touchpoints, not on every page.

### 3.2 Surfaces

| Surface | Mode | Behavior |
|---------|------|----------|
| **Login — role selection** | 2D/CSS preview | After role pick, mini lanyard animates into view above “Continue”; strap color matches role accent (Maverick=violet, Trainer=blue, L&D Executive=amber, Manager=blue-violet) |
| **Login — auth confirm** | WebGL (optional) | Full `Lanyard` canvas behind frosted card; draggable badge on desktop; static on mobile |
| **Sign-in splash** | Hyperspeed + badge reveal | 2s branded transition before dashboard |
| **Maverick Passport** | CSS lanyard yoke + card | Full-viewport horizontal credential; strap + clip above badge; share/download actions |
| **Manager — Maverick Passport (read-only)** | Same Passport layout | No edit actions; “Assigned Maverick” context banner |

### 3.3 Badge content (Maverick Passport)

- DiceBear Personas avatar (seed = Maverick ID)
- Name, email, Maverick ID, phase chip, readiness ring
- Skill chips (triad-tinted by proficiency band)
- XP level, streak, badge grid
- QR / share affordance (future: deep link to read-only view for Manager)

### 3.4 Performance & a11y

- Lazy-load R3F bundle on login route only.
- `aria-hidden` on decorative strap; credential text in semantic HTML outside canvas.
- Fallback: static PNG badge + CSS strap when WebGL unavailable or `prefers-reduced-motion`.

---

## 4. Role-based navigation map

### 4.1 Maverick

```
Mission HQ (/)
├── Maverick Passport (/passport)
├── Skill Tree (/skill-tree)
├── Phase Timeline (/phase-timeline)
├── Pulse Feedback (/pulse-feedback)
├── Deep Feedback (/deep-feedback)
├── Stream Recommender (/stream-recommender)
├── AI Learning Buddy (/ai-buddy)
└── Leaderboard (/leaderboard)
```

**Nav sections:** Main · Feedback · Explore

### 4.2 Trainer

```
Trainer HQ (/)
├── Session Logger (/session-logger)
├── Batch Pulse Board (/batch-pulse)
├── Session Analytics (/session-analytics)
├── Assessments (/assessments)
└── Attendance Tracker (/attendance)
```

**Nav sections:** Main · Analytics

### 4.3 L&D Executive

```
Ops Dashboard (/)
├── AI Batch Segregation (/batch-segregation)
├── Curriculum Copilot (/curriculum-copilot)
├── Effectiveness Loop (/effectiveness)
├── Batch Comparison (/batch-comparison)
└── Report Generator (/reports)
```

**Nav sections:** Command Centre · Intelligence

### 4.4 Manager

```
My Mavericks (/)
└── Performance Review (/review/:maverickId)
    └── Maverick Passport (read-only embed)
```

**Nav sections:** Main (single section; drill-down from roster cards)

### 4.5 Global routes (unauthenticated)

```
/login → role → email/SSO → OTP (Maverick pre-deploy) → Sign-in Splash → role home
```

**Auth UX split:**
- **Maverick (pre-deployment):** Gmail Magic Link OTP; lanyard preview on role select.
- **All other roles + post-deploy Maverick:** Hexaware SSO; corporate badge styling on lanyard.

---

## 5. Per-role dashboard information architecture

### 5.1 Maverick — Mission HQ

| Zone | Components | Primary metrics |
|------|------------|-----------------|
| Hero header | Greeting, streak flame | Day streak, phase name |
| XP card | Circular level ring, XP bar, level title tag | XP to next level |
| Daily missions | Checkbox mission cards | Completion count |
| Upcoming session | Session card + join CTA | Next Google Meet |
| Quick links | Bento tiles | Passport, Feedback, Buddy, Leaderboard |
| Activity feed | Timeline list | Recent XP events |

**Gamification emphasis:** Highest density of XP/streak/badge UI on this dashboard.

### 5.2 Trainer — Trainer HQ

| Zone | Components | Primary metrics |
|------|------------|-----------------|
| Today’s sessions | Session cards with status pills | Scheduled / live / done |
| Batch pulse summary | Sparkline + confusion alert chips | Aggregate sentiment |
| Quick actions | Logger, Pulse Board, Assessments | — |
| Recent feedback | Table/cards | Avg pulse score |

**Tone:** Operational clarity over whimsy; amber for alerts only.

### 5.3 L&D Executive — Ops Dashboard

| Zone | Components | Primary metrics |
|------|------------|-----------------|
| Batch lifecycle | Pipeline kanban or stage cards | Active batches |
| Segregation queue | Resume parse status | Pending reviews |
| Effectiveness KPIs | Chart cards (batch anonymized) | Completion, NPS proxy |
| Copilot entry | Prompt panel | Suggested curriculum deltas |
| Reports shortcut | Export tiles | PDF/CSV |

**Tone:** Executive calm; charts use 30% tints, 10% accent on trend lines only.

### 5.4 Manager — My Mavericks

| Zone | Components | Primary metrics |
|------|------------|-----------------|
| Assigned roster | Maverick cards with readiness ring | Count at risk |
| Review cadence | Due/overdue review badges | Next review date |
| Passport preview | Mini badge on card hover/click | Phase, readiness |
| Performance review | Structured form + history | Rating, flags |

**Tone:** Supportive manager partner; read-only training history via Passport embed.

---

## 6. Component inventory

### 6.1 Lanyard family

| Component | ID | Props / states |
|-----------|-----|----------------|
| `LanyardCanvas` | WebGL physics badge | `position`, `gravity`, `isMobile`, `transparent` |
| `PassportLanyardPage` | Full-page credential | Hero, yoke, card, skill chips, badges |
| `LoginLanyardPreview` | Role-colored strap teaser | `roleAccent`, `reducedMotion` |
| `PassportMiniCard` | Manager roster embed | `maverickId`, readOnly |

### 6.2 Gamification widgets

| Component | Usage | Visual |
|-----------|-------|--------|
| `XPProgressRing` | Dashboard, Passport | Violet path, neutral trail |
| `XPBar` | Dashboard header | Gradient fill blue→violet |
| `StreakFlame` | Dashboard hero | Amber icon + count |
| `LevelTitleTag` | XP card | Violet pill |
| `DailyMissionCard` | Maverick HQ | Checkbox + XP reward |
| `BadgeGrid` | Passport, Profile | Triad-tinted surfaces |
| `LeaderboardRow` | Leaderboard | Rank, avatar, XP, trend |
| `SkillTreeNode` | Skill Tree | Parallax nodes, unlock states |
| `PhaseTimelineMilestone` | Phase Timeline | Scroll-linked parallax |

### 6.3 Feedback UI

| Component | Route | Interaction |
|-----------|-------|-------------|
| `PulseFeedbackForm` | `/pulse-feedback` | 1–5 emoji + optional note; <30s |
| `DeepFeedbackWizard` | `/deep-feedback` | Multi-step post-phase; progress stepper |
| `FeedbackReminderToast` | Global (Maverick) | Non-blocking nudge |
| `BatchPulseHeatmap` | Trainer `/batch-pulse` | Anonymized aggregate |
| `ConfusionAlertChip` | Trainer dashboard | Amber alert, links to session |
| `ReviewSubmissionForm` | Manager `/review/:id` | Structured periodic review |

### 6.4 Shell & primitives

| Component | Notes |
|-----------|-------|
| `AppLayout` | Sidebar + main + MagicSpotlight |
| `AppMagicCard` | Bento-compatible card wrapper |
| `PersonAvatar` | DiceBear Personas, seed=userId |
| `ThemeToggle` | Light/dark; persists preference |
| `SignInSplash` | Branded transition post-auth |
| `HyperspeedBackground` | Login/splash only |

### 6.5 Learning embeds (future)

| Component | Source | Usage |
|-----------|--------|-------|
| `CodePenChallengeEmbed` | CodePen oEmbed | Assessments, micro-labs |
| `MeetTranscriptPanel` | Google API | Session detail (Maverick + Trainer views) |

---

## 7. 3D / parallax engagement matrix

| Experience | WebGL? | Rationale |
|------------|--------|-----------|
| Login role lanyard | Yes (degraded mobile) | Identity delight |
| Sign-in splash | Yes (Hyperspeed) | Brand moment |
| Maverick Passport | CSS + optional GLB | Performance; CSS yoke sufficient |
| Skill Tree | Parallax CSS | Depth without physics overhead |
| Phase Timeline | Scroll parallax | Story progression |
| Data tables (L&D, Trainer) | **No** | Readability first |
| Forms (feedback, reviews) | **No** | Focus mode |

---

## 8. Accessibility baseline (immersive UI)

1. **Reduced motion:** Respect `prefers-reduced-motion`; disable GSAP spotlight, Hyperspeed, lanyard physics.
2. **Focus order:** Sidebar → main → page actions; skip link to main content.
3. **Contrast:** Accent text on neutrals ≥4.5:1; sidebar white text on `#1e1b3a` gradient.
4. **Canvas alternatives:** All lanyard/3D scenes have parallel HTML credential content.
5. **Keyboard:** Role login grid navigable; mission checkboxes operable via Space.
6. **Screen readers:** Nav landmarks (`nav`, `main`); live regions for toast XP gains only (optional, user-toggle).

---

## 9. Legacy → target UI gaps

| Area | Current legacy | Target v1 |
|------|----------------|-----------|
| Login roles | 5 roles incl. Mentor | 4 roles only |
| Copy | “L&D Manager”, “Supervisor” | “L&D Executive”, “Manager” |
| Lanyard | Passport CSS yoke; GLB component exists | Login + Passport + Manager read-only |
| Nav config | Includes `mentor` block | Remove entirely |
| Auth | Demo role picker | Maverick OTP + SSO split |

---

## 10. Handoff checklist for Engineering

- [ ] Remove Mentor route, nav, login tile, mock user
- [ ] Rename UI copy: L&D Executive, Manager
- [ ] Wire login lanyard preview per role accent
- [ ] Lazy-load R3F on `/login` only
- [ ] Apply 60-30-10 audit pass on new screens
- [ ] Implement `prefers-reduced-motion` fallbacks
- [ ] Manager Passport read-only variant

---

## Appendix A — Acceptance criteria mapping

| Criterion | Section |
|-----------|---------|
| Role-based navigation map | §4 |
| Component inventory (lanyard, gamification, feedback) | §6 |
| No Mentor role UI references | §1, §9 |
| VP of Product handoff | ALSAA-4 comment + this document at `docs/metaverse-ui-ux-spec.md` |
