//src/components/receptions/IncomingTransfersList.tsx
'use client';

import { useEffect, useState, useMemo } from "react";
import {
  getIncomingTransfersAction,
  getSupervisorManagedStoresAction,
  IncomingTransfer
} from "@/app/operaciones/receptions/actions";
import { Row, Col, Form, InputGroup, Spinner, Card } from "react-bootstrap";
import { useSession } from "next-auth/react";
import TransferCard from "./TransferCard";
import { Store } from "@prisma/client";
import { AnimatePresence, motion } from "framer-motion";


// ① Importa react-select y su animador
import Select, { MultiValue, SingleValue } from "react-select";
import makeAnimated from "react-select/animated";

const animatedComponents = makeAnimated();

export default function IncomingTransfersList({
  onTransferSelect
}: {
  onTransferSelect: (folio: number) => void;
}) {
  const { data: session } = useSession();
  const [transfers, setTransfers]         = useState<IncomingTransfer[]>([]);
  const [managedStores, setManagedStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading]         = useState(true);
  const [searchTerm, setSearchTerm]       = useState("");
  const [storeFilter, setStoreFilter]     = useState<"all" | string>("all");
  const [originFilter, setOriginFilter]   = useState<string[]>([]);

  useEffect(() => {
    Promise.all([
      getIncomingTransfersAction(),
      getSupervisorManagedStoresAction()
    ]).then(([transferData, storeData]) => {
      setTransfers(transferData);
      setManagedStores(storeData);
      setIsLoading(false);
    });
  }, []);

  const uniqueOrigins = useMemo(
    () => Array.from(new Set(transfers.map((t) => t.NombreOrigen))),
    [transfers]
  );

  useEffect(() => {
    if (uniqueOrigins.length && originFilter.length === 0) {
      setOriginFilter(uniqueOrigins);
    }
  }, [uniqueOrigins]);

  const filteredTransfers = useMemo(() => {
    let results = transfers;
    if (storeFilter !== "all") {
      results = results.filter((t) => t.AlmacenDestino === storeFilter);
    }
    if (searchTerm) {
      results = results.filter((t) =>
        t.FolioSAP.toString().includes(searchTerm)
      );
    }
    if (originFilter.length > 0) {
      results = results.filter((t) =>
        originFilter.includes(t.NombreOrigen)
      );
    }
    return results;
  }, [transfers, storeFilter, searchTerm, originFilter]);

  const uniqueStores = useMemo(() => {
    if (session?.user?.role !== "SUPERVISOR") return [];
    const map = new Map<string, Store>();
    managedStores.forEach((s) => {
      if (!map.has(s.id)) map.set(s.id, s);
    });
    return Array.from(map.values());
  }, [managedStores, session]);

  if (isLoading) {
    return (
      <div className="text-center p-5">
        <Spinner animation="border" />{" "}
        <p>Buscando traslados pendientes...</p>
      </div>
    );
  }

  // Variants para animar la lista
  const container = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1 } }
  };
  const item = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  // ② Prepara las opciones para react-select
  const storeOptions = [
    { value: "all", label: "Todas Mis Tiendas" },
    ...uniqueStores.map((s) => ({ value: s.id, label: s.name })),
  ];

  const originOptions = uniqueOrigins.map((o) => ({
    value: o,
    label: o
  }));

  return (
    <div className="mt-4">
      <h4>Selecciona un Traslado Pendiente</h4>

      {/* FILTROS */}
      <Row className="mb-4 align-items-end">
        <Col md={4} lg={3}>
          <InputGroup as={motion.div} layout>
            <Form.Control
              placeholder="Buscar por Folio SAP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </Col>

        {/* Select animado para tienda */}
        {session?.user?.role === "SUPERVISOR" && uniqueStores.length > 0 && (
          <Col md={4} lg={3}>
            <motion.div layout>
              <Form.Label>Filtrar por Tienda</Form.Label>
              <Select
                components={animatedComponents}
                options={storeOptions}
                defaultValue={storeOptions[0]}
                onChange={(opt: SingleValue<{ value: string; label: string }>) =>
                  setStoreFilter(opt?.value || "all")
                }
                styles={{
                  control: (base) => ({ ...base, borderRadius: 20 }),
                }}
              />
            </motion.div>
          </Col>
        )}

        {/* Select múltiple animado para origen */}
        <Col md={4} lg={3}>
          <motion.div layout>
            <Form.Label>Filtrar por Origen</Form.Label>
            <Select
              components={animatedComponents}
              isMulti
              closeMenuOnSelect={false}
              options={originOptions}
              defaultValue={originOptions}
              onChange={(opts: MultiValue<{ value: string; label: string }>) =>
                setOriginFilter(opts.map(o => o.value))
              }
              styles={{
                control: (base) => ({ ...base, borderRadius: 20 }),
                multiValue: (base) => ({ ...base, backgroundColor: "#e0f7fa" })
              }}
            />
          </motion.div>
        </Col>
      </Row>

      {/* LISTADO ANIMADO */}
      <AnimatePresence>
        <motion.div
          className="row g-3"
          variants={container}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          {filteredTransfers.length > 0 ? (
            filteredTransfers.map((t) => (
              <motion.div
                key={t.FolioSAP}
                variants={item}
                layout
                whileHover={{
                  scale: 1.02,
                  boxShadow: "0px 4px 15px rgba(0,0,0,0.1)"
                }}
                className="col-md-6 col-lg-3"
              >
                <Card className="h-100 border-0">
                  <Card.Body as={motion.div} whileHover={{ scale: 1.03 }}>
                    <TransferCard
                      transfer={t}
                      onSelect={() => onTransferSelect(t.FolioSAP)}
                    />
                  </Card.Body>
                </Card>
              </motion.div>
            ))
          ) : (
            <Col>
              <p>No se encontraron traslados pendientes.</p>
            </Col>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
