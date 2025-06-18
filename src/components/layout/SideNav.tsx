// src/components/layout/SideNav.tsx
"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from './SideNav.module.css';

import { 
  FaTachometerAlt, FaUsers, FaUserTag, FaHome, FaBoxOpen, FaTruckLoading 
} from "react-icons/fa";

const allNavLinks = [
  { href: "/admin/home", text: "Inicio Admin", icon: <FaTachometerAlt />, requiredPermission: "reports:read:all-stores" },
  { href: "/admin/users", text: "Usuarios Admin", icon: <FaUsers />, requiredPermission: "users:read" }, // Le cambiamos el texto para diferenciar
  { href: "/admin/roles", text: "Roles", icon: <FaUserTag />, requiredPermission: "system:manage-roles" },
  
  // A los demás roles que pueden gestionar usuarios, los mandamos a una ruta genérica de gestión
   { href: "/management/users", text: "Gestionar Usuarios", icon: <FaUsers />, requiredPermission: "users:read" },
  
  { href: "/supervisor/home", text: "Inicio Supervisor", icon: <FaTachometerAlt />, requiredPermission: "reports:read:supervised-stores" },
  { href: "/gerente/home", text: "Inicio Gerente", icon: <FaTachometerAlt />, requiredPermission: "reports:read:own-store" },
  { href: "/colaborador/home", text: "Inicio", icon: <FaHome />, requiredPermission: "transfers:read" },
  { href: "/colaborador/receptions", text: "Recepciones", icon: <FaBoxOpen />, requiredPermission: "receptions:create" },
  { href: "/colaborador/transfers", text: "Traslados", icon: <FaTruckLoading />, requiredPermission: "transfers:create" },
];

export default function SideNav({ isCollapsed }: { isCollapsed: boolean }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const userPermissions = session?.user?.permissions || [];

  const availableLinks = allNavLinks.filter(link => 
    userPermissions.includes(link.requiredPermission)
  );

  return (
    <nav className={styles.sidebarNav}>
      <ul>
        {availableLinks.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
          const linkClasses = [ styles.navLink, isActive ? styles.active : '', isCollapsed ? styles.collapsedLink : '' ].join(' ');

          return (
            <li key={link.href} title={isCollapsed ? link.text : undefined}>
              <Link href={link.href} className={linkClasses}>
                {/* --- INICIO DE LA CORRECCIÓN --- */}
                {/* Envolvemos el icono y el texto en un único span */}
                <span className={styles.linkContent}>
                  <div className={styles.iconWrapper}>{link.icon}</div>
                  {!isCollapsed && <span className={styles.linkText}>{link.text}</span>}
                </span>
                {/* --- FIN DE LA CORRECCIÓN --- */}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}