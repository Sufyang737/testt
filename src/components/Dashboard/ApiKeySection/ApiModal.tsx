"use client"
import React, { useState } from "react";
import { Form } from "./ModalForm";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useAuth } from "@clerk/nextjs";

interface ApiKey {
  id: string;
  name: string;
  project: string;
  permissions: string;
  resources: Record<string, string>;
  created: string;
}

interface CreateSecretKeyModalProps {
  onClose: () => void;
  onSubmit: (data: ApiKey) => void;
}

export const ApiModal: React.FC<CreateSecretKeyModalProps> = ({ onClose, onSubmit }) => {
  const { userId } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFormSubmit = async (data: { name: string; project: string; permissions: string; resources: Record<string, string> }) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/apikeys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          client_id: userId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create API key');
      }

      const result = await response.json();
      onSubmit(result.data);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while creating the API key');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-[1000] scroll-bar-modal">
      <div className="bg-bgCoal text-white rounded-lg w-full max-w-5xl h-[90%] border overflow-x-auto">
        <div className="p-6">
          <div className="w-full flex justify-between items-center ">
            <h2 className="text-2xl font-bold mb-4">Crea tu nueva llave secreta</h2>
            <button 
              className="w-7 h-7 flex justify-center items-center rounded-full bg-prinFuchsia transition-colors duration-150 hover:bg-btnFuchsiaHov"
              onClick={onClose}
            >
              <XMarkIcon className="w-5 h-5 text-txtWhite" />
            </button>
          </div>
          {error && (
            <div className="mb-4 p-4 bg-red-500 bg-opacity-10 border border-red-500 rounded-lg text-red-500">
              {error}
            </div>
          )}
          <Form onSubmit={handleFormSubmit} />
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-lg bg-bgCoal border-[1px] border-prinFuchsia 
                transition-colors duration-150 group hover:bg-btnFuchsiaHov"
              disabled={isLoading}
            >
              <p className="text-prinFuchsia transition-colors duration-150 group-hover:text-txtWhite">Cancelar</p>
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`px-4 py-2 rounded-lg bg-prinFuchsia transition-colors duration-150 hover:bg-btnFuchsiaHov ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? 'Creando...' : 'Crear Clave Secreta'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
