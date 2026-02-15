"use client";

import type { ReactNode } from "react";
import { App, ConfigProvider, theme } from "antd";
import enUS from "antd/locale/en_US";
import viVN from "antd/locale/vi_VN";
import { useLocale } from "next-intl";

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  const locale = useLocale();

  return (
    <ConfigProvider
      locale={locale === "en" ? enUS : viVN}
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: "#22c55e",
          colorInfo: "#3b82f6",
          colorSuccess: "#22c55e",
          colorWarning: "#f59e0b",
          colorError: "#ef4444",
          colorBgBase: "#0a0a0a",
          colorBgLayout: "#0a0a0a",
          colorBgContainer: "#171717",
          colorBgElevated: "#171717",
          colorBorder: "#262626",
          colorBorderSecondary: "#262626",
          colorFillAlter: "#262626",
          colorText: "#fafafa",
          colorTextSecondary: "#a3a3a3",
          colorTextTertiary: "#737373",
          borderRadius: 12,
          borderRadiusLG: 16,
          wireframe: false,
          fontFamily: "var(--font-be-vietnam-pro), sans-serif",
        },
        components: {
          Layout: {
            bodyBg: "#0a0a0a",
            headerBg: "#171717",
            siderBg: "#171717",
          },
          Card: {
            headerBg: "#171717",
          },
          Button: {
            controlHeight: 38,
            controlHeightSM: 30,
          },
          Menu: {
            itemHeight: 44,
            itemBorderRadius: 12,
            itemMarginInline: 4,
            itemColor: "#a3a3a3",
            itemHoverColor: "#fafafa",
            itemHoverBg: "#262626",
            itemSelectedColor: "#22c55e",
            itemSelectedBg: "rgba(34,197,94,0.14)",
          },
        },
      }}
    >
      <App>{children}</App>
    </ConfigProvider>
  );
}
