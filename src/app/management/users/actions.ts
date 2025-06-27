// src/app/management/users/actions.ts
"use server";
console.log("--- EJECUTANDO actions.ts DESDE /management/users/ ---");

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as bcrypt from 'bcryptjs';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { UserWithRelations } from "@/lib/types";
import { Store, Role } from "@prisma/client";



// --- Función de validación de seguridad ---
async function canManageTarget(
  actorId: string,
  targetRoleId: string,
  targetStoreIds: string[]
): Promise<{ canProceed: boolean; message: string }> {
  const actor = await prisma.user.findUnique({
    where: { id: actorId },
    include: {
      role: true,
      supervisedStores: { select: { storeId: true } }
    }
  });

  if (!actor || !actor.role) {
    return { canProceed: false, message: "No se encontró el usuario que realiza la acción." };
  }

  const targetRole = await prisma.role.findUnique({ where: { id: targetRoleId } });
  if (!targetRole) {
    return { canProceed: false, message: "El rol seleccionado no es válido." };
  }

  switch (actor.role.name) {
    case 'ADMINISTRADOR':
      return targetRole.name !== 'ADMINISTRADOR'
        ? { canProceed: true, message: "" }
        : { canProceed: false, message: "Un Administrador no puede gestionar a otro." };

    case 'SUPERVISOR': {
      if (!['GERENTE', 'ENCARGADO', 'VENDEDOR'].includes(targetRole.name)) {
        return { canProceed: false, message: "No tienes permiso para gestionar usuarios con este rol." };
      }
      const supervisedStoreIds = actor.supervisedStores.map(s => s.storeId);
      const valid = targetStoreIds.every(id => supervisedStoreIds.includes(id));
      return valid
        ? { canProceed: true, message: "" }
        : { canProceed: false, message: "Solo puedes asignar usuarios a las tiendas que supervisas." };
    }

    case 'GERENTE': {
      if (!['ENCARGADO', 'VENDEDOR'].includes(targetRole.name)) {
        return { canProceed: false, message: "No tienes permiso para gestionar usuarios con este rol." };
      }
      if (!actor.storeId) {
        return { canProceed: false, message: "No tienes una tienda asignada para gestionar personal." };
      }
      const validStore = targetStoreIds.length === 1 && targetStoreIds[0] === actor.storeId;
      return validStore
        ? { canProceed: true, message: "" }
        : { canProceed: false, message: "Solo puedes asignar usuarios a tu propia tienda." };
    }

    default:
      return { canProceed: false, message: "No tienes permisos para gestionar usuarios." };
  }
}

// --- Acción para CREAR un usuario ---
export async function createUserAction(
  prevState: any,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  "use server";

  // 1) Verificar sesión
  const session = await getServerSession(authOptions);
  if (!session) {
    return { success: false, error: "No autorizado." };
  }
  const actorId = session.user.id!;


  // 3) Extraer campos
  const fullName = formData.get("fullName");
  const email    = formData.get("email");
  const password = formData.get("password");
  const roleId   = formData.get("roleId");
  const rawStore = formData.get("storeId");
  const storeIds = rawStore && typeof rawStore === "string" ? [rawStore] : [];

  // 4) Validaciones iniciales
  if (!fullName || typeof fullName !== "string" || !fullName.trim()) {
    return { success: false, error: "El nombre completo es requerido." };
  }
  if (!email || typeof email !== "string" || !email.trim()) {
    return { success: false, error: "El correo electrónico es requerido." };
  }
  if (!password || typeof password !== "string" || !password.trim()) {
    return { success: false, error: "La contraseña es requerida." };
  }
  if (!roleId || typeof roleId !== "string") {
    return { success: false, error: "Debes seleccionar un rol para el usuario." };
  }

  // 5) Permisos jerárquicos
  const permission = await canManageTarget(actorId, roleId, storeIds);
  if (!permission.canProceed) {
    return { success: false, error: permission.message };
  }

  let newlyCreatedUserId: string | null = null;

  try {
    // 6) Validar existencia de rol
    const roleToCreate = await prisma.role.findUnique({ where: { id: roleId } });
    console.log("🎯 roleToCreate:", roleToCreate?.name);
    if (!roleToCreate) {
      console.log("❌ Rol no encontrado en BD");
      return { success: false, error: "El rol seleccionado no existe." };
    }

    // 7) Transacción con todas las validaciones y creación
    await prisma.$transaction(async (tx) => {

      if (roleToCreate.name === "GERENTE") {
        if (storeIds.length !== 1) {
          throw new Error("Un Gerente debe ser asignado a una única tienda.");
        }
        const existingManager = await tx.user.findFirst({
          where: { storeId: storeIds[0], role: { name: "GERENTE" } },
        });
        if (existingManager) {
          throw new Error("Ya existe un Gerente en esta tienda.");
        }
        const sup = await tx.supervisorStores.findFirst({
          where: { storeId: storeIds[0] },
        });
        if (!sup) {
          throw new Error(
            "No se puede crear el Gerente porque no hay Supervisor en la tienda."
          );
        }
      }

      if (["VENDEDOR", "ENCARGADO"].includes(roleToCreate.name)) {
        if (storeIds.length !== 1) {
          throw new Error(
            "Un Vendedor o Encargado debe ser asignado a una única tienda."
          );
        }
        const mgr = await tx.user.findFirst({
          where: { storeId: storeIds[0], role: { name: "GERENTE" } },
        });
        if (!mgr) {
          throw new Error(
            "No se puede crear el usuario porque no hay Gerente en la tienda."
          );
        }
      }

      // 8) Crear usuario
      const hashed = await bcrypt.hash(password as string, 10);
      const created = await tx.user.create({
        data: {
          name: fullName as string,
          email: email as string,
          password: hashed,
          role: { connect: { id: roleId as string } },
          ...(roleToCreate.name !== "SUPERVISOR" && storeIds.length === 1
            ? { store: { connect: { id: storeIds[0] } } }
            : {}),
          isActive: formData.get("isActive") === "on",
        },
      });
      newlyCreatedUserId = created.id;

      // 9) Si es Supervisor, asignar tiendas
      if (roleToCreate.name === "SUPERVISOR") {
        await tx.supervisorStores.createMany({
          data: storeIds.map((id) => ({ userId: created.id, storeId: id })),
        });
      }
    });

    // 10) Confirmar fuera de tx
    const verify = await prisma.user.findUnique({
      where: { id: newlyCreatedUserId! },
      include: { store: true, role: true },
    });
  } catch (e: any) {
    if (e.code === "P2002" && e.meta?.target?.includes("email")) {
      return { success: false, error: "El correo electrónico ya está en uso." };
    }
    return { success: false, error: e.message || "Error inesperado al crear el usuario." };
  }

  // 11) Redirigir
  revalidatePath("/management/users");
  redirect("/management/users");
  return { success: true };
}



// --- Acción para ACTUALIZAR un usuario ---
export async function updateUserAction(prevState: any, formData: FormData): Promise<{ success: boolean; error?: string }> {
  "use server";

  const session = await getServerSession(authOptions);
  if (!session) {
    return { success: false, error: "No autorizado." };
  }
  const actorId = session.user.id!;

  const id = formData.get("id");
  const fullName = formData.get("fullName");
  const email = formData.get("email");
  const password = formData.get("password");
  const isActive = formData.get("isActive") === "on";

  if (typeof id !== "string") {
    return { success: false, error: "ID de usuario no válido." };
  }

  // Verificar permiso de actor
  const target = await prisma.user.findUnique({ where: { id }, include: { role: true, store: true } });
  if (!target) {
    return { success: false, error: "Usuario no encontrado." };
  }
  const perm = await canManageTarget(actorId, target.roleId, target.storeId ? [target.storeId] : []);
  if (!perm.canProceed) {
    return { success: false, error: perm.message };
  }

  // Validaciones de campos
  if (!fullName || typeof fullName !== "string" || !fullName.trim()) {
    return { success: false, error: "El nombre completo es requerido." };
  }
  if (!email || typeof email !== "string" || !email.trim()) {
    return { success: false, error: "El correo electrónico es requerido." };
  }

  try {
    await prisma.user.update({
      where: { id },
      data: {
        name: fullName,
        email,
        ...(typeof password === "string" && password.trim() ? { password: await bcrypt.hash(password, 10) } : {}),
        isActive,
      }
    });
  } catch (e: any) {
    if (e.code === 'P2002' && e.meta?.target?.includes('email')) {
      return { success: false, error: 'El correo electrónico ya está en uso.' };
    }
    console.error("Error en updateUserAction:", e);
    return { success: false, error: 'Error inesperado al actualizar el usuario.' };
  }

  revalidatePath("/management/users");
  revalidatePath(`/management/users/edit/${id}`);
  redirect("/management/users");
  return { success: true };
}

// --- ACCIÓN DE ROLES DINÁMICOS (LÓGICA MÁS ROBUSTA) ---
export async function getAvailableRolesForStoreAction(storeId: string): Promise<Role[]> {
    "use server";

    if (!storeId) {
        return [];
    }

    // --- NUEVA LÓGICA JERÁRQUICA MÁS ROBUSTA ---

    // 1. Verificamos si la tienda ya tiene un supervisor.
    // Primero, la forma correcta: a través de la tabla de asignaciones.
    const supervisorAssignment = await prisma.supervisorStores.findFirst({
        where: { storeId: storeId }
    });
    
    // Si no se encuentra, comprobamos la forma antigua/incorrecta (un usuario Supervisor con storeId directo)
    const legacySupervisor = await prisma.user.findFirst({
        where: { storeId: storeId, role: { name: 'SUPERVISOR' } }
    });

    const hasSupervisor = supervisorAssignment || legacySupervisor;

    if (!hasSupervisor) {
        // --- CASO 1: TIENDA SIN SUPERVISOR ---
        // El siguiente paso lógico es asignar uno. Devolvemos SOLO el rol de Supervisor.
        const supervisorRole = await prisma.role.findUnique({ where: { name: 'SUPERVISOR' } });
        return supervisorRole ? [supervisorRole] : [];
    }

    // 2. Si la tienda SÍ tiene supervisor, buscamos un GERENTE.
    const manager = await prisma.user.findFirst({
        where: { storeId: storeId, role: { name: 'GERENTE' } }
    });

    if (!manager) {
        // --- CASO 2: TIENDA CON SUPERVISOR PERO SIN GERENTE ---
        // El siguiente paso es crear un Gerente.
        const managerRole = await prisma.role.findUnique({ where: { name: 'GERENTE' } });
        return managerRole ? [managerRole] : [];
    }

    // --- CASO 3: TIENDA CON SUPERVISOR Y GERENTE ---
    // La jerarquía está completa. Se pueden crear los roles subordinados.
    const subordinateRoles = await prisma.role.findMany({
        where: { name: { in: ['ENCARGADO', 'VENDEDOR'] } },
        orderBy: { name: 'asc' }
    });
    return subordinateRoles;
}

// --- NUEVA ACCIÓN para obtener tiendas SIN supervisor (FUNCIÓN AÑADIDA) ---
export async function getUnsupervisedStoresAction(): Promise<Store[]> {
    "use server";
    
    const allStores = await prisma.store.findMany({
        orderBy: { name: 'asc' }
    });

    const supervisedStoreAssignments = await prisma.supervisorStores.findMany({
        select: { storeId: true }
    });
    const supervisedStoreIds = new Set(supervisedStoreAssignments.map(s => s.storeId));

    const unsupervisedStores = allStores.filter(store => !supervisedStoreIds.has(store.id));

    return unsupervisedStores;
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
      availableStores = await prisma.store.findMany(); 
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