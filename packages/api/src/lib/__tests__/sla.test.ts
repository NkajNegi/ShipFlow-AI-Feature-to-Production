import { describe, it, expect } from "vitest";
import { computeSlaState, formatSlaLabel } from "../sla";

const now = new Date("2026-06-30T12:00:00Z");
const hoursFromNow = (h: number) =>
  new Date(now.getTime() + h * 60 * 60 * 1000);

describe("computeSlaState", () => {
  it("on_track when comfortably before the deadline", () => {
    const r = computeSlaState(hoursFromNow(20), "IN_REVIEW", 24, now);
    expect(r.state).toBe("on_track");
    expect(Math.round(r.hoursRemaining!)).toBe(20);
  });

  it("due_soon within the last quarter of the window", () => {
    // 24h SLA → due_soon threshold is 6h.
    const r = computeSlaState(hoursFromNow(3), "IN_REVIEW", 24, now);
    expect(r.state).toBe("due_soon");
  });

  it("breached once past the deadline", () => {
    const r = computeSlaState(hoursFromNow(-5), "IN_REVIEW", 24, now);
    expect(r.state).toBe("breached");
    expect(r.hoursRemaining).toBeLessThan(0);
  });

  it("closed when the feature is not in an open review status", () => {
    const r = computeSlaState(hoursFromNow(-5), "SHIPPED", 24, now);
    expect(r.state).toBe("closed");
    expect(r.hoursRemaining).toBeNull();
  });

  it("closed when no deadline is set", () => {
    const r = computeSlaState(null, "IN_REVIEW", 24, now);
    expect(r.state).toBe("closed");
  });

  it("due_soon threshold is at least 1h even for tiny SLAs", () => {
    // 2h SLA → 25% = 0.5h, clamped to 1h.
    const r = computeSlaState(hoursFromNow(0.75), "IN_REVIEW", 2, now);
    expect(r.state).toBe("due_soon");
  });
});

describe("formatSlaLabel", () => {
  it("formats overdue and due-in", () => {
    expect(formatSlaLabel(computeSlaState(hoursFromNow(-6), "IN_REVIEW", 24, now))).toBe(
      "overdue 6h",
    );
    expect(formatSlaLabel(computeSlaState(hoursFromNow(3), "IN_REVIEW", 24, now))).toBe(
      "due in 3h",
    );
    expect(formatSlaLabel(computeSlaState(null, "SHIPPED", 24, now))).toBe("");
  });
});
