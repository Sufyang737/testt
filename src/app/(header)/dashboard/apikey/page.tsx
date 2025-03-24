"use client";
import React, { useState, useEffect, useCallback } from "react";
import { SidebarLayout } from '@/components/Sidebar/SidebarLayout'
import { LockClosedIcon, TrashIcon, KeyIcon, PlusIcon } from "@heroicons/react/24/outline";
import { UsageHeader, ButtonNewApiKey } from "@/components/Dashboard";
import { useAuth } from "@clerk/nextjs";

interface ApiKey {
  id: string;
  name: string;
  key: string;
  created: string;
}

interface Client {
  id: string;
  platform: string;
}

export default function ApiKeyPage() {
  const { userId, isLoaded: isAuthLoaded } = useAuth();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [newKeyId, setNewKeyId] = useState<string | null>(null);
  const [clientInfo, setClientInfo] = useState<Client | null>(null);

  const fetchClientInfo = useCallback(async () => {
    try {
      console.log('Fetching client info for userId:', userId);
      const response = await fetch(`/api/clients?user_id=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch client info');
      const data = await response.json();
      console.log('Client info received:', data);
      setClientInfo(data.data);
    } catch (err) {
      console.error('Error fetching client info:', err);
      setError('Error obteniendo información del cliente');
      setIsLoading(false);
    }
  }, [userId]);

  const fetchApiKeys = useCallback(async () => {
    if (!clientInfo?.id) {
      console.log('No client info available, skipping API keys fetch');
      setIsLoading(false);
      return;
    }
    
    try {
      console.log('Fetching API keys for client:', clientInfo.id);
      setError(null);
      
      const response = await fetch(`/api/apikeys?client_id=${clientInfo.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch API keys');
      }
      
      const data = await response.json();
      console.log('API keys received:', data);
      setApiKeys(data.data);
    } catch (err) {
      console.error('Error fetching API keys:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while fetching API keys');
    } finally {
      setIsLoading(false);
    }
  }, [clientInfo?.id]);

  useEffect(() => {
    if (userId) {
      console.log('UserId available, starting fetch process');
      setIsLoading(true);
      fetchClientInfo();
    } else {
      console.log('No userId available');
      setIsLoading(false);
    }
  }, [userId, fetchClientInfo]);

  useEffect(() => {
    if (clientInfo?.id) {
      console.log('Client info updated, fetching API keys');
      fetchApiKeys();
    }
  }, [clientInfo, fetchApiKeys]);

  const handleCreateApiKey = async () => {
    if (!clientInfo?.id) {
      setError('No se pudo obtener la información del cliente');
      return;
    }

    try {
      if (clientInfo.platform === 'tiendanube' && apiKeys.length >= 1) {
        setError('Los usuarios de Tiendanube solo pueden tener una API key');
        return;
      }

      if (apiKeys.length >= 5) {
        setError('Has alcanzado el límite máximo de 5 API keys');
        return;
      }

      setIsCreating(true);
      setError(null);

      const response = await fetch('/api/apikeys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `API Key ${new Date().toLocaleDateString()}`,
          client_id: clientInfo.id,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to create API key');
      }

      const result = await response.json();
      setApiKeys(prev => [...prev, result.data]);
      setNewKeyId(result.data.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while creating the API key');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteApiKey = async (keyId: string) => {
    if (!clientInfo?.id) {
      setError('No se pudo obtener la información del cliente');
      return;
    }

    try {
      setIsDeleting(keyId);
      setError(null);

      const response = await fetch(`/api/apikeys?id=${keyId}&client_id=${clientInfo.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete API key');
      }

      setApiKeys(prev => prev.filter(key => key.id !== keyId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while deleting the API key');
    } finally {
      setIsDeleting(null);
    }
  };

  if (!isAuthLoaded) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-prinFuchsia"></div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
        Por favor, inicia sesión para ver esta página.
      </div>
    );
  }

  return (
    <SidebarLayout>
      <main className="w-full min-h-[calc(100vh-4rem)] p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">API Keys</h1>
              <p className="text-gray-400 text-sm md:text-base">
                Administra tus claves de API para integrar Clostech con tu tienda
              </p>
            </div>
            <button className="mt-4 md:mt-0 inline-flex items-center gap-2 px-4 py-2 bg-prinFuchsia text-white rounded-lg hover:bg-prinFuchsia/90 transition-colors">
              <PlusIcon className="w-5 h-5" />
              <span>Nueva API Key</span>
            </button>
          </div>

          {/* API Keys List */}
          <div className="grid gap-4">
            {isLoading ? (
              // Loading State
              <div className="bg-[#1a1d24] rounded-xl p-6 border border-gray-800/50">
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-prinFuchsia"></div>
                </div>
              </div>
            ) : error ? (
              // Error State
              <div className="bg-[#1a1d24] rounded-xl p-6 border border-gray-800/50">
                <div className="flex flex-col items-center justify-center text-center py-12">
                  <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                    <KeyIcon className="w-8 h-8 text-red-500" />
                  </div>
                  <h3 className="text-xl font-medium text-red-500 mb-2">Error</h3>
                  <p className="text-gray-400">{error}</p>
                </div>
              </div>
            ) : apiKeys.length === 0 ? (
              // Empty State
              <div className="bg-[#1a1d24] rounded-xl p-6 border border-gray-800/50">
                <div className="flex flex-col items-center justify-center text-center py-12">
                  <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mb-4">
                    <KeyIcon className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-medium text-white mb-2">
                    No tienes API Keys
                  </h3>
                  <p className="text-gray-400 max-w-md mb-6">
                    Crea tu primera API Key para comenzar a integrar Clostech con tu tienda.
                    Las API Keys te permiten acceder a nuestros servicios de forma segura.
                  </p>
                  <button 
                    onClick={handleCreateApiKey}
                    disabled={isCreating}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-prinFuchsia text-white rounded-lg hover:bg-prinFuchsia/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-b-2 border-white"></div>
                        <span>Creando...</span>
                      </>
                    ) : (
                      <>
                        <PlusIcon className="w-5 h-5" />
                        <span>Crear API Key</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              // API Keys List
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-400">
                    {apiKeys.length}/5 keys utilizadas
                  </span>
                </div>
                {apiKeys.map((key) => (
                  <div key={key.id} className="bg-[#1a1d24] rounded-xl p-4 border border-gray-800/50">
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <KeyIcon className="w-5 h-5 text-prinFuchsia" />
                          <h3 className="font-medium text-white">{key.name}</h3>
                        </div>
                        {newKeyId === key.id && (
                          <div className="bg-gray-800/50 px-3 py-2 rounded-lg font-mono text-sm text-green-400 break-all mb-2">
                            {key.key}
                          </div>
                        )}
                        <div className="text-xs text-yellow-500 mt-1">
                          {newKeyId === key.id && "⚠️ Guarda esta key, no se volverá a mostrar"}
                        </div>
                      </div>
                      <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-4">
                        <span className="text-sm text-gray-400">
                          Creada el {new Date(key.created).toLocaleDateString()}
                        </span>
                        <button
                          onClick={() => handleDeleteApiKey(key.id)}
                          disabled={isDeleting === key.id}
                          className="text-red-400 hover:text-red-300 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isDeleting === key.id ? 'Eliminando...' : 'Eliminar'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </SidebarLayout>
  );
}