// src/app/management/users/new/UserForm.tsx
'use client'

import React, { useState, useEffect } from "react"
import { Form, Button, Row, Col } from "react-bootstrap"
import { CreateUserData, UpdateUserData } from "../actions"

interface Role  { id: string; name: string }
interface Store { id: string; name: string; isActive: boolean }

// Definimos un tipo unificado para New vs Edit
interface UserFormProps {
  roles: Role[]
  stores: Store[]
  // Si viene `user`, es edición; si no, es creación
  user?: {
    id: string
    name: string
    email: string
    roleId: string
    storeId: string
    isActive: boolean
  }
  // Según sea new/edit, apuntamos a la action correspondiente
  formAction: (formData: FormData) => Promise<any>
}

export default function UserForm({ roles, stores, user, formAction }: UserFormProps) {
  const [name,    setName]    = useState("")
  const [email,   setEmail]   = useState("")
  const [password,setPassword]= useState("")
  const [roleId,  setRoleId]  = useState("")
  const [storeId, setStoreId] = useState("")
  const [isActive,setIsActive]= useState(true)

  // Al montar (o cuando cambie `user`), poblamos los estados
  useEffect(() => {
    if (user) {
      setName(user.name)
      setEmail(user.email)
      setRoleId(user.roleId)
      setStoreId(user.storeId)
      setIsActive(user.isActive)
      // dejamos password en blanco para no forzar cambio
      setPassword("")
    }
  }, [user])

  return (
   <Form action={formAction}>
    {/* ← Campo oculto para el id (sólo en edición) */}
    {user && (
      <input type="hidden" name="id" value={user.id} />
    )}
      <Row className="mb-3">
        <Col md={6}>
          <Form.Group controlId="name">
            <Form.Label>Nombre Completo</Form.Label>
            <Form.Control
              name="fullName"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
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
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </Form.Group>
        </Col>
      </Row>

      {/* Contraseña solo en edición es opcional */}
      <Row className="mb-3">
        <Col md={6}>
          <Form.Group controlId="password">
            <Form.Label>
              Contraseña
              {user ? " (dejar en blanco para no cambiar)" : ""}
            </Form.Label>
            <Form.Control
              name="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="********"
              // required solo si NO es edición
              {...(user ? {} : { required: true })}
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group controlId="roleId">
            <Form.Label>Rol</Form.Label>
            <Form.Select
              name="roleId"
              value={roleId}
              onChange={e => setRoleId(e.target.value)}
              required
            >
              <option value="">Selecciona un rol…</option>
              {roles.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>

      <Row className="mb-3">
        <Col md={6}>
          <Form.Group controlId="storeId">
            <Form.Label>Tienda Asignada</Form.Label>
            <Form.Select
              name="storeId"
              value={storeId}
              onChange={e => setStoreId(e.target.value)}
              required
            >
              <option value="">Selecciona una tienda…</option>
              {stores.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={6} className="d-flex align-items-center">
          <Form.Group controlId="isActive" className="w-100">
            <Form.Check
              type="switch"
              name="isActive"
              label="Usuario Activo"
              checked={isActive}
              onChange={e => setIsActive(e.target.checked)}
            />
          </Form.Group>
        </Col>
      </Row>

      <Button variant="primary" type="submit">
        {user ? "Guardar Cambios" : "Crear Usuario"}
      </Button>
    </Form>
  )
}
