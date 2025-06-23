// src/components/receptions/TransferDetailView.tsx
"use client";

import { useEffect, useState, useTransition, useRef, useMemo } from "react";
import {
  getTransferDetailsAction,
  TransferDetail,
  confirmReceptionAction,
} from "@/app/operaciones/receptions/actions";
import {
  Table,
  Spinner,
  Form,
  Button,
  Alert,
  InputGroup,
  Badge,
} from "react-bootstrap";
import { useActionState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type ReconciliationItem = TransferDetail & {
  quantityReceived: string;
};

export default function TransferDetailView({
  folioSAP,
  onBack,
}: {
  folioSAP: number;
  onBack: () => void;
}) {
  const [items, setItems] = useState<ReconciliationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tableSearch, setTableSearch] = useState("");

  const [isPending, startTransition] = useTransition();
  const [state, formAction] = useActionState(confirmReceptionAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    setIsLoading(true);
    getTransferDetailsAction(folioSAP).then((response) => {
      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        setItems(
          response.data.map((item) => ({
            ...item,
            quantityReceived: String(item.Cantidad),
          }))
        );
      }
      setIsLoading(false);
    });
  }, [folioSAP]);

  const computeStatus = (esperada: number, recibida: number) => {
    if (recibida === esperada)
      return { label: "Correcto", variant: "success" };
    if (recibida > esperada)
      return { label: "Excedente", variant: "warning", textDark: true };
    return { label: "Faltante", variant: "danger" };
  };

  const handleQuantityChange = (lineNum: number, newQuantity: string) => {
    setItems((current) =>
      current.map((it) =>
        it.Linenum === lineNum
          ? { ...it, quantityReceived: newQuantity }
          : it
      )
    );
  };

  const handleConfirm = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (formRef.current) {
      const formData = new FormData(formRef.current);
      startTransition(() => formAction(formData));
    }
  };

  // filtrado por Artículo, Descripción o Estatus
  const filteredItems = useMemo(() => {
    const term = tableSearch.trim().toLowerCase();
    return items.filter((it) => {
      const status = computeStatus(
        it.Cantidad,
        parseInt(it.quantityReceived) || 0
      ).label.toLowerCase();
      if (!term) return true;
      return (
        it.Articulo.toLowerCase().includes(term) ||
        it.Descripcion.toLowerCase().includes(term) ||
        status.includes(term)
      );
    });
  }, [items, tableSearch]);

  if (isLoading)
    return (
      <div className="text-center p-5">
        <Spinner animation="border" />{" "}
        <p>Cargando detalle del traslado...</p>
      </div>
    );
  if (error) return <Alert variant="danger">{error}</Alert>;

  // Variants para animar filas
  const rowVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        {/* Ahora el título va a la izquierda */}
        <h4>
          Conciliación de Mercancía (Folio SAP: {folioSAP})
        </h4>
        {/* Y el botón vuelve a la lista a la derecha */}
        <Button
          as={motion.button}
          variant="outline-secondary"
          onClick={onBack}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          ← Volver a la lista
        </Button>
      </div>

      {/* Buscador de tabla */}
      <InputGroup className="mb-3" style={{ maxWidth: 360 }}>
        <InputGroup.Text>🔍</InputGroup.Text>
        <Form.Control
          placeholder="Buscar Artículo / Desc / Estatus"
          value={tableSearch}
          onChange={(e) => setTableSearch(e.target.value)}
        />
      </InputGroup>

      <Form ref={formRef} onSubmit={handleConfirm}>
        <input type="hidden" name="folioSAP" value={folioSAP} />

        <Table
          striped
          bordered
          hover
          responsive
          className="align-middle"
          as={motion.div}
          layout
        >
          <thead>
            <tr>
              <th>Artículo</th>
              <th>Descripción</th>
              <th className="text-center">Cant. Esperada</th>
              <th className="text-center" style={{ maxWidth: "150px" }}>
                Cant. Recibida
              </th>
              <th className="text-center">Diferencia</th>
              <th className="text-center">Estatus</th>
            </tr>
          </thead>

          <AnimatePresence>
            <motion.tbody
              initial="hidden"
              animate="visible"
              variants={{
                visible: { transition: { staggerChildren: 0.04 } },
              }}
            >
              {filteredItems.map((item) => {
                const rec = parseInt(item.quantityReceived) || 0;
                const diff = rec - item.Cantidad;
                const status = computeStatus(item.Cantidad, rec);
                return (
                  <motion.tr
                    key={item.Linenum}
                    variants={rowVariants}
                    layout
                    whileHover={{
                      backgroundColor: "rgba(0,0,0,0.03)",
                      boxShadow: "0px 2px 8px rgba(0,0,0,0.1)"
                    }}
                  >
                    <td>{item.Articulo}</td>
                    <td>{item.Descripcion}</td>
                    <td className="text-center">{item.Cantidad}</td>
                    <td className="text-center">
                      <motion.div layout>
                        <Form.Control
                          type="number"
                          name={`items[${item.Linenum}][recibido]`}
                          value={item.quantityReceived}
                          onChange={(e) =>
                            handleQuantityChange(
                              item.Linenum,
                              e.target.value
                            )
                          }
                          min={0}
                          className="text-center"
                        />
                      </motion.div>
                    </td>
                    <td className="text-center fw-semibold">
                      <motion.span
                        key={diff}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                      >
                        {diff === 0 ? "-" : diff > 0 ? `+${diff}` : diff}
                      </motion.span>
                    </td>
                    <td className="text-center">
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                      >
                        <Badge
                          pill
                          bg={status.variant}
                          className={
                            status.textDark ? "text-dark" : ""
                          }
                          style={{ fontSize: ".9em", padding: "0.5em 0.75em" }}
                        >
                          {status.label}
                        </Badge>
                      </motion.div>
                    </td>
                  </motion.tr>
                );
              })}
            </motion.tbody>
          </AnimatePresence>
        </Table>

        {state?.message && (
          <Alert
            variant={state.success ? "success" : "danger"}
            className="mt-3"
          >
            {state.message}
          </Alert>
        )}

        <div className="d-flex justify-content-end mt-4">
          <Button
            variant="secondary"
            className="me-2"
            onClick={onBack}
            disabled={isPending}
            as={motion.button}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={isPending}
            as={motion.button}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            {isPending ? (
              <>
                <Spinner
                  as="span"
                  size="sm"
                  animation="border"
                  className="me-2"
                />
                Procesando...
              </>
            ) : (
              "Confirmar Recepción"
            )}
          </Button>
        </div>
      </Form>
    </div>
  );
}
