import type { ReactNode } from "react";

type SellerMetricCardTone = "emerald" | "sky" | "amber" | "violet" | "zinc";

const TONE_CLASS: Record<SellerMetricCardTone, string> = {
  emerald: "border-emerald-500/25 bg-emerald-500/10",
  sky: "border-sky-500/25 bg-sky-500/10",
  amber: "border-amber-500/25 bg-amber-500/10",
  violet: "border-violet-500/25 bg-violet-500/10",
  zinc: "border-border bg-background-tertiary",
};

type SellerMetricCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  icon?: ReactNode;
  tone?: SellerMetricCardTone;
};

export function SellerMetricCard({
  label,
  value,
  hint,
  icon,
  tone = "zinc",
}: SellerMetricCardProps) {
  return (
    <article className={`rounded-xl border p-4 ${TONE_CLASS[tone]}`}>
      <div className="mb-2 flex items-center gap-2 text-xs text-foreground-secondary">
        {icon ? (
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-black/20">
            {icon}
          </span>
        ) : null}
        <span>{label}</span>
      </div>
      <p className="m-0 text-2xl font-bold text-foreground">{value}</p>
      {hint ? <p className="m-0 mt-1 text-xs text-foreground-muted">{hint}</p> : null}
    </article>
  );
}
