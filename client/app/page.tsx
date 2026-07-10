"use client";

import { useState, useEffect, useCallback } from "react";
import { Meteors } from "@/components/ui/meteors";
import Navbar from "@/components/Navbar";
import ContractUI from "@/components/Contract";
import {
  connectWallet,
  getWalletAddress,
  checkConnection,
  WalletPhase,
} from "@/hooks/contract";
import { toFriendlyError } from "@/lib/errorMessages";

export default function Home() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectPhase, setConnectPhase] = useState<WalletPhase | null>(null);
  const [connectError, setConnectError] = useState<{ title: string; message: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        if (await checkConnection()) {
          const addr = await getWalletAddress();
          if (addr) setWalletAddress(addr);
        }
      } catch {
        /* Freighter not installed */
      }
    })();
  }, []);

  const handleConnect = useCallback(async () => {
    setIsConnecting(true);
    setConnectError(null);
    try {
      const addr = await connectWallet((phase) => setConnectPhase(phase));
      setWalletAddress(addr);
    } catch (err) {
      console.error("Wallet connection failed:", err);
      const friendly = toFriendlyError(err, "Failed to connect wallet.");
      setConnectError({ title: friendly.title, message: friendly.message });
    } finally {
      setIsConnecting(false);
      setConnectPhase(null);
    }
  }, []);

  const handleDisconnect = useCallback(() => {
    setWalletAddress(null);
  }, []);

  // If the wallet was disconnected/locked outside the app (e.g. directly in
  // the Freighter extension) while we still think we're connected, notice
  // next time the tab regains focus and reflect that honestly instead of
  // letting Publish/Comment silently fail later.
  useEffect(() => {
    if (!walletAddress) return;
    const recheck = async () => {
      try {
        const stillConnected = await checkConnection();
        if (!stillConnected) {
          setWalletAddress(null);
          setConnectError({
            title: "Wallet disconnected",
            message: "Your wallet was disconnected. Please reconnect to continue.",
          });
          return;
        }
        const addr = await getWalletAddress();
        if (!addr) {
          setWalletAddress(null);
          setConnectError({
            title: "Wallet disconnected",
            message: "Your wallet was disconnected. Please reconnect to continue.",
          });
        }
      } catch {
        /* Freighter unreachable — leave current state as-is rather than guess */
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") recheck();
    };
    window.addEventListener("focus", recheck);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", recheck);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [walletAddress]);

  return (
    <div className="relative flex flex-col min-h-screen bg-[#050510] overflow-hidden">
      {/* Meteors */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <Meteors number={12} />
      </div>

      {/* Ambient orbs */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-[-20%] left-[-10%] h-[600px] w-[600px] rounded-full bg-[#7c6cf0]/20 blur-[120px] animate-float" />
        <div className="absolute bottom-[-10%] right-[-5%] h-[500px] w-[500px] rounded-full bg-[#4fc3f7]/15 blur-[120px] animate-float-delayed" />
      </div>

      {/* Navbar */}
      <Navbar
        walletAddress={walletAddress}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
        isConnecting={isConnecting}
        connectPhase={connectPhase}
        connectError={connectError}
        onDismissConnectError={() => setConnectError(null)}
      />

      {/* Hero + Content */}
      <main className="relative z-10 flex flex-1 w-full max-w-5xl mx-auto flex-col items-center px-4 sm:px-6 pt-8 sm:pt-10 pb-16">
        {/* Hero — compact */}
        <div className="mb-10 text-center animate-fade-in-up">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-1.5 text-sm text-white/50 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#7c6cf0] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#7c6cf0]" />
            </span>
            Powered by Soroban on Stellar
          </div>

          <h1 className="mb-4">
            <span className="block text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1]">
              <span className="text-white">Publish Freely, </span>
              <span className="bg-gradient-to-r from-[#7c6cf0] via-[#4fc3f7] to-[#7c6cf0] bg-[length:200%_auto] animate-gradient-shift bg-clip-text text-transparent">
                Own It Forever
              </span>
            </span>
          </h1>

          <p className="mx-auto max-w-lg text-sm sm:text-base leading-relaxed text-white/40">
            A permissionless blogging platform where every post and comment lives on-chain — no servers, no gatekeepers, no takedowns.
          </p>

          {/* Inline stats */}
          <div className="mt-7 flex items-center justify-center gap-6 sm:gap-10 animate-fade-in-up-delayed">
            {[
              { label: "Finality", value: "~5s" },
              { label: "Cost", value: "<$0.01" },
              { label: "Network", value: "Testnet" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-lg sm:text-xl font-bold text-white/90 font-mono">{stat.value}</p>
                <p className="text-[10px] text-white/30 mt-0.5 uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contract UI */}
        <ContractUI
          walletAddress={walletAddress}
          onConnect={handleConnect}
          isConnecting={isConnecting}
          connectPhase={connectPhase}
        />

        {/* Footer */}
        <div className="mt-12 flex flex-col items-center gap-4 animate-fade-in">
          {/* Publishing flow */}
          <div className="flex items-center gap-3 text-xs text-white/20">
            {["Write", "Publish", "Discuss"].map((step, i) => (
              <span key={step} className="flex items-center gap-3">
                <span className="flex items-center gap-1.5">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      i === 0
                        ? "bg-[#fbbf24]/50"
                        : i === 1
                          ? "bg-[#7c6cf0]/50"
                          : "bg-[#4fc3f7]/50"
                    }`}
                  />
                  <span className="font-mono">{step}</span>
                </span>
                {i < 2 && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/10" aria-hidden="true">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                )}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[10px] text-white/15 px-4 text-center">
            <span>Stellar Network</span>
            <span className="h-2.5 w-px bg-white/10" />
            <span>Freighter Wallet</span>
            <span className="h-2.5 w-px bg-white/10" />
            <span>Soroban Smart Contracts</span>
          </div>
        </div>
      </main>
    </div>
  );
}
