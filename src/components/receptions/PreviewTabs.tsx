// src/components/receptions/PreviewTabs.tsx
'use client';

import { useState, useMemo } from 'react';
import { Form, InputGroup, Table } from 'react-bootstrap';
import { FiAlertTriangle, FiCheckCircle, FiInbox, FiList, FiMinusCircle, FiPlusCircle, FiSearch } from 'react-icons/fi';
// --- 1. IMPORTAMOS FRAMER-MOTION (sin cambios) ---
import { motion, AnimatePresence } from 'framer-motion';


// Se define un tipo claro para los ítems que se mostrarán.
export type PreviewItem = {
  linenum: number;
  articulo: string;
  descripcion: string;
  cantidadEsperada: number;
  cantidadRecibida: number;
  diferencia: number;
  createdAt: Date;
};

type TabFilter = 'todos' | 'correctos' | 'faltantes' | 'excedentes' | 'erroneos';

// Configuración para cada pestaña (sin cambios)
const TABS_CONFIG = {
  todos: { label: 'Todos', Icon: FiList, variant: 'primary' },
  correctos: { label: 'Correctos', Icon: FiCheckCircle, variant: 'success' },
  faltantes: { label: 'Faltantes', Icon: FiMinusCircle, variant: 'danger' },
  excedentes: { label: 'Excedentes', Icon: FiPlusCircle, variant: 'warning' },
  erroneos: { label: 'Erróneos', Icon: FiAlertTriangle, variant: 'info' },
};

// --- NUEVA PROPUESTA DE ANIMACIÓN ---
// 2. Definimos las variantes para la animación de la tabla
const tableVariants = {
  // El contenedor (tbody) no necesita variantes, pero podemos definirlo si quisiéramos orquestar algo más complejo
  // Por ahora, nos centraremos en las filas (tr)
};

const rowVariants = {
  // Estado inicial de cada fila
  hidden: {
    opacity: 0,
    scale: 0.95,
    x: -10, // Inicia ligeramente a la izquierda
  },
  // Estado visible de cada fila
  visible: (i: number) => ({ // 'i' es el índice que usaremos para el retraso (stagger)
    opacity: 1,
    scale: 1,
    x: 0,
    transition: {
      delay: i * 0.05, // Cada fila se animará 0.05s después de la anterior
      duration: 0.3,
      ease: 'easeOut',
    },
  }),
  // Estado al salir de la vista
  exit: {
    opacity: 0,
    scale: 0.9,
    x: 10, // Se va hacia la derecha
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  },
};


export default function PreviewTabs({ items }: { items: PreviewItem[] }) {
  const [activeTab, setActiveTab] = useState<TabFilter>('todos');
  const [searchTerm, setSearchTerm] = useState('');

  // Lógica de filtrado combinada (sin cambios)
  const filteredItems = useMemo(() => {
    let tabItems: PreviewItem[] = [];
    switch (activeTab) {
      case 'correctos':
        tabItems = items.filter(item => item.diferencia === 0);
        break;
      case 'faltantes':
        tabItems = items.filter(item => item.diferencia < 0);
        break;
      case 'excedentes':
        tabItems = items.filter(item => item.diferencia > 0);
        break;
      case 'erroneos':
        tabItems = items.filter(item => item.diferencia !== 0);
        break;
      case 'todos':
      default:
        tabItems = items;
    }

    if (!searchTerm.trim()) {
      return tabItems;
    }
    const lowercasedTerm = searchTerm.trim().toLowerCase();
    return tabItems.filter(
      item =>
        item.articulo.toLowerCase().includes(lowercasedTerm) ||
        item.descripcion.toLowerCase().includes(lowercasedTerm)
    );
  }, [items, activeTab, searchTerm]);

  const getStatus = (diferencia: number) => {
    if (diferencia === 0) return { label: 'Correcto', variant: 'success', Icon: FiCheckCircle };
    if (diferencia < 0) return { label: 'Faltante', variant: 'danger', Icon: FiMinusCircle };
    return { label: 'Excedente', variant: 'warning', Icon: FiPlusCircle };
  };

  return (
    <div>
      {/* Grupo de botones para las pestañas (sin cambios) */}
      <div className="btn-group w-100" role="group">
        {Object.entries(TABS_CONFIG).map(([key, { label, Icon, variant }]) => {
           const count = 
                key === 'todos' ? items.length :
                key === 'correctos' ? items.filter(i => i.diferencia === 0).length :
                key === 'faltantes' ? items.filter(i => i.diferencia < 0).length :
                key === 'excedentes' ? items.filter(i => i.diferencia > 0).length :
                items.filter(i => i.diferencia !== 0).length;

          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key as TabFilter)}
              className={`btn d-flex align-items-center justify-content-center ${activeTab === key ? `btn-${variant}` : `btn-outline-${variant}`}`}
            >
              <Icon className="me-2" />
              {label} ({count})
            </button>
          );
        })}
      </div>

      {/* Barra de búsqueda (sin cambios) */}
      <InputGroup className="my-3">
        <InputGroup.Text>
          <FiSearch />
        </InputGroup.Text>
        <Form.Control
          placeholder="Buscar artículo o descripción..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </InputGroup>

      {/* Tabla de resultados */}
      <div className="table-responsive rounded shadow-sm">
        {filteredItems.length > 0 ? (
          <Table hover className="align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th style={{ width: '5%' }} className="text-center">#</th>
                <th style={{ width: '40%' }}>Artículo</th>
                <th style={{ width: '10%' }} className="text-center">Esperado</th>
                <th style={{ width: '10%' }} className="text-center">Recibido</th>
                <th style={{ width: '10%' }} className="text-center">Diferencia</th>
                <th style={{ width: '15%' }} className="text-center">Estatus</th>
                <th style={{ width: '10%' }} className="text-center">Hora</th>
              </tr>
            </thead>
            {/* --- 3. APLICAMOS LAS NUEVAS VARIANTES DE ANIMACIÓN --- */}
            <motion.tbody>
              <AnimatePresence>
                {filteredItems.map((item, index) => {
                  const status = getStatus(item.diferencia);
                  return (
                    <motion.tr
                      key={item.linenum}
                      layout
                      custom={index} // Pasamos el índice a las variantes para el efecto 'stagger'
                      variants={rowVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className={`table-${status.variant}`}
                    >
                      <td className="text-center">{index + 1}</td>
                      <td>
                        <div className="fw-bold">{item.articulo}</div>
                        <div className="small text-muted">{item.descripcion}</div>
                      </td>
                      <td className="text-center">{item.cantidadEsperada}</td>
                      <td className="text-center fw-bold">{item.cantidadRecibida}</td>
                      <td className="text-center fw-bold">
                        {item.diferencia > 0 ? `+${item.diferencia}` : item.diferencia === 0 ? '—' : item.diferencia}
                      </td>
                      <td className="text-center">
                        <span className={`badge rounded-pill bg-${status.variant} d-inline-flex align-items-center`}>
                          <status.Icon className="me-1" />
                          {status.label}
                        </span>
                      </td>
                      <td className="text-center small text-muted">
                        {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </motion.tbody>
          </Table>
        ) : (
          <div className="text-center py-5 bg-light rounded">
            <FiInbox className="mx-auto h-12 w-12 text-secondary" />
            <h3 className="mt-2 text-sm font-weight-bold">No hay artículos</h3>
            <p className="mt-1 text-sm text-muted">No se encontraron artículos que coincidan con los filtros aplicados.</p>
          </div>
        )}
      </div>
    </div>
  );
}
