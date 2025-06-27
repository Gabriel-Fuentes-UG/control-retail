// src/app/management/users/select-role/page.tsx
'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaUserShield, FaStore } from 'react-icons/fa';
import Breadcrumbs from '@/components/layout/Breadcrumbs';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.2,
      duration: 0.5,
      ease: "easeOut"
    },
  }),
};

export default function SelectRolePage() {
  const breadcrumbItems = [
    { label: "Inicio", href: "/redirect-hub" },
    { label: "Gestionar Personal", href: "/management/users" },
    { label: "Seleccionar Tipo de Usuario" },
  ];

  const roleTypes = [
    {
      name: 'Supervisor',
      description: 'Gestiona múltiples tiendas y supervisa a los gerentes.',
      icon: <FaUserShield size={40} className="mb-3 text-primary" />,
      href: '/management/users/new/supervisor',
    },
    {
      name: 'Personal de Tienda',
      description: 'Incluye Gerentes, Encargados y Vendedores asignados a una tienda específica.',
      icon: <FaStore size={40} className="mb-3 text-success" />,
      href: '/management/users/new/staff',
    },
  ];

  return (
    <div className="dashboard-section p-4 p-md-5">
      <Breadcrumbs items={breadcrumbItems} />
      <motion.div 
        className="text-center my-5"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="display-5 fw-bold">Crear Nuevo Usuario</h1>
        <p className="lead text-muted">
          Para comenzar, selecciona el tipo de rol que deseas asignar.
        </p>
      </motion.div>

      <div className="row justify-content-center g-4">
        {roleTypes.map((role, i) => (
          <motion.div 
            key={role.name} 
            className="col-lg-4 col-md-6"
            custom={i}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            // --- CORRECCIÓN ---
            // La animación de hover ahora se aplica a este div contenedor.
            whileHover={{ y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {/* El Link ahora es el componente principal y recibe los estilos directamente.
                Se ha eliminado `legacyBehavior` y el `<a>` anidado. */}
            <Link 
              href={role.href} 
              className="card h-100 text-center shadow-sm text-decoration-none text-dark"
              style={{ display: 'block' }} // Para que el link ocupe toda la tarjeta
            >
              <motion.div
                whileHover={{ boxShadow: "0 1rem 3rem rgba(0,0,0,.175)" }}
                className="card-body p-4 p-lg-5"
              >
                {role.icon}
                <h3 className="card-title fw-bold">{role.name}</h3>
                <p className="card-text text-muted">{role.description}</p>
              </motion.div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
