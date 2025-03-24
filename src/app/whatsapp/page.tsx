"use client";

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export default function WhatsAppConnect() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [status, setStatus] = useState<'INITIAL' | 'CREATING' | 'WAITING_QR' | 'CONNECTED' | 'ERROR'>('INITIAL');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout>();

  const handleConnect = async () => {
    if (!user || !isLoaded) return;

    setLoading(true);
    setError(null);
    setStatus('CREATING');

    try {
      const response = await fetch('/api/whatsapp/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.emailAddresses[0].emailAddress,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear la sesión');
      }

      setSessionId(data.name);
      setStatus('WAITING_QR');
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'Error al conectar WhatsApp');
      setStatus('ERROR');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkStatus = async () => {
      if (!sessionId) return;

      try {
        const response = await fetch(`/api/whatsapp/status?sessionId=${sessionId}`);
        const data = await response.json();
        
        console.log('Estado actual:', data);

        if (data.data.status === 'WORKING') {
          setStatus('CONNECTED');
          setLoading(false);
          setQrCode(null);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = undefined;
          }
          return;
        }

        if (data.data.status === 'SCAN_QR_CODE') {
          setStatus('WAITING_QR');
          if (!qrCode) {
            const qrResponse = await fetch(`/api/whatsapp/qr?sessionId=${sessionId}`);
            if (qrResponse.ok) {
              const qrBlob = await qrResponse.blob();
              setQrCode(URL.createObjectURL(qrBlob));
            }
          }
        }
      } catch (error) {
        console.error('Error al verificar estado:', error);
        setError('Error al verificar el estado de la conexión');
      }
    };

    if (sessionId) {
      checkStatus();
      if (!intervalRef.current) {
        intervalRef.current = setInterval(checkStatus, 2000);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
      }
    };
  }, [sessionId, qrCode]);

  const getStatusMessage = () => {
    switch (status) {
      case 'INITIAL':
        return 'Haz clic en Conectar para comenzar';
      case 'CREATING':
        return 'Creando sesión...';
      case 'WAITING_QR':
        return 'Escanea el código QR con WhatsApp';
      case 'CONNECTED':
        return '¡WhatsApp conectado exitosamente!';
      case 'ERROR':
        return error || 'Error al conectar WhatsApp';
      default:
        return 'Esperando acción...';
    }
  };

  return (
    <div className="flex h-screen bg-[#111b21]">
      <div className="w-full flex flex-col items-center justify-center p-8">
        <div className="max-w-md w-full bg-[#202c33] rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">
              Conectar WhatsApp
            </h1>
            <p className="text-gray-400">
              {getStatusMessage()}
            </p>
          </div>

          {status === 'WAITING_QR' && qrCode && (
            <div className="flex justify-center mb-8">
              <div className="bg-white p-4 rounded-lg">
                <img src={qrCode} alt="QR Code" className="w-64 h-64" />
              </div>
            </div>
          )}

          {status === 'CONNECTED' && (
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-4">
                <svg
                  className="w-8 h-8 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">
                ¡Conexión exitosa!
              </h2>
              <p className="text-gray-400 mb-6">
                ¡Genial! Ahora configura tu perfil de negocio
              </p>
              <button
                onClick={() => router.push('/business-profile')}
                className="w-full bg-prinFuchsia hover:bg-prinFuchsia/90 text-white font-medium py-3 px-4 rounded-lg transition-all hover:shadow-lg flex items-center justify-center"
              >
                <span>Último paso: Configurar perfil</span>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5 ml-2" 
                  viewBox="0 0 20 20" 
                  fill="currentColor"
                >
                  <path 
                    fillRule="evenodd" 
                    d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" 
                    clipRule="evenodd" 
                  />
                </svg>
              </button>
            </div>
          )}

          {status === 'INITIAL' && (
            <button
              onClick={handleConnect}
              disabled={loading}
              className={`w-full flex items-center justify-center py-3 px-4 rounded-lg text-white font-medium transition-all
                ${loading
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 hover:shadow-lg'
                }
              `}
            >
              {loading ? 'Conectando...' : 'Conectar'}
            </button>
          )}

          {status === 'ERROR' && (
            <div className="text-center text-red-500 mt-4">
              <p>{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 