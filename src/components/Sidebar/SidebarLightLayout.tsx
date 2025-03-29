"use client"

import React from "react";
import { Sidebar } from "./Sidebar";
import { SideItems } from "./Links/SideItems";
import { 
  ChartBarIcon, 
  LockClosedIcon, 
  CurrencyDollarIcon, 
  BuildingOfficeIcon,
  ChatBubbleLeftIcon,
} from "@heroicons/react/24/outline";
import { SidebarItem } from "@/util/type";
import { usePathname } from "next/navigation";

const sidebarItems: Record<string, SidebarItem[]> = {
  "/dashboard": [
    {
      path: "/",
      titleItem: "Uso",
      icon: ChartBarIcon,
      activeTitle: ["/", "/dashboard/actividad"],
      sublinks: [
        { path: "/", titleItem: "Análisis" },
        { path: "/dashboard/actividad", titleItem: "Consumo" },
      ],
    },
    {
      path: "/dashboard/chat",
      titleItem: "Chat",
      icon: ChatBubbleLeftIcon,
      activeTitle: ["/dashboard/chat"],
    },
  ],
  "/playground": [
    {
      path: "/playground",
      titleItem: "Planes",
      icon: CurrencyDollarIcon,
      activeTitle: ["/playground"],
    },
  ],
  "/settings": [
    {
      path: "/settings",
      titleItem: "Empresa",
      icon: BuildingOfficeIcon,
      activeTitle: ["/settings"],
    },
  ],
};

interface SidebarLightLayoutProps {
  children: React.ReactNode;
}

export function SidebarLightLayout({ children }: SidebarLightLayoutProps) {
  const pathname = usePathname();

  const currentItems = Object.entries(sidebarItems).find(([prefix]) =>
    pathname.startsWith(prefix)
  )?.[1] || sidebarItems["/dashboard"];

  return (
    <div className="flex min-h-screen bg-bgLight relative">
      {/* Elementos decorativos de fondo */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[5%] left-[5%] w-96 h-96 bg-primary/5 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-[10%] right-[5%] w-96 h-96 bg-secondary/5 rounded-full filter blur-3xl"></div>
        <div className="absolute top-0 right-0 w-full h-24 bg-gradient-to-b from-white/20 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-white/20 to-transparent"></div>
      </div>
      
      <Sidebar />
      <div className="flex-1 overflow-x-hidden relative z-10">
        <div className="container mx-auto p-6">
          {/* Tarjeta de contenido principal con fondo semitransparente */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-200/50">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
} 