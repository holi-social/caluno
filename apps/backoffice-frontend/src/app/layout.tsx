import type { Metadata } from 'next';
import { Geologica } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';

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
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
