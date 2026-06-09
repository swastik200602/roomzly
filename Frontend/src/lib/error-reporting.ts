// Generic client-side error reporter.
// Wire this up to your own error tracking service (Sentry, Datadog, etc.)
// when ready. Currently logs to console in development only.

export function reportError(
  error: unknown,
  context: Record<string, unknown> = {},
) {
  if (typeof window === "undefined") return;

  const info = {
    message: error instanceof Error ? error.message : String(error),
    route: window.location.pathname,
    ...context,
  };

  if (import.meta.env.DEV) {
    console.error("[Roomzly Error]", info);
  }

  // TODO: replace with your error tracking service, e.g.:
  // Sentry.captureException(error, { extra: context });
}
