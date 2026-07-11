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

  // Session Replay sampling config lives here even though the Replay
  // integration itself is loaded lazily below — these rates take effect
  // as soon as the integration is added.
  replaysSessionSampleRate: 0.05,
  replaysOnErrorSampleRate: 1.0,

  // No `integrations` array here on purpose — see loadReplayLazily() below.
  // Runtime error / unhandled exception / React error capture (the actual
  // core purpose of Sentry) doesn't depend on Replay and is fully active
  // from this Sentry.init() call regardless.
  debug: false,
});

/**
 * Loads Sentry's Session Replay integration after the page has settled,
 * instead of bundling it into the initial script. Measured directly:
 * @sentry/replay's source is ~304KB raw across its files — a meaningful
 * chunk of JS for a feature that's only useful retroactively (showing what
 * happened before/during an error) and has zero bearing on whether errors
 * get captured in the first place. Deferring it means it never competes
 * with the initial bundle for parse/hydration time.
 *
 * Called from AnalyticsProvider once, client-side only.
 */
export function loadReplayLazily() {
  const schedule =
    typeof window.requestIdleCallback === "function"
      ? window.requestIdleCallback
      : (cb: () => void) => setTimeout(cb, 2000); // Safari has no requestIdleCallback

  schedule(async () => {
    const { replayIntegration } = await import("@sentry/nextjs");
    Sentry.addIntegration(replayIntegration());
  });
}

// Next.js App Router hook: reports errors that occur during client-side
// navigation transitions (a case regular React error boundaries don't
// cover). Purely additive instrumentation — see docs:
// https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation-client
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
