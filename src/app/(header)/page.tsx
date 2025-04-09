"use client";
import React, { useState, useEffect } from 'react'
import { ExpenseChart, UsageHeader, UsageActividad, ImageUse } from '@/components/Dashboard'
import { OrdersAnalytics } from '@/components/Dashboard/UsoSection/CostoPage/OrdersAnalytics'
import { ModalPageInCreation } from '@/components/ui'
import AuthStatus from '@/components/Authentication/AuthStatus'
import { 
  ChatBubbleLeftRightIcon, 
  UserGroupIcon, 
  DocumentTextIcon, 
  ShoppingBagIcon,
  ArrowTrendingUpIcon,
  BellAlertIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import PocketBase from 'pocketbase';

const WAHA_API_URL = process.env.NEXT_PUBLIC_WAHA_API_URL || '';
const POCKETBASE_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || '';

// Interfaces para los componentes
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  change?: {
    isUp: boolean;
    value: string | number;
  };
}

interface QuickAccessCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  link: string;
  color: string;
}

interface RecentNotificationProps {
  title: string;
  time: string;
  isNew: boolean;
}

// Interfaces para datos de la API
interface WAHAChat {
  id: string;
  name: string;
  lastMessage?: {
    body: string;
    timestamp: number;
  };
  picture?: string;
}

interface ConversationRecord {
  id: string;
  client_id: string;
  use_bot: boolean;
  name: string;
  number_client: number;
  category: string;
  finished_chat: boolean;
  chat_id: string;
  created: string;
  updated: string;
}

interface ChatClassification {
  id: string;
  conversation_id: string;
  clasification: "low" | "medium" | "high";
  client_id: string;
  created: string;
  updated: string;
}

// Interfaces para elementos renderizados
interface ConversationItemProps {
  name: string;
  lastMessage: string;
  time: string;
  botActive: boolean;
  hasUnread: boolean;
  chatId: string;
  priority?: "low" | "medium" | "high";
}

// Componente para las tarjetas de estadísticas
const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, change }) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow">
    <div className="flex justify-between">
      <div>
        <p className="text-sm text-gray-500 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        {change && (
          <div className={`flex items-center mt-2 text-xs ${change.isUp ? 'text-green-500' : 'text-red-500'}`}>
            <ArrowTrendingUpIcon className={`w-3 h-3 mr-1 ${!change.isUp && 'transform rotate-180'}`} />
            <span>{change.value}% {change.isUp ? 'más' : 'menos'} que ayer</span>
          </div>
        )}
      </div>
      <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${color}`}>
        {icon}
      </div>
    </div>
  </div>
);

// Componente para tarjetas de acceso rápido
const QuickAccessCard: React.FC<QuickAccessCardProps> = ({ title, description, icon, link, color }) => (
  <Link 
    href={link} 
    className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-start gap-4 hover:shadow-md transition-all hover:-translate-y-1"
  >
    <div className={`h-12 w-12 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
      {icon}
    </div>
    <div>
      <h3 className="text-lg font-semibold text-gray-800 mb-1">{title}</h3>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  </Link>
);

// Componente para notificaciones recientes
const RecentNotification: React.FC<RecentNotificationProps> = ({ title, time, isNew }) => (
  <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
    <div className="flex items-center gap-3">
      <div className={`w-2 h-2 rounded-full ${isNew ? 'bg-primary' : 'bg-gray-300'}`}></div>
      <p className="text-sm text-gray-700">{title}</p>
    </div>
    <p className="text-xs text-gray-500">{time}</p>
  </div>
);

// Componente para mostrar las últimas conversaciones
const ConversationItem: React.FC<ConversationItemProps> = ({ 
  name, 
  lastMessage, 
  time, 
  botActive, 
  hasUnread, 
  chatId,
  priority 
}) => {
  // Determinar color basado en prioridad
  let priorityColor = '';
  let priorityLabel = '';
  
  if (priority) {
    switch(priority) {
      case 'high':
        priorityColor = 'bg-red-500';
        priorityLabel = 'Alta';
        break;
      case 'medium':
        priorityColor = 'bg-orange-400';
        priorityLabel = 'Media';
        break;
      case 'low':
        priorityColor = 'bg-green-500';
        priorityLabel = 'Baja';
        break;
    }
  }
  
  return (
    <Link 
      href={`/dashboard/chat?id=${chatId}`} 
      className="flex items-start justify-between py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors rounded-lg px-2"
    >
      <div className="flex items-start gap-3">
        <div className={`w-2 h-2 rounded-full mt-1.5 ${!botActive ? 'bg-primary' : hasUnread ? 'bg-yellow-400' : 'bg-gray-300'}`}></div>
        <div>
          <p className="text-sm font-medium text-gray-800 flex items-center gap-1">
            {name}
            {!botActive && <span className="text-xs bg-primary/10 text-primary rounded px-1.5 py-0.5">Manual</span>}
            {priority && (
              <span className={`text-xs ml-1 text-white rounded px-1.5 py-0.5 ${priorityColor}`}>
                {priorityLabel}
              </span>
            )}
          </p>
          <p className="text-xs text-gray-500 line-clamp-1">{lastMessage}</p>
        </div>
      </div>
      <p className="text-xs text-gray-500 shrink-0">{time}</p>
    </Link>
  );
};

// Componente para mostrar una métrica con su distribución
interface PriorityMetricProps {
  title: string;
  data: {
    high: number;
    medium: number;
    low: number;
  };
  total: number;
}

const PriorityMetric: React.FC<PriorityMetricProps> = ({ title, data, total }) => {
  const highPercent = total > 0 ? Math.round((data.high / total) * 100) : 0;
  const mediumPercent = total > 0 ? Math.round((data.medium / total) * 100) : 0;
  const lowPercent = total > 0 ? Math.round((data.low / total) * 100) : 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">{title}</h3>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-500">Experiencia buena</span>
        <span className="text-sm font-medium">{data.high} ({highPercent}%)</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
        <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${highPercent}%` }}></div>
      </div>
      
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-500">Experiencia regular</span>
        <span className="text-sm font-medium">{data.medium} ({mediumPercent}%)</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
        <div className="bg-yellow-400 h-2.5 rounded-full" style={{ width: `${mediumPercent}%` }}></div>
      </div>
      
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-500">Experiencia mala</span>
        <span className="text-sm font-medium">{data.low} ({lowPercent}%)</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
        <div className="bg-red-500 h-2.5 rounded-full" style={{ width: `${lowPercent}%` }}></div>
      </div>
    </div>
  );
};

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Estados para datos de métricas
  const [recentConversations, setRecentConversations] = useState<Array<ConversationItemProps>>([]);
  const [metrics, setMetrics] = useState({
    activeConversations: 0,
    manualConversations: 0,
    automatedConversations: 0,
    finishedConversations: 0,
    totalLeads: 0,
    templatesUsed: 0,
    todayConversations: 0,
    yesterdayConversations: 0,
    openChats: 0,
    closedChats: 0
  });
  
  // Estado para métricas de prioridad
  const [priorityMetrics, setPriorityMetrics] = useState({
    high: 0,
    medium: 0,
    low: 0,
    total: 0
  });
  
  // Función para obtener datos del cliente
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Inicializar PocketBase
        const pb = new PocketBase(POCKETBASE_URL);
        
        // 1. Obtener el ID del cliente
        const clientRecord = await pb.collection('clients').getFirstListItem(`clerk_id = "${pb.authStore.model?.id}"`);
        
        if (!clientRecord) {
          setErrorMsg('No se encontró información del cliente');
          setIsLoading(false);
          return;
        }
        
        const clientId = clientRecord.id;
        
        // 2. Obtener conversaciones
        const conversations = await pb.collection('conversation').getFullList<ConversationRecord>({
          filter: `client_id = "${clientId}"`,
          sort: '-created'
        });
        
        // 3. Obtener clasificaciones de chat
        const classifications = await pb.collection('chat_clasification').getFullList<ChatClassification>({
          filter: `client_id = "${clientId}"`,
          sort: '-created'
        });
        
        // Crear mapa de chatId a prioridad para una búsqueda más eficiente
        const priorityMap: {[conversationId: string]: string} = {};
        classifications.forEach(cls => {
          priorityMap[cls.conversation_id] = cls.clasification;
        });
        
        // 4. Obtener datos de WAHA para mensajes recientes
        if (clientRecord.session_id) {
          try {
            const wahaResponse = await fetch(`${WAHA_API_URL}/api/${clientRecord.session_id}/chats/overview`);
            
            if (wahaResponse.ok) {
              const wahaChats: WAHAChat[] = await wahaResponse.json();
              
              // Crear mapa de chatId a uso de bot para búsqueda eficiente
              const botStatusMap: {[chatId: string]: boolean} = {};
              conversations.forEach(conv => {
                botStatusMap[conv.chat_id] = conv.use_bot;
              });
              
              // Transformar y filtrar chats
              const formattedConversations = wahaChats
                .filter(chat => chat.lastMessage)
                .sort((a, b) => {
                  // Primero ordenar por prioridad (alta primero)
                  const chatIdA = a.id;
                  const chatIdB = b.id;
                  
                  // Encontrar las conversaciones por chat_id
                  const convA = conversations.find(c => c.chat_id === chatIdA);
                  const convB = conversations.find(c => c.chat_id === chatIdB);
                  
                  if (convA && convB) {
                    const priorityA = priorityMap[convA.id] || 'low';
                    const priorityB = priorityMap[convB.id] || 'low';
                    
                    const priorityOrder = { 'high': 0, 'medium': 1, 'low': 2 };
                    if (priorityOrder[priorityA as keyof typeof priorityOrder] !== priorityOrder[priorityB as keyof typeof priorityOrder]) {
                      return priorityOrder[priorityA as keyof typeof priorityOrder] - priorityOrder[priorityB as keyof typeof priorityOrder];
                    }
                    
                    // Después por bot (manual primero)
                    if (!botStatusMap[a.id] && botStatusMap[b.id]) return -1;
                    if (botStatusMap[a.id] && !botStatusMap[b.id]) return 1;
                  }
                  
                  // Si todo es igual o no se encuentra información, ordenar por timestamp
                  return (b.lastMessage?.timestamp || 0) - (a.lastMessage?.timestamp || 0);
                })
                .slice(0, 5)
                .map(chat => {
                  // Formatear tiempo relativo
                  const timestamp = chat.lastMessage?.timestamp || 0;
                  const now = Math.floor(Date.now() / 1000);
                  const diff = now - timestamp;
                  
                  let timeLabel = '';
                  if (diff < 60) {
                    timeLabel = `${diff} seg`;
                  } else if (diff < 3600) {
                    timeLabel = `${Math.floor(diff / 60)} min`;
                  } else if (diff < 86400) {
                    timeLabel = `${Math.floor(diff / 3600)} h`;
                  } else {
                    timeLabel = `${Math.floor(diff / 86400)} d`;
                  }
                  
                  // Encontrar la conversación correspondiente para obtener más detalles
                  const conversation = conversations.find(c => c.chat_id === chat.id);
                  let priority: "low" | "medium" | "high" | undefined;
                  
                  if (conversation) {
                    const classification = priorityMap[conversation.id];
                    if (classification) {
                      priority = classification as "low" | "medium" | "high";
                    }
                  }
                  
                  return {
                    name: chat.name || 'Sin nombre',
                    lastMessage: chat.lastMessage?.body || 'No hay mensajes',
                    time: timeLabel,
                    botActive: conversation ? conversation.use_bot : true,
                    hasUnread: false,
                    chatId: chat.id,
                    priority
                  };
                });
              
              setRecentConversations(formattedConversations);
            }
          } catch (wahaError) {
            console.error('Error al obtener datos de WAHA:', wahaError);
          }
        }
        
        // 5. Calcular métricas
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const todayTimestamp = today.toISOString();
        const yesterdayTimestamp = yesterday.toISOString();
        
        const todayConversations = conversations.filter(c => new Date(c.created) >= today).length;
        const yesterdayConversations = conversations.filter(c => {
          const date = new Date(c.created);
          return date >= yesterday && date < today;
        }).length;
        
        const percentChange = yesterdayConversations > 0 
          ? Math.round(((todayConversations - yesterdayConversations) / yesterdayConversations) * 100) 
          : 100;
        
        const activeConversations = conversations.filter(c => !c.finished_chat).length;
        const manualConversations = conversations.filter(c => !c.use_bot && !c.finished_chat).length;
        const automatedConversations = conversations.filter(c => c.use_bot && !c.finished_chat).length;
        const finishedConversations = conversations.filter(c => c.finished_chat).length;
        
        // Calcular métricas de prioridad
        const high = classifications.filter(c => c.clasification === 'high').length;
        const medium = classifications.filter(c => c.clasification === 'medium').length;
        const low = classifications.filter(c => c.clasification === 'low').length;
        const total = classifications.length;
        
        // Actualizar estados
        setMetrics({
          activeConversations,
          manualConversations,
          automatedConversations,
          finishedConversations,
          totalLeads: conversations.length,
          templatesUsed: 95, // Dato de ejemplo, reemplazar con datos reales
          todayConversations,
          yesterdayConversations,
          openChats: activeConversations,
          closedChats: finishedConversations
        });
        
        setPriorityMetrics({
          high,
          medium,
          low,
          total
        });
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error al obtener datos del dashboard:', error);
        setErrorMsg('Error al cargar datos del dashboard');
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
    
    // Actualizar cada minuto
    const interval = setInterval(fetchDashboardData, 60000);
    return () => clearInterval(interval);
  }, []);

  // Calcular porcentaje de cambio para las conversaciones de hoy
  const percentChange = metrics.yesterdayConversations > 0 
    ? Math.round(((metrics.todayConversations - metrics.yesterdayConversations) / metrics.yesterdayConversations) * 100) 
    : 100;
  
  const isIncreased = percentChange >= 0;

  return (
    <main className="min-h-[calc(100vh-70px)] w-full overflow-x-hidden">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 overflow-y-auto">
        <div id="welcome-section" className="w-full">
          <div className="space-y-8">
            <AuthStatus>
              <>
                <div className="mb-8">
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Bienvenido a tu Dashboard</h1>
                  <p className="text-gray-500">
                    Administra tus conversaciones, clientes y métricas en tiempo real.
                  </p>
                </div>

                {/* Métricas principales */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
                  <StatCard 
                    title="Conversaciones Hoy" 
                    value={isLoading ? "..." : metrics.todayConversations}
                    icon={<ChatBubbleLeftRightIcon className="h-6 w-6 text-white" />}
                    color="bg-blue-500"
                    change={{ isUp: isIncreased, value: Math.abs(percentChange) }}
                  />
                  <StatCard 
                    title="Conversaciones Activas" 
                    value={isLoading ? "..." : metrics.activeConversations}
                    icon={<ClockIcon className="h-6 w-6 text-white" />}
                    color="bg-primary"
                    change={{ isUp: true, value: "8" }}
                  />
                  <StatCard 
                    title="Chats Cerrados" 
                    value={isLoading ? "..." : metrics.closedChats}
                    icon={<XMarkIcon className="h-6 w-6 text-white" />}
                    color="bg-gray-500"
                    change={{ isUp: false, value: "3" }}
                  />
                  <StatCard 
                    title="Evaluaciones Positivas" 
                    value={isLoading ? "..." : priorityMetrics.high}
                    icon={<CheckCircleIcon className="h-6 w-6 text-white" />}
                    color="bg-green-500"
                    change={{ isUp: true, value: "5" }}
                  />
                </div>

                {/* Sección para Métricas de Evaluación */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
                  <div className="lg:col-span-2">
                    <PriorityMetric 
                      title="Distribución de Evaluaciones" 
                      data={priorityMetrics} 
                      total={priorityMetrics.total} 
                    />
                  </div>
                  <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <StatCard 
                      title="Evaluación Positiva" 
                      value={isLoading ? "..." : priorityMetrics.high} 
                      icon={<CheckCircleIcon className="h-6 w-6 text-white" />}
                      color="bg-green-500" 
                      change={{ isUp: true, value: 12 }}
                    />
                    <StatCard 
                      title="Evaluación Regular" 
                      value={isLoading ? "..." : priorityMetrics.medium} 
                      icon={<ClockIcon className="h-6 w-6 text-white" />}
                      color="bg-yellow-400" 
                      change={{ isUp: true, value: 3 }}
                    />
                    <StatCard 
                      title="Evaluación Negativa" 
                      value={isLoading ? "..." : priorityMetrics.low} 
                      icon={<ExclamationTriangleIcon className="h-6 w-6 text-white" />}
                      color="bg-red-500" 
                      change={{ isUp: false, value: 2 }}
                    />
                  </div>
                </div>

                {/* Estadísticas Adicionales */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                  <StatCard 
                    title="Chats Manuales" 
                    value={isLoading ? "..." : metrics.manualConversations}
                    icon={<UserGroupIcon className="h-6 w-6 text-white" />}
                    color="bg-indigo-500"
                    change={{ isUp: true, value: "10" }}
                  />
                  <StatCard 
                    title="Chats Automatizados" 
                    value={isLoading ? "..." : metrics.automatedConversations}
                    icon={<ChatBubbleLeftRightIcon className="h-6 w-6 text-white" />}
                    color="bg-purple-500"
                    change={{ isUp: false, value: "5" }}
                  />
                  <StatCard 
                    title="Leads Generados" 
                    value={isLoading ? "..." : metrics.totalLeads}
                    icon={<UserGroupIcon className="h-6 w-6 text-white" />}
                    color="bg-pink-500"
                    change={{ isUp: true, value: "15" }}
                  />
                  <StatCard 
                    title="Templates Usados" 
                    value={isLoading ? "..." : metrics.templatesUsed}
                    icon={<DocumentTextIcon className="h-6 w-6 text-white" />}
                    color="bg-amber-500"
                    change={{ isUp: true, value: "20" }}
                  />
                </div>

                {/* Análisis de Órdenes */}
                <div className="mb-8">
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-3">Análisis de Órdenes</h2>
                    <p className="text-gray-500 text-sm mb-4">Métricas detalladas de rendimiento</p>
                    <div className="flex flex-col items-center justify-center py-12">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <h3 className="text-lg font-medium text-gray-700 mb-2">Próximamente</h3>
                      <p className="text-gray-500 text-center max-w-md">La información detallada de órdenes estará disponible pronto.</p>
                    </div>
                  </div>
                </div>

                {/* Accesos rápidos y Últimas Conversaciones */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                  <div className="lg:col-span-2">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Acceso Rápido</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <QuickAccessCard 
                        title="Gestionar Chats" 
                        description="Responde a tus clientes y gestiona conversaciones activas"
                        icon={<ChatBubbleLeftRightIcon className="h-6 w-6 text-white" />}
                        link="/dashboard/chat"
                        color="bg-blue-500"
                      />
                      <QuickAccessCard 
                        title="Evaluaciones" 
                        description="Visualiza y analiza las valoraciones de tus clientes"
                        icon={<CheckCircleIcon className="h-6 w-6 text-white" />}
                        link="/dashboard/clasificaciones"
                        color="bg-green-500"
                      />
                      <QuickAccessCard 
                        title="Ver Leads" 
                        description="Consulta tu lista de leads y su información de contacto"
                        icon={<UserGroupIcon className="h-6 w-6 text-white" />}
                        link="/dashboard/leads"
                        color="bg-primary"
                      />
                      <QuickAccessCard 
                        title="Editar Plantillas" 
                        description="Crea y personaliza tus plantillas de mensajes"
                        icon={<DocumentTextIcon className="h-6 w-6 text-white" />}
                        link="/dashboard/templates"
                        color="bg-purple-500"
                      />
                      <QuickAccessCard 
                        title="Administrar Productos" 
                        description="Añade o modifica productos de tu catálogo"
                        icon={<ShoppingBagIcon className="h-6 w-6 text-white" />}
                        link="/dashboard/products"
                        color="bg-emerald-500"
                      />
                      <QuickAccessCard
                        title="Contactos"
                        description="Administra tus contactos y sus detalles"
                        icon={<UserGroupIcon className="h-6 w-6 text-white" />}
                        link="/contactos"
                        color="bg-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-5">
                      <h2 className="text-xl font-semibold text-gray-800">Conversaciones Recientes</h2>
                      <div className="flex flex-col items-end gap-1">
                        <span className="inline-flex items-center bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 bg-primary rounded-full mr-1"></span>
                          Manual
                        </span>
                        <span className="inline-flex items-center bg-red-500/10 text-red-500 text-xs px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1"></span>
                          Alta prioridad
                        </span>
                      </div>
                    </div>
                    
                    {isLoading ? (
                      <div className="flex flex-col items-center justify-center py-8">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2"></div>
                        <p className="text-sm text-gray-500">Cargando conversaciones...</p>
                      </div>
                    ) : errorMsg ? (
                      <div className="text-center py-8">
                        <p className="text-sm text-red-500 mb-2">{errorMsg}</p>
                        <p className="text-xs text-gray-500">Intenta recargar la página</p>
                      </div>
                    ) : recentConversations.length > 0 ? (
                      <div className="space-y-1">
                        {recentConversations.map((conversation, index) => (
                          <ConversationItem 
                            key={index}
                            name={conversation.name}
                            lastMessage={conversation.lastMessage}
                            time={conversation.time}
                            botActive={conversation.botActive}
                            hasUnread={conversation.hasUnread}
                            chatId={conversation.chatId}
                            priority={conversation.priority}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <ChatBubbleLeftRightIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500 mb-1">No hay conversaciones activas</p>
                        <p className="text-xs text-gray-400">Las conversaciones aparecerán aquí</p>
                      </div>
                    )}
                    
                    <div className="mt-4 pt-3 border-t border-gray-100">
                      <Link href="/dashboard/chat" className="text-primary hover:text-primary-hover text-sm font-medium flex justify-center">
                        Ver todas las conversaciones
                      </Link>
                    </div>
                  </div>
            </div>
              </>
            </AuthStatus>
          </div>
        </div>
      </div>
    </main>
  );
}
  