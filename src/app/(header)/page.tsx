"use client";
import React from 'react'
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
  BellAlertIcon 
} from '@heroicons/react/24/outline'
import Link from 'next/link'

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

export default function HomePage() {
  return (
    <main className="min-h-[calc(100vh-70px)] w-full">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 overflow-y-auto">
        <div id="welcome-section" className="w-full">
          <div className="space-y-8">
            <AuthStatus>
              <>
                <div className="mb-8">
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Bienvenido a tu Dashboard</h1>
                  <p className="text-gray-500">
                    Administra tus chats, plantillas y accede a todas las funcionalidades.
                  </p>
                </div>

                {/* Métricas principales */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  <StatCard 
                    title="Conversaciones Activas" 
                    value="28" 
                    icon={<ChatBubbleLeftRightIcon className="h-6 w-6 text-white" />}
                    color="bg-blue-500"
                    change={{ isUp: true, value: "12" }}
                  />
                  <StatCard 
                    title="Nuevos Leads" 
                    value="14" 
                    icon={<UserGroupIcon className="h-6 w-6 text-white" />}
                    color="bg-primary"
                    change={{ isUp: true, value: "8" }}
                  />
                  <StatCard 
                    title="Templates Enviados" 
                    value="95" 
                    icon={<DocumentTextIcon className="h-6 w-6 text-white" />}
                    color="bg-purple-500"
                    change={{ isUp: false, value: "3" }}
                  />
                  <StatCard 
                    title="Productos" 
                    value="32" 
                    icon={<ShoppingBagIcon className="h-6 w-6 text-white" />}
                    color="bg-emerald-500"
                    change={{ isUp: true, value: "5" }}
                  />
                </div>

                {/* Gráfico de actividad y resumen */}
                <div id="usage-stats" className="mt-8">
                  <OrdersAnalytics />
                </div>

                {/* Accesos rápidos y Notificaciones */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
                  <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <h2 className="text-xl font-semibold text-gray-800 sm:col-span-2 mb-1">Acceso Rápido</h2>
                    <QuickAccessCard 
                      title="Gestionar Chats" 
                      description="Responde a tus clientes y gestiona conversaciones activas"
                      icon={<ChatBubbleLeftRightIcon className="h-6 w-6 text-white" />}
                      link="/dashboard/chat"
                      color="bg-blue-500"
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
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-5">
                      <h2 className="text-xl font-semibold text-gray-800">Notificaciones</h2>
                      <span className="bg-primary text-white text-xs px-2 py-1 rounded-full">3 nuevas</span>
                    </div>
                    <div className="space-y-1">
                      <RecentNotification 
                        title="Nuevo lead generado desde el sitio web" 
                        time="Hace 23 min" 
                        isNew={true} 
                      />
                      <RecentNotification 
                        title="5 conversaciones sin responder" 
                        time="Hace 1 hora" 
                        isNew={true} 
                      />
                      <RecentNotification 
                        title="Nuevo pedido recibido: #1234" 
                        time="Hace 2 horas" 
                        isNew={true} 
                      />
                      <RecentNotification 
                        title="Plan actualizado correctamente" 
                        time="Hace 1 día" 
                        isNew={false} 
                      />
                      <RecentNotification 
                        title="Conexión con WhatsApp establecida" 
                        time="Hace 2 días" 
                        isNew={false} 
                      />
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-100">
                      <Link href="/dashboard/actividad" className="text-primary hover:text-primary-hover text-sm font-medium flex justify-center">
                        Ver toda la actividad
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
  )
}
  