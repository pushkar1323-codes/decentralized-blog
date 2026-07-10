import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Captures errors thrown during server-side rendering / server components /
// route handlers that Next.js's own error-reporting hook surfaces. This is
// what gives us "API failures" and server-side runtime error coverage,
// complementing the client-side capture set up in instrumentation-client.ts.
export const onRequestError = Sentry.captureRequestError;
