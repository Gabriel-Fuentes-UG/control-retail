// src/lib/data/stores.ts

import { prisma } from "@/lib/prisma";

const SYNC_TTL_HOURS = 6; // Tiempo de vida del caché en horas

type ApiStore = {
  "Código Tienda": string;
  "Nombre Tienda": string;
};

export type StoreType = {
  id: string;
  name: string;
  isActive: boolean;
};


// --- Función principal que usarán las páginas ---
export const getSyncedStores = async (): Promise<StoreType[]> => {
  const lastSync = await prisma.systemConfig.findUnique({
    where: { key: 'lastStoreSync' },
  });

  const now = new Date();
  // Si nunca se ha sincronizado, usamos una fecha muy antigua para forzar la primera sincronización
  const lastSyncDate = lastSync ? new Date(lastSync.value) : new Date(0); 
  
  const hoursSinceLastSync = (now.getTime() - lastSyncDate.getTime()) / (1000 * 60 * 60);

  // Si el caché ha expirado, ejecutamos la sincronización completa
  if (hoursSinceLastSync > SYNC_TTL_HOURS) {
    console.log(`El caché de tiendas ha expirado (${hoursSinceLastSync.toFixed(2)} horas). Sincronizando...`);
    await syncStoresWithApi();
  } else {
    console.log(`El caché de tiendas está fresco (${hoursSinceLastSync.toFixed(2)} horas). Usando datos locales.`);
  }

  // Siempre devolvemos las tiendas activas de nuestra base de datos local
  return prisma.store.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });
};


// --- Función interna que realiza la sincronización ---
async function syncStoresWithApi() {
  try {
    const username = process.env.API_STORES_USER;
    const password = process.env.API_STORES_PASSWORD;

    if (!username || !password) {
      console.error("Las credenciales de la API de tiendas no están configuradas en el archivo .env");
      return;
    }
    
    const basicAuth = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');
    
    const response = await fetch('https://www.vectordelta.com.mx:81/UnionGroup/API/Query/Tiendas/tiendas', {
      cache: 'no-store',
      headers: {
        'Authorization': basicAuth,
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const apiStores: ApiStore[] | null = await response.json();

    // Validación de seguridad: si la API no devuelve un array (lista), no continuamos.
    if (!Array.isArray(apiStores)) {
      console.error("La respuesta de la API de tiendas no es un array válido. Se recibió:", apiStores);
      // Actualizamos el timestamp para no reintentar inmediatamente si la API falla constantemente.
      await prisma.systemConfig.upsert({
        where: { key: 'lastStoreSync' },
        update: { value: new Date().toISOString() },
        create: { key: 'lastStoreSync', value: new Date().toISOString() },
      });
      return; 
    }
    
    const formattedApiStores = apiStores.map(store => ({
      id: store["Código Tienda"],
      name: store["Nombre Tienda"],
    }));

    // Sincronizar: crear tiendas nuevas y actualizar las existentes en una sola transacción
    await prisma.$transaction(
      formattedApiStores.map(store => 
        prisma.store.upsert({
          where: { id: store.id },
          update: { name: store.name, isActive: true },
          create: { id: store.id, name: store.name, isActive: true },
        })
      )
    );
    
    // Desactivar tiendas que ya no están en la API
    const apiStoreIds = new Set(formattedApiStores.map(s => s.id));
    const localStores = await prisma.store.findMany({ where: { isActive: true } });
    
    const storesToDeactivate = localStores.filter(localStore => !apiStoreIds.has(localStore.id));

    if (storesToDeactivate.length > 0) {
      await prisma.store.updateMany({
        where: {
          id: { in: storesToDeactivate.map(s => s.id) },
        },
        data: { isActive: false },
      });
      console.log(`Desactivadas ${storesToDeactivate.length} tiendas.`);
    }

    // Actualizar la fecha de la última sincronización
    await prisma.systemConfig.upsert({
      where: { key: 'lastStoreSync' },
      update: { value: new Date().toISOString() },
      create: { key: 'lastStoreSync', value: new Date().toISOString() },
    });

    console.log("Sincronización de tiendas completada.");

  } catch (error) {
    console.error("Falló la sincronización completa de tiendas:", error);
  }
}