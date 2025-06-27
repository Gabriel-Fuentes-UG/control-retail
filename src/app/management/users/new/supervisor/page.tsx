// src/app/management/users/new/supervisor/page.tsx

// --- CORRECCIÓN: Se ajustan las rutas para que sean relativas y evitar errores de resolución ---
import Breadcrumbs from "../../../../../components/layout/Breadcrumbs";
import { 
    createUserAction, 
    getUnsupervisedStoresAction 
} from "../../actions";
import SupervisorForm from "./SupervisorForm";
import { prisma } from "../../../../../lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export default async function NewSupervisorPage() {
  const session = await getServerSession(authOptions);
  // Solo los administradores pueden estar aquí
  if (session?.user?.role !== "ADMINISTRADOR") {
    redirect("/");
  }
  
  // 1. Obtenemos todos los datos necesarios en el servidor
  const unsupervisedStores = await getUnsupervisedStoresAction();
  const supervisorRole = await prisma.role.findUnique({
    where: { name: "SUPERVISOR" },
  });

  if (!supervisorRole) {
    return <div>Error: El rol 'SUPERVISOR' no se encuentra en la base de datos. Por favor, ejecuta el seed.</div>;
  }

  const breadcrumbItems = [
    { label: "Inicio", href: "/redirect-hub" },
    { label: "Gestionar Personal", href: "/management/users" },
    { label: "Seleccionar Tipo", href: "/management/users/select-role" },
    { label: "Crear Supervisor" },
  ];

  return (
    <div className="dashboard-section">
      <Breadcrumbs items={breadcrumbItems} />
      <h2 className="my-4">Nuevo Supervisor</h2>
      
      {/* 2. Pasamos los datos obtenidos al componente cliente (el formulario) */}
      <SupervisorForm
        stores={unsupervisedStores}
        supervisorRoleId={supervisorRole.id}
        formAction={createUserAction}
      />
    </div>
  );
}
