"use client";

import { useEffect, useState } from "react";

function isMobileDevice() {
  if (typeof navigator === "undefined") {
    return false;
  }

  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

export function MobileFlashScreen() {
  const [phase, setPhase] = useState<"hidden" | "show" | "fade">("hidden");

  useEffect(() => {
    if (!isMobileDevice()) {
      return;
    }

    setPhase("show");
    const fadeTimer = window.setTimeout(() => setPhase("fade"), 720);
    const hideTimer = window.setTimeout(() => setPhase("hidden"), 980);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  if (phase === "hidden") {
    return null;
  }

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-[2200] flex items-center justify-center bg-[#0a0a0a] transition-opacity duration-300 ${
        phase === "fade" ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center gap-3">
        <div className="relative h-20 w-20 overflow-hidden rounded-2xl border border-white/10 bg-[#171717] shadow-2xl shadow-emerald-500/15">
          <img
            src="/apple-touch-icon.png"
            alt="GC Flow"
            className="h-full w-full object-cover"
          />
        </div>
        <div className="text-center">
          <p className="m-0 text-base font-semibold tracking-[0.08em] text-white">GC Flow</p>
          <p className="m-0 text-xs text-white/60">Sales Operations</p>
        </div>
      </div>
    </div>
  );
}
