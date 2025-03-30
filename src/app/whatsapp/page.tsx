"use client";

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import IsLogged from '@/components/Authentication/isLogged';

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
        return 'Prepara tu WhatsApp para vincular tu cuenta';
      case 'CREATING':
        return 'Preparando tu sesión...';
      case 'WAITING_QR':
        return 'Escanea el código QR con tu teléfono';
      case 'CONNECTED':
        return '¡WhatsApp conectado exitosamente!';
      case 'ERROR':
        return error || 'Error al conectar WhatsApp';
      default:
        return 'Esperando acción...';
    }
  };

  // Componente para los pasos a seguir
  const InstructionStep = ({ number, text }: { number: number, text: string }) => (
    <div className="flex items-start mb-3">
      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center mr-3 mt-0.5 text-xs font-medium">
        {number}
      </div>
      <p className="text-gray-300 text-sm">{text}</p>
    </div>
  );

  return (
    <IsLogged>
      <div className="flex h-screen bg-[#111b21]">
        <div className="w-full flex flex-col items-center justify-center p-8">
          <div className="max-w-md w-full bg-[#202c33] rounded-lg shadow-xl p-8">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-white mb-2">
                Conectar WhatsApp
              </h1>
              <p className="text-gray-400">
                {getStatusMessage()}
              </p>
            </div>

            {status === 'INITIAL' && (
              <div className="mb-6">
                <div className="bg-[#182229] rounded-lg p-4 mb-6">
                  <h2 className="text-white font-medium mb-3">Sigue estos pasos para conectar WhatsApp:</h2>
                  <InstructionStep number={1} text="Asegúrate de tener WhatsApp instalado en tu teléfono." />
                  <InstructionStep number={2} text="Cuando presiones 'Conectar', se mostrará un código QR." />
                  <InstructionStep number={3} text="Abre WhatsApp en tu teléfono y toca Configuración (iOS) o los tres puntos (Android)." />
                  <InstructionStep number={4} text="Selecciona 'Dispositivos vinculados' y luego 'Vincular un dispositivo'." />
                  <InstructionStep number={5} text="Apunta la cámara de tu teléfono al código QR que aparecerá en pantalla." />
                </div>
                
                <div className="bg-yellow-500/20 border border-yellow-400/30 rounded-lg p-3 flex items-start mb-6">
                  <svg className="w-5 h-5 text-yellow-400 flex-shrink-0 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-yellow-300 text-sm">
                    <span className="font-semibold">Importante:</span> No inicies la sesión hasta tener WhatsApp listo para escanear el código QR. El código tiene un tiempo limitado de validez.
                  </p>
                </div>
                
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
                  {loading ? 'Preparando sesión...' : 'Conectar WhatsApp'}
                </button>
              </div>
            )}

            {status === 'WAITING_QR' && qrCode && (
              <div className="mb-6">
                <div className="bg-[#182229] rounded-lg p-4 mb-4">
                  <h2 className="text-white font-medium mb-3">Escanea el código QR:</h2>
                  <InstructionStep number={1} text="Abre WhatsApp en tu teléfono." />
                  <InstructionStep number={2} text="Toca Configuración (iOS) o los tres puntos (Android)." />
                  <InstructionStep number={3} text="Selecciona 'Dispositivos vinculados' y luego 'Vincular un dispositivo'." />
                  <InstructionStep number={4} text="Apunta la cámara de tu teléfono al código QR." />
                </div>
                <div className="flex justify-center mb-4">
                  <div className="bg-white p-4 rounded-lg">
                    <img src={qrCode} alt="QR Code" className="w-64 h-64" />
                  </div>
                </div>
                <p className="text-gray-400 text-center text-sm">
                  El código QR se actualizará automáticamente. Si expira, reinicia el proceso.
                </p>
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

            {status === 'ERROR' && (
              <div className="text-center mt-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/20 mb-4">
                  <svg
                    className="w-8 h-8 text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">
                  Error de conexión
                </h2>
                <p className="text-red-400 mb-4">{error}</p>
                <button
                  onClick={handleConnect}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg transition-all"
                >
                  Intentar nuevamente
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </IsLogged>
  );
} 