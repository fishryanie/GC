import { FlashAlert } from "@/app/components/flash-alert";
import { LoginForm } from "@/app/login/components/login-form";
import { ensureDefaultAdminAccount, getAuthSession } from "@/lib/auth";
import { getFlashMessage } from "@/lib/flash";
import { resolveSearchParams } from "@/lib/search-params";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

function getSearchValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams?:
    | Record<string, string | string[] | undefined>
    | Promise<Record<string, string | string[] | undefined>>;
}) {
  await ensureDefaultAdminAccount();
  const session = await getAuthSession();

  if (session) {
    redirect("/dashboard");
  }

  const params = await resolveSearchParams(searchParams);
  const flash = getFlashMessage(params);
  const returnTo = getSearchValue(params.returnTo);
  const normalizedReturnTo =
    returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/dashboard";
  const t = await getTranslations("loginPage");

  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        <aside className="relative hidden w-1/2 overflow-hidden bg-[linear-gradient(145deg,#14532d,#166534,#0f172a)] p-12 lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute -left-20 top-10 h-80 w-80 rounded-full border border-white/50" />
            <div className="absolute bottom-6 right-4 h-96 w-96 rounded-full border border-white/30" />
            <div className="absolute left-1/3 top-1/2 h-52 w-52 rounded-full border border-white/30" />
          </div>

          <div className="relative z-10 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
              <span className="text-sm font-bold text-white">GC</span>
            </div>
            <span className="text-2xl font-bold text-white">GC</span>
          </div>

          <div className="relative z-10">
            <h1 className="mb-4 text-4xl font-bold leading-tight text-white">{t("heroTitle")}</h1>
            <p className="max-w-md text-lg text-white/80">{t("heroSubtitle")}</p>
          </div>

          <div className="relative z-10 flex gap-12">
            <div>
              <p className="text-3xl font-bold text-white">11+</p>
              <p className="text-sm text-white/75">{t("heroStatProducts")}</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">24/7</p>
              <p className="text-sm text-white/75">{t("heroStatOps")}</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">100%</p>
              <p className="text-sm text-white/75">{t("heroStatTracking")}</p>
            </div>
          </div>
        </aside>

        <main className="relative flex flex-1 items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_18%_20%,rgba(34,197,94,0.3),transparent_42%),radial-gradient(circle_at_85%_15%,rgba(250,204,21,0.22),transparent_45%),linear-gradient(150deg,#111827,#1f2937,#0f172a)] p-8">
          <div className="pointer-events-none absolute inset-0 opacity-50">
            <div className="absolute -right-24 top-8 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />
            <div className="absolute bottom-8 left-8 h-64 w-64 rounded-full bg-amber-300/20 blur-3xl" />
          </div>

          <div className="relative z-10 w-full max-w-[460px] rounded-3xl border border-white/15 bg-[linear-gradient(145deg,rgba(255,255,255,0.12),rgba(17,24,39,0.84)_35%,rgba(2,6,23,0.9)_100%)] p-7 shadow-[0_30px_80px_rgba(2,6,23,0.55)] backdrop-blur">
            <div className="mb-8 lg:hidden">
              <div className="mb-3 flex items-center justify-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500 shadow-[0_8px_20px_rgba(34,197,94,0.35)]">
                  <span className="text-sm font-bold text-white">GC</span>
                </div>
                <span className="text-2xl font-bold text-primary-500">GC</span>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-foreground">{t("title")}</h2>
              <p className="mt-2 text-foreground-secondary">{t("subtitle")}</p>
            </div>

            {flash ? <FlashAlert type={flash.type} message={flash.message} /> : null}

            <LoginForm returnTo={normalizedReturnTo} />

            <div className="mt-8 grid grid-cols-3 gap-2">
              <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-2 py-2 text-center">
                <p className="m-0 text-base font-bold text-emerald-200">11+</p>
                <p className="m-0 text-[11px] text-emerald-100/90">{t("heroStatProducts")}</p>
              </div>
              <div className="rounded-lg border border-sky-400/30 bg-sky-500/10 px-2 py-2 text-center">
                <p className="m-0 text-base font-bold text-sky-200">24/7</p>
                <p className="m-0 text-[11px] text-sky-100/90">{t("heroStatOps")}</p>
              </div>
              <div className="rounded-lg border border-amber-400/30 bg-amber-500/10 px-2 py-2 text-center">
                <p className="m-0 text-base font-bold text-amber-200">100%</p>
                <p className="m-0 text-[11px] text-amber-100/90">{t("heroStatTracking")}</p>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-white/15 bg-black/20 p-4">
              <p className="mb-2 text-xs text-foreground-muted">{t("demoTitle")}</p>
              <p className="m-0 text-sm text-foreground">{t("demoAdmin")}</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
