// Asumiendo que la ruta del archivo es: src/app/management/users/UserForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { useActionState } from 'react';
import { Form, Button, Row, Col, Alert, Spinner } from 'react-bootstrap';
// --- CORRECCIÓN: Se ajusta la ruta relativa para encontrar el archivo de acciones ---
import { getAvailableRolesForStoreAction } from '../actions';
// --- CORRECCIÓN: Se usa una ruta relativa para el componente del switch ---
import AnimatedToggleSwitch from '@/components/common/AnimatedToggleSwitch'; 

// --- Interfaces ---
interface Role { id: string; name: string }
interface Store { id: string; name: string; isActive: boolean }
interface UserFormData {
  id: string;
  name: string;
  email: string;
  roleId: string;
  storeId: string | null;
  isActive: boolean;
}
interface UserFormProps {
  roles: Role[];
  stores: Store[];
  user?: UserFormData;
  formAction: (prevState: any, formData: FormData) => Promise<{ success: boolean; error?: string }>;
  formType: 'supervisor' | 'staff' | 'edit';
}

export default function UserForm({
  roles: initialRoles,
  stores,
  user,
  formAction,
  formType,
}: UserFormProps) {
  const [state, submitAction, isPending] = useActionState(formAction, { success: false });

  // Estados para los campos controlados
  const [selectedStoreId, setSelectedStoreId] = useState(user?.storeId || '');
  const [selectedRoleId, setSelectedRoleId] = useState(user?.roleId || '');
  const [availableRoles, setAvailableRoles] = useState<Role[]>(initialRoles);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);

  // Efecto para la lógica dinámica de roles
  useEffect(() => {
    if (formType !== 'staff' || !selectedStoreId) {
      setAvailableRoles(initialRoles);
      return;
    }

    const fetchRoles = async () => {
      setIsLoadingRoles(true);
      const newRoles = await getAvailableRolesForStoreAction(selectedStoreId);
      setAvailableRoles(newRoles);
      if (newRoles.length === 1) {
        setSelectedRoleId(newRoles[0].id);
      } else if (!newRoles.find(r => r.id === selectedRoleId)) {
        setSelectedRoleId('');
      }
      setIsLoadingRoles(false);
    };

    fetchRoles();
  }, [selectedStoreId, formType, initialRoles, selectedRoleId]);

  return (
    <Form action={submitAction}>
      {state?.error && <Alert variant="danger">{state.error}</Alert>}

      {user && <input type="hidden" name="id" value={user.id} />}

      <Row className="mb-3">
        <Col md={6}>
          <Form.Group controlId="storeId">
            <Form.Label>Tienda Asignada</Form.Label>
            <Form.Select
              name="storeId"
              value={selectedStoreId || ''}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              disabled={formType === 'edit'}
            >
              <option value="">Selecciona una tienda…</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group controlId="roleId">
            <Form.Label>Rol</Form.Label>
            <div className="d-flex align-items-center">
              <Form.Select
                name="roleId"
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(e.target.value)}
                required
                disabled={isLoadingRoles || formType === 'edit'}
              >
                <option value="">
                  {isLoadingRoles ? 'Cargando...' : 'Selecciona un rol'}
                </option>
                {availableRoles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </Form.Select>
              {isLoadingRoles && <Spinner animation="border" size="sm" className="ms-2" />}
            </div>
          </Form.Group>
        </Col>
      </Row>

      <Row className="mb-3">
        <Col md={6}>
          <Form.Group controlId="name">
            <Form.Label>Nombre Completo</Form.Label>
            <Form.Control name="fullName" type="text" defaultValue={user?.name} required />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group controlId="email">
            <Form.Label>Correo Electrónico</Form.Label>
            <Form.Control name="email" type="email" defaultValue={user?.email} required />
          </Form.Group>
        </Col>
      </Row>

      <Row className="mb-3">
        <Col md={6}>
          <Form.Group controlId="password">
            <Form.Label>
              Contraseña {user ? ' (dejar en blanco para no cambiar)' : ''}
            </Form.Label>
            <Form.Control name="password" type="password" placeholder="********" {...(user ? {} : { required: true })} />
          </Form.Group>
        </Col>
        <Col md={6} className="d-flex align-items-center pt-3">
          <AnimatedToggleSwitch
            label="Usuario Activo"
            name="isActive"
            defaultChecked={user?.isActive ?? true}
          />
        </Col>
      </Row>

      <Button variant="primary" type="submit" disabled={isPending}>
        {isPending ? 'Procesando...' : user ? 'Guardar Cambios' : 'Crear Usuario'}
      </Button>
    </Form>
  );
}
