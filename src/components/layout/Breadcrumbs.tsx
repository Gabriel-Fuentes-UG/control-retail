// src/components/layout/Breadcrumbs.tsx
"use client";
import Link from 'next/link';
import { Breadcrumb as BsBreadcrumb } from 'react-bootstrap';
type BreadcrumbItem = {
  href?: string;
  label: string;
  onClick?: () => void; // <-- Nueva propiedad opcional
};
type BreadcrumbsProps = { items: BreadcrumbItem[] };

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <BsBreadcrumb>
      {items.map((item, index) => (
        <BsBreadcrumb.Item
          key={index}
          linkAs={item.href ? Link : 'span'} // Si no hay href, es un span
          href={item.href || ''}
          active={index === items.length - 1}
          onClick={item.onClick} // <-- Pasamos el onClick
          style={item.onClick ? {cursor: 'pointer'} : {}}
        >
          {item.label}
        </BsBreadcrumb.Item>
      ))}
    </BsBreadcrumb>
  );
}