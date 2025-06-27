// src/components/common/StoreSelector.tsx
'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Form } from 'react-bootstrap';

// --- Íconos SVG en línea ---
const StoreIcon = ({ className = '' }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2Z" /><path d="M2 8h20" /><path d="M16 12a4 4 0 0 1-8 0" /></svg>
);
const CheckIcon = ({ className = '' }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
);
const SearchIcon = ({ className = '' }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
);


// --- Interfaces ---
interface Store {
  id: string;
  name: string;
}
interface StoreSelectorProps {
  stores: Store[];
  onSelectionChange: (selectedStoreIds: string[]) => void;
}

// --- Variantes de Animación ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 260, damping: 20 },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: 0.2 },
  }
};

const checkVariants = {
    hidden: { scale: 0, rotate: -180, opacity: 0 },
    visible: { 
        scale: 1, 
        rotate: 0, 
        opacity: 1,
        transition: { type: 'spring', stiffness: 400, damping: 20 }
    },
    exit: { scale: 0, rotate: 180, opacity: 0 },
};

// --- NUEVA VARIANTE PARA LA ANIMACIÓN DE SELECCIÓN ---
const cardSelectionVariants = {
    unselected: { 
        backgroundColor: '#fff', 
        color: '#6c757d', // Color de texto secundario
        borderColor: '#dee2e6',
        scale: 1,
    },
    selected: { 
        backgroundColor: '#0d6efd',
        color: '#fff', // Color de texto blanco
        borderColor: '#0a58ca',
        scale: 1.05, // Se agranda un poco al seleccionar
        transition: { type: 'spring', stiffness: 300, damping: 15 }
    }
}


export default function StoreSelector({ stores, onSelectionChange }: StoreSelectorProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  const handleSelect = (storeId: string) => {
    const newSelection = new Set(selected);
    if (newSelection.has(storeId)) {
      newSelection.delete(storeId);
    } else {
      newSelection.add(storeId);
    }
    setSelected(newSelection);
    onSelectionChange(Array.from(newSelection));
  };
  
  const filteredStores = useMemo(() => {
    return stores.filter(store => 
      store.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [stores, searchTerm]);

  return (
    <div className="store-selector-container">
      <h4 className="mb-3">Tiendas a Supervisar</h4>
      
      <motion.div 
        className="mb-4 position-relative"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="input-group">
            <span className="input-group-text bg-light border-end-0">
                <SearchIcon />
            </span>
            <Form.Control
                type="text"
                placeholder="Buscar tienda por nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-start-0"
            />
        </div>
      </motion.div>

      <motion.div
        className="row g-3"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <AnimatePresence>
          {filteredStores.length > 0 ? (
            filteredStores.map((store) => {
                const isSelected = selected.has(store.id);
                return (
                <motion.div
                    key={store.id}
                    className="col-md-4 col-sm-6"
                    variants={cardVariants}
                    exit="exit"
                    layout
                >
                    <motion.div
                        onClick={() => handleSelect(store.id)}
                        className="card h-100 shadow-sm store-card" // Se quita la clase 'selected'
                        // --- ANIMACIÓN DE SELECCIÓN APLICADA AQUÍ ---
                        variants={cardSelectionVariants}
                        animate={isSelected ? 'selected' : 'unselected'}
                        whileHover={{ y: -5 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <div className="card-body d-flex flex-column align-items-center justify-content-center text-center">
                            {/* El color del ícono ahora es heredado por la animación */}
                            <StoreIcon className="mb-2 store-icon" /> 
                            <h6 className="card-title mb-0">{store.name}</h6>
                            <AnimatePresence>
                            {isSelected && (
                                <motion.div className="check-icon" variants={checkVariants} initial="hidden" animate="visible" exit="exit">
                                <CheckIcon className="text-white" />
                                </motion.div>
                            )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </motion.div>
                );
            })
          ) : (
            <motion.div 
                className="col-12 text-center text-muted py-5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                <p>No se encontraron tiendas con ese nombre.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      
      {/* --- Estilos JSX --- */}
      <style jsx>{`
        .store-selector-container {
            background-color: #f8f9fa;
            padding: 2rem;
            border-radius: 0.5rem;
        }
        .store-card {
          cursor: pointer;
          /* El borde y la transición ahora se controlan principalmente por la animación */
          position: relative;
          overflow: hidden;
        }
        .store-card:hover {
          /* Mantenemos el efecto de sombra en hover que no interfiere con la animación */
          box-shadow: 0 .5rem 1rem rgba(0,0,0,.15)!important;
        }
        /* La clase .selected ya no es necesaria para el estilo */
        .check-icon {
          position: absolute;
          top: 10px;
          right: 10px;
        }
        .store-icon {
            /* El color se hereda de la animación del padre */
            transition: color 0.2s ease-in-out; 
        }
        .input-group-text {
            border-right: 0;
        }
        .form-control {
            border-left: 0;
        }
        .form-control:focus {
            box-shadow: none;
            border-color: #dee2e6;
        }
      `}</style>
    </div>
  );
}
