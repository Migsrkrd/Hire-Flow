# HireFlow

**Don't replace the ATS. Replace the time people waste trying to decide what to work on next.**

HireFlow is an intelligent productivity layer that sits on top of your existing applicant tracking system. Applicants still apply through the external ATS. HireFlow connects via API, syncs the data, and turns a cluttered applicant dump into a prioritized decision workflow for recruiters and hiring managers.

This is not another recruiting platform. It is a command center for hiring decisions.

## Run locally

```bash
npm install
npm run dev
```

Pick a role on the login screen. Sync from ATS as a recruiter, then switch roles via the left rail.

| User | Role |
|------|------|
| Sarah Chen | Recruiter |
| Marcus Webb | Hiring Manager (Engineering) |
| Priya Patel | Hiring Manager (Design & Analytics) |

State persists in `localStorage`. Use **Settings → Reset demo data** to start fresh.

---

## The problem

ATS platforms are good at collecting applications. They are bad at telling you what deserves your attention.

Recruiters drown in hundreds of rows — weak filters, duplicate fields, no prioritization. Hiring managers get forwarded PDFs and Slack messages instead of a focused decision view. Everyone spends hours figuring out *what to work on next* instead of actually evaluating candidates.

HireFlow exists to eliminate that waste.

---

## What it does

1. **Syncs** applicant data from an external ATS (simulated with seeded mock data for this evaluation)
2. **Prioritizes** candidates by attention score — high match, stale applications, missing reviews, pending decisions
3. **Explains** why each candidate surfaced in the queue
4. **Generates** deterministic AI Insights from application data (summary, strengths, risks, red flags, confidence, interview questions)
5. **Adapts** the entire experience by role — recruiter inbox vs. hiring manager decision queue

Every screen answers one question: **What should I work on next?**

---

## Architecture

```
src/
  components/shell/   # 3-panel command center (rail, queue, brief)
  context/          # App state, sync merge, activity logging
  data/             # Seeded ATS applicants + demo users
  utils/            # Prioritization, smart views, AI simulation, activity feed
```

- **React 19 + Vite + TypeScript** — no backend, no real API
- **localStorage** for persistence across refreshes
- **Merge sync** — re-syncing from ATS updates applicant profiles but preserves notes, AI insights, recommendations, stage changes, and feedback
- **Activity feed** — every user action (insights, notes, recommendations, assignments, decisions) is logged per candidate with timestamps

### Key product decisions

| Decision | Why |
|----------|-----|
| 3-panel layout (not dashboard) | Mirrors Gmail/Slack — queue + context, not metrics-first |
| Smart Views over advanced filters | Most users need "who needs attention" not filter builders |
| Attention-sorted queue | Alphabetical lists hide the highest-value work |
| Role-specific UI (not fewer buttons) | Hiring managers decide; recruiters triage — different jobs |
| AI Insights embedded in brief | AI supports decisions, not a standalone feature |
| Pipeline Health as separate view | Metrics support the workflow; they don't replace it |
| Merge sync (not overwrite) | Real ATS integrations update profiles without erasing human work |

### Tradeoffs

- **No real auth** — demo uses a role picker; production needs SSO and permissions
- **Deterministic AI** — insights are generated from candidate fields, not an LLM; fast and predictable for evaluation, but not production-grade
- **Single localStorage store** — no multi-user collaboration or audit trail yet
- **Desktop-first layout** — optimized for the command-center experience; responsive but not mobile-native

---

## AI tools used

Built with **Cursor** and AI assistance for scaffolding, seeded data, component structure, prioritization logic, and iterative UX refinement.

Product scope, role workflows, and what to mock vs. build were guided intentionally by the evaluation requirements. AI helped move fast; product decisions prioritized *decision workflow* over *data storage*.

---

## Production roadmap

1. **Real ATS integrations** — Greenhouse, Lever, Workday, etc. with webhook-driven sync and field mapping
2. **Persistent backend** — database, real-time updates, multi-recruiter collaboration
3. **Authentication & permissions** — SSO, role-based access, team scoping
4. **Real AI summarization** — LLM pipeline with confidence scores, human review gates, and privacy controls
5. **Collaboration & audit** — shared notes, @mentions, immutable decision history

---

## Deployment

Merging into `main` triggers GitHub Actions to build and deploy to GitHub Pages.

**One-time repo setup:**

1. Open **Settings → Pages** in the GitHub repo
2. Set **Source** to **GitHub Actions**

After the first successful deploy, the app will be live at:

`https://migsrkrd.github.io/Hire-Flow/`

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | PRs and pushes to `main` | Typecheck + build |
| `deploy.yml` | Push to `main` | Build and deploy to GitHub Pages |

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
