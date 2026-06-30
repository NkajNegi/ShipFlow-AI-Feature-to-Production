# MetroFlow AI — Gaps & Improvements

> Numbered, build-one-by-one backlog vs. the competitor (Qship / "ShipFlow AI").
> **Re-audited against the live codebase on 2026-06-30** — the original plan is now ~95% built.
> This file leads with **what's left**, then keeps the original plan as a completed checklist
> and the competitor comparison as reference.

---

## ⭐ REMAINING WORK (prioritized) — start here

Everything in the original Phases 1–9 is done **except** the items below. Ordered by impact.

### R0 — Make CI green: fix the 9 web type errors  🔴 BLOCKER · R5
**Why first:** `.github/workflows/ci.yml` runs `npm run check-types`, but `apps/web` emits **9
TypeScript errors**, so CI is currently **red**. A failing CI is worse than none for judging.
They're masked locally only because `next.config.ts` sets `typescript.ignoreBuildErrors: true`.
- [ ] Fix `AgentClient.tsx` (6 errors) — migrate off the old `useChat` API (`input`,
      `handleInputChange`, `handleSubmit`, `isLoading`, `setInput`, `api`) to the current
      `@ai-sdk/react` v2 shape (transport + `sendMessage`), removing the `@ts-ignore`.
- [ ] Fix `app/api/chat/route.ts` (1) — `maxSteps` moved; use `stopWhen: stepCountIs(n)`.
- [ ] Fix `lib/auth-client.ts` (1) — `forgetPassword` → `requestPasswordReset` (better-auth 1.1).
- [ ] Fix `dashboard/[workspaceId]/page.tsx:684` (1) — null-guard `t.project`.
- [ ] Then set `ignoreBuildErrors: false` so CI actually protects the build.
- **Depends on:** none. **Effort:** 🔴 (the AgentClient migration is the bulk).

### R1 — Sync the live deployment with the new code  🟡 · R1/R7
The deployed instance predates B1 (codegen), B2 (walkthrough), and the demo-login fix.
- [ ] Run `db push` against the production DB so `CodegenRun` + `Task.walkthroughJson/Step`
      tables exist.
- [ ] Deploy the **demo-login cookie-signing fix** (`app/api/demo-login/route.ts`) — without
      it the one-click judge demo bounces to `/login`.
- [ ] Set `CODEGEN_ENABLED=true` (and confirm AI provider keys) on the deploy so the
      "Generate implementation" button works in the demo.
- **Depends on:** none.

### R2 — Approval briefing + duplicate detection (8a/B3)  🟡 · R4
The only un-built feature from the "beat them" set.
- [ ] `generateApprovalBriefing` — summarize PRD + review history + risks for the human PM
      before they approve (surface it in the `/queue` and feature command center).
- [ ] `detectSimilarFeatureRequests` — semantic duplicate detection on intake (today we only do
      basic clarify). Run it through the ensemble for an edge.
- **Depends on:** review stats (done). **Effort:** 🟡.

### R3 — Agent UX depth  🔴 · R2
Our agent is a basic chat (~186 LOC) vs. theirs (~1,580 LOC). Biggest *qualitative* gap.
- [ ] Session history sidebar (persist + list past agent conversations).
- [ ] Inline action / walkthrough panels rendered when a tool runs (reuse B2's walkthrough).
- [ ] **Multi-provider chips** on agent messages ("drafted across 3 providers") — visible proof
      of our edge that their single-model agent can't show.
- **Depends on:** existing agent + tools. **Effort:** 🔴.

### R4 — Propagate skeleton + error states  🟢 · R5/R6
Only the Projects page uses the new `SkeletonList` / `QueryError`. Apply the same 3-line pattern
to the other list pages: **board, reviews, commits, analytics, inbox, queue**.
- [ ] Each already has `isLoading`/`isError`; swap the spinner for `<SkeletonList/>` and add
      `<QueryError onRetry={refetch}/>`.
- **Depends on:** none. **Effort:** 🟢.

### R5 — (Optional) tRPC v11 upgrade  🔴 · R5
Functional parity today; only if time allows. **Recommend skipping before judging.**

---

## ✅ DONE — original plan completion (audited 2026-06-30)

| # | Item | Status |
|---|---|---|
| 1.1 | Repo hygiene (pkg renamed `metroflow-ai`, `.DS_Store`/design gitignored) | ✅ |
| 1.2 | `/api/health` + `/api/ready` (DB ping) | ✅ |
| 1.3 | DB indexes (now **14**) | ✅ |
| 1.4 | Richer PRD (technical/security/testing/rollback) + editor | ✅ |
| 2.1 | CI pipeline (`ci.yml`: static / test+postgres / e2e) | ✅ (but red — see R0) |
| 2.2 | Unit tests (access, credits, crypto, plan, review, webhook, codegen, walkthrough) | ✅ |
| 2.3 | Playwright E2E (`happy-path.spec.ts`) | ✅ |
| 3.1 | Review `iteration` tracking | ✅ |
| 3.2 | Delta re-review (RESOLVED/PARTIALLY/UNRESOLVED) | ✅ |
| 3.3 | Review stats (pass rate, etc.) | ✅ |
| 3.4 | 9-dimension review (`dimensionsJson`) | ✅ |
| 4.1 | Diff pagination + per-file truncation + binary exclusion | ✅ |
| 4.2 | Installation token cache (55-min) + eviction | ✅ |
| 4.3 | `installation.deleted` / repos.removed handling | ✅ |
| 4.4 | Update-in-place PR review comment | ✅ |
| 5.1 | Live deployment + seed | ✅ (re-sync needed — R1) |
| 5.2 | One-click demo login | ✅ (cookie-signing fixed) |
| 6.2 | `/analytics` dashboard | ✅ |
| 6.3 | `/queue` approval queue | ✅ |
| 6.4 | `/inbox` intake | ✅ |
| 7.1 | `JUDGE_WALKTHROUGH.md` | ✅ |
| 7.2 | `AI_EVAL.md` | ✅ |
| 8.1–8.3 | Agent tool registry + `/agent` chat + `/api/mcp` server | ✅ (depth pending — R3) |
| 8a/B1 | AI codegen through ensemble + critic (draft PR) | ✅ |
| 8a/B2 | Task walkthrough ("Explain") + agent parity tools | ✅ |
| 8a/B4 | Docs lead with multi-provider/BYOK/ensemble moat | ✅ |
| 9.2 | OpenAPI (`/api/openapi.json`) + Scalar docs (`/api/docs`) | ✅ |
| 9.3 | SQL enums for status fields | ✅ |
| 9.4 | Extra FSM states (`PLAN_APPROVED`, `DUPLICATE_EDUCATION`) | ✅ |

**Open:** R0 (CI green), R1 (deploy sync), R2 (8a/B3), R3 (agent depth), R4 (skeleton spread), R5 (tRPC v11, optional).

---

## Updated rubric estimate

| # | Criterion | Weight | Qship | Us (was → now) |
|---|---|--------|------|------|
| R1 | Core Workflow | /20 | ~19 | 17 → **~19** |
| R2 | AI Agent Quality | /20 | ~19 | 11 → **~16** (→18 with R3) |
| R3 | GitHub Integration | /15 | ~14 | 10 → **~14** |
| R4 | Review Loop & Approval | /15 | ~14 | 9 → **~14** (→15 with R2) |
| R5 | tRPC Monorepo & Eng | /15 | ~14 | 8 → **~13** (→14 with R0) |
| R6 | SaaS Experience | /10 | ~9 | 7 → **~9** |
| R7 | Demo & Docs | /5 | ~5 | 3 → **~5** |
| | **Total** | **/100** | **~94** | 65 → **~90** (→~95 with R0–R3) |

We've closed almost the entire gap. The remaining points are R0 (credibility), R2/R3 (AI depth
— where we can pull *ahead*), and polish.

---

## Reference: our edges Qship can't match (keep in the pitch)

- ✅ **Multi-provider AI + BYOK** (Anthropic/OpenRouter/Google/OpenAI, AES-256-GCM, ensemble +
  critic) — they're OpenAI-only. Our single clearest technical advantage.
- ✅ **Prompt-injection hardening** — `<untrusted>` tags + two-pass QA validation.
- ✅ **Codegen + walkthroughs run through the ensemble** — provably better than single-model.
- ✅ **Commit-level review** — they review at PR level only.
- ✅ **Webhook idempotency**, **durable Inngest workflows**, PRD `assumptions` field.

---

## Reference: competitor snapshot (cloned `ishaansatapathy/Qship` @ 2026-06-30)

Larger, fully-tested, deployed product (~41.5k LOC, 63 tests, 37 tools, 53 migrations, real CI,
10 docs). We've now matched the verifiable layer (CI, tests, deploy, demo, docs, OpenAPI, agent,
MCP) and lead on AI architecture. Their remaining edges are breadth (more AI tools/surfaces) and
agent UX polish — addressed by R2/R3 above.

---

## Suggested order
**R0 → R1 → R4 → R2 → R3.** (R0 first: a green CI + clean build is fast and underpins
credibility. R1 next: the demo must actually run the new features. R4 is a quick polish sweep.
R2/R3 are the AI-depth investments that push us ahead — do them last and as time allows.)
