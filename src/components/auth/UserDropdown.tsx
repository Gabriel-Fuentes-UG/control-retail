// src/components/auth/UserDropdown.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import LogoutButton from "./LogoutButton";
import styles from './UserDropdown.module.css'; // Usaremos nuestro propio CSS
import { FaUserCircle } from "react-icons/fa";
// Importamos los iconos específicos que usaremos (Phosphor Icons)
import { PiUser, PiSignOut } from "react-icons/pi"; 

export default function UserDropdown() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Efecto para cerrar el dropdown si se hace clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);


  if (!session?.user) return null;

  return (
    <div className={styles.profileContainer} ref={dropdownRef}>
      {/* Botón que activa el menú */}
      <button className={styles.profileButton} onClick={() => setIsOpen(!isOpen)}>
        <FaUserCircle size={32} />
      </button>

      {/* Menú desplegable */}
      <div className={`${styles.profileDropdown} ${isOpen ? styles.active : ''}`}>
        <div className={styles.dropdownHeader}>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{session.user.name}</span>
            <span className={styles.userTitle}>{session.user.role}</span>
          </div>
        </div>

        <ul className={styles.dropdownSection}>
          {session.user.role !== 'ADMINISTRADOR' && (
            <li>
              <Link href="/profile">
                <PiUser />
                <span>Mi Perfil</span>
              </Link>
            </li>
          )}
        </ul>
        
        <ul className={styles.dropdownSection}>
          <li>
            {/* El LogoutButton ahora es solo el enlace, sin estilos propios */}
            <LogoutButton />
          </li>
        </ul>
      </div>
    </div>
  );
}