// src/app/layout.tsx

import type { Metadata } from "next";
import { Poppins } from "next/font/google"; 
import './globals.css'; 
import SessionProvider from "@/components/providers/SessionProvider";
import { LayoutProvider } from "@/components/providers/LayoutProvider";
import 'bootstrap/dist/css/bootstrap.min.css';

const poppins = Poppins({ 
    subsets: ["latin"],
    weight: ['300', '400', '600', '700']
});

export const metadata: Metadata = {
  title: "Control Retail",
  description: "Sistema Integral de Gestión de Inventario y Logística",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={poppins.className}> 
        <SessionProvider>
          <LayoutProvider>
            {children}
          </LayoutProvider>
        </SessionProvider>
      </body>
    </html>
  );
}