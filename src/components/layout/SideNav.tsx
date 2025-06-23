// src/components/layout/SideNav.tsx
"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from './SideNav.module.css';
import { 
  FaHome, 
  FaUsers, 
  FaUserTag, 
  FaBoxOpen, 
  FaTruckLoading 
} from "react-icons/fa";

// Lista de enlaces a FUNCIONALIDADES (hemos quitado todos los de "Inicio")
const functionalNavLinks = [
  { href: "/management/users", text: "Gestionar Personal", icon: <FaUsers />, requiredPermission: "users:read" },
  { href: "/admin/roles", text: "Roles y Permisos", icon: <FaUserTag />, requiredPermission: "system:manage-roles" },
  
  { href: "/operaciones/receptions", text: "Recepciones", icon: <FaBoxOpen />, requiredPermission: "receptions:create" },
  { href: "/operaciones/transfers", text: "Traslados", icon: <FaTruckLoading />, requiredPermission: "transfers:create" },

];

export default function SideNav({ isCollapsed }: { isCollapsed: boolean }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const userPermissions = session?.user?.permissions || [];

  // 1. Filtramos los enlaces funcionales según los permisos del usuario
  let availableLinks = functionalNavLinks.filter(link => 
    userPermissions.includes(link.requiredPermission)
  );

  // 2. Creamos el enlace de "Inicio" dinámicamente y lo ponemos al principio de la lista
  if (session?.user?.homeRoute) {
    const homeLink = {
      href: session.user.homeRoute,
      text: "Inicio",
      icon: <FaHome />,
    };
    availableLinks.unshift(homeLink);
  }

  return (
    <nav className={styles.sidebarNav}>
      <ul>
        {availableLinks.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
          const linkClasses = [
            styles.navLink,
            isActive ? styles.active : '',
            isCollapsed ? styles.collapsedLink : ''
          ].join(' ').trim();

          return (
            <li key={link.href} title={isCollapsed ? link.text : undefined}>
              <Link href={link.href} className={linkClasses}>
                <span className={styles.linkContent}>
                  <div className={styles.iconWrapper}>{link.icon}</div>
                  {!isCollapsed && <span className={styles.linkText}>{link.text}</span>}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
