import type { Metadata, Viewport } from "next";
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

const title = "Decentralized Blog | Publish On-Chain on Stellar";
const description =
  "A permissionless, on-chain blogging platform built with Soroban smart contracts on Stellar. Write posts, comment, and own your words — no servers, no censorship.";

export const metadata: Metadata = {
  title,
  description,
  robots: { index: true, follow: true },
  openGraph: {
    title,
    description,
    type: "website",
    siteName: "Decentralized Blog",
  },
  twitter: {
    card: "summary",
    title,
    description,
  },
};

// themeColor lives here (not in `metadata`) as of Next.js 14+ — leaving it
// in the metadata export produces a build-time warning and is silently
// ignored by the browser.
export const viewport: Viewport = {
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
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-lg focus:bg-[#7c6cf0] focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white focus:outline-none focus:ring-2 focus:ring-white/60"
        >
          Skip to content
        </a>
        <AnalyticsProvider />
        {children}
      </body>
    </html>
  );
}
