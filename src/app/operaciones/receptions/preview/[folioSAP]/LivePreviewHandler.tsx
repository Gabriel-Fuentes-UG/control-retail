// src/app/operaciones/receptions/preview/[folioSAP]/LivePreviewHandler.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import PreviewTabs from '@/components/receptions/PreviewTabs';
import ConfirmReceptionForm from '@/components/receptions/ConfirmReceptionForm';
import ReadOnlyFooter from '@/components/receptions/ReadOnlyFooter';
import { Alert, Button, Modal } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheckCircle } from 'react-icons/fi';

// Debe coincidir con lo que construye el servidor
export interface PreviewItem {
  linenum: number;
  articulo: string;
  descripcion: string;
  codeBars: string; 
  cantidadEsperada: number;
  cantidadRecibida: number;
  diferencia: number;
  createdAt: string;
}

interface LivePreviewHandlerProps {
  items: PreviewItem[];
  isReadOnly: boolean;
  originName: string;
  folioSAP: string;
  receivedBy: string;
  status?: string; // 'success' si venimos tras confirmar
  docNum?: string; // Número de documento retornado por la API
}

export default function LivePreviewHandler({
  items: initialItems,
  isReadOnly,
  originName,
  folioSAP,
  receivedBy,
  status,
  docNum,
}: LivePreviewHandlerProps) {
  const [items, setItems] = useState<PreviewItem[]>(initialItems);
  
  // --- CORRECCIÓN FINAL ---
  // Inicializamos el modal como cerrado.
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Usamos useEffect para REACCIONAR a la llegada del prop 'status'.
  // Esto es más robusto que depender del estado inicial.
  useEffect(() => {
    if (status === 'success') {
      // Si el prop 'status' es 'success', mostramos el modal.
      setShowSuccessModal(true);
      
      // Y limpiamos el sessionStorage para evitar datos obsoletos.
      const key = `reception-preview-${folioSAP}`;
      sessionStorage.removeItem(key);
    }
  }, [status, folioSAP]); // Este efecto se ejecuta cuando 'status' cambia.

  // Efecto para manejar datos de sessionStorage al cargar (si no es solo lectura)
  useEffect(() => {
    if (!isReadOnly) {
        const key = `reception-preview-${folioSAP}`;
        const stored = sessionStorage.getItem(key);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed.items && Array.isArray(parsed.items)) {
              setItems(parsed.items);
            }
          } catch {
            console.warn('sessionStorage inválido para preview');
          }
        }
    }
  }, [folioSAP, isReadOnly]);


  const breadcrumbs = [
    { label: 'Inicio', href: '/redirect-hub' },
    { label: 'Recepciones', href: '/operaciones/receptions' },
    { label: 'Lista de Traslados', href: '/operaciones/receptions' },
    { label: `Detalle Folio ${folioSAP}`, href: `/operaciones/receptions` },
    { label: 'Previsualización' },
  ];

  return (
    <>
      <div className="p-4 md:p-6">
        <Breadcrumbs items={breadcrumbs} />

        <div className="mt-4">
          <h2 className="text-2xl font-bold text-gray-800">
            {isReadOnly && status !== 'success'
              ? 'Resumen de Recepción'
              : 'Previsualización de Recepción'}
          </h2>
          <div className="mt-2 text-sm text-gray-600">
            <span><strong>Origen:</strong> {originName}</span>
            <span className="mx-2">|</span>
            <span><strong>Folio SAP:</strong> {folioSAP}</span>
            <span className="mx-2">|</span>
            <span><strong>Recibido por:</strong> {receivedBy}</span>
          </div>
        </div>

        <AnimatePresence>
          {status === 'success' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="mt-3"
            >
              <Alert variant="success">
                ¡Recepción confirmada con éxito! Este es el resumen final.
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-6">
          <PreviewTabs items={items} />

          {status !== 'success' && (
            isReadOnly ? (
              <ReadOnlyFooter folioSAP={folioSAP} />
            ) : (
              <ConfirmReceptionForm folioSAP={folioSAP} items={items} />
            )
          )}
        </div>
      </div>

      <Modal
        show={showSuccessModal}
        onHide={() => setShowSuccessModal(false)}
        centered
        backdrop="static"
      >
        <Modal.Body className="text-center p-4">
          <FiCheckCircle
            className="text-success mb-3"
            style={{ fontSize: '50px' }}
          />
          <Modal.Title as="h4">¡Recepción Confirmada!</Modal.Title>
          <p className="mt-2 text-muted">
            El traslado se registró en el sistema con el documento:
          </p>
          <p className="lead">
            <strong>{docNum}</strong>
          </p>
          <Button
            variant="success"
            onClick={() => setShowSuccessModal(false)}
          >
            Aceptar
          </Button>
        </Modal.Body>
      </Modal>
    </>
  );
}
