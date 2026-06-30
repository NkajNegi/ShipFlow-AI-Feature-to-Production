import Razorpay from "razorpay";
import { prisma } from "@repo/db";

/**
 * Razorpay billing helpers.
 *
 * Required env:
 *   - RAZORPAY_KEY_ID
 *   - RAZORPAY_KEY_SECRET
 *   - RAZORPAY_PRO_PLAN_ID    (a Razorpay Plan id for the Pro tier)
 *   - RAZORPAY_WEBHOOK_SECRET (verified by the webhook route)
 *
 * SECURITY MODEL — server-authoritative pricing + order verification:
 *   1. Prices and entitlements (plan tier / credit count) are decided HERE and
 *      persisted in a `CheckoutOrder` row keyed by the Razorpay object id.
 *   2. On the webhook, we look the order up by that id, verify the amount paid
 *      matches the persisted `amountInr`, and grant the entitlement FROM THE
 *      ORDER — never from the (client-influenceable) webhook payload.
 *   This prevents a client from claiming a higher tier or more credits than paid.
 */

// Server-side source of truth for prices. The client never chooses the amount.
export const PRO_PRICE_INR = 2000;
export const CREDIT_PACK = { credits: 100, priceInr: 1000 } as const;
const PRO_CREDIT_GRANT = 200;

function getClient(): Razorpay {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Razorpay is not configured on this server.");
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

export async function createRazorpaySubscription(workspaceId: string) {
  const client = getClient();

  const subscription = await client.subscriptions.create({
    plan_id: process.env.RAZORPAY_PRO_PLAN_ID || "",
    total_count: 12, // 12 billing cycles
    customer_notify: 1,
    notes: { workspaceId },
  });

  // Persist the expected order so the webhook can verify it later.
  await prisma.$transaction([
    prisma.workspace.update({
      where: { id: workspaceId },
      data: { razorpaySubscriptionId: subscription.id },
    }),
    prisma.checkoutOrder.create({
      data: {
        workspaceId,
        razorpayId: subscription.id,
        type: "SUBSCRIPTION",
        amountInr: PRO_PRICE_INR,
        planTier: "PRO",
        status: "PENDING",
      },
    }),
  ]);

  return {
    subscriptionId: subscription.id,
    shortUrl: (subscription as { short_url?: string }).short_url ?? null,
    keyId: process.env.RAZORPAY_KEY_ID || "",
  };
}

/**
 * Activate Pro from the webhook. Verifies a server-created SUBSCRIPTION order
 * exists for this subscription id before granting anything. Idempotent.
 */
export async function activateProForSubscription(
  razorpaySubscriptionId: string,
) {
  const order = await prisma.checkoutOrder.findUnique({
    where: { razorpayId: razorpaySubscriptionId },
  });

  // No server-created order → this subscription wasn't initiated by us. Refuse.
  if (!order || order.type !== "SUBSCRIPTION") {
    throw new Error(
      `No checkout order found for subscription ${razorpaySubscriptionId}; refusing to activate.`,
    );
  }
  if (order.status === "COMPLETED") return; // already processed

  const workspace = await prisma.workspace.findUnique({
    where: { id: order.workspaceId },
  });
  if (!workspace) return;

  // Grant the tier/credits from the ORDER, not from the payload.
  const tier = order.planTier ?? "PRO";

  await prisma.$transaction([
    prisma.workspace.update({
      where: { id: order.workspaceId },
      data: { planTier: tier, aiReviewCredits: { increment: PRO_CREDIT_GRANT } },
    }),
    prisma.subscription.upsert({
      where: { workspaceId: order.workspaceId },
      update: {
        plan: tier,
        status: "ACTIVE",
        razorpayId: razorpaySubscriptionId,
      },
      create: {
        workspaceId: order.workspaceId,
        plan: tier,
        status: "ACTIVE",
        razorpayId: razorpaySubscriptionId,
      },
    }),
    prisma.checkoutOrder.update({
      where: { id: order.id },
      data: { status: "COMPLETED" },
    }),
  ]);
}

/**
 * Creates a one-off payment link to purchase a pack of AI credits, and persists
 * the expected order. Pricing/credits are fixed server-side (CREDIT_PACK).
 */
export async function createRazorpayPaymentLinkForCredits(workspaceId: string) {
  const client = getClient();
  const { credits, priceInr } = CREDIT_PACK;

  // amount is in paise (1 INR = 100 paise)
  const link = await (client.paymentLink.create as any)({
    amount: priceInr * 100,
    currency: "INR",
    description: `Buy ${credits} AI Review Credits`,
    notes: { workspaceId, credits },
  });

  await prisma.checkoutOrder.create({
    data: {
      workspaceId,
      razorpayId: link.id,
      type: "CREDITS",
      amountInr: priceInr,
      credits,
      status: "PENDING",
    },
  });

  return {
    paymentLinkId: link.id,
    shortUrl: link.short_url,
  };
}

/**
 * Confirm a credits payment from the webhook. SECURITY: verifies the amount
 * actually paid matches the persisted order, and grants the credit count FROM
 * THE ORDER — so a client cannot claim more credits than they paid for. Idempotent.
 */
export async function confirmCreditsPayment(
  paymentLinkId: string,
  amountPaidPaise: number,
) {
  const order = await prisma.checkoutOrder.findUnique({
    where: { razorpayId: paymentLinkId },
  });

  if (!order || order.type !== "CREDITS") {
    throw new Error(
      `No credits order found for payment link ${paymentLinkId}; refusing to grant.`,
    );
  }
  if (order.status === "COMPLETED") return; // already processed

  const expectedPaise = order.amountInr * 100;
  if (amountPaidPaise < expectedPaise) {
    await prisma.checkoutOrder.update({
      where: { id: order.id },
      data: { status: "FAILED" },
    });
    throw new Error(
      `Razorpay amount mismatch for ${paymentLinkId}: paid ${amountPaidPaise} paise, expected ${expectedPaise}.`,
    );
  }

  await prisma.$transaction([
    prisma.workspace.update({
      where: { id: order.workspaceId },
      data: { aiReviewCredits: { increment: order.credits ?? 0 } },
    }),
    prisma.checkoutOrder.update({
      where: { id: order.id },
      data: { status: "COMPLETED" },
    }),
  ]);
}
