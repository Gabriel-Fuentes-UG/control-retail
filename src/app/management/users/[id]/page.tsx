// src/app/management/users/[id]/page.tsx
import { prisma } from "@/lib/prisma"
import UserForm from "../new/UserForm"        // reutilizamos el mismo form
import { updateUserAction } from "../actions" // tu Server Action de actualización
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"

export default async function EditUserPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/")

  // 1) Traemos el registro de usuario completo
  const userRecord = await prisma.user.findUnique({
    where: { id: params.id },
    include: { role: true, store: true },
  })
  if (!userRecord) redirect("/management/users")

  // 2) Roles y tiendas (según tu lógica de permisos)
  const allRoles  = await prisma.role.findMany({ orderBy: { name: "asc" } })
  const allStores = await prisma.store.findMany({ orderBy: { name: "asc" } })

  return (
    <div className="dashboard-section">
      <h2 className="my-4">Editar Usuario: {userRecord.name}</h2>
      <UserForm
        roles={allRoles}
        stores={allStores}
        // 3) Pasamos el usuario para editar
        user={{
          id:       userRecord.id,
          name:     userRecord.name,
          email:    userRecord.email,
          roleId:   userRecord.roleId,
          storeId:  userRecord.storeId || "",
          isActive: userRecord.isActive,
        }}
        formAction={updateUserAction}
      />
    </div>
  )
}
