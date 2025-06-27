// src/components/layout/AppShell.tsx
"use client";

import { useSession } from "next-auth/react";
import SideNav from "@/components/layout/SideNav";
import styles from "@/app/admin/layout.module.css";
import { useLayout } from "@/components/providers/LayoutProvider";
import SidebarToggleButton from "@/components/layout/SidebarToggleButton";
import UserDropdown from "@/components/auth/UserDropdown";
import Image from 'next/image';
import { useState, useEffect } from "react";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const { isSidebarCollapsed } = useLayout();

  const [showExpandedLogo, setShowExpandedLogo] = useState(!isSidebarCollapsed);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isSidebarCollapsed) {
        setShowExpandedLogo(false);
    } else {
      // Pequeño delay para que la animación del logo se vea bien al expandir
      timer = setTimeout(() => setShowExpandedLogo(true), 150);
    }
    return () => clearTimeout(timer);
  }, [isSidebarCollapsed]);


  if (!session?.user) return null;

  const userRole = session.user.role;
  const roleThemeMap: { [key: string]: string } = {
    'ADMINISTRADOR': 'role-theme-administrador',
    'SUPERVISOR': 'role-theme-supervisor',
    'GERENTE': 'role-theme-gerente',
    'ENCARGADO': 'role-theme-colaborador',
    'VENDEDOR': 'role-theme-colaborador',
  };
  const themeClass = roleThemeMap[userRole] || '';

  return (
    <div className={`d-flex ${themeClass}`} style={{ minHeight: '100vh' }}>
      <div className={`${styles.sidebar} ${isSidebarCollapsed ? styles.collapsed : ''}`}>
        <div>
          <div className={styles.sidebarHeader}>
            <h2>
              {isSidebarCollapsed && "R"}
              {!isSidebarCollapsed && showExpandedLogo && (
                <Image
                  className={styles.fadeIn}
                  src="/reebok.png" // Asumo que tienes un logo llamado reebok.png en tu carpeta /public
                  alt="reebok Logo"
                  width={180}
                  height={110}
                  priority
                />
              )}
            </h2>
          </div>
          <SideNav isCollapsed={isSidebarCollapsed} />
        </div>
      </div>

      <main className={styles.mainContent + " flex-grow-1"}>
          <header className={styles.pageHeader}>
            <SidebarToggleButton />
            {/* CORRECCIÓN: El nombre de la tienda y los paréntesis solo aparecen si existen */}
            <span className="me-auto">
                {session.user.name}
                {session.user.storeName && (
                    <span className="text-muted ms-2">({session.user.storeName})</span>
                )}
            </span>
            <div className="ms-auto">
              <UserDropdown />
            </div>
          </header>
          {children}
      </main>
    </div>
  );
}