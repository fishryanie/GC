"use client";

import { useEffect } from "react";

function isMobileDevice() {
  if (typeof navigator === "undefined") {
    return false;
  }

  const ua = navigator.userAgent;
  const isTouchMac = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(ua) || isTouchMac;
}

export function MobileZoomLock() {
  useEffect(() => {
    if (typeof document === "undefined" || !isMobileDevice()) {
      return;
    }

    const preventDefault = (event: Event) => event.preventDefault();
    const preventMultiTouch = (event: TouchEvent) => {
      if (event.touches.length > 1) {
        event.preventDefault();
      }
    };

    document.addEventListener("gesturestart", preventDefault, { passive: false });
    document.addEventListener("gesturechange", preventDefault, { passive: false });
    document.addEventListener("gestureend", preventDefault, { passive: false });
    document.addEventListener("touchmove", preventMultiTouch, { passive: false });

    return () => {
      document.removeEventListener("gesturestart", preventDefault);
      document.removeEventListener("gesturechange", preventDefault);
      document.removeEventListener("gestureend", preventDefault);
      document.removeEventListener("touchmove", preventMultiTouch);
    };
  }, []);

  return null;
}
