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
      path: "/dashboard/apikey",
      titleItem: "Api Key",
      icon: LockClosedIcon,
      activeTitle: ["/dashboard/apikey"],
      sublinks: [{ path: "/dashboard/apikey", titleItem: "Api Key" }],
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

interface SidebarLayoutProps {
  children: React.ReactNode;
}

export function SidebarLayout({ children }: SidebarLayoutProps) {
  const pathname = usePathname();

  const currentItems = Object.entries(sidebarItems).find(([prefix]) =>
    pathname.startsWith(prefix)
  )?.[1] || sidebarItems["/dashboard"];

  return (
    <div className="flex min-h-screen bg-bgCoal">
      <Sidebar />
      <div className="flex-1 overflow-x-hidden">
        <div className="container mx-auto px-4 py-6">
          {children}
        </div>
      </div>
    </div>
  );
} 