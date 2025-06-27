import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import StaffForm from "../../forms/StaffForm";
import { createUserAction } from "./../../actions";
import { getSyncedStores } from "@/lib/data/stores";

export default async function NewStaffPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/');

  // 1) Registro del usuario actual
  const me = await prisma.user.findUnique({
    where: { id: session.user.id! },
    include: { role: true, store: true, supervisedStores: { include: { store: true } } }
  });
  if (!me) redirect('/');

  let availableStores = [] as { id: string; name: string }[];
  let availableRoles = [];

  switch (me.role.name) {
    case 'ADMINISTRADOR':
      availableStores = await getSyncedStores();
      break;
    case 'SUPERVISOR':
      availableStores = me.supervisedStores.map(s => ({ id: s.store.id, name: s.store.name }));
      break;
    case 'GERENTE':
      if (me.store) availableStores = [{ id: me.store.id, name: me.store.name }];
      break;
  }

  // 2) Roles estáticos (Staff siempre ve GERENTE, ENCARGADO, VENDEDOR)
  availableRoles = await prisma.role.findMany({
    where: { name: { in: ['GERENTE','ENCARGADO','VENDEDOR'] } },
    orderBy: { name: 'asc' }
  });

  const breadcrumbItems = [
    { label: 'Inicio', href: '/redirect-hub' },
    { label: 'Gestionar Personal', href: '/management/users' },
    { label: 'Crear Personal de Tienda' },
  ];

  return (
    <div className="dashboard-section">
      <Breadcrumbs items={breadcrumbItems} />
      <h2 className="my-4">Nuevo Usuario de Tienda</h2>
      <StaffForm
        stores={availableStores}
        roles={availableRoles}
        initialData={undefined}
        formAction={createUserAction}
      />
    </div>
  );
}