// src/app/management/users/page.tsx
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Button, Form, Row, Col, Modal, Badge, Table, Spinner } from "react-bootstrap";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

import Breadcrumbs from "@/components/layout/Breadcrumbs";
import { UserWithRelations } from "@/lib/types";
import { getManagedUsersForClient, toggleUserStatusAction, deleteUserAction } from "./actions";
import { useSession } from "next-auth/react";
import LoadingIndicator from '@/components/common/LoadingIndicator';
import { Store } from "@prisma/client";

// --- Íconos SVG en línea ---
const EditIcon = ({ className = '' }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
);
const TrashIcon = ({ className = '' }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
);
const ToggleLeftIcon = ({ className = '' }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="1" y="5" width="22" height="14" rx="7" ry="7"></rect><circle cx="8" cy="12" r="3"></circle></svg>
);
const ToggleRightIcon = ({ className = '' }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="1" y="5" width="22" height="14" rx="7" ry="7"></rect><circle cx="16" cy="12" r="3"></circle></svg>
);

// --- Componente de Avatar ---
const UserAvatar = ({ name }: { name: string }) => {
    const initial = name ? name.charAt(0).toUpperCase() : '?';
    const a = name.charCodeAt(0) || 65;
    const b = name.charCodeAt(1) || 66;
    const hue = ((a + b) * 137.5) % 360;
    return <div className="user-avatar" style={{ backgroundColor: `hsl(${hue}, 50%, 90%)`, color: `hsl(${hue}, 40%, 40%)`}}>{initial}</div>;
};

// --- Variantes de Animación para la Tabla ---
const tableVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const rowVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 }
};

export default function UsersPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<UserWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [storeFilter, setStoreFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    const fetchedUsers = await getManagedUsersForClient();
    setUsers(fetchedUsers);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = useMemo(() => {
    let result = users;
    if (storeFilter !== "all") {
        result = result.filter(user => user.role.name === 'SUPERVISOR' ? user.supervisedStores.some(ss => ss.storeId === storeFilter) : user.storeId === storeFilter);
    }
    if (searchTerm) {
        const lowerCaseSearch = searchTerm.toLowerCase();
        result = result.filter(user => 
            user.name.toLowerCase().includes(lowerCaseSearch) || 
            user.email.toLowerCase().includes(lowerCaseSearch) ||
            user.role.name.toLowerCase().includes(lowerCaseSearch)
        );
    }
    return result;
  }, [users, storeFilter, searchTerm]);

  const availableStores = useMemo(() => {
    if (!session?.user?.role || (session.user.role !== 'SUPERVISOR' && session.user.role !== 'ADMINISTRADOR')) return [];
    const allStores = users.flatMap(u => u.store ? [u.store] : (u.supervisedStores?.map(ss => ss.store) || [])).filter((s): s is Store => !!s);
    return Array.from(new Map(allStores.map((s) => [s.id, s])).values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [users, session]);

  const handleToggleStatus = async (userId: string) => { 
      const formData = new FormData();
      formData.append('id', userId);
      await toggleUserStatusAction(null, formData);
      fetchUsers();
   };
  const handleDeleteClick = (userId: string) => {
      setUserToDelete(userId);
      setShowDeleteModal(true);
  };
  const handleConfirmDelete = async () => {
      if (userToDelete) {
          const formData = new FormData();
          formData.append('id', userToDelete);
          await deleteUserAction(null, formData);
          fetchUsers();
      }
      setShowDeleteModal(false);
      setUserToDelete(null);
  };
  const handleEditClick = (userId: string) => { router.push(`/management/users/edit/${userId}`); };

  const breadcrumbItems = [{ label: "Inicio", href: "/redirect-hub" }, { label: "Gestionar Personal" }];

  // --- LÓGICA CORREGIDA PARA EL BOTÓN "AGREGAR USUARIO" ---
  const addUserHref = useMemo(() => {
    // Si la sesión todavía está cargando, no hacemos nada.
    if (sessionStatus !== 'authenticated' || !session?.user?.role) {
      return '#';
    }
    // Si el rol es Administrador, va a la página de selección.
    if (session.user.role === 'ADMINISTRADOR') {
      return '/management/users/select-role';
    }
    // Para cualquier otro rol (Supervisor, Gerente), va directo a crear personal de tienda.
    return '/management/users/new/staff';
  }, [session, sessionStatus]);

  return (
    <>
      <div className="dashboard-section">
        <Breadcrumbs items={breadcrumbItems} />
        <div className="d-flex justify-content-between align-items-center my-4">
          <h2>Gestionar Personal</h2>
          {/* Se usa la nueva ruta dinámica y se deshabilita si la sesión no está lista */}
          <Link href={addUserHref} passHref legacyBehavior>
            <Button as="span" variant="primary" disabled={sessionStatus !== 'authenticated'}>
                Agregar Usuario
            </Button>
          </Link>
        </div>

        <Row className="mb-4 g-3">
            <Col md={4}>
                <Form.Group controlId="storeFilter">
                <Form.Label>Filtrar por Tienda</Form.Label>
                <Form.Select value={storeFilter} onChange={(e) => setStoreFilter(e.target.value)}>
                    <option value="all">Todas las tiendas</option>
                    {availableStores.map((store) => (<option key={store.id} value={store.id}>{store.name}</option>))}
                </Form.Select>
                </Form.Group>
            </Col>
            <Col md={4}>
                <Form.Group controlId="searchTerm">
                <Form.Label>Buscar</Form.Label>
                <Form.Control 
                    type="text"
                    placeholder="Nombre, email, rol..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                </Form.Group>
            </Col>
        </Row>
        
        {isLoading ? (
            <LoadingIndicator message="Cargando lista de usuarios..." />
        ) : (
            <div className="table-responsive">
                <Table className="align-middle modern-table">
                    <thead><tr><th>Nombre</th><th>Rol</th><th>Tienda Asignada</th><th className="text-center">Estado</th><th className="text-center">Acciones</th></tr></thead>
                    <motion.tbody variants={tableVariants} initial="hidden" animate="visible">
                        <AnimatePresence>
                            {filteredUsers.map(user => (
                            <motion.tr key={user.id} variants={rowVariants} layout>
                                <td><div className="d-flex align-items-center"><UserAvatar name={user.name} /><div className="ms-3"><div className="fw-bold">{user.name}</div><div className="text-muted">{user.email}</div></div></div></td>
                                <td><Badge pill bg="light" text="dark" className="role-badge">{user.role.name}</Badge></td>
                                <td>{user.store?.name || (user.role.name === 'SUPERVISOR' ? user.supervisedStores.map(s => s.store.name).join(', ') : 'N/A')}</td>
                                <td className="text-center"><Badge pill bg={user.isActive ? 'success-light' : 'secondary-light'} text={user.isActive ? 'success' : 'secondary'} className="status-badge">{user.isActive ? 'Activo' : 'Inactivo'}</Badge></td>
                                <td className="text-center"><div className="d-flex justify-content-center gap-2"><Button variant="outline-primary" size="sm" onClick={() => handleEditClick(user.id)} title="Editar"><EditIcon /></Button><Button variant={user.isActive ? "outline-warning" : "outline-success"} size="sm" onClick={() => handleToggleStatus(user.id)} title={user.isActive ? 'Desactivar' : 'Activar'}>{user.isActive ? <ToggleLeftIcon /> : <ToggleRightIcon />}</Button><Button variant="outline-danger" size="sm" onClick={() => handleDeleteClick(user.id)} title="Eliminar"><TrashIcon /></Button></div></td>
                            </motion.tr>
                            ))}
                        </AnimatePresence>
                    </motion.tbody>
                </Table>
            </div>
        )}
      </div>

      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Confirmar Eliminación</Modal.Title></Modal.Header>
        <Modal.Body>¿Estás seguro de que deseas eliminar a este usuario? Esta acción no se puede deshacer.</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancelar</Button>
          <Button variant="danger" onClick={handleConfirmDelete}>Sí, eliminar</Button>
        </Modal.Footer>
      </Modal>

      <style jsx global>{`
        .modern-table {
            border-collapse: separate;
            border-spacing: 0 10px;
        }
        .modern-table thead th {
            border: 0;
            color: #6c757d;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 0.8rem;
            letter-spacing: 0.5px;
        }
        .modern-table tbody tr {
            background-color: #fff;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
            transition: all 0.2s ease-in-out;
        }
        .modern-table tbody tr:hover {
            transform: translateY(-3px);
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        .modern-table td, .modern-table th {
            border: 0;
            vertical-align: middle;
        }
        .modern-table td:first-child {
            border-top-left-radius: 0.5rem;
            border-bottom-left-radius: 0.5rem;
        }
        .modern-table td:last-child {
            border-top-right-radius: 0.5rem;
            border-bottom-right-radius: 0.5rem;
        }
        .user-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1rem;
            font-weight: 600;
        }
        .status-badge {
            padding: 0.5em 0.8em;
        }
        .role-badge {
            font-size: 0.8rem;
            padding: 0.4em 0.7em;
        }
        .bg-success-light { background-color: #e6f7f0; }
        .bg-secondary-light { background-color: #f1f3f5; }
      `}</style>
    </>
  );
}