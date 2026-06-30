import { describe, it, expect, vi, beforeEach } from "vitest";
import { consumeAiCreditIfPlatform } from "../credits";
import { TRPCError } from "@trpc/server";
import { prisma } from "@repo/db";

vi.mock("@repo/db", () => ({
  prisma: {
    workspace: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

describe("credit consumption", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should skip consumption if BYOK is configured", async () => {
    vi.mocked(prisma.workspace.findUnique).mockResolvedValueOnce({
      anthropicApiKeyEnc: "key",
    } as any);
    await consumeAiCreditIfPlatform(prisma as any, "ws1");
    expect(prisma.workspace.updateMany).not.toHaveBeenCalled();
  });

  it("should throw FORBIDDEN if out of platform credits", async () => {
    vi.mocked(prisma.workspace.findUnique).mockResolvedValueOnce({
      anthropicApiKeyEnc: null,
    } as any);
    vi.mocked(prisma.workspace.updateMany).mockResolvedValueOnce({
      count: 0,
    } as any);
    await expect(
      consumeAiCreditIfPlatform(prisma as any, "ws1"),
    ).rejects.toThrow(TRPCError);
  });

  it("should decrement credit if platform credits exist", async () => {
    vi.mocked(prisma.workspace.findUnique).mockResolvedValueOnce({
      anthropicApiKeyEnc: null,
    } as any);
    vi.mocked(prisma.workspace.updateMany).mockResolvedValueOnce({
      count: 1,
    } as any);
    await expect(
      consumeAiCreditIfPlatform(prisma as any, "ws1"),
    ).resolves.not.toThrow();
    expect(prisma.workspace.updateMany).toHaveBeenCalledWith({
      where: { id: "ws1", aiReviewCredits: { gt: 0 } },
      data: { aiReviewCredits: { decrement: 1 } },
    });
  });
});
