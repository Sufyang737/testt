'use client';
import { useEffect, useState } from 'react';
import PocketBase from 'pocketbase';

interface TokenStats {
  tokens_used: number;
  total_tokens: number;
  exceeded: number;
}

export function TokensUsageStats({ clientId }: { clientId: string }) {
  const [stats, setStats] = useState<TokenStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.srv.clostech.tech');
        const record = await pb.collection('api_request').getFirstListItem(
          `client_id = "${clientId}"`
        );
        
        setStats({
          tokens_used: record.tokens_used,
          total_tokens: record.total_tokens,
          exceeded: record.exceeded
        });
      } catch (error) {
        console.error('Error fetching token stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [clientId]);

  if (loading) return <div>Cargando estadísticas...</div>;
  if (!stats) return <div>No hay datos disponibles</div>;

  const usagePercentage = (stats.tokens_used / stats.total_tokens) * 100;

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Uso de Tokens</h3>
      <div className="space-y-4">
        <div>
          <div className="flex justify-between mb-2">
            <span>Tokens Usados</span>
            <span>{stats.tokens_used.toLocaleString()} / {stats.total_tokens.toLocaleString()}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className={`h-2.5 rounded-full ${usagePercentage > 90 ? 'bg-red-600' : 'bg-blue-600'}`}
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            ></div>
          </div>
        </div>
        {stats.exceeded > 0 && (
          <div className="text-red-600">
            Tokens excedidos: {stats.exceeded.toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
} 