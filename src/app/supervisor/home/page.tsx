// src/app/supervisor/home/page.tsx

import { Container, Row, Col } from "react-bootstrap";
import KPICard from "@/components/dashboard/KPICard";

// Datos de ejemplo para el Supervisor, basados en tu diseño
const getSupervisorDashboardData = async () => {
  return {
    kpis: [
      { title: "Discrepancia Promedio Recepción", value: "2.1%" },
      { title: "Tiempo Promedio Traslado", value: "24 hrs" },
      { title: "Unidades en Inventario Total", value: "15,230" },
      { title: "Traslados Realizados (Total)", value: "45" },
    ],
  };
};

export default async function SupervisorHomePage() {
  const dashboardData = await getSupervisorDashboardData();

  return (
    <Container fluid>
      <div className="dashboard-section">
        <h2>Rendimiento Consolidado de Mis Tiendas</h2>
        <Row className="g-4 mt-2">
          {dashboardData.kpis.map((kpi) => (
            <Col md={6} lg={3} key={kpi.title}>
              <KPICard title={kpi.title} value={kpi.value} />
            </Col>
          ))}
        </Row>
      </div>
      {/* Aquí irán los gráficos y la tabla de gerentes en los siguientes pasos */}
    </Container>
  );
}