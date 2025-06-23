// src/app/operaciones/receptions/actions.ts
"use server";
    
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { Store } from "@prisma/client";
import { revalidatePath } from "next/cache";

// --- TIPOS ---

export type IncomingTransfer = {
    FolioSAP: number;
    Fecha: string;
    NombreOrigen: string;
    Estatus: string;
};

export type TransferDetail = {
    Linenum: number; // Campo añadido, ya que se usa en el cliente
    Articulo: string;
    Descripcion: string;
    Cantidad: number;
    CodeBars: string;
};

// --- ESTADO PARA LA ACCIÓN ---
export type ReceptionState = {
    success: boolean;
    error?: string;
    message?: string;
} | null;


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
// ***** CORREGIDO *****
export async function confirmReceptionAction(previousState: ReceptionState, formData: FormData): Promise<ReceptionState> {
    try {
        const folioSAP = String(formData.get("folioSAP"));
        if (!folioSAP) {
             return { success: false, error: "Falta el folio SAP." };
        }

        const items: Array<{
            linenum: number;
            articulo: string;
            esperado: number;
            recibido: number;
        }> = [];

        // 1) Reconstruimos los items desde el FormData
        const itemData: { [key: number]: Partial<(typeof items)[0]> } = {};
        for (const [key, value] of formData.entries()) {
            const match = key.match(/^items\[(\d+)\]\[(articulo|esperado|recibido)\]$/);
            if (!match) continue;

            const linenum = Number(match[1]);
            const field = match[2] as 'articulo' | 'esperado' | 'recibido';

            if (!itemData[linenum]) {
                itemData[linenum] = { linenum };
            }

            if (field === 'articulo') {
                itemData[linenum][field] = String(value);
            } else {
                itemData[linenum][field] = Number(value);
            }
        }
        
        const processedItems = Object.values(itemData).map(item => ({
            linenum: item.linenum!,
            articulo: item.articulo!,
            esperado: item.esperado!,
            recibido: item.recibido!,
            diferencia: item.recibido! - item.esperado!,
            motivo: null, // Puedes añadir lógica para estos campos si los necesitas
            observaciones: null,
            createdAt: new Date(),
            folioSAP,
        }));

        if (processedItems.length === 0) {
            return { success: false, error: "No se enviaron artículos para procesar." };
        }

        // 2) Guardamos en la base de datos dentro de una transacción
        await prisma.$transaction(async (tx) => {
            // Borramos logs previos para este folio para evitar duplicados
            await tx.receptionLog.deleteMany({ where: { folioSAP } });

            // Creamos los nuevos registros
            await tx.receptionLog.createMany({
                data: processedItems.map(i => ({
                    folioSAP: i.folioSAP,
                    linenum: i.linenum,
                    articulo: i.articulo,
                    cantidadEsperada: i.esperado,
                    cantidadRecibida: i.recibido,
                    diferencia: i.diferencia,
                    motivo: i.motivo,
                    observaciones: i.observaciones,
                    createdAt: i.createdAt
                }))
            });
        });
        
        // 3) Revalidamos la ruta para que futuras cargas reflejen los cambios
        revalidatePath('/operaciones/receptions');

        // 4) Devolvemos un estado de éxito
        return { success: true, message: "Recepción confirmada exitosamente." };

    } catch (error) {
        console.error("Error al confirmar la recepción:", error);
        const errorMessage = error instanceof Error ? error.message : "Ocurrió un error desconocido.";
        return { success: false, error: `Error en el servidor: ${errorMessage}` };
    }
}
