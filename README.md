# MetroFlow AI

**Your AI Operator for Software Delivery.** MetroFlow moves features from idea to
production through a disciplined, review-driven workflow:

> Feature Request → PRD → Tasks → Code → AI Review → Fixes → Re-Review → Human Approval → Ship

## Project Overview

AI can write code faster, but great software is not shipped by code generation
alone. MetroFlow AI is a multi-tenant SaaS platform that manages the **entire**
software delivery lifecycle. An AI Product Manager clarifies the request and
writes a structured PRD, the agent breaks it into engineering tasks on a Kanban
board, GitHub pull requests are synced and reviewed by an AI QA engineer against
the PRD, and a human makes the final call before anything ships. The AI acts as
a QA/engineering reviewer — judging whether the implementation actually
satisfies the product requirements — not a syntax checker. Humans remain the
final decision makers.

### The Core Loop

| Phase | What happens |
| ----- | ------------ |
| **1. Discovery** | An AI PM clarifies the request, asks follow-up questions for missing context, and educates the user if similar functionality already exists. Only valid + new requests proceed. It then generates a strict PRD: problem statement, goals, non-goals, user stories, acceptance criteria, edge cases, success metrics. |
| **2. Planning** | The PRD is converted into engineering tasks tracked on a drag-and-drop Kanban board; teams review/approve the plan. |
| **3. Development** | A GitHub App connects repos. A PR that references a task (`Closes SF-123`) is mapped to the feature automatically via webhook. |
| **4. AI Review Loop** | A QA agent reviews the diff against the PRD, acceptance criteria, tasks, security (OWASP Top 10), performance, edge cases, and code quality — classifying issues **BLOCKING** vs **NON_BLOCKING**, posting them to the PR, and sending the feature to `FIX_NEEDED` until clean. Re-reviews run on every push. |
| **5. Human Approval** | A command center aggregates the PRD, tasks, PR status, and full AI review history. Admins/Leads approve or reject; only approved, non-blocking features become `SHIPPED`. |

---

## Tech Stack

- **Monorepo:** Turborepo
- **Web:** Next.js (App Router), Shadcn UI, Tailwind CSS (mobile-first), black/gold theme
- **API:** tRPC (end-to-end type safety) with workspace-scoped access control
- **Auth:** BetterAuth (email/password + GitHub social)
- **Database:** PostgreSQL via Prisma
- **AI:** Vercel AI SDK (`generateObject`) with Anthropic Claude
- **Async workflows:** Inngest
- **GitHub:** GitHub App via Octokit (`@octokit/auth-app`, `@octokit/rest`) + webhooks
- **Billing:** Razorpay subscriptions
- **Hosting:** Vercel

---

## Architecture

```
apps/
  web/                 Next.js app
    app/(marketing)    Landing page
    app/(auth)         BetterAuth login
    app/dashboard      Workspaces, projects, Kanban, feature command center, settings
    app/api/trpc       tRPC HTTP handler
    app/api/auth       BetterAuth handler
    app/api/inngest    Inngest function endpoint
    app/api/webhooks/github     GitHub PR webhook (signature-verified)
    app/api/webhooks/razorpay   Razorpay billing webhook
    app/api/github/setup        GitHub App installation callback
packages/
  api/                 tRPC routers + lib (ai, github, billing, prd, review, access)
                       + Inngest workflow functions
  db/                  Prisma schema and client
  inngest/             Inngest client + typed event schemas (no heavy deps)
  ui/                  Shared UI primitives
```

Data flow for the two heavy operations:

```
PRD:    prd.generate (tRPC)  → status=GENERATING_PRD → inngest.send("prd/generate.requested")
        → Inngest generatePrdFn → generateObject(Claude) → save PRD+tasks → status=PLANNING
        → UI polls and updates.

Review: GitHub PR webhook (or review.runReview) → inngest.send("review/run.requested")
        → Inngest runReviewFn → Octokit fetch diff + Prisma PRD context → generateObject(Claude)
        → save Review (blocking/non-blocking) → post PR review → status=IN_REVIEW or FIX_NEEDED.
```

Multi-tenancy: every core model carries a `workspaceId` lineage; tRPC procedures
call `assertWorkspaceMember` / `assertProjectAccess` to enforce isolation and
role checks (ADMIN/LEAD/MEMBER).

---

## Setup Instructions

### Prerequisites
- Node.js ≥ 18
- A PostgreSQL database
- Anthropic API key (plus a GitHub App and Razorpay account for full functionality)

### Install & configure
```bash
npm install
cp .env.example apps/web/.env        # fill in the values
```

### Database
```bash
npm run db:generate --workspace @repo/db
npm run db:push --workspace @repo/db      # quick local sync
# For production, use migrations instead:
# npm run db:migrate --workspace @repo/db  (dev)  /  db:deploy (prod)
```

### Run (3 terminals for full local dev)
```bash
npm run dev                          # web app on http://localhost:3001
npx inngest-cli@latest dev           # Inngest dev server (executes workflows locally)
# expose the webhook for GitHub, e.g. ngrok http 3001
```

---

## Environment Variables

| Variable | Purpose |
| -------- | ------- |
| `DATABASE_URL` | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` / `BETTER_AUTH_URL` | BetterAuth session signing + base URL |
| `NEXT_PUBLIC_APP_URL` | Public app URL (auth client) |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | GitHub social login (optional) |
| `ANTHROPIC_API_KEY` | Platform Claude API key (fallback when a workspace has no BYOK key) |
| `AI_MODEL` | Model override (default `claude-3-5-sonnet-latest`) |
| `ENCRYPTION_KEY` | 32-byte key (hex/base64) used to encrypt workspace BYOK keys at rest |
| `REQUIRE_EMAIL_VERIFICATION` | `true` to require verified email before login (needs a mail sender) |
| `SENTRY_DSN` | Optional error-tracking DSN (wire up in `packages/api/src/lib/log.ts`) |
| `GITHUB_APP_ID` / `GITHUB_APP_SLUG` | GitHub App identity |
| `GITHUB_APP_PRIVATE_KEY` | GitHub App PEM (escaped `\n` supported) |
| `GITHUB_WEBHOOK_SECRET` | Verifies incoming PR webhooks |
| `INNGEST_EVENT_KEY` / `INNGEST_SIGNING_KEY` | Inngest production keys |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Razorpay API keys |
| `RAZORPAY_PRO_PLAN_ID` | Razorpay Plan id for the Pro tier |
| `RAZORPAY_WEBHOOK_SECRET` | Verifies Razorpay billing webhooks |

---

## Database Schema Notes

Prisma models (`packages/db/prisma/schema.prisma`):

- **Auth (BetterAuth):** `User`, `Session`, `Account`, `Verification`.
- **Tenancy:** `Workspace` (plan tier, `aiReviewCredits`, `githubInstallationId`,
  Razorpay ids) → `WorkspaceMember` (role: ADMIN/LEAD/MEMBER) → `Project`.
- **Delivery:** `FeatureRequest` (status machine: DISCOVERY → GENERATING_PRD →
  PLANNING → IN_PROGRESS → IN_REVIEW / FIX_NEEDED → APPROVED → SHIPPED / REJECTED;
  stores `clarificationJson` and approval fields) → `PRD` (`contentJson`) →
  `Task` (with an autoincrement `ref` used as the `SF-###` PR reference).
- **GitHub & review:** `Repository` → `PullRequest` (unique per repo+number) →
  `Review` (status, `issuesJson`, `blockingCount`).
- **Billing:** `Subscription` (Razorpay plan/status).

Isolation is enforced in the API layer via the `workspaceId` lineage rather than
row-level security.

---

## GitHub Integration Setup

1. Create a GitHub App (Settings → Developer settings → GitHub Apps). Generate a
   **private key** and a **webhook secret**.
2. Permissions: Pull requests (read/write), Contents (read), Metadata (read).
   Subscribe to the **Pull request** event.
3. Webhook URL → `https://<domain>/api/webhooks/github`.
4. Setup/callback URL → `https://<domain>/api/github/setup`.
5. In MetroFlow → **Settings → Connect GitHub**. The `installation_id` is saved to
   your workspace; Octokit then acts on its behalf (list repos, read diffs, post
   reviews). No PR data is hardcoded.
6. In a PR body, reference the task you're implementing, e.g. `Closes SF-12`. The
   webhook links the PR to that feature and triggers the AI review workflow.

---

## Inngest Workflow Explanation

Heavy AI operations are offloaded to **Inngest** so they survive Vercel's
serverless timeouts and get automatic retries.

- **Client + events** live in `packages/inngest` (typed event schemas, no heavy
  deps — avoids a circular dependency with `@repo/api`).
- **Functions** live in `packages/api/src/inngest/functions.ts` and are served by
  `apps/web/app/api/inngest/route.ts`.
- **`prd/generate.requested` → `generatePrdFn`** — generates the PRD + tasks and
  advances the feature to `PLANNING` (rolls back to `DISCOVERY` on failure).
- **`review/run.requested` → `runReviewFn`** — fetches the PR diff, runs the AI
  QA review, stores the result, posts to GitHub, and sets `IN_REVIEW` /
  `FIX_NEEDED`.

Producers (tRPC routers, the GitHub webhook) only call `inngest.send(...)` and
return immediately; the UI reflects progress via the feature status (e.g.
`GENERATING_PRD`) and polling.

---

## AI Features Implemented

All powered by the Vercel AI SDK + Claude with `generateObject` (schema-enforced
structured output):

- **Requirement clarification** — decides NEEDS_CLARIFICATION / ALREADY_EXISTS /
  READY, asks follow-up questions, and educates the user about existing features.
- **PRD generation** — problem, goals, non-goals, user stories, acceptance
  criteria, edge cases, success metrics.
- **Task generation** — an engineering task breakdown derived from the PRD.
- **AI code review / QA validation** — reviews PR diffs against the PRD,
  acceptance criteria, security (OWASP Top 10), performance, edge cases, and code
  quality, with actionable explanations and blocking/non-blocking severity.
- **Release readiness** — shipping is gated on zero unresolved blocking issues.
- **Bring-your-own-key (BYOK)** — a workspace can store its own Anthropic
  (Claude-only) API key, encrypted at rest (AES-256-GCM). When present, all AI
  calls for that workspace bill the user's Anthropic account instead of the
  platform key. Keys are validated live against Anthropic and never returned to
  the client (only a masked preview).

---

## Billing (Razorpay)

- **Free:** 1 workspace, up to 3 projects, limited AI review credits.
- **Pro:** unlimited projects, more credits.

`/api/webhooks/razorpay` verifies the signature and upgrades the workspace on
`subscription.activated` / `subscription.charged`. tRPC middleware enforces the
project limit and decrements `aiReviewCredits` per review.

---

## Scripts

```bash
npm run dev           # run all apps/packages in dev
npm run build         # turbo build
npm run lint          # lint
npm run check-types   # type-check
```

---

*Builder Mode On | iPhone Giveaway Hackathon*
*#chaicode*
