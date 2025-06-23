// src/app/operaciones/receptions/preview/[folioSAP]/page.tsx
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import PreviewTabs, { PreviewItem } from "@/components/receptions/PreviewTabs";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { 
  getTransferDetailsAction, 
  getIncomingTransfersAction, // Se importa la acción que tiene el NombreOrigen
  TransferDetail,
  IncomingTransfer 
} from "@/app/operaciones/receptions/actions";

export default async function PreviewPage({
  params,
}: {
  params: { folioSAP: string };
}) {
  const { folioSAP } = params;

  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  // --- OBTENER DATOS (AMBAS LLAMADAS EN PARALELO PARA EFICIENCIA) ---
  const [detailsResponse, incomingTransfers] = await Promise.all([
    getTransferDetailsAction(Number(folioSAP)),
    getIncomingTransfersAction()
  ]);

  // --- MANEJO DE ERRORES AL OBTENER DETALLES DE ARTÍCULOS ---
  if (detailsResponse.error || !detailsResponse.data) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold text-red-600">Error al Cargar Detalles</h2>
        <p>No se pudo obtener la información de los artículos para el folio {folioSAP}.</p>
        <p className="mt-2 text-sm text-gray-500">
          <strong>Motivo:</strong> {detailsResponse.error || "No se encontraron datos en la API."}
        </p>
      </div>
    );
  }
  
  const originalDetails: TransferDetail[] = detailsResponse.data;

  // --- LÓGICA PARA OBTENER EL NOMBRE DEL ORIGEN ---
  const transferHeader = incomingTransfers.find(t => String(t.FolioSAP) === folioSAP);
  const originName = transferHeader?.NombreOrigen ?? "Origen no encontrado";

  // --- LÓGICA PARA PROCESAR LOS ITEMS Y COMBINAR CON LOGS ---
  const receptionLogs = await prisma.receptionLog.findMany({
    where: { folioSAP },
    orderBy: { linenum: "asc" },
  });

  const logByLineNum = new Map<number, typeof receptionLogs[0]>();
  for (const log of receptionLogs) {
    logByLineNum.set(log.linenum, log);
  }

  const items: PreviewItem[] = originalDetails.map((detail) => {
    const log = logByLineNum.get(detail.Linenum);
    const cantidadEsperada = detail.Cantidad;
    const cantidadRecibida = log ? log.cantidadRecibida : cantidadEsperada;
    
    return {
      linenum: detail.Linenum,
      articulo: detail.Articulo,
      descripcion: detail.Descripcion,
      cantidadEsperada: cantidadEsperada,
      cantidadRecibida: cantidadRecibida,
      diferencia: cantidadRecibida - cantidadEsperada,
      motivo: log?.motivo ?? null,
      observaciones: log?.observaciones ?? null,
      createdAt: log?.createdAt ?? new Date(),
    };
  });

  // --- CONFIGURACIÓN DE BREADCRUMBS ---
  const breadcrumbs = [
    { label: "Inicio", href: "/redirect-hub" },
    { label: "Recepciones", href: "/operaciones/receptions" },
    { label: `Conciliación Folio ${folioSAP}`, href: `/operaciones/receptions?folio=${folioSAP}`},
    { label: "Previsualización" },
  ];

  return (
    <div className="p-4 md:p-6">
      <Breadcrumbs items={breadcrumbs} />
      <div className="mt-4">
        <h2 className="text-2xl font-bold text-gray-800">Previsualización de Recepción</h2>
        <div className="mt-2 text-sm text-gray-600">
          <span><strong>Origen:</strong> {originName}</span>
          <span className="mx-2">|</span>
          <span><strong>Folio SAP:</strong> {folioSAP}</span>
          <span className="mx-2">|</span>
          <span><strong>Recibido por:</strong> {session.user?.name}</span>
        </div>
      </div>
<br/>
      <div className="mt-6">
        <PreviewTabs items={items} />
      </div>
    </div>
  );
}
