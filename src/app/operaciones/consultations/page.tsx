// src/app/operaciones/consultations/page.tsx
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import ProcessedTransfersList from "@/components/receptions/ProcessedTransfersList";

export default function ConsultationPage() {
    const breadcrumbItems = [
        { label: "Inicio", href: "/redirect-hub" },
        { label: "Operaciones", href: "#" }, // No es un enlace clickeable
        { label: "Consulta de Recepciones" },
    ];
    
    return (
        <div className="dashboard-section">
            <Breadcrumbs items={breadcrumbItems} />
            <div className="d-flex justify-content-between align-items-center my-4">
                <h2>Consulta de Recepciones Procesadas</h2>
            </div>
            {/* Este componente cliente es el que mostrará la lista y los filtros.
                Si no lo tienes, el siguiente error que verás será sobre este componente. */}
            <ProcessedTransfersList />
        </div>
    );
}
