// src/components/receptions/TransferCard.tsx
"use client";

import { IncomingTransfer } from "@/app/operaciones/receptions/actions";
import styles from './TransferCard.module.css';

type TransferCardProps = {
  transfer: IncomingTransfer;
  onSelect: () => void; // Prop para manejar el clic
};

export default function TransferCard({ transfer, onSelect }: TransferCardProps) {
  return (
    <div className={styles.card} onClick={onSelect}>
      <div className={styles.header}>
        <div className={styles.folio}>Folio: {transfer.FolioSAP}</div>
        <div className={styles.origin}>Origen: {transfer.NombreOrigen}</div>
      </div>
      <div className={styles.footer}>
        <span>Fecha: {new Date(transfer.Fecha).toLocaleDateString()}</span>
      </div>
    </div>
  );
}