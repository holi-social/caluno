import type { Metadata } from 'next';
import { Geologica } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@repo/ui';

import './globals.css';

const geologica = Geologica({
  variable: '--font-geologica-sans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Clippy - Formular-Baukasten',
  description: 'Konfigurierbare Registrierungs- und Onboarding-Formulare',
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
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
