"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import IsLogged from '@/components/Authentication/isLogged';

interface Plan {
  id: string;
  title: string;
  description: string;
  price: number;
  total_tokens: string;
}

interface ClientPlan {
  id: string;
  client_id: string;
  plant_id: string;
  paid: boolean;
  free_trial: boolean;
}

export default function SelectPlan() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [clientPlans, setClientPlans] = useState<ClientPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { user } = useUser();

  const fetchPlans = useCallback(async () => {
    try {
      const response = await fetch('/api/plans');
      if (response.ok) {
        const data = await response.json();
        setPlans(data);
      }
    } catch (error) {
      console.error('Error al cargar planes:', error);
    }
  }, []);

  const fetchClientPlans = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(`/api/clients/plans?clientId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setClientPlans(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error al cargar planes del cliente:', error);
      setClientPlans([]);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchPlans();
    if (user) {
      fetchClientPlans();
    }
  }, [user, fetchClientPlans, fetchPlans]);

  // Función auxiliar para verificar el estado del plan
  const getPlanStatus = (planId: string) => {
    if (!Array.isArray(clientPlans)) {
      return {
        paid: false,
        freeTrial: false
      };
    }
    const clientPlan = clientPlans.find(cp => cp.plant_id === planId);
    return {
      paid: clientPlan?.paid || false,
      freeTrial: clientPlan?.free_trial || false
    };
  };

  const handlePlanSelection = async () => {
    if (!selectedPlan || !user) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/clients/plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: user.id,
          planId: selectedPlan
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al asignar plan');
      }

      await response.json();
      // Redireccionar a la página de conexión de WhatsApp
      router.push('/whatsapp');
    } catch (error) {
      console.error('Error:', error);
      alert(error instanceof Error ? error.message : 'Error al seleccionar el plan');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <IsLogged>
      <div className="min-h-screen bg-bgCoal py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">
              Selecciona tu Plan
            </h1>
            <p className="text-gray-400">
              Elige el plan que mejor se adapte a tus necesidades
            </p>
          </div>

          <div className="flex justify-center w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl px-4">
              {plans.map((plan) => {
                const planStatus = getPlanStatus(plan.id);
                return (
                  <div
                    key={plan.id}
                    className={`relative bg-[#121212] rounded-xl p-8 cursor-pointer transition-all duration-200 ${
                      selectedPlan === plan.id 
                        ? 'ring-2 ring-prinFuchsia transform scale-105' 
                        : 'hover:scale-105'
                    }`}
                    onClick={() => setSelectedPlan(plan.id)}
                  >
                    {planStatus.freeTrial && !planStatus.paid && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-prinFuchsia to-purple-600 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg backdrop-blur-sm border border-prinFuchsia/20">
                        ✨ 15 días de prueba gratis
                      </div>
                    )}
                    <h3 className="text-2xl font-bold text-white mb-3">{plan.title}</h3>
                    <p className="text-3xl font-bold text-prinFuchsia mb-4">
                      <span className="line-through opacity-50">${plan.price}</span>
                      <span className="ml-2">GRATIS</span>
                    </p>
                    <p className="text-sm text-prinFuchsia -mt-3 mb-4">por un mes</p>
                    <p className="text-gray-400 mb-4">{plan.description}</p>
                    <div className="text-sm text-gray-300">
                      <p>Tokens incluidos: {plan.total_tokens}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-12 text-center">
            <button
              onClick={handlePlanSelection}
              disabled={!selectedPlan || isLoading}
              className={`
                px-8 py-3 rounded-lg text-white font-semibold
                ${!selectedPlan || isLoading
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-prinFuchsia hover:bg-prinFuchsia/80'
                }
              `}
            >
              {isLoading ? 'Procesando...' : 'Continuar con el plan seleccionado'}
            </button>
          </div>
        </div>
      </div>
    </IsLogged>
  );
} 