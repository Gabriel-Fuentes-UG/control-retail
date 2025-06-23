
"use server";
console.log("--- EJECUTANDO actions.ts DESDE /management/users/ ---");

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as bcrypt from 'bcryptjs';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { UserWithRelations } from "@/lib/types";


// --- Función de validación de seguridad ---
async function canManageTarget(
  actorId: string, 
  targetRoleId: string, 
  targetStoreIds: string[]
): Promise<{ canProceed: boolean, message: string }> {
  
  const actor = await prisma.user.findUnique({ 
    where: { id: actorId }, 
    include: { 
      role: true,
      supervisedStores: { select: { storeId: true } }
    }
  });

  if (!actor || !actor.role) return { canProceed: false, message: "No se encontró el usuario que realiza la acción." };

  const targetRole = await prisma.role.findUnique({ where: { id: targetRoleId } });
  if (!targetRole) return { canProceed: false, message: "El rol seleccionado no es válido." };

  switch (actor.role.name) {
    case 'ADMINISTRADOR':
      return targetRole.name !== 'ADMINISTRADOR' 
        ? { canProceed: true, message: "" }
        : { canProceed: false, message: "Un Administrador no puede gestionar a otro." };

    case 'SUPERVISOR':
      if (!['GERENTE', 'ENCARGADO', 'VENDEDOR'].includes(targetRole.name)) {
        return { canProceed: false, message: "No tienes permiso para gestionar usuarios con este rol." };
      }
      const supervisedStoreIds = actor.supervisedStores.map(s => s.storeId);
      const isTargetStoreValid = targetStoreIds.every(id => supervisedStoreIds.includes(id));
      return isTargetStoreValid ? { canProceed: true, message: "" } : { canProceed: false, message: "Solo puedes asignar usuarios a las tiendas que supervisas." };

    case 'GERENTE':
      if (!['ENCARGADO', 'VENDEDOR'].includes(targetRole.name)) {
        return { canProceed: false, message: "No tienes permiso para gestionar usuarios con este rol." };
      }
      if (!actor.storeId) return { canProceed: false, message: "No tienes una tienda asignada para gestionar personal." };
      const isStoreValid = targetStoreIds.length === 1 && targetStoreIds[0] === actor.storeId;
      return isStoreValid ? { canProceed: true, message: "" } : { canProceed: false, message: "Solo puedes asignar usuarios a tu propia tienda." };
        
    default:
      return { canProceed: false, message: "No tienes permisos para gestionar usuarios." };
  }
}

// --- Acción para CREAR un usuario (con seguridad) ---
export async function createUserAction(formData: FormData) {
  "use server";

  const fullName = formData.get("fullName");
  const email    = formData.get("email");
  const password = formData.get("password");
  const roleId   = formData.get("roleId");
  const storeId  = formData.get("storeId");
  const isActive = formData.get("isActive") === "on";

  if (
    typeof fullName !== "string" ||
    typeof email    !== "string" ||
    typeof password !== "string" ||
    typeof roleId   !== "string" ||
    typeof storeId  !== "string"
  ) {
    throw new Error("Faltan campos requeridos o tienen un tipo inválido.");
  }

 // primero hasheamos la contraseña
 const hashedPassword = await bcrypt.hash(password, 10);

 await prisma.user.create({
   data: {
     name:     fullName,
     email,
     password: hashedPassword,    // <-- guardamos el hash ✅
     role:  { connect: { id: roleId } },
     store: { connect: { id: storeId } },
     isActive,
   },
 });

  revalidatePath("/management/users");
  redirect("/management/users");
}

// --- Acción para ACTUALIZAR un usuario (con seguridad) ---
export async function updateUserAction(formData: FormData) {
  "use server"
  const id       = formData.get("id")      // ojo: en tu formulario debes incluir un hidden name="id"
  const fullName = formData.get("fullName")
  const email    = formData.get("email")
  const password = formData.get("password")
  const roleId   = formData.get("roleId")
  const storeId  = formData.get("storeId")
  const isActive = formData.get("isActive") === "on"

  if (
    typeof id       !== "string" ||
    typeof fullName !== "string" ||
    typeof email    !== "string" ||
    typeof roleId   !== "string" ||
    typeof storeId  !== "string"
  ) {
    throw new Error("Faltan campos requeridos o inválidos")
  }

  await prisma.user.update({
    where: { id },
    data: {
      name:     fullName,
      email,
     ...(password
       ? { password: await bcrypt.hash(password, 10) }
       : {}),
      isActive,
      role:  { connect: { id: roleId } },
      store: { connect: { id: storeId } },
    },
  })

  revalidatePath("/management/users")
  redirect("/management/users")
}

export async function toggleUserStatusAction(prevState: any, formData: FormData) {
    const id = formData.get("id") as string;
    const session = await getServerSession(authOptions);
    if (!session) return { message: "No autorizado." };
    const targetUser = await prisma.user.findUnique({ where: { id }, include: { role: true } });
    if (!targetUser) return { message: "Usuario no encontrado." };
    const validation = await canManageTarget(session.user.id, targetUser.roleId, [targetUser.storeId || '']);
    if (!validation.canProceed) return { message: validation.message };
    try {
        const updatedUser = await prisma.user.update({ where: { id }, data: { isActive: !targetUser.isActive } });
        revalidatePath("/management/users");
        return { success: true, message: "Estado del usuario actualizado.", user: updatedUser };
    } catch (error) { return { message: "Error al actualizar el estado." }; }
}

export async function deleteUserAction(prevState: any, formData: FormData) {
    const id = formData.get("id") as string;
    const session = await getServerSession(authOptions);
    if (!session) return { message: "No autorizado." };
    const targetUser = await prisma.user.findUnique({ where: { id }, include: { role: true } });
    if (!targetUser) return { message: "Usuario no encontrado." };
    const validation = await canManageTarget(session.user.id, targetUser.roleId, [targetUser.storeId || '']);
    if (!validation.canProceed) return { message: validation.message };
    try {
        await prisma.$transaction(async (tx) => {
            await tx.supervisorStores.deleteMany({ where: { userId: id } });
            await tx.user.delete({ where: { id } });
        });
        revalidatePath("/management/users");
        return { success: true, message: "Usuario eliminado exitosamente.", user: { id } };
    } catch (error) { return { message: "Error al eliminar el usuario." }; }
}

export async function getManagedUsersForClient(): Promise<UserWithRelations[]> {
    const session = await getServerSession(authOptions);
    if (!session) return [];
    const currentUser = session.user;
    let managedUsers: UserWithRelations[] = [];
    switch (currentUser.role) {
        case 'ADMINISTRADOR':
            managedUsers = await prisma.user.findMany({ where: { id: { not: currentUser.id } }, include: { role: true, store: true, supervisedStores: { include: { store: true } } }, orderBy: { name: 'asc' } }) as UserWithRelations[];
            break;
        case 'SUPERVISOR':
            const supervisedStores = await prisma.supervisorStores.findMany({ where: { userId: currentUser.id }, select: { storeId: true } });
            const storeIds = supervisedStores.map(s => s.storeId);
            if (storeIds.length > 0) managedUsers = await prisma.user.findMany({ where: { storeId: { in: storeIds }, role: { name: { in: ['GERENTE', 'ENCARGADO', 'VENDEDOR'] } } }, include: { role: true, store: true, supervisedStores: { include: { store: true } } }, orderBy: { name: 'asc' } }) as UserWithRelations[];
            break;
        case 'GERENTE':
            if (!currentUser.storeId) return [];
            managedUsers = await prisma.user.findMany({ where: { storeId: currentUser.storeId, id: { not: currentUser.id }, role: { name: { in: ['ENCARGADO', 'VENDEDOR'] } } }, include: { role: true, store: true, supervisedStores: { include: { store: true } } }, orderBy: { name: 'asc' } }) as UserWithRelations[];
            break;
    }
    return managedUsers;
}

// Al final de src/app/management/users/actions.ts

import { Store, Role } from "@prisma/client";

// --- NUEVA ACCIÓN PARA CARGAR DATOS PARA LA PÁGINA DE EDICIÓN ---
export async function getEditPageData(userId: string) {
  "use server";
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("No autorizado");

  const currentUser = session.user;
  
  const userToEdit = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: true,
      supervisedStores: { include: { store: true } },
    },
  });

  if (!userToEdit) {
    throw new Error("Usuario no encontrado");
  }

  let availableStores: Store[] = [];
  let availableRoles: Role[] = [];

  switch (currentUser.role) {
    case 'ADMINISTRADOR':
      availableStores = await getSyncedStores(); // Asumiendo que tienes getSyncedStores en lib/data/stores.ts
      availableRoles = await prisma.role.findMany({ where: { name: { not: 'ADMINISTRADOR' } } });
      break;
    case 'SUPERVISOR':
      const supervisedStores = await prisma.supervisorStores.findMany({ where: { userId: currentUser.id }, include: { store: true }});
      availableStores = supervisedStores.map(s => s.store);
      availableRoles = await prisma.role.findMany({ where: { name: { in: ['GERENTE', 'ENCARGADO', 'VENDEDOR'] } } });
      break;
    case 'GERENTE':
      const managerUser = await prisma.user.findUnique({ where: { id: currentUser.id }, include: { store: true }});
      if (managerUser?.store) availableStores = [managerUser.store];
      availableRoles = await prisma.role.findMany({ where: { name: { in: ['ENCARGADO', 'VENDEDOR'] } } });
      break;
  }

  return {
    userToEdit: userToEdit as UserWithRelations,
    availableStores,
    availableRoles
  };
}