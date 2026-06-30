import { describe, it, expect, vi, beforeEach } from "vitest";
import { assertWorkspaceMember } from "../access";
import { TRPCError } from "@trpc/server";
import { prisma } from "@repo/db";

vi.mock("@repo/db", () => ({
  prisma: {
    workspaceMember: {
      findUnique: vi.fn(),
    },
  },
}));

describe("access checks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should throw FORBIDDEN if not a member", async () => {
    vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValueOnce(null);
    await expect(
      assertWorkspaceMember(prisma as any, "user1", "ws1"),
    ).rejects.toThrow(TRPCError);
  });

  it("should pass if member", async () => {
    vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValueOnce({
      role: "MEMBER",
    } as any);
    await expect(
      assertWorkspaceMember(prisma as any, "user1", "ws1"),
    ).resolves.not.toThrow();
  });

  it("should throw if role is insufficient", async () => {
    vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValueOnce({
      role: "MEMBER",
    } as any);
    await expect(
      assertWorkspaceMember(prisma as any, "user1", "ws1", ["ADMIN"]),
    ).rejects.toThrow(TRPCError);
  });
});
