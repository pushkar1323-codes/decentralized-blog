"use client";

import { useEffect } from "react";
import { initAnalytics } from "@/lib/analytics";
import { loadReplayLazily } from "@/instrumentation-client";

/** Bootstraps PostHog and lazily loads Sentry Replay once on the client. Renders nothing. */
export default function AnalyticsProvider() {
  useEffect(() => {
    initAnalytics();
    loadReplayLazily();
  }, []);

  return null;
}
