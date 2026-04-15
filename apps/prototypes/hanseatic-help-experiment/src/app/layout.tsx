import type { Metadata } from 'next';
import { Geologica } from 'next/font/google';
import { ThemeProvider } from 'next-themes';

import { PlausibleAnalytics } from '@/components/plausible-analytics';

import './globals.css';

const geologica = Geologica({
  variable: '--font-geologica-sans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Hanseatic Help',
  description: 'Volunteer check-in',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className={`${geologica.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <PlausibleAnalytics />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
