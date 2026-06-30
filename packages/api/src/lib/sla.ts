/**
 * Review SLA helpers. A feature in human review/approval has a deadline
 * (`reviewDueAt`). Past it while still un-actioned → breached.
 *
 * Pure functions — no I/O — so they're trivially unit-testable.
 */

// Statuses that are actively "in review / awaiting a human decision" and thus
// subject to the SLA clock.
export const SLA_OPEN_STATUSES = [
  "IN_REVIEW",
  "FIX_NEEDED",
  "PLANNING",
] as const;

export type SlaState = "on_track" | "due_soon" | "breached" | "closed";

export type SlaResult = {
  state: SlaState;
  /** Hours until due (negative = overdue). Null when no deadline / closed. */
  hoursRemaining: number | null;
};

/**
 * Derive the SLA state for a feature.
 * - `closed`   — not in an open review status, or no deadline set.
 * - `breached` — open and past the deadline.
 * - `due_soon` — open with <25% of the SLA window remaining.
 * - `on_track` — open with time to spare.
 */
export function computeSlaState(
  reviewDueAt: Date | string | null | undefined,
  status: string,
  slaHours: number,
  now: Date = new Date(),
): SlaResult {
  const open = (SLA_OPEN_STATUSES as readonly string[]).includes(status);
  if (!open || !reviewDueAt) {
    return { state: "closed", hoursRemaining: null };
  }

  const due = typeof reviewDueAt === "string" ? new Date(reviewDueAt) : reviewDueAt;
  const msRemaining = due.getTime() - now.getTime();
  const hoursRemaining = msRemaining / (1000 * 60 * 60);

  if (msRemaining <= 0) {
    return { state: "breached", hoursRemaining };
  }

  // "Due soon" = within the last quarter of the SLA window.
  const dueSoonThresholdHours = Math.max(slaHours * 0.25, 1);
  if (hoursRemaining <= dueSoonThresholdHours) {
    return { state: "due_soon", hoursRemaining };
  }
  return { state: "on_track", hoursRemaining };
}

/** Human-friendly "due in 3h" / "overdue 6h" label. */
export function formatSlaLabel(result: SlaResult): string {
  if (result.state === "closed" || result.hoursRemaining === null) return "";
  const h = Math.abs(result.hoursRemaining);
  const unit =
    h >= 48
      ? `${Math.round(h / 24)}d`
      : h >= 1
        ? `${Math.round(h)}h`
        : `${Math.max(1, Math.round(h * 60))}m`;
  return result.hoursRemaining < 0 ? `overdue ${unit}` : `due in ${unit}`;
}
