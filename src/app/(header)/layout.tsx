"use client";

import React from "react";
import "@/app/globals.css";
import { Providers } from "@/util/Providers";
import IsLogged from "@/components/Authentication/isLogged";
import { SidebarLayout } from "@/components/Sidebar/SidebarLayout";

interface LayoutProps {
  children: React.ReactNode;
}

export default function HeaderLayout({ children }: LayoutProps) {
  return (
    <Providers>
      <SidebarLayout>
        {children}
      </SidebarLayout>
      <IsLogged />
    </Providers>
  );
}