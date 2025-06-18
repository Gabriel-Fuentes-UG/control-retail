// src/app/admin/users/actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as bcrypt from 'bcryptjs';

// --- Acción para ACTUALIZAR un usuario ---
export async function updateUserAction(prevState: any, formData: FormData) {
  const id = formData.get("id") as string;
  if (!id) return { message: "Error: No se encontró el ID del usuario." };
  
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const roleId = formData.get("roleId") as string;
  const storeId = formData.get("storeId") as string | null;
  const isActive = formData.get("isActive") === "on";

  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role) return { message: "Rol inválido." };

  try {
    if (role.name === 'SUPERVISOR') {
        const storeIds = formData.getAll("storeIds") as string[];
        if (storeIds.length === 0) return { message: "Un Supervisor debe tener al menos una tienda." };
        
        await prisma.$transaction(async (tx) => {
          await tx.user.update({
            where: { id },
            data: { name, email, roleId, isActive, ...(password && { password: await bcrypt.hash(password, 10) }), storeId: null },
          });
          await tx.supervisorStores.deleteMany({ where: { userId: id } });
          await tx.supervisorStores.createMany({ data: storeIds.map(storeId => ({ userId: id, storeId: storeId })) });
        });
    } else {
        if (!storeId || storeId === 'none') return { message: "Debe asignar una tienda para este rol." };
        await prisma.user.update({
          where: { id },
          data: { name, email, roleId, isActive, ...(password && { password: await bcrypt.hash(password, 10) }), storeId: storeId },
        });
    }
  } catch (error: any) {
    if (error.code === 'P2002') return { message: 'Error: El correo electrónico ya está en uso por otro usuario.' };
    console.error(error);
    return { message: 'Error al actualizar el usuario.' };
  }
  revalidatePath("/admin/users");
  redirect("/admin/users");
}

// --- Acción para CREAR un usuario ---
export async function createUserAction(prevState: any, formData: FormData) {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const roleId = formData.get("roleId") as string;
    const storeId = formData.get("storeId") as string | null;
    const isActive = formData.get("isActive") === "on";

    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!name || !email || !password || !role) return { message: "Error: Faltan campos requeridos." };
    
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
        if (role.name === 'SUPERVISOR') {
            const storeIds = formData.getAll("storeIds") as string[];
            if (storeIds.length === 0) return { message: "Error: Un Supervisor debe tener al menos una tienda asignada." };
            await prisma.$transaction(async (tx) => {
              const newUser = await tx.user.create({ data: { name, email, password: hashedPassword, roleId, isActive } });
              await tx.supervisorStores.createMany({ data: storeIds.map(storeId => ({ userId: newUser.id, storeId: storeId })) });
            });
        } else {
            if (!storeId || storeId === 'none') return { message: "Error: Debes asignar una tienda para este rol." };
            await prisma.user.create({ data: { name, email, password: hashedPassword, roleId, storeId, isActive } });
        }
    } catch (error: any) {
        if (error.code === 'P2002') return { message: 'Error: El correo electrónico ya está en uso.' };
        console.error(error);
        return { message: 'Error al crear el usuario.' };
    }
    revalidatePath("/admin/users");
    redirect("/admin/users");
}

// --- Acción para ACTIVAR/DESACTIVAR un usuario ---
export async function toggleUserStatusAction(prevState: any, formData: FormData) {
  const id = formData.get("id") as string;
  const isActive = formData.get("isActive") === 'true';

  if (!id) {
    return { message: "Error: ID de usuario no proporcionado." };
  }

  try {
    await prisma.user.update({
      where: { id },
      data: { isActive: !isActive }, // Invertimos el estado actual
    });
    revalidatePath("/admin/users");
    return { message: "Estado del usuario actualizado." };
  } catch (error) {
    console.error(error);
    return { message: "Error al actualizar el estado del usuario." };
  }
}

// --- Acción para ELIMINAR un usuario ---
export async function deleteUserAction(prevState: any, formData: FormData) {
  const id = formData.get("id") as string;
  if (!id) {
    return { message: "Error: ID de usuario no proporcionado." };
  }

  try {
    // Usamos una transacción para asegurarnos de borrar todo lo relacionado
    await prisma.$transaction(async (tx) => {
      // Primero, borramos las asignaciones de tiendas si es un supervisor
      await tx.supervisorStores.deleteMany({
        where: { userId: id },
      });
      // Luego, borramos al usuario
      await tx.user.delete({
        where: { id },
      });
    });
    revalidatePath("/admin/users");
    return { message: "Usuario eliminado exitosamente." };
  } catch (error) {
    console.error(error);
    return { message: "Error al eliminar el usuario." };
  }
}