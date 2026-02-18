'use server';

import { requireAdminSession } from 'lib/auth';
import { getSellerTrendChartData, type SellerTrendGranularity } from 'lib/data';

export async function getSellerTrendChartDataAction(input: {
  sellerId: string;
  granularity: SellerTrendGranularity;
  startDate?: string;
  endDate?: string;
  year?: number;
}) {
  await requireAdminSession();
  return getSellerTrendChartData(input.sellerId, {
    granularity: input.granularity,
    startDate: input.startDate,
    endDate: input.endDate,
    year: input.year,
  });
}
