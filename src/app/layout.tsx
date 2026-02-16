import { AntdRegistry } from '@ant-design/nextjs-registry';
import { AppProviders } from 'components/app-providers';
import { AppTransitionIndicator } from 'components/app-transition-indicator';
import { MobileFlashScreen } from 'components/mobile-flash-screen';
import { MobileZoomLock } from 'components/mobile-zoom-lock';
import { PwaMobileInstall } from 'components/pwa-mobile-install';
import type { Metadata, Viewport } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { Be_Vietnam_Pro, JetBrains_Mono } from 'next/font/google';
import 'styles/index.css';

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-be-vietnam-pro',
  weight: ['400', '500', '600', '700'],
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  weight: ['500'],
});

export const metadata: Metadata = {
  title: 'GC',
  description: 'GC admin app for managing products, price profiles, and orders',
  applicationName: 'GC',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'GC',
    startupImage: ['/apple-touch-icon.png'],
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: '/gc-mark.svg',
    shortcut: '/gc-mark.svg',
    apple: '/gc-mark.svg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0a0a0a',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [locale, messages] = await Promise.all([getLocale(), getMessages()]);

  return (
    <html lang={locale} suppressHydrationWarning>
      <body suppressHydrationWarning className={`${beVietnamPro.variable} ${jetBrainsMono.variable} antialiased`}>
        <AntdRegistry>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <AppProviders>
              <MobileZoomLock />
              <MobileFlashScreen />
              <AppTransitionIndicator />
              <PwaMobileInstall />
              {children}
            </AppProviders>
          </NextIntlClientProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
