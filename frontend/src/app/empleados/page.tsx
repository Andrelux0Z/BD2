"use client";
import { useState } from "react";
import styles from "./page.module.css";

export default function Empleados() {
  const [filterText, setFilterText] = useState("");

  const handleFilter = () => {
    // Funcionalidad de filtrado a implementar
  };

  return (
    <div className={styles.page}>
      <main className={styles.card}>
        <h1 className={styles.title}>Empleados</h1>
        
        <div className={styles.filterRow}>
          <input
            className={styles.input}
            type="text"
            placeholder="Escriba para filtrar..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            aria-label="Caja de texto para filtrar empleados"
          />
          <button className={styles.button} onClick={handleFilter}>
            Filtrar
          </button>
        </div>

        <div className={styles.listPlaceholder}>
          Espacio destinado para la lista de empleados
        </div>
      </main>
    </div>
  );
}