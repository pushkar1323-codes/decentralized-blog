// Client-side Sentry initialization.
//
// File name matters: Next.js (with Turbopack, which this project builds
// with) auto-loads `instrumentation-client.ts` from the project root. The
// older `sentry.client.config.ts` convention still works under Webpack but
// is deprecated and silently skipped under Turbopack.
//
// Sentry.init() with no DSN configured is a safe no-op — the SDK logs a
// single debug notice and doesn't send anything, so this file is safe to
// ship even before a real Sentry project is wired up via env vars.
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,

  // Performance monitoring sample rate — kept modest for a small app.
  tracesSampleRate: 0.2,

  // Session Replay: only record a small sample of normal sessions, but
  // always record a replay when an error actually happens — this is what
  // makes "runtime errors" and "React errors" actionable in Sentry instead
  // of just a stack trace with no context.
  replaysSessionSampleRate: 0.05,
  replaysOnErrorSampleRate: 1.0,

  integrations: [Sentry.replayIntegration()],

  debug: false,
});

// Next.js App Router hook: reports errors that occur during client-side
// navigation transitions (a case regular React error boundaries don't
// cover). Purely additive instrumentation — see docs:
// https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation-client
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
