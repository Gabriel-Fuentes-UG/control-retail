// src/components/layout/Breadcrumbs.tsx
'use client';

import Link from 'next/link';
import { Breadcrumb as BsBreadcrumb } from 'react-bootstrap';

type BreadcrumbItem = {
  href?: string;
  label: string;
  onClick?: () => void;
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
          // La lógica aquí es correcta: si hay href, usa Link, si no, un span.
          linkAs={item.href && item.href !== '#' ? Link : 'span'}
          
          // CORRECCIÓN: Se pasa `item.href` directamente. 
          // Si es `undefined`, el prop no se pasará, evitando el error.
          href={item.href}
          
          active={index === items.length - 1}
          onClick={item.onClick}
          style={item.onClick ? { cursor: 'pointer' } : {}}
        >
          {item.label}
        </BsBreadcrumb.Item>
      ))}
    </BsBreadcrumb>
  );
}