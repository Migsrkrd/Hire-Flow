# HireFlow

A role-aware recruiting portal that sits on top of a messy external application system and turns applicant data into a cleaner decision workflow.

## Quick start

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

**Demo logins** — pick a user on the login screen:

| User | Role |
|------|------|
| Sarah Chen | Recruiter |
| Marcus Webb | Hiring Manager (Engineering) |
| Priya Patel | Hiring Manager (Design & Analytics) |

### Suggested walkthrough

1. Log in as **Sarah Chen** (Recruiter)
2. Click **Sync Applicants** to import candidates from the fake external ATS
3. Browse the dashboard, filters, and charts
4. Open a candidate → **Generate AI Summary** → add a note → **Send to HM**
5. Switch user → log in as **Marcus Webb** or **Priya Patel**
6. Review assigned candidates, leave feedback, and take action

State persists in `localStorage`, so refreshes keep your progress. Use "Switch user" in the sidebar to change roles.

---

## What makes this different

Most ATS tools dump the same cluttered application view on everyone. HireFlow assumes the real problem is **workflow**, not storage.

Applicants arrive from an external portal (simulated here with seeded mock data). Recruiters get a full queue — search, filters, charts, internal notes, and pipeline actions. Hiring managers get a deliberately different experience: only their assigned candidates, with summaries, match scores, concerns, and decision buttons — not a stripped-down recruiter screen.

The "Sync Applicants" action mimics pulling raw data from an external system. HireFlow's value is what happens after sync: attention badges, data quality warnings, simulated AI summaries, and role-specific next steps.

---

## AI tools used

This project was built with **Cursor** and AI assistance for scaffolding the React + Vite app, generating realistic seeded applicant data, exploring component structure, and iterating on the recruiter vs. hiring manager workflows.

Product decisions — scope, role split, what to mock vs. build, and which features to skip — were guided by the evaluation prompt. The simulated "AI summary" is deterministic text generated from candidate fields, not a live LLM call.

---

## First three production improvements

1. **Real backend integration** — Replace mock sync and `localStorage` with a proper API that pulls from the external ATS, stores candidates in a database, and supports real-time updates across users.

2. **Authentication and permissions** — Add real auth (SSO or email), role-based access control, and an audit trail for every stage change, rejection, and hiring manager decision.

3. **Real AI summarization** — Wire up an LLM pipeline that reads resume/application data, produces summaries with confidence scores, and includes human review controls and privacy safeguards before anything is shown to hiring managers.

---

## Tech stack

- React 19 + Vite + TypeScript
- Local component state + `localStorage` persistence
- Custom CSS (no UI framework)
- CSS-based bar charts (no chart library)

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
