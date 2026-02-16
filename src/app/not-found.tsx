import Link from "next/link";
import { Compass, Home, LogIn, SearchX } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function NotFoundPage() {
  const t = await getTranslations("notFoundPage");

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">
      <div className="pointer-events-none absolute -left-20 top-[-60px] h-72 w-72 rounded-full bg-primary-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-[-80px] h-80 w-80 rounded-full bg-sky-500/10 blur-3xl" />

      <section className="relative w-full max-w-2xl rounded-3xl border border-border bg-[linear-gradient(135deg,rgba(34,197,94,0.16),rgba(23,23,23,0.98)_45%,rgba(10,10,10,1)_100%)] p-6 shadow-[0_24px_56px_rgba(0,0,0,0.35)] sm:p-8">
        <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-primary-500/35 bg-primary-500/20">
          <SearchX className="h-7 w-7 text-primary-500" />
        </div>

        <p className="m-0 text-sm font-semibold uppercase tracking-[0.2em] text-primary-500">
          {t("code")}
        </p>
        <h1 className="m-0 mt-2 text-3xl font-bold text-foreground sm:text-4xl">
          {t("title")}
        </h1>
        <p className="m-0 mt-2 text-sm text-foreground-secondary sm:text-base">
          {t("subtitle")}
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link
            href="/dashboard"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-600"
          >
            <Home className="h-4 w-4" />
            {t("goDashboard")}
          </Link>

          <Link
            href="/login"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-background-secondary px-4 text-sm font-semibold text-foreground transition-colors hover:bg-background-hover"
          >
            <LogIn className="h-4 w-4" />
            {t("goLogin")}
          </Link>
        </div>

        <div className="mt-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-foreground-secondary transition-colors hover:text-foreground"
          >
            <Compass className="h-4 w-4" />
            {t("goHome")}
          </Link>
        </div>
      </section>
    </main>
  );
}
