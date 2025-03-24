'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { PencilIcon } from '@heroicons/react/24/outline';

interface UserData {
  first_name: string;
  last_name: string;
  email: string;
  store_id: string;
  platform: string;
  username: string;
}

interface EditableFields {
  first_name: boolean;
  last_name: boolean;
  email: boolean;
  store_id: boolean;
  platform: boolean;
  username: boolean;
}

export const AccountSettings = () => {
  const { userId, token, logout, name, updateProfile } = useAuth();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editableFields, setEditableFields] = useState<EditableFields>({
    first_name: false,
    last_name: false,
    email: false,
    store_id: false,
    platform: false,
    username: false
  });
  const [userData, setUserData] = useState<UserData>({
    first_name: '',
    last_name: '',
    email: '',
    store_id: '',
    platform: '',
    username: ''
  });

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId || !token) return;
      
      try {
        setIsLoading(true);
        const response = await fetch(`/api/users/${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Error al obtener datos del usuario');
        }

        const data = await response.json();
        setUserData(data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [userId, token]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const toggleEditable = (field: keyof EditableFields) => {
    setEditableFields(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSaveField = async (field: keyof UserData) => {
    if (!userId || !token) return;

    try {
      setIsSaving(true);
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ [field]: userData[field] })
      });

      if (!response.ok) {
        throw new Error('Error al actualizar datos');
      }

      await updateProfile();
      toggleEditable(field);
      alert('Campo actualizado correctamente');
    } catch (error) {
      console.error('Error:', error);
      alert('No se pudo actualizar el campo. Por favor, intente más tarde.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!userId || !token) return;
    
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al eliminar la cuenta');
      }

      logout();
      router.push('/');
    } catch (error) {
      console.error('Error:', error);
      alert('No se pudo eliminar la cuenta. Por favor, intente más tarde.');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-prinFuchsia"></div>
      </div>
    );
  }

  const renderField = (
    field: keyof UserData,
    label: string,
    type: string = 'text',
    required: boolean = true
  ) => (
    <div className="relative">
      <label htmlFor={field} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="relative flex items-center">
        <input
          type={type}
          id={field}
          name={field}
          value={userData[field]}
          onChange={handleInputChange}
          disabled={!editableFields[field]}
          className={`w-full px-3 py-2 bg-gray-50 border ${
            editableFields[field] ? 'border-prinFuchsia bg-white' : 'border-gray-200'
          } rounded-lg focus:outline-none focus:ring-1 focus:ring-prinFuchsia ${
            !editableFields[field] ? 'text-gray-700' : ''
          } h-12`}
          required={required}
          placeholder={`Ingresa tu ${label.toLowerCase()}`}
        />
        <div className="absolute right-0 flex space-x-2 pr-3">
          {editableFields[field] ? (
            <>
              <button
                type="button"
                onClick={() => handleSaveField(field)}
                disabled={isSaving}
                className="text-prinFuchsia hover:text-btnFuchsiaHov p-1 text-sm font-medium"
              >
                Guardar
              </button>
              <button
                type="button"
                onClick={() => toggleEditable(field)}
                className="text-gray-500 hover:text-gray-700 p-1 text-sm font-medium"
              >
                Cancelar
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => toggleEditable(field)}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <PencilIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Formulario de edición de perfil */}
      <div className="bg-white p-8 rounded-2xl shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Datos de la Cuenta</h2>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderField('first_name', 'Nombre')}
            {renderField('last_name', 'Apellido')}
          </div>
          {renderField('email', 'Email', 'email')}
          {renderField('username', 'Nombre de usuario')}
          {renderField('store_id', 'ID de Tienda', 'text', false)}
          {renderField('platform', 'Plataforma', 'text', false)}
        </div>
      </div>

      {/* Sección de eliminar cuenta */}
      <div className="bg-white p-8 rounded-2xl shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Eliminar Cuenta</h2>
        <p className="text-gray-600 mb-6">
          Esta acción es permanente y no se puede deshacer. Se eliminarán todos tus datos y configuraciones.
        </p>
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg transition-colors font-medium"
          >
            Eliminar mi cuenta
          </button>
        ) : (
          <div className="space-y-4">
            <p className="text-red-600 font-medium">
              ¿Estás seguro que deseas eliminar tu cuenta permanentemente?
            </p>
            <div className="space-x-4">
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg transition-colors font-medium disabled:opacity-50"
              >
                {isDeleting ? 'Eliminando...' : 'Sí, eliminar mi cuenta'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg transition-colors font-medium"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 