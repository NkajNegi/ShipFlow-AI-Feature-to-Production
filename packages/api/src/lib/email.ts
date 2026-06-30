/**
 * Transactional email via Resend's HTTP API (no SDK dependency).
 *
 * Configure with:
 *   RESEND_API_KEY  — from https://resend.com (free tier available)
 *   EMAIL_FROM      — verified sender, e.g. "MetroFlow <noreply@yourdomain.com>"
 *
 * If RESEND_API_KEY is not set, we fall back to logging the message (and any
 * link) so local/demo flows still work without a mail provider configured.
 */
const RESEND_ENDPOINT = "https://api.resend.com/emails";

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<{ sent: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "MetroFlow <onboarding@resend.dev>";

  if (!apiKey) {
    console.log(
      `[email:fallback] to=${opts.to} subject="${opts.subject}"\n` +
        (opts.text ?? opts.html),
    );
    return { sent: false };
  }

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
        text: opts.text,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[email] Resend failed ${res.status}: ${body}`);
      return { sent: false };
    }
    return { sent: true };
  } catch (err) {
    console.error("[email] send error", err);
    return { sent: false };
  }
}

/** Minimal branded HTML wrapper for a single call-to-action link. */
export function actionEmail(opts: {
  heading: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
}): string {
  return `
  <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#111">
    <h2 style="margin:0 0 12px">${opts.heading}</h2>
    <p style="margin:0 0 20px;color:#444;line-height:1.5">${opts.body}</p>
    <a href="${opts.ctaUrl}" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600">${opts.ctaLabel}</a>
    <p style="margin:20px 0 0;color:#888;font-size:12px">If the button doesn't work, paste this link into your browser:<br>${opts.ctaUrl}</p>
  </div>`;
}
