// src/app/admin/users/new/page.tsx
import { getSyncedStores } from "@/lib/data/stores";
import { prisma } from "@/lib/prisma";
import UserForm from "./UserForm";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import { createUserAction } from "../actions";

export default async function NewUserPage() {
  const [stores, roles] = await Promise.all([
    getSyncedStores(),
    prisma.role.findMany({ where: { name: { not: 'ADMINISTRADOR' } } })
  ]);
  
  const breadcrumbItems = [
    { label: "Inicio Admin", href: "/admin/home" },
    { label: "Usuarios", href: "/admin/users" },
    { label: "Crear Nuevo" },
  ];

  return (
    <div className="dashboard-section">
      <Breadcrumbs items={breadcrumbItems} />
      <h2 className="my-4">Crear Nuevo Usuario</h2>
      <UserForm 
        stores={stores} 
        roles={roles} 
        formAction={createUserAction} 
      />
    </div>
  );
}