import React from 'react';
import { Sidebar } from '@/components/Sidebar/Sidebar';

interface SidebarLayoutProps {
  children: React.ReactNode;
}

export const SidebarLayout = ({ children }: SidebarLayoutProps) => {
  return (
    <div className="flex h-screen bg-bgCoal">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
} 