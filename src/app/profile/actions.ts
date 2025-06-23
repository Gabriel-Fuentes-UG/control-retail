// src/app/profile/actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import * as bcrypt from 'bcryptjs';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function updateProfileAction(prevState: any, formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { message: "No autorizado." };
  }

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // Verificación básica
  if (!name || !email) {
    return { message: "El nombre y el email son requeridos." };
  }

  try {
    // El usuario solo puede actualizar su propio perfil, usando el ID de su sesión
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name,
        email,
        // Solo actualizamos la contraseña si el usuario escribió una nueva
        ...(password && { password: await bcrypt.hash(password, 10) }),
      },
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { message: 'Error: El correo electrónico ya está en uso por otro usuario.' };
    }
    return { message: 'Error al actualizar el perfil.' };
  }

  // Revalidamos la ruta del perfil para que se muestren los datos actualizados
  revalidatePath("/profile");
  return { success: true, message: "Perfil actualizado exitosamente." };
}