import { DataProvider } from '@repo/data/react';
import type { Metadata } from 'next';
import { Geologica } from 'next/font/google';

import './globals.css';

const geologica = Geologica({
  variable: '--font-geologica-sans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Clippy Backoffice',
  description: 'Volunteer management platform',
};

const apiURL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/graphql';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geologica.variable} antialiased`}>
        <DataProvider apiUrl={apiURL}>{children}</DataProvider>
      </body>
    </html>
  );
}
