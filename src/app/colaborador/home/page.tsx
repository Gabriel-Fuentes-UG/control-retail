// src/app/colaborador/page.tsx

import { Container, Row, Col } from "react-bootstrap";
import KPICard from "@/components/dashboard/KPICard";

// Simula la obtención de datos; sustituye por tu fetch real si aplica
async function fetchDashboardData() {
  return {
    kpis: [
      { title: "Pedidos Asignados", value: "12" },
      { title: "Tareas Pendientes", value: "5" },
      { title: "Recepciones Hoy", value: "3" },
      { title: "Traslados Asignados", value: "7" },
    ],
  };
}

export default async function StaffHomePage() {
  const { kpis } = await fetchDashboardData();

  return (
    <Container fluid>
      <div className="dashboard-section">
        <h2>Panel de Colaborador / Vendedor</h2>
        <Row className="g-4 mt-2">
          {kpis.map((kpi) => (
            <Col md={6} lg={3} key={kpi.title}>
              <KPICard title={kpi.title} value={kpi.value} />
            </Col>
          ))}
        </Row>
      </div>
    </Container>
  );
}
