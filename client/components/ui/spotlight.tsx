"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";

interface SpotlightProps {
  className?: string;
  children: React.ReactNode;
}

export function Spotlight({ className, children }: SpotlightProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  // Mousemove can fire 60+ times/sec. Routing that through useState would
  // re-render this component (and, historically, risk cascading further)
  // on every pixel of movement — pure wasted work for a cosmetic glow.
  // Writing CSS custom properties straight to the DOM node instead lets
  // the browser's compositor animate the gradient with zero React renders.
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    const glow = glowRef.current;
    if (!container || !glow) return;
    const rect = container.getBoundingClientRect();
    glow.style.setProperty("--spotlight-x", `${e.clientX - rect.left}px`);
    glow.style.setProperty("--spotlight-y", `${e.clientY - rect.top}px`);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => glowRef.current?.style.setProperty("--spotlight-opacity", "1")}
      onMouseLeave={() => glowRef.current?.style.setProperty("--spotlight-opacity", "0")}
      className={cn("relative overflow-hidden", className)}
    >
      <div
        ref={glowRef}
        className="pointer-events-none absolute -inset-px z-10 rounded-[inherit] transition-opacity duration-300"
        style={{
          background:
            "radial-gradient(600px circle at var(--spotlight-x, 50%) var(--spotlight-y, 50%), rgba(124,108,240,0.06), transparent 40%)",
          opacity: "var(--spotlight-opacity, 0)",
        }}
      />
      {children}
    </div>
  );
}
