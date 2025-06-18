// src/components/layout/Breadcrumbs.tsx
"use client";

import Link from 'next/link';
import { Breadcrumb as BsBreadcrumb } from 'react-bootstrap';

// Definimos el tipo para cada 'miga' de pan
type BreadcrumbItem = {
  href?: string; // La URL a la que enlaza (opcional para el último elemento)
  label: string; // El texto que se muestra
};

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
};

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <BsBreadcrumb>
      {items.map((item, index) => (
        <BsBreadcrumb.Item
          key={index}
          linkAs={Link} // Le decimos que use el Link de Next.js para la navegación
          href={item.href || '#'} // Si no hay href, es el elemento activo
          active={index === items.length - 1} // El último elemento está "activo"
        >
          {item.label}
        </BsBreadcrumb.Item>
      ))}
    </BsBreadcrumb>
  );
}