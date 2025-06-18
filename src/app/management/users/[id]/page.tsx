// src/app/admin/users/edit/[id]/page.tsx

import { getSyncedStores } from "@/lib/data/stores";
import { prisma } from "@/lib/prisma";
import UserForm from "@/app/management/users/new/UserForm";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import { notFound } from "next/navigation";
import { updateUserAction } from "../actions";

// La firma del componente indica que `params` es una Promesa
export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  
  // ==================================================================
  // ESTA ES LA LÍNEA CLAVE DE LA SOLUCIÓN OFICIAL Y DEFINITIVA
  // "Esperamos" (await) a que los parámetros se resuelvan antes de usarlos.
  const { id } = await params;
  // ==================================================================

  // El resto del código ahora puede usar 'id' de forma segura.
  const [user, stores, roles] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
        supervisedStores: true,
      },
    }),
    getSyncedStores(),
    prisma.role.findMany({ where: { name: { not: 'ADMINISTRADOR' } } })
  ]);
  
  if (!user) {
    notFound();
  }
  
  const breadcrumbItems = [
    { label: "Inicio Admin", href: "/admin/home" },
    { label: "Usuarios", href: "/admin/users" },
    { label: `Editar ${user.name}` },
  ];

  return (
    <div className="dashboard-section">
      <Breadcrumbs items={breadcrumbItems} />
      <h2 className="my-4">Editar Usuario: {user.name}</h2>
      <UserForm 
        stores={stores} 
        roles={roles} 
        formAction={updateUserAction} 
        user={user}
      />
    </div>
  );
}