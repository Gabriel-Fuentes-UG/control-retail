// src/app/operaciones/receptions/actions.ts
"use server";
    
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { Store } from "@prisma/client";
import { revalidatePath } from "next/cache";

// Tipos para la respuesta de las APIs
export type IncomingTransfer = {
    FolioSAP: number;
    Fecha: string;
    NombreOrigen: string;
    Estatus: string;
};

export type TransferDetail = {
    Articulo: string;
    Descripcion: string;
    Cantidad: number;
    CodeBars: string;
};

// Acción para obtener la lista de traslados pendientes
export async function getIncomingTransfersAction(): Promise<IncomingTransfer[]> {
    const session = await getServerSession(authOptions);
    if (!session?.user) return [];

    const { user } = session;
    let storeIds: string[] = [];

    // Lógica para obtener las tiendas correctas
    if (user.role === 'SUPERVISOR') {
        const supervisedStores = await prisma.supervisorStores.findMany({
            where: { userId: user.id },
            select: { storeId: true }
        });
        storeIds = supervisedStores.map(s => s.storeId);
    } else if (user.storeId) {
        storeIds.push(user.storeId);
    }

    if (storeIds.length === 0) return [];

    // Hacemos una llamada a la API por cada tienda y unimos los resultados
    try {
        const username = process.env.API_STORES_USER;
        const password = process.env.API_STORES_PASSWORD;
        if (!username || !password) throw new Error("API credentials not configured");
        const basicAuth = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');
        
        const fetchPromises = storeIds.map(id => 
            fetch(`https://www.vectordelta.com.mx:81/UnionGroup/API/Query/Traslados/TrasladosATiendas/where?AlmacenDestino=${id}`, {
                headers: { 'Authorization': basicAuth },
                cache: 'no-store',
            }).then(res => res.json())
        );

        const results = await Promise.all(fetchPromises);
        const allTransfers = results.flat(); // Aplanamos el array de arrays

        if (!Array.isArray(allTransfers)) return [];
        return allTransfers.filter((t: any) => t.Estatus === 'O');

    } catch (error) {
        console.error("Falló la obtención de traslados entrantes:", error);
        return [];
    }
}


// Acción para obtener el detalle de un traslado específico
export async function getTransferDetailsAction(folio: number) {
    // Primero, revisamos si ya existe una recepción para este folio en nuestra BD
    const existingMovement = await prisma.movement.findFirst({
        where: { documentNumber: String(folio) }
    });

    if (existingMovement) {
        return { error: `La recepción para el folio ${folio} ya fue procesada.` };
    }
    
    // Si no existe, procedemos a buscar en la API externa
    const url = `https://www.vectordelta.com.mx:81/UnionGroup/API/Query/Traslados/TrasladosDetalle/where?FolioSAP=${folio}`;
    try {
        const username = process.env.API_STORES_USER;
        const password = process.env.API_STORES_PASSWORD;
        if (!username || !password) throw new Error("API credentials not configured");

        const basicAuth = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');

        const response = await fetch(url, {
            headers: { 'Authorization': basicAuth },
            cache: 'no-store',
        });
        if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
        const data = await response.json();
        return { data: Array.isArray(data) ? data : [] };
    } catch (error) {
        console.error(`Falló la obtención de detalles para el folio ${folio}:`, error);
        return { error: "No se pudo obtener el detalle del traslado." };
    }
}

// Obtiene la lista de tiendas que un supervisor gestiona
export async function getSupervisorManagedStoresAction(): Promise<Store[]> {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'SUPERVISOR') {
        return [];
    }

    const supervisedStores = await prisma.supervisorStores.findMany({
        where: { userId: session.user.id },
        include: { store: true }
    });

    return supervisedStores.map(s => s.store);
}

// Acción para confirmar la recepción y guardarla en nuestra base de datos
export async function confirmReceptionAction(prevState: any, formData: FormData) {
    "use server";

    const folioSAP = formData.get('folioSAP');
    
    console.log("Recepción confirmada para el folio:", folioSAP);
    console.log("Datos recibidos:", Object.fromEntries(formData.entries()));

    // TODO: Aquí irá la lógica para guardar en la base de datos que construiremos en el siguiente paso.
    
    revalidatePath("/operaciones/receptions");
    return { success: true, message: `Recepción para el folio ${folioSAP} procesada (simulación).` };
}
// --- FIN DE LA FUNCIÓN FALTANTE ---