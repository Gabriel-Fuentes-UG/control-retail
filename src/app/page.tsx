// src/app/page.tsx (Actualizado)

"use client";

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import LoadingIndicator from '@/components/common/LoadingIndicator'; // Importamos el nuevo componente

export default function HomePage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/redirect-hub'); 
    } else if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  // Usamos nuestro nuevo loader
  return <LoadingIndicator />;
}