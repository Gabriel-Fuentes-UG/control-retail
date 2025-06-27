'use client';

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
    getProcessedTransfersAction, 
    ProcessedTransfer 
} from "@/app/operaciones/receptions/actions";
import { Table, Spinner, Form, InputGroup, Badge, Button } from "react-bootstrap";
import { motion, AnimatePresence } from "framer-motion";
import styles from './ProcessedTransfersList.module.css';
import { FiCheckCircle, FiAlertTriangle, FiXCircle } from "react-icons/fi";

export default function ProcessedTransfersList() {
    const [transfers, setTransfers] = useState<ProcessedTransfer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const router = useRouter();

    useEffect(() => {
        setIsLoading(true);
        getProcessedTransfersAction().then(data => {
            setTransfers(data);
            setIsLoading(false);
        }).catch(err => {
            console.error("Error al cargar las recepciones procesadas:", err);
            setIsLoading(false);
        });
    }, []);

    const getStatusStyle = (statusName: string) => {
        switch (statusName) {
            case 'CERRADO': 
                return { variant: 'success', Icon: FiCheckCircle, text: 'Completo' };
            case 'RECIBIDO_PARCIAL': 
                return { variant: 'warning', Icon: FiAlertTriangle, text: 'Parcial' };
            case 'CANCELADO': 
                return { variant: 'danger', Icon: FiXCircle, text: 'Cancelado' };
            default: 
                return { variant: 'secondary', Icon: FiAlertTriangle, text: statusName };
        }
    };

    const uniqueStatuses = useMemo(() => {
        const statuses = new Map<string, string>();
        transfers.forEach(t => {
            // CORRECCIÓN: Usamos la misma función de estilo para obtener el texto correcto para el filtro
            const style = getStatusStyle(t.status.name);
            statuses.set(t.status.name, style.text);
        });
        return Array.from(statuses.entries());
    }, [transfers]);

    const filteredTransfers = useMemo(() => {
        return transfers.filter(t => {
            const searchMatch = searchTerm === "" || 
                t.documentNumber.includes(searchTerm) || 
                t.originStore?.name?.toLowerCase().includes(searchTerm.toLowerCase());
            
            const statusMatch = statusFilter === 'all' || t.status.name === statusFilter;

            return searchMatch && statusMatch;
        });
    }, [transfers, searchTerm, statusFilter]);
    
    const getRowClass = (statusName: string) => {
        switch (statusName) {
            case 'CERRADO':
            case 'RECIBIDO_PARCIAL':
                return styles.rowSuccess; // Fila verde
            case 'CANCELADO':
                return styles.rowDanger; // Fila roja
            default:
                return '';
        }
    };

    const handleRowClick = (folio: string) => {
        router.push(`/operaciones/receptions/preview/${folio}`);
    };

    if (isLoading) {
        return (
            <div className="text-center p-5">
                <Spinner animation="border" />
                <p className="mt-2">Cargando recepciones procesadas...</p>
            </div>
        );
    }

    return (
        <div>
            <div className="row mb-4 align-items-end">
                <div className="col-md-5">
                    <InputGroup>
                        <InputGroup.Text>🔍</InputGroup.Text>
                        <Form.Control
                            placeholder="Buscar por Folio SAP u Origen..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </InputGroup>
                </div>
                <div className="col-md-4">
                    <Form.Group controlId="statusFilter">
                        <Form.Label>Filtrar por Estado</Form.Label>
                        <Form.Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                            <option value="all">Todos los Estados</option>
                            {/* Ahora el dropdown mostrará 'Completo', 'Parcial', etc. */}
                            {uniqueStatuses.map(([name, displayText]) => (
                                <option key={name} value={name}>{displayText}</option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                </div>
            </div>

            <AnimatePresence>
                <motion.div className="table-responsive">
                    <Table striped hover className="align-middle">
                        <thead>
                            <tr>
                                <th>Folio SAP</th>
                                <th>Origen</th>
                                <th>Destino</th>
                                <th className="text-center">Estado</th>
                                <th>Última Actualización</th>
                                <th className="text-end">Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTransfers.length > 0 ? (
                                filteredTransfers.map(t => {
                                    // DEPURACIÓN: Revisa la consola de tu navegador (F12) para ver estos logs
                                    console.log("Datos del Traslado:", t);
                                    
                                    const statusStyle = getStatusStyle(t.status.name);

                                    return (
                                        <motion.tr 
                                            key={t.id}
                                            layout
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            style={{ cursor: 'pointer' }}
                                            className={getRowClass(t.status.name)}
                                            onClick={() => handleRowClick(t.documentNumber)}
                                        >
                                            <td><strong>{t.documentNumber}</strong></td>
                                            <td>{t.originStore?.name || 'N/A'}</td>
                                            <td>{t.destinationStore?.name || 'N/A'}</td>
                                            <td className="text-center">
                                                <Badge pill bg={statusStyle.variant} className="d-inline-flex align-items-center p-2" style={{ fontSize: '0.8rem' }}>
                                                    <statusStyle.Icon className="me-1" />
                                                    {statusStyle.text}
                                                </Badge>
                                            </td>
                                            <td>{new Date(t.updatedAt).toLocaleString('es-MX')}</td>
                                            <td className="text-end">
                                                <Button variant="outline-primary" size="sm">
                                                    Ver Detalle
                                                </Button>
                                            </td>
                                        </motion.tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={6} className="text-center p-4">No se encontraron recepciones con los filtros aplicados.</td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
