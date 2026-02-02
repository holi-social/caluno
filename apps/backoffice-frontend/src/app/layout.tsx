import { DataProvider } from '@repo/data/react';
import type { Metadata } from 'next';
import { Geologica } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { GRAPHQL_API_URL, ORG_CONTEXT_COOKIE } from '@/lib/constants';

import './globals.css';

const geologica = Geologica({
  variable: '--font-geologica-sans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Clippy Backoffice',
  description: 'Volunteer management platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geologica.variable} antialiased`}>
        <ThemeProvider>
          <DataProvider
            apiUrl={GRAPHQL_API_URL}
            organizationCookieName={ORG_CONTEXT_COOKIE}
          >
            {children}
          </DataProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
