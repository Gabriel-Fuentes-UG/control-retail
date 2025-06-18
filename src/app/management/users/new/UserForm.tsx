// src/app/admin/users/new/UserForm.tsx
"use client";

import { useState, useEffect } from "react";
import { useActionState } from "react";
import { Role, User as PrismaUser, SupervisorStores } from "@prisma/client";
import { StoreType } from "@/lib/data/stores";
import { Form, Button, Row, Col } from "react-bootstrap";

type UserWithRelations = PrismaUser & {
  role: Role;
  supervisedStores?: SupervisorStores[];
};

type FormAction = (prevState: any, formData: FormData) => Promise<{ message: string; } | undefined>;

type UserFormProps = {
  stores: StoreType[];
  roles: Role[];
  formAction: FormAction;
  user?: UserWithRelations | null;
};

export default function UserForm({ stores, roles, formAction, user }: UserFormProps) {
  const [state, action] = useActionState(formAction, undefined);
  const [selectedRoleId, setSelectedRoleId] = useState(user?.roleId || '');
  
  useEffect(() => {
    if (user?.roleId) { setSelectedRoleId(user.roleId); }
  }, [user]);

  const selectedRoleName = roles.find(r => r.id === selectedRoleId)?.name;
  const supervisedStoreIds = new Set(user?.supervisedStores?.map(s => s.storeId) || []);

  return (
    <Form action={action} className="mt-4">
      {user && <input type="hidden" name="id" value={user.id} />}

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3" controlId="name"><Form.Label>Nombre Completo</Form.Label><Form.Control type="text" name="name" required defaultValue={user?.name} /></Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3" controlId="email"><Form.Label>Correo Electrónico</Form.Label><Form.Control type="email" name="email" required defaultValue={user?.email} /></Form.Group>
        </Col>
      </Row>
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3" controlId="password">
            <Form.Label>Contraseña</Form.Label>
            <Form.Control 
              type="password" 
              name="password" 
              placeholder={user ? "Dejar en blanco para no cambiar" : "Contraseña"}
              required={!user}
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3" controlId="roleId">
            <Form.Label>Rol</Form.Label>
            <Form.Select name="roleId" required value={selectedRoleId} onChange={(e) => setSelectedRoleId(e.target.value)}>
              <option value="">Selecciona un rol...</option>
              {roles.map((role) => ( <option key={role.id} value={role.id}>{role.name}</option> ))}
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>

      {selectedRoleName === 'SUPERVISOR' ? (
        <Form.Group className="mb-3" controlId="stores">
          <Form.Label>Tiendas a Supervisar (Selecciona al menos una)</Form.Label>
          <div className="p-3 border rounded" style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {stores.map(store => (
              <Form.Check key={store.id} type="checkbox" id={`store-${store.id}`} name="storeIds" value={store.id} label={store.name} defaultChecked={supervisedStoreIds.has(store.id)} />
            ))}
          </div>
        </Form.Group>
      ) : selectedRoleName ? (
        <Form.Group className="mb-3" controlId="storeId">
          <Form.Label>Tienda Asignada (Obligatorio)</Form.Label>
          <Form.Select name="storeId" required defaultValue={user?.storeId || ''}>
            <option value="">Selecciona una tienda...</option>
            {stores.map((store) => ( <option key={store.id} value={store.id}>{store.name}</option> ))}
          </Form.Select>
        </Form.Group>
      ) : null}
      
      <Form.Check className="my-3" type="switch" id="isActive" name="isActive" label="Usuario Activo" defaultChecked={user?.isActive ?? true} />
      
      {state?.message && <p className="text-danger">{state.message}</p>}

      <div className="mt-4">
        <Button variant="primary" type="submit">
          {user ? 'Guardar Cambios' : 'Guardar Usuario'}
        </Button>
      </div>
    </Form>
  );
}