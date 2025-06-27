// File: src/app/management/users/forms/StaffForm.tsx
'use client';

import { useState } from 'react';
import { useActionState } from 'react';
import { Form, Button, Row, Col, Alert } from 'react-bootstrap';
import AnimatedToggleSwitch from '@/components/common/AnimatedToggleSwitch';

interface Role  { id: string; name: string; }
interface Store { id: string; name: string; }

interface StaffFormData {
  id?: string;
  fullName?: string;
  email?: string;
  roleId?: string;
  storeIds?: string[];  // Un array, pero para staff usaremos sólo el primer elemento
  isActive?: boolean;
}

interface StaffFormProps {
  stores: Store[];
  roles: Role[];
  initialData?: StaffFormData;
  formAction: (prevState: any, formData: FormData) => Promise<{ success: boolean; error?: string }>;
}

export default function StaffForm({ stores, roles, initialData, formAction }: StaffFormProps) {
  const [state, submitAction, isPending] = useActionState(formAction, { success: false });
  const [selectedStoreId, setSelectedStoreId] = useState(initialData?.storeIds?.[0] || '');
  const [selectedRoleId, setSelectedRoleId] = useState(initialData?.roleId || '');

  return (
    <Form action={submitAction}>
      {/* Si existe initialData.id, estamos en edición */}
      {initialData?.id && <input type="hidden" name="id" value={initialData.id} />}

      {state?.error && <Alert variant="danger">{state.error}</Alert>}

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
              Contraseña{initialData?.id? ' (dejar en blanco para no cambiar)' : ''}
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

      {/* Selector único de tienda */}
      <Row className="mb-4">
        <Col md={6}>
          <Form.Group controlId="storeId">
            <Form.Label>Tienda Asignada</Form.Label>
            <Form.Select
              name="storeIds"
              value={selectedStoreId}
              onChange={e => setSelectedStoreId(e.target.value)}
              required
            >
              <option value="">Selecciona una tienda...</option>
              {stores.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </Form.Select>
            {/* Hidden para enviar el ID */}
            <input type="hidden" name="storeIds" value={selectedStoreId} />
          </Form.Group>
        </Col>

        <Col md={6}>
          <Form.Group controlId="roleId">
            <Form.Label>Rol</Form.Label>
            <Form.Select
              name="roleId"
              value={selectedRoleId}
              onChange={e => setSelectedRoleId(e.target.value)}
              required
            >
              <option value="">Selecciona un rol...</option>
              {roles.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>

      <Button variant="primary" type="submit" disabled={isPending}>
        {initialData?.id ? 'Guardar Cambios' : 'Crear Usuario'}
      </Button>
    </Form>
  );
}
