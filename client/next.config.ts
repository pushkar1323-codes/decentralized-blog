import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  /* config options here */
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

  // Avoid noisy source-map-related warnings when no auth token is set.
  disableLogger: true,
});
