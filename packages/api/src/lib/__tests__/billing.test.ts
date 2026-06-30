import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Razorpay (constructor) — confirmCreditsPayment never touches it, but the
// module instantiates the SDK lazily so importing is safe.
vi.mock("razorpay", () => ({ default: class {} }));

const orderFindUnique = vi.fn();
const orderUpdate = vi.fn();
const workspaceUpdate = vi.fn();
const tx = vi.fn(async (ops: any[]) => Promise.all(ops));

vi.mock("@repo/db", () => ({
  prisma: {
    checkoutOrder: {
      findUnique: (...a: any[]) => orderFindUnique(...a),
      update: (...a: any[]) => orderUpdate(...a),
    },
    workspace: { update: (...a: any[]) => workspaceUpdate(...a) },
    $transaction: (ops: any[]) => tx(ops),
  },
}));

import { confirmCreditsPayment } from "../billing";

const baseOrder = {
  id: "o1",
  workspaceId: "ws1",
  razorpayId: "plink_1",
  type: "CREDITS",
  amountInr: 1000, // expects 100000 paise
  credits: 100,
  status: "PENDING",
};

describe("confirmCreditsPayment — server-side amount verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    orderUpdate.mockResolvedValue({});
    workspaceUpdate.mockResolvedValue({});
  });

  it("grants the order's credits when the paid amount matches", async () => {
    orderFindUnique.mockResolvedValueOnce(baseOrder);
    await confirmCreditsPayment("plink_1", 100_000); // exact match
    // credited the workspace from the ORDER (100), not from the payload
    expect(workspaceUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { aiReviewCredits: { increment: 100 } },
      }),
    );
  });

  it("REJECTS underpayment and marks the order FAILED (no credit granted)", async () => {
    orderFindUnique.mockResolvedValueOnce(baseOrder);
    await expect(
      confirmCreditsPayment("plink_1", 50_000), // paid less than expected
    ).rejects.toThrow(/amount mismatch/i);
    expect(workspaceUpdate).not.toHaveBeenCalled();
    expect(orderUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "FAILED" } }),
    );
  });

  it("is idempotent — a COMPLETED order grants nothing again", async () => {
    orderFindUnique.mockResolvedValueOnce({ ...baseOrder, status: "COMPLETED" });
    await confirmCreditsPayment("plink_1", 100_000);
    expect(workspaceUpdate).not.toHaveBeenCalled();
  });

  it("refuses when no server-created order exists", async () => {
    orderFindUnique.mockResolvedValueOnce(null);
    await expect(confirmCreditsPayment("plink_x", 100_000)).rejects.toThrow(
      /no credits order/i,
    );
    expect(workspaceUpdate).not.toHaveBeenCalled();
  });
});
