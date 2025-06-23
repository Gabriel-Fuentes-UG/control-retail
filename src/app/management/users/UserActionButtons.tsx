"use client";

import { Button, Modal } from "react-bootstrap";
import Link from "next/link";
import { deleteUserAction, toggleUserStatusAction } from "./actions";
import { User } from "@prisma/client";
import { useActionState, useEffect, useState } from "react";

// El componente ahora acepta la función onActionSuccess y la marca como opcional
export default function UserActionButtons({ user, onActionSuccess }: { user: User, onActionSuccess?: () => void }) {
  const [showToggleStatusModal, setShowToggleStatusModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  
  const [toggleState, toggleAction] = useActionState(toggleUserStatusAction, undefined);
  const [deleteState, deleteAction] = useActionState(deleteUserAction, undefined);
  
  // Función para manejar la respuesta de las acciones
  const handleActionCompletion = (state: { message?: string, success?: boolean } | undefined) => {
    if (state?.message) {
      // Si la acción fue exitosa Y recibimos la función de refresco, la llamamos
      if (state.success && onActionSuccess) {
        onActionSuccess();
      }
      // Mostramos el modal de éxito/error de todas formas
      setModalMessage(state.message);
      setShowSuccessModal(true);
    }
  };

  useEffect(() => {
    handleActionCompletion(toggleState);
  }, [toggleState, onActionSuccess]);

  useEffect(() => {
    handleActionCompletion(deleteState);
  }, [deleteState, onActionSuccess]);

  return (
    <>
      <div className="d-flex gap-2">
        <Link href={`/management/users/edit/${user.id}`}>
          <Button variant="secondary" size="sm">Editar</Button>
        </Link>
        <Button variant={user.isActive ? "warning" : "success"} size="sm" onClick={() => setShowToggleStatusModal(true)}>
          {user.isActive ? 'Desactivar' : 'Activar'}
        </Button>
        <Button variant="danger" size="sm" onClick={() => setShowDeleteModal(true)}>
          Eliminar
        </Button>
      </div>

      <Modal show={showToggleStatusModal} onHide={() => setShowToggleStatusModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Confirmar Cambio de Estado</Modal.Title></Modal.Header>
        <Modal.Body>¿Estás seguro de que quieres <strong>{user.isActive ? 'DESACTIVAR' : 'ACTIVAR'}</strong> al usuario "{user.name}"?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowToggleStatusModal(false)}>Cancelar</Button>
          <form action={toggleAction} onSubmit={() => setShowToggleStatusModal(false)}>
            <input type="hidden" name="id" value={user.id} /><input type="hidden" name="isActive" value={String(user.isActive)} />
            <Button variant={user.isActive ? "warning" : "success"} type="submit">Sí, {user.isActive ? 'Desactivar' : 'Activar'}</Button>
          </form>
        </Modal.Footer>
      </Modal>

      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Confirmar Eliminación</Modal.Title></Modal.Header>
        <Modal.Body>¿Estás seguro de que quieres <strong>ELIMINAR PERMANENTEMENTE</strong> al usuario "{user.name}"? Esta acción no se puede deshacer.</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancelar</Button>
          <form action={deleteAction} onSubmit={() => setShowDeleteModal(false)}>
            <input type="hidden" name="id" value={user.id} />
            <Button variant="danger" type="submit">Sí, Eliminar</Button>
          </form>
        </Modal.Footer>
      </Modal>
      
      <Modal show={showSuccessModal} onHide={() => setShowSuccessModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Operación Realizada</Modal.Title></Modal.Header>
        <Modal.Body>{modalMessage}</Modal.Body>
        <Modal.Footer>
            <Button variant="primary" onClick={() => setShowSuccessModal(false)}>Entendido</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}