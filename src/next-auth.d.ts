// src/next-auth.d.ts
import { DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";

// Definimos el tipo para una tienda supervisada, solo necesitamos id y nombre.
type SupervisedStore = {
  id: string;
  name: string;
};

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    permissions: string[];
    homeRoute: string;
    storeId: string | null;
    storeName: string | null;
    supervisedStores?: SupervisedStore[]; // <-- AÑADIDO
  }
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      permissions: string[];
      homeRoute: string;
      storeId: string | null;
      storeName: string | null;
      supervisedStores?: SupervisedStore[]; // <-- AÑADIDO
    } & DefaultSession["user"];
  }
}

// Define un tipo simple para la tienda, que usas en varios lugares.
type StoreInfo = {
  id: string;
  name: string | null;
  // Añade otros campos de la tienda si los necesitas en la sesión.
};