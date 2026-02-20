'use client';

import { getOrdersTrendChartDataAction } from '@/app/(admin)/orders/actions';
import { LineChartCard } from '@/components/line-chart-card';
import { DatePicker, Segmented, Spin, message } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import type { OrderFilters, SellerTrendChartData, SellerTrendGranularity } from 'lib/data';
import { useTranslations } from 'next-intl';
import { useCallback, useMemo, useState, useTransition } from 'react';

type DailyRangeValue = [Dayjs | null, Dayjs | null] | null;

type OrdersTrendSectionProps = {
  initialData: SellerTrendChartData;
  filters: OrderFilters;
  canViewCost: boolean;
  className?: string;
};

function buildDefaultDailyRange(): [Dayjs, Dayjs] {
  const now = dayjs();
  return [now.startOf('month'), now.endOf('month')];
}

function normalizeDailyRange(value: DailyRangeValue): [Dayjs, Dayjs] {
  if (!value || !value[0] || !value[1]) {
    return buildDefaultDailyRange();
  }

  if (value[0].isAfter(value[1])) {
    return buildDefaultDailyRange();
  }

  return [value[0], value[1]];
}

export function OrdersTrendSection({ initialData, filters, canViewCost, className }: OrdersTrendSectionProps) {
  const t = useTranslations('ordersPage');
  const [isPending, startTransition] = useTransition();
  const [granularity, setGranularity] = useState<SellerTrendGranularity>(initialData.granularity ?? 'DAILY');
  const [trendData, setTrendData] = useState<SellerTrendChartData>(initialData);
  const [dailyRange, setDailyRange] = useState<DailyRangeValue>(() => {
    if (initialData.appliedStartDate && initialData.appliedEndDate) {
      return [dayjs(initialData.appliedStartDate), dayjs(initialData.appliedEndDate)];
    }

    return buildDefaultDailyRange();
  });
  const [yearValue, setYearValue] = useState<number>(initialData.appliedYear ?? dayjs().year());

  const loadTrendData = useCallback(
    (nextGranularity: SellerTrendGranularity, options?: { dailyRange?: DailyRangeValue; year?: number }) => {
      startTransition(() => {
        void (async () => {
          try {
            if (nextGranularity === 'DAILY') {
              const [start, end] = normalizeDailyRange(options?.dailyRange ?? dailyRange);
              const result = await getOrdersTrendChartDataAction({
                filters,
                granularity: 'DAILY',
                startDate: start.startOf('day').toISOString(),
                endDate: end.endOf('day').toISOString(),
              });
              setTrendData(result);
              return;
            }

            if (nextGranularity === 'MONTHLY') {
              const nextYear = Number.isFinite(options?.year) ? Math.floor(options?.year as number) : yearValue;
              const result = await getOrdersTrendChartDataAction({
                filters,
                granularity: 'MONTHLY',
                year: nextYear,
              });
              setTrendData(result);
              return;
            }

            const result = await getOrdersTrendChartDataAction({
              filters,
              granularity: 'YEARLY',
            });
            setTrendData(result);
          } catch {
            message.error(t('charts.loadError'));
          }
        })();
      });
    },
    [dailyRange, filters, t, yearValue],
  );

  const handleGranularityChange = (value: string | number) => {
    const next = String(value) as SellerTrendGranularity;
    setGranularity(next);

    if (next === 'DAILY') {
      const fallback = normalizeDailyRange(dailyRange);
      setDailyRange(fallback);
      loadTrendData('DAILY', { dailyRange: fallback });
      return;
    }

    if (next === 'MONTHLY') {
      loadTrendData('MONTHLY', { year: yearValue });
      return;
    }

    loadTrendData('YEARLY');
  };

  const handleDailyRangeChange = (value: DailyRangeValue) => {
    const normalized = normalizeDailyRange(value);
    setDailyRange(normalized);

    if (granularity !== 'DAILY') {
      return;
    }

    loadTrendData('DAILY', { dailyRange: normalized });
  };

  const handleYearChange = (value: Dayjs | null) => {
    const nextYear = value?.year() ?? dayjs().year();
    setYearValue(nextYear);

    if (granularity !== 'MONTHLY') {
      return;
    }

    loadTrendData('MONTHLY', { year: nextYear });
  };

  const chartLabels = useMemo(() => trendData.points.map(point => point.label), [trendData.points]);
  const chartSeries = useMemo(
    () => [
      {
        key: 'revenue',
        label: t('cards.revenue'),
        color: '#22c55e',
        values: trendData.points.map(point => point.revenue),
      },
      ...(canViewCost
        ? [
            {
              key: 'cost',
              label: t('sellerStats.columns.cost'),
              color: '#f59e0b',
              values: trendData.points.map(point => point.cost),
            },
            {
              key: 'profit',
              label: t('sellerStats.columns.profit'),
              color: '#38bdf8',
              values: trendData.points.map(point => point.profit),
            },
          ]
        : []),
    ],
    [canViewCost, t, trendData.points],
  );

  const resolvedClassName = className ? ` ${className}` : '';

  return (
    <section className={`relative min-h-0 min-w-0${resolvedClassName}`}>
      <div className='relative h-full min-h-0'>
        {isPending ? (
          <div className='pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-black/20 backdrop-blur-[1px]'>
            <Spin size='small' />
          </div>
        ) : null}

        <LineChartCard
          className='h-full'
          title={t('charts.deliveryTrendTitle')}
          subtitle={t('charts.deliveryTrendHint')}
          toolbar={
            <div className='flex w-full flex-wrap items-center gap-2 lg:w-auto lg:justify-end'>
              <Segmented
                value={granularity}
                onChange={handleGranularityChange}
                options={[
                  { label: t('charts.daily'), value: 'DAILY' },
                  { label: t('charts.monthly'), value: 'MONTHLY' },
                  { label: t('charts.yearly'), value: 'YEARLY' },
                ]}
              />

              {granularity === 'DAILY' ? (
                <DatePicker.RangePicker
                  value={dailyRange}
                  onChange={handleDailyRangeChange}
                  allowClear
                  format='DD/MM/YYYY'
                  className='w-full lg:w-[320px]'
                  placeholder={[t('charts.rangeStart'), t('charts.rangeEnd')]}
                />
              ) : null}

              {granularity === 'MONTHLY' ? (
                <DatePicker
                  picker='year'
                  allowClear
                  value={dayjs().year(yearValue).startOf('year')}
                  onChange={handleYearChange}
                  className='w-full lg:w-[160px]'
                  placeholder={t('charts.pickYear')}
                />
              ) : null}
            </div>
          }
          labels={chartLabels}
          series={chartSeries}
          emptyLabel={t('charts.empty')}
        />
      </div>
    </section>
  );
}
