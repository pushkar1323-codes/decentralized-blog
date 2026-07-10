/**
 * Maps raw errors (from Freighter, the Stellar/Soroban RPC, or our own
 * validation checks) to short, human, non-technical messages.
 *
 * Nothing in this file changes *when* or *why* an error occurs — it only
 * decides how that error is worded once it reaches the user. The original
 * technical message is preserved (console.error'd by callers) for debugging.
 */

export type ErrorCategory =
  | "wallet-not-installed"
  | "wallet-disconnected"
  | "user-rejected"
  | "rpc-unavailable"
  | "network-timeout"
  | "contract-error"
  | "transaction-failed"
  | "not-found"
  | "invalid-input"
  | "unknown";

export interface FriendlyError {
  category: ErrorCategory;
  /** Short, bold headline for the toast (e.g. "Wallet not found") */
  title: string;
  /** One or two plain-language sentences explaining what happened / what to do */
  message: string;
  /** Whether showing a "Retry" action makes sense for this category */
  retryable: boolean;
}

/**
 * A small "magic prefix" our own wallet code uses (see hooks/contract.ts)
 * to unambiguously mark an error as "the user declined a wallet prompt",
 * since the wording Freighter itself uses isn't part of its public API
 * and shouldn't be relied on for matching.
 */
export const USER_REJECTED_PREFIX = "FREIGHTER_USER_REJECTED:";

function rawMessageOf(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  try {
    return JSON.stringify(err);
  } catch {
    return "";
  }
}

export function toFriendlyError(
  err: unknown,
  fallback = "Something went wrong. Please try again."
): FriendlyError {
  const raw = rawMessageOf(err);
  const lower = raw.toLowerCase();

  // ── User explicitly rejected a wallet prompt (connect or sign) ──
  if (raw.startsWith(USER_REJECTED_PREFIX) || /declin|reject|denied|user cancel/i.test(lower)) {
    return {
      category: "user-rejected",
      title: "Request cancelled",
      message:
        "You declined the request in your wallet. Nothing was sent — you can try again whenever you're ready.",
      retryable: true,
    };
  }

  // ── Wallet extension missing ──
  if (/not installed|not available|freighter is not/i.test(lower)) {
    return {
      category: "wallet-not-installed",
      title: "Wallet not found",
      message:
        "We couldn't detect the Freighter wallet extension. Please install it from freighter.app and refresh the page.",
      retryable: true,
    };
  }

  // ── Wallet connected to the extension, but no usable address ──
  if (/could not retrieve wallet address|no address|not connected/i.test(lower)) {
    return {
      category: "wallet-disconnected",
      title: "Wallet disconnected",
      message: "Your wallet appears to be disconnected. Please reconnect and try again.",
      retryable: true,
    };
  }

  // ── Timeouts (confirmation polling, or a slow/unresponsive request) ──
  if (/timed out|timeout|econnaborted/i.test(lower)) {
    return {
      category: "network-timeout",
      title: "Taking longer than expected",
      message:
        "The network is responding slowly. Your request may still complete — check back shortly, or try again.",
      retryable: true,
    };
  }

  // ── Unfunded / nonexistent account on the network ──
  if (/account not found/i.test(lower)) {
    return {
      category: "not-found",
      title: "Account not found on network",
      message:
        "This wallet isn't active on the Stellar network yet. Make sure it's funded, then try again.",
      retryable: true,
    };
  }

  // ── RPC / connectivity problems ──
  if (/network error|failed to fetch|econnrefused|network request failed|load failed/i.test(lower)) {
    return {
      category: "rpc-unavailable",
      title: "Network unavailable",
      message:
        "We couldn't reach the Stellar network. Please check your internet connection and try again.",
      retryable: true,
    };
  }

  // ── Contract / simulation errors ──
  if (/simulation failed|host error|contract/i.test(lower)) {
    return {
      category: "contract-error",
      title: "Couldn't process request",
      message:
        "The smart contract couldn't process this request. Please check your input and try again.",
      retryable: true,
    };
  }

  // ── Submitted but failed on-chain ──
  if (/transaction failed|submission failed/i.test(lower)) {
    return {
      category: "transaction-failed",
      title: "Transaction failed",
      message:
        "Your transaction didn't complete on-chain. This can happen during network congestion — please try again.",
      retryable: true,
    };
  }

  // ── Unrecognized — show a short version of the real message rather than nothing ──
  return {
    category: "unknown",
    title: "Something went wrong",
    message: raw && raw.length < 140 ? raw : fallback,
    retryable: true,
  };
}
