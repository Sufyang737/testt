'use client';
import React, { ReactNode, useEffect } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { usePathname } from 'next/navigation';
import { useSidebar } from '@/context/SidebarContext';
import { SidebarItem } from '@/util/type';
import { SideLinks } from './SideLinks';
import { motion, AnimatePresence } from 'framer-motion';
import { FiHome, FiActivity, FiKey, FiSettings, FiBell } from "react-icons/fi";

interface SideItemsProps {
  items: SidebarItem[];
}

export const SideItems: React.FC<SideItemsProps> = ({ items }) => {
  const { openItems, toggleItem, open, setOpen, setOpenItems } = useSidebar();
  const pathname = usePathname();

  useEffect(() => {
    if (!open) {
      setOpenItems(new Set());
    }
  }, [open, setOpenItems]);
  
  const isActive = (item: SidebarItem) => {
    const activeTitles = Array.isArray(item.activeTitle) ? item.activeTitle : [item.activeTitle];
    return activeTitles.includes(pathname);
  };

  return (
    <>
      {items.map(item => {
        const isItemOpen = openItems.has(item.path);
        const isDisabled = !open;
        const active = isActive(item);

        return (
          <motion.li
            key={item.path}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className={`relative flex flex-col items-start px-2
              rounded-md font-maven text-base font-medium
              transition-all duration-200 ease-in-out
              ${active ? 'text-prinFuchsia bg-gray-800 bg-opacity-50' : 'text-txtWhite'}
              ${open ? 'hover:bg-gray-800 cursor-pointer' : 'hover:bg-btnFuchsiaHov hover:text-white cursor-default'}
              ${isItemOpen ? 'bg-gray-800 bg-opacity-30' : ''}
            `}
            onClick={() => !isDisabled && toggleItem(item.path)}
          >
            <div className={`relative flex w-full items-center rounded-md py-3 
              transition-all duration-200 ease-in-out
              ${open ? '' : 'border-none pl-[3px]'}
            `}>
              {item.icon && (
                <motion.span
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className={`transition-all flex justify-center items-center
                    ${open ? 'w-7 h-7' : 'w-8 h-8'}`}
                >
                  <item.icon className="w-full h-full" />
                </motion.span>
              )}
              <h3 className={`absolute text-xl font-semibold transition-all duration-300
                ${open ? 'ml-12 opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}
              >
                {item.titleItem}
              </h3>
              {item.sublinks && item.sublinks.length > 0 && (
                <motion.div
                  animate={{ rotate: isItemOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className={`absolute right-2 ${open ? '' : 'hidden'}`}
                >
                  <ChevronDownIcon className="w-5 h-5" />
                </motion.div>
              )}
            </div>

            <AnimatePresence>
              {isItemOpen && (
                <motion.ul
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="py-2 pl-10 pr-2 w-full flex flex-col gap-2 overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  <SideLinks links={item.sublinks || []} />
                </motion.ul>
              )}
            </AnimatePresence>
          </motion.li>
        );
      })}
    </>
  );
};

export const sidebarItems = [
  {
    title: "Home",
    path: "/",
    icon: <FiHome className="w-6 h-6" />,
  },
  {
    title: "Actividad",
    path: "/dashboard/actividad",
    icon: <FiActivity className="w-6 h-6" />,
  },
  {
    title: "API Key",
    path: "/dashboard/apikey",
    icon: <FiKey className="w-6 h-6" />,
  },
  {
    title: "Notificaciones",
    path: "/dashboard/notifications",
    icon: <FiBell className="w-6 h-6" />,
  },
  {
    title: "Configuración",
    path: "/settings",
    icon: <FiSettings className="w-6 h-6" />,
  },
];
