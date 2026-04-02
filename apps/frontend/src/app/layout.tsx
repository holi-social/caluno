import type { Metadata } from 'next';
import { Geologica, Merriweather, Source_Code_Pro } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';

import './globals.css';
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
      <body
        className={`${geologica.variable} ${merriweather.variable} ${sourceCodePro.variable} antialiased`}
      >
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
