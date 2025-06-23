// src/app/management/users/edit/[id]/page.tsx
"use client";

import { useEffect, useState, use } from "react";
import { getEditPageData, updateUserAction } from "../../actions";
import { UserWithRelations } from "@/lib/types";
import { Role, Store } from "@prisma/client";
import LoadingIndicator from "@/components/common/LoadingIndicator";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import UserForm from "@/app/management/users/new/UserForm";
import { Alert } from "react-bootstrap";

export default function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  // Usamos React.use() para acceder a los params en un Componente de Cliente
  const { id } = use(params);

  // Estados para manejar los datos y la carga
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageData, setPageData] = useState<{
    userToEdit: UserWithRelations;
    availableStores: Store[];
    availableRoles: Role[];
  } | null>(null);

  useEffect(() => {
    // Pedimos los datos al servidor cuando el componente se monta
    getEditPageData(id)
      .then(data => {
        if (!data.userToEdit) {
            setError("Usuario no encontrado.");
        } else {
            setPageData(data);
        }
      })
      .catch(err => {
        console.error(err);
        setError("No se pudieron cargar los datos para editar el usuario.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [id]);

  if (isLoading) {
    return <LoadingIndicator />;
  }
  
  if (error || !pageData) {
    return (
        <div className="dashboard-section">
             <Alert variant="danger">{error || "No se encontraron datos para este usuario."}</Alert>
        </div>
    );
  }
  
  const breadcrumbItems = [
    { label: "Inicio", href: "/redirect-hub" },
    { label: "Gestionar Personal", href: "/management/users" },
    { label: `Editar ${pageData.userToEdit.name}` },
  ];

  return (
    <div className="dashboard-section">
      <Breadcrumbs items={breadcrumbItems} />
      <h2 className="my-4">Editar Usuario: {pageData.userToEdit.name}</h2>
      <UserForm 
        stores={pageData.availableStores} 
        roles={pageData.availableRoles} 
        formAction={updateUserAction} 
        user={pageData.userToEdit}
      />
    </div>
  );
}