// src/app/supervisor/layout.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import AppShell from "@/components/layout/AppShell";

export default async function SupervisorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session || session.user?.role !== 'SUPERVISOR') {
    redirect('/');
  }

  return <AppShell>{children}</AppShell>;
}