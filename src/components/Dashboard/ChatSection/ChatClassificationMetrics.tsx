"use client";
import React, { useState, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import PocketBase from 'pocketbase';

const POCKETBASE_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || '';

interface ChatClassification {
  id: string;
  conversation_id: string;
  clasification: "low" | "medium" | "high";
  client_id: string;
  created: string;
  updated: string;
  conversation?: {
    name: string;
    use_bot: boolean;
    chat_id: string;
    finished_chat: boolean;
  };
}

interface ChatClassificationMetricsProps {
  clientId?: string;
}

type SortField = 'created' | 'clasification';
type SortDirection = 'asc' | 'desc';

const ChatClassificationMetrics: React.FC<ChatClassificationMetricsProps> = ({ clientId }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [classifications, setClassifications] = useState<ChatClassification[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortField, setSortField] = useState<SortField>('created');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filterPriority, setFilterPriority] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  
  // Métricas calculadas
  const [metrics, setMetrics] = useState({
    high: 0,
    medium: 0,
    low: 0,
    total: 0,
    highPercent: 0,
    mediumPercent: 0,
    lowPercent: 0
  });

  // Función para cargar los datos
  const loadClassifications = async () => {
    if (!clientId) return;
    
    try {
      setIsLoading(true);
      const pb = new PocketBase(POCKETBASE_URL);
      
      // Construir filtro base
      let filter = `client_id="${clientId}"`;
      
      // Añadir filtro por prioridad si está seleccionado
      if (filterPriority !== 'all') {
        filter += ` && clasification="${filterPriority}"`;
      }
      
      // Añadir filtro de búsqueda
      if (searchTerm) {
        filter += ` && (conversation.name ~ "${searchTerm}" || conversation.chat_id ~ "${searchTerm}")`;
      }
      
      // Construir orden
      const sort = sortDirection === 'desc' ? `-${sortField}` : sortField;
      
      // Obtener datos paginados
      const resultList = await pb.collection('chat_clasification').getList(
        currentPage, 
        itemsPerPage, 
        {
          filter,
          sort,
          expand: 'conversation'
        }
      );
      
      // Formatear datos
      const formattedClassifications = resultList.items.map((item: any) => ({
        id: item.id,
        conversation_id: item.conversation_id,
        clasification: item.clasification,
        client_id: item.client_id,
        created: item.created,
        updated: item.updated,
        conversation: item.expand?.conversation
      }));
      
      setClassifications(formattedClassifications);
      setTotalPages(resultList.totalPages);
      
      // Cargar las métricas completas (sin paginación)
      const allResults = await pb.collection('chat_clasification').getFullList({
        filter: `client_id="${clientId}"`,
        sort: '-created'
      });
      
      // Calcular métricas
      const high = allResults.filter((item: any) => item.clasification === 'high').length;
      const medium = allResults.filter((item: any) => item.clasification === 'medium').length;
      const low = allResults.filter((item: any) => item.clasification === 'low').length;
      const total = allResults.length;
      
      setMetrics({
        high,
        medium,
        low,
        total,
        highPercent: total > 0 ? Math.round((high / total) * 100) : 0,
        mediumPercent: total > 0 ? Math.round((medium / total) * 100) : 0,
        lowPercent: total > 0 ? Math.round((low / total) * 100) : 0
      });
      
      setIsLoading(false);
    } catch (err) {
      console.error('Error al cargar clasificaciones:', err);
      setError('Error al cargar los datos de clasificación de chat');
      setIsLoading(false);
    }
  };

  // Cargar datos al iniciar y cuando cambien los filtros
  useEffect(() => {
    loadClassifications();
  }, [clientId, currentPage, sortField, sortDirection, filterPriority, searchTerm]);

  // Función para manejar la búsqueda
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset a la primera página al buscar
  };

  // Función para cambiar el orden
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Cambiar dirección si es el mismo campo
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Si es un campo diferente, establecer el campo y dirección descendente por defecto
      setSortField(field);
      setSortDirection('desc');
    }
    
    setCurrentPage(1);
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Obtener clase de color según clasificación
  const getPriorityClasses = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Obtener texto según clasificación
  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'Buena';
      case 'medium':
        return 'Regular';
      case 'low':
        return 'Mala';
      default:
        return 'Sin evaluar';
    }
  };

  // Renderizar ícono de evaluación
  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <CheckCircleIcon className="h-4 w-4 text-green-600" />;
      case 'medium':
        return <ClockIcon className="h-4 w-4 text-yellow-600" />;
      case 'low':
        return <ExclamationTriangleIcon className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Evaluación de Conversaciones</h2>
      
      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <p className="text-sm text-gray-500 mb-1">Total</p>
          <p className="text-xl font-bold">{metrics.total}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-3 border border-green-200">
          <p className="text-sm text-green-600 mb-1">Experiencia buena</p>
          <p className="text-xl font-bold">{metrics.high} <span className="text-sm font-normal">({metrics.highPercent}%)</span></p>
        </div>
        <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
          <p className="text-sm text-yellow-600 mb-1">Experiencia regular</p>
          <p className="text-xl font-bold">{metrics.medium} <span className="text-sm font-normal">({metrics.mediumPercent}%)</span></p>
        </div>
        <div className="bg-red-50 rounded-lg p-3 border border-red-200">
          <p className="text-sm text-red-600 mb-1">Experiencia mala</p>
          <p className="text-xl font-bold">{metrics.low} <span className="text-sm font-normal">({metrics.lowPercent}%)</span></p>
        </div>
      </div>
      
      {/* Barra de búsqueda y filtros */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o ID de chat"
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-primary focus:border-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </form>
        
        <div className="relative">
          <button 
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            onClick={() => {
              const dropdown = document.getElementById('priority-dropdown');
              if (dropdown) dropdown.classList.toggle('hidden');
            }}
          >
            <FunnelIcon className="h-5 w-5 text-gray-500" />
            <span className="text-gray-700">
              {filterPriority === 'all' ? 'Todas las evaluaciones' : 
               filterPriority === 'high' ? 'Buena experiencia' :
               filterPriority === 'medium' ? 'Experiencia regular' : 'Mala experiencia'}
            </span>
          </button>
          
          <div 
            id="priority-dropdown" 
            className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 hidden z-10"
          >
            <div className="py-1" role="menu" aria-orientation="vertical">
              <button 
                className={`block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left ${filterPriority === 'all' ? 'bg-gray-100' : ''}`}
                role="menuitem"
                onClick={() => setFilterPriority('all')}
              >
                Todas las evaluaciones
              </button>
              <button 
                className={`block px-4 py-2 text-sm text-green-600 hover:bg-gray-100 w-full text-left ${filterPriority === 'high' ? 'bg-gray-100' : ''}`}
                role="menuitem"
                onClick={() => setFilterPriority('high')}
              >
                Buena experiencia
              </button>
              <button 
                className={`block px-4 py-2 text-sm text-yellow-600 hover:bg-gray-100 w-full text-left ${filterPriority === 'medium' ? 'bg-gray-100' : ''}`}
                role="menuitem"
                onClick={() => setFilterPriority('medium')}
              >
                Experiencia regular
              </button>
              <button 
                className={`block px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left ${filterPriority === 'low' ? 'bg-gray-100' : ''}`}
                role="menuitem"
                onClick={() => setFilterPriority('low')}
              >
                Mala experiencia
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabla de resultados */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Conversación
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('clasification')}
              >
                <div className="flex items-center">
                  <span>Evaluación</span>
                  {sortField === 'clasification' && (
                    sortDirection === 'asc' ? 
                    <ArrowUpIcon className="h-4 w-4 ml-1" /> : 
                    <ArrowDownIcon className="h-4 w-4 ml-1" />
                  )}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('created')}
              >
                <div className="flex items-center">
                  <span>Fecha</span>
                  {sortField === 'created' && (
                    sortDirection === 'asc' ? 
                    <ArrowUpIcon className="h-4 w-4 ml-1" /> : 
                    <ArrowDownIcon className="h-4 w-4 ml-1" />
                  )}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Estado
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center">
                  <div className="flex justify-center">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center">
                  <div className="flex flex-col items-center justify-center py-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-gray-500 font-medium">No pudimos cargar los datos</p>
                    <p className="text-gray-400 text-sm mt-1">Por favor, intente más tarde</p>
                  </div>
                </td>
              </tr>
            ) : classifications.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                  No se encontraron registros
                </td>
              </tr>
            ) : (
              classifications.map((classification) => (
                <tr key={classification.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="ml-2">
                        <div className="text-sm font-medium text-gray-900">
                          {classification.conversation?.name || 'Sin nombre'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {classification.conversation?.chat_id || 'ID no disponible'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getPriorityClasses(classification.clasification)}`}>
                      <span className="flex items-center">
                        {getPriorityIcon(classification.clasification)}
                        <span className="ml-1">{getPriorityText(classification.clasification)}</span>
                      </span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(classification.created)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${classification.conversation?.finished_chat 
                      ? 'bg-gray-100 text-gray-800' 
                      : !classification.conversation?.use_bot 
                      ? 'bg-primary/10 text-primary' 
                      : 'bg-blue-100 text-blue-800'}`}
                    >
                      {classification.conversation?.finished_chat 
                        ? 'Finalizada' 
                        : !classification.conversation?.use_bot 
                        ? 'Manual' 
                        : 'Bot activo'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 border-t border-gray-200 pt-4">
          <div>
            <p className="text-sm text-gray-700">
              Mostrando <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> a <span className="font-medium">
                {Math.min(currentPage * itemsPerPage, metrics.total)}
              </span> de <span className="font-medium">{metrics.total}</span> resultados
            </p>
          </div>
          <div className="flex gap-2">
            <button
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Anterior
            </button>
            <button
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatClassificationMetrics; 