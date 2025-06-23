// src/app/profile/page.tsx
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import UserForm from "@/app/management/users/new/UserForm";
import { updateProfileAction } from "./actions";
import { UserWithRelations } from "@/lib/types";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) redirect('/');

  // Obtenemos los datos completos del usuario actual para pre-llenar el formulario
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { role: true, store: true, supervisedStores: { include: { store: true } } }
  });

  if (!currentUser) redirect('/'); // Si por alguna razón no se encuentra, lo sacamos

  return (
    <div className="dashboard-section">
      <h2 className="my-4">Editar Mi Perfil</h2>
      <UserForm 
        formAction={updateProfileAction} 
        user={currentUser as UserWithRelations}
        isProfileMode={true} // <-- Le decimos al formulario que se comporte en modo perfil
      />
    </div>
  );
}