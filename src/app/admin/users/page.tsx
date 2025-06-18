// src/app/admin/users/page.tsx

import { prisma } from "@/lib/prisma";
import { Button } from "react-bootstrap";
import Link from "next/link";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import DataTable from "@/components/common/DataTable";
import { columns } from "./columns";

async function getUsers() {
    const users = await prisma.user.findMany({
        include: {
          role: true,
          store: true, 
          supervisedStores: {
            include: {
              store: true,
            }
          }
        },
        orderBy: { name: 'asc' }
      });
      return users;
}

export default async function UsersPage() {
  const users = await getUsers();
  const breadcrumbItems = [{ label: "Inicio Admin", href: "/admin/home" }, { label: "Usuarios" }];

  return (
    <div className="dashboard-section">
      <Breadcrumbs items={breadcrumbItems} />
      
      {/* --- ENCABEZADO DE LA PÁGINA --- */}
      <div className="d-flex justify-content-between align-items-center my-4">
        <h2>Gestión de Usuarios</h2>
        <Link href="/admin/users/new" passHref legacyBehavior>
          <Button as="a" variant="primary">
            Crear Nuevo Usuario
          </Button>
        </Link>
      </div>
      
      {/* --- INICIO DE LA CORRECCIÓN --- */}
      {/* La tabla antigua se elimina y se reemplaza por nuestro nuevo componente DataTable */}
      <DataTable columns={columns} data={users} />
      {/* --- FIN DE LA CORRECCIÓN --- */}

    </div>
  );
}