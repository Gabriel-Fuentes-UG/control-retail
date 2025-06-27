//src/app/management/users/new/supervisor/page.tsx

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import SupervisorForm from "./SupervisorForm";
import { getUnsupervisedStoresAction, createUserAction } from "./../../actions";
import { getSyncedStores } from "@/lib/data/stores";

export default async function NewSupervisorPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/');

  // Breadcrumbs (igual que antes)
  const breadcrumbItems = [
    { label: 'Inicio', href: '/redirect-hub' },
    { label: 'Gestionar Personal', href: '/management/users' },
    { label: 'Crear Supervisor' },
  ];

  // 1) Tiendas sin Supervisor
  const stores = await getSyncedStores();
  // 2) ID del rol Supervisor
  const supervisorRole = await prisma.role.findUnique({ where: { name: 'SUPERVISOR' } });
  if (!supervisorRole) throw new Error('Rol Supervisor no encontrado.');

  return (
    <div className="dashboard-section">
      <Breadcrumbs items={breadcrumbItems} />
      <h2 className="my-4">Nuevo Supervisor</h2>
      <SupervisorForm
        stores={stores}
        supervisorRoleId={supervisorRole.id}
        formAction={createUserAction}
      />
    </div>
  );
}