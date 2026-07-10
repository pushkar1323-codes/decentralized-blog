"use client";

import {
  Contract,
  Networks,
  TransactionBuilder,
  Keypair,
  xdr,
  Address,
  nativeToScVal,
  scValToNative,
  rpc,
} from "@stellar/stellar-sdk";
import {
  isConnected,
  getAddress,
  signTransaction,
  setAllowed,
  isAllowed,
  requestAccess,
} from "@stellar/freighter-api";
import { USER_REJECTED_PREFIX } from "@/lib/errorMessages";

// ============================================================
// CONSTANTS — Update these for your contract
// ============================================================

/** Your deployed Soroban contract ID */
export const CONTRACT_ADDRESS =
  "CDPN45ELKRJMMCSAVE2ZMQKKR3DICNMDO7I4MIF4CROYWUIDKYALAUXH";

/** Network passphrase (testnet by default) */
export const NETWORK_PASSPHRASE = Networks.TESTNET;

/** Soroban RPC URL */
export const RPC_URL = "https://soroban-testnet.stellar.org";

/** Horizon URL */
export const HORIZON_URL = "https://horizon-testnet.stellar.org";

/** Network name for Freighter */
export const NETWORK = "TESTNET";

// ============================================================
// RPC Server Instance
// ============================================================

const server = new rpc.Server(RPC_URL);

// ============================================================
// Wallet Helpers
// ============================================================

/** Progress of a wallet-connection attempt, surfaced to the UI. */
export type WalletPhase = "checking" | "requesting-access" | "finalizing";

export async function checkConnection(): Promise<boolean> {
  const result = await isConnected();
  return result.isConnected;
}

export async function connectWallet(
  onPhase?: (phase: WalletPhase) => void
): Promise<string> {
  onPhase?.("checking");
  const connResult = await isConnected();
  if (!connResult.isConnected) {
    throw new Error("Freighter extension is not installed or not available.");
  }

  const allowedResult = await isAllowed();
  if (!allowedResult.isAllowed) {
    onPhase?.("requesting-access");
    await setAllowed();
    const accessResult = await requestAccess();
    if (accessResult.error) {
      throw new Error(
        `${USER_REJECTED_PREFIX} ${accessResult.error.message || "Wallet access request was declined."}`
      );
    }
  }

  onPhase?.("finalizing");
  const addressResult = await getAddress();
  if (!addressResult.address) {
    throw new Error(
      addressResult.error?.message ||
        "Could not retrieve wallet address from Freighter."
    );
  }
  return addressResult.address;
}

export async function getWalletAddress(): Promise<string | null> {
  try {
    const connResult = await isConnected();
    if (!connResult.isConnected) return null;

    const allowedResult = await isAllowed();
    if (!allowedResult.isAllowed) return null;

    const { address } = await getAddress();
    return address || null;
  } catch {
    return null;
  }
}

// ============================================================
// Contract Interaction Helpers
// ============================================================

/** Fine-grained progress of an on-chain write transaction, surfaced to the UI. */
export type TxPhase = "preparing" | "signing" | "confirming";

/**
 * Build, simulate, and optionally sign + submit a Soroban contract call.
 *
 * @param method   - The contract method name to invoke
 * @param params   - Array of xdr.ScVal parameters for the method
 * @param caller   - The public key (G...) of the calling account
 * @param sign     - If true, signs via Freighter and submits. If false, only simulates.
 * @param onPhase  - Optional callback fired as the transaction moves through
 *                   preparing → signing → confirming, so callers can render
 *                   accurate progress ("Waiting for signature...", etc).
 * @returns        The result of the simulation or submission
 */
export async function callContract(
  method: string,
  params: xdr.ScVal[] = [],
  caller: string,
  sign: boolean = true,
  onPhase?: (phase: TxPhase) => void
) {
  onPhase?.("preparing");

  const contract = new Contract(CONTRACT_ADDRESS);
  const account = await server.getAccount(caller);

  const tx = new TransactionBuilder(account, {
    fee: "100",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...params))
    .setTimeout(30)
    .build();

  const simulated = await server.simulateTransaction(tx);

  if (rpc.Api.isSimulationError(simulated)) {
    throw new Error(
      `Simulation failed: ${(simulated as rpc.Api.SimulateTransactionErrorResponse).error}`
    );
  }

  if (!sign) {
    // Read-only call — just return the simulation result
    return simulated;
  }

  // Prepare the transaction with the simulation result
  const prepared = rpc.assembleTransaction(tx, simulated).build();

  // Sign with Freighter — this is where the wallet extension prompts the user
  onPhase?.("signing");
  const signResult = await signTransaction(prepared.toXDR(), {
    networkPassphrase: NETWORK_PASSPHRASE,
  });

  if (signResult.error) {
    throw new Error(
      `${USER_REJECTED_PREFIX} ${signResult.error.message || "Transaction signing was declined."}`
    );
  }

  const txToSubmit = TransactionBuilder.fromXDR(
    signResult.signedTxXdr,
    NETWORK_PASSPHRASE
  );

  onPhase?.("confirming");
  const result = await server.sendTransaction(txToSubmit);

  if (result.status === "ERROR") {
    throw new Error(`Transaction submission failed: ${result.status}`);
  }

  // Poll for confirmation, bounded so a stuck node can't hang the UI forever
  const POLL_INTERVAL_MS = 1000;
  const MAX_POLLS = 30; // ~30s, matches the tx's own setTimeout(30) validity window
  let getResult = await server.getTransaction(result.hash);
  let attempts = 0;
  while (getResult.status === "NOT_FOUND" && attempts < MAX_POLLS) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    getResult = await server.getTransaction(result.hash);
    attempts++;
  }

  if (getResult.status === "NOT_FOUND") {
    throw new Error(
      "Timed out waiting for confirmation. The transaction may still complete — check back shortly before retrying."
    );
  }

  if (getResult.status === "FAILED") {
    throw new Error("Transaction failed on chain.");
  }

  return getResult;
}

/**
 * Read-only contract call (does not require signing).
 */
export async function readContract(
  method: string,
  params: xdr.ScVal[] = [],
  caller?: string
) {
  const account =
    caller || Keypair.random().publicKey(); // Use a random keypair for read-only
  const sim = await callContract(method, params, account, false);
  if (
    rpc.Api.isSimulationSuccess(sim as rpc.Api.SimulateTransactionResponse) &&
    (sim as rpc.Api.SimulateTransactionSuccessResponse).result
  ) {
    return scValToNative(
      (sim as rpc.Api.SimulateTransactionSuccessResponse).result!.retval
    );
  }
  return null;
}

// ============================================================
// ScVal Conversion Helpers
// ============================================================

export function toScValString(value: string): xdr.ScVal {
  return nativeToScVal(value, { type: "string" });
}

export function toScValU32(value: number): xdr.ScVal {
  return nativeToScVal(value, { type: "u32" });
}

export function toScValU64(value: bigint): xdr.ScVal {
  return nativeToScVal(value, { type: "u64" });
}

export function toScValI128(value: bigint): xdr.ScVal {
  return nativeToScVal(value, { type: "i128" });
}

export function toScValAddress(address: string): xdr.ScVal {
  return new Address(address).toScVal();
}

export function toScValBool(value: boolean): xdr.ScVal {
  return nativeToScVal(value, { type: "bool" });
}

// ============================================================
// Decentralized Blog — Contract Methods
// ============================================================

export interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  comment_count: number;
  timestamp: string;
}

export interface Comment {
  id: string;
  content: string;
  author: string;
  timestamp: string;
}

/**
 * Create a new blog post.
 * Calls: create_post(author: Address, title: String, content: String) -> u64
 */
export async function createPost(
  caller: string,
  title: string,
  content: string,
  onPhase?: (phase: TxPhase) => void
) {
  return callContract(
    "create_post",
    [toScValAddress(caller), toScValString(title), toScValString(content)],
    caller,
    true,
    onPhase
  );
}

/**
 * Get a single post by ID.
 * Calls: get_post(post_id: u64) -> Post
 */
export async function getPost(postId: number, caller?: string) {
  return readContract(
    "get_post",
    [toScValU64(BigInt(postId))],
    caller
  );
}

/**
 * Add a comment to a post.
 * Calls: add_comment(post_id: u64, author: Address, content: String) -> u64
 */
export async function addComment(
  postId: number,
  caller: string,
  content: string,
  onPhase?: (phase: TxPhase) => void
) {
  return callContract(
    "add_comment",
    [toScValU64(BigInt(postId)), toScValAddress(caller), toScValString(content)],
    caller,
    true,
    onPhase
  );
}

/**
 * Get all comments for a post.
 * Calls: get_comments(post_id: u64) -> Vec<Comment>
 */
export async function getComments(postId: number, caller?: string) {
  return readContract(
    "get_comments",
    [toScValU64(BigInt(postId))],
    caller
  );
}

/**
 * Get all posts.
 * Calls: get_all_posts() -> Vec<Post>
 */
export async function getAllPosts(caller?: string) {
  return readContract("get_all_posts", [], caller);
}

export { nativeToScVal, scValToNative, Address, xdr };
