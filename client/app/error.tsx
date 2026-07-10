"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function Error({
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
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#050510] px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f87171]/10 border border-[#f87171]/20 text-[#f87171]">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <p className="text-lg font-semibold text-white/90">Something went wrong</p>
      <p className="max-w-sm text-sm text-white/40">
        We&apos;ve been notified and are looking into it. You can try again, or refresh the page.
      </p>
      <button
        onClick={reset}
        className="mt-2 rounded-xl bg-gradient-to-r from-[#7c6cf0] to-[#5b8cf0] px-5 py-2 text-sm font-medium text-white transition-all hover:shadow-[0_0_25px_rgba(124,108,240,0.25)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c6cf0]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050510]"
      >
        Try again
      </button>
    </div>
  );
}
