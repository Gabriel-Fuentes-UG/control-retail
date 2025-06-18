// src/app/supervisor/layout.tsx
"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/auth/LogoutButton";
import SideNav from "@/components/layout/SideNav";
import styles from "@/app/admin/layout.module.css"; // Reutilizamos los mismos estilos
import { useLayout } from "@/components/providers/LayoutProvider";
import SidebarToggleButton from "@/components/layout/SidebarToggleButton";
import LoadingIndicator from "@/components/common/LoadingIndicator";

export default function SupervisorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const { isSidebarCollapsed } = useLayout();

  if (status === 'loading') {
    return <LoadingIndicator />;
  }
  
  if (!session || session.user?.role !== 'SUPERVISOR') {
    redirect('/');
  }

  return (
    <div className={`d-flex role-theme-supervisor`} style={{ minHeight: '100vh' }}>
      <div 
        className={`${styles.sidebar} ${isSidebarCollapsed ? styles.collapsed : ''}`}
      >
        <div>
          <div className={styles.sidebarHeader}>
            <h2>{isSidebarCollapsed ? 'S' : 'SIGIL'}</h2>
          </div>
          <SideNav isCollapsed={isSidebarCollapsed} />
        </div>
      </div>

      <main className={styles.mainContent + " flex-grow-1"}>
          <header className={styles.pageHeader}>
            <SidebarToggleButton />
            <span className="me-auto">Bienvenido, {session.user?.name}</span>
            <LogoutButton />
          </header>
          {children}
      </main>
    </div>
  );
}