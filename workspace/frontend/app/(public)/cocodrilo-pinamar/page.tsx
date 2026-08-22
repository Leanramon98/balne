import type { Metadata } from 'next';
import { CocodriloBooking } from './CocodriloBooking';

export const metadata: Metadata = {
  title: 'Cocodrilo Pinamar | Elegí tu carpa',
  description: 'Plano interactivo de demostración local para elegir una carpa en Cocodrilo Pinamar.',
  alternates: { canonical: '/cocodrilo-pinamar' },
};

export default function CocodriloPinamarPage() {
  return <CocodriloBooking />;
}
