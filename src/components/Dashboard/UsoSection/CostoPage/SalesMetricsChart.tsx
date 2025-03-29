"use client"
import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import PocketBase from 'pocketbase';

interface SalesMetricsProps {
  clientId: string;
}

interface SalesData {
  period: string;
  withClostech: number;
  withoutClostech: number;
}

export const SalesMetricsChart: React.FC<SalesMetricsProps> = ({ clientId }) => {
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        const response = await fetch(`/api/sales-metrics?clientId=${clientId}`, {
          headers: {
            'Cache-Control': 'no-cache',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch sales data');
        }

        const data = await response.json();
        
        // Transform data for the chart
        const transformedData: SalesData[] = [
          {
            period: 'Ventas',
            withClostech: data.salesWithClostech || 0,
            withoutClostech: data.salesWithoutClostech || 0,
          },
          {
            period: 'Órdenes',
            withClostech: data.ordersWithClostech || 0,
            withoutClostech: data.ordersWithoutClostech || 0,
          }
        ];

        setSalesData(transformedData);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching sales data');
        setLoading(false);
      }
    };

    fetchSalesData();
  }, [clientId]);

  if (loading) {
    return <div className="flex justify-center items-center h-full">Cargando métricas de ventas...</div>;
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-md font-medium text-gray-700 mb-1">Datos no disponibles</h3>
          <p className="text-gray-500 text-sm">No pudimos cargar las métricas de ventas en este momento.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-white rounded-lg shadow-lg p-4">
      <h2 className="text-xl font-bold mb-4">Métricas de Ventas</h2>
      <ResponsiveContainer width="100%" height="80%">
        <BarChart
          data={salesData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="period" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="withClostech" name="Con Clostech" fill="#4F46E5" />
          <Bar dataKey="withoutClostech" name="Sin Clostech" fill="#E5E7EB" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}; 