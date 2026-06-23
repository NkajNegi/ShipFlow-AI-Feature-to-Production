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
 */
function getClient(): Razorpay {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || "",
    key_secret: process.env.RAZORPAY_KEY_SECRET || "",
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

  await prisma.workspace.update({
    where: { id: workspaceId },
    data: { razorpaySubscriptionId: subscription.id },
  });

  return {
    subscriptionId: subscription.id,
    shortUrl: (subscription as { short_url?: string }).short_url ?? null,
    keyId: process.env.RAZORPAY_KEY_ID || "",
  };
}

/**
 * Apply a billing event (called from the Razorpay webhook). Activates Pro and
 * tops up AI review credits when a subscription becomes active.
 */
export async function activateProForSubscription(razorpaySubscriptionId: string) {
  const workspace = await prisma.workspace.findUnique({
    where: { razorpaySubscriptionId },
  });
  if (!workspace) return;

  await prisma.$transaction([
    prisma.workspace.update({
      where: { id: workspace.id },
      data: { planTier: "PRO", aiReviewCredits: { increment: 200 } },
    }),
    prisma.subscription.upsert({
      where: { workspaceId: workspace.id },
      update: { plan: "PRO", status: "ACTIVE", razorpayId: razorpaySubscriptionId },
      create: {
        workspaceId: workspace.id,
        plan: "PRO",
        status: "ACTIVE",
        razorpayId: razorpaySubscriptionId,
      },
    }),
  ]);
}
