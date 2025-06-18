// src/app/management/users/page.tsx

import { prisma } from "@/lib/prisma";
import { Button } from "react-bootstrap";
import Link from "next/link";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import DataTable from "@/components/common/DataTable";
import { columns } from "./columns";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { User } from "@prisma/client";

// Tipos extendidos para incluir relaciones
type UserWithRelations = User & {
  role: { name: string };
  store: { name: string } | null;
  supervisedStores: { store: { name: string } }[];
};

// --- Función de Servidor para obtener solo los usuarios gestionables ---
async function getManagedUsers(): Promise<UserWithRelations[]> {
  const session = await getServerSession(authOptions);
  if (!session) {
    // Esto es una salvaguarda, el middleware debería actuar primero
    return redirect('/');
  }

  const currentUser = session.user;
  let managedUsers: UserWithRelations[] = [];

  switch (currentUser.role) {
    case 'ADMINISTRADOR':
      // El Admin ve a todos los usuarios excepto a sí mismo
      managedUsers = await prisma.user.findMany({
        where: { id: { not: currentUser.id } },
        include: { role: true, store: true, supervisedStores: { include: { store: true } } },
        orderBy: { name: 'asc' }
      });
      break;

    case 'SUPERVISOR':
      // El Supervisor ve a los usuarios de sus tiendas asignadas y con rol inferior
      const supervisedStores = await prisma.supervisorStores.findMany({
        where: { userId: currentUser.id },
        select: { storeId: true }
      });
      const storeIds = supervisedStores.map(s => s.storeId);
      
      if (storeIds.length > 0) {
        managedUsers = await prisma.user.findMany({
          where: {
            storeId: { in: storeIds },
            role: { name: { in: ['GERENTE', 'ENCARGADO', 'VENDEDOR'] } }
          },
          include: { role: true, store: true, supervisedStores: { include: { store: true } } },
          orderBy: { name: 'asc' }
        });
      }
      break;

    case 'GERENTE':
      // El Gerente ve a los usuarios de su propia tienda y con rol inferior
      const managerWithStore = await prisma.user.findUnique({ where: { id: currentUser.id }});
      if (!managerWithStore?.storeId) return [];

      managedUsers = await prisma.user.findMany({
        where: {
          storeId: managerWithStore.storeId,
          id: { not: currentUser.id },
          role: { name: { in: ['ENCARGADO', 'VENDEDOR'] } }
        },
        include: { role: true, store: true, supervisedStores: { include: { store: true } } },
        orderBy: { name: 'asc' }
      });
      break;
  }
  
  return managedUsers;
}

export default async function UsersPage() {
  const users = await getManagedUsers();
  
  const breadcrumbItems = [
    { label: "Inicio", href: "/redirect-hub" }, 
    { label: "Gestionar Personal" }
  ];

  return (
    <div className="dashboard-section">
      <Breadcrumbs items={breadcrumbItems} />
      <div className="d-flex justify-content-between align-items-center my-4">
        <h2>Gestionar Personal</h2>
        <Link href="/management/users/new">
          <Button variant="primary">Crear Subordinado</Button>
        </Link>
      </div>
      <DataTable columns={columns} data={users} />
    </div>
  );
}