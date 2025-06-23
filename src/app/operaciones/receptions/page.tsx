// src/app/operaciones/receptions/page.tsx
'use client';

import { useState, useMemo } from "react";
import { Button } from "react-bootstrap";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import IncomingTransfersList from "@/components/receptions/IncomingTransfersList";
import TransferDetailView from "@/components/receptions/TransferDetailView";
import { motion, AnimatePresence } from "framer-motion";

type Step = 'selection' | 'list' | 'detail';

export default function ReceptionsPage() {
  const [step, setStep] = useState<Step>('selection');
  const [selectedFolio, setSelectedFolio] = useState<number | null>(null);

  const handleTransferSelect = (folio: number) => {
    setSelectedFolio(folio);
    setStep('detail');
  };

  const handleReturnToList = () => {
    setSelectedFolio(null);
    setStep('list');
  };

  const breadcrumbItems = useMemo(() => {
    const baseCrumbs = [
      { label: "Inicio", href: "/redirect-hub" },
      {
        label: "Recepciones",
        href: step !== 'selection' ? '#' : undefined,
        onClick: step !== 'selection' ? () => setStep('selection') : undefined
      }
    ];

    if (step === 'list') {
      baseCrumbs.push({ label: "Lista de Traslados" });
    } else if (step === 'detail' && selectedFolio) {
      baseCrumbs.push({
        label: "Lista de Traslados",
        href: '#',
        onClick: handleReturnToList
      });
      baseCrumbs.push({ label: `Detalle Folio ${selectedFolio}` });
    }

    return baseCrumbs;
  }, [step, selectedFolio]);

  let currentStepContent;
  switch (step) {
    case 'list':
      currentStepContent = (
        <IncomingTransfersList onTransferSelect={handleTransferSelect} />
      );
      break;
    case 'detail':
      currentStepContent = selectedFolio ? (
        <TransferDetailView folioSAP={selectedFolio} onBack={handleReturnToList} />
      ) : null;
      break;
    case 'selection':
    default:
      currentStepContent = (
        <motion.div
          key="selection"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.3 }}
        >
          <p>Por favor, selecciona el origen de la mercancía:</p>
          <div className="d-flex gap-3">
            <Button
              as={motion.button}
              variant="primary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setStep('list')}
            >
              Centro de Distribución / Traslado
            </Button>
          </div>
        </motion.div>
      );
      break;
  }

  return (
    <div className="dashboard-section">
      <Breadcrumbs items={breadcrumbItems} />

      <div className="d-flex justify-content-between align-items-center my-4">
        <motion.h2
          key={step + '-title'}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          Iniciar Recepción de Mercancía
        </motion.h2>
      </div>

      <AnimatePresence exitBeforeEnter>
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          layout
        >
          {currentStepContent}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
