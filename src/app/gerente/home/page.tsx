// src/app/gerente/home/page.tsx
import { Container, Row, Col } from "react-bootstrap";
import KPICard from "@/components/dashboard/KPICard";

const getGerenteDashboardData = async () => {
  return {
    kpis: [
      { title: "Discrepancia Promedio Recepción", value: "1.5%" },
      { title: "Eficiencia de Traslados (Promedio)", value: "18 hrs" },
      { title: "Rotación de Inventario", value: "85%" },
      { title: "Traslados Entrantes Pendientes", value: "12" },
    ],
  };
};

export default async function GerenteHomePage() {
  const dashboardData = await getGerenteDashboardData();

  return (
    <Container fluid>
      <div className="dashboard-section">
        <h2>Rendimiento de Mi Tienda</h2>
        <Row className="g-4 mt-2">
          {dashboardData.kpis.map((kpi) => (
            <Col md={6} lg={3} key={kpi.title}>
              <KPICard title={kpi.title} value={kpi.value} />
            </Col>
          ))}
        </Row>
      </div>
      {/* Aquí irán los gráficos y tablas del gerente en el futuro */}
    </Container>
  );
}