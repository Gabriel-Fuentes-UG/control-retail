// src/app/supervisor/layout.tsx

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/auth/LogoutButton";
import SideNav from "@/components/layout/SideNav";
import styles from "@/app/admin/layout.module.css"; // Reutilizamos los mismos estilos de layout

export default async function SupervisorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // Lógica de protección específica para el Supervisor
  if (!session || session.user?.role !== 'SUPERVISOR') {
    redirect('/');
  }

  return (
    // Aplicamos la clase de tema del supervisor para el color naranja
    <div className={`d-flex role-theme-supervisor`}>
      <div className={styles.sidebar} style={{ minHeight: '100vh', width: '280px' }}>
        <div>
          <div className={styles.sidebarHeader}>
            <h2>SIGIL</h2>
          </div>
          <SideNav />
        </div>
      </div>

      <main className={styles.mainContent + " flex-grow-1"}>
          <header className={styles.pageHeader}>
            <span>Bienvenido, {session.user?.name}</span>
            <LogoutButton />
          </header>
          {children}
      </main>
    </div>
  );
}