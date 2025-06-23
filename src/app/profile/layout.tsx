// src/app/profile/layout.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import AppShell from "@/components/layout/AppShell";

export default async function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // Cualquiera con sesión (que no sea admin) puede ver su perfil
  if (!session || session.user?.role === 'ADMINISTRADOR') {
    redirect('/');
  }

  return <AppShell>{children}</AppShell>;
}