import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Applies to every route in the app.
        source: "/:path*",
        headers: [
          {
            // Prevents the app from being embedded in an <iframe> on another
            // origin — the standard mitigation for clickjacking a connected
            // wallet into signing a transaction the user didn't intend to.
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            // Stops the browser from trying to guess/override the
            // Content-Type of a response (MIME-sniffing), which can turn
            // an otherwise-inert file into executable script in some
            // legacy attack scenarios.
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            // Sends the full URL as a referrer only to our own origin;
            // cross-origin requests (fonts, RPC, analytics) get just the
            // origin, not the full path/query — avoids leaking post IDs
            // or wallet-related query params to third parties.
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            // This app never uses the camera, microphone, or geolocation —
            // explicitly denying them (rather than leaving the default,
            // which allows same-origin) closes off those APIs entirely,
            // including from any future third-party script.
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          {
            // Forces HTTPS for this origin (and subdomains) for the next
            // two years, including on the very first visit if the host is
            // ever added to browsers' HSTS preload list. No effect in local
            // dev over http://localhost. Not signing up for preload here
            // (preload is a one-way, hard-to-reverse commitment a project
            // should opt into deliberately, not have added on its behalf).
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  // Sentry organization/project slugs — required only for uploading source
  // maps at build time. Leave unset in environments without a Sentry
  // account (like local dev); the plugin just skips the upload step.
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Suppresses the Sentry CLI's build-time console output so it doesn't
  // clutter normal `next build` logs.
  silent: true,

  // Upload a broader set of source maps for better stack traces, at the
  // cost of a slightly larger build-time upload.
  widenClientFileUpload: true,
});
