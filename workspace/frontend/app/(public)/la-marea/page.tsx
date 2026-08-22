import type { Metadata } from 'next';
import { LaMareaBooking } from './LaMareaBooking';

export const metadata: Metadata = {
  title: 'Balneario La Marea | Reservá tu lugar en Playa Varese',
  description: 'Elegí una carpa o sombrilla disponible para una reserva de demostración local en Balneario La Marea.',
  alternates: {
    canonical: '/la-marea',
  },
  openGraph: {
    title: 'Balneario La Marea | Playa Varese',
    description: 'Elegí tu lugar frente al mar en esta demostración local de reservas.',
    url: '/la-marea',
  },
};

export default function LaMareaPage() {
  return <LaMareaBooking />;
}
