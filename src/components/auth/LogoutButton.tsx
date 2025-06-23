// src/components/auth/LogoutButton.tsx
"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Button, Modal } from "react-bootstrap";
import { PiSignOut } from "react-icons/pi"; // Importamos el mismo tipo de icono

export default function LogoutButton() {
  const [showModal, setShowModal] = useState(false);

  const handleLogout = () => {
    signOut({ callbackUrl: '/' });
  };

  return (
    <>
      {/* Este es ahora un enlace simple que abre el modal */}
      <a href="#" onClick={(e) => { e.preventDefault(); setShowModal(true); }}>
        <PiSignOut />
        <span>Cerrar Sesión</span>
      </a>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirmar Cierre de Sesión</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          ¿Estás seguro de que quieres cerrar tu sesión?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleLogout}>
            Sí, Cerrar Sesión
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}