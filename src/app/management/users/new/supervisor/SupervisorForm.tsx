// src/app/management/users/new/supervisor/SupervisorForm.tsx
'use client';

import { useState } from 'react';
import { useActionState } from 'react';
import { Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { motion } from 'framer-motion';

// --- CORRECCIÓN: Se ajustan las rutas para que sean relativas y evitar errores de resolución ---
import StoreSelector from '../../../../../components/common/StoreSelector';
import AnimatedToggleSwitch from '../../../../../components/common/AnimatedToggleSwitch';

interface Store {
  id: string;
  name: string;
}

interface SupervisorFormProps {
    stores: Store[];
    supervisorRoleId: string; // Recibimos el ID del rol como prop
    formAction: (prevState: any, formData: FormData) => Promise<{ success: boolean; error?: string }>;
}

export default function SupervisorForm({ stores, supervisorRoleId, formAction }: SupervisorFormProps) {
  // Hook para manejar el estado de la acción del formulario
  const [state, submitAction, isPending] = useActionState(formAction, { success: false });
  // Estado para guardar los IDs de las tiendas seleccionadas
  const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Form action={submitAction}>
        {/* Campo oculto para enviar siempre el ID del rol de Supervisor.
            Recibe su valor de forma segura desde las props. */}
        <input type="hidden" name="roleId" value={supervisorRoleId} />

        {/* Campos ocultos que se actualizan dinámicamente para cada tienda seleccionada */}
        {selectedStoreIds.map(storeId => (
          <input key={storeId} type="hidden" name="storeId" value={storeId} />
        ))}
        
        {state?.error && <Alert variant="danger">{state.error}</Alert>}

        <p className="text-muted mb-4">
          Completa los datos del nuevo supervisor y selecciona las tiendas que estarán bajo su cargo.
        </p>

        <Row className="mb-4">
          <Col md={6}>
            <Form.Group controlId="name">
              <Form.Label>Nombre Completo</Form.Label>
              <Form.Control name="fullName" type="text" placeholder="Ej: Juan Pérez" required />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group controlId="email">
              <Form.Label>Correo Electrónico</Form.Label>
              <Form.Control name="email" type="email" placeholder="ejemplo@uniongroup.com" required />
            </Form.Group>
          </Col>
        </Row>

        <Row className="mb-4">
            <Col md={6}>
            <Form.Group controlId="password">
                <Form.Label>Contraseña</Form.Label>
                <Form.Control name="password" type="password" placeholder="********" required />
            </Form.Group>
            </Col>
            <Col md={6} className="d-flex align-items-center pt-3">
              <AnimatedToggleSwitch 
                label="Usuario Activo"
                name="isActive"
                defaultChecked={true}
              />
            </Col>
        </Row>
        
        <hr className="my-4" />

        {/* Componente dinámico e interactivo para seleccionar tiendas */}
        <StoreSelector 
          stores={stores} 
          onSelectionChange={setSelectedStoreIds}
        />

        <div className="mt-4">
          <Button variant="primary" type="submit" disabled={isPending || selectedStoreIds.length === 0}>
            {isPending ? 'Creando Usuario...' : 'Crear Supervisor'}
          </Button>
        </div>
      </Form>
    </motion.div>
  );
}
