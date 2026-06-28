# MetroFlow AI: Super Detailed Project Description

## 1. Product Vision & Value Proposition

**MetroFlow AI** is a next-generation, fully autonomous AI Operator for the software delivery lifecycle. While traditional AI developer tools (like Copilot or Cursor) focus on writing code snippets, MetroFlow operates at a higher abstraction level—managing the entire lifecycle of a feature from conception to deployment. 

It acts as both a **Product Manager** and a **Senior Staff QA Engineer** that lives directly within your codebase. The platform enforces a strict, spec-driven engineering culture, ensuring that code is only merged if it perfectly aligns with the generated Product Requirements Document (PRD).

---

## 2. The Problems MetroFlow AI Solves

MetroFlow AI was built to solve the most painful, expensive bottlenecks in modern software engineering teams. By introducing an autonomous AI operator into the loop, it directly addresses the following critical issues:

### 1. Feature Scope Creep & Unclear Requirements
**The Problem**: Features often start as vague, one-sentence Jira tickets (e.g., "Add billing"). Engineers start coding immediately, only to realize halfway through that edge cases were ignored, leading to massive rewrites and scope creep.
**The Solution**: MetroFlow acts as a strict AI Product Manager. It intercepts vague ideas, asks clarifying questions, and forces the generation of a comprehensive Product Requirements Document (PRD). Development cannot begin until the PRD—complete with Acceptance Criteria and Non-Goals—is finalized.

### 2. Developer Misalignment (The Context Gap)
**The Problem**: There is a massive context gap between what the Product Manager wants and what the Engineer actually builds. Code generation tools (like Copilot) can write code fast, but they do not guarantee the code solves the actual business problem.
**The Solution**: MetroFlow bridges this gap by maintaining the PRD as the absolute source of truth. When an engineer opens a Pull Request, the AI reviews the code *specifically* against the PRD's Acceptance Criteria, ensuring perfect alignment between product intent and technical execution.

### 3. QA & Review Bottlenecks
**The Problem**: Pull Requests often sit idle for days waiting for a Senior Engineer to review them. When humans finally review them, they are often fatigued, leading to "LGTM" (Looks Good To Me) approvals that miss critical architectural flaws or edge cases.
**The Solution**: MetroFlow provides instant, tireless AI reviews on every PR. It acts as an autonomous Senior Staff Engineer, rigorously checking the code against the spec, performance metrics, and edge cases before a human ever has to look at it. This reduces PR review cycles from days to seconds.

### 4. Security Oversights During Rapid Shipping
**The Problem**: In the rush to ship, developers often overlook critical security vulnerabilities (e.g., SQL injection, XSS, improper authorization checks).
**The Solution**: MetroFlow's AI Review Loop explicitly checks every PR against the OWASP Top 10 security vulnerabilities. If a blocking security flaw is detected, the AI hard-blocks the PR and prevents merging until it is fixed.

### 5. Duplicate Effort & Wasted Cycles
**The Problem**: On large teams, engineers frequently build features or utilities that already exist, simply because they weren't aware of them.
**The Solution**: During the initial Discovery phase, MetroFlow cross-references new feature requests against the existing codebase and active Kanban board. If a similar feature already exists, the AI alerts the user, preventing wasted engineering cycles.

### 6. Engineering Management Overhead
**The Problem**: Engineering Managers spend a significant portion of their week chasing down status updates, asking "is this done yet?", and manually moving Jira tickets.
**The Solution**: MetroFlow automates status tracking. When a PR is opened, the feature moves to `IN_REVIEW`. If the AI blocks it, it moves to `FIX_NEEDED`. The Kanban board is always 100% accurate without any human intervention.

---

## 3. How It Works Under The Hood (Detailed Technical Workflow)

The MetroFlow AI platform operates on a rigid, highly orchestrated pipeline. Every step transitions the state machine forward in the database.

### Step 1: Discovery & Clarification
- **The Trigger**: A user submits a raw text string to the `/api/trpc/featureRequest.create` endpoint.
- **The AI Processing**: The system constructs a strict system prompt instructing the AI to act as a rigorous Product Manager. Using the **Vercel AI SDK**, it feeds the input to Claude/OpenAI and attempts to generate a structured JSON object defining the problem.
- **Deduplication**: Before confirming, the AI uses vector similarity (or traditional keyword matching on smaller workspaces) to query the PostgreSQL database via Prisma, searching for similar active `FeatureRequest` records. If found, it halts and alerts the user.
- **Clarification Loop**: If the AI determines the prompt lacks sufficient detail (e.g., missing persona definitions or edge cases), it returns a list of clarifying questions instead of a PRD, pausing the state machine in `CLARIFICATION_NEEDED`.

### Step 2: PRD Generation
- **The Action**: Once context is sufficient, the user triggers the `generatePRD` mutation.
- **The Execution**: To avoid Vercel's 10-second serverless timeout limit, this heavy operation is handed off. The tRPC router emits an Inngest event: `inngest.send("prd/generate.requested", { data: { featureId } })`.
- **The Output**: The Inngest background worker uses `generateObject` with Zod schema validation to force the LLM to output a strict PRD JSON structure:
  - `problemStatement` (string)
  - `goals` (string[])
  - `nonGoals` (string[])
  - `userStories` (array of persona, want, soThat)
  - `acceptanceCriteria` (string[])
- The worker then persists this JSON into the `FeatureRequest` Prisma model and advances the status to `PLANNING`.

### Step 3: Task Planning & Breakdown
- **Granular Decomposition**: In the same background Inngest step (or a chained event), the AI is prompted with the newly minted PRD and asked to act as an Engineering Manager.
- **Task Generation**: It generates an array of `Task` objects, complete with titles, descriptions, and estimated story points.
- **Database Persistence**: These tasks are bulk-inserted into PostgreSQL and mapped to the parent `FeatureRequest`. They immediately appear on the React frontend using `@hello-pangea/dnd` for Kanban visualization.

### Step 4: The GitHub Handshake
- **App Installation**: The workspace administrator installs the MetroFlow GitHub App. The OAuth flow completes via `/api/github/setup`, which stores the `installationId` in the workspace database record.
- **Webhooks**: MetroFlow listens to the `/api/webhooks/github` endpoint. When a developer opens a Pull Request, GitHub fires a `pull_request.opened` or `pull_request.synchronize` payload.
- **Mapping**: MetroFlow parses the PR description body for regex patterns like `Closes SF-123` or `Fixes SF-123` (where `SF-123` is the MetroFlow Task ID). It then establishes a relational link in PostgreSQL between the GitHub PR and the MetroFlow Feature.

### Step 5: The Autonomous AI Review Loop (The Gatekeeper)
- **Diff Extraction**: Upon mapping a PR, MetroFlow triggers `inngest.send("review/run.requested")`. The worker uses `@octokit/rest` authenticated as the GitHub App to fetch the raw `git diff` for the Pull Request.
- **Context Assembly**: The worker pulls the full PRD, Acceptance Criteria, and active Tasks from PostgreSQL.
- **Prompt Engineering**: It constructs a massive prompt for the LLM: 
  * "You are a Senior Staff Engineer. Review this git diff. Your sole objective is to verify it fulfills the following PRD. Do not nitpick syntax. Check for business logic alignment, OWASP vulnerabilities, and edge cases. Output an array of issues."
- **Structured Findings**: The Vercel AI SDK parses the response into an array of `ReviewFinding` objects, each with a severity (`BLOCKING` or `NON_BLOCKING`), a file path, a line number, and a comment body.
- **Action**: 
  - If `BLOCKING` issues exist, Octokit posts them as PR comments and uses the `REQUEST_CHANGES` GitHub API to physically block the PR from being merged. The feature status changes to `FIX_NEEDED`.
  - The loop resets on the next git push.

### Step 6: Human Approval & The Command Center
- **The Dossier**: Once the AI review returns 0 blocking issues, the status becomes `IN_REVIEW`.
- **Human Oversight**: A human lead logs into the MetroFlow dashboard. The UI presents the complete "Dossier": the original PRD, the code diff, the AI's sign-off, and the task checklist.
- **Final Sign-Off**: The human clicks "Approve". Only then does the database status change to `SHIPPED`, updating the Kanban board and closing the loop.

---

## 4. Architecture & Monorepo Structure

MetroFlow AI utilizes an enterprise-grade **Turborepo** monorepo architecture. This strictly isolates frontend concerns from backend business logic and database access.

### The Monorepo Map
```text
apps/
  web/                          (Next.js App Router - The Frontend Engine)
    ├── app/(marketing)         Public pages (Landing, Docs, Pricing)
    ├── app/(auth)              BetterAuth authentication flows & callbacks
    ├── app/dashboard           The main SaaS application (Workspaces, Command Center, Kanban)
    ├── app/api/trpc            The single HTTP endpoint for the tRPC server
    ├── app/api/inngest         The HTTP webhook endpoint where Inngest executes background jobs
    ├── app/api/webhooks/github The secure endpoint receiving GitHub App payloads
    └── app/api/webhooks/razorpay The secure endpoint for billing lifecycle events

packages/
  api/                          (tRPC Routers & Core Business Logic)
    ├── src/routers             tRPC routers grouped by domain (featureRequest, tasks, github)
    ├── src/lib                 Stateless utility functions (Octokit wrappers, AI SDK wrappers)
  db/                           (The Data Layer)
    ├── prisma/schema.prisma    The single source of truth for all database tables and relations
    └── src/index.ts            The singleton Prisma Client exported for all packages to use
  inngest/                      (Background Job Definitions)
    ├── client.ts               Inngest client initialization with Event Registry
    └── functions/              Typed event schemas, workflow definitions, and retry policies
  ui/                           (Design System & Shared Components)
    └── src/components          Shadcn UI components, Tailwind configs, and headless primitives
```

### Multi-Tenancy, Security, & RBAC
- **Workspace Isolation**: MetroFlow is a B2B SaaS. Every critical model in the Prisma schema (Features, Tasks, Repositories) contains a mandatory `workspaceId` foreign key. 
- **Role-Based Access Control (RBAC)**: Every tRPC procedure utilizes strict server-side middleware (`assertWorkspaceMember` / `assertProjectAccess`). This middleware queries the `WorkspaceMember` table to enforce that the user has the correct role (`ADMIN`, `LEAD`, or `MEMBER`) before executing queries or mutations, guaranteeing tenant data isolation.

---

## 5. Comprehensive Tech Stack

### Framework & Foundation
- **Core Framework**: Next.js (App Router, v16.2.0)
- **Language**: TypeScript (v5.9)
- **UI Library**: React (v19)
- **Monorepo Management**: Turborepo & NPM Workspaces

### Styling, Animations & UI
- **CSS Framework**: Tailwind CSS (v4) with PostCSS
- **Design System Foundation**: Shadcn UI
- **Headless Accessible Components**: @base-ui/react
- **Drag & Drop Interactions**: @hello-pangea/dnd (Powering the Kanban boards)
- **Iconography**: Lucide React
- **Typography**: Geist Font (Vercel's optimized font)
- **Styling Utilities**: Tailwind Merge, clsx, Class Variance Authority, tw-animate-css

### API, Networking & State Management
- **RPC API Layer**: tRPC (@trpc/server, @trpc/client) for end-to-end type safety between the frontend and backend.
- **Client Data Fetching**: TanStack React Query (@trpc/react-query) for caching, optimistic updates, and polling.
- **Data Serialization**: SuperJSON (allows sending Dates and Maps over the wire natively).

### Database & Authentication
- **Database Engine**: PostgreSQL
- **ORM & Migrations**: Prisma
- **Authentication**: BetterAuth (Supporting Email/Password and GitHub Social OAuth)

### AI, Automation & External Integrations
- **AI Integration Engine**: Vercel AI SDK
- **LLM Providers**: @ai-sdk/openai, @ai-sdk/anthropic, @ai-sdk/google
- **Background Jobs & Event Webhooks**: Inngest (Crucial for handling async AI generation and GitHub PR review webhooks without serverless timeouts)
- **GitHub Integration**: Octokit (@octokit/rest, @octokit/auth-app, @octokit/webhooks) for deep repository access and PR manipulation.
- **Data Validation**: Zod (for strict schema validation across tRPC routes and AI outputs).
- **Payments & Billing**: Razorpay

### Tooling & Code Quality
- **Linters**: ESLint (@next/eslint-plugin-next)
- **Formatters**: Prettier
- **Hosting & CI/CD Deployment**: Vercel
