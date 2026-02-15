"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Copy, Plus, Save, Search, Sparkles, WalletCards } from "lucide-react";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import type { PriceProfileView, ProductView } from "@/types";
import {
  PriceProfileCreateForm,
  type PriceProfileCreateFormHandle,
  type PriceProfileCreateResult,
  type PriceProfileSubmitState,
} from "./price-profile-create-form";
import { Button, Drawer, Switch } from "antd";

type PriceProfileStatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

type PriceProfilesBoardProps = {
  products: ProductView[];
  costProfiles: PriceProfileView[];
  saleProfiles: PriceProfileView[];
  profileStats: {
    totalProfiles: number;
    activeProfiles: number;
    pricedProductsCount: number;
    averageProductsPerProfile: number;
  };
  isAdmin: boolean;
  statusFilter: PriceProfileStatusFilter;
  searchQuery: string;
  createAction: (
    formData: FormData,
  ) => Promise<PriceProfileCreateResult | void>;
  toggleAction: (formData: FormData) => Promise<void>;
  cloneAction: (formData: FormData) => Promise<void>;
};

const FILTER_OPTIONS: Array<{
  value: PriceProfileStatusFilter;
  labelKey: "all" | "active" | "inactive";
}> = [
  { value: "ALL", labelKey: "all" },
  { value: "ACTIVE", labelKey: "active" },
  { value: "INACTIVE", labelKey: "inactive" },
];
const CREATE_PROFILE_FORM_ID = "price-profile-create-form";

function getPriceRange(profile: PriceProfileView) {
  if (!profile.items.length) {
    return null;
  }

  const minPrice = Math.min(...profile.items.map((item) => item.pricePerKg));
  const maxPrice = Math.max(...profile.items.map((item) => item.pricePerKg));
  return `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`;
}

function buildPriceProfilesHref(
  status: PriceProfileStatusFilter,
  searchQuery: string,
) {
  const params = new URLSearchParams();

  if (searchQuery) {
    params.set("q", searchQuery);
  }

  if (status !== "ALL") {
    params.set("status", status);
  }

  return params.toString()
    ? `/price-profiles?${params.toString()}`
    : "/price-profiles";
}

type ProfileSectionProps = {
  title: string;
  emptyMessage: string;
  profiles: PriceProfileView[];
  tone: "cost" | "sale";
  showSeller: boolean;
  onToggleAction: (formData: FormData) => Promise<void>;
  onCloneAction: (formData: FormData) => Promise<void>;
  t: ReturnType<typeof useTranslations<"priceProfilesPage">>;
};

function ProfileSection({
  title,
  emptyMessage,
  profiles,
  tone,
  showSeller,
  onToggleAction,
  onCloneAction,
  t,
}: ProfileSectionProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between rounded-xl border border-border bg-background-secondary px-4 py-3">
        <h3 className="m-0 text-base font-semibold text-foreground">
          {title} ({profiles.length})
        </h3>
      </div>

      {!profiles.length ? (
        <div className="rounded-xl border border-border bg-background-secondary p-5 text-sm text-foreground-secondary">
          {emptyMessage}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {profiles.map((profile) => {
            const range = getPriceRange(profile);
            const lockCostActive = tone === "cost" && profile.isActive;

            return (
              <article
                key={profile.id}
                className="rounded-xl border border-border bg-background-secondary p-4 transition-colors hover:border-primary-500/50"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      tone === "cost"
                        ? "bg-sky-500/15 text-sky-300"
                        : "bg-amber-500/15 text-amber-300"
                    }`}
                  >
                    {tone === "cost" ? (
                      <WalletCards className="h-5 w-5" />
                    ) : (
                      <Sparkles className="h-5 w-5" />
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <form action={onCloneAction}>
                      <input
                        type="hidden"
                        name="profileId"
                        value={profile.id}
                      />
                      <button
                        type="submit"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background-tertiary text-foreground-secondary transition-colors hover:text-foreground"
                        aria-label={t("cloneButton")}
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </form>

                    <form action={onToggleAction}>
                      <Switch
                        checked={profile.isActive}
                        disabled={lockCostActive}
                      />
                    </form>
                  </div>
                </div>

                <h4 className="mb-1 mt-0 text-base font-semibold text-foreground">
                  {profile.name}
                </h4>
                {showSeller && tone === "sale" && profile.sellerName ? (
                  <p className="m-0 text-xs text-foreground-muted">
                    {t("sellerOwner", { name: profile.sellerName })}
                  </p>
                ) : null}
                <p className="mb-2 mt-1 text-sm text-foreground-secondary">
                  {profile.notes || t("noNotes")}
                </p>
                <p className="m-0 text-xs text-foreground-muted">
                  {t("effectiveUpdated", {
                    effective: formatDate(profile.effectiveFrom),
                    updated: formatDateTime(profile.updatedAt),
                  })}
                </p>

                <div className="mt-3 flex items-center justify-between rounded-lg border border-border bg-background-tertiary px-2.5 py-2 text-xs">
                  <span className="text-foreground-secondary">
                    {t("productsCount", { count: profile.items.length })}
                  </span>
                  <span className="font-medium text-foreground">
                    {range || t("noPrices")}
                  </span>
                </div>

                <details className="mt-3 text-sm text-foreground-secondary">
                  <summary className="cursor-pointer">
                    {t("viewPriceTable", { count: profile.items.length })}
                  </summary>
                  <div className="mt-2 max-h-48 overflow-auto rounded-lg border border-border">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="border-b border-border bg-background-tertiary px-2 py-1.5 text-left text-xs text-foreground-muted">
                            {t("table.product")}
                          </th>
                          <th className="border-b border-border bg-background-tertiary px-2 py-1.5 text-left text-xs text-foreground-muted">
                            {t("table.pricePerKg")}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {profile.items.map((item) => (
                          <tr key={`${profile.id}-${item.productId}`}>
                            <td className="border-b border-border px-2 py-1.5 text-sm text-foreground">
                              {item.productName}
                            </td>
                            <td className="border-b border-border px-2 py-1.5 text-sm text-foreground-secondary">
                              {formatCurrency(item.pricePerKg)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export function PriceProfilesBoard({
  products,
  costProfiles,
  saleProfiles,
  profileStats,
  isAdmin,
  statusFilter,
  searchQuery,
  createAction,
  toggleAction,
  cloneAction,
}: PriceProfilesBoardProps) {
  const t = useTranslations("priceProfilesPage");
  const tForm = useTranslations("priceProfileForm");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const createFormRef = useRef<PriceProfileCreateFormHandle | null>(null);
  const [createSubmitState, setCreateSubmitState] =
    useState<PriceProfileSubmitState>({
      canSubmit: false,
      isSubmitting: false,
    });

  const inactiveCount = useMemo(
    () => Math.max(profileStats.totalProfiles - profileStats.activeProfiles, 0),
    [profileStats.activeProfiles, profileStats.totalProfiles],
  );

  const hasAnyProfiles = isAdmin
    ? costProfiles.length > 0 || saleProfiles.length > 0
    : saleProfiles.length > 0;

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="m-0 text-2xl font-bold text-foreground">
            {t("title")}
          </h1>
          <p className="mt-1 text-sm text-foreground-secondary">
            {t("subtitle")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary-500 px-3 text-sm font-medium text-white transition-colors hover:bg-primary-600"
        >
          <Plus className="h-4 w-4" />
          {t("addButton")}
        </button>
      </div>

      <div className="mb-6 flex gap-4">
        {FILTER_OPTIONS.map((option) => {
          const isActive = statusFilter === option.value;
          const count =
            option.value === "ALL"
              ? profileStats.totalProfiles
              : option.value === "ACTIVE"
                ? profileStats.activeProfiles
                : inactiveCount;

          return (
            <Link
              key={option.value}
              href={buildPriceProfilesHref(option.value, searchQuery)}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors ${
                isActive
                  ? "bg-primary-500! text-white!"
                  : "bg-background-secondary! text-foreground-secondary! hover:bg-background-hover! hover:text-foreground!"
              }`}
            >
              {t(`filters.${option.labelKey}`)} ({count})
            </Link>
          );
        })}

        <form method="get" className="relative ml-auto flex-1 max-w-md">
          {statusFilter !== "ALL" ? (
            <input type="hidden" name="status" value={statusFilter} />
          ) : null}
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-secondary" />
          <input
            type="text"
            name="q"
            defaultValue={searchQuery}
            placeholder={t("searchPlaceholder")}
            className="h-10 w-full rounded-lg border border-border bg-background-secondary pl-10 pr-4 text-foreground placeholder:text-foreground-secondary focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </form>
      </div>

      {!hasAnyProfiles ? (
        <div className="flex h-56 flex-col items-center justify-center rounded-xl border border-border bg-background-secondary text-foreground-secondary">
          <WalletCards className="mb-3 h-10 w-10 opacity-60" />
          <p className="m-0">{t("empty")}</p>
        </div>
      ) : (
        <div className="space-y-5">
          {isAdmin ? (
            <ProfileSection
              title={t("lanes.cost")}
              emptyMessage={t("emptyCost")}
              profiles={costProfiles}
              tone="cost"
              showSeller={false}
              onToggleAction={toggleAction}
              onCloneAction={cloneAction}
              t={t}
            />
          ) : null}

          <ProfileSection
            title={t("lanes.sale")}
            emptyMessage={t("emptySale")}
            profiles={saleProfiles}
            tone="sale"
            showSeller={isAdmin}
            onToggleAction={toggleAction}
            onCloneAction={cloneAction}
            t={t}
          />
        </div>
      )}

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        placement="right"
        size={460}
        closable={{ placement: "end" }}
        destroyOnHidden
        title={
          <div>
            <h3 className="m-0 text-lg font-semibold text-foreground">
              {t("drawerTitle")}
            </h3>
            <p className="m-0 text-xs text-foreground-secondary">
              {t("drawerHint")}
            </p>
          </div>
        }
        footer={
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="default"
              onClick={() => createFormRef.current?.generateTestData()}
              disabled={createSubmitState.isSubmitting}
              className="border-border! bg-background-secondary! text-foreground-secondary! hover:border-primary-500/40! hover:text-foreground!"
            >
              {tForm("generateTestData")}
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              form={CREATE_PROFILE_FORM_ID}
              disabled={!createSubmitState.canSubmit}
              loading={createSubmitState.isSubmitting}
              icon={<Save className="h-4 w-4" />}
              className="border-primary-500! bg-primary-500! text-white! hover:border-primary-600! hover:bg-primary-600!"
            >
              {tForm("submit")}
            </Button>
          </div>
        }
      >
        <PriceProfileCreateForm
          ref={createFormRef}
          formId={CREATE_PROFILE_FORM_ID}
          products={products}
          action={createAction}
          canManageCost={isAdmin}
          onSubmitStateChange={setCreateSubmitState}
          onCreated={() => setDrawerOpen(false)}
        />
      </Drawer>
    </>
  );
}
