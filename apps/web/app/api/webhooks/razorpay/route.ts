import crypto from "crypto";
import {
  activateProForSubscription,
  alreadyProcessed,
  captureError,
  confirmCreditsPayment,
} from "@repo/api";

export const runtime = "nodejs";

/**
 * Razorpay webhook listener. Verifies the signature and upgrades the workspace
 * to Pro when a subscription is activated/charged.
 */
function verify(payload: string, signature: string | null): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(signature),
    );
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  if (!verify(body, signature)) {
    return new Response("Invalid signature", { status: 401 });
  }

  // Idempotency: skip events Razorpay has already delivered.
  const eventId =
    req.headers.get("x-razorpay-event-id") ||
    `${req.headers.get("x-razorpay-signature")}`;
  if (await alreadyProcessed("razorpay", eventId)) {
    return Response.json({ ok: true, deduped: true });
  }

  const event = JSON.parse(body);
  const type = event.event as string;

  if (type === "subscription.activated" || type === "subscription.charged") {
    const subId = event.payload?.subscription?.entity?.id;
    if (subId) {
      try {
        await activateProForSubscription(subId);
      } catch (err) {
        captureError(err, { webhook: "razorpay", type });
      }
    }
  } else if (type === "payment_link.paid") {
    const paymentLinkId = event.payload?.payment_link?.entity?.id;
    const amountPaidPaise = Number(
      event.payload?.payment_link?.entity?.amount_paid || 0,
    );
    
    if (paymentLinkId && amountPaidPaise > 0) {
      try {
        // Verifies the paid amount against the persisted order before crediting.
        await confirmCreditsPayment(paymentLinkId, amountPaidPaise);
      } catch (err) {
        captureError(err, { webhook: "razorpay", type });
      }
    }
  }

  return Response.json({ ok: true });
}
