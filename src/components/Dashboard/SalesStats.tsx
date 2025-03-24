'use client';
import { useEffect, useState } from 'react';
import PocketBase from 'pocketbase';

interface SalesStats {
  total_sales_with_clostech: number;
  total_orders_with_clostech: number;
  total_sales_without_clostech: number;
  total_orders_without_clostech: number;
}

export function SalesStats({ clientId }: { clientId: string }) {
  const [stats, setStats] = useState<SalesStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.srv.clostech.tech');
        const record = await pb.collection('store_statistics').getFirstListItem(
          `client_id = "${clientId}"`
        );
        
        setStats({
          total_sales_with_clostech: record.total_sales_with_clostech,
          total_orders_with_clostech: record.total_orders_with_clostech,
          total_sales_without_clostech: record.total_sales_without_clostech,
          total_orders_without_clostech: record.total_orders_without_clostech
        });
      } catch (error) {
        console.error('Error fetching sales stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [clientId]);

  if (loading) return <div>Cargando estadísticas...</div>;
  if (!stats) return <div>No hay datos disponibles</div>;

  const totalSales = stats.total_sales_with_clostech + stats.total_sales_without_clostech;
  const totalOrders = stats.total_orders_with_clostech + stats.total_orders_without_clostech;

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Estadísticas de Ventas</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium">Con Clostech</h4>
          <p className="text-2xl font-bold">${stats.total_sales_with_clostech.toLocaleString()}</p>
          <p className="text-sm text-gray-600">{stats.total_orders_with_clostech} órdenes</p>
        </div>
        <div>
          <h4 className="font-medium">Sin Clostech</h4>
          <p className="text-2xl font-bold">${stats.total_sales_without_clostech.toLocaleString()}</p>
          <p className="text-sm text-gray-600">{stats.total_orders_without_clostech} órdenes</p>
        </div>
        <div className="col-span-2 mt-4">
          <h4 className="font-medium">Total</h4>
          <p className="text-2xl font-bold">${totalSales.toLocaleString()}</p>
          <p className="text-sm text-gray-600">{totalOrders} órdenes totales</p>
        </div>
      </div>
    </div>
  );
} 