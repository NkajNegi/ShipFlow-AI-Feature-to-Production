/**
 * Single integration point for error reporting. Logs to the console and, if a
 * Sentry DSN is configured, this is where you'd forward to Sentry (add
 * `@sentry/node` and call `Sentry.captureException` here). Kept dependency-free
 * so it's safe to call from anywhere (webhooks, Inngest functions).
 */
export function captureError(
  err: unknown,
  context?: Record<string, unknown>
) {
  // eslint-disable-next-line no-console
  console.error("[shipflow:error]", context ?? {}, err);
}
