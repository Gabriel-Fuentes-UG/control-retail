// src/app/admin/users/UserActionButtons.tsx
"use client";

import { Button, Modal } from "react-bootstrap";
import Link from "next/link";
import { deleteUserAction, toggleUserStatusAction } from "./actions";
import { User } from "@prisma/client";
import { useActionState, useEffect, useState } from "react"; // <-- CAMBIO 1: Importación corregida

export default function UserActionButtons({ user }: { user: User }) {
  const [showToggleStatusModal, setShowToggleStatusModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // CAMBIO 2: Usamos useActionState
  const [toggleState, toggleAction] = useActionState(toggleUserStatusAction, undefined);
  const [deleteState, deleteAction] = useActionState(deleteUserAction, undefined);

  useEffect(() => { if (toggleState?.message) alert(toggleState.message); }, [toggleState]);
  useEffect(() => { if (deleteState?.message) alert(deleteState.message); }, [deleteState]);

  const handleDelete = (event: React.FormEvent<HTMLFormElement>) => {
    if (!window.confirm(`¿Estás seguro de que quieres eliminar al usuario "${user.name}"? Esta acción no se puede deshacer.`)) {
      event.preventDefault(); 
    }
  };

  return (
    <>
      <div className="d-flex gap-2">
        {/* CAMBIO 3: Nuevo patrón para el Link/Button */}
        <Link href={`/admin/users/edit/${user.id}`} passHref legacyBehavior>
          <Button variant="secondary" size="sm">
            Editar
          </Button>
        </Link>

        <Button variant={user.isActive ? "warning" : "success"} size="sm" onClick={() => setShowToggleStatusModal(true)}>
          {user.isActive ? 'Desactivar' : 'Activar'}
        </Button>

        <form action={deleteAction} onSubmit={handleDelete}>
          <input type="hidden" name="id" value={user.id} />
          <Button variant="danger" size="sm" type="submit">
            Eliminar
          </Button>
        </form>
      </div>
      {/* MODAL PARA ACTIVAR/DESACTIVAR */}
      <Modal show={showToggleStatusModal} onHide={() => setShowToggleStatusModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirmar Cambio de Estado</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          ¿Estás seguro de que quieres <strong>{user.isActive ? 'DESACTIVAR' : 'ACTIVAR'}</strong> al usuario "{user.name}"?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowToggleStatusModal(false)}>
            Cancelar
          </Button>
          <form action={toggleAction} onSubmit={() => setShowToggleStatusModal(false)}>
            <input type="hidden" name="id" value={user.id} />
            <input type="hidden" name="isActive" value={String(user.isActive)} />
            <Button 
              variant={user.isActive ? "warning" : "success"}
              type="submit"
            >
              Sí, {user.isActive ? 'Desactivar' : 'Activar'}
            </Button>
          </form>
        </Modal.Footer>
      </Modal>
      {/* MODAL PARA ELIMINAR */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirmar Eliminación</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          ¿Estás seguro de que quieres <strong>ELIMINAR PERMANENTEMENTE</strong> al usuario "{user.name}"? Esta acción no se puede deshacer.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancelar
          </Button>
          <form action={deleteAction} onSubmit={() => setShowDeleteModal(false)}>
            <input type="hidden" name="id" value={user.id} />
            <Button 
              variant="danger"
              type="submit"
            >
              Sí, Eliminar
            </Button>
          </form>
        </Modal.Footer>
      </Modal>
    </>
  );
}