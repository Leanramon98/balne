import './globals_generated.css';
import './globals.css';
import 'leaflet/dist/leaflet.css';
import { getLocale } from 'next-intl/server';
import { Shrikhand, Work_Sans } from 'next/font/google';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

const shrikhand = Shrikhand({
  subsets: ['latin'],
  variable: '--font-shrikhand',
  weight: '400',
  display: 'swap',
});

const workSans = Work_Sans({
  subsets: ['latin'],
  variable: '--font-work-sans',
  weight: ['400', '500', '600'],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://www.balne.com.ar'),
  title: {
    default: 'Balne | El plano de tu balneario, vivo y en el bolsillo',
    template: '%s | Balne',
  },
  description: 'Sistema de gestión para balnearios de la Costa Atlántica: reservas, cobros y control de acceso en un solo lugar.',
  openGraph: {
    title: 'Balne | El plano de tu balneario, vivo y en el bolsillo',
    description: 'Reservas, cobros y control de acceso en un solo lugar.',
    url: '/',
    siteName: 'Balne',
    locale: 'es_AR',
    type: 'website',
  },
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
    <html lang={locale} className={`${shrikhand.variable} ${workSans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
