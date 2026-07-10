// Sentry initialization for the Edge runtime.
// Loaded from instrumentation.ts via `register()` when NEXT_RUNTIME === "edge".
// This project doesn't currently use middleware or edge routes, but Next.js
// requires this file to exist for any edge-runtime code path Sentry might
// need to instrument (e.g. if middleware is added later).
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.2,
  debug: false,
});
