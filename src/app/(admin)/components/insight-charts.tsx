type InsightTrendDatum = {
  label: string;
  value: number;
};

type InsightBreakdownDatum = {
  label: string;
  value: number;
  color: string;
};

type InsightLineChartCardProps = {
  title: string;
  subtitle?: string;
  data: InsightTrendDatum[];
  color?: string;
  valueFormatter?: (value: number) => string;
  emptyLabel?: string;
  className?: string;
};

type InsightDonutChartCardProps = {
  title: string;
  subtitle?: string;
  data: InsightBreakdownDatum[];
  valueFormatter?: (value: number) => string;
  emptyLabel?: string;
  className?: string;
};

type InsightHorizontalBarsCardProps = {
  title: string;
  subtitle?: string;
  data: InsightBreakdownDatum[];
  valueFormatter?: (value: number) => string;
  emptyLabel?: string;
  className?: string;
};

function resolveClassName(value?: string) {
  return value ? ` ${value}` : "";
}

function defaultNumberFormatter(value: number) {
  return value.toLocaleString("vi-VN");
}

function buildLineChartGeometry(data: InsightTrendDatum[]) {
  if (data.length === 0) {
    return { path: "", areaPath: "", points: [] as Array<{ x: number; y: number; label: string; value: number }> };
  }

  const values = data.map((item) => item.value);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 1);
  const range = max - min || 1;

  const points = data.map((item, index) => {
    const x = data.length > 1 ? 6 + (index / (data.length - 1)) * 88 : 50;
    const y = 12 + ((max - item.value) / range) * 70;
    return { x, y, label: item.label, value: item.value };
  });

  const path = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(" ");

  const areaPath = points.length
    ? `${path} L ${points[points.length - 1]?.x.toFixed(2)} 86 L ${points[0]?.x.toFixed(2)} 86 Z`
    : "";

  return { path, areaPath, points };
}

export function InsightLineChartCard({
  title,
  subtitle,
  data,
  color = "#22c55e",
  valueFormatter = defaultNumberFormatter,
  emptyLabel = "No data",
  className,
}: InsightLineChartCardProps) {
  const safeData = data.filter((item) => Number.isFinite(item.value));
  const { path, areaPath, points } = buildLineChartGeometry(safeData);

  return (
    <article className={`rounded-xl border border-border bg-background-secondary p-4${resolveClassName(className)}`}>
      <header className="mb-3">
        <h3 className="m-0 text-sm font-semibold text-foreground">{title}</h3>
        {subtitle ? <p className="m-0 mt-1 text-xs text-foreground-secondary">{subtitle}</p> : null}
      </header>

      {safeData.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-lg border border-border bg-background-tertiary text-xs text-foreground-muted">
          {emptyLabel}
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-border bg-background-tertiary px-2 py-2">
            <svg viewBox="0 0 100 90" className="h-40 w-full" preserveAspectRatio="none">
              {[18, 35, 52, 69].map((yLine) => (
                <line key={yLine} x1="4" y1={yLine} x2="96" y2={yLine} stroke="currentColor" strokeOpacity="0.1" strokeWidth="0.5" />
              ))}

              {areaPath ? <path d={areaPath} fill={color} fillOpacity="0.15" /> : null}
              {path ? <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /> : null}

              {points.map((point) => (
                <g key={`${point.label}-${point.x}`}>
                  <circle cx={point.x} cy={point.y} r="1.3" fill={color}>
                    <title>{`${point.label}: ${valueFormatter(point.value)}`}</title>
                  </circle>
                </g>
              ))}
            </svg>
          </div>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-foreground-muted">
            <span>{safeData[0]?.label}</span>
            <span>{safeData[Math.floor((safeData.length - 1) / 2)]?.label}</span>
            <span>{safeData[safeData.length - 1]?.label}</span>
          </div>
        </>
      )}
    </article>
  );
}

function buildDonutGradient(data: InsightBreakdownDatum[]) {
  const total = data.reduce((sum, item) => sum + Math.max(item.value, 0), 0);

  if (!total) {
    return { total, gradient: "conic-gradient(#262626 0deg 360deg)" };
  }

  let cursor = 0;
  const segments = data
    .filter((item) => item.value > 0)
    .map((item) => {
      const start = cursor;
      const angle = (item.value / total) * 360;
      const end = start + angle;
      cursor = end;
      return `${item.color} ${start.toFixed(2)}deg ${end.toFixed(2)}deg`;
    });

  return { total, gradient: `conic-gradient(${segments.join(", ")})` };
}

export function InsightDonutChartCard({
  title,
  subtitle,
  data,
  valueFormatter = defaultNumberFormatter,
  emptyLabel = "No data",
  className,
}: InsightDonutChartCardProps) {
  const normalized = data.map((item) => ({ ...item, value: Number(item.value || 0) }));
  const { total, gradient } = buildDonutGradient(normalized);

  return (
    <article className={`rounded-xl border border-border bg-background-secondary p-4${resolveClassName(className)}`}>
      <header className="mb-3">
        <h3 className="m-0 text-sm font-semibold text-foreground">{title}</h3>
        {subtitle ? <p className="m-0 mt-1 text-xs text-foreground-secondary">{subtitle}</p> : null}
      </header>

      {!normalized.length ? (
        <div className="flex h-28 items-center justify-center rounded-lg border border-border bg-background-tertiary text-xs text-foreground-muted">
          {emptyLabel}
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <div className="relative h-28 w-28 shrink-0">
            <div className="h-full w-full rounded-full" style={{ background: gradient }} />
            <div className="absolute inset-[18px] flex items-center justify-center rounded-full bg-background-secondary text-xs font-semibold text-foreground">
              {valueFormatter(total)}
            </div>
          </div>

          <div className="flex-1 space-y-2">
            {normalized.map((item) => {
              const percent = total > 0 ? (item.value / total) * 100 : 0;
              return (
                <div key={item.label} className="flex items-center gap-2 text-xs">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="min-w-0 flex-1 truncate text-foreground-secondary">{item.label}</span>
                  <span className="font-medium text-foreground">{valueFormatter(item.value)}</span>
                  <span className="text-foreground-muted">({percent.toFixed(0)}%)</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </article>
  );
}

export function InsightHorizontalBarsCard({
  title,
  subtitle,
  data,
  valueFormatter = defaultNumberFormatter,
  emptyLabel = "No data",
  className,
}: InsightHorizontalBarsCardProps) {
  const normalized = data.map((item) => ({ ...item, value: Number(item.value || 0) }));
  const maxValue = normalized.reduce((current, item) => Math.max(current, item.value), 0);

  return (
    <article className={`rounded-xl border border-border bg-background-secondary p-4${resolveClassName(className)}`}>
      <header className="mb-3">
        <h3 className="m-0 text-sm font-semibold text-foreground">{title}</h3>
        {subtitle ? <p className="m-0 mt-1 text-xs text-foreground-secondary">{subtitle}</p> : null}
      </header>

      {!normalized.length ? (
        <div className="flex h-28 items-center justify-center rounded-lg border border-border bg-background-tertiary text-xs text-foreground-muted">
          {emptyLabel}
        </div>
      ) : (
        <div className="space-y-2.5">
          {normalized.map((item) => {
            const widthPercent = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
            return (
              <div key={item.label}>
                <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                  <span className="truncate text-foreground-secondary">{item.label}</span>
                  <span className="font-medium text-foreground">{valueFormatter(item.value)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-background-tertiary">
                  <div className="h-full rounded-full transition-[width]" style={{ width: `${widthPercent}%`, backgroundColor: item.color }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </article>
  );
}

export type { InsightBreakdownDatum, InsightTrendDatum };
