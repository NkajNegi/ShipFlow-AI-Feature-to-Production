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

---

## 6. Key Differentiators (MetroFlow vs. The Market)

The current AI developer tools market is saturated with code generators (e.g., GitHub Copilot, Cursor). MetroFlow takes a fundamentally different approach:

1. **Not a Code Generator, an Operator**: MetroFlow does not write your code for you; it ensures the code you write is correct, secure, and solves the business problem. It acts as a gatekeeper, not a typist.
2. **Spec-Driven Engineering**: Unlike Copilot, which guesses intent based on local context, MetroFlow enforces a top-down approach. The PRD is the absolute source of truth. If the code deviates from the PRD, it is rejected.
3. **Autonomous Lifecycle Management**: It replaces Jira, Asana, and Linear by maintaining a self-updating Kanban board driven entirely by GitHub PR events and AI status checks.
4. **Hard Security Blocking**: It actively blocks merges at the GitHub API level if OWASP vulnerabilities are detected, preventing human error from sneaking into production.

---

## 7. Target Audience & Ideal Customer Profile (ICP)

MetroFlow AI is designed for high-velocity software engineering teams that prioritize code quality and architectural integrity over sheer typing speed.

- **Fast-Scaling Startups (Seed to Series B)**: Small teams lacking dedicated QA or Product Management layers can use MetroFlow as their autonomous PM and Staff Engineer to maintain high standards without massive headcount overhead.
- **Asynchronous & Remote Teams**: Teams distributed across time zones often suffer from multi-day delays on PR reviews. MetroFlow provides instant, high-quality reviews 24/7, unblocking developers immediately.
- **Open Source Maintainers**: Large open-source projects receive hundreds of PRs from unknown contributors. MetroFlow can automatically review them against the project's standards, drastically reducing the maintainer's burden.
- **CTOs & Engineering Managers**: Leaders who want a macro-view of feature velocity, AI review metrics, and team health through the centralized Command Center.

---

## 8. Deployment & Infrastructure Architecture

MetroFlow is designed to be highly available and globally distributed, relying heavily on modern serverless paradigms.

### 1. The Frontend & API (Vercel)
- The entire Next.js application (including the tRPC API and webhook endpoints) is deployed on **Vercel**.
- This provides Edge caching, zero-configuration CI/CD, and global CDN distribution.
- Because Vercel serverless functions have execution timeouts (typically 10 to 60 seconds), long-running AI operations cannot be executed synchronously here.

### 2. The Background Engine (Inngest)
- **Inngest** serves as the backbone for all heavy lifting. It acts as an event-driven queue and background job runner.
- When Vercel receives a webhook from GitHub or a user action, it pushes an event to Inngest and immediately returns a `200 OK`.
- Inngest invokes the background functions (which are technically hosted on Vercel but orchestrated by Inngest to bypass standard timeouts via step functions and retries).
- This ensures that if the LLM API times out or rate-limits, Inngest automatically retries the job with exponential backoff without dropping the GitHub webhook.

### 3. The Database (PostgreSQL & Prisma)
- Hosted on a managed PostgreSQL provider (e.g., Supabase or Neon).
- Prisma acts as the connection pooler and ORM, ensuring type-safe queries. The database maintains the strict schema for workspaces, feature requests, tasks, and historical AI reviews.

### 4. The Third-Party Pillars
- **GitHub App**: Hosted on GitHub, authenticating via rotating private keys to fetch diffs and post comments.
- **Anthropic / OpenAI**: The LLM APIs executing the `generateObject` calls.
- **Razorpay**: The payment gateway handling subscription webhooks and invoicing.

---

## 9. The AI Multi-Model Synthesis Engine (How many AIs are we using?)

A common problem with single-model AI agents is hallucinations and logic blindness. To solve this, MetroFlow AI employs a **Multi-Model Synthesis Engine**. We do not rely on a single AI; instead, we orchestrate a committee of state-of-the-art models working in tandem.

### The "Committee of Experts" Architecture
Depending on the user's workspace configuration, the system concurrently queries multiple models using the Vercel AI SDK:
1. **Anthropic Claude 3.5 Sonnet**: The primary driver for code review and PRD generation due to its massive context window and reasoning capabilities.
2. **OpenAI GPT-4o**: Used for rapid categorization, intent extraction, and fallback reasoning.
3. **Google Gemini 1.5 Pro**: Used for synthesizing massive amounts of codebase context and documentation.
4. **OpenRouter**: Integrated for routing to specialized models (like Llama 3) if the primary providers rate limit or fail.

### How The Synthesis Works
During highly complex operations (like defining the initial PRD):
1. **Drafting Phase**: The system fires concurrent requests to Anthropic, OpenAI, and Gemini. Each model generates its own "draft" of the PRD based on the same user input.
2. **Synthesis Phase**: A powerful synthesizer model (usually Claude 3.5 Sonnet) takes the drafts from all three underlying models, evaluates the strengths of each, removes hallucinations, and produces the final, mathematically validated JSON structure via Zod. This guarantees unparalleled accuracy.

---

## 10. End-to-End System Handoff (The Granular Flow)

How exactly does data move through the system without dropping? Here is the exact lifecycle of a request:

1. **Client Action (React)**: User clicks "Create Feature". A React Server Action or tRPC mutation is triggered.
2. **tRPC Validation**: The `api` package validates the request using Zod. It verifies the user's JWT (via BetterAuth) and confirms they have `LEAD` or `ADMIN` access to the workspace in PostgreSQL.
3. **Database Pre-Flight**: The feature is created in PostgreSQL with status `GENERATING_PRD`. The UI immediately reflects this loading state.
4. **The Webhook Fire-and-Forget**: The tRPC endpoint calls `inngest.send("prd/generate.requested", { featureId })`. The HTTP request terminates, freeing up the Vercel serverless function.
5. **Inngest Orchestration**: The Inngest engine picks up the event. It orchestrates the AI Synthesis (described in Section 9). It has automatic exponential backoff—if OpenAI returns a 429 Rate Limit error, Inngest pauses the function and retries it 3 minutes later. The process never dies.
6. **Database Fulfillment**: The Inngest worker saves the generated PRD to PostgreSQL and fires a new event to generate Tasks.
7. **Client Hydration**: The user's browser, which has been polling via TanStack React Query, sees the database update and visually reveals the Kanban board.
8. **GitHub Handshake**: Weeks later, a developer pushes code. GitHub fires an HTTP POST to `/api/webhooks/github`. 
9. **Octokit Translation**: The Next.js webhook handler verifies the cryptographic signature from GitHub. It extracts the commit SHA, maps it to the Feature ID via regex, and fires `inngest.send("review/run.requested")`.
10. **The Block**: Inngest fetches the diff, the AI reviews it, and if it fails, Octokit uses the GitHub App token to submit a `REQUEST_CHANGES` review, actively blocking the merge button on GitHub.

---

## 11. Local Development Setup & How to Run

MetroFlow AI is a massive monorepo. To run it locally, you must orchestrate the frontend, the database, and the background job runner.

### Prerequisites
- **Node.js**: v18 or v20
- **Package Manager**: npm (v10+)
- **Database**: PostgreSQL (Docker, Neon, or local install)

### Step-by-Step Setup

1. **Clone & Install dependencies**:
   ```bash
   git clone <repo_url>
   cd ShipFlow-AI-Feature-to-Production
   npm install
   ```

2. **Environment Variables**:
   Copy the example environment files in `apps/web`.
   ```bash
   cp apps/web/.env.example apps/web/.env
   ```
   *Crucial variables to fill in:*
   - `DATABASE_URL`: Your local or remote PostgreSQL connection string.
   - `BETTER_AUTH_SECRET`: A random 32-character string.
   - `OPENAI_API_KEY` / `ANTHROPIC_API_KEY`: Required for the AI generation to work.
   - `INNGEST_EVENT_KEY`: Can be set to `local` for dev.

3. **Database Push**:
   Sync the Prisma schema to your PostgreSQL database.
   ```bash
   npm run db:push --workspace=@repo/db
   ```

4. **Start the Inngest Dev Server**:
   In a separate terminal tab, you must run the Inngest local engine. Without this, no background jobs (like AI PRD generation) will ever execute.
   ```bash
   npx inngest-cli@latest dev
   ```

5. **Start the Turborepo Application**:
   In your main terminal, start the entire monorepo stack.
   ```bash
   npm run dev
   ```
   *This command leverages Turborepo to simultaneously start the Next.js frontend (`localhost:3001`), the tRPC router, and watch the local packages for changes.*

### How to test GitHub Webhooks locally?
Because GitHub cannot send webhooks to `localhost`, you must use a tunneling service like **ngrok** or **Cloudflare Tunnels**.
1. Run `ngrok http 3001`
2. Go to your GitHub App settings on GitHub.com and set the Webhook URL to `https://<your-ngrok-url>.ngrok.app/api/webhooks/github`.
3. Push code to a linked test repository to watch the Inngest worker pick up the webhook in real-time!
