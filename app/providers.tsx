"use client";

import { useEffect } from "react";

import { RewardsProvider } from "@/app/providers/rewards-context";

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof performance === "undefined") return;
    // Some mobile webviews lack performance.clearMarks/clearMeasures; patch no-ops to avoid crashes.
    if (typeof performance.clearMarks !== "function") {
      performance.clearMarks = () => {};
    }
    if (typeof performance.clearMeasures !== "function") {
      performance.clearMeasures = () => {};
    }
   if (typeof performance.mark !== "function") {
  performance.mark = (() => ({}) as PerformanceMark) as typeof performance.mark;
}
    if (typeof performance.measure !== "function") {
      performance.measure = () => null as any;
    }
  }, []);

  return <RewardsProvider>{children}</RewardsProvider>;
}
