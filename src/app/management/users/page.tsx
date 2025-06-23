"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Button, Form, Row, Col } from "react-bootstrap";
import Link from "next/link";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import DataTable from "@/components/common/DataTable";
import { columns } from "./columns";
import { UserWithRelations } from "@/lib/types";
import { getManagedUsersForClient } from "./actions";
import { useSession } from "next-auth/react";
import LoadingIndicator from "@/components/common/LoadingIndicator";
import { Store } from "@prisma/client";

export default function UsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<UserWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [storeFilter, setStoreFilter] = useState<string>('all');

  const fetchUsers = useCallback(async () => {
    // No ponemos setIsLoading aquí para que el refresco sea más sutil
    const fetchedUsers = await getManagedUsersForClient();
    setUsers(fetchedUsers);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = useMemo(() => {
    if (storeFilter === "all") return users;
    return users.filter(user => {
        if (user.role.name === 'SUPERVISOR') {
            return user.supervisedStores.some(ss => ss.storeId === storeFilter);
        }
        return user.storeId === storeFilter;
    });
  }, [users, storeFilter]);

  const availableStores = useMemo(() => {
    if (!session?.user?.role || (session.user.role !== 'SUPERVISOR' && session.user.role !== 'ADMINISTRADOR')) return [];
    const allStores = users.flatMap(u => u.store ? [u.store] : (u.supervisedStores?.map(ss => ss.store) || [])).filter((s): s is Store => !!s);
    return Array.from(new Map(allStores.map((s) => [s.id, s])).values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [users, session]);

  if (isLoading) return <LoadingIndicator />;

  const breadcrumbItems = [{ label: "Inicio", href: "/redirect-hub" }, { label: "Gestionar Personal" }];

  return (
    <div className="dashboard-section">
      <Breadcrumbs items={breadcrumbItems} />
      <div className="d-flex justify-content-between align-items-center my-4">
        <h2>Gestionar Personal</h2>
        <Link href="/management/users/new"><Button variant="primary">Agregar Usuario</Button></Link>
      </div>

      {(session?.user?.role === "SUPERVISOR" || session?.user?.role === "ADMINISTRADOR") && availableStores.length > 0 && (
        <Row className="mb-4">
          <Col md={4}>
            <Form.Group controlId="storeFilter">
              <Form.Label>Filtrar por Tienda</Form.Label>
              <Form.Select value={storeFilter} onChange={(e) => setStoreFilter(e.target.value)}>
                <option value="all">Todas las tiendas</option>
                {availableStores.map((store) => (<option key={store.id} value={store.id}>{store.name}</option>))}
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>
      )}

      {/* Le pasamos la función de refresco a la DataTable a través de 'meta' */}
      <DataTable columns={columns} data={filteredUsers} meta={{ refetchData: fetchUsers }} />
    </div>
  );
}