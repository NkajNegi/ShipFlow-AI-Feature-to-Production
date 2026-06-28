# MetroFlow AI - Product Requirements Document (PRD)

## Project Overview
MetroFlow AI is a complete AI-assisted product delivery platform that helps software teams move features from idea to production through a structured workflow. It acts as an "AI Operator for Software Development," managing the entire software delivery lifecycle and replacing pure code-generation with a disciplined, review-driven workflow.

## The Core Loop
The fundamental workflow of MetroFlow is:
**Feature Request → Product Thinking → PRD → Tasks → Implementation → Review → Fixes → Approval → Release**

## Workflow Phases

### Phase 1: Product Discovery
- **Trigger:** A customer submits a feature request (via email, support ticket, or UI).
- **AI Clarification:** The AI Agent acts as a Product Manager, gathering missing requirements by asking follow-up questions to gather context.
- **Validation:** 
  - Not every request requires a build. 
  - If the requested feature already exists, the platform educates the user.
  - If the request is valid and new, the workflow proceeds.
- **PRD Generation:** The AI Agent generates a structured PRD plan containing:
  - Problem statement, Goals, and Non-goals
  - User stories, Acceptance criteria, Edge cases, and Success metrics

### Phase 2: Planning
- **Task Breakdown:** The MetroFlow Agent converts the PRD into actionable engineering tasks.
- **Task Management:** Tasks are organized and tracked on a Kanban board.
- **Approval:** Software teams review and approve the plan to move to the next phase.

### Phase 3: Development
- **Integration:** Code repository is connected through GitHub (using Octokit).
- **Implementation:** Developers or coding agents implement the feature request according to the PRD.
- **Pull Requests:** PRs are created with new code changes intended to meet the PRD.

### Phase 4: AI Review Loop
- **Automated QA & Code Review:** An AI-powered QA Agent reviews the pull request against:
  - PRD requirements & Acceptance criteria
  - Engineering tasks
  - Security concerns & Performance considerations
  - Edge cases & Code quality
- **Issue Categorization:** Issues are flagged as either **Blocking** or **Non-blocking**.
- **Fix Cycle:** If blocking problems are found:
  - The feature returns to a `fix-needed` state.
  - Developers/Agents update the implementation.
  - The QA Agent re-reviews the new code.
  - This cycle continues until the code is ready.

### Phase 5: Human Approval
- **Final Verification:** A human reviewer verifies the PRD, tasks, PR, AI review history, and any outstanding non-blocking issues.
- **Decision:** The human approves or rejects the release.
- **Release:** Only approved features can be moved to `Shipped`.

---

## Technical Implementation Strategy (Phases 1-5)
To implement the end-to-end workflow technically, we will leverage the **Vercel AI SDK** for intelligent processing, **Inngest** for reliable async background jobs, and **tRPC/Prisma** for state management.

### Phase 1 Strategy (Discovery)
- **Ingestion:** A dedicated internal Next.js form and a simulated API webhook endpoint for MVP ingestion.
- **AI UI:** Next.js `useChat` hook powers the interactive PM interface.
- **Context Checking:** The AI searches existing PRDs (using `pgvector` in PostgreSQL) before proceeding.
- **Generation:** Once context is gathered, an Inngest background job triggers `generateObject` via the AI SDK to format a strict PRD schema and saves it to PostgreSQL using Prisma.

### Phase 2 Strategy (Planning)
- **Task Generation:** We pass the saved PRD to the AI SDK using `generateObject` to enforce an array of JSON objects representing engineering tasks.
- **UI & State:** A drag-and-drop Kanban board built with Shadcn UI. Moving a task triggers a tRPC mutation to instantly update the task status in the database.

### Phase 3 Strategy (Development)
- **Repo Mapping:** The GitHub App handles authentication. Developers include the MetroFlow Task ID in the PR description (e.g., `Closes SF-123`).
- **Webhook Sync:** Our GitHub webhook listener reads the PR description and maps the PR in GitHub to the specific PRD and Tasks in our PostgreSQL database.

### Phase 4 Strategy (AI Review Loop)
- **Trigger:** GitHub sends a `pull_request` event. Our Next.js API pushes an event to **Inngest**.
- **Execution:** Inngest uses Octokit to download the raw code diff, queries Prisma for the related PRD and Tasks, and sends the payload to the AI model.
- **Feedback Generation & Posting:** The AI acts as a QA Engineer. `generateObject` forces an array return of issues (BLOCKING or NON_BLOCKING). Octokit posts BLOCKING issues as "Changes Requested" on GitHub, updating the DB status to `FIX_NEEDED`.

### Phase 5 Strategy (Approval)
- **Command Center:** A Next.js Server Component aggregates the PRD, Kanban board, GitHub PR status, and the complete AI review history.
- **RBAC & Release Action:** Only users with the 'Admin' or 'Lead' role can approve. Clicking "Approve & Ship" triggers a tRPC mutation that updates the database status to `SHIPPED` and (optionally) merges the PR via Octokit.

---
## NEW: Extended Ideas & Platform Upgrades 🚀

### 1. Advanced DevTool Integrations
- **Issue Tracking (Internal):** The MetroFlow Kanban board serves as the single source of truth for the MVP. No external sync to Jira/Linear is required at this stage.
- **Communication:** Slack/Discord bot integrations. The AI sends a message when a PRD is ready for review, or when a PR fails the AI Review Loop.
- **CI/CD Triggers:** Hook into Vercel/GitHub Actions so the AI Review only runs after the CI build passes.

### 2. Deep AI Capabilities
- **Automated Test Generation:** The AI doesn't just review code; it suggests missing Unit Tests based on the Acceptance Criteria in the PRD.
- **Security Vulnerability Scanning:** Deep integration with AI models to detect OWASP top 10 vulnerabilities during the AI Review Loop.
- **Context-Aware Memory:** The AI remembers past PRDs and codebases, ensuring that new features don't conflict with older ones.

### 3. Modern SaaS Landing Page (Inspired by metroflow.ai/air)
The landing page should be built to convert developers and CTOs:
- **Hero Section:** "Your AI Operator for Software Delivery. Move from idea to production 10x faster with AI-driven PRDs and automated QA."
- **Interactive Terminal/Dashboard Demo:** A live, Framer-style interactive mock of the AI generating a PRD right on the hero section.
- **Bento Box Feature Grid:** Highlighting the Core Loop phases visually (Discovery, Planning, Dev, QA, Ship).
- **Theme & Branding:** Black, Gold, and Soft White Lights. Not a pure dark mode. The focus areas must be soft white, highlights in gold, and dark everywhere else for a highly contrasted, premium aesthetic.

### 4. Analytics & Dashboards
- **Velocity Tracking:** Measure how much time the AI saves by tracking the time between "Feature Request" and "Shipped".
- **AI Review Metrics:** Show developers how many bugs were caught by the AI before human review.

---

## SaaS Requirements & Architecture
The platform must support multi-tenant organizations. Each workspace will have its own isolated Users, Projects, Repositories, Feature requests, PRDs, Tasks, Review history, and Billing status.

### Billing & Authentication
- **Authentication:** Handled via **BetterAuth**.
- **Billing:** Handled via **Razorpay**.
- Examples of billing constraints: Free vs. paid plans, usage limits, AI review credits, repository limits, and premium workflow features.

## GitHub Integration Requirements & Strategy
GitHub integration via **Octokit** is mandatory. Hardcoded PR data is not allowed. The implementation strategy involves building a GitHub App:

1. **GitHub App Configuration:** Create a GitHub App in Developer Settings to obtain a Private Key and Webhook Secret.
2. **Installation Flow:** Redirect users to the GitHub App installation URL so they can grant MetroFlow access to specific repositories. Save the `installation_id` to their Workspace in PostgreSQL.
3. **Repository Sync (Octokit):** Use `@octokit/auth-app` and the `installation_id` to act on behalf of the user, fetching accessible repositories.
4. **Webhook Listener:** A Next.js API route (`/api/webhooks/github`) to listen for `pull_request` events, validating the payload signature.
5. **AI Review Trigger (Inngest):** Webhooks trigger an Inngest background job to fetch code diffs via Octokit, pass them alongside the PRD to the AI SDK, and post structured feedback (blocking vs. non-blocking) directly as a PR comment.

## Technology Stack & Architecture Strategy
Built as a **tRPC Monorepo** ensuring type-safety and scalability.

### 1. Monorepo Structure (Turborepo)
- **`apps/web`**: Next.js App Router for UI (Marketing, Auth, Dashboards) using **Shadcn UI**.
- **`packages/api`**: Core **tRPC** routers for end-to-end type safety.
- **`packages/db`**: **Prisma** schema and **Vercel Postgres** database client.
- **`packages/inngest`**: Background job definitions for AI workflows.

### 2. Multi-tenant SaaS & BetterAuth
- **BetterAuth** handles session management inside Next.js.
- Prisma schema isolates data using a `workspaceId` foreign key on all core models.
- Custom tRPC middleware enforces workspace-level data separation.

### 3. Billing & Limits (Razorpay)
- **Tiers:** Free Tier (1 Workspace, 3 Projects) and Pro Tier (Unlimited Projects, advanced AI models).
- Razorpay handles checkout and subscriptions.
- A webhook (`/api/webhooks/razorpay`) updates the Prisma `Subscription` table upon successful payment.
- tRPC middleware enforces usage limits (e.g., verifying `ai_review_credits > 0` before triggering an AI task).

### 4. Async Workflows (Inngest) + Vercel AI SDK
- Heavy AI operations (PRD generation, Code Reviews) are offloaded to **Inngest** to bypass Vercel's serverless timeouts.
- The **Vercel AI SDK** (`generateObject`) runs inside Inngest functions, while the Next.js UI polls or uses Server-Sent Events to display loading states. We will default to **Anthropic Claude 3.5 Sonnet** for its superior code evaluation capabilities.

### 5. Product Experience (Next.js App Router)
- `app/(marketing)/page.tsx` → Landing Page
- `app/(auth)/login/page.tsx` → BetterAuth login screen
- `app/(dashboard)/[workspaceId]/...` → Workspace UI (PRD Editor, Kanban Board, AI Review History).

### 6. Mobile Responsiveness Strategy
The entire platform will be built mobile-first using **Tailwind CSS**. 
- Utility classes (`sm:`, `md:`, `lg:`) will restructure complex layouts like the Kanban board into vertical lists on small screens.
- Desktop sidebars will convert into bottom sheets or hamburger-menu drawers on mobile devices.
- The PRD Editor will scale gracefully to fit mobile viewports, ensuring product managers can approve PRDs from their phones.

**Hosting / Deployment:** Vercel

## Rules & Guidelines
- Proper monorepo structure with separate apps and packages.
- Webhook handling is required for GitHub events.
- Public GitHub repository and a deployed live project are mandatory.
- A Demo video and detailed README are mandatory.

*Builder Mode On | iPhone Giveaway Hackathon*
*#chaicode*
