// Sentry initialization for the Node.js server runtime.
// Loaded from instrumentation.ts via `register()` when NEXT_RUNTIME === "nodejs".
//
// If SENTRY_DSN (or NEXT_PUBLIC_SENTRY_DSN as a fallback) isn't set, Sentry.init
// simply no-ops — no errors are sent and nothing else in the app is affected.
// This lets the project run normally in local dev / this sandbox without a
// real Sentry account configured.
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,

  // Capture a reasonable slice of transactions for performance monitoring
  // without generating excessive event volume on a small app like this.
  tracesSampleRate: 0.2,

  // Keep noisy dev-time logging out of Sentry's own console output.
  debug: false,
});
