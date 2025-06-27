// src/app/operaciones/receptions/actions.ts

"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";
import { v4 as uuid } from "uuid";
import { redirect } from "next/navigation";

// Tipos expuestos al cliente
export type IncomingTransfer = {
  FolioSAP: number;
  Fecha: string;
  NombreOrigen: string;
  Estatus: string;
};

export type TransferDetail = {
  Linenum: number;
  Articulo: string;
  Descripcion: string;
  Cantidad: number;
  CodeBars: string;
};

// Modificamos el estado para incluir el `docNum` de la respuesta del API
export type ReceptionState = {
  success: boolean;
  error?: string;
  docNum?: string;
} | null;

// Tipo para los traslados procesados
export type ProcessedTransfer = {
  id: string;
  documentNumber: string;
  updatedAt: Date;
  originStore: { name: string | null } | null;
  destinationStore: { name: string | null } | null;
  status: { name: string };
};


export async function getIncomingTransfersAction(): Promise<IncomingTransfer[]> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return [];

   // --- CORRECCIÓN RECOMENDADA ---
  // Se define explícitamente qué roles pueden recibir mercancía.
  const allowedRoles = ["SUPERVISOR", "GERENTE", "ENCARGADO", "VENDEDOR"];

  // Si el rol del usuario no está en la lista de permitidos, no se hace nada.
  if (!allowedRoles.includes(session.user.role)) {
    return [];
  }

  let storeIds: string[] = [];
  if (session.user.role === "SUPERVISOR") {
    const sup = await prisma.supervisorStores.findMany({
      where: { userId: session.user.id },
      select: { storeId: true },
    });
    storeIds = sup.map((s) => s.storeId);
  } else if (session.user.storeId) {
    storeIds = [session.user.storeId];
  }
  if (storeIds.length === 0) return [];

  const user = process.env.API_STORES_USER!;
  const pass = process.env.API_STORES_PASSWORD!;
  const basicAuth = "Basic " + Buffer.from(`${user}:${pass}`).toString("base64");
  const results = await Promise.all(
    storeIds.map((id) =>
      fetch(
        `https://www.vectordelta.com.mx:81/UnionGroup/API/Query/Traslados/TrasladosATiendas/where?AlmacenDestino=${id}`,
        { headers: { Authorization: basicAuth }, cache: "no-store" }
      ).then((r) => (r.ok ? r.json() : []))
    )
  );
  const allTransfers: any[] = results.flat();
  const externalPendings = allTransfers.filter((t) => t.Estatus === "O");

  const folios = externalPendings.map((t) => String(t.FolioSAP));
  const logged = await prisma.receptionLog.findMany({
    where: { folioSAP: { in: folios } },
    select: { folioSAP: true },
  });
  const done = new Set(logged.map((l) => l.folioSAP));
  const toProcess = externalPendings.filter((t) => !done.has(String(t.FolioSAP)));

  const [pendStatus, transferType] = await Promise.all([
    prisma.movementStatus.findUnique({ where: { name: "EN_PREPARACION" } }),
    prisma.movementType.findUnique({ where: { name: "TRASLADO_INTERNO" } }),
  ]);
  if (!pendStatus || !transferType) {
    throw new Error("Falta seed de EN_PREPARACION o TRASLADO_INTERNO");
  }

  const destinoId = session.user.storeId!;
  await prisma.store.upsert({
    where: { id: destinoId },
    update: {},
    create: { id: destinoId, name: `Tienda ${destinoId}` },
  });
  await Promise.all(
    toProcess.map(async (h) => {
      const doc = String(h.FolioSAP);
      const fecha = new Date(h.Fecha);
      await prisma.store.upsert({
        where: { id: h.AlmacenOrigen },
        update: { name: h.NombreOrigen },
        create: { id: h.AlmacenOrigen, name: h.NombreOrigen },
      });
      await prisma.movement.upsert({
        where: { documentNumber: doc },
        update: {
          statusId: pendStatus.id,
          observations: h.Memo,
          updatedAt: fecha,
          originStoreId: h.AlmacenOrigen,
          destinationStoreId: destinoId,
        },
        create: {
          documentNumber: doc,
          createdAt: fecha,
          updatedAt: fecha,
          typeId: transferType.id,
          statusId: pendStatus.id,
          observations: h.Memo,
          originStoreId: h.AlmacenOrigen,
          destinationStoreId: destinoId,
        },
      });
    })
  );

  revalidatePath("/operaciones/receptions");
  return toProcess as IncomingTransfer[];
}


export async function getTransferDetailsAction(folio: number) {
  const doc = String(folio);
  const [existing, pendStatus] = await Promise.all([
    prisma.movement.findUnique({
      where: { documentNumber: doc },
      select: { statusId: true },
    }),
    prisma.movementStatus.findUnique({
      where: { name: "EN_PREPARACION" },
      select: { id: true },
    }),
  ]);
  if (existing && pendStatus && existing.statusId !== pendStatus.id) {
    return { error: `La recepción para el folio ${folio} ya fue procesada.` };
  }
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Sesión inválida.");
  const basicAuth =
    "Basic " +
    Buffer.from(
      `${process.env.API_STORES_USER!}:${process.env.API_STORES_PASSWORD!}`
    ).toString("base64");
  const url = `https://www.vectordelta.com.mx:81/UnionGroup/API/Query/Traslados/TrasladosDetalle/where?FolioSAP=${folio}`;
  const res = await fetch(url, {
    headers: { Authorization: basicAuth },
    cache: "no-store",
  });
  if (!res.ok) {
    return { error: `API Error: ${res.status} ${res.statusText}` };
  }
  const data = await res.json();
  return { data: Array.isArray(data) ? data : [] };
}


/**
 * Confirma la recepción.
 */
export async function confirmReceptionAction(
  previousState: any,
  formData: FormData
): Promise<any> {
  const folioSAP = String(formData.get("folioSAP") || "");
  if (!folioSAP) {
    return { success: false, error: "Falta el folio SAP." };
  }

  // Declared here to be available for the redirect call at the end
  let docNum: string;

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new Error("Sesión inválida.");
    }

    const memo = String(formData.get("observaciones") || "");
    const cancelFlag = String(formData.get("cancel")) === "true";

    const byLine: Record<number, any> = {};
    for (const [key, val] of formData.entries()) {
      const m = key.match(
        /^items\[(\d+)\]\[(articulo|esperado|recibido|codeBars)\]$/
      );
      if (!m) continue;
      const ln = Number(m[1]);
      byLine[ln] = byLine[ln] || { linenum: ln };
      if (m[2] === "articulo") byLine[ln].itemCode = String(val);
      if (m[2] === "esperado") byLine[ln].expected = Number(val);
      if (m[2] === "recibido") byLine[ln].received = Number(val);
      if (m[2] === "codeBars") byLine[ln].codeBars = String(val);
    }
    const allItems = Object.values(byLine).filter(
      (i) =>
        typeof i.itemCode === "string" &&
        typeof i.expected === "number" &&
        typeof i.received === "number" &&
        typeof i.codeBars === "string"
    ) as Array<{
      linenum: number;
      itemCode: string;
      expected: number;
      received: number;
      codeBars: string;
    }>;

    if (allItems.length === 0) {
      return { success: false, error: "No se enviaron artículos." };
    }

    if (cancelFlag) {
      allItems.forEach((i) => (i.received = i.expected));
    }

    const user = process.env.API_STORES_USER!;
    const pass = process.env.API_STORES_PASSWORD!;
    const basicAuth = "Basic " + Buffer.from(`${user}:${pass}`).toString("base64");

    const hdrRes = await fetch(
      `https://www.vectordelta.com.mx:81/UnionGroup/API/Query/Traslados/TrasladosATiendas/where?FolioSAP=${folioSAP}`,
      { headers: { Authorization: basicAuth }, cache: "no-store" }
    );
    if (!hdrRes.ok)
      throw new Error(
        `No se pudo obtener la cabecera del traslado: ${hdrRes.statusText}`
      );
    const hdrArr: any[] = await hdrRes.json();
    const header = hdrArr.find((h) => String(h.FolioSAP) === folioSAP);
    if (!header) throw new Error(`Cabecera no encontrada para folio ${folioSAP}`);

    const lines = allItems.map((i) => ({
      Quantity: Math.min(i.received, i.expected),
      ItemCode: i.itemCode,
      LineNum: String(i.linenum),
      BarCode: i.codeBars,
    }));

    const excedentes = allItems
      .filter((i) => i.received > i.expected)
      .map((i) => ({
        Quantity: i.received - i.expected,
        ItemCode: i.itemCode,
        LineNum: String(i.linenum),
        BarCode: i.codeBars,
      }));

    const totalQuantityInLines = lines.reduce((sum, l) => sum + l.Quantity, 0);
    const totalQuantityInExcedentes = excedentes.reduce(
      (sum, e) => sum + e.Quantity,
      0
    );

    const transactionNum = `RC-${uuid()}`;
    const statusLabel =
      cancelFlag
        ? "Cancelado"
        : totalQuantityInLines <
            allItems.reduce((sum, i) => sum + i.expected, 0) ||
          totalQuantityInExcedentes > 0
        ? "Parcial"
        : "Total";

    const payload = {
      ReceiptConfirm: {
        NumAtCard: header.NumAtCard,
        DocDate: header.Fecha,
        Memo: memo,
        DocNum: header.DocNum,
        TransactionNumber: transactionNum,
        Status: statusLabel,
      },
      ControlValues: {
        TotalLines: lines.length,
        TotalQuantity: totalQuantityInLines,
      },
      Lines: lines,
      Excedentes: {
        ControlValues: {
          TotalLines: excedentes.length,
          TotalQuantity: totalQuantityInExcedentes,
        },
        Lines: excedentes,
      },
    };

    const postRes = await fetch(
      "https://www.vectordelta.com.mx:81/UnionGroup/API/Insert/Production/ReceiptConfirm",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: basicAuth },
        body: JSON.stringify(payload),
      }
    );

    const responseBody = await postRes.text();
    if (!postRes.ok) {
      console.error("Error de la API externa:", responseBody);
      return {
        success: false,
        error: `La API externa rechazó la confirmación: ${postRes.status} - ${responseBody}`,
      };
    }

    let apiResponse;
    try {
      apiResponse = JSON.parse(responseBody);
    } catch (parseError) {
      return {
        success: false,
        error: "La API externa devolvió una respuesta inválida (no es JSON).",
      };
    }

    if (
      !Array.isArray(apiResponse) ||
      apiResponse.length === 0 ||
      !apiResponse[0].DocNum
    ) {
      return {
        success: false,
        error: "Respuesta inesperada de la API. No se encontró 'DocNum'.",
      };
    }
    
    // Assign the value to the variable declared outside the try block
    docNum = apiResponse[0].DocNum;

    await prisma.$transaction(async (tx) => {
      await tx.receptionLog.deleteMany({ where: { folioSAP } });
      await tx.receptionLog.createMany({
        data: allItems.map((i) => ({
          folioSAP,
          linenum: i.linenum,
          articulo: i.itemCode,
          cantidadEsperada: i.expected,
          cantidadRecibida: i.received,
          diferencia: i.received - i.expected,
          motivo: null,
          observaciones: memo,
        })),
      });

      const movement = await tx.movement.findUnique({
        where: { documentNumber: folioSAP },
      });
      if (movement) {
        const finalStatusName =
          cancelFlag
            ? "CANCELADO"
            : totalQuantityInLines <
                allItems.reduce((sum, i) => sum + i.expected, 0) ||
              totalQuantityInExcedentes > 0
            ? "RECIBIDO_PARCIAL"
            : "CERRADO";
        const statusRecord = await tx.movementStatus.findUnique({
          where: { name: finalStatusName },
        });
        if (statusRecord) {
          await tx.movement.update({
            where: { id: movement.id },
            data: { statusId: statusRecord.id },
          });
        }
      }
    });

  } catch (e: any) {
    console.error("Error en confirmReceptionAction:", e);
    // If any error occurs, return it to the client
    return { success: false, error: e.message };
  }

  // --- CORRECCIÓN ---
  // Si llegamos aquí, significa que el bloque 'try' se completó sin errores.
  // Ahora podemos revalidar y redirigir de forma segura.
  revalidatePath("/operaciones/receptions");
  revalidatePath(`/operaciones/receptions/preview/${folioSAP}`);
  
  // La redirección se ejecuta aquí, fuera del try...catch
  redirect(
    `/operaciones/receptions/preview/${folioSAP}?status=success&docNum=${docNum}`
  );
}

export async function getSupervisorManagedStoresAction(): Promise<any[]> {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "SUPERVISOR") return [];
  const sup = await prisma.supervisorStores.findMany({
    where: { userId: session.user.id },
    include: { store: true },
  });
  return sup.map((s) => s.store);
}

export async function getTransferPreviewDetailsAction(
  folio: number
): Promise<{ data: TransferDetail[] } | { error: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { error: "Sesión inválida." };
  }

  const username = process.env.API_STORES_USER!;
  const password = process.env.API_STORES_PASSWORD!;
  const basicAuth =
    "Basic " + Buffer.from(`${username}:${password}`).toString("base64");
  const url = `https://www.vectordelta.com.mx:81/UnionGroup/API/Query/Traslados/TrasladosDetalle/where?FolioSAP=${folio}`;

  const res = await fetch(url, {
    headers: { Authorization: basicAuth },
    cache: "no-store",
  });
  if (!res.ok) {
    return { error: `API Error: ${res.status} ${res.statusText}` };
  }
  const data = await res.json();
  return { data: Array.isArray(data) ? data : [] };
}

export async function getTransferHeaderAction(
  folioSAP: string
): Promise<{ originName: string } | { error: string }> {
  try {
    const movement = await prisma.movement.findUnique({
      where: { documentNumber: folioSAP },
      include: { originStore: true },
    });

    if (!movement) {
      return { error: `No se encontró el traslado con folio ${folioSAP}` };
    }

    return { originName: movement.originStore?.name ?? "Origen Desconocido" };
  } catch (e) {
    console.error(`Error en getTransferHeaderAction para folio ${folioSAP}:`, e);
    return { error: "Error al obtener la información del traslado." };
  }
}

export async function getProcessedTransfersAction(): Promise<ProcessedTransfer[]> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return [];

  let storeIds: string[] = [];
  if (
    session.user.role === "SUPERVISOR" ||
    session.user.role === "ADMINISTRADOR"
  ) {
    if (session.user.role === "SUPERVISOR") {
      const sup = await prisma.supervisorStores.findMany({
        where: { userId: session.user.id },
        select: { storeId: true },
      });
      storeIds = sup.map((s) => s.storeId);
    }
  } else if (session.user.storeId) {
    storeIds = [session.user.storeId];
  }

  if (session.user.role !== "ADMINISTRADOR" && storeIds.length === 0) return [];

  const pendingStatus = await prisma.movementStatus.findUnique({
    where: { name: "EN_PREPARACION" },
    select: { id: true },
  });

  if (!pendingStatus) {
    console.error("Estado 'EN_PREPARACION' no encontrado en la base de datos.");
    return [];
  }

  const movements = await prisma.movement.findMany({
    where: {
      ...(session.user.role !== "ADMINISTRADOR" && {
        destinationStoreId: { in: storeIds },
      }),
      statusId: { not: pendingStatus.id },
      type: { name: "TRASLADO_INTERNO" },
    },
    include: {
      originStore: { select: { name: true } },
      destinationStore: { select: { name: true } },
      status: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
    take: 200,
  });

  return movements.map((m) => ({
    id: m.id,
    documentNumber: m.documentNumber,
    updatedAt: m.updatedAt,
    originStore: m.originStore,
    destinationStore: m.destinationStore,
    status: {
      name: m.status.name,
    },
  }));
}
