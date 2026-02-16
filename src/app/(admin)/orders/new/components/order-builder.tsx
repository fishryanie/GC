"use client";

import { Select } from "antd";
import { useMemo, useState, type FormEvent } from "react";
import {
  Trash2,
  Plus,
  User,
  CalendarClock,
  Tags,
  AlertTriangle,
  BadgePercent,
} from "lucide-react";
import { useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";
import { formatCurrency, formatDate, formatKg } from "@/lib/format";
import type { CustomerView, PriceProfileView, ProductView } from "@/types";

type OrderBuilderProps = {
  products: ProductView[];
  customers: CustomerView[];
  saleProfiles: PriceProfileView[];
  activeCostProfile: PriceProfileView | null;
  hasActiveCostProfile: boolean;
  canViewCost: boolean;
  initialCustomerId?: string;
  action: (formData: FormData) => void | Promise<void>;
};

type DraftLine = {
  id: string;
  productId: string;
  weightKg: number;
};

type NewCustomerDraft = {
  name: string;
  phone: string;
  email: string;
  notes: string;
};

function createLine(productId: string): DraftLine {
  return {
    id: Math.random().toString(36).slice(2, 10),
    productId,
    weightKg: 1,
  };
}

function getPriceMap(profile: PriceProfileView | undefined) {
  return new Map(profile?.items.map((item) => [item.productId, item.pricePerKg]) ?? []);
}

function isSystemSaleProfile(profile: PriceProfileView) {
  return !profile.sellerId;
}

function SubmitButton({ disabled, pendingLabel, idleLabel }: { disabled: boolean; pendingLabel: string; idleLabel: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="inline-flex h-10 items-center rounded-lg bg-primary-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? pendingLabel : idleLabel}
    </button>
  );
}

export function OrderBuilder({
  products,
  customers,
  saleProfiles,
  activeCostProfile,
  hasActiveCostProfile,
  canViewCost,
  initialCustomerId,
  action,
}: OrderBuilderProps) {
  const t = useTranslations("orderBuilder");

  const initialProductId = products[0]?.id ?? "";

  const [lines, setLines] = useState<DraftLine[]>(initialProductId ? [createLine(initialProductId)] : []);
  const [customerOptions, setCustomerOptions] = useState<CustomerView[]>(customers);
  const [customerId, setCustomerId] = useState(() => {
    if (initialCustomerId && customers.some((customer) => customer.id === initialCustomerId)) {
      return initialCustomerId;
    }

    return customers[0]?.id ?? "";
  });
  const [saleProfileId, setSaleProfileId] = useState(saleProfiles[0]?.id ?? "");
  const [deliveryDate, setDeliveryDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [requestedDiscountPercent, setRequestedDiscountPercent] = useState(0);
  const [discountReason, setDiscountReason] = useState("");

  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [createCustomerError, setCreateCustomerError] = useState("");
  const [newCustomerDraft, setNewCustomerDraft] = useState<NewCustomerDraft>({
    name: "",
    phone: "",
    email: "",
    notes: "",
  });

  const selectedCostProfile = useMemo(() => activeCostProfile ?? undefined, [activeCostProfile]);
  const selectedSaleProfile = useMemo(
    () => saleProfiles.find((profile) => profile.id === saleProfileId),
    [saleProfiles, saleProfileId],
  );
  const selectedSaleProfileIsSystem = useMemo(
    () => (selectedSaleProfile ? isSystemSaleProfile(selectedSaleProfile) : false),
    [selectedSaleProfile],
  );
  const canRequestDiscount = !canViewCost;
  const normalizedDiscountPercent = useMemo(
    () => Math.min(90, Math.max(0, Number(requestedDiscountPercent) || 0)),
    [requestedDiscountPercent],
  );
  const hasDiscountRequest = canRequestDiscount && normalizedDiscountPercent > 0;

  const costPriceMap = useMemo(
    () => (canViewCost ? getPriceMap(selectedCostProfile) : new Map<string, number>()),
    [canViewCost, selectedCostProfile],
  );
  const salePriceMap = useMemo(() => getPriceMap(selectedSaleProfile), [selectedSaleProfile]);

  const parsedLines = useMemo(
    () =>
      lines.filter(
        (line) => line.productId && Number.isFinite(line.weightKg) && Number(line.weightKg) > 0,
      ),
    [lines],
  );

  const productMap = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const productSelectOptions = useMemo(
    () =>
      products.map((product) => ({
        value: product.id,
        label: product.name,
      })),
    [products],
  );
  const customerSelectOptions = useMemo(
    () =>
      customerOptions.map((customer) => ({
        value: customer.id,
        label: `${customer.name} - ${customer.phone}`,
      })),
    [customerOptions],
  );
  const saleProfileSelectOptions = useMemo(
    () =>
      saleProfiles.map((profile) => {
        const systemOwned = isSystemSaleProfile(profile);

        return {
          value: profile.id,
          label: (
            <div className="flex items-center justify-between gap-2">
              <span className="truncate">{profile.name}</span>
              <span
                className={`inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.04em] ${
                  systemOwned
                    ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-200"
                    : "border-sky-500/35 bg-sky-500/10 text-sky-200"
                }`}
              >
                {systemOwned ? t("systemProfile") : t("sellerProfile")}
              </span>
            </div>
          ),
        };
      }),
    [saleProfiles, t],
  );

  const calculatedRows = useMemo(() => {
    const summary = parsedLines.reduce(
      (accumulator, line) => {
        const product = productMap.get(line.productId);
        const costPrice = costPriceMap.get(line.productId);
        const salePrice = salePriceMap.get(line.productId);
        const lineCost = (costPrice ?? 0) * line.weightKg;
        const lineSale = (salePrice ?? 0) * line.weightKg;

        const missingPriceProductIds =
          !product || salePrice === undefined || (canViewCost && costPrice === undefined)
            ? new Set([...accumulator.missingPriceProductIds, line.productId])
            : accumulator.missingPriceProductIds;

        return {
          rows: [
            ...accumulator.rows,
            {
              ...line,
              productName: product?.name ?? "N/A",
              costPrice: costPrice ?? 0,
              salePrice: salePrice ?? 0,
              lineCost,
              lineSale,
            },
          ],
          totalWeight: accumulator.totalWeight + line.weightKg,
          totalCost: accumulator.totalCost + lineCost,
          totalSale: accumulator.totalSale + lineSale,
          missingPriceProductIds,
        };
      },
      {
        rows: [] as Array<{
          id: string;
          productId: string;
          weightKg: number;
          productName: string;
          costPrice: number;
          salePrice: number;
          lineCost: number;
          lineSale: number;
        }>,
        totalWeight: 0,
        totalCost: 0,
        totalSale: 0,
        missingPriceProductIds: new Set<string>(),
      },
    );

    return {
      ...summary,
      totalProfit: summary.totalSale - summary.totalCost,
    };
  }, [parsedLines, productMap, costPriceMap, salePriceMap, canViewCost]);

  const missingPriceNames = useMemo(
    () =>
      Array.from(calculatedRows.missingPriceProductIds)
        .map((productId) => productMap.get(productId)?.name)
        .filter(Boolean)
        .join(", "),
    [calculatedRows.missingPriceProductIds, productMap],
  );
  const discountAmountPreview = useMemo(
    () => Math.round((calculatedRows.totalSale * normalizedDiscountPercent) / 100),
    [calculatedRows.totalSale, normalizedDiscountPercent],
  );
  const requestedSalePreview = useMemo(
    () => Math.max(0, calculatedRows.totalSale - discountAmountPreview),
    [calculatedRows.totalSale, discountAmountPreview],
  );
  const hasDiscountReasonError = hasDiscountRequest && !discountReason.trim();
  const canUseDiscountFlow = hasDiscountRequest && selectedSaleProfileIsSystem;

  const canSubmit =
    parsedLines.length > 0 &&
    calculatedRows.missingPriceProductIds.size === 0 &&
    Boolean(deliveryDate) &&
    Boolean(saleProfileId) &&
    Boolean(customerId) &&
    !hasDiscountReasonError;

  async function handleCreateCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!newCustomerDraft.name.trim() || !newCustomerDraft.phone.trim()) {
      setCreateCustomerError(t("customerModal.required"));
      return;
    }

    setIsCreatingCustomer(true);
    setCreateCustomerError("");

    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newCustomerDraft.name,
          phone: newCustomerDraft.phone,
          email: newCustomerDraft.email,
          notes: newCustomerDraft.notes,
        }),
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        message?: string;
        customer?: { id: string; name: string; phone: string; email: string; notes: string };
      };

      if (!response.ok || !payload.ok || !payload.customer) {
        setCreateCustomerError(payload.message || t("customerModal.createFailed"));
        return;
      }

      const createdCustomer: CustomerView = {
        id: payload.customer.id,
        name: payload.customer.name,
        phone: payload.customer.phone,
        email: payload.customer.email,
        notes: payload.customer.notes,
        isActive: true,
        orderCount: 0,
        totalSpentAmount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setCustomerOptions((previous) => [...previous, createdCustomer].sort((a, b) => a.name.localeCompare(b.name)));
      setCustomerId(createdCustomer.id);
      setIsCustomerModalOpen(false);
      setNewCustomerDraft({ name: "", phone: "", email: "", notes: "" });
      setCreateCustomerError("");
    } catch (error) {
      console.error("[order-builder:create-customer]", error);
      setCreateCustomerError(t("customerModal.createFailed"));
    } finally {
      setIsCreatingCustomer(false);
    }
  }

  if (products.length === 0) {
    return (
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
        {t("noProducts")}
      </div>
    );
  }

  if (!hasActiveCostProfile || saleProfiles.length === 0 || (canViewCost && !selectedCostProfile)) {
    return (
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
        {!hasActiveCostProfile || canViewCost ? t("noProfiles") : t("noSaleProfiles")}
      </div>
    );
  }

  return (
    <form action={action} className="w-full space-y-4">
      <input
        type="hidden"
        name="itemsJson"
        value={JSON.stringify(
          parsedLines.map((line) => ({
            productId: line.productId,
            weightKg: line.weightKg,
          })),
        )}
      />
      <input type="hidden" name="customerId" value={customerId} />
      <input type="hidden" name="saleProfileId" value={saleProfileId} />
      <input type="hidden" name="deliveryDate" value={deliveryDate} />
      <input
        type="hidden"
        name="requestedDiscountPercent"
        value={hasDiscountRequest ? normalizedDiscountPercent : 0}
      />
      <input
        type="hidden"
        name="discountReason"
        value={hasDiscountRequest ? discountReason : ""}
      />

      <section className="sticky top-0 z-30 rounded-xl border border-border bg-background-secondary p-4 shadow-[0_12px_20px_rgba(0,0,0,0.18)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="m-0 text-sm font-semibold text-foreground">{t("readyTitle")}</p>
            <p className="m-0 text-xs text-foreground-secondary">{t("snapshotHint")}</p>
          </div>
          <SubmitButton
            disabled={!canSubmit}
            pendingLabel={t("submitPending")}
            idleLabel={t("submitIdle")}
          />
        </div>
        {missingPriceNames ? (
          <div className="mt-3 inline-flex items-start gap-2 rounded-lg border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
            <AlertTriangle className="mt-[1px] h-4 w-4 shrink-0" />
            {t("missingPrices", { names: missingPriceNames })}
          </div>
        ) : null}
        {canRequestDiscount ? (
          <div className="mt-2 text-xs text-foreground-secondary">
            {hasDiscountRequest
              ? t("approvalHintDiscount")
              : t("approvalHint")}
          </div>
        ) : null}
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-xl border border-border bg-background-secondary p-4">
          <p className="mb-3 mt-0 inline-flex items-center gap-2 text-sm font-semibold text-foreground">
            <User className="h-4 w-4" />
            {t("orderInfoTitle")}
          </p>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1.5 md:col-span-2">
              <span className="text-sm text-foreground-secondary">{t("customer")}</span>
              <div className="flex gap-2">
                <Select
                  value={customerId}
                  onChange={(value) => setCustomerId(String(value))}
                  disabled={customerOptions.length === 0}
                  placeholder={t("customerEmpty")}
                  className="w-full"
                  options={customerSelectOptions}
                />
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(true)}
                  className="inline-flex h-10 shrink-0 items-center gap-1 rounded-lg border border-border bg-background-tertiary px-3 text-sm font-medium text-foreground-secondary transition-colors hover:text-foreground"
                >
                  <Plus className="h-4 w-4" />
                  {t("addCustomer")}
                </button>
              </div>
            </label>

            <label className="space-y-1.5">
              <span className="text-sm text-foreground-secondary">{t("deliveryDate")}</span>
              <div className="relative">
                <CalendarClock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" />
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(event) => setDeliveryDate(event.target.value)}
                  className="focus-ring h-10 w-full rounded-lg border border-border bg-background-tertiary pl-9 pr-3 text-sm text-foreground"
                />
              </div>
            </label>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-background-secondary p-4">
          <p className="mb-3 mt-0 inline-flex items-center gap-2 text-sm font-semibold text-foreground">
            <Tags className="h-4 w-4" />
            {t("profileSelectorTitle")}
          </p>

          <div className="grid gap-3 md:grid-cols-2">
            {canViewCost ? (
              <article className="rounded-lg border border-border bg-background-tertiary p-3">
                <p className="mb-2 mt-0 text-sm font-medium text-foreground">{t("costProfileTitle")}</p>
                <div className="rounded-lg border border-border bg-background-secondary px-3 py-2.5 text-sm text-foreground">
                  {selectedCostProfile?.name ?? t("costProfileMissing")}
                </div>
                {selectedCostProfile ? (
                  <p className="mb-0 mt-2 text-xs text-foreground-secondary">
                    {t("effective", { date: formatDate(selectedCostProfile.effectiveFrom) })} •{" "}
                    {t("pricedProducts", { count: selectedCostProfile.items.length })}
                  </p>
                ) : null}
              </article>
            ) : (
              <article className="rounded-lg border border-border bg-background-tertiary p-3">
                <p className="mb-2 mt-0 text-sm font-medium text-foreground">{t("costProfileAutoTitle")}</p>
                <p className="m-0 text-xs text-foreground-secondary">{t("costProfileAutoHint")}</p>
              </article>
            )}

            <article className="rounded-lg border border-border bg-background-tertiary p-3">
              <p className="mb-2 mt-0 text-sm font-medium text-foreground">{t("saleProfileTitle")}</p>
              <Select
                value={saleProfileId}
                onChange={(value) => setSaleProfileId(String(value))}
                className="w-full"
                options={saleProfileSelectOptions}
              />
              {selectedSaleProfile ? (
                <p className="mb-0 mt-2 text-xs text-foreground-secondary">
                  {t("effective", { date: formatDate(selectedSaleProfile.effectiveFrom) })} •{" "}
                  {t("pricedProducts", { count: selectedSaleProfile.items.length })} •{" "}
                  {selectedSaleProfileIsSystem ? t("systemProfile") : t("sellerProfile")}
                </p>
              ) : null}
            </article>
          </div>
        </section>
      </div>

      {canRequestDiscount ? (
        <section className="rounded-xl border border-border bg-background-secondary p-4">
          <p className="mb-3 mt-0 inline-flex items-center gap-2 text-sm font-semibold text-foreground">
            <BadgePercent className="h-4 w-4" />
            {t("discountRequestTitle")}
          </p>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-sm text-foreground-secondary">{t("discountPercent")}</span>
              <div className="flex h-10 items-center overflow-hidden rounded-lg border border-border bg-background-tertiary">
                <input
                  type="number"
                  min={0}
                  max={90}
                  step={0.5}
                  value={normalizedDiscountPercent}
                  onChange={(event) => setRequestedDiscountPercent(Number(event.target.value || 0))}
                  className="focus-ring h-full w-full bg-transparent px-3 text-sm text-foreground"
                />
                <span className="px-3 text-xs text-foreground-muted">%</span>
              </div>
            </label>

            <label className="space-y-1.5">
              <span className="text-sm text-foreground-secondary">{t("discountReason")}</span>
              <input
                type="text"
                value={discountReason}
                onChange={(event) => setDiscountReason(event.target.value)}
                placeholder={t("discountReasonPlaceholder")}
                className="focus-ring h-10 w-full rounded-lg border border-border bg-background-tertiary px-3 text-sm text-foreground"
              />
            </label>
          </div>

          {hasDiscountRequest ? (
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <article className="rounded-lg border border-border bg-background-tertiary px-3 py-2">
                <p className="m-0 text-xs text-foreground-muted">{t("discountBaseSale")}</p>
                <p className="m-0 mt-1 text-sm font-semibold text-foreground">
                  {formatCurrency(calculatedRows.totalSale)}
                </p>
              </article>
              <article className="rounded-lg border border-amber-500/35 bg-amber-500/10 px-3 py-2">
                <p className="m-0 text-xs text-amber-200">{t("discountAmount")}</p>
                <p className="m-0 mt-1 text-sm font-semibold text-amber-100">
                  {formatCurrency(discountAmountPreview)}
                </p>
              </article>
              <article className="rounded-lg border border-emerald-500/35 bg-emerald-500/10 px-3 py-2">
                <p className="m-0 text-xs text-emerald-200">{t("discountRequestedSale")}</p>
                <p className="m-0 mt-1 text-sm font-semibold text-emerald-100">
                  {formatCurrency(requestedSalePreview)}
                </p>
              </article>
            </div>
          ) : null}

          {hasDiscountRequest && !selectedSaleProfileIsSystem ? (
            <div className="mt-3 rounded-lg border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
              {t("discountSystemProfileOnly")}
            </div>
          ) : null}

          {hasDiscountReasonError ? (
            <div className="mt-3 rounded-lg border border-red-500/35 bg-red-500/10 px-3 py-2 text-xs text-red-200">
              {t("discountReasonRequired")}
            </div>
          ) : null}

          {canUseDiscountFlow ? (
            <div className="mt-3 text-xs text-foreground-secondary">
              {t("discountApprovalFlowHint")}
            </div>
          ) : null}
        </section>
      ) : null}

      <div className="grid gap-4 2xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <section className="rounded-xl border border-border bg-background-secondary p-4 2xl:sticky 2xl:top-[84px] 2xl:self-start">
          <div className="mb-3 flex items-center justify-between">
            <p className="m-0 text-sm font-semibold text-foreground">{t("cartTitle")}</p>
            <button
              type="button"
              onClick={() => setLines((previous) => [...previous, createLine(products[0].id)])}
              className="inline-flex h-9 items-center gap-1 rounded-lg border border-border bg-background-tertiary px-3 text-sm font-medium text-foreground-secondary transition-colors hover:text-foreground"
            >
              <Plus className="h-4 w-4" />
              {t("addProduct")}
            </button>
          </div>

          <div className="space-y-2">
            {lines.map((line, index) => (
              <div key={line.id} className="grid gap-2 md:grid-cols-[minmax(0,1fr)_180px_48px]">
                <Select
                  value={line.productId}
                  onChange={(value) => {
                    const nextProductId = String(value);
                    setLines((previous) =>
                      previous.map((item) =>
                        item.id === line.id ? { ...item, productId: nextProductId } : item,
                      ),
                    );
                  }}
                  className="w-full"
                  options={productSelectOptions}
                />

                <div className="flex h-10 items-center overflow-hidden rounded-lg border border-border bg-background-tertiary">
                  <input
                    type="number"
                    min={0.01}
                    step={0.01}
                    value={line.weightKg}
                    onChange={(event) => {
                      const nextWeight = Number(event.target.value || 0);
                      setLines((previous) =>
                        previous.map((item) =>
                          item.id === line.id ? { ...item, weightKg: nextWeight } : item,
                        ),
                      );
                    }}
                    className="focus-ring h-full w-full bg-transparent px-3 text-sm text-foreground"
                  />
                  <span className="px-3 text-xs text-foreground-muted">kg</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (lines.length === 1) {
                      return;
                    }
                    setLines((previous) => previous.filter((item) => item.id !== line.id));
                  }}
                  disabled={lines.length === 1 && index === 0}
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-background-tertiary text-foreground-secondary transition-colors hover:border-red-500/40 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label={t("removeLineAria")}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-background-secondary p-4">
          <p className="mb-3 mt-0 text-sm font-semibold text-foreground">{t("summaryTitle")}</p>

          <div className="mb-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-lg border border-border bg-background-tertiary px-3 py-2">
              <p className="m-0 text-xs text-foreground-muted">{t("table.kg")}</p>
              <p className="m-0 mt-1 text-sm font-semibold text-foreground">{formatKg(calculatedRows.totalWeight)}</p>
            </article>
            <article className="rounded-lg border border-border bg-background-tertiary px-3 py-2">
              <p className="m-0 text-xs text-foreground-muted">{t("table.saleTotal")}</p>
              <p className="m-0 mt-1 text-sm font-semibold text-foreground">{formatCurrency(calculatedRows.totalSale)}</p>
            </article>
            {canViewCost ? (
              <>
                <article className="rounded-lg border border-border bg-background-tertiary px-3 py-2">
                  <p className="m-0 text-xs text-foreground-muted">{t("table.costTotal")}</p>
                  <p className="m-0 mt-1 text-sm font-semibold text-foreground">{formatCurrency(calculatedRows.totalCost)}</p>
                </article>
                <article className="rounded-lg border border-emerald-500/35 bg-emerald-500/10 px-3 py-2">
                  <p className="m-0 text-xs text-emerald-200">{t("table.profit")}</p>
                  <p className="m-0 mt-1 text-sm font-semibold text-emerald-100">{formatCurrency(calculatedRows.totalProfit)}</p>
                </article>
              </>
            ) : hasDiscountRequest ? (
              <article className="rounded-lg border border-emerald-500/35 bg-emerald-500/10 px-3 py-2 sm:col-span-2">
                <p className="m-0 text-xs text-emerald-200">{t("discountRequestedSale")}</p>
                <p className="m-0 mt-1 text-sm font-semibold text-emerald-100">{formatCurrency(requestedSalePreview)}</p>
              </article>
            ) : null}
          </div>

          <div className="overflow-x-auto rounded-lg border border-border">
            <table className={`w-full border-collapse ${canViewCost ? "min-w-[760px]" : "min-w-[560px]"}`}>
              <thead>
                <tr className="border-b border-border">
                  <th className="px-2 py-2 text-left text-sm font-semibold text-foreground">{t("table.product")}</th>
                  <th className="px-2 py-2 text-left text-sm font-semibold text-foreground">{t("table.kg")}</th>
                  <th className="px-2 py-2 text-left text-sm font-semibold text-foreground">{t("table.salePerKg")}</th>
                  <th className="px-2 py-2 text-left text-sm font-semibold text-foreground">{t("table.saleTotal")}</th>
                  {canViewCost ? (
                    <>
                      <th className="px-2 py-2 text-left text-sm font-semibold text-foreground">{t("table.costPerKg")}</th>
                      <th className="px-2 py-2 text-left text-sm font-semibold text-foreground">{t("table.costTotal")}</th>
                      <th className="px-2 py-2 text-left text-sm font-semibold text-foreground">{t("table.profit")}</th>
                    </>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {calculatedRows.rows.map((row) => (
                  <tr key={row.id} className="border-b border-border/70">
                    <td className="px-2 py-2 text-sm text-foreground">{row.productName}</td>
                    <td className="px-2 py-2 text-sm text-foreground-secondary">{formatKg(row.weightKg)}</td>
                    <td className="px-2 py-2 text-sm text-foreground-secondary">{formatCurrency(row.salePrice)}</td>
                    <td className="px-2 py-2 text-sm text-foreground-secondary">{formatCurrency(row.lineSale)}</td>
                    {canViewCost ? (
                      <>
                        <td className="px-2 py-2 text-sm text-foreground-secondary">{formatCurrency(row.costPrice)}</td>
                        <td className="px-2 py-2 text-sm text-foreground-secondary">{formatCurrency(row.lineCost)}</td>
                        <td className="px-2 py-2 text-sm text-emerald-300">{formatCurrency(row.lineSale - row.lineCost)}</td>
                      </>
                    ) : null}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="px-2 py-2 text-sm font-semibold text-foreground">{t("table.grandTotal")}</td>
                  <td className="px-2 py-2 text-sm font-semibold text-foreground">{formatKg(calculatedRows.totalWeight)}</td>
                  <td className="px-2 py-2 text-sm text-foreground-muted">-</td>
                  <td className="px-2 py-2 text-sm font-semibold text-foreground">{formatCurrency(calculatedRows.totalSale)}</td>
                  {canViewCost ? (
                    <>
                      <td className="px-2 py-2 text-sm text-foreground-muted">-</td>
                      <td className="px-2 py-2 text-sm font-semibold text-foreground">{formatCurrency(calculatedRows.totalCost)}</td>
                      <td className="px-2 py-2 text-sm font-semibold text-emerald-300">{formatCurrency(calculatedRows.totalProfit)}</td>
                    </>
                  ) : null}
                </tr>
                {hasDiscountRequest ? (
                  <tr>
                    <td className="px-2 pb-2 pt-0 text-xs text-foreground-secondary">
                      {t("discountRequestedSale")}
                    </td>
                    <td className="px-2 pb-2 pt-0 text-xs text-foreground-muted">-</td>
                    <td className="px-2 pb-2 pt-0 text-xs text-foreground-muted">-</td>
                    <td className="px-2 pb-2 pt-0 text-xs font-semibold text-emerald-300">
                      {formatCurrency(requestedSalePreview)}
                    </td>
                    {canViewCost ? (
                      <>
                        <td className="px-2 pb-2 pt-0 text-xs text-foreground-muted">-</td>
                        <td className="px-2 pb-2 pt-0 text-xs text-foreground-muted">-</td>
                        <td className="px-2 pb-2 pt-0 text-xs font-semibold text-emerald-300">
                          {formatCurrency(requestedSalePreview - calculatedRows.totalCost)}
                        </td>
                      </>
                    ) : null}
                  </tr>
                ) : null}
              </tfoot>
            </table>
          </div>
        </section>
      </div>

      {isCustomerModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <div className="w-full max-w-lg rounded-xl border border-border bg-background-secondary p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="m-0 text-lg font-semibold text-foreground">{t("customerModal.title")}</h3>
              <button
                type="button"
                onClick={() => {
                  setIsCustomerModalOpen(false);
                  setCreateCustomerError("");
                }}
                className="rounded-lg p-2 text-foreground-secondary transition-colors hover:bg-background-hover hover:text-foreground"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3">
              <label className="block space-y-1.5">
                <span className="text-sm text-foreground-secondary">{t("customerModal.name")}</span>
                <input
                  value={newCustomerDraft.name}
                  onChange={(event) =>
                    setNewCustomerDraft((previous) => ({ ...previous, name: event.target.value }))
                  }
                  required
                  className="focus-ring h-10 w-full rounded-lg border border-border bg-background-tertiary px-3 text-sm text-foreground"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-sm text-foreground-secondary">{t("customerModal.phone")}</span>
                <input
                  value={newCustomerDraft.phone}
                  onChange={(event) =>
                    setNewCustomerDraft((previous) => ({ ...previous, phone: event.target.value }))
                  }
                  required
                  className="focus-ring h-10 w-full rounded-lg border border-border bg-background-tertiary px-3 text-sm text-foreground"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-sm text-foreground-secondary">{t("customerModal.email")}</span>
                <input
                  type="email"
                  value={newCustomerDraft.email}
                  onChange={(event) =>
                    setNewCustomerDraft((previous) => ({ ...previous, email: event.target.value }))
                  }
                  className="focus-ring h-10 w-full rounded-lg border border-border bg-background-tertiary px-3 text-sm text-foreground"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-sm text-foreground-secondary">{t("customerModal.notes")}</span>
                <textarea
                  value={newCustomerDraft.notes}
                  onChange={(event) =>
                    setNewCustomerDraft((previous) => ({ ...previous, notes: event.target.value }))
                  }
                  rows={3}
                  className="focus-ring w-full rounded-lg border border-border bg-background-tertiary px-3 py-2 text-sm text-foreground"
                />
              </label>

              {createCustomerError ? (
                <div className="rounded-lg border border-red-500/35 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                  {createCustomerError}
                </div>
              ) : null}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomerModalOpen(false);
                    setCreateCustomerError("");
                  }}
                  className="inline-flex h-10 items-center rounded-lg border border-border bg-background-tertiary px-4 text-sm font-semibold text-foreground-secondary transition-colors hover:text-foreground"
                >
                  {t("customerModal.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={isCreatingCustomer}
                  className="inline-flex h-10 items-center rounded-lg bg-primary-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isCreatingCustomer ? t("customerModal.creating") : t("customerModal.submit")}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </form>
  );
}
