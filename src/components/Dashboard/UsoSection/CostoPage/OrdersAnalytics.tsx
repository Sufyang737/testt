"use client";
import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import PocketBase from 'pocketbase';
import { useUser } from '@clerk/nextjs';

interface OrderStats {
  totalOrders: number;
  totalSales: number;
  ordersWithClostech: number;
  ordersWithoutClostech: number;
  salesWithClostech: number;
  salesWithoutClostech: number;
  averageOrderValueWithClostech: number;
  averageOrderValueWithoutClostech: number;
  firstButtonClicks: number;
  buttonWithoutLoginClicks: number;
  buttonLoginClicks: number;
  latestSeenClicks: number;
}

const COLORS = ['#4F46E5', '#E5E7EB'];

const SkeletonLoader = () => {
  return (
    <div className="animate-pulse space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-32 bg-gray-200 rounded-lg"></div>
        <div className="h-32 bg-gray-200 rounded-lg"></div>
      </div>
      <div className="h-64 bg-gray-200 rounded-lg"></div>
    </div>
  );
};

export const OrdersAnalytics = () => {
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();

  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.emailAddresses?.[0]?.emailAddress) {
        setError('No user email available');
        setLoading(false);
        return;
      }

      try {
        const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pocketbase.srv.clostech.tech');
        
        // Authenticate with admin token
        pb.authStore.save(process.env.NEXT_PUBLIC_POCKETBASE_ADMIN_TOKEN || '');

        // Get the client record
        const clientRecord = await pb.collection('clients').getFirstListItem(
          `email = "${user.emailAddresses[0].emailAddress}"`,
          {
            $autoCancel: false
          }
        );

        // Fetch orders
        const records = await pb.collection('orders').getList(1, 50, {
          filter: `client_id = "${clientRecord.id}"`,
          sort: '-created',
          $autoCancel: false
        });

        // Fetch click data
        const clickRecords = await pb.collection('click_button').getList(1, 50, {
          filter: `client_id = "${clientRecord.id}"`,
          sort: '-created'
        });

        // Calculate statistics
        const stats: OrderStats = {
          totalOrders: records.items.length,
          totalSales: 0,
          ordersWithClostech: 0,
          ordersWithoutClostech: 0,
          salesWithClostech: 0,
          salesWithoutClostech: 0,
          averageOrderValueWithClostech: 0,
          averageOrderValueWithoutClostech: 0,
          firstButtonClicks: 0,
          buttonWithoutLoginClicks: 0,
          buttonLoginClicks: 0,
          latestSeenClicks: 0
        };

        records.items.forEach(order => {
          const total = order.total || 0;
          stats.totalSales += total;

          if (order.used_clostech) {
            stats.ordersWithClostech++;
            stats.salesWithClostech += total;
          } else {
            stats.ordersWithoutClostech++;
            stats.salesWithoutClostech += total;
          }
        });

        // Calculate click statistics
        clickRecords.items.forEach(click => {
          stats.firstButtonClicks += click.first_button || 0;
          stats.buttonWithoutLoginClicks += click.button_without_login || 0;
          stats.buttonLoginClicks += click.button_login || 0;
          stats.latestSeenClicks += click.latest_seen || 0;
        });

        // Calculate averages
        stats.averageOrderValueWithClostech = stats.ordersWithClostech > 0 
          ? stats.salesWithClostech / stats.ordersWithClostech 
          : 0;
        stats.averageOrderValueWithoutClostech = stats.ordersWithoutClostech > 0 
          ? stats.salesWithoutClostech / stats.ordersWithoutClostech 
          : 0;

        setStats(stats);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Error fetching statistics');
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  if (loading) return <SkeletonLoader />;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!stats) return <div className="text-gray-400">No hay datos disponibles</div>;

  const orderComparisonData = [
    {
      name: 'Ventas',
      conClostech: stats.salesWithClostech,
      sinClostech: stats.salesWithoutClostech,
    },

  ];

  const pieData = [
    { name: 'Con Clostech', value: stats.salesWithClostech },
    { name: 'Sin Clostech', value: stats.salesWithoutClostech },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div className="w-full">
      <div className="px-3 sm:px-4 pt-1">
        <div className="mb-3">
          <h2 className="text-2xl font-bold text-gray-800">Análisis de Órdenes</h2>
          <p className="text-gray-500 text-sm">Métricas detalladas de rendimiento</p>
        </div>

        <div className="grid grid-cols-12 gap-4">
          {/* Panel izquierdo - Métricas apiladas verticalmente */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
            {/* Total de Órdenes */}
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm h-[180px]">
              <h3 className="text-base font-medium text-gray-700 mb-3">Total de Órdenes</h3>
              <div className="flex flex-col">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-primary">{stats.totalOrders}</span>
                  <span className="text-sm text-gray-500">órdenes</span>
                </div>
                <div className="mt-2 flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary"></div>
                    <span className="text-sm text-gray-600">Con Clostech: {stats.ordersWithClostech}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-gray-400"></div>
                    <span className="text-sm text-gray-600">Sin Clostech: {stats.ordersWithoutClostech}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Total de Ventas */}
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm h-[180px]">
              <h3 className="text-base font-medium text-gray-700 mb-3">Total de Ventas</h3>
              <div className="flex flex-col">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-secondary">{formatCurrency(stats.totalSales)}</span>
                </div>
                <div className="mt-2 flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-secondary"></div>
                    <span className="text-sm text-gray-600">Con: {formatCurrency(stats.salesWithClostech)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-gray-400"></div>
                    <span className="text-sm text-gray-600">Sin: {formatCurrency(stats.salesWithoutClostech)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Interacciones de Usuario */}
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm h-[125px]">
              <h3 className="text-base font-medium text-gray-700 mb-3">Interacciones</h3>
              <div className="flex flex-col">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-primary-dark">{stats.firstButtonClicks}</span>
                  <span className="text-sm text-gray-500">clicks totales</span>
                </div>
                <div className="mt-2 flex flex-col gap-1">
                  <div className="text-xs text-gray-500 mt-1">
                    Total de interacciones registradas en la web
                  </div>
                </div>
              </div>
            </div>

            {/* Engagement */}
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm h-[180px]">
              <h3 className="text-base font-medium text-gray-700 mb-3">Engagement</h3>
              <div className="flex flex-col">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-primary-light">{stats.latestSeenClicks}</span>
                  <span className="text-sm text-gray-500">vistas del último mes</span>
                </div>
                <div className="mt-2">
                  <div className="text-sm text-gray-600">
                    Promedio por orden con Clostech:
                    <span className="ml-1 text-primary font-medium">
                      {formatCurrency(stats.averageOrderValueWithClostech)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Promedio por orden sin Clostech:
                    <span className="ml-1 text-gray-500 font-medium">
                      {formatCurrency(stats.averageOrderValueWithoutClostech)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Basado en {stats.totalOrders} órdenes totales
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Panel derecho - Gráficos */}
          <div className="col-span-12 lg:col-span-8 flex flex-col gap-4">
            {/* Comparativa de Métricas */}
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm h-[350px]">
              <h3 className="text-base font-medium text-gray-700 mb-3">Comparativa de Métricas</h3>
              <div className="w-full h-[calc(100%-2rem)]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={orderComparisonData} margin={{ top: 20, right: 40, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.8} />
                    <XAxis 
                      dataKey="name" 
                      stroke="#64748b" 
                      fontSize={12}
                      tickLine={false}
                    />
                    <YAxis 
                      stroke="#64748b" 
                      fontSize={12}
                      tickLine={false}
                      tickFormatter={(value) => formatCurrency(value)}
                      width={90}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#ffffff', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '0.5rem',
                        padding: '0.75rem',
                        fontSize: '12px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                      labelStyle={{ color: '#475569', marginBottom: '0.5rem' }}
                      formatter={(value) => [formatCurrency(Number(value)), '']}
                    />
                    <Legend 
                      verticalAlign="top"
                      height={36}
                      fontSize={12}
                      wrapperStyle={{ paddingLeft: '10px' }}
                    />
                    <Bar 
                      dataKey="conClostech" 
                      name="Con Clostech" 
                      fill="#7e25ea" 
                      radius={[4, 4, 0, 0]}
                      maxBarSize={80}
                    />
                    <Bar 
                      dataKey="sinClostech" 
                      name="Sin Clostech" 
                      fill="#94a3b8" 
                      radius={[4, 4, 0, 0]}
                      maxBarSize={80}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Distribución de Ventas */}
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm h-[350px]">
              <h3 className="text-base font-medium text-gray-700 mb-3">Distribución de Ventas</h3>
              <div className="w-full h-[calc(100%-2rem)] flex items-center justify-center">
                <ResponsiveContainer width="90%" height="90%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={index === 0 ? '#7e25ea' : '#94a3b8'}
                        />
                      ))}
                    </Pie>
                    <Legend 
                      verticalAlign="bottom"
                      height={36}
                      fontSize={12}
                    />
                    <Tooltip 
                      formatter={(value) => formatCurrency(Number(value))}
                      contentStyle={{ 
                        backgroundColor: '#ffffff', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '0.5rem',
                        padding: '0.75rem',
                        fontSize: '12px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                      labelStyle={{ color: '#475569', marginBottom: '0.5rem' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 