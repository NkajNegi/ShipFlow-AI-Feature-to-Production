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

## 3. The Core Loop (Detailed Workflow)

The MetroFlow AI platform operates on a rigid pipeline, ensuring quality at every step:

### Step 1: Discovery & Clarification
- A user submits a raw, unstructured idea (e.g., "Add SSO login").
- The **AI Product Manager** intercepts the request. Instead of blindly executing, it cross-references the idea against the existing codebase and active feature requests to prevent duplication.
- If the request is ambiguous, the AI asks follow-up questions to gather missing context.

### Step 2: PRD Generation
- Once the scope is clear, MetroFlow generates a highly structured Product Requirements Document (PRD).
- The PRD strictly defines:
  - **Problem Statement**: Why this feature is being built.
  - **Goals & Non-Goals**: What is explicitly out of scope to prevent scope creep.
  - **User Stories**: Persona-driven requirements.
  - **Acceptance Criteria**: The exact conditions that must be met for the feature to be considered "done".
  - **Edge Cases & Security**: Foreseen constraints and security considerations.
  - **Success Metrics**: How the feature's success will be measured post-launch.

### Step 3: Task Planning
- The PRD is automatically broken down into granular, actionable engineering tasks.
- These tasks are populated onto an interactive, drag-and-drop Kanban board within the platform.
- Engineering leads can review, reassign, or modify tasks before development begins.

### Step 4: Development & GitHub Integration
- A native **GitHub App** seamlessly connects the workspace to the user's repositories.
- Developers write code as usual. When they open a Pull Request, they reference the MetroFlow task ID (e.g., `Closes SF-123`).
- MetroFlow listens to GitHub webhooks and automatically maps the PR to the specific feature and task in its database.

### Step 5: The AI Review Loop (The Gatekeeper)
- This is the core technical differentiator. When a PR is opened or updated, MetroFlow triggers an async review job via Inngest.
- The **AI QA Agent** pulls the raw git diff via Octokit and compares every line of code strictly against the corresponding PRD and Acceptance Criteria.
- It evaluates the code for:
  - Business logic alignment (Does it actually do what the PRD asked?)
  - OWASP Top 10 Security vulnerabilities
  - Performance bottlenecks
  - Edge cases defined in the PRD
- The AI classifies its findings into **BLOCKING** (must be fixed) or **NON_BLOCKING** (suggestions).
- If blocking issues are found, the AI posts actionable comments directly on the GitHub PR and transitions the feature status to `FIX_NEEDED`. The PR cannot be merged until all blocking issues are resolved.
- This loop runs automatically on every subsequent git push until the AI gives a passing grade.

### Step 6: Human Approval & Shipping
- Once the AI Review passes, the feature lands in the **Command Center**.
- The Command Center aggregates the original PRD, the completed tasks, the PR diffs, and the complete AI review history into a single view.
- Human engineering leads review this aggregated dossier and make the final decision to approve. Only then does the feature state transition to `SHIPPED`.

---

## 4. Architecture & Data Flow

MetroFlow AI utilizes a modern, enterprise-grade architecture leveraging a **Turborepo** monorepo. This strictly separates frontend applications from shared backend logic, database schemas, and background jobs.

### Monorepo Structure
```text
apps/
  web/                          (Next.js App Router)
    ├── app/(marketing)         Landing pages, docs, pricing
    ├── app/(auth)              BetterAuth authentication flows
    ├── app/dashboard           SaaS Dashboard, Workspaces, Kanban, Command Center
    ├── app/api/trpc            tRPC HTTP handler for client-server RPC
    ├── app/api/inngest         Webhook endpoint for Inngest background jobs
    ├── app/api/webhooks/github Signature-verified GitHub PR webhooks
    └── app/api/webhooks/razorpay Razorpay billing webhooks

packages/
  api/                          (tRPC Routers + Business Logic)
    ├── src/routers             tRPC routers (featureRequest, tasks, reviews, etc.)
    ├── src/lib                 Core logic for AI, GitHub API, Billing, PRD generation
  db/                           (Database Layer)
    ├── prisma/schema.prisma    Single source of truth for the database schema
    └── src/index.ts            Instantiated Prisma Client
  inngest/                      (Background Job Schemas)
    ├── client.ts               Inngest client initialization
    └── functions/              Typed event schemas and workflow definitions
  ui/                           (Shared UI Primitives)
    └── src/components          Shadcn UI components and design system tokens
```

### Async Data Flow (The Inngest Engine)
Long-running AI tasks (like reading large Git diffs and generating massive PRDs) cannot be handled in standard serverless HTTP requests due to timeouts. MetroFlow uses **Inngest** for reliable background job execution.

**Example: The PRD Generation Flow**
1. User clicks "Generate PRD" on the frontend.
2. The Next.js client calls a tRPC mutation: `prd.generate`.
3. The tRPC router updates the database status to `GENERATING_PRD` and fires an event: `inngest.send("prd/generate.requested")`. It then immediately returns a `200 OK` to the client.
4. The Inngest worker picks up the event in the background, invokes the Vercel AI SDK (`generateObject` with Claude/OpenAI), and processes the prompt.
5. Once generation is complete, the Inngest worker saves the PRD and tasks back to the database via Prisma and updates the status to `PLANNING`.
6. The frontend, which is polling via TanStack React Query, automatically updates the UI.

### Multi-Tenancy & Security
- **Workspace Isolation**: The database schema is strictly partitioned by `workspaceId`. 
- **RBAC (Role-Based Access Control)**: Every tRPC procedure utilizes middleware (`assertWorkspaceMember` / `assertProjectAccess`) to enforce that the user has the correct role (ADMIN, LEAD, or MEMBER) before executing mutations.

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
