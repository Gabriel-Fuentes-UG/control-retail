// src/components/receptions/TransferDetailView.tsx
'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  getTransferDetailsAction,
  TransferDetail,
  confirmReceptionAction,
  ReceptionState,
} from '@/app/operaciones/receptions/actions';
import {
  Table,
  Spinner,
  Form,
  Button,
  Alert,
  InputGroup,
} from 'react-bootstrap';
import { useActionState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiCheckCircle,
  FiAlertTriangle,
  FiXCircle,
} from 'react-icons/fi';

type ReconciliationItem = TransferDetail & {
  quantityReceived: string;
};

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

  // LÓGICA CORREGIDA: Se usa useActionState con el estado inicial y la acción del servidor.
  const [state, formAction, isPending] = useActionState<ReceptionState, FormData>(
    confirmReceptionAction,
    null
  );

  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  // LÓGICA CORREGIDA: Se redirige en el cliente cuando el estado de la acción es exitoso.
  useEffect(() => {
    if (state?.success) {
      const timer = setTimeout(() => {
        router.push(`/operaciones/receptions/preview/${folioSAP}`);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [state?.success, folioSAP, router]);

  // Cargar datos iniciales (sin cambios)
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

  // Calcular estatus (sin cambios)
  const computeStatus = (expected: number, received: number) => {
    if (received === expected) {
      return { label: 'Correcto', variant: 'success', Icon: FiCheckCircle };
    }
    if (received > expected) {
      return { label: 'Excedente', variant: 'warning', Icon: FiAlertTriangle };
    }
    return { label: 'Faltante', variant: 'danger', Icon: FiXCircle };
  };

  // Manejar cambio en la cantidad (sin cambios)
  const handleQtyChange = (linenum: number, val: string) => {
    setItems((cur) =>
      cur.map((it) =>
        it.Linenum === linenum ? { ...it, quantityReceived: val } : it
      )
    );
  };

  // Filtrar artículos (sin cambios)
  const filteredItems = useMemo(() => {
    const term = filter.trim().toLowerCase();
    if (!term) return items;

    return items.filter((it) => {
      const status = computeStatus(
        it.Cantidad,
        parseInt(it.quantityReceived) || 0
      ).label.toLowerCase();
      
      return (
        it.Articulo.toLowerCase().includes(term) ||
        it.Descripcion.toLowerCase().includes(term) ||
        status.includes(term)
      );
    });
  }, [items, filter]);

  // ESTILO ORIGINAL: Spinner de carga
  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" />
        <p className="mt-2">Cargando detalle...</p>
      </div>
    );
  }
  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  // ESTILO ORIGINAL: Variantes de animación de fila
  const rowVariants = {
    hidden: { opacity: 0, y: 6 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="mt-4">
      {/* ESTILO ORIGINAL: Header y botón de volver */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="m-0">Conciliación de Mercancía (Folio: {folioSAP})</h4>
        <Button variant="outline-secondary" onClick={onBack}>
          ← Volver
        </Button>
      </div>

      <InputGroup className="mb-3" style={{ maxWidth: 400 }}>
        <InputGroup.Text>🔍</InputGroup.Text>
        <Form.Control
          placeholder="Buscar artículo / estatus"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </InputGroup>

      {/* LÓGICA CORREGIDA: El form ahora usa el `action` del hook */}
      <Form ref={formRef} action={formAction}>
        <input type="hidden" name="folioSAP" value={folioSAP} />

        <motion.div layout>
          {/* ESTILO ORIGINAL: Tabla */}
          <Table striped hover responsive className="align-middle" style={{ borderRadius: 8, overflow: 'hidden' }}>
            <thead style={{ background: '#f8f9fa' }}>
              <tr>
                <th>Artículo</th>
                <th>Descripción</th>
                <th className="text-center">Cantidad Esperada</th>
                <th className="text-center">Cantidad Recibida</th>
                <th className="text-center">Diferencia</th>
                <th className="text-center">Estatus</th>
              </tr>
            </thead>
            {/* ESTILO ORIGINAL: Animación de tbody */}
            <AnimatePresence>
              <motion.tbody
                initial="hidden"
                animate="visible"
                variants={{
                  visible: { transition: { staggerChildren: 0.03 } },
                }}
              >
                {filteredItems.map((it) => {
                  const rec = parseInt(it.quantityReceived, 10) || 0;
                  const diff = rec - it.Cantidad;
                  const { variant, Icon, label } = computeStatus(it.Cantidad, rec);
                  return (
                    // ESTILO ORIGINAL: Animación de tr
                    <motion.tr
                      key={`${it.Linenum}-${it.Articulo}`}
                      layout
                      variants={rowVariants}
                      whileHover={{ background: 'rgba(0,0,0,0.02)' }}
                      className={`table-${variant} table-opacity-10`}
                    >
                      <td>{it.Articulo}</td>
                      <td>{it.Descripcion}</td>
                      <td className="text-center">{it.Cantidad}</td>
                      <td className="text-center">
                        <input type="hidden" name={`items[${it.Linenum}][articulo]`} value={it.Articulo} />
                        <input type="hidden" name={`items[${it.Linenum}][esperado]`} value={it.Cantidad} />
                        <Form.Control
                          type="number"
                          name={`items[${it.Linenum}][recibido]`}
                          value={it.quantityReceived}
                          onChange={(e) => handleQtyChange(it.Linenum, e.target.value)}
                          min={0}
                          style={{ width: 80, margin: '0 auto' }}
                        />
                      </td>
                      <td className="text-center fw-semibold">
                        <motion.span initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.05 }}>
                          {diff === 0 ? '-' : diff > 0 ? `+${diff}` : diff}
                        </motion.span>
                      </td>
                      <td className="text-center">
                        {/* ESTILO ORIGINAL: Badge de estatus */}
                        <motion.div
                          initial={{ scale: 0.7, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.1 }}
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

        {/* LÓGICA CORREGIDA: Alerta para mostrar errores del servidor */}
        <AnimatePresence>
            {state?.error && (
                <motion.div initial={{opacity: 0, y:10}} animate={{opacity: 1, y:0}} exit={{opacity: 0, y:10}}>
                    <Alert variant="danger" className="mt-3">
                        <FiAlertTriangle className="me-2"/> <strong>Error al guardar:</strong> {state.error}
                    </Alert>
                </motion.div>
            )}
        </AnimatePresence>
        
        {/* ESTILO ORIGINAL: Botones de acción */}
        <div className="text-end mt-3">
          <Button variant="secondary" onClick={onBack} disabled={isPending} className="me-2">
            Cancelar
          </Button>
          <Button variant="primary" type="submit" disabled={isPending}>
            {isPending ? 'Procesando...' : 'Confirmar Recepción'}
          </Button>
        </div>
      </Form>
    </div>
  );
}
