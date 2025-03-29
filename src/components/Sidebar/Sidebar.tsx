"use client"
import React from 'react';
import { ChevronLeftIcon, HomeIcon, ChatBubbleLeftRightIcon, UsersIcon, ShoppingBagIcon, DocumentTextIcon, KeyIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { useSidebar } from '@/context/SidebarContext';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { useUser } from '@clerk/nextjs';
import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { usePlan } from '@/context/PlanContext';

interface SidebarItem {
  name: string;
  href: string;
  active: boolean;
  icon: React.ElementType;
}

export const Sidebar = () => {
  const { open, setOpen } = useSidebar();
  const pathname = usePathname();
  const { user } = useUser();
  const { isLoading, isPaid, daysLeft } = usePlan();

  const items: SidebarItem[] = [
    {
      name: 'Dashboard',
      href: '/',
      active: pathname === '/',
      icon: HomeIcon
    },
    {
      name: 'Actividad',
      href: '/dashboard/actividad',
      active: pathname.includes('/dashboard/actividad'),
      icon: ChartBarIcon
    },
    {
      name: 'Chat',
      href: '/dashboard/chat',
      active: pathname.includes('/dashboard/chat'),
      icon: ChatBubbleLeftRightIcon
    },
    {
      name: 'Leads',
      href: '/dashboard/leads',
      active: pathname.includes('/dashboard/leads'),
      icon: UsersIcon
    },
    {
      name: 'Productos',
      href: '/dashboard/products',
      active: pathname.includes('/dashboard/products'),
      icon: ShoppingBagIcon
    },
    {
      name: 'Plantillas',
      href: '/dashboard/templates',
      active: pathname.includes('/dashboard/templates'),
      icon: DocumentTextIcon
    }
  ];

  return (
    <aside className={`h-screen transition-all duration-300 ease-in-out ${open ? 'w-64' : 'w-20'} flex-shrink-0 relative`}>
      <nav className="h-full flex flex-col bg-white border-r border-gray-200 shadow-md">
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          <div className={`flex items-center ${!open && 'justify-center w-full'}`}>
            <div className={`relative ${open ? 'w-10' : 'w-8'} h-8 flex-shrink-0`}>
              <Image
                src="/images/Magofinal2.png"
                alt="Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            {open && (
              <div className="ml-3 overflow-hidden">
                <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">Mago Final</h1>
                <p className="text-xs text-gray-600 leading-tight truncate">Tu asistente inteligente</p>
              </div>
            )}
          </div>
          {open ? (
            <button 
              onClick={() => setOpen(false)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Colapsar menú"
            >
              <ChevronLeftIcon className="w-5 h-5 text-gray-700" />
            </button>
          ) : (
            <div className="absolute -right-3 top-16 z-10">
              <button 
                onClick={() => setOpen(true)}
                className="bg-white p-1.5 rounded-full border border-gray-200 shadow-md hover:shadow-lg hover:bg-primary hover:border-primary group transition-all duration-300 hover:scale-110 animate-pulse-slow flex items-center justify-center"
                title="Expandir menú"
              >
                <ChevronLeftIcon className="w-4 h-4 text-primary group-hover:text-white rotate-180" />
              </button>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="px-4 py-4 border-b border-gray-200 bg-gray-50">
          <div className={`flex items-center gap-3 ${!open && 'justify-center'}`}>
            <UserButton afterSignOutUrl="/"/>
            {open && user && (
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-800 truncate">{user.fullName}</span>
                <span className="text-xs text-gray-500 truncate">{user.primaryEmailAddress?.emailAddress}</span>
              </div>
            )}
          </div>
          {open && (
            <div className="mt-3 px-3 py-2 bg-primary/10 rounded-lg">
              <span className="text-xs text-gray-700 font-medium">
                {isLoading ? 'Cargando...' : isPaid ? 'Plan activo' : 
                 daysLeft > 0 ? `${daysLeft} días restantes de prueba` : 'Período de prueba finalizado'}
              </span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex-1 px-3 py-4 space-y-2 overflow-y-auto">
          {items.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`relative flex items-center px-3 py-3 rounded-lg transition-all
                ${item.active 
                  ? 'bg-primary text-white shadow-md' 
                  : 'text-gray-700 hover:bg-gray-100 hover:text-primary hover:translate-x-1'}
                ${!open && 'justify-center px-2'}`}
            >
              <item.icon className={`${open ? 'w-5 h-5' : 'w-6 h-6'} flex-shrink-0`} />
              {open && (
                <span className="ml-3 text-sm font-medium">{item.name}</span>
              )}
              {item.active && (
                <div className="absolute left-0 top-0 h-full w-1 bg-secondary rounded-l"></div>
              )}
            </Link>
          ))}
        </div>
      </nav>
    </aside>
  );
};