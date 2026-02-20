'use client';

import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
  type ChartData,
  type ChartOptions,
  type Plugin,
} from 'chart.js';
import { useLocale } from 'next-intl';
import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

const legendSpacingPlugin: Plugin<'line'> = {
  id: 'gc-legend-spacing',
  beforeInit(chart) {
    const legend = chart.legend;
    if (!legend) return;
    const originalFit = legend.fit;
    legend.fit = function fit() {
      originalFit.call(this);
      this.height += 20;
    };
  },
};

export type LineChartSeries = {
  key: string;
  label: string;
  color: string;
  values: number[];
};

type LineChartCardProps = {
  title: string;
  subtitle?: string;
  labels: string[];
  series: LineChartSeries[];
  toolbar?: ReactNode;
  emptyLabel?: string;
  className?: string;
};

function resolveClassName(value?: string) {
  return value ? ` ${value}` : '';
}

function resolveIntlLocale(locale: string) {
  return locale === 'vi' ? 'vi-VN' : 'en-US';
}

function formatCurrency(value: number, locale: string) {
  return new Intl.NumberFormat(resolveIntlLocale(locale), {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCompact(value: number, locale: string) {
  return new Intl.NumberFormat(resolveIntlLocale(locale), {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1,
  }).format(value);
}

function hexToRgba(hex: string, alpha: number) {
  const safeHex = hex.replace('#', '');
  const normalized =
    safeHex.length === 3
      ? safeHex
          .split('')
          .map(char => `${char}${char}`)
          .join('')
      : safeHex;
  const int = Number.parseInt(normalized, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function LineChartCard({ title, subtitle, labels, series, toolbar, emptyLabel = 'No data', className }: LineChartCardProps) {
  const locale = useLocale();
  const safeSeries = series
    .map(item => ({
      ...item,
      values: item.values.map(value => (Number.isFinite(value) ? value : 0)),
    }))
    .filter(item => item.values.length > 0);
  const chartMinWidth = labels.length > 12 ? labels.length * 40 : undefined;

  const chartData = useMemo<ChartData<'line'>>(
    () => ({
      labels,
      datasets: safeSeries.map(item => ({
        label: item.label,
        data: item.values,
        borderColor: item.color,
        backgroundColor: context => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) {
            return hexToRgba(item.color, 0.18);
          }
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, hexToRgba(item.color, 0.25));
          gradient.addColorStop(1, hexToRgba(item.color, 0.01));
          return gradient;
        },
        fill: false,
        borderWidth: 2.5,
        tension: 0.35,
        pointRadius: 2.5,
        pointHoverRadius: 5,
        pointBorderWidth: 0,
        pointBackgroundColor: item.color,
        pointHoverBackgroundColor: item.color,
      })),
    }),
    [labels, safeSeries],
  );

  const chartOptions = useMemo<ChartOptions<'line'>>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      animation: {
        duration: 420,
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            color: '#9ca3af',
            maxRotation: 55,
            minRotation: 55,
            autoSkip: false,
            font: {
              size: 10,
            },
          },
          border: {
            display: false,
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(255, 255, 255, 0.08)',
            lineWidth: 1,
          },
          ticks: {
            color: '#9ca3af',
            maxTicksLimit: 5,
            padding: 8,
            font: {
              size: 11,
            },
            callback: value => formatCompact(Number(value), locale),
          },
          border: {
            display: false,
          },
        },
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          align: 'start',
          labels: {
            color: '#d4d4d8',
            usePointStyle: true,
            pointStyle: 'circle',
            boxWidth: 8,
            boxHeight: 8,
            padding: 14,
            font: {
              size: 11,
              weight: 600,
            },
          },
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.94)',
          borderColor: 'rgba(148, 163, 184, 0.35)',
          borderWidth: 1,
          displayColors: false,
          padding: 10,
          callbacks: {
            title: items => items[0]?.label ?? '',
            label: context => `${context.dataset.label}: ${formatCurrency(Number(context.parsed.y || 0), locale)}`,
          },
        },
      },
    }),
    [locale],
  );

  return (
    <article className={`flex h-full min-h-0 min-w-0 flex-col rounded-xl border border-border bg-background-secondary p-4${resolveClassName(className)}`}>
      <header className='mb-3 flex shrink-0 flex-col gap-2 lg:flex-row lg:items-start lg:justify-between'>
        <div className='min-w-0'>
          <h3 className='m-0 text-sm font-semibold text-foreground'>{title}</h3>
          {subtitle ? <p className='m-0 mt-1 text-xs text-foreground-secondary'>{subtitle}</p> : null}
        </div>
        {toolbar ? <div className='w-full lg:w-auto'>{toolbar}</div> : null}
      </header>

      {safeSeries.length === 0 || labels.length === 0 ? (
        <div className='flex min-h-[14rem] flex-1 items-center justify-center rounded-lg border border-border bg-background-tertiary text-xs text-foreground-muted'>
          {emptyLabel}
        </div>
      ) : (
        <div className='min-h-[14rem] flex-1 overflow-x-auto rounded-lg border border-border bg-background-tertiary p-3'>
          <div className='h-full' style={chartMinWidth ? { minWidth: `${chartMinWidth}px` } : undefined}>
            <Line data={chartData} options={chartOptions} plugins={[legendSpacingPlugin]} />
          </div>
        </div>
      )}
    </article>
  );
}
