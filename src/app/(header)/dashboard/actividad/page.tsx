"use client";
import React, { useEffect, useState } from 'react';
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/solid';
import PocketBase from 'pocketbase';
import { useUser } from '@clerk/nextjs';

interface ApiRequest {
  tokens_used: number;
  total_tokens: number;
  exceeded: number;
  created: string;
}

interface UsageStats {
  totalUsed: number;
  totalAvailable: number;
  dailyAverage: number;
  peakUsage: number;
  lastUpdate: string;
}

export default function ActividadPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats>({
    totalUsed: 0,
    totalAvailable: 6000,
    dailyAverage: 0,
    peakUsage: 0,
    lastUpdate: '',
  });
  const { user } = useUser();

  useEffect(() => {
    const fetchUsageData = async () => {
      if (!user?.emailAddresses?.[0]?.emailAddress) {
        setError('No user email available');
        setLoading(false);
        return;
      }

      try {
        const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.srv.clostech.tech');
        
        // Autenticar con token de admin
        pb.authStore.save(process.env.NEXT_PUBLIC_POCKETBASE_ADMIN_TOKEN || '');

        // Obtener el client_id
        const clientRecord = await pb.collection('clients').getFirstListItem(
          `email = "${user.emailAddresses[0].emailAddress}"`,
          { $autoCancel: false }
        );

        // Obtener registros de uso de API
        const records = await pb.collection('api_request').getList(1, 50, {
          filter: `client_id = "${clientRecord.id}"`,
          sort: '-created',
          $autoCancel: false
        });

        // Procesar datos
        const stats: UsageStats = {
          totalUsed: 0,
          totalAvailable: 6000,
          dailyAverage: 0,
          peakUsage: 0,
          lastUpdate: '',
        };

        if (records.items.length > 0) {
          stats.lastUpdate = records.items[0].created;
          
          records.items.forEach((record: any) => {
            stats.totalUsed += record.tokens_used || 0;
            stats.peakUsage = Math.max(stats.peakUsage, record.tokens_used || 0);
          });

          stats.dailyAverage = stats.totalUsed / records.items.length;
        }

        setUsageStats(stats);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching usage data:', err);
        setError(err instanceof Error ? err.message : 'Error fetching usage data');
        setLoading(false);
      }
    };

    fetchUsageData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-prinFuchsia"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  const usagePercentage = (usageStats.totalUsed / usageStats.totalAvailable) * 100;
  const isNormalUsage = usagePercentage < 80;

  return (
    <main className="w-full min-h-[calc(100vh-4rem)] p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Consumo</h1>
          <p className="text-gray-400 text-sm md:text-base">
            Monitoreo y análisis del uso de recursos
          </p>
        </div>

        {/* Tokens Usage Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Current Usage */}
          <div className="bg-[#1a1d24] rounded-xl p-6 border border-gray-800/50">
            <h3 className="text-lg font-medium text-white mb-4">Tokens Usados</h3>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-4xl font-bold text-indigo-400">{usageStats.totalUsed}</span>
              <span className="text-sm text-gray-400">de {usageStats.totalAvailable}</span>
            </div>
            <div className="space-y-3">
              <div className="w-full bg-gray-800/50 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${isNormalUsage ? 'bg-indigo-400' : 'bg-red-400'}`}
                  style={{ width: `${usagePercentage}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>{usagePercentage.toFixed(1)}% del total utilizado</span>
                <span>{usageStats.totalAvailable - usageStats.totalUsed} tokens disponibles</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {isNormalUsage ? (
                  <>
                    <CheckCircleIcon className="w-5 h-5 text-green-400" />
                    <span className="text-green-400">Normal</span>
                  </>
                ) : (
                  <>
                    <ExclamationCircleIcon className="w-5 h-5 text-red-400" />
                    <span className="text-red-400">Alto consumo</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Usage Stats */}
          <div className="bg-[#1a1d24] rounded-xl p-6 border border-gray-800/50">
            <h3 className="text-lg font-medium text-white mb-4">Estadísticas de Uso</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-400">Promedio diario</span>
                  <span className="text-sm text-white">{Math.round(usageStats.dailyAverage)} tokens</span>
                </div>
                <div className="w-full bg-gray-800/50 rounded-full h-2">
                  <div 
                    className="bg-blue-400 h-2 rounded-full" 
                    style={{ width: `${(usageStats.dailyAverage / usageStats.totalAvailable) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-400">Pico de uso</span>
                  <span className="text-sm text-white">{usageStats.peakUsage} tokens</span>
                </div>
                <div className="w-full bg-gray-800/50 rounded-full h-2">
                  <div 
                    className="bg-purple-400 h-2 rounded-full" 
                    style={{ width: `${(usageStats.peakUsage / usageStats.totalAvailable) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div className="pt-2">
                <span className="text-xs text-gray-400">
                  Última actualización: {new Date(usageStats.lastUpdate).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Predictions */}
          <div className="bg-[#1a1d24] rounded-xl p-6 border border-gray-800/50">
            <h3 className="text-lg font-medium text-white mb-4">Proyección de Uso</h3>
            <div className="space-y-4">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-gray-400">Uso estimado mensual</span>
                <span className="text-2xl font-bold text-white">
                  {Math.round(usageStats.dailyAverage * 30)}
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-gray-400">Tokens restantes</span>
                <span className="text-2xl font-bold text-green-400">
                  {usageStats.totalAvailable - usageStats.totalUsed}
                </span>
              </div>
              <div className="pt-2">
                <div className="text-xs text-gray-400">
                  {usageStats.dailyAverage * 30 < usageStats.totalAvailable
                    ? "Basado en el uso actual, tu plan es adecuado para tus necesidades"
                    : "Considera actualizar tu plan para evitar interrupciones"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
