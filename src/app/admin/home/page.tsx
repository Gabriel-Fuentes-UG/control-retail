// src/app/admin/home/page.tsx

import { Container, Row, Col } from "react-bootstrap";
import KPICard from "@/components/dashboard/KPICard";
// Importaremos más componentes aquí en el futuro

// En un futuro, estos datos vendrán de una llamada a la API/base de datos
const getAdminDashboardData = async () => {
  return {
    kpis: [
      { title: "Cumplimiento SLAs Transporte", value: "98.5%" },
      { title: "Unidades en Tránsito Nacional", value: "350K" },
      { title: "Errores de Proveedor Promedio", value: "4.2%" },
      { title: "Tiendas Activas", value: "25" },
    ],
  };
};

export default async function AdminHomePage() {
  const dashboardData = await getAdminDashboardData();

  return (
    <Container fluid>
      {/* Por ahora no pondremos el WelcomeHeader, lo haremos un componente reutilizable después */}
      <div className="dashboard-section">
        <h2>Indicadores Clave de Rendimiento Global</h2>
        <Row className="g-4 mt-2">
          {dashboardData.kpis.map((kpi) => (
            <Col md={6} lg={3} key={kpi.title}>
              <KPICard title={kpi.title} value={kpi.value} />
            </Col>
          ))}
        </Row>
      </div>

      {/* Aquí añadiremos los gráficos y tablas en los siguientes pasos */}

    </Container>
  );
}