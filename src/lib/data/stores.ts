// src/lib/data/stores.ts
import { prisma } from "@/lib/prisma";

const SYNC_TTL_HOURS = 2; // Tiempo de vida del caché en horas

type ApiStore = {
  "Código Tienda": string;
  "Nombre Tienda": string;
};

export type StoreType = {
  id: string;
  name: string;
  isActive: boolean;
};

// Exportar la función de sincronización para usar en el endpoint
export async function syncStoresWithApi() {
  try {
    const username = process.env.API_STORES_USER;
    const password = process.env.API_STORES_PASSWORD;

    if (!username || !password) {
      console.error("Las credenciales de la API de tiendas no están configuradas en el archivo .env");
      return;
    }
    const basicAuth = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');

    const response = await fetch(
      'https://www.vectordelta.com.mx:81/UnionGroup/API/Query/Tiendas/tiendas',
      { cache: 'no-store', headers: { 'Authorization': basicAuth } }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const apiStores: ApiStore[] = await response.json();
    if (!Array.isArray(apiStores)) {
      console.error("La respuesta de la API de tiendas no es un array válido", apiStores);
      await prisma.systemConfig.upsert({ where: { key: 'lastStoreSync' }, update: { value: new Date().toISOString() }, create: { key: 'lastStoreSync', value: new Date().toISOString() } });
      return;
    }

    const formatted = apiStores.map(s => ({ id: s['Código Tienda'], name: s['Nombre Tienda'] }));

    // Upsert local
    await prisma.$transaction(
      formatted.map(store =>
        prisma.store.upsert({
          where: { id: store.id },
          update: { name: store.name, isActive: true },
          create: { id: store.id, name: store.name, isActive: true }
        })
      )
    );
    // Desactivar ausentes
    const ids = formatted.map(s => s.id);
    await prisma.store.updateMany({ where: { id: { notIn: ids } }, data: { isActive: false } });
    // Actualizar timestamp
    await prisma.systemConfig.upsert({ where: { key: 'lastStoreSync' }, update: { value: new Date().toISOString() }, create: { key: 'lastStoreSync', value: new Date().toISOString() } });

    console.log("Sincronización de tiendas completada.");
  } catch (e) {
    console.error("Falló la sincronización de tiendas:", e);
  }
}

// Función principal con TTL
export const getSyncedStores = async (): Promise<StoreType[]> => {
  const last = await prisma.systemConfig.findUnique({ where: { key: 'lastStoreSync' } });
  const lastDate = last ? new Date(last.value) : new Date(0);
  const hours = (Date.now() - lastDate.getTime()) / 36e5;
  if (hours > SYNC_TTL_HOURS) {
    console.log(`Cache expirado (${hours.toFixed(2)}h), sincronizando...`);
    await syncStoresWithApi();
  }
  return prisma.store.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
};
