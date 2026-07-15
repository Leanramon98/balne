'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { getUserRole, getDestinationId, CAN_SELECT_DESTINO_ROLES } from '@/lib/auth';
import { getDestination, getDestinations } from '@/sdk/api/evaluations-api';

interface Destino {
  id: string;
  name: string;
}

interface ActiveEvaluation {
  id: string;
  name: string;
  destinationId: string;
}

interface DestinoContextValue {
  activeDestino: Destino | null;
  setActiveDestino: (d: Destino | null) => void;
  activeEvaluation: ActiveEvaluation | null;
  setActiveEvaluation: (evaluation: ActiveEvaluation | null) => void;
  availableDestinos: Destino[];
  canSelectDestino: boolean;
  isLoadingDestino: boolean;
}

const DestinoContext = createContext<DestinoContextValue | undefined>(undefined);

export function DestinoProvider({ children }: { children: ReactNode }) {
  const [activeDestino, setActiveDestino] = useState<Destino | null>(null);
  const [activeEvaluation, setActiveEvaluation] = useState<ActiveEvaluation | null>(null);
  const [availableDestinos, setAvailableDestinos] = useState<Destino[]>([]);
  const [isLoadingDestino, setIsLoadingDestino] = useState(true);

  const role = getUserRole();
  const canSelectDestino = CAN_SELECT_DESTINO_ROLES.includes(role);

  useEffect(() => {
    async function init() {
      setIsLoadingDestino(true);
      try {
        const destinationId = getDestinationId();

        // Admin: load ALL destinations for the picker regardless of destination_id
        if (canSelectDestino) {
          const all = await getDestinations();
          setAvailableDestinos(all.map((d) => ({ id: d.id, name: d.name })));
        }

        // Pre-select the user's destination if they have one assigned
        if (destinationId) {
          const dest = await getDestination(destinationId);
          setActiveDestino({ id: dest.id, name: dest.name });
        }
      } catch {
        // Silently fail — user will see no destino selected
      } finally {
        setIsLoadingDestino(false);
      }
    }

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!activeEvaluation) return;
    if (!activeDestino || activeEvaluation.destinationId !== activeDestino.id) {
      setActiveEvaluation(null);
    }
  }, [activeDestino, activeEvaluation]);

  return (
    <DestinoContext.Provider
      value={{
        activeDestino,
        setActiveDestino,
        activeEvaluation,
        setActiveEvaluation,
        availableDestinos,
        canSelectDestino,
        isLoadingDestino,
      }}
    >
      {children}
    </DestinoContext.Provider>
  );
}

export function useDestino(): DestinoContextValue {
  const ctx = useContext(DestinoContext);
  if (!ctx) throw new Error('useDestino must be used within DestinoProvider');
  return ctx;
}
