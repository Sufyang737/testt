import React, { createContext, useContext, useState, useEffect } from 'react';
import PocketBase from 'pocketbase';
import { useUser } from '@clerk/nextjs';

const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);
pb.autoCancellation(false);

interface PlanInfo {
  daysLeft: number;
  isPaid: boolean;
  isLoading: boolean;
  error: string | null;
  isTrialExpired: boolean;
}

interface PlanContextType extends PlanInfo {
  refreshPlanInfo: () => Promise<void>;
  showTrialExpiredPopup: () => void;
}

const PlanContext = createContext<PlanContextType | undefined>(undefined);

declare global {
  interface Window {
    Intercom?: any;
  }
}

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const [daysLeft, setDaysLeft] = useState<number>(30);
  const [isPaid, setIsPaid] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isTrialExpired, setIsTrialExpired] = useState<boolean>(false);
  const { user, isLoaded: isUserLoaded } = useUser();

  const calculateDaysLeft = (createdDate: string, isPaid: boolean): number => {
    if (isPaid) return 0;
    
    const created = new Date(createdDate);
    const now = new Date();
    const diffTime = now.getTime() - created.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const daysLeft = 30 - diffDays;
    
    return Math.max(0, daysLeft);
  };

  const showTrialExpiredPopup = () => {
    if (window.Intercom) {
      const message = "¡Hola! Tu período de prueba ha terminado. ¿Te gustaría hablar sobre las opciones para continuar usando Iowi?";
      window.Intercom('showNewMessage', message);
    }
  };

  const refreshPlanInfo = async () => {
    if (!isUserLoaded || !user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Autenticar con el token de admin
      pb.authStore.save(process.env.NEXT_PUBLIC_POCKETBASE_ADMIN_TOKEN || '');

      // Obtener el cliente
      const clientResult = await pb.collection('clients').getList(1, 1, {
        filter: pb.filter('user_id = {:userId}', { userId: user.id })
      });

      if (clientResult.items.length === 0) {
        throw new Error('Cliente no encontrado');
      }

      const client = clientResult.items[0];

      // Obtener el plan del cliente
      const clientPlan = await pb.collection('clients_plants').getFirstListItem(
        pb.filter('client_id = {:clientId}', { clientId: client.id }),
        { sort: '-created' }
      );

      const calculatedDaysLeft = calculateDaysLeft(clientPlan.created, clientPlan.paid);
      setDaysLeft(calculatedDaysLeft);
      setIsPaid(clientPlan.paid);
      setIsTrialExpired(calculatedDaysLeft === 0 && !clientPlan.paid);
      setError(null);
    } catch (error: any) {
      console.error('Error al cargar información del plan:', error);
      setError(error?.message || 'Error al cargar información del plan');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isUserLoaded) {
      refreshPlanInfo();
    }

    return () => {
      pb.cancelAllRequests();
    };
  }, [isUserLoaded]);

  useEffect(() => {
    if (isTrialExpired) {
      showTrialExpiredPopup();
    }
  }, [isTrialExpired]);

  return (
    <PlanContext.Provider value={{
      daysLeft,
      isPaid,
      isLoading,
      error,
      isTrialExpired,
      refreshPlanInfo,
      showTrialExpiredPopup
    }}>
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan() {
  const context = useContext(PlanContext);
  if (context === undefined) {
    throw new Error('usePlan debe ser usado dentro de un PlanProvider');
  }
  return context;
} 