// src/app/profile/page.tsx
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import UserForm from "@/app/management/users/new/UserForm"; // Asegúrate de que esta ruta sea correcta
import { updateProfileAction } from "./actions";
import { UserWithRelations } from "@/lib/types";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) redirect('/');

  // Obtenemos los datos completos del usuario actual
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { role: true, store: true }
  });

  if (!currentUser || !currentUser.role) {
    // Si por alguna razón no se encuentra o no tiene rol, lo sacamos
    redirect('/');
  }

  // --- CORRECCIÓN CLAVE ---
  // Creamos arrays con un solo elemento para 'roles' y 'stores'
  // que el componente UserForm necesita para funcionar.
  const availableRoles = [currentUser.role];
  const availableStores = currentUser.store ? [currentUser.store] : [];

  return (
    <div className="dashboard-section">
      <h2 className="my-4">Editar Mi Perfil</h2>
      <UserForm 
        formAction={updateProfileAction} 
        user={currentUser as UserWithRelations}
        // Pasamos los arrays requeridos
        roles={availableRoles}
        stores={availableStores}
        // Indicamos que es modo de edición de perfil
        formType="edit" 
      />
    </div>
  );
}
