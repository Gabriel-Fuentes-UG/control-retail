// src/components/dashboard/KPICard.tsx
"use client"; 
// 👇 La importación DEBE ser de un archivo .module.css y asignarse a una variable (ej. styles)
import styles from './KPICard.module.css'; 
import { Card } from 'react-bootstrap';

type KPICardProps = {
  title: string;
  value: string;
  icon?: React.ReactNode;
};

export default function KPICard({ title, value, icon }: KPICardProps) {
  return (
    // 👇 Las clases se aplican usando la variable 'styles'
    <Card className={styles.kpiCard + " text-center"}>
      <Card.Body>
        {icon && <div className={styles.kpiIcon}>{icon}</div>}
        <div className={styles.kpiValue}>{value}</div>
        <div className={styles.kpiLabel}>{title}</div>
      </Card.Body>
    </Card>
  );
}