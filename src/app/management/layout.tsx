// src/app/management/layout.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import AppShell from "@/components/layout/AppShell";

export default async function ManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const allowedRoles = ['ADMINISTRADOR', 'SUPERVISOR', 'GERENTE'];

  if (!session || !session.user?.role || !allowedRoles.includes(session.user.role)) {
    redirect('/');
  }

  return <AppShell>{children}</AppShell>;
}