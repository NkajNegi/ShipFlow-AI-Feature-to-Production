import { describe, it, expect, vi, beforeEach } from "vitest";
import { assertRepoLimit, planLimits } from "../plan";
import { TRPCError } from "@trpc/server";
import { prisma } from "@repo/db";

vi.mock("@repo/db", () => ({
  prisma: {
    workspace: { findUnique: vi.fn() },
    repository: { count: vi.fn() },
  },
}));

describe("plan limits", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return correct limits", () => {
    expect(planLimits("FREE").repositories).toBe(1);
    expect(planLimits("PRO").repositories).toBe(Infinity);
  });

  it("should throw FORBIDDEN if FREE plan repo limit exceeded", async () => {
    vi.mocked(prisma.workspace.findUnique).mockResolvedValueOnce({
      planTier: "FREE",
    } as any);
    vi.mocked(prisma.repository.count).mockResolvedValueOnce(1); // Limit is 1
    await expect(assertRepoLimit(prisma as any, "ws1")).rejects.toThrow(
      TRPCError,
    );
  });

  it("should pass if PRO plan", async () => {
    vi.mocked(prisma.workspace.findUnique).mockResolvedValueOnce({
      planTier: "PRO",
    } as any);
    await expect(assertRepoLimit(prisma as any, "ws1")).resolves.not.toThrow();
  });
});
