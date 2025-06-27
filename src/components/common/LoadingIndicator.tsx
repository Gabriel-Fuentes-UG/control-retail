// src/components/common/LoadingIndicator.tsx
'use client';

import { motion } from 'framer-motion';

// --- NUEVA INTERFAZ ---
// Se añade una propiedad opcional para el mensaje.
interface LoadingIndicatorProps {
  message?: string;
}

const containerVariants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const dotVariants = {
  initial: {
    y: '0%',
  },
  animate: {
    y: ['0%', '-100%', '0%'],
    transition: {
      duration: 1.2,
      ease: 'easeInOut',
      repeat: Infinity,
    },
  },
};

// El componente ahora acepta props, con un valor por defecto para el mensaje.
export default function LoadingIndicator({ message = "Cargando datos..." }: LoadingIndicatorProps) {
  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '40vh',
      }}
    >
      <motion.div
        style={{
          display: 'flex',
          gap: '1rem',
          alignItems: 'flex-end',
          height: '20px',
        }}
        variants={containerVariants}
        initial="initial"
        animate="animate"
      >
        <motion.span style={{ width: '15px', height: '15px', backgroundColor: '#0d6efd', borderRadius: '50%' }} variants={dotVariants} />
        <motion.span style={{ width: '15px', height: '15px', backgroundColor: '#0d6efd', borderRadius: '50%' }} variants={dotVariants} />
        <motion.span style={{ width: '15px', height: '15px', backgroundColor: '#0d6efd', borderRadius: '50%' }} variants={dotVariants} />
      </motion.div>
      {/* --- MENSAJE DINÁMICO =) --- */}
      <p className="mt-4 text-muted fw-light">{message}</p>
    </div>
  );
}
