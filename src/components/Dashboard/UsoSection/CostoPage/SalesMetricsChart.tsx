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
    return <div className="flex justify-center items-center h-full text-red-500">{error}</div>;
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