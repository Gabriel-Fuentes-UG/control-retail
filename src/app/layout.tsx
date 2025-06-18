// src/app/layout.tsx

import type { Metadata } from "next";
// 1. Importar la fuente correcta
import { Poppins } from "next/font/google"; 
// 2. IMPORTACIÓN CRÍTICA: Asegúrate de que esta línea exista
import './globals.css'; 
import SessionProvider from "@/components/providers/SessionProvider";
import 'bootstrap/dist/css/bootstrap.min.css';
import { LayoutProvider } from '@/components/providers/LayoutProvider'; // <-- Importar


const poppins = Poppins({ 
    subsets: ["latin"],
    weight: ['300', '400', '600', '700']
});

export const metadata: Metadata = {
  title: "Control Retail",
  description: "Sistema Integral de Gestión de Inventario y Logística",
};

export default function RootLayout({ children }: { children: React.ReactNode; }) {
  return (
    <html lang="es">
      <body className={poppins.className}> 
        <SessionProvider>
          {/* 👇 Envolvemos con el LayoutProvider */}
          <LayoutProvider>
            {children}
          </LayoutProvider>
        </SessionProvider>
      </body>
    </html>
  );
}