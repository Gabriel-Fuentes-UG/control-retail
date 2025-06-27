// src/components/common/AnimatedToggleSwitch.tsx
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface AnimatedToggleSwitchProps {
  label: string;
  defaultChecked?: boolean;
  name?: string; // Para usar en formularios
}

// Configuración de la animación de resorte para el deslizador
const spring = {
  type: "spring",
  stiffness: 500,
  damping: 40
};

export default function AnimatedToggleSwitch({ label, defaultChecked = false, name }: AnimatedToggleSwitchProps) {
  const [isOn, setIsOn] = useState(defaultChecked);

  return (
    <div className="d-flex align-items-center">
      {/* Etiqueta invisible para el input, mejora la accesibilidad */}
      <label htmlFor={name || 'animated-switch'} className="visually-hidden">
        {label}
      </label>
      
      {/* El input real está oculto pero funcional */}
      <input
        id={name || 'animated-switch'}
        type="checkbox"
        name={name}
        checked={isOn}
        onChange={() => setIsOn(!isOn)}
        style={{ display: 'none' }}
      />
      
      {/* El contenedor visual del switch, que activa el cambio en el input */}
      <div 
        className={`switch ${isOn ? 'on' : 'off'}`}
        onClick={() => setIsOn(!isOn)}
      >
        <motion.div 
            className="handle" 
            layout 
            transition={spring}
        />
      </div>

      <span className="ms-3 label-text" onClick={() => setIsOn(!isOn)}>
        {label}
      </span>

      {/* Estilos JSX para el componente */}
      <style jsx>{`
        .switch {
          /* --- CAMBIO: Tamaños reducidos para un look más refinado --- */
          width: 50px;
          height: 28px;
          background-color: #f0f0f0; /* Color gris para 'off' */
          border: 1px solid #ddd;
          display: flex;
          align-items: center;
          border-radius: 50px;
          padding: 3px; /* Se ajusta el padding */
          cursor: pointer;
          transition: background-color 0.3s ease;
          position: relative;
        }

        .switch.on {
          background-color: #28a745; /* Color verde para 'on', como en tu ejemplo */
          border-color: #218838;
          justify-content: flex-end; /* Mueve el handle a la derecha */
        }
        
        .switch.off {
          justify-content: flex-start; /* Mueve el handle a la izquierda */
        }

        .handle {
          /* --- CAMBIO: Se reduce el tamaño del handle --- */
          width: 22px;
          height: 22px;
          background-color: white;
          border-radius: 50%;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }
        
        .label-text {
            cursor: pointer;
            user-select: none; /* Evita que el texto se seleccione al hacer clic */
        }
      `}</style>
    </div>
  );
}
