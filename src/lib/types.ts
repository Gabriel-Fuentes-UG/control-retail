// src/lib/types.ts
import type { User, Role, Store, SupervisorStores as SupervisorStoresPrisma } from "@prisma/client";

// Nuestro tipo personalizado que incluye todas las relaciones que necesitamos en la UI
export type UserWithRelations = User & {
    role: Role;
    store: Store | null;
    supervisedStores: (SupervisorStoresPrisma & {
        store: Store;
    })[];
};

// Tipo para las tiendas obtenidas de la API
export type StoreType = {
  id: string;
  name: string;
  isActive: boolean;
};