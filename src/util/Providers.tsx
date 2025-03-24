'use client'
import React, { ReactNode } from 'react';
import { ClerkProvider } from '@clerk/nextjs';
import { SidebarProvider } from "@/context/SidebarContext";
import { PlanProvider } from '@/context/PlanContext';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/context/AuthContext";

interface ProvidersProps {
  children: ReactNode;
}

const queryClient = new QueryClient();

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ClerkProvider>
        <AuthProvider>
          <SidebarProvider>
            <PlanProvider>
              {children}
            </PlanProvider>
          </SidebarProvider>
        </AuthProvider>
      </ClerkProvider>
    </QueryClientProvider>
  );
}
