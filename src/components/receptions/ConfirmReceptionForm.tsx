// src/app/components/receptions/ConfirmReceptionForm.tsx

'use client';

import React, { useRef, useState, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Form, Button, Modal, Alert } from 'react-bootstrap';
import { useActionState } from 'react';
import { confirmReceptionAction, ReceptionState } from '@/app/operaciones/receptions/actions';
import { FiAlertTriangle } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

export interface PreviewItem {
  linenum: number;
  articulo: string;
  descripcion: string;
  cantidadEsperada: number;
  cantidadRecibida: number;
  diferencia: number;
  createdAt: string;
  codeBars: string;
}

interface ConfirmReceptionFormProps {
  folioSAP: string;
  items: PreviewItem[];
}

export default function ConfirmReceptionForm({
  folioSAP,
  items,
}: ConfirmReceptionFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [observaciones, setObservaciones] = useState('');
  const [obsError, setObsError] = useState('');
  
  // --- CORRECCIÓN ---
  // Se elimina toda la lógica del modal de éxito de este componente.
  // Ya no necesita su propio `showSuccessModal` ni el `useEffect` asociado.
  const [showConfirmModal, setShowConfirmModal] = useState(false); 

  const [state, formAction, isPending] = useActionState<ReceptionState, FormData>(
    confirmReceptionAction,
    null
  );

  // Abre el modal de confirmación final
  const handleOpenConfirmModal = () => {
    if (!observaciones.trim()) {
      setObsError('Las observaciones son obligatorias para finalizar.');
      return;
    }
    setObsError('');
    setShowConfirmModal(true);
  };

  // Se ejecuta desde el modal para enviar el formulario
  const handleFinalSubmit = () => {
    setShowConfirmModal(false);
    if (!formRef.current) return;
    const fd = new FormData(formRef.current);
    startTransition(() => formAction(fd));
  };

  return (
    <>
      <Form ref={formRef} className="mt-4 p-4 border rounded bg-light">
        <input type="hidden" name="folioSAP" value={folioSAP} />
        {items.map((it) => (
          <React.Fragment key={it.linenum}>
            <input type="hidden" name={`items[${it.linenum}][articulo]`} value={it.articulo} />
            <input type="hidden" name={`items[${it.linenum}][esperado]`} value={String(it.cantidadEsperada)} />
            <input type="hidden" name={`items[${it.linenum}][recibido]`} value={String(it.cantidadRecibida)} />
            <input type="hidden" name={`items[${it.linenum}][codeBars]`} value={it.codeBars} />
          </React.Fragment>
        ))}
        <Form.Group className="mb-3">
          <Form.Label htmlFor='observaciones-finales' className='fw-bold'>Observaciones Finales (Obligatorio)</Form.Label>
          <Form.Control
            id='observaciones-finales'
            as="textarea"
            rows={3}
            name="observaciones"
            placeholder="Añade cualquier comentario relevante antes de confirmar..."
            maxLength={250}
            value={observaciones}
            onChange={(e) => {
              setObservaciones(e.target.value);
              if (e.target.value.trim()) setObsError('');
            }}
            isInvalid={!!obsError}
            required
          />
          <Form.Control.Feedback type="invalid">{obsError}</Form.Control.Feedback>
        </Form.Group>
        
        <AnimatePresence>
          {state?.error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="mb-3"
            >
              <Alert variant="danger">
                <strong>Error al confirmar:</strong> {state.error}
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="d-grid gap-2 d-md-flex justify-content-md-end">
          <Button variant="secondary" onClick={() => router.back()} disabled={isPending}>
            Volver a Conciliación
          </Button>
          <Button type="button" variant="primary" onClick={handleOpenConfirmModal} disabled={isPending || !observaciones.trim()}>
            {isPending ? 'Procesando…' : 'Confirmar Recepción Definitiva'}
          </Button>
        </div>
      </Form>
      
      {/* MODAL DE CONFIRMACIÓN FINAL (Esto es para preguntar "Estás seguro?") */}
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <FiAlertTriangle className="me-2 text-warning" />
            Confirmar Acción
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
            ¿Estás seguro de que deseas procesar la recepción con esta información? Esta acción no se puede deshacer.
        </Modal.Body>
        <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowConfirmModal(false)} disabled={isPending}>
                Cancelar
            </Button>
            <Button variant="primary" onClick={handleFinalSubmit} disabled={isPending}>
                {isPending ? 'Procesando…' : 'Sí, confirmar'}
            </Button>
        </Modal.Footer>
      </Modal>

      {/* --- CORRECCIÓN ---
        El modal de ÉXITO se ha ELIMINADO completamente de este archivo.
        Su lógica ahora vive únicamente en `LivePreviewHandler.tsx`, que es lo correcto.
      */}
    </>
  );
}
