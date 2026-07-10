"use client";

import posthog from "posthog-js";

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

let initialized = false;

/**
 * Initializes PostHog once, client-side only. Safe to call multiple times
 * (e.g. from React StrictMode's double-invoke in dev) — subsequent calls
 * are no-ops. If NEXT_PUBLIC_POSTHOG_KEY isn't set, this does nothing and
 * every track() call below becomes a silent no-op too, so the app behaves
 * identically whether or not analytics is configured.
 */
export function initAnalytics() {
  if (initialized || typeof window === "undefined") return;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;

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

  initialized = true;
}

/** Track an analytics event. No-ops safely if analytics was never initialized. */
export function track(event: AnalyticsEventName, properties?: Record<string, unknown>) {
  if (!initialized) return;
  posthog.capture(event, properties);
}

/**
 * Associates subsequent events with a wallet address so they're queryable
 * per-user in PostHog. Stellar public keys are already public/on-chain
 * data (shown directly in the UI), so this carries no additional privacy
 * exposure beyond what the app already displays.
 */
export function identifyWallet(address: string) {
  if (!initialized) return;
  posthog.identify(address);
}

/** Clears the PostHog identity on wallet disconnect. */
export function resetAnalyticsIdentity() {
  if (!initialized) return;
  posthog.reset();
}
