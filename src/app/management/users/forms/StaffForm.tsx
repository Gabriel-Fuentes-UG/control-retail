// File: src/app/management/users/forms/StaffForm.tsx
'use client';

import { useEffect, useState } from 'react';
import { useActionState } from 'react';
import { Form, InputGroup, Button, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { useRouter } from 'next/navigation';
import AnimatedToggleSwitch from '@/components/common/AnimatedToggleSwitch';
import { getAvailableRolesForStoreAction } from '../actions';
import Link from 'next/link';   


interface Role  { id: string; name: string; }
interface Store { id: string; name: string; }

interface StaffFormData {
  id?: string;
  fullName?: string;
  email?: string;
  roleId?: string;
  storeId?: string[];
  isActive?: boolean;
}

interface StaffFormProps {
  stores: Store[];
  roles: Role[];
  initialData?: StaffFormData;
  formAction: (prevState: any, formData: FormData) => Promise<{ success: boolean; error?: string }>;
}

export default function StaffForm({
  stores,
  roles,
  initialData,
  formAction
}: StaffFormProps) {
  const [state, submitAction, isPending] = useActionState(formAction, { success: false });
  const [selectedStoreId, setSelectedStoreId] = useState(initialData?.storeId ?? '');
  const [selectedRoleId, setSelectedRoleId]   = useState(initialData?.roleId    || '');
  const [availableRoles, setAvailableRoles]   = useState<Role[]>(roles);
  const [isLoadingRoles, setIsLoadingRoles]   = useState(false);
  const [needSupervisor, setNeedSupervisor]   = useState(false);
  const [loadingSync, setLoadingSync]         = useState(false);
  const [needsSupervisor, setNeedsSupervisor] = useState(false);
  const router = useRouter();

  // Carga dinámica de roles según tienda
useEffect(() => {
  if (!selectedStoreId) {
    setAvailableRoles(roles);
    setSelectedRoleId('');
    setNeedsSupervisor(false);
    return;
  }
  setIsLoadingRoles(true);
  getAvailableRolesForStoreAction(selectedStoreId)
    .then(rs => {
      // ¿Solo devolvió SUPERVISOR?
      const onlySupervisorRole = rs.length === 1 && rs[0].name === 'SUPERVISOR';
      setNeedsSupervisor(onlySupervisorRole);

      // Filtrar para STAFF (Gerente, Encargado, Vendedor)
      const filtered = rs.filter(r =>
        ['GERENTE','ENCARGADO','VENDEDOR'].includes(r.name)
      );
      setAvailableRoles(filtered);

      // Selección automática si queda uno
      if (filtered.length === 1) {
        setSelectedRoleId(filtered[0].id);
      } else if (!filtered.find(r => r.id === selectedRoleId)) {
        setSelectedRoleId('');
      }
    })
    .finally(() => setIsLoadingRoles(false));
}, [selectedStoreId, roles, selectedRoleId]);


  // Sincronización manual de tiendas
  const handleSync = async () => {
    setLoadingSync(true);
    await fetch('/api/sync-stores', { method: 'POST' });
    setLoadingSync(false);
    router.refresh();
  };

  return (
    <>
      <Form action={submitAction}>
        {initialData?.id && (
          <input type="hidden" name="id" value={initialData.id} />
        )}

        {state?.error && (
          <Alert variant="danger">{state.error}</Alert>
        )}

        <Row className="mb-3">
          <Col md={6}>
            <Form.Group controlId="fullName">
              <Form.Label>Nombre Completo</Form.Label>
              <Form.Control
                name="fullName"
                type="text"
                defaultValue={initialData?.fullName}
                required
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group controlId="email">
              <Form.Label>Correo Electrónico</Form.Label>
              <Form.Control
                name="email"
                type="email"
                defaultValue={initialData?.email}
                required
              />
            </Form.Group>
          </Col>
        </Row>

        <Row className="mb-3">
          <Col md={6}>
            <Form.Group controlId="password">
              <Form.Label>
                Contraseña{initialData?.id ? ' (dejar en blanco para no cambiar)' : ''}
              </Form.Label>
              <Form.Control
                name="password"
                type="password"
                placeholder="********"
                {...(initialData?.id ? {} : { required: true })}
              />
            </Form.Group>
          </Col>
          <Col md={6} className="d-flex align-items-center pt-4">
            <AnimatedToggleSwitch
              label="Usuario Activo"
              name="isActive"
              defaultChecked={initialData?.isActive ?? true}
            />
          </Col>
        </Row>

        {/* Selector de tienda y rol dinámico */}
        <Row className="mb-4">
          <Col md={6}>
            <Form.Group controlId="storeId">
              <Form.Label>Tienda Asignada</Form.Label>
              <InputGroup>
                <Form.Select
                  name="storeId"
                  value={selectedStoreId}
                  onChange={e => setSelectedStoreId(e.target.value)}
                  required
                >
                  <option value="">Selecciona una tienda…</option>
                  {stores.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </Form.Select>
                <Button
                  variant="outline-secondary"
                  onClick={handleSync}
                  disabled={loadingSync}
                >
                  {loadingSync
                    ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                    : 'Actualizar ⟳'
                  }
                </Button>
              </InputGroup>
              <input type="hidden" name="storeId" value={selectedStoreId} />
            </Form.Group>
          </Col>

          <Col md={6}>
            <Form.Group controlId="roleId">
              <Form.Label>Rol</Form.Label>
              <div className="d-flex align-items-center">
                <Form.Select
                  name="roleId"
                  value={selectedRoleId}
                  onChange={e => setSelectedRoleId(e.target.value)}
                  disabled={isLoadingRoles || !selectedStoreId}
                  required
                >
                  <option value="">
                    {isLoadingRoles
                      ? 'Cargando roles…'
                      : selectedStoreId
                        ? (availableRoles.length
                            ? 'Selecciona un rol…'
                            : 'No hay roles disponibles'
                          )
                        : 'Elige primero una tienda'
                    }
                  </option>
                  {availableRoles.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </Form.Select>
                {isLoadingRoles && (
                  <Spinner animation="border" size="sm" className="ms-2" />
                )}
              </div>
            </Form.Group>
          </Col>
        </Row>

        {/* Alerta si no hay roles válidos */}
        {/* justo después de tu <Row className="mb-4">…</Row> */}
        {needsSupervisor && (
          <Alert variant="warning">
            Esta tienda aún no tiene <b>Supervisor</b>.  
            <Link href="/management/users/new/supervisor">
              <a className="alert-link">Crear Supervisor</a>
            </Link>
          </Alert>
        )}

        {/* Botón de envío */}
        <Button
          variant="primary"
          type="submit"
          disabled={isPending || !selectedStoreId || availableRoles.length === 0}
        >
          {initialData?.id ? 'Guardar Cambios' : 'Crear Usuario'}
        </Button>
      </Form>
    </>
  );
}
