"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Card, Row, Col, Form } from "react-bootstrap";

interface Traslado {
  FolioSAP: number;
  Fecha: string;
  Estatus: string;
  AlmacenOrigen: string;
  NombreOrigen: string;
  // …otros campos
}

export default function Recepcion3PLPage() {
  const { data: session } = useSession();
  const [traslados, setTraslados] = useState<Traslado[]>([]);
  const [search, setSearch] = useState("");

  // Al montar (o cuando cambie session), traemos los traslados
  useEffect(() => {
    if (!session?.user?.storeId) return;
    const almacenDestino = session.user.storeId;
    fetch(
      `https://www.vectordelta.com.mx:81/UnionGroup/API/Query/Traslados/TrasladosATiendas/where?AlmacenDestino=${almacenDestino}`
    )
      .then((r) => r.json())
      .then((data: Traslado[]) => setTraslados(data))
      .catch(console.error);
  }, [session]);

  // Filtrado por folioSAP
  const filtered = search
    ? traslados.filter((t) => t.FolioSAP.toString().includes(search))
    : traslados;

  return (
    <>
      <h2>Recepción desde 3PL</h2>

      <Form.Control
        type="text"
        placeholder="Buscar por FolioSAP"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4"
      />

      <Row xs={1} md={2} lg={4} className="g-3">
        {filtered.map((t) => (
          <Col key={t.FolioSAP}>
            <Card
              className="h-100"
              onClick={() =>
                window.location.assign(
                  `/recepcion/3pl/${t.FolioSAP}` /* luego creas esta ruta dinámica */
                )
              }
            >
              <Card.Body>
                <Card.Title>Folio {t.FolioSAP}</Card.Title>
                <Card.Text>
                  Origen: {t.NombreOrigen} ({t.AlmacenOrigen})<br />
                  Fecha: {new Date(t.Fecha).toLocaleDateString()}
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </>
  );
}
