import './globals_generated.css';
import './globals_dti.css';
import 'leaflet/dist/leaflet.css';
import { AuthProvider } from '@/sdk/auth/AuthContext';
import { getLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  icons: {
    icon: [
      { url: '/dti-favicon.png?v=5', type: 'image/png' },
    ],
    shortcut: '/dti-favicon.png?v=5',
    apple: '/dti-favicon.png?v=5',
  },
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();

  return (
    <html lang={locale}>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
