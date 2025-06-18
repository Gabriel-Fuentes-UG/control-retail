// src/app/colaborador/layout.tsx

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/auth/LogoutButton";
import SideNav from "@/components/layout/SideNav"; // Reutilizaremos el mismo SideNav
import styles from "@/app/admin/layout.module.css"; // Reutilizamos los mismos estilos del layout de admin

export default async function ColaboradorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  const userRole = session?.user?.role;
  const allowedRoles = ['ENCARGADO', 'VENDEDOR'];

  if (!userRole || !allowedRoles.includes(userRole)) {
    redirect('/');
  }

  return (
    // Aplicamos la clase de tema correspondiente
    <div className={`d-flex role-theme-colaborador`}>
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