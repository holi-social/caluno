import type { Metadata } from 'next';
import { Geologica, Merriweather, Source_Code_Pro } from 'next/font/google';
import { notFound } from 'next/navigation';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from 'next-intl/server';
import { ThemeProvider } from '@/components/theme-provider';
import { routing } from '@/i18n/routing';

import '../globals.css';
import { Toaster } from '@repo/ui';

const geologica = Geologica({
  variable: '--font-geologica-sans',
  subsets: ['latin'],
});

const merriweather = Merriweather({
  variable: '--font-merriweather-serif',
  subsets: ['latin'],
});

const sourceCodePro = Source_Code_Pro({
  variable: '--font-sourcecodepro-mono',
  subsets: ['latin'],
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Enable static rendering for this locale segment.
  setRequestLocale(locale);

  // ship the full message catalog to the client provider.
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geologica.variable} ${merriweather.variable} ${sourceCodePro.variable} antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider>
            {children}
            <Toaster />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
