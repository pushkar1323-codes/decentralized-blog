"use client";

import { useEffect } from "react";
import { initAnalytics } from "@/lib/analytics";

/** Bootstraps PostHog once on the client. Renders nothing. */
export default function AnalyticsProvider() {
  useEffect(() => {
    initAnalytics();
  }, []);

  return null;
}
