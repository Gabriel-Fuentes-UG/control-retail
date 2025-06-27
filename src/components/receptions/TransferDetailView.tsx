// Archivo: src/app/components/receptions/TransferDetailView.tsx

'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  getTransferDetailsAction,
  TransferDetail,
} from '@/app/operaciones/receptions/actions';
import {
  Table,
  Spinner,
  Form,
  Button,
  Alert,
  InputGroup,
  Modal,
} from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheckCircle, FiAlertTriangle, FiXCircle } from 'react-icons/fi';

export interface ReconciliationItem extends TransferDetail {
  quantityReceived: string;
}

interface TransferDetailViewProps {
  folioSAP: number;
  onBack: () => void;
}

export default function TransferDetailView({
  folioSAP,
  onBack,
}: TransferDetailViewProps) {
  const [items, setItems] = useState<ReconciliationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const router = useRouter();

  // 1) Cargar detalles desde API al montar
  useEffect(() => {
    setLoading(true);
    getTransferDetailsAction(folioSAP).then((res) => {
      if (res.error) {
        setError(res.error);
      } else if (res.data) {
        setItems(
          res.data.map((i) => ({
            ...i,
            quantityReceived: String(i.Cantidad),
          }))
        );
      }
      setLoading(false);
    });
  }, [folioSAP]);

  // 2) Validación y apertura de modal
  const handleOpenConfirmModal = () => {
    setFormError(null);
    const hasInvalid = items.some(
      (it) =>
        it.quantityReceived.trim() === '' ||
        isNaN(parseInt(it.quantityReceived, 10))
    );
    if (hasInvalid) {
      setFormError(
        'Por favor, asegúrate de que todas las cantidades recibidas sean números válidos.'
      );
      return;
    }
    setShowConfirmModal(true);
  };

  // 3) Guardar en sessionStorage y navegar al Preview
  const handleProceedToPreview = () => {
    const payload = {
      items: items.map((it) => ({
        linenum: it.Linenum,
        articulo: it.Articulo,
        descripcion: it.Descripcion,
        codeBars: it.CodeBars, // <-- CORRECCIÓN: Se añade 'codeBars' al payload
        cantidadEsperada: it.Cantidad,
        cantidadRecibida: parseInt(it.quantityReceived, 10),
        diferencia:
          parseInt(it.quantityReceived, 10) - it.Cantidad,
        createdAt: new Date().toISOString(),
      })),
    };
    sessionStorage.setItem(
      `reception-preview-${folioSAP}`,
      JSON.stringify(payload)
    );
    setShowConfirmModal(false);
    router.push(`/operaciones/receptions/preview/${folioSAP}`);
  };

  // 4) Cálculo de estatus para cada fila
  const computeStatus = (expected: number, received: number) => {
    if (received < 0 || isNaN(received))
      return { label: 'Inválido', variant: 'secondary', Icon: FiXCircle };
    if (received === expected)
      return { label: 'Correcto', variant: 'success', Icon: FiCheckCircle };
    if (received > expected)
      return { label: 'Excedente', variant: 'warning', Icon: FiAlertTriangle };
    return { label: 'Faltante', variant: 'danger', Icon: FiXCircle };
  };

  // 5) Manejo de cambios en inputs
  const handleQtyChange = (linenum: number, val: string) => {
    const numeric = val.replace(/[^0-9]/g, '');
    setItems((cur) =>
      cur.map((it) =>
        it.Linenum === linenum
          ? { ...it, quantityReceived: numeric }
          : it
      )
    );
  };

  // 6) Filtrar tabla
  const filteredItems = useMemo(() => {
    const term = filter.trim().toLowerCase();
    if (!term) return items;
    return items.filter((it) => {
      const status = computeStatus(
        it.Cantidad,
        parseInt(it.quantityReceived, 10)
      ).label;
      return (
        it.Articulo.toLowerCase().includes(term) ||
        it.Descripcion.toLowerCase().includes(term) ||
        status.toLowerCase().includes(term)
      );
    });
  }, [items, filter]);

  if (loading)
    return (
      <div className="text-center py-5">
        <Spinner animation="border" />
        <p className="mt-2">Cargando...</p>
      </div>
    );
  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <div className="mt-4">
      {/* Encabezado y botón de regreso */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="m-0">
          Conciliación de Mercancía (Folio: {folioSAP})
        </h4>
        <Button variant="outline-secondary" onClick={onBack}>
          ← Volver a Lista
        </Button>
      </div>

      {/* Error de validación */}
      <AnimatePresence>
        {formError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="mb-3"
          >
            <Alert variant="warning">{formError}</Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filtro */}
      <InputGroup className="mb-3" style={{ maxWidth: 400 }}>
        <InputGroup.Text>🔍</InputGroup.Text>
        <Form.Control
          placeholder="Buscar artículo / estatus"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </InputGroup>

      {/* Tabla */}
      <motion.div layout>
        <Table
          striped
          hover
          responsive
          className="align-middle"
          style={{ borderRadius: 8, overflow: 'hidden' }}
        >
          <thead style={{ background: '#f8f9fa' }}>
            <tr>
              <th>Artículo</th>
              <th>Descripción</th>
              <th className="text-center">Esperada</th>
              <th className="text-center">Recibida</th>
              <th className="text-center">Diferencia</th>
              <th className="text-center">Estatus</th>
            </tr>
          </thead>
          <AnimatePresence>
            <motion.tbody
              initial="hidden"
              animate="visible"
              variants={{
                visible: { transition: { staggerChildren: 0.03 } },
              }}
            >
              {filteredItems.map((it) => {
                const rec = parseInt(it.quantityReceived, 10);
                const { variant, Icon, label } = computeStatus(
                  it.Cantidad,
                  rec
                );
                const diff = isNaN(rec) ? '—' : rec - it.Cantidad;
                return (
                  <motion.tr
                    key={it.Linenum}
                    layout
                    variants={{
                      hidden: { opacity: 0, y: 6 },
                      visible: { opacity: 1, y: 0 },
                    }}
                    whileHover={{ background: 'rgba(0,0,0,0.02)' }}
                    className={`table-${variant} table-opacity-10`}
                  >
                    <td>{it.Articulo}</td>
                    <td>{it.Descripcion}</td>
                    <td className="text-center">{it.Cantidad}</td>
                    <td className="text-center">
                      <Form.Control
                        type="number"
                        value={it.quantityReceived}
                        onChange={(e) =>
                          handleQtyChange(it.Linenum, e.target.value)
                        }
                        min={0}
                        style={{
                          width: 80,
                          margin: '0 auto',
                          textAlign: 'center',
                        }}
                      />
                    </td>
                    <td className="text-center fw-semibold">
                      <motion.span
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                      >
                        {diff === '—' || diff === 0
                          ? '—'
                          : diff > 0
                          ? `+${diff}`
                          : diff}
                      </motion.span>
                    </td>
                    <td className="text-center">
                      <motion.div
                        initial={{ scale: 0.7 }}
                        animate={{ scale: 1 }}
                        className={`d-inline-flex align-items-center px-2 py-1 badge bg-${variant}`}
                        style={{ borderRadius: 12, fontSize: '0.85em' }}
                      >
                        <Icon className="me-1" />
                        {label}
                      </motion.div>
                    </td>
                  </motion.tr>
                );
              })}
            </motion.tbody>
          </AnimatePresence>
        </Table>
      </motion.div>

      {/* Botón para confirmar datos y pasar a preview */}
      <div className="text-end mt-3">
        <Button variant="primary" onClick={handleOpenConfirmModal}>
          Confirmar Datos
        </Button>
      </div>

      {/* Modal de confirmación */}
      <Modal
        show={showConfirmModal}
        onHide={() => setShowConfirmModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Confirmar Datos</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          ¿Confirmas que las cantidades ingresadas son correctas? Serás
          dirigido a la previsualización.
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowConfirmModal(false)}
          >
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleProceedToPreview}>
            Confirmar Datos
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
