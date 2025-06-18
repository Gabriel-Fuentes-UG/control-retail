// src/app/admin/users/columns.tsx
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { User, Role, Store, SupervisorStores } from "@prisma/client";
import UserActionButtons from "./UserActionButtons";
import Link from "next/link";
import { Button } from "react-bootstrap";


// Definimos un tipo que incluye las relaciones que cargamos
// Esta es la versión corregida y más completa
type UserWithRelations = User & {
    role: Role;
    store: Store | null;
    supervisedStores: (SupervisorStores & {
        store: Store;
    })[];
};

export const columns: ColumnDef<UserWithRelations>[] = [
  {
    accessorKey: 'name',
    header: 'Nombre',
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'role.name',
    header: 'Rol',
  },
  {
    id: 'tienda',
    header: 'Tienda Asignada',
    // Celda personalizada para mostrar la tienda correcta
    cell: ({ row }) => {
        const user = row.original;
        if (user.role.name === 'SUPERVISOR' && user.supervisedStores.length > 0) {
            return (
              <ul className="list-unstyled mb-0">
                {/* Usamos ss.store.id porque ahora el tipo es correcto */}
                {user.supervisedStores.map(ss => <li key={ss.store.id}>{ss.store.name}</li>)}
              </ul>
            );
        } else if (user.store) {
            return user.store.name;
        }
        return 'N/A';
    }
  },
  {
    accessorKey: 'isActive',
    header: 'Estado',
    cell: ({ getValue }) => getValue() ? 'Activo' : 'Inactivo',
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => {
        const user = row.original;
        return user.role.name !== 'ADMINISTRADOR' ? (
          <UserActionButtons user={user} />
        ) : (
          <Link href={`/admin/users/edit/${user.id}`} passHref legacyBehavior>
            <Button as="a" variant="secondary" size="sm">Editar</Button>
          </Link>
        );
    }
  }
];