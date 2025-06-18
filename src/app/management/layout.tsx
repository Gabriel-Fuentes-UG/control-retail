// src/app/management/layout.tsx
"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/auth/LogoutButton";
import SideNav from "@/components/layout/SideNav";
import styles from "@/app/admin/layout.module.css"; // Reutilizamos los estilos del layout de admin, ¡está bien!
import { useLayout } from "@/components/providers/LayoutProvider";
import SidebarToggleButton from "@/components/layout/SidebarToggleButton";
import LoadingIndicator from "@/components/common/LoadingIndicator";

export default function ManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const { isSidebarCollapsed } = useLayout();

  // Mapa de roles a temas de CSS para aplicar el color correcto
  const roleThemeMap: { [key: string]: string } = {
    'ADMINISTRADOR': 'role-theme-admin',
    'SUPERVISOR': 'role-theme-supervisor',
    'GERENTE': 'role-theme-gerente',
  };

  // Mientras se valida la sesión, muestra el loader
  if (status === 'loading') {
    return <LoadingIndicator />;
  }
  
  const userRole = session?.user?.role;
  const allowedRoles = ['ADMINISTRADOR', 'SUPERVISOR', 'GERENTE'];

  // Si no hay sesión o el rol no está permitido en esta sección, se redirige al inicio
  if (!userRole || !allowedRoles.includes(userRole)) {
    redirect('/');
  }

  // Obtenemos la clase de tema dinámicamente según el rol
  const themeClass = roleThemeMap[userRole] || '';

  return (
    <div className={`d-flex ${themeClass}`} style={{ minHeight: '100vh' }}>
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
          {children} {/* Aquí se renderizará la página, ej: la tabla de usuarios */}
      </main>
    </div>
  );
}