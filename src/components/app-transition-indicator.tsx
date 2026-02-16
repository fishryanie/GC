"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

function isModifiedClick(event: MouseEvent) {
  return (
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    event.button !== 0
  );
}

const FALLBACK_STOP_MS = 12000;
const TOAST_DELAY_MS = 120;

export function AppTransitionIndicator() {
  const t = useTranslations("common");
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchValue = useMemo(() => searchParams.toString(), [searchParams]);

  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const fallbackTimerRef = useRef<number | null>(null);
  const pendingSubmitterRef = useRef<HTMLButtonElement | null>(null);

  const clearPendingSubmitter = useCallback(() => {
    const pendingSubmitter = pendingSubmitterRef.current;
    if (!pendingSubmitter) {
      return;
    }

    pendingSubmitter.removeAttribute("data-submit-pending");
    pendingSubmitter.removeAttribute("aria-busy");
    pendingSubmitterRef.current = null;
  }, []);

  const stopLoading = useCallback(() => {
    if (fallbackTimerRef.current) {
      window.clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }

    clearPendingSubmitter();
    setIsLoading(false);
    setShowToast(false);
  }, [clearPendingSubmitter]);

  const startLoading = useCallback(
    (submitter?: HTMLButtonElement | null) => {
      if (submitter && !submitter.dataset.localPending) {
        clearPendingSubmitter();
        submitter.setAttribute("data-submit-pending", "true");
        submitter.setAttribute("aria-busy", "true");
        pendingSubmitterRef.current = submitter;
      }

      setIsLoading(true);

      if (fallbackTimerRef.current) {
        window.clearTimeout(fallbackTimerRef.current);
      }

      fallbackTimerRef.current = window.setTimeout(() => {
        stopLoading();
      }, FALLBACK_STOP_MS);
    },
    [clearPendingSubmitter, stopLoading],
  );

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      stopLoading();
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [pathname, searchValue, stopLoading]);

  useEffect(() => {
    if (!isLoading) {
      return;
    }

    const timer = window.setTimeout(() => setShowToast(true), TOAST_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [isLoading]);

  useEffect(() => {
    const onDocumentClick = (event: MouseEvent) => {
      if (isModifiedClick(event)) {
        return;
      }

      const target = event.target as Element | null;
      const anchor = target?.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor) {
        return;
      }

      if (anchor.target && anchor.target !== "_self") {
        return;
      }

      if (anchor.hasAttribute("download")) {
        return;
      }

      const nextUrl = new URL(anchor.href, window.location.href);
      const currentUrl = new URL(window.location.href);

      if (nextUrl.origin !== currentUrl.origin) {
        return;
      }

      if (
        nextUrl.pathname === currentUrl.pathname &&
        nextUrl.search === currentUrl.search
      ) {
        return;
      }

      startLoading();
    };

    const onDocumentSubmit = (event: Event) => {
      const submitEvent = event as SubmitEvent;
      const submitter = submitEvent.submitter as
        | HTMLButtonElement
        | HTMLInputElement
        | null;

      startLoading(submitter instanceof HTMLButtonElement ? submitter : null);
    };

    const onPageShow = () => {
      stopLoading();
    };

    document.addEventListener("click", onDocumentClick, true);
    document.addEventListener("submit", onDocumentSubmit, true);
    window.addEventListener("pageshow", onPageShow);

    return () => {
      document.removeEventListener("click", onDocumentClick, true);
      document.removeEventListener("submit", onDocumentSubmit, true);
      window.removeEventListener("pageshow", onPageShow);
      stopLoading();
    };
  }, [startLoading, stopLoading]);

  return (
    <>
      <div
        className={`pointer-events-none fixed inset-x-0 top-0 z-[1200] h-[3px] transition-opacity duration-150 ${
          isLoading ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="h-full w-[38%] animate-[gc-progress_1.1s_ease-in-out_infinite] bg-primary-500 shadow-[0_0_16px_rgba(34,197,94,0.75)]" />
      </div>

      {showToast ? (
        <div className="pointer-events-none fixed right-3 top-3 z-[1199]">
          <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-300/30 bg-background-secondary/95 px-3 py-2 text-xs text-foreground shadow-lg backdrop-blur">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary-500" />
            {t("loading")}
          </div>
        </div>
      ) : null}
    </>
  );
}
