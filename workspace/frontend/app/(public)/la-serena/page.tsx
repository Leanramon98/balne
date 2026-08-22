import type { Metadata } from 'next';
import { LaSerenaBooking } from './LaSerenaBooking';

export const metadata: Metadata = {
  title: 'La Serena | Elegí tu unidad',
  description: 'Plano interactivo de demostración local para elegir una unidad en La Serena.',
  alternates: { canonical: '/la-serena' },
};

export default function LaSerenaPage() {
  return <LaSerenaBooking />;
}
