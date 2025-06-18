// src/components/providers/LayoutProvider.tsx
"use client";

import React, { createContext, useState, useContext } from 'react';

// Definimos qué datos contendrá nuestro contexto
interface LayoutContextType {
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

// Creamos el contexto con un valor por defecto
const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

// Creamos el Proveedor que envolverá nuestra aplicación
export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(prev => !prev);
  };

  return (
    <LayoutContext.Provider value={{ isSidebarCollapsed, toggleSidebar }}>
      {children}
    </LayoutContext.Provider>
  );
}

// Creamos un hook personalizado para usar fácilmente el contexto
export function useLayout() {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
}