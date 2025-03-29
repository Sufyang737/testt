"use client";

import React, { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, ChevronUpDownIcon, LinkIcon, XCircleIcon, CheckCircleIcon, PencilIcon } from '@heroicons/react/24/outline';
import { useUser } from '@clerk/nextjs';
import PocketBase from 'pocketbase';

interface ProfileLead {
  id: string;
  instagram: string;
  facebook: string;
  x: string;
  name_client: string;
  name_company: string;
  description_company: string;
  conversation: string;
  client_id: string;
  created: string;
  updated: string;
}

const ITEMS_PER_PAGE = 10;
const POCKETBASE_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://ai-agent-database.srv.clostech.tech';

export default function LeadsPage() {
  const { user } = useUser();
  const [leads, setLeads] = useState<ProfileLead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pb] = useState(() => new PocketBase(POCKETBASE_URL));
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortConfig, setSortConfig] = useState<{
    field: keyof ProfileLead | '';
    direction: 'asc' | 'desc';
  }>({ field: 'created', direction: 'desc' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentLead, setCurrentLead] = useState<ProfileLead | null>(null);
  const [formData, setFormData] = useState({
    name_client: '',
    name_company: '',
    description_company: '',
    instagram: '',
    facebook: '',
    x: ''
  });

  const fetchLeads = async (page: number = 1) => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      // Primero obtener el ID del cliente actual
      const clientRecord = await pb.collection('clients').getFirstListItem(
        `clerk_id = "${user.id}"`
      );

      // Construir el filtro base para obtener solo los leads del cliente actual
      let filter = `client_id = "${clientRecord.id}"`;

      // Añadir filtro de búsqueda si existe término
      if (searchTerm) {
        filter += ` && (name_client ~ "${searchTerm}" || name_company ~ "${searchTerm}" || description_company ~ "${searchTerm}")`;
      }

      // Obtener los leads con paginación y ordenamiento
      const result = await pb.collection('profile_lead').getList(page, ITEMS_PER_PAGE, {
        filter: filter,
        sort: `${sortConfig.direction === 'desc' ? '-' : ''}${sortConfig.field || 'created'}`,
      });

      setLeads(result.items.map(item => ({
        id: item.id,
        instagram: item.instagram || '',
        facebook: item.facebook || '',
        x: item.x || '',
        name_client: item.name_client || '',
        name_company: item.name_company || '',
        description_company: item.description_company || '',
        conversation: item.conversation || '',
        client_id: item.client_id || '',
        created: item.created || '',
        updated: item.updated || ''
      })));
      setTotalPages(result.totalPages);
      setError(null);
    } catch (err) {
      console.error('Error al cargar leads:', err);
      setLeads([]);
      setError('Error al cargar los perfiles de leads');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads(currentPage);
  }, [user, currentPage, sortConfig, searchTerm]);

  const handleSort = (field: keyof ProfileLead) => {
    setSortConfig({
      field,
      direction: sortConfig.field === field && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const handleEdit = (lead: ProfileLead) => {
    setCurrentLead(lead);
    setFormData({
      name_client: lead.name_client,
      name_company: lead.name_company,
      description_company: lead.description_company,
      instagram: lead.instagram || '',
      facebook: lead.facebook || '',
      x: lead.x || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentLead) return;

    try {
      await pb.collection('profile_lead').update(currentLead.id, formData);
      setIsModalOpen(false);
      setCurrentLead(null);
      fetchLeads(currentPage);
      // Mostrar mensaje de éxito
      setError(null);
    } catch (err) {
      console.error('Error al actualizar lead:', err);
      setError('Error al actualizar el perfil del lead');
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center">
        <div className="relative w-16 h-16">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-prinFuchsia/20 rounded-full"></div>
          <div className="absolute top-0 left-0 w-full h-full border-4 border-prinFuchsia rounded-full animate-spin border-t-transparent"></div>
        </div>
        <p className="mt-4 text-gray-600 text-sm animate-pulse">Cargando perfiles...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 flex flex-col items-center justify-center">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-8 max-w-md w-full text-center">
          <XCircleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-red-400 text-lg font-medium mb-2">Error al cargar perfiles</h3>
          <p className="text-gray-600 text-sm">{error}</p>
          <button
            onClick={() => fetchLeads(currentPage)}
            className="mt-4 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm"
          >
            Intentar nuevamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header y Búsqueda */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-light text-gray-800 mb-1">Perfiles de Leads</h1>
            <p className="text-sm text-gray-500">Gestiona y monitorea tus leads</p>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 bg-white text-gray-700 text-sm border border-gray-200 rounded-full px-4 py-2 pl-10 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <MagnifyingGlassIcon className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
          </div>
        </div>

        {/* Tabla de Leads */}
        <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">
                  <button onClick={() => handleSort('name_client')} className="flex items-center gap-2 hover:text-gray-800">
                    Nombre del Cliente
                    <ChevronUpDownIcon className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">
                  <button onClick={() => handleSort('name_company')} className="flex items-center gap-2 hover:text-gray-800">
                    Empresa
                    <ChevronUpDownIcon className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">Redes Sociales</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">
                  <button onClick={() => handleSort('created')} className="flex items-center gap-2 hover:text-gray-800">
                    Fecha
                    <ChevronUpDownIcon className="w-3 h-3" />
                  </button>
                </th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No se encontraron perfiles de leads
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-800">{lead.name_client}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-800">{lead.name_company}</div>
                      <div className="text-xs text-gray-500 mt-1 line-clamp-2">{lead.description_company}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex space-x-2">
                        {lead.instagram && (
                          <a href={lead.instagram} target="_blank" rel="noopener noreferrer" 
                             className="text-gray-400 hover:text-primary">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/>
                            </svg>
                          </a>
                        )}
                        {lead.facebook && (
                          <a href={lead.facebook} target="_blank" rel="noopener noreferrer" 
                             className="text-gray-400 hover:text-primary">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                          </a>
                        )}
                        {lead.x && (
                          <a href={lead.x} target="_blank" rel="noopener noreferrer" 
                             className="text-gray-400 hover:text-primary">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                            </svg>
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      {new Date(lead.created).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => handleEdit(lead)}
                        className="text-gray-400 hover:text-primary transition-colors"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded-md text-sm ${
                currentPage === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Anterior
            </button>
            <span className="px-3 py-1 text-sm text-gray-600">
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded-md text-sm ${
                currentPage === totalPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Siguiente
            </button>
          </div>
        )}

        {/* Modal de Edición */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white w-full max-w-md rounded-2xl border border-gray-200 shadow-xl">
              <div className="p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-medium text-gray-800">
                    Editar Perfil de Lead
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Actualiza la información del perfil seleccionado
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      Nombre del Cliente
                    </label>
                    <input
                      type="text"
                      value={formData.name_client}
                      onChange={(e) => setFormData({ ...formData, name_client: e.target.value })}
                      className="w-full bg-white text-gray-800 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      Nombre de la Empresa
                    </label>
                    <input
                      type="text"
                      value={formData.name_company}
                      onChange={(e) => setFormData({ ...formData, name_company: e.target.value })}
                      className="w-full bg-white text-gray-800 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      Descripción de la Empresa
                    </label>
                    <textarea
                      value={formData.description_company}
                      onChange={(e) => setFormData({ ...formData, description_company: e.target.value })}
                      className="w-full bg-white text-gray-800 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                      rows={4}
                      required
                    />
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-700">Redes Sociales</h3>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Instagram
                      </label>
                      <input
                        type="url"
                        value={formData.instagram}
                        onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                        className="w-full bg-white text-gray-800 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        placeholder="https://instagram.com/..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Facebook
                      </label>
                      <input
                        type="url"
                        value={formData.facebook}
                        onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                        className="w-full bg-white text-gray-800 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        placeholder="https://facebook.com/..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        X (Twitter)
                      </label>
                      <input
                        type="url"
                        value={formData.x}
                        onChange={(e) => setFormData({ ...formData, x: e.target.value })}
                        className="w-full bg-white text-gray-800 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        placeholder="https://x.com/..."
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setIsModalOpen(false);
                        setCurrentLead(null);
                      }}
                      className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
                    >
                      Guardar cambios
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