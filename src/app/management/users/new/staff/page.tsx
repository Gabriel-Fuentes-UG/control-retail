// src/app/management/users/new/staff/page.tsx
import { prisma } from "@/lib/prisma";
import UserForm from "../UserForm";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import { createUserAction } from "../../actions";
import { getEditPageData } from "../../actions"; // Reutilizamos esta acción para obtener tiendas y roles disponibles.
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export default async function NewStaffPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/");

  // Usamos getEditPageData (aunque no estemos editando) para obtener
  // las listas de tiendas y roles que el usuario actual puede gestionar.
  // Pasamos el ID del propio usuario para obtener su contexto.
  const { availableStores, availableRoles } = await getEditPageData(session.user.id);
  
  // Excluimos el rol de Supervisor de la lista para este formulario.
  const staffRoles = availableRoles.filter(role => role.name !== 'SUPERVISOR');


  const breadcrumbItems = [
    { label: "Inicio", href: "/redirect-hub" },
    { label: "Gestionar Personal", href: "/management/users" },
    { label: "Seleccionar Tipo", href: "/management/users/select-role" },
    { label: "Crear Personal de Tienda" },
  ];

  return (
    <div className="dashboard-section">
      <Breadcrumbs items={breadcrumbItems} />
      <h2 className="my-4">Nuevo Personal de Tienda</h2>
      <UserForm
        stores={availableStores}
        roles={staffRoles}
        formAction={createUserAction}
        formType="staff"
      />
    </div>
  );
}