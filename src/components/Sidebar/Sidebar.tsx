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
      name: 'API Key',
      href: '/dashboard/apikey',
      active: pathname.includes('/dashboard/apikey'),
      icon: KeyIcon
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
    <aside className={`h-screen transition-all duration-300 ease-in-out ${open ? 'w-64' : 'w-20'} flex-shrink-0`}>
      <nav className="h-full flex flex-col bg-[rgb(26,29,31)] border-r border-white/10">
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4">
          <div className={`flex items-center ${!open && 'justify-center w-full'}`}>
            <div className={`relative ${open ? 'w-32' : 'w-8'} h-8`}>
              <Image
                src={open ? "/images/ClostechLogo.png" : "/images/LogoIcon.png"}
                alt="Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
          <button 
            onClick={() => setOpen(!open)}
            className="p-2 rounded-lg hover:bg-white/5"
          >
            <ChevronLeftIcon className={`w-5 h-5 text-white transition-transform ${!open && 'rotate-180'}`}/>
          </button>
        </div>

        {/* User Profile */}
        <div className="px-4 py-4 border-b border-white/10">
          <div className={`flex items-center gap-3 ${!open && 'justify-center'}`}>
            <UserButton afterSignOutUrl="/"/>
            {open && user && (
              <div className="flex flex-col">
                <span className="text-sm font-medium text-white truncate">{user.fullName}</span>
                <span className="text-xs text-white/50 truncate">{user.primaryEmailAddress?.emailAddress}</span>
              </div>
            )}
          </div>
          {open && (
            <div className="mt-3 px-3 py-2 bg-white/5 rounded-lg">
              <span className="text-xs text-white/70">
                {isLoading ? 'Cargando...' : isPaid ? 'Plan activo' : 
                 daysLeft > 0 ? `${daysLeft} días restantes de prueba` : 'Período de prueba finalizado'}
              </span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {items.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`relative flex items-center px-3 py-2 rounded-lg transition-colors
                ${item.active ? 'bg-primary text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'}
                ${!open && 'justify-center px-2'}`}
            >
              <item.icon className={`${open ? 'w-5 h-5' : 'w-6 h-6'} flex-shrink-0`} />
              {open && (
                <span className="ml-3 text-sm font-medium">{item.name}</span>
              )}
            </Link>
          ))}
        </div>
      </nav>
    </aside>
  );
};