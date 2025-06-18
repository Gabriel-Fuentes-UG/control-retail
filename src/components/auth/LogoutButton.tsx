// src/components/auth/LogoutButton.tsx

"use client";

import { signOut } from "next-auth/react";
import { Button } from "react-bootstrap";

export default function LogoutButton() {
  return (
    <Button 
      variant="outline-danger" 
      size="sm" 
      className="ms-3"
      onClick={() => signOut({ callbackUrl: '/' })} // Al cerrar sesión, redirige a la página principal
    >
      Cerrar Sesión
    </Button>
  );
}