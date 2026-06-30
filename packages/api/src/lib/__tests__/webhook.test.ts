import { describe, it, expect, vi, beforeEach } from "vitest";
import { alreadyProcessed } from "../webhook";
import { prisma } from "@repo/db";

vi.mock("@repo/db", () => ({
  prisma: {
    webhookEvent: {
      create: vi.fn(),
    },
  },
}));

describe("webhook idempotency", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return false for new events", async () => {
    vi.mocked(prisma.webhookEvent.create).mockResolvedValueOnce({} as any);
    const result = await alreadyProcessed("github", "evt-1");
    expect(result).toBe(false);
  });

  it("should return true for duplicate events (constraint error)", async () => {
    vi.mocked(prisma.webhookEvent.create).mockRejectedValueOnce(
      new Error("Unique constraint"),
    );
    const result = await alreadyProcessed("github", "evt-1");
    expect(result).toBe(true);
  });

  it("should return false if no eventId is provided", async () => {
    const result = await alreadyProcessed("github", null);
    expect(result).toBe(false);
  });
});
