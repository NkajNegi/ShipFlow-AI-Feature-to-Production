# MetroFlow AI — Hackathon Evidence Index 🧠

This document maps the core hackathon evaluation rubric (R1-R7) directly to our source code. Use this index to rapidly verify our technical implementation.

---

### R1: Core AI Integration & Generative Workflows

**Evidence:** The platform uses generative AI to autonomously create Product Requirements Documents (PRDs) and execute comprehensive Pull Request reviews.

- **PRD Generation:** [`packages/api/src/router/feature.ts`](packages/api/src/router/feature.ts) (Look for the `streamObject` call utilizing `zod` schema enforcement).
- **AI PR Reviews:** [`packages/api/src/router/review.ts`](packages/api/src/router/review.ts) (Look for the highly structured 9-dimension evaluation array outputted via structured JSON).

### R2: Multi-Model Capabilities

**Evidence:** The application uses the `@ai-sdk/core` to build entirely model-agnostic abstractions, allowing seamless swapping between models like `claude-3-5-sonnet` and `gpt-4o`.

- **Model Initialization:** [`packages/api/src/lib/ai/index.ts`](packages/api/src/lib/ai/index.ts)
- **Token Usage / Prompt Management:** View how prompts are managed centrally and structured natively for the AI SDK.

### R3: Security, Hardening & BYOK

**Evidence:** We do not force users to use a shared API key. Users input their own API keys via the Settings UI, which are instantly encrypted via AES-256-GCM before database insertion. The platform also hardens against prompt-injection attacks.

- **AES Encryption:** [`packages/api/src/lib/encryption.ts`](packages/api/src/lib/encryption.ts) (Implements `crypto.createCipheriv` and tag verification).
- **BYOK Endpoint:** [`packages/api/src/router/workspace.ts`](packages/api/src/router/workspace.ts) (Look for `updateApiKeys` TRPC mutation).
- **Prompt Injection Defense:** Strict `zod` schemas force the LLM to output highly specific structural JSON payloads, neutralizing the threat of free-form injection leaks.

### R4: UI/UX & Aesthetics

**Evidence:** The interface was meticulously crafted using custom Glassmorphism components, Tailwind CSS, and Recharts, avoiding standard generic templates.

- **Analytics Visualization:** [`apps/web/app/dashboard/[workspaceId]/analytics/AnalyticsClient.tsx`](apps/web/app/dashboard/[workspaceId]/analytics/AnalyticsClient.tsx) (Custom SVG charting).
- **Core Loop UI:** [`apps/web/components/core-loop.tsx`](apps/web/components/core-loop.tsx)

### R5: Production Readiness & Architecture

**Evidence:** AI operations are inherently slow and prone to standard serverless timeouts. We built the AI pipeline on top of **Inngest** to provide resilient, event-driven background processing that survives server restarts.

- **Inngest Functions:** [`packages/inngest/src/functions/index.ts`](packages/inngest/src/functions/index.ts)
- **Database Schema:** [`packages/db/prisma/schema.prisma`](packages/db/prisma/schema.prisma) (Relational logic handling workspaces, features, PRDs, tasks, and cryptographic sessions).

### R6: Perceived Completeness

**Evidence:** The application is a massive, multi-surface platform rather than a simple wrapper. It includes kanban boards, triage inboxes, analytics, and approval queues.

- **Triage Inbox:** [`apps/web/app/dashboard/[workspaceId]/inbox/page.tsx`](apps/web/app/dashboard/[workspaceId]/inbox/page.tsx)
- **Approval Queue:** [`apps/web/app/dashboard/[workspaceId]/queue/page.tsx`](apps/web/app/dashboard/[workspaceId]/queue/page.tsx)
- **Calendar Heatmap:** [`apps/web/app/dashboard/[workspaceId]/calendar/page.tsx`](apps/web/app/dashboard/[workspaceId]/calendar/page.tsx)

### R7: Demo & Documentation

**Evidence:** Detailed scripts and walkthroughs have been provided for immediate validation without manual setup.

- **Judge Walkthrough:** [`JUDGE_WALKTHROUGH.md`](JUDGE_WALKTHROUGH.md) (The 3-minute timed script).
- **Data Seeding:** [`packages/db/prisma/seed.ts`](packages/db/prisma/seed.ts) (Idempotent seed script that flawlessly generates demo state).
