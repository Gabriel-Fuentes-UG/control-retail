// src/app/redirect-hub/page.tsx

"use client";

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import LoadingIndicator from '@/components/common/LoadingIndicator'; // Importar

export default function RedirectHub() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // CAMBIO IMPORTANTE: La lógica ahora es mucho más simple
    if (status === 'authenticated' && session?.user?.homeRoute) {
      router.replace(session.user.homeRoute);
    } else if (status === 'unauthenticated') {
      router.replace('/');
    }
  }, [session, status, router]);

    return <LoadingIndicator />;
}