import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AnalyticsProvider from "@/components/AnalyticsProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Decentralized Blog | Publish On-Chain on Stellar",
  description:
    "A permissionless, on-chain blogging platform built with Soroban smart contracts on Stellar. Write posts, comment, and own your words — no servers, no censorship.",
  themeColor: "#050510",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark scroll-smooth`}
    >
      <body className="min-h-full flex flex-col bg-[#050510] overflow-x-hidden selection:bg-[#7c6cf0]/30 selection:text-white">
        <AnalyticsProvider />
        {children}
      </body>
    </html>
  );
}
