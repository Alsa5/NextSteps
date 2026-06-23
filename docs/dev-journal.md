# Development Journal

> The story of building this project — one day at a time.

---

## Sunday, June 21, 2026

*planning, deploy, fix*

NextSteps is ready to leave localhost — mapped the full Azure App Service path for Node 22 LTS (no containers): one Web App can host the Express API plus the built Vite SPA on the same origin so SSO and `/api` calls stay simple. Documented portal ZIP deploy, env vars, Azure AD redirect URIs, and the external dependencies (MongoDB, Redis) the platform needs to actually run in prod. Clarified the env split: **App Service settings = API secrets only**; `VITE_*` vars are build-time on your machine, not portal settings. Wired Express to serve `public/` with React Router fallback, added `.env.production.example` templates, and a `npm run prepare:azure-deploy` script. Chose Sanctuary **Option B** for Cosmos: App Service Key Vault reference on `MONGODB_URI` (no SDK), database `nextsteps` on the shared cluster.

Migrated every in-memory store (sessions, notifications, feedback, audit, P7 analytics) to MongoDB repositories with a full Cosmos collection map and dev seed script — production data now survives restarts and Azure deploys.

---

## Tuesday, June 16, 2026

*fix, polish*

The L&D surfaces were lying with their eyes — buttons that looked clickable but rendered as raw gradient blobs with no padding, no radius, no affordance. Pre-Onboarding Meets and Feedback Analytics both had the same root cause: missing base button styles and CSS classes that were referenced in JSX but never defined. I wired the `btn` foundation back in, aligned the meet scheduler modal with the polished batch-assignment pattern, and added the full filter-chip, tab-toggle, and export-dropdown styling Feedback Analytics was waiting on. Small CSS surgery, big trust win: scheduling a meet and slicing feedback data now feels like the same product as the rest of the console.

Also got the whole codebase onto my personal GitHub — [Alsa5/NextSteps](https://github.com/Alsa5/NextSteps) on `main`, 387 files, secrets left out via `.gitignore`. Windows kept trying to push through company SSO instead of my personal token; bypassed that with a direct HTTPS push using the PAT and no credential helper.

---

## Sunday, June 14, 2026

*milestone, progress*

The L&D console finally feels like a command center, not a spreadsheet with extra steps. Batch Composer is one place now — upload resumes for AI segregation on the first tab, flip to Approve & Publish when groups look right. No more hunting for a separate segregation page.

Ops Dashboard got the visual upgrade it deserved: animated Three.js bars and track rings fed by live roster data, plus line charts, pie breakdowns, and batch health bars that actually move with the numbers. Recruitment queue was stuck showing one lonely candidate because stale localStorage won — a seed migration resets the queue to 18 recruits across GET, PGET, STEP, and LEAP when counts drop too low.

Effectiveness Loop and Feedback Analytics were empty shells; both now pull real batch and maverick metrics with proper dark-theme charts, styled filter chips, trend lines, and export dropdowns that actually download CSV, Excel, and PDF. Report Generator PDF and Excel exports work the same way — generate once, export in any format.

The new AI Helper page lets L&D ask plain English questions — roster size, queue depth, at-risk mavericks, batches in trouble — and get tabular answers with copy, Excel, and PDF export. Maratype display typography rolls out across page heroes, welcome splash, and coach overlays (drop licensed Maratype.woff2 into public/fonts/ to replace the Orbitron fallback).

Mavericks don't climb a skill tree anymore — they explore a **Training Universe**. I ported the `new-universe` 3D planet map into the app: five planets map to journey stages from Spark through Deployment & Onboarding, each unlocking sequentially as trainees complete stages. Deployment and Onboarding are one combined final planet — locked until Project Internship is done. Rocket fly-to animations, XP rewards, streak bonuses, and a mission log carry the gamification forward. Progress seeds from the trainee's current phase and persists in localStorage. Skill Grove is retired; the sidebar now says Training Universe.

Polished the journey moment: completing a stage while zoomed on a planet now pulls the camera back to a wide overview first (~2s), then launches the rocket so the flight is actually visible. The reward chest modal layout is fixed so the skill name rises above the chest instead of overlapping "Skill Unlocked!". Typography is tightened too — Maratype (bold) for headings and subheadings only; body copy, buttons, and HUD use Noto Sans throughout the universe.

Pre-onboarding meets are no longer fake links. I wired Google Calendar OAuth for personal Gmail — L&D connects once from Pre-Onboarding Meets, and scheduling creates a real `meet.google.com` room on their calendar, emails trainer and batch via SMTP, and pings the notification bell. After a session ends, GPT-5 runs on the transcript for Trainer Session Analytics and Maverick Session Transcripts. Sakthi finished Google Cloud Console setup and dropped the credentials into the API `.env`; I fixed the last compile gaps, rebuilt, and restarted the server on port 3003. Next beat: connect Google in the L&D UI and schedule a test meet to confirm the full loop.

---

## Sunday, June 7, 2026

*fix*

The landing page mute button finally does what it says. Two audio sources were fighting — the galaxy iframe was auto-playing its own ambient track while the top-bar toggle only controlled a separate parent player, so "Mute" never silenced what you were actually hearing. I disabled autoplay in embed mode, wired the toggle to a single DOM audio element, and synced mute state to the iframe via postMessage so one click stops everything.

Turns out the Stellardrone MP3 on Free Music Archive never loads on our network — DNS can't even resolve the CDN — so play() always failed and the retry toast was covering the mute button in the top-right. I swapped in a self-contained Web Audio ambient synth (no external files), removed that toast entirely, and moved login toasts to the bottom of the screen so the top bar stays clear.

Magic link sign-in was broken for two reasons: Vite was proxying `/api` to port 3001 where Sanctuary's API lives (not NextSteps), and the NextSteps API never actually sent email — it only created tokens. I wired a full magic-link + 6-digit OTP flow, seeded your Gmail as an onboarded Maverick, pointed the dev proxy at `nextsteps-api` on port 3003, and restored galaxy drag/zoom by re-enabling iframe pointer events while keeping the hero text pass-through.

The recruitment queue got its missing muscle — L&D can add recruits straight to the queue or drop them into a batch. Then "Assign to batch" silently failed: the UI showed eligible recruits but the store re-read stale localStorage and rejected the selection. I aligned eligibility rules, synced seat counts from actual assignments, and wired the button to the live React state. The real UX trap was worse — the button looked enabled but was disabled until you picked a batch from the dropdown, and clicks did absolutely nothing. Now the first available batch auto-selects when you check a recruit, side-panel cards get a one-click "Assign here", and the button always responds with a clear toast if something's missing.

Onboarding mail is real now, not a mock delay. L&D opens a draft modal from the trainee profile — role, campus location, joining date, reporting time, optional PDF attachment — and the API merges it into a branded Hexaware welcome template, generates Employee ID + @hexaware.com email, and sends via the same SMTP as magic-link auth.

Sign-in rules now match the roster story: anyone assigned to a batch (pre- or post-onboarding) can magic-link in with their personal email; recruits still on the queue with no batch get a clear “wait for batch assignment” message instead of a vague not-onboarded error.

Your face follows you through the Nebula now. Names title-case everywhere (madhav v s → Madhav V S), and avatars pull from Microsoft Graph for SSO or your Gmail profile photo for magic-link users — sidebar sign-out card, Maverick Passport, and the hyperspeed lanyard badge all show the real you instead of a random Dicebear character.

The landing page soundtrack got an upgrade too — swapped the placeholder Web Audio drone for a proper 80s synthwave track. Hit ♪ Music in the top bar and the Nebula finally sounds like it looks.

---

*milestone, progress, decision, fix*

Today NextSteps became a place you walk into — and the galaxy backdrop is fully interactive while every UI button still works. The core breakthrough was a pointer-events architecture fix, and the hero and sign-in card now sit in a proper two-column layout.

The Skill Grove grew a planet. The 3D tree now rises from an alien pink world — a glowing magenta sphere peeks from the bottom with atmospheric rings and a surface mist, camera pulled back to `[0, 4, 18]` so the full canopy is visible. The rogue mini-3D-tree that was infecting every page header is gone: MetaversePageHero now renders text-only, clean and fast.

The hyperspeed lanyard got its glow-up. The physics rope, hook, and swing effects are fully preserved — but the default grey 3D card is now replaced with the NebulaBadge HTML overlay rendered via `drei Html`, hanging from the same Rapier rigid body. Your actual photo, name, and employee ID swing inside the lanyard physics.

The AI Learning Buddy is live. The root cause was Azure OpenAI's CORS policy blocking browser-direct calls. Fixed with a clean server-side proxy at `/api/v1/ai/chat` in nextsteps-api. GPT-5 also had three quirks we solved: it requires `max_completion_tokens` not `max_tokens`, uses `developer` role not `system`, and ignores `temperature`. All normalized in the proxy — the frontend just sends standard messages and gets replies. Buddy confirmed working: "Hello, nice to meet you!" Next: magic link SMTP send and SSO role routing validation.

---

## Sunday, May 31, 2026

*milestone, progress, decision*

Today the platform stopped feeling like a dashboard and started feeling like a place — and now it knows who you are when you walk in. I rebuilt NextSteps around **The Maverick Nebula** and, in the same breath, wired **real Microsoft SSO** (same Azure AD app as Sanctuary) so Mavericks, Trainers, L&D Executives, and Managers share one sign-in. No more picking a role off a demo card: Azure tells us who you are, we read your designation (job title) or fall back to your email against a role registry in MongoDB, and you land on the right dashboard automatically.

The auth story mirrors Sanctuary — MSAL lives entirely on the frontend, the API validates your token with Graph, and roles live in a dedicated `nextsteps` database on the same Mongo cluster. Under the hood I aligned roles with the Maverick Experience Platform spec: Supervisor became Manager, L&D Manager became L&D Executive, mock data and effectiveness loops say Manager rating now, and the old mentor dashboard is deleted. Build passes on the API; the login page is a single **Sign in with Microsoft** gateway into the Nebula.

The 3D layer isn't decoration for decoration's sake. I ported the spirit of the CodePen references you pointed at — bioluminescent L-system trees, bouncy fractal growth, foggy procedural cities, audio-reactive pulse spheres — into React Three Fiber scenes that show up where they matter. The login screen now wears the **physics lanyard** identity preview (lazy-loaded, with a static fallback for reduced motion) so your badge swings in before you even tap Microsoft SSO. Next slice is wiring the rest of the shells to authenticated APIs — but today, signing in should feel like stepping into the Nebula with the right badge already around your neck.

I also folded the full MavX Designathon blueprint into one copy-paste master prompt — hackathon problem statements, phase map, gamification XP tables, AI feature map, auth flows, and every role feature — with Mentor stripped out, MavX renamed to NextSteps, and Trainer auth corrected for external vendors. It lives at `docs/nextsteps-master-prompt.txt` for feeding into downstream design and build tools.

Paperclip had stranded **ALSAA-51** (UI/UX revamp) because the Cursor adapter could not find the `agent` CLI — eight-second failures, no live execution path. I installed the Cursor Agent, fixed Windows skill injection, restarted Paperclip on **3100**, recovered the issue, wired the missing login lanyard, verified `npm run build`, and closed ALSAA-51 **done**.

The board dropped the full hackathon master prompt as **ALSAA-54** — everything end-to-end, metaverse welcome, indulging UI, all merged features. That's an epic, not a solo sprint. As CEO I published the delegation plan and split NEXUS ownership: VP Product maps the prompt to our existing P0–P6 tracks without duplicating ALSAA-12–18; Creative Director owns the welcome journey on top of Maverick Nebula; VP Engineering orchestrates build once strategy and design hand off (**ALSAA-55 → 56 → 57**). The parent stays in motion until those children complete — then we ship the marvel, not just the memo.

A follow-up heartbeat hit an adapter usage ceiling on the parent — not a product blocker. I checked the children: **ALSAA-55** and **ALSAA-56** were in progress but had zero artifacts yet, so I nudged VP Product and Creative Director with explicit deliverables (feature matrix + welcome handoff) so **ALSAA-57** can unblock.

Then I closed the strategy loop myself on **ALSAA-55**: every master-prompt module now maps to a build phase, owner, and Paperclip issue — or an explicit gap with an owner. Sixty-two modules traced, eight gaps flagged for engineering orchestration, and a seven-step welcome acceptance checklist handed to Creative Director on **ALSAA-56**. The matrix lives at `docs/nextsteps-alsaa54-phased-feature-matrix.md` and on the issue as a durable execution contract — so **ALSAA-57** can stop guessing scope and start wiring pods.

The handoffs landed in the repo even before Paperclip caught up. I approved the phased feature matrix and the metaverse welcome spec, closed **ALSAA-55** and **ALSAA-56**, and unblocked **ALSAA-57** for VP Engineering — Build phase is live.

Then Sakthi hit a trust-breaking glitch: app-admin role switching showed "Viewing as Trainer/L&D Executive" but the Maverick dashboard stubbornly stayed on screen. The API was doing its job — React Router was not. I forced the route tree to remount when the role changes, synchronized state before navigation, and made SSO preserve an app admin's chosen role instead of resetting it from designation on every login. Switch roles now and you land where you expect.

As Creative Director I closed the welcome chapter on **ALSAA-56**: a full Maverick Nebula onboarding spec — Gateway Grove login, role-aware hyperspeed splash, first-run coach beats, 60-30-10 tokens, and an engineering checklist so the build pod knows exactly what "indulging welcome" means before they wire another pixel. First impressions now have a story, not just a loading spinner.

A follow-up wake on the CEO's deliverable comment confirmed the loop is closed — spec linked, foundation gate approved, and **ALSAA-57** is clear to build the welcome flow without another product round-trip.

The strategy child got its final stamp: CEO approved the phased feature matrix v1.0.0 on **ALSAA-55**, I acknowledged the gate in-thread, and handed execution to VP Engineering on **ALSAA-57** — no more scope debates, just build.

Wave 1 backend is now moving, not meeting. I shipped **G-01 — the Feedback Completion Engine** on **ALSAA-59**: live batch completion dashboards for L&D and Trainers, a pulse webhook that extends the ALSAA-14 pipeline without duplicating session logging, and job stubs for the 3-tier Day 0/1/2 reminders plus the 90% batch XP bonus hook. Trainers and L&D can finally see "how close are we?" in one glance — and the frontend pod has a documented integration map instead of a Slack thread. Fifty-two tests green, build clean.

On the frontend welcome slice (**ALSAA-58**) I closed the loop Creative Director wrote in the spec: role-aware hyperspeed splash with Nebula chapter copy and tint, a one-time coach that points each role at their first real action, and a reduced-motion static path that still feels intentional. Seven vitest cases guard copy and storage keys; production build passes. SSO → splash → dashboard should finally read as one continuous welcome, not three disconnected screens.

The landing page is now the Nebula's front door, not a login form with wallpaper. **Welcome to the Nebula** fades into **Start your journey here**, then the galaxy reveals four role orbits, a four-step journey strip, and copy you can actually read on top of the stars. Bright theme toggle is gone; ambient music is landing-only with a mute control that really stops playback. After Microsoft SSO, hyperspeed carries a **draggable passport lanyard** with your Graph photo, name, and employee ID. L&D gets a **Trainee Roster** (pre/post onboarding) with one-click onboarding mail that provisions a `@hexaware.com` identity; mock data and JSON schemas now ship fifty records per domain for every portal to breathe. I wrote the SSO routing playbook and a Suno-ready lyrics brief so the soundtrack can match the story we're selling.

Wave 2 analytics is no longer a gap on a spreadsheet — it's a contract L&D can build against. I closed **ALSAA-62** with the full P7 bundle (G-03 through G-07): curriculum copilot recommendations, cohort comparison, top-performer identification, executive report generation, and smart reminder timing. Five L&D-facing API endpoints, two background job stubs, and an engineering spec that names exactly who owns Wave 3 (LLM synthesis, real scoring, PDF export, ML send-time). Seventy-four tests green. L&D Executives can soon compare batches side-by-side and nominate top performers without waiting for another planning cycle.

The CEO handed epic monitoring to Chief of Staff so adapter limits stop burning heartbeats on status theater — delivery stays on the pod issues where it belongs. I accepted the handoff, refreshed the phased feature matrix (P7 and welcome/theme now **done**; hardening still on the CTO), and posted a delta rollup: Wave 1 complete, Wave 2 half-closed, critical path is orchestration plus P2/P4/P5 plus privacy hardening. The marvel isn't done yet — but we finally have an honest map of what's left instead of another CEO comment loop.

Then Wave 2 fully closed: **ALSAA-61** landed G-08 privacy/RBAC hardening — named Maverick IDs stripped from trainer/L&D dashboards, k-anonymity enforced, audit logs on sensitive reads. Both Wave 2 pods are done. What's left is honest too: P2/P4/P5 haven't moved on the board since May 29. I flagged that for VP Engineering — not a blocker, but the epic can't close while those tracks sleep.

The role-switch bug had one more ghost in the machine: a stale auth bootstrap could finish after you picked Trainer and quietly snap you back to Maverick. I stopped that race — bootstrap runs once, role switches skip the login splash, and the whole authenticated shell remounts on the new role — so the toast and the dashboard finally agree.

Adapter limits kept eating monitor heartbeats, so I stopped repeating rollups and **delegated** instead: created **ALSAA-65** for VP Eng to refresh stale P2/P4/P5 pod status. Then I **blocked the epic on that task** — no more adapter-limit continuation loops until VP Engineering posts fresh pod evidence. Unblock owner: VP Eng on ALSAA-65.

Privacy was the last Wave 2 gate I owned as CTO. I closed **G-08 on ALSAA-61**: the feedback dashboard had been leaking named Maverick IDs to trainer and L&D views — exactly the surveillance pattern our spec forbids. I stripped that at the API boundary, enforced k-anonymity on session breakdowns, wired audit logs on every sensitive read, and registered a retention job stub aligned to spec §6.4. Seventy-four tests green. Trainers and L&D still see "how close are we?" — they just can't peer over anyone's shoulder by name anymore.

On **ALSAA-63** I ran the first Chief-of-Staff program monitor heartbeat after the CEO handoff: Wave 1 is done, Wave 2 is actively executing on the CTO and Backend Architect pods, and the honest gap is the legacy P2/P4/P5 tracks sitting idle for two days — a VP Engineering hygiene item, not a CEO fire drill. Heartbeat 4 landed the first real state change since handoff: **ALSAA-54 is now blocked on ALSAA-65** until VP Engineering refreshes the stale P2/P4/P5 pod status. I posted the parent rollup (checkout finally clear), synced ALSAA-63, and the epic's honest unblock owner is VP Eng — not another CEO heartbeat.

---

## Friday, May 29, 2026

*milestone, progress, decision*

Discovery for the NextSteps revamp is now one buildable story — and the CEO signed off. Engineering mapped the legacy SPA to MERN; Creative locked the metaverse UI blueprint; I merged both into **v1.1.0-consolidated** of the Maverick Experience Platform spec. With Managing Director approval in hand, I closed Discovery (ALSAA-4/7), then **Strategy (ALSAA-10)**: ten prioritized epics, P0–P6 dependencies, Sprint 1–2 themes, and a version ladder to pilot-ready 1.0.0 — all in the epic roadmap doc. SM picks up ADO mirroring on ALSAA-11; Build slices stay on ALSAA-12–18.

Now we're in Build: I picked up **P4 — session intelligence** (ALSAA-16) and broke it into five specialist tasks so Trainers and L&D get aggregate mood and clarity from Google Meet — never individual surveillance. Backend owns the Meet stub, transcript ingest, and sentiment jobs; Software Architect wires the analytics APIs; Security signs off on privacy before we call P4 done.

This heartbeat I triaged **P2 — trainer session logger + pulse feedback** (ALSAA-14). The UI shells exist but still run on mock data — and the pulse board currently names individual Mavericks, which violates our privacy spec. Worse, P0 is marked done on the board but the workspace is still Vite-only with no API layer, so I split the work into a three-step chain: verify the monorepo scaffold first, then backend session/pulse APIs with batch-only aggregates, then frontend wiring with the surveillance rows removed. Trainers get a real session-to-pulse loop; Mavericks keep their 30-second feedback ritual — without anyone peering over their shoulder by name.

Scrum Master picked up **ALSAA-11** — the ADO mirror handoff. I drafted the Feature ladder plan (0.1.0–0.7.0, seven Friday releases mapped to ALSAA-12…18) and a starter routing matrix so Paperclip and Azure DevOps speak the same language before anyone creates work items. Build phases now have a board-ready blueprint; CEO approval gates the actual ADO sync.

Then I picked up **P5 — manager reviews + deployment auth migration** (ALSAA-17). Managers need a post-deployment home: assigned Mavericks, structured reviews, read-only passports, and a seamless Gmail-to-SSO flip when trainees deploy — zero profile loss. P1 is still blocked, so the auth migration slice waits; but the Manager vertical can move now. I wrote the engineering assignment plan and delegated four pod tasks: Backend Architect on API routes and the migration webhook, Software Architect on lifting the legacy supervisor screens, Security Engineer on the auth gate. When P1 clears, the deployment story completes; until then, we're building the Manager experience managers can trust on day one of a Maverick's project life.

---

## Sunday, May 3, 2026

*milestone, progress, decision, fix, polish*

The product finally wears one deliberate visual story: indigo blue, violet, and amber everywhere—Hyperspeed included—so sign-in, dashboards, and charts read as the same brand instead of a rainbow of one-offs. **Noto Sans** now carries every screen (replacing Inter and Space Grotesk), so typography is one calm voice across Maverick, trainer, and L&D surfaces—without leaning on Nothing Phone's proprietary cuts, which aren't licensed for self-hosting here. Avatars are **DiceBear Personas**—deterministic, portrait-style faces seeded from each Maverick ID. Maverick Passport hangs as a **full-viewport lanyard badge** with a **wide horizontal credential strip** on desktop. Mission HQ's accent cards respect dark theme, and the sidebar scrollbar stays subtle so the shell doesn't fake a purple seam. The sidebar **Sign out** button uses the same frosted panel language as the user chip so it stays legible on dark purple chrome.

On top of that polish pass, I landed **Magic Bento** for real: GSAP-driven spotlight, border glow, star particles, and click ripples follow users across the authenticated shell—Layout's main column is the glow zone—and **`AppMagicCard`** wraps the surfaces users actually tap (cards, stat tiles, login panel, chat shell) without nesting magic chrome inside `card-title` rows. A codemod hiccup taught me to match whole class tokens, not `\bcard\b`, so headers didn't get mistaken for cards; I replaced a broken trainer "dashboard bento" import with a simple toolkit strip that ships. Next I'd lazy-load chart-heavy routes if we see jank on weaker machines.

---
