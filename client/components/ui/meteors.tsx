"use client";

import { cn } from "@/lib/utils";
import { memo, useState } from "react";

interface MeteorsProps {
  number?: number;
  className?: string;
}

function MeteorsImpl({ number = 15, className }: MeteorsProps) {
  // useState's lazy initializer (not useMemo) is the correct tool here:
  // it's guaranteed to run exactly once per mount no matter how many times
  // render is invoked, so the impure Math.random() calls stay pure from
  // React's perspective. useMemo offers no such guarantee — React is
  // explicitly allowed to re-run a memo callback (e.g. under concurrent
  // rendering), which would silently reshuffle the meteors on the same
  // mount and trips the react-hooks/purity lint rule.
  const [meteors] = useState(() =>
    Array.from({ length: number }, (_, i) => ({
      id: i,
      left: `${Math.floor(Math.random() * 100)}%`,
      delay: `${(Math.random() * 5).toFixed(1)}s`,
      duration: `${(Math.random() * 3 + 2).toFixed(1)}s`,
    }))
  );

  return (
    <>
      {meteors.map((m) => (
        <span
          key={m.id}
          className={cn(
            "pointer-events-none absolute top-0 left-1/2 h-0.5 w-0.5 rotate-[215deg] animate-meteor rounded-full bg-white/80 shadow-[0_0_0_1px_#ffffff10]",
            "before:content-[''] before:absolute before:top-1/2 before:right-0 before:h-px before:w-[50px] before:-translate-y-1/2 before:bg-gradient-to-r before:from-[#7c6cf099] before:to-transparent",
            className
          )}
          style={{
            left: m.left,
            animationDelay: m.delay,
            animationDuration: m.duration,
          }}
        />
      ))}
    </>
  );
}

export const Meteors = memo(MeteorsImpl);
