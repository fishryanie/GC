import { FlashAlert } from '@/components/flash-alert';
import { connectToDatabase } from '@/lib/mongodb';
import { getFlashMessage } from '@/lib/flash';
import { resolveSearchParams } from '@/lib/search-params';
import { getSearchValue } from '@/lib/search-value';
import { CustomerOrderLink } from '@/models/customer-order-link';
import { Customer } from '@/models/customer';
import { PriceProfile } from '@/models/price-profile';
import { ArrowRight } from 'lucide-react';
import { Types } from 'mongoose';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { unstable_noStore as noStore } from 'next/cache';
import { startPublicOrderCustomerSessionAction } from './actions';
import { PublicOrderBuilder } from './components/public-order-builder';

function isValidToken(value: string) {
  return /^[A-Za-z0-9_-]{12,120}$/.test(value);
}

export default async function PublicOrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams?: Record<string, string | string[] | undefined> | Promise<Record<string, string | string[] | undefined>>;
}) {
  noStore();

  const t = await getTranslations('publicOrderPage');
  const resolvedParams = await params;
  const token = resolvedParams.token;
  const requestTime = new Date();
  const resolvedSearchParams = await resolveSearchParams(searchParams);
  const customerIdParam = getSearchValue(resolvedSearchParams.customerId).trim();
  const flash = getFlashMessage(resolvedSearchParams);

  type UnavailableReason = 'NOT_FOUND' | 'DISABLED' | 'EXPIRED' | 'NO_SALE_PRICES';

  let orderLink:
    | {
        token: string;
        sellerName: string;
        expiresAt: Date;
        isActive: boolean;
        saleProfile: {
          profileId: Types.ObjectId;
          profileName: string;
          effectiveFrom: Date;
          items: Array<{
            productId: Types.ObjectId;
            productName: string;
            pricePerKg: number;
          }>;
        };
      }
    | null = null;
  let unavailableReason: UnavailableReason | null = null;

  let customer:
    | {
        id: string;
        name: string;
        phone: string;
      }
    | null = null;

  if (isValidToken(token)) {
    await connectToDatabase();

    const linkDoc = await CustomerOrderLink.findOne({ token }).lean();
    if (!linkDoc) {
      unavailableReason = 'NOT_FOUND';
    } else if (!linkDoc.isActive) {
      unavailableReason = 'DISABLED';
    } else if (new Date(linkDoc.expiresAt).getTime() <= requestTime.getTime()) {
      unavailableReason = 'EXPIRED';
    } else {
      const rawItems = (linkDoc.saleProfile?.items || [])
        .filter(item => Number(item.pricePerKg) > 0)
        .map(item => ({
          productId: item.productId,
          productName: item.productName,
          pricePerKg: item.pricePerKg,
        }));
      const rawEffectiveFrom = linkDoc.saleProfile?.effectiveFrom ? new Date(linkDoc.saleProfile.effectiveFrom) : null;
      const hasInlineSnapshot = rawItems.length > 0 && rawEffectiveFrom && !Number.isNaN(rawEffectiveFrom.getTime());

      let resolvedProfileId = linkDoc.saleProfile?.profileId;
      let resolvedProfileName = linkDoc.saleProfile?.profileName || '';
      let resolvedEffectiveFrom = rawEffectiveFrom;
      let resolvedItems = rawItems;

      if (!hasInlineSnapshot && resolvedProfileId) {
        const fallbackProfile = await PriceProfile.findOne({
          _id: resolvedProfileId,
          type: 'SALE',
        }).lean();

        if (fallbackProfile?.items?.length) {
          resolvedProfileId = fallbackProfile._id;
          resolvedProfileName = fallbackProfile.name;
          resolvedEffectiveFrom = new Date(fallbackProfile.effectiveFrom);
          resolvedItems = fallbackProfile.items
            .filter(item => Number(item.pricePerKg) > 0)
            .map(item => ({
              productId: item.productId,
              productName: item.productName,
              pricePerKg: item.pricePerKg,
            }));
        }
      }

      if (!resolvedProfileId || !resolvedEffectiveFrom || Number.isNaN(resolvedEffectiveFrom.getTime()) || !resolvedItems.length) {
        unavailableReason = 'NO_SALE_PRICES';
      } else {
        orderLink = {
          token: linkDoc.token,
          sellerName: linkDoc.sellerName,
          expiresAt: new Date(linkDoc.expiresAt),
          isActive: linkDoc.isActive,
          saleProfile: {
            profileId: resolvedProfileId,
            profileName: resolvedProfileName || 'Sale profile',
            effectiveFrom: resolvedEffectiveFrom,
            items: resolvedItems,
          },
        };
      }
    }

    if (orderLink && Types.ObjectId.isValid(customerIdParam)) {
      const customerDoc = await Customer.findOne({
        _id: new Types.ObjectId(customerIdParam),
        isActive: true,
      }).lean();

      if (customerDoc) {
        customer = {
          id: String(customerDoc._id),
          name: customerDoc.name,
          phone: customerDoc.phone,
        };
      }
    }
  }

  const linkIsUnavailable = !orderLink;
  const availableOrderLink = linkIsUnavailable ? null : orderLink;
  const unavailableMessage =
    unavailableReason === 'DISABLED'
      ? t('unavailableDisabled')
      : unavailableReason === 'EXPIRED'
        ? t('unavailableExpired')
        : unavailableReason === 'NO_SALE_PRICES'
          ? t('unavailableMissingPrices')
          : t('unavailableSubtitle');

  return (
    <div className='min-h-screen bg-background px-4 py-6 sm:px-6'>
      <div className='mx-auto w-full max-w-[1320px] space-y-4'>
        <header className='rounded-xl border border-border bg-background-secondary p-5'>
          <p className='m-0 text-xs font-semibold uppercase tracking-[0.12em] text-foreground-muted'>{t('tag')}</p>
          <h1 className='mb-1 mt-2 text-2xl font-bold text-foreground'>{t('title')}</h1>
          <p className='m-0 text-sm text-foreground-secondary'>{t('subtitle')}</p>
        </header>

        {flash ? <FlashAlert type={flash.type} message={flash.message} /> : null}

        {linkIsUnavailable ? (
          <section className='rounded-xl border border-red-500/35 bg-red-500/10 p-5'>
            <h2 className='m-0 text-lg font-semibold text-red-200'>{t('unavailableTitle')}</h2>
            <p className='mb-0 mt-2 text-sm text-red-100'>{unavailableMessage}</p>
          </section>
        ) : !customer && availableOrderLink ? (
          <section className='rounded-xl border border-border bg-background-secondary p-5'>
            <h2 className='m-0 text-lg font-semibold text-foreground'>{t('phoneStepTitle')}</h2>
            <p className='mb-0 mt-1 text-sm text-foreground-secondary'>{t('phoneStepSubtitle', { seller: availableOrderLink.sellerName })}</p>

            <form action={startPublicOrderCustomerSessionAction} className='mt-4 space-y-3'>
              <input type='hidden' name='token' value={token} />
              <label className='block space-y-1.5'>
                <span className='text-sm text-foreground-secondary'>{t('phoneLabel')}</span>
                <input
                  name='phone'
                  type='tel'
                  placeholder={t('phonePlaceholder')}
                  className='focus-ring h-11 w-full rounded-lg border border-border bg-background-tertiary px-3 text-sm text-foreground'
                  required
                />
              </label>

              <button
                type='submit'
                className='inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-600'>
                {t('phoneSubmit')}
                <ArrowRight className='h-4 w-4' />
              </button>
            </form>
          </section>
        ) : availableOrderLink && customer ? (
          <>
            <div className='flex justify-end'>
              <Link href={`/o/${token}`} className='text-sm text-foreground-secondary transition-colors hover:text-foreground'>
                {t('changePhone')}
              </Link>
            </div>

            <PublicOrderBuilder
              token={token}
              customer={customer}
              sellerName={availableOrderLink.sellerName}
              saleProfileName={availableOrderLink.saleProfile.profileName}
              saleItems={availableOrderLink.saleProfile.items.map(item => ({
                productId: String(item.productId),
                productName: item.productName,
                pricePerKg: item.pricePerKg,
              }))}
            />
          </>
        ) : null}
      </div>
    </div>
  );
}
