"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Share2, Smartphone, X } from "lucide-react";
import { useTranslations } from "next-intl";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
};

function isMobileUserAgent() {
  if (typeof navigator === "undefined") {
    return false;
  }

  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

function isIos() {
  if (typeof navigator === "undefined") {
    return false;
  }

  const iOSByUa = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const iPadOs = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return iOSByUa || iPadOs;
}

function isStandaloneMode() {
  if (typeof window === "undefined") {
    return false;
  }

  const byMedia = window.matchMedia("(display-mode: standalone)").matches;
  const byNavigator = Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
  return byMedia || byNavigator;
}

export function PwaMobileInstall() {
  const t = useTranslations("pwaPrompt");
  const [isOpen, setIsOpen] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIosDevice, setIsIosDevice] = useState(false);
  const [manualHint, setManualHint] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!isMobileUserAgent() || isStandaloneMode()) {
      return;
    }

    setIsIosDevice(isIos());
    setIsOpen(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const onAppInstalled = () => {
      setIsOpen(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!("serviceWorker" in navigator) || !window.isSecureContext) {
      return;
    }

    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) =>
          Promise.all(registrations.map((registration) => registration.unregister())),
        )
        .catch(() => undefined);

      if ("caches" in window) {
        caches
          .keys()
          .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
          .catch(() => undefined);
      }

      return;
    }

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => registration.update())
      .catch((error) => {
        console.error("[pwa] service worker registration failed", error);
      });
  }, []);

  const installButtonLabel = useMemo(() => {
    if (deferredPrompt) {
      return t("installButton");
    }

    if (isIosDevice) {
      return t("iosButton");
    }

    return t("androidButton");
  }, [deferredPrompt, isIosDevice, t]);

  async function handleInstallClick() {
    if (isIosDevice) {
      if (typeof navigator !== "undefined" && "share" in navigator) {
        try {
          setInstalling(true);
          await navigator.share({
            title: t("title"),
            text: t("subtitle"),
            url: window.location.href,
          });
          setManualHint(t("iosShareOpenedHint"));
        } catch {
          setManualHint(t("iosShareFallbackHint"));
        } finally {
          setInstalling(false);
        }
        return;
      }

      setManualHint(t("iosShareFallbackHint"));
      return;
    }

    if (!deferredPrompt) {
      setManualHint(t("androidManual"));
      return;
    }

    try {
      setInstalling(true);
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;

      if (choice.outcome === "accepted") {
        setIsOpen(false);
      }
    } finally {
      setInstalling(false);
      setDeferredPrompt(null);
    }
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/65 p-3">
      <div className="w-full max-w-md rounded-2xl border border-border bg-background-secondary p-4 shadow-2xl">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="flex items-start gap-2.5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary-500/20 text-primary-500">
              <Smartphone className="h-5 w-5" />
            </span>
            <div>
              <p className="m-0 text-base font-semibold text-foreground">{t("title")}</p>
              <p className="m-0 mt-1 text-xs text-foreground-secondary">{t("subtitle")}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background-tertiary text-foreground-secondary"
            aria-label={t("closeAria")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="rounded-xl border border-border bg-background-tertiary p-3 text-xs text-foreground-secondary">
          {isIosDevice ? (
            <div className="space-y-1.5">
              <p className="m-0 font-medium text-foreground">{t("iosTitle")}</p>
              <p className="m-0">
                <span className="font-semibold text-foreground">1.</span> {t("iosStep1")}
              </p>
              <p className="m-0 inline-flex items-center gap-1">
                <span className="font-semibold text-foreground">2.</span> {t("iosStep2")}{" "}
                <Share2 className="h-3.5 w-3.5 text-foreground" />
              </p>
              <p className="m-0">
                <span className="font-semibold text-foreground">3.</span> {t("iosStep3")}
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <p className="m-0 font-medium text-foreground">{t("androidTitle")}</p>
              {deferredPrompt ? (
                <p className="m-0">{t("androidReady")}</p>
              ) : (
                <p className="m-0">{t("androidManual")}</p>
              )}
            </div>
          )}
        </div>
        {manualHint ? (
          <p className="m-0 mt-2 text-xs text-primary-400">{manualHint}</p>
        ) : null}

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-background-tertiary text-sm font-medium text-foreground-secondary"
          >
            {t("skipButton")}
          </button>

          <button
            type="button"
            onClick={handleInstallClick}
            disabled={installing}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary-500 px-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Download className="h-4 w-4" />
            {installing ? t("installing") : installButtonLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
