// src/components/providers/SessionProvider.tsx
"use client";

import { SessionProvider as Provider } from "next-auth/react";

type Props = {
  children: React.ReactNode;
};

// 👇 Asegúrate de que aquí dice "export default"
export default function SessionProvider({ children }: Props) {
  return <Provider>{children}</Provider>;
}