// src/app/management/users/columns.tsx
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { User, Role, Store, SupervisorStores } from "@prisma/client";
import UserActionButtons from "./UserActionButtons";
import Link from "next/link";
import { Button } from "react-bootstrap";

// Definición de tipo corregida para incluir todos los datos necesarios
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
    cell: ({ row }) => {
        const user = row.original;
        if (user.role.name === 'SUPERVISOR' && user.supervisedStores.length > 0) {
            return (
              <ul className="list-unstyled mb-0">
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
          <Link href={`/management/users/edit/${user.id}`} legacyBehavior>
            <Button variant="secondary" size="sm">Editar</Button>
          </Link>
        );
    }
  }
];