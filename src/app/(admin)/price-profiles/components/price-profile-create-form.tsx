"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { faker } from "@faker-js/faker";
import {
  Checkbox,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  message,
} from "antd";
import type { PriceProfileType } from "@/lib/constants";
import { PRICE_PROFILE_TYPES } from "@/lib/constants";
import type { ProductView } from "@/types";

type PriceProfileCreateFormValues = {
  name: string;
  type?: PriceProfileType;
  isActive?: boolean;
  notes?: string;
  prices?: Record<string, number | null>;
};

export type PriceProfileCreateResult = {
  ok: boolean;
  message: string;
};

export type PriceProfileSubmitState = {
  canSubmit: boolean;
  isSubmitting: boolean;
};

export type PriceProfileCreateFormHandle = {
  generateTestData: () => void;
};

type PriceProfileCreateFormProps = {
  formId: string;
  products: ProductView[];
  action: (formData: FormData) => Promise<PriceProfileCreateResult | void>;
  canManageCost: boolean;
  onSubmitStateChange?: (state: PriceProfileSubmitState) => void;
  onCreated?: () => void;
};

export const PriceProfileCreateForm = forwardRef<
  PriceProfileCreateFormHandle,
  PriceProfileCreateFormProps
>(function PriceProfileCreateForm(
  {
    formId,
    products,
    action,
    canManageCost,
    onSubmitStateChange,
    onCreated,
  },
  ref,
) {
  const router = useRouter();
  const t = useTranslations("priceProfileForm");
  const tCommon = useTranslations("common");
  const tStatuses = useTranslations("statuses");
  const [form] = Form.useForm<PriceProfileCreateFormValues>();
  const [, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const watchedName = Form.useWatch("name", form) || "";
  const watchedPrices = Form.useWatch("prices", form) as
    | Record<string, number | null>
    | undefined;

  const hasValidPrice = useMemo(
    () =>
      products.some((product) => Number(watchedPrices?.[product.id] ?? 0) > 0),
    [products, watchedPrices],
  );
  const canSubmit =
    products.length > 0 && hasValidPrice && watchedName.trim().length > 0;
  const availableProfileTypes = useMemo(
    () =>
      canManageCost ? PRICE_PROFILE_TYPES : (["SALE"] as PriceProfileType[]),
    [canManageCost],
  );

  useEffect(() => {
    if (!canManageCost) {
      form.setFieldValue("type", "SALE");
    }
  }, [canManageCost, form]);

  useEffect(() => {
    onSubmitStateChange?.({
      canSubmit: canSubmit && !isSubmitting,
      isSubmitting,
    });
  }, [canSubmit, isSubmitting, onSubmitStateChange]);

  function handleFinish(values: PriceProfileCreateFormValues) {
    if (!canSubmit || isSubmitting) {
      return;
    }

    const profileType = canManageCost ? values.type || "SALE" : "SALE";

    Modal.confirm({
      title: t("confirm.title"),
      content: t("confirm.description", {
        type: tStatuses(`priceProfileType.${profileType}`),
      }),
      okText: t("confirm.ok"),
      cancelText: t("confirm.cancel"),
      centered: true,
      okButtonProps: {
        className:
          "!border-primary-500 !bg-primary-500 !text-white hover:!border-primary-600 hover:!bg-primary-600",
      },
      cancelButtonProps: {
        className:
          "!border-border !bg-background-secondary !text-foreground hover:!border-primary-500/40",
      },
      onOk: async () => {
        const formData = new FormData();
        formData.set("name", values.name.trim());
        formData.set("type", profileType);
        formData.set("notes", values.notes?.trim() || "");
        formData.set("_responseMode", "inline");

        if (values.isActive) {
          formData.set("isActive", "on");
        }

        for (const product of products) {
          const rawPrice = values.prices?.[product.id];
          const priceValue =
            typeof rawPrice === "number" ? rawPrice : Number(rawPrice || 0);

          if (Number.isFinite(priceValue)) {
            formData.set(`price_${product.id}`, String(priceValue));
          }
        }

        setIsSubmitting(true);

        try {
          const result = await new Promise<PriceProfileCreateResult | void>(
            (resolve, reject) => {
              startTransition(() => {
                action(formData).then(resolve).catch(reject);
              });
            },
          );
          const isSuccess = result?.ok ?? true;
          const resultMessage = result?.message;

          if (!isSuccess) {
            message.error(resultMessage || t("createError"));
            return;
          }

          message.success(resultMessage || t("createSuccess"));
          form.resetFields();
          onCreated?.();
          router.replace("/price-profiles");
          router.refresh();
        } catch (error) {
          console.error(error);
          message.error(t("createError"));
        } finally {
          setIsSubmitting(false);
        }
      },
    });
  }

  function formatCurrencyInput(value?: string | number | null) {
    if (value === undefined || value === null || value === "") {
      return "";
    }

    const numericValue =
      typeof value === "number"
        ? value
        : Number(String(value).replace(/[^\d-]/g, ""));

    if (!Number.isFinite(numericValue)) {
      return "";
    }

    return new Intl.NumberFormat("vi-VN").format(numericValue);
  }

  function parseCurrencyInput(value?: string) {
    if (!value) {
      return 0;
    }

    const parsed = Number(value.replace(/[^\d-]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function roundToThousand(value: number) {
    return Math.round(value / 1000) * 1000;
  }

  const handleGenerateTestData = useCallback(() => {
    if (!products.length || isSubmitting) {
      return;
    }

    const currentType = canManageCost
      ? ((form.getFieldValue("type") as PriceProfileType | undefined) || "SALE")
      : "SALE";
    const [minPrice, maxPrice] =
      currentType === "COST" ? [80000, 190000] : [100000, 280000];

    const generatedPrices = Object.fromEntries(
      products.map((product) => [
        product.id,
        roundToThousand(faker.number.int({ min: minPrice, max: maxPrice })),
      ]),
    );

    form.setFieldsValue({
      name: `${t(currentType === "COST" ? "generatedCostPrefix" : "generatedSalePrefix")} ${faker.string.alphanumeric({ length: 4, casing: "upper" })}`,
      notes: t("generatedNote"),
      prices: generatedPrices,
      isActive: true,
    });

    message.success(t("generatedMessage", { count: products.length }));
  }, [canManageCost, form, isSubmitting, products, t]);

  useImperativeHandle(
    ref,
    () => ({
      generateTestData: handleGenerateTestData,
    }),
    [handleGenerateTestData],
  );

  return (
    <Form
      id={formId}
      form={form}
      layout="vertical"
      requiredMark={false}
      onFinish={handleFinish}
      initialValues={{
        type: "SALE",
        isActive: true,
        notes: "",
      }}
      className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden"
    >
      <div className="grid grid-cols-2 gap-2.5 max-md:grid-cols-1">
        {canManageCost ? (
          <Form.Item
            name="type"
            label={t("type")}
            rules={[{ required: true }]}
            className="mb-0"
          >
            <Select
              options={availableProfileTypes.map((type) => ({
                value: type,
                label: tStatuses(`priceProfileType.${type}`),
              }))}
            />
          </Form.Item>
        ) : (
          <>
            <Form.Item name="type" hidden>
              <Input />
            </Form.Item>
          </>
        )}
      </div>
      {!canManageCost ? (
        <div className="rounded-lg border border-border bg-background-tertiary px-3 py-2 text-xs text-foreground-secondary">
          {t("saleOnlyHint")}
        </div>
      ) : null}
      <Form.Item name="isActive" valuePropName="checked">
        <Checkbox>{t("activeNow")}</Checkbox>
      </Form.Item>
      <Form.Item name="name" label={t("name")} rules={[{ required: true }]}>
        <Input placeholder={t("namePlaceholder")} />
      </Form.Item>
      <Form.Item name="notes" label={t("notes")}>
        <Input.TextArea rows={4} placeholder={t("notesPlaceholder")} />
      </Form.Item>

      <section className="flex min-h-0 flex-1 flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[13px] font-semibold text-foreground-secondary">
            {t("priceByProduct")}
          </span>
          <span className="text-[13px] text-foreground-muted">
            {t("productsCount", { count: products.length })}
          </span>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-border bg-background-tertiary p-2.5">
          {products.length === 0 ? (
            <p className="m-0 text-[13px] text-foreground-muted">
              {t("emptyProducts")}
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="grid grid-cols-[minmax(0,1fr)_200px] items-center gap-2 rounded-md border border-border bg-background-secondary px-2 py-1.5 text-[13px] max-md:grid-cols-1"
                >
                  <span>{product.name}</span>
                  <Space.Compact style={{ width: "100%" }}>
                    <Form.Item
                      name={["prices", product.id]}
                      style={{ marginBottom: 0, width: "100%" }}
                    >
                      <InputNumber
                        min={0}
                        step={1000}
                        precision={0}
                        placeholder="0"
                        formatter={formatCurrencyInput}
                        parser={parseCurrencyInput}
                        style={{ width: "100%" }}
                      />
                    </Form.Item>
                    <Input
                      readOnly
                      value={`${tCommon("vnd")}/kg`}
                      style={{ width: 200, textAlign: "center" }}
                    />
                  </Space.Compact>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </Form>
  );
});
