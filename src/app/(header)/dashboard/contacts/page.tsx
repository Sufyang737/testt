"use client";

import React, { useState, useEffect } from 'react';
import { PencilIcon, MagnifyingGlassIcon, CheckCircleIcon, XCircleIcon, ChevronUpDownIcon } from '@heroicons/react/24/outline';
import { useUser } from '@clerk/nextjs';
import PocketBase from 'pocketbase';

interface Contact {
  id: string;
  client_id: string;
  name: string;
  number_client: number;
  category: string;
  finished_chat: boolean;
  chat_id: string;
  created: string;
  updated: string;
}

const POCKETBASE_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://ai-agent-database.srv.clostech.tech';

const PREDEFINED_CATEGORIES = [
  'Ventas',
  'Soporte',
  'Consultas',
  'Reclamos',
  'Seguimiento',
  'Otros'
];

export default function ContactsPage() {
  const { user } = useUser();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pb] = useState(() => new PocketBase(POCKETBASE_URL));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentContact, setCurrentContact] = useState<Contact | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Contact | '';
    direction: 'asc' | 'desc';
  }>({ key: '', direction: 'asc' });
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    number_client: '',
    finished_chat: false
  });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeCategoryDropdown, setActiveCategoryDropdown] = useState<string | null>(null);

  const fetchContacts = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const clientRecord = await pb.collection('clients').getFirstListItem(
        `clerk_id = "${user.id}"`
      );

      const records = await pb.collection('conversation').getFullList<Contact>({
        filter: `client_id = "${clientRecord.id}"`,
        sort: '-created'
      });

      setContacts(records);
      setError(null);
    } catch (err) {
      console.error('Error al cargar contactos:', err);
      setContacts([]);
      setError('Error al cargar los contactos');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !currentContact) return;

    try {
      const data = {
        ...formData,
        number_client: parseInt(formData.number_client)
      };

      await pb.collection('conversation').update(currentContact.id, data);
      setIsModalOpen(false);
      setCurrentContact(null);
      setFormData({
        name: '',
        category: '',
        number_client: '',
        finished_chat: false
      });
      fetchContacts();
    } catch (err) {
      console.error('Error al actualizar contacto:', err);
      setError('Error al actualizar el contacto');
    }
  };

  const handleEdit = (contact: Contact) => {
    setCurrentContact(contact);
    setFormData({
      name: contact.name,
      category: contact.category,
      number_client: contact.number_client.toString(),
      finished_chat: contact.finished_chat
    });
    setIsModalOpen(true);
  };

  const handleSort = (key: keyof Contact) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const sortedContacts = [...contacts].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortConfig.direction === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    return sortConfig.direction === 'asc'
      ? (aValue > bValue ? 1 : -1)
      : (bValue > aValue ? 1 : -1);
  });

  const filteredContacts = sortedContacts.filter(contact => 
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.number_client.toString().includes(searchTerm)
  );

  const handleQuickStatusChange = async (contact: Contact) => {
    try {
      const updatedStatus = !contact.finished_chat;
      await pb.collection('conversation').update(contact.id, {
        finished_chat: updatedStatus
      });
      
      // Actualizar el estado local
      setContacts(contacts.map(c => 
        c.id === contact.id 
          ? { ...c, finished_chat: updatedStatus }
          : c
      ));

      // Mostrar notificación de éxito temporal
      const message = updatedStatus ? 'Chat marcado como finalizado' : 'Chat marcado como en proceso';
      setError(null);
      setSuccessMessage(message);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error al actualizar estado:', err);
      setError('Error al actualizar el estado del chat');
    }
  };

  const handleQuickCategoryChange = async (contact: Contact, newCategory: string) => {
    try {
      await pb.collection('conversation').update(contact.id, {
        category: newCategory
      });
      
      // Actualizar el estado local
      setContacts(contacts.map(c => 
        c.id === contact.id 
          ? { ...c, category: newCategory }
          : c
      ));

      // Mostrar notificación de éxito temporal
      setError(null);
      setSuccessMessage('Categoría actualizada correctamente');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error al actualizar categoría:', err);
      setError('Error al actualizar la categoría');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bgCoal p-8 flex flex-col items-center justify-center">
        <div className="relative w-16 h-16">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-prinFuchsia/20 rounded-full"></div>
          <div className="absolute top-0 left-0 w-full h-full border-4 border-prinFuchsia rounded-full animate-spin border-t-transparent"></div>
        </div>
        <p className="mt-4 text-gray-400 text-sm animate-pulse">Cargando contactos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bgCoal p-8 flex flex-col items-center justify-center">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-8 max-w-md w-full text-center">
          <XCircleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-red-400 text-lg font-medium mb-2">Error al cargar contactos</h3>
          <p className="text-gray-400 text-sm">{error}</p>
          <button
            onClick={fetchContacts}
            className="mt-4 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm"
          >
            Intentar nuevamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bgCoal p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header y Búsqueda */}
        <div className="flex items-center gap-6 mb-8">
          <h1 className="text-xl font-medium text-white">Contactos</h1>
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-800/50 text-white rounded-md pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-700"
            />
            <MagnifyingGlassIcon className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
          </div>
        </div>

        {/* Notificaciones */}
        {error && (
          <div className="text-sm text-red-400 bg-red-400/5 px-4 py-2 rounded-md">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="text-sm text-green-400 bg-green-400/5 px-4 py-2 rounded-md">
            {successMessage}
          </div>
        )}

        {/* Tabla */}
        <div className="bg-gray-800/50 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">
                  <button onClick={() => handleSort('name')} className="flex items-center gap-2 hover:text-white">
                    Nombre
                    <ChevronUpDownIcon className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">
                  <button onClick={() => handleSort('number_client')} className="flex items-center gap-2 hover:text-white">
                    Número
                    <ChevronUpDownIcon className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">
                  <button onClick={() => handleSort('category')} className="flex items-center gap-2 hover:text-white">
                    Categoría
                    <ChevronUpDownIcon className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">
                  <button onClick={() => handleSort('finished_chat')} className="flex items-center gap-2 hover:text-white">
                    Estado
                    <ChevronUpDownIcon className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">
                  <button onClick={() => handleSort('created')} className="flex items-center gap-2 hover:text-white">
                    Fecha
                    <ChevronUpDownIcon className="w-3 h-3" />
                  </button>
                </th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-3 text-center text-sm text-gray-400">
                    No se encontraron contactos
                  </td>
                </tr>
              ) : (
                filteredContacts.map((contact) => (
                  <tr key={contact.id} className="group hover:bg-gray-700/30">
                    <td className="px-4 py-3">
                      <div className="text-sm text-white">{contact.name}</div>
                      <div className="text-xs text-gray-500">{contact.chat_id}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {contact.number_client}
                    </td>
                    <td className="px-4 py-3">
                      <div className="relative">
                        <button
                          onClick={() => setActiveCategoryDropdown(contact.id)}
                          className="text-sm text-gray-300 hover:text-white"
                        >
                          {contact.category}
                        </button>
                        {activeCategoryDropdown === contact.id && (
                          <div className="absolute z-10 mt-1 w-40 bg-gray-800 rounded-md shadow-lg py-1 text-sm">
                            {PREDEFINED_CATEGORIES.map((category) => (
                              <button
                                key={category}
                                className="block w-full text-left px-3 py-1 text-gray-300 hover:bg-gray-700/50"
                                onClick={() => {
                                  handleQuickCategoryChange(contact, category);
                                  setActiveCategoryDropdown(null);
                                }}
                              >
                                {category}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleQuickStatusChange(contact)}
                        className="text-sm"
                      >
                        {contact.finished_chat ? (
                          <span className="text-green-400 flex items-center gap-1">
                            <CheckCircleIcon className="w-4 h-4" />
                            Finalizado
                          </span>
                        ) : (
                          <span className="text-yellow-400 flex items-center gap-1">
                            <XCircleIcon className="w-4 h-4" />
                            En proceso
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {new Date(contact.created).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleEdit(contact)}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Modal de edición */}
        {isModalOpen && currentContact && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800/95 rounded-lg w-full max-w-md">
              <div className="p-6 space-y-4">
                <h2 className="text-lg font-medium text-white">
                  Editar Contacto
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1" htmlFor="name">
                      Nombre
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-gray-700/50 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-600"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1" htmlFor="category">
                      Categoría
                    </label>
                    <div className="relative">
                      <select
                        id="category"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full bg-gray-700/50 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-600 appearance-none"
                        required
                      >
                        <option value="" disabled>Seleccionar</option>
                        {PREDEFINED_CATEGORIES.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                      <ChevronUpDownIcon className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1" htmlFor="number">
                      Número
                    </label>
                    <input
                      id="number"
                      type="number"
                      value={formData.number_client}
                      onChange={(e) => setFormData({ ...formData, number_client: e.target.value })}
                      className="w-full bg-gray-700/50 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-600"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">
                      Estado
                    </label>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, finished_chat: !formData.finished_chat })}
                      className="w-full text-left"
                    >
                      {formData.finished_chat ? (
                        <div className="flex items-center gap-2 text-green-400 bg-green-400/10 px-3 py-2 rounded-md">
                          <CheckCircleIcon className="w-4 h-4" />
                          <span className="text-sm">Finalizado</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-yellow-400 bg-yellow-400/10 px-3 py-2 rounded-md">
                          <XCircleIcon className="w-4 h-4" />
                          <span className="text-sm">En proceso</span>
                        </div>
                      )}
                    </button>
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-3 py-2 text-sm text-gray-400 hover:text-white"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-2 text-sm bg-gray-700 text-white rounded-md hover:bg-gray-600"
                    >
                      Guardar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 