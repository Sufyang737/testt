"use client"
import { createContext, useContext, useState, ReactNode } from 'react';
import PropTypes from 'prop-types';

interface SidebarContextProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  openItems: Set<string>;
  setOpenItems: React.Dispatch<React.SetStateAction<Set<string>>>
  toggleItem: (path: string) => void;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar debe ser usado dentro de un SidebarProvider');
  }
  return context;
};

export const SidebarProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [open, setOpen] = useState<boolean>(true);
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggleItem = (path: string) => {
    setOpenItems(prev => {
      const newOpenItems = new Set(prev);
      if (newOpenItems.has(path)) {
        newOpenItems.delete(path);
      } else {
        newOpenItems.add(path);
      }
      return newOpenItems;
    });
  };

  return (
    <SidebarContext.Provider value={{ open, setOpen, openItems, toggleItem, setOpenItems }}>
      {children}
    </SidebarContext.Provider>
  );
};

SidebarProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
