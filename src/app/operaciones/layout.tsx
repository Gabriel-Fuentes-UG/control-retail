// src/app/operaciones/layout.tsx
"use client";

import AppShell from "@/components/layout/AppShell";
import LoadingIndicator from "@/components/common/LoadingIndicator";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

export default function OperacionesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <LoadingIndicator />;
  }
  
  const userRole = session?.user?.role;
  // Definimos los roles que pueden acceder a los módulos de operaciones
  const allowedRoles = ['SUPERVISOR', 'GERENTE', 'ENCARGADO', 'VENDEDOR'];

  // Si el usuario no tiene uno de los roles permitidos, lo sacamos.
  if (!userRole || !allowedRoles.includes(userRole)) {
    redirect('/');
  }

  // Usamos el AppShell que ya contiene toda la UI (sidebar, header, etc.)
  return <AppShell>{children}</AppShell>;
}