// src/app/operaciones/consultations/page.tsx
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import ProcessedTransfersList from "@/components/receptions/ProcessedTransfersList";

export default function ConsultationPage() {
    const breadcrumbItems = [
        { label: "Inicio", href: "/redirect-hub" },
        { label: "Operaciones" },
        { label: "Consulta de Recepciones" },
    ];
    
    return (
        <div className="dashboard-section">
            <Breadcrumbs items={breadcrumbItems} />
            <div className="d-flex justify-content-between align-items-center my-4">
                <h2>Consulta de Recepciones Procesadas</h2>
            </div>
            {/* Este es el componente que faltaba. Lo crearemos a continuación. */}
            <ProcessedTransfersList />
        </div>
    );
}
