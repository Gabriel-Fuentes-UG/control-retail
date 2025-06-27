// src/app/operaciones/receptions/preview/[folioSAP]/page.tsx

import React from 'react';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import {
  getTransferPreviewDetailsAction,
  TransferDetail,
} from '@/app/operaciones/receptions/actions';
import LivePreviewHandler from './LivePreviewHandler';

interface PreviewPageProps {
  // --- CORRECCIÓN ---
  // Se tipan como Promesas para reflejar el cambio en Next.js 15
  params: Promise<{ folioSAP: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function PreviewPage({
  params: paramsPromise,
  searchParams: searchParamsPromise,
}: PreviewPageProps) {
  // 1) Se resuelven las promesas para obtener los objetos
  const params = await paramsPromise;
  const searchParams = await searchParamsPromise;

  // Ahora se puede acceder a las propiedades de forma segura
  const { folioSAP } = params;
  const statusParam = Array.isArray(searchParams.status)
    ? searchParams.status[0]
    : searchParams.status;
  const docNumParam = Array.isArray(searchParams.docNum)
    ? searchParams.docNum[0]
    : searchParams.docNum;

  // 2) Autenticación (sin cambios)
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  // 3) Movimiento local (sin cambios)
  const movement = await prisma.movement.findUnique({
    where: { documentNumber: folioSAP },
    include: { status: true, originStore: true },
  });
  if (!movement) redirect('/operaciones/receptions');

  const isReadOnly = movement.status.name !== 'EN_PREPARACION';
  const originName = movement.originStore?.name ?? '—';
  const receivedBy = session.user?.name ?? '—';

  // 4) Traer detalles desde la API externa (sin cambios)
  const detailsResponse = await getTransferPreviewDetailsAction(
    Number(folioSAP)
  );
  const originalDetails: TransferDetail[] =
    detailsResponse.error || !detailsResponse.data
      ? []
      : detailsResponse.data;

  // 5) Logs guardados (sin cambios)
  const receptionLogs = await prisma.receptionLog.findMany({
    where: { folioSAP },
    orderBy: { linenum: 'asc' },
  });
  const logByLine = new Map<number, typeof receptionLogs[0]>();
  receptionLogs.forEach((l) => logByLine.set(l.linenum, l));

  // 6) Combinar ítems (sin cambios)
  const items = originalDetails.map((d) => {
    const log = logByLine.get(d.Linenum);
    const recibida =
      isReadOnly && log ? log.cantidadRecibida : d.Cantidad;
    return {
      linenum: d.Linenum,
      articulo: d.Articulo,
      descripcion: d.Descripcion,
      codeBars: d.CodeBars,
      cantidadEsperada: d.Cantidad,
      cantidadRecibida: recibida,
      diferencia: recibida - d.Cantidad,
      createdAt: (log?.createdAt ?? new Date()).toISOString(),
    };
  });

  // 7) Renderizar componente cliente, pasándole status y docNum (sin cambios)
  return (
    <LivePreviewHandler
      items={items}
      isReadOnly={isReadOnly}
      originName={originName}
      folioSAP={folioSAP}
      receivedBy={receivedBy}
      status={statusParam}
      docNum={docNumParam}
    />
  );
}
