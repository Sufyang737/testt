"use client";
import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { ChatClassificationMetrics } from '@/components/Dashboard';
import PocketBase from 'pocketbase';

const POCKETBASE_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || '';

export default function ChatClassificationsPage() {
  const { user } = useUser();
  const [clientId, setClientId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const getClientId = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const pb = new PocketBase(POCKETBASE_URL);
        
        const clientRecord = await pb.collection('clients').getFirstListItem(
          `clerk_id = "${user.id}"`
        );
        
        if (clientRecord) {
          setClientId(clientRecord.id);
        }
      } catch (error) {
        console.error('Error al obtener el ID del cliente:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    getClientId();
  }, [user]);
  
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Evaluación de Conversaciones</h1>
        <p className="text-gray-500">
          Visualiza y analiza las valoraciones de tus clientes para mejorar la calidad del servicio.
        </p>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : clientId ? (
        <ChatClassificationMetrics clientId={clientId} />
      ) : (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                No se ha podido cargar la información del cliente. Por favor, contacta con soporte si este problema persiste.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 