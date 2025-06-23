// src/app/management/users/new/page.tsx
import { getSyncedStores, StoreType } from "@/lib/data/stores";
import { prisma } from "@/lib/prisma";
import UserForm from "./UserForm";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import { createUserAction } from "../actions";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";


export default async function NewUserPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/");

  // 1) Cargamos al usuario completo desde BD
  const userRecord = await prisma.user.findUnique({
    where: { id: session.user.id! },
    include: {
      role: true,
      store: true,
      supervisedStores: { include: { store: true } },
    },
  });
  if (!userRecord) redirect("/");

  let availableStores: StoreType[] = [];
  let availableRoles: Role[] = [];

  const roleName = userRecord.role.name;

  // 2) Según rol, llenamos tiendas y roles posibles
  switch (roleName) {
    case "ADMINISTRADOR":
      availableStores = await getSyncedStores();
      availableRoles = await prisma.role.findMany({
        where: { name: { not: "ADMINISTRADOR" } },
        orderBy: { name: "asc" },
      });
      break;

    case "SUPERVISOR":
      const supervised = await prisma.supervisorStores.findMany({
        where: { userId: userRecord.id },
        include: { store: true },
      });
      availableStores = supervised.map((s) => ({
        id: s.store.id,
        name: s.store.name,
        isActive: s.store.isActive,
      }));
      availableRoles = await prisma.role.findMany({
        where: { name: { in: ["GERENTE", "ENCARGADO", "VENDEDOR"] } },
        orderBy: { name: "asc" },
      });
      break;

    case "GERENTE":
      if (userRecord.store) {
        availableStores = [
          {
            id: userRecord.store.id,
            name: userRecord.store.name,
            isActive: userRecord.store.isActive,
          },
        ];
      }
      availableRoles = await prisma.role.findMany({
        where: { name: { in: ["ENCARGADO", "VENDEDOR"] } },
        orderBy: { name: "asc" },
      });
      break;
  }

  const breadcrumbItems = [
    { label: "Inicio", href: "/redirect-hub" },
    { label: "Gestionar Personal", href: "/management/users" },
    { label: "Crear Nuevo" },
  ];

  return (
    <div className="dashboard-section">
      <Breadcrumbs items={breadcrumbItems} />
      <h2 className="my-4">Nuevo Usuario</h2>
      <UserForm
        stores={availableStores}
        roles={availableRoles}
        formAction={createUserAction}
      />
    </div>
  );
}
