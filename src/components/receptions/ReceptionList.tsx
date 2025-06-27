// src/components/receptions/ReceptionList.tsx
'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Movement } from '@prisma/client';

interface ReceptionListProps {
  pendings: Array<{
    id: string;
    documentNumber: string;
    originStore: { name: string | null };
    destinationStore: { name: string | null };
  }>;
}

export default function ReceptionList({ pendings }: ReceptionListProps) {
  const itemVar = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0 },
  };

  if (pendings.length === 0) {
    return <p>No hay traslados pendientes.</p>;
  }

  return (
    <motion.ul
      className="list-group"
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
    >
      {pendings.map((t) => (
        <motion.li
          key={t.id}
          className="list-group-item d-flex justify-content-between align- items-center"
          variants={itemVar}
          whileHover={{
            scale: 1.02,
            backgroundColor: 'rgba(0,123,255,0.05)',
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <div>
            <strong>Folio:</strong> {t.documentNumber} &nbsp;|&nbsp;
            <strong>Origen:</strong> {t.originStore?.name || '—'} &nbsp;|&nbsp;
            <strong>Destino:</strong> {t.destinationStore?.name || '—'}
          </div>
          <Link
            href={`/operaciones/receptions/${t.documentNumber}`}
            className="btn btn-primary btn-sm"
          >
            Ver Detalle
          </Link>
        </motion.li>
      ))}
    </motion.ul>
  );
}
