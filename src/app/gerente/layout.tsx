// src/app/gerente/layout.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import AppShell from "@/components/layout/AppShell";

export default async function GerenteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session || session.user?.role !== 'GERENTE') {
    redirect('/');
  }

  return <AppShell>{children}</AppShell>;
}