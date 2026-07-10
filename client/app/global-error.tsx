"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

/**
 * Next.js App Router requires this exact file (global-error.tsx) to catch
 * errors thrown by the root layout itself — a regular app/error.tsx boundary
 * can't catch those, since the layout would need to keep rendering around it.
 * Because the root layout is unavailable here, this file must render its own
 * <html>/<body>.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.75rem",
          background: "#050510",
          color: "rgba(255,255,255,0.9)",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: "1.5rem",
        }}
      >
        <p style={{ fontSize: "1.125rem", fontWeight: 600 }}>Something went wrong</p>
        <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.4)", maxWidth: "24rem" }}>
          We&apos;ve been notified and are looking into it. You can try reloading the page.
        </p>
        <button
          onClick={reset}
          style={{
            marginTop: "0.5rem",
            padding: "0.5rem 1.25rem",
            borderRadius: "0.75rem",
            background: "linear-gradient(to right, #7c6cf0, #5b8cf0)",
            color: "white",
            fontSize: "0.875rem",
            fontWeight: 500,
            border: "none",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
