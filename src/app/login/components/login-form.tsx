"use client";

import { useMemo, useState } from "react";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { loginAction } from "@/app/login/actions";

type LoginFormProps = {
  returnTo: string;
};

export function LoginForm({ returnTo }: LoginFormProps) {
  const t = useTranslations("loginPage");
  const [showPassword, setShowPassword] = useState(false);

  const passwordType = useMemo(() => (showPassword ? "text" : "password"), [showPassword]);

  return (
    <form action={loginAction} className="space-y-5">
      <input type="hidden" name="returnTo" value={returnTo} />

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-foreground">{t("email")}</span>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" />
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder="admin@gc.vn"
            className="focus-ring h-10 w-full rounded-lg border border-border bg-background-secondary pl-9 pr-3 text-sm text-foreground placeholder:text-foreground-muted"
          />
        </div>
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-foreground">{t("password")}</span>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" />
          <input
            type={passwordType}
            name="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className="focus-ring h-10 w-full rounded-lg border border-border bg-background-secondary pl-9 pr-10 text-sm text-foreground placeholder:text-foreground-muted"
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-foreground-muted transition-colors hover:bg-background-hover hover:text-foreground"
            aria-label={showPassword ? t("hidePassword") : t("showPassword")}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </label>

      <button
        type="submit"
        className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-primary-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-600"
      >
        {t("submit")}
      </button>
    </form>
  );
}
