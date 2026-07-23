import './globals_generated.css';
import 'leaflet/dist/leaflet.css';
import { AuthProvider } from '@/sdk/auth/AuthContext';
import { getLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  icons: {
    icon: [
      { url: '/favicon.png?v=5', type: 'image/png' },
    ],
    shortcut: '/favicon.png?v=5',
    apple: '/apple-icon.png',
  },
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();

  return (
    <html lang={locale}>
      <head>
        <title>Project Template</title>
      </head>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
