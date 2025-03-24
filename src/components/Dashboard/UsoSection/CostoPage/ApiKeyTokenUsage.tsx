"use client"
import React, { useEffect, useState } from 'react';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface ApiRequest {
  id: string;
  tokens_used: number;
  total_tokens: number;
  exceeded: number;
  created: string;
  updated: string;
  client_id: string;
}

export const ApiKeyTokenUsage = ({ clientId }: { clientId: string }) => {
  const [requests, setRequests] = useState<ApiRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTokenUsage = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/token-usage?clientId=${clientId}`, {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Error al obtener datos de uso de tokens');
        }

        if (!data.success || !data.data) {
          throw new Error('Formato de respuesta inválido');
        }

        setRequests(data.data);
      } catch (error) {
        console.error('Error fetching token usage:', error);
        setError(error instanceof Error ? error.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    if (clientId) {
      fetchTokenUsage();
    }
  }, [clientId]);

  if (loading) {
    return (
      <div className="w-full h-full flex justify-center items-center p-8">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-prinFuchsia border-t-transparent"></div>
          <p className="text-txtWhite text-sm">Cargando datos de uso...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center p-6">
        <div className="p-6 w-full max-w-md">
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-red-400 font-semibold text-lg mb-2">Error al cargar los datos</h3>
            <p className="text-gray-400 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!requests || requests.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center p-6">
        <div className="bg-[#1E1E1E] border border-yellow-500/20 rounded-xl p-6 w-full max-w-md">
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-yellow-500/10 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-yellow-400 font-semibold text-lg mb-2">Sin datos de uso</h3>
            <p className="text-gray-400 text-sm">Aún no se han registrado consumos de tokens para este usuario.</p>
          </div>
        </div>
      </div>
    );
  }

  const latestRequest = requests[0];
  const usagePercentage = Math.min((latestRequest.tokens_used / latestRequest.total_tokens) * 100, 100);
  const isWarning = usagePercentage >= 80;
  const isDanger = usagePercentage >= 90;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-[#1a1d24] rounded-lg p-4 border border-gray-800/50">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-base font-medium text-gray-200">Tokens Usados</h4>
          <div className={`px-3 py-1 rounded-md ${
            isDanger ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 
            isWarning ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 
            'bg-green-500/20 text-green-400 border border-green-500/30'
          }`}>
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full animate-pulse ${
                isDanger ? 'bg-red-400' : 
                isWarning ? 'bg-yellow-400' : 
                'bg-green-400'
              }`}></div>
              <span className="text-xs font-medium">
                {isDanger ? 'Crítico' : isWarning ? 'Advertencia' : 'Normal'}
              </span>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-indigo-400">
              {latestRequest.tokens_used.toLocaleString()}
            </span>
            <span className="text-sm text-gray-400">de {latestRequest.total_tokens.toLocaleString()}</span>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-700/50 rounded-full h-1.5">
              <div 
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  isDanger ? 'bg-red-500' : 
                  isWarning ? 'bg-yellow-500' : 
                  'bg-green-500'
                }`}
                style={{ width: `${usagePercentage}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-400 mt-2">
              {usagePercentage.toFixed(1)}% del total utilizado
            </p>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Última actualización: {new Date(latestRequest.updated).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="bg-[#1a1d24] rounded-lg p-4 border border-gray-800/50">
        <h4 className="text-base font-medium text-gray-200 mb-4">Historial de Consumo</h4>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={requests.slice().reverse()} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis 
                dataKey="created" 
                stroke="#9CA3AF"
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
                fontSize={11}
                tickLine={false}
              />
              <YAxis 
                stroke="#9CA3AF"
                fontSize={11}
                tickLine={false}
                tickFormatter={(value) => value.toLocaleString()}
              />
              <Tooltip
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '0.5rem',
                  padding: '0.5rem',
                  fontSize: '12px'
                }}
                labelStyle={{ color: '#9CA3AF', marginBottom: '0.25rem' }}
                formatter={(value) => [`${value.toLocaleString()} tokens`, 'Consumo']}
                labelFormatter={(value) => `Fecha: ${new Date(value).toLocaleDateString()}`}
              />
              <Line 
                type="monotone" 
                dataKey="tokens_used" 
                stroke="#4F46E5"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}; 