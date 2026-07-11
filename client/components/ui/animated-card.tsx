"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";

interface AnimatedCardProps {
  className?: string;
  children: React.ReactNode;
  containerClassName?: string;
}

export function AnimatedCard({
  className,
  children,
  containerClassName,
}: AnimatedCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  // See spotlight.tsx for the full rationale: this component wraps the
  // entire main app card, so routing mousemove through React state here
  // would be the single biggest source of unnecessary re-renders in the
  // app. CSS custom properties + direct ref writes avoid that entirely.
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    const glow = glowRef.current;
    if (!container || !glow) return;
    const rect = container.getBoundingClientRect();
    glow.style.setProperty("--card-glow-x", `${e.clientX - rect.left}px`);
    glow.style.setProperty("--card-glow-y", `${e.clientY - rect.top}px`);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => glowRef.current?.style.setProperty("--card-glow-opacity", "1")}
      onMouseLeave={() => glowRef.current?.style.setProperty("--card-glow-opacity", "0")}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.05] to-white/[0.02] backdrop-blur-xl animate-fade-in-up",
        containerClassName
      )}
    >
      {/* Hover glow */}
      <div
        ref={glowRef}
        className="pointer-events-none absolute -inset-px z-0 rounded-[inherit] transition-opacity duration-300"
        style={{
          background:
            "radial-gradient(400px circle at var(--card-glow-x, 50%) var(--card-glow-y, 50%), rgba(124,108,240,0.1), transparent 40%)",
          opacity: "var(--card-glow-opacity, 0)",
        }}
      />
      <div className={cn("relative z-10", className)}>{children}</div>
    </div>
  );
}
