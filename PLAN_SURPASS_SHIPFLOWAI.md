# Plan — Surpass ShipFlowAI on UI breadth (Review SLA · Activity · Shipped)

> Competitor `Ayush-Panda-design/ShipFlowAI` leads us only on UI surface breadth (25 surfaces).
> We already lead on AI depth (multi-provider + ensemble + critic + BYOK, agent, MCP, tests) —
> they're **Gemini-only, no agent, no MCP, 3 tests**. These 3 surfaces close their one advantage.
>
> Verified against our live schema on 2026-06-30.
> Build order: **2 (Activity) → 3 (Shipped) → 1 (Review SLA)** — quick wins first, SLA is the
> distinctive headline feature.

---

## What our schema already gives us
- `FeatureRequest`: `status` (enum incl. `IN_REVIEW`, `APPROVED`, `SHIPPED`, `REJECTED`),
  `approvedAt`, `shippedAt`, `createdAt`, `updatedAt`. **No SLA/entered-review timestamp yet.**
- `Workspace`: no SLA setting yet.
- `AuditLog` (workspaceId, actorId, actorName, action, target, createdAt) — **activity feed source.**
- `WorkflowRun` (type, label, featureRequestId, status, createdAt) — AI-run activity source.
- Status flips to `IN_REVIEW` in `packages/api/src/lib/review.ts` — **the hook point for SLA.**
- `/queue` page (server component) already filters `status in [PLANNING, IN_REVIEW]` — where
  breach badges go.

---

## 1. ⭐ Review SLA — deadline + breach tracking  🟡 (R4, headline)

**Concept:** every feature entering human review/approval gets a deadline (`reviewDueAt`).
Past the deadline while still un-actioned = **breached**. Surface time-remaining/overdue on the
queue, the feature page, and a dedicated SLA dashboard.

### 1.1 — Schema
**File:** `packages/db/prisma/schema.prisma`
- [ ] `Workspace`: add `reviewSlaHours Int @default(24) @map("review_sla_hours")`.
- [ ] `FeatureRequest`: add
  - `reviewDueAt DateTime? @map("review_due_at")` — deadline, set on entering review.
  - `reviewStartedAt DateTime? @map("review_started_at")` — when it entered review (for "time in review").
  - `@@index([status, reviewDueAt])` for efficient breach queries.
- [ ] `npm run db:generate && db push`.

### 1.2 — Set/clear the deadline on status transitions
**File:** `packages/api/src/lib/review.ts` (and anywhere status → `IN_REVIEW`)
- [ ] When a feature transitions **into** `IN_REVIEW` (or `human_review`), if `reviewStartedAt`
  is null: set `reviewStartedAt = now`, `reviewDueAt = now + workspace.reviewSlaHours hours`.
- [ ] On `APPROVED` / `SHIPPED` / `REJECTED`: leave timestamps for history but treat as "closed"
  (no longer breachable). On re-review loops, **don't** reset the clock (keeps SLA honest).
- [ ] Add a tiny pure helper `computeSlaState(reviewDueAt, status, now)` →
  `{ state: "on_track" | "due_soon" | "breached" | "closed", hoursRemaining }`
  (`due_soon` = <25% of window left). **Pure function → unit-testable (mirror B1/B2 tests).**

### 1.3 — tRPC: SLA queries + setting
**File:** `packages/api/src/routers/review.ts` (extend) + workspace settings router
- [ ] `review.slaBoard` query: features currently in review/approval for the workspace, each with
  `computeSlaState`, sorted by `reviewDueAt` asc. Returns counts `{ onTrack, dueSoon, breached }`.
- [ ] `workspace.setReviewSla` mutation (ADMIN/LEAD): update `reviewSlaHours` (clamp 1–720).
- [ ] (Optional) include SLA state in the existing `getReviewStats`.

### 1.4 — SLA dashboard page
**File:** `apps/web/app/dashboard/[workspaceId]/review-sla/page.tsx` (new) + sidebar nav link
- [ ] Header cards: **On track / Due soon / Breached** counts (color-coded).
- [ ] Table of in-review features: title, project, time in review, **due in Xh / overdue by Xh**
  (red), assignee/owner, link to feature.
- [ ] Empty + loading + error states (reuse `SkeletonList` / `QueryError`).
- [ ] Add to `dashboard-shell.tsx` nav and the command palette.

### 1.5 — Breach badges where reviews live
- [ ] `/queue` page: red "SLA breached · overdue 6h" / amber "due in 3h" pill per row.
- [ ] Feature command center: SLA pill near the status badge.
- [ ] (Optional) `notifyWorkspace` Slack/Discord ping when a feature first breaches (via the
  existing daily Inngest `cleanupFn` cron, or a new hourly check that flags breaches).

### 1.6 — Tests
- [ ] Unit-test `computeSlaState`: on_track, due_soon boundary, breached, closed; null due date.

---

## 2. Activity feed  🟢 (cheap, high-per-hour)

**Concept:** a chronological workspace activity stream from data we already store.

### 2.1 — tRPC query
**File:** `packages/api/src/routers` (extend workspace or a new `activity` router)
- [ ] `activity.feed` query (workspace-scoped, paginated): merge + sort by `createdAt desc`:
  - `AuditLog` (approvals, role changes, codegen requested, etc.)
  - `WorkflowRun` (PRD generated, AI review ran, codegen ran)
  - Optionally feature status changes (derive from AuditLog or add audit entries).
- [ ] Normalize to `{ id, kind, actor, summary, target, at }`.

### 2.2 — Page
**File:** `apps/web/app/dashboard/[workspaceId]/activity/page.tsx` (new) + nav + palette
- [ ] Timeline UI (icon per kind, relative time via `date-fns`), `SkeletonList` + `QueryError`.
- [ ] "Load more" pagination.

> Note: to make the feed rich, ensure key actions write `AuditLog` rows (approve/reject/ship,
> PRD generated, review passed/failed). Add any missing `logAudit(...)` calls.

---

## 3. Shipped view  🟢 (trivial)

**File:** `apps/web/app/dashboard/[workspaceId]/shipped/page.tsx` (new) + nav + palette
- [ ] tRPC query (or reuse `featureRequest.list` with a status filter): features `status = SHIPPED`
  for the workspace, ordered by `shippedAt desc`.
- [ ] Cards: title, project, shipped date (relative), linked PR(s), link to feature.
- [ ] Header stat: "N shipped · M this week". `SkeletonList` + empty/error states.

---

## 4. Risks & notes
| Risk | Mitigation |
|---|---|
| SLA clock reset on re-review loops would hide breaches | Only set `reviewDueAt` once (when `reviewStartedAt` is null) |
| Existing in-review features have no `reviewDueAt` | Backfill once: set due = `updatedAt + slaHours` for current `IN_REVIEW` rows |
| Activity feed N+1 / heavy merge | Cap each source (e.g. 50), merge in memory, paginate by cursor |
| Breach notifications spamming | Flag-once: store a `slaBreachNotifiedAt` or check before notifying |

---

## 5. Definition of done
- [ ] `/review-sla` shows on-track/due-soon/breached counts + a sorted in-review table; breach
      pills appear on `/queue` and the feature page; SLA hours configurable in settings.
- [ ] `/activity` shows a live, paginated workspace timeline.
- [ ] `/shipped` lists shipped features with dates + PR links.
- [ ] All three in the sidebar nav + ⌘K command palette.
- [ ] `computeSlaState` unit-tested; `check-types` + build green.

---

## 6. Effort & order
1. **Activity** 🟢 (~2h) — data exists; pure UI + one query.
2. **Shipped** 🟢 (~1h) — filtered list.
3. **Review SLA** 🟡 (~half day) — schema + transition hook + board page + badges + test.

**Total ~1 day.** After this we lead ShipFlowAI on surface breadth too, while keeping the
agent/MCP/ensemble/BYOK moat they (and Qship) can't match.
