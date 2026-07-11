"use client";

import type { PostHog } from "posthog-js";

/**
 * Every analytics event this app knows about. Defining them as a const
 * object (rather than sprinkling string literals through the codebase)
 * means there's exactly one place to look to know what we track, and typos
 * in event names become TypeScript errors instead of silent tracking gaps.
 *
 * NOTE on BLOG_LIKED and TIP_SENT: these are defined for forward-compatibility
 * but are not fired anywhere in the app today. Neither a "like" nor a "tip"
 * feature exists in the Soroban contract this app talks to — adding tracking
 * calls for them would mean firing analytics events for actions users have
 * no way to actually perform, which would just pollute the dashboard with
 * events that can never happen. Wire these up once those features exist.
 */
export const AnalyticsEvent = {
  WALLET_CONNECTED: "wallet_connected",
  BLOG_PUBLISHED: "blog_published",
  BLOG_VIEWED: "blog_viewed",
  BLOG_LIKED: "blog_liked", // defined, not yet fired — see note above
  COMMENT_ADDED: "comment_added",
  TIP_SENT: "tip_sent", // defined, not yet fired — see note above
} as const;

export type AnalyticsEventName = (typeof AnalyticsEvent)[keyof typeof AnalyticsEvent];

let posthogInstance: PostHog | null = null;
let initPromise: Promise<void> | null = null;

/**
 * Initializes PostHog once, client-side only, loading the library itself
 * via a dynamic import() rather than a static top-level one. posthog-js's
 * default bundle entry point is ~224KB of raw source — substantial enough
 * that it shouldn't block/inflate the app's initial JS bundle, especially
 * since it does nothing at all until NEXT_PUBLIC_POSTHOG_KEY is configured.
 * The dynamic import lets Next.js split it into its own chunk that loads
 * in parallel instead of delaying the initial page's parse/hydration.
 *
 * Safe to call multiple times (e.g. React StrictMode's double-invoke in
 * dev) — subsequent calls reuse the in-flight/completed promise.
 */
export function initAnalytics(): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    if (typeof window === "undefined") return;

    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return;

    const { default: posthog } = await import("posthog-js");

    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
      // This is a wallet-based dapp with one page and no traditional login,
      // so we capture pageviews manually rather than relying on history-API
      // autocapture, which mostly matters for multi-route apps.
      capture_pageview: false,
      // Session recordings aren't needed for this scope; keep the footprint
      // small and rely on named events instead.
      disable_session_recording: true,
      persistence: "localStorage+cookie",
    });

    posthogInstance = posthog;
  })();

  return initPromise;
}

/**
 * Track an analytics event. No-ops safely if analytics was never
 * initialized (no API key configured) or if the posthog-js chunk hasn't
 * finished loading yet — same fail-safe behavior as before, just also
 * covering the brief window while the dynamic import is in flight.
 */
export function track(event: AnalyticsEventName, properties?: Record<string, unknown>) {
  posthogInstance?.capture(event, properties);
}

/**
 * Associates subsequent events with a wallet address so they're queryable
 * per-user in PostHog. Stellar public keys are already public/on-chain
 * data (shown directly in the UI), so this carries no additional privacy
 * exposure beyond what the app already displays.
 */
export function identifyWallet(address: string) {
  posthogInstance?.identify(address);
}

/** Clears the PostHog identity on wallet disconnect. */
export function resetAnalyticsIdentity() {
  posthogInstance?.reset();
}
