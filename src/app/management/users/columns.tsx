"use client";
import { ColumnDef } from "@tanstack/react-table";
import { UserWithRelations } from "@/lib/types";
import UserActionButtons from "./UserActionButtons";
import Link from "next/link";
import { Button } from "react-bootstrap";

export const columns: ColumnDef<UserWithRelations>[] = [
  { accessorKey: 'name', header: 'Nombre' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'role.name', header: 'Rol' },
  {
    id: 'tienda',
    header: 'Tienda Asignada',
    cell: ({ row }) => {
        const user = row.original;
        if (user.role.name === 'SUPERVISOR' && user.supervisedStores?.length > 0) {
            return ( <ul className="list-unstyled mb-0">{user.supervisedStores.map(ss => <li key={ss.store.id}>{ss.store.name}</li>)}</ul> );
        } else if (user.store) { return user.store.name; }
        return 'N/A';
    }
  },
  { accessorKey: 'isActive', header: 'Estado', cell: ({ getValue }) => getValue() ? 'Activo' : 'Inactivo' },
  {
    id: 'actions',
    header: 'Acciones',
    // La celda ahora tiene acceso a 'table', de donde podemos sacar 'meta'
    cell: ({ row, table }) => {
        const user = row.original;
        return user.role.name !== 'ADMINISTRADOR' ? ( 
          <UserActionButtons 
            user={user} 
            // Pasamos la función de refresco que viene en 'meta'
            onActionSuccess={table.options.meta?.refetchData}
          /> 
        ) : (
          <Link href={`/management/users/edit/${user.id}`}>
            <Button variant="secondary" size="sm">Editar</Button>
          </Link>
        );
    }
  }
];