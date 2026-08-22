'use client';

import { PlanBooking } from '../cocodrilo-pinamar/CocodriloBooking';
import { laSerenaPlan } from '@/demo/plans/la-serena';

export function LaSerenaBooking() {
  return <PlanBooking plan={laSerenaPlan} referencePrefix="SERENA" slug="la-serena" />;
}
