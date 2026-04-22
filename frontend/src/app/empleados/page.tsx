"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

interface Empleado {
  id: number;
  nombre: string;
  documentoIdentidad: string;
}

export default function Empleados() {
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [filterText, setFilterText] = useState("");
  const router = useRouter();

  const fetchEmpleados = async (filtro?: string) => {
    try {
      let url = "http://localhost:5028/api/empleados";
      if (filtro) {
        url += `?filtro=${encodeURIComponent(filtro)}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setEmpleados(data);
      } else {
        console.error("Error al cargar la lista");
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchEmpleados();
  }, []);

  const handleFilter = () => {
    fetchEmpleados(filterText);
  };

  const handleIrAMovimientos = (empleado: Empleado) => {
    // Guarda el ID en sessionStorage para evitar enviarlo en la URL
    sessionStorage.setItem("empleadoId", String(empleado.id));
    
    // Remueve los espacios del nombre para evitar el %20 en el navegador
    const nombreSinEspacios = empleado.nombre.replace(/\s+/g, "");
    
    router.push(`/empleados/${encodeURIComponent(nombreSinEspacios)}/movimientos`);
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
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Documento de Identidad</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {empleados.map((emp) => (
                <tr key={emp.id}>
                  <td>{emp.nombre}</td>
                  <td>{emp.documentoIdentidad}</td>
                  <td>
                    <div className={styles.actionButtons}>
                      <button 
                        className={styles.movimientosBtn} 
                        onClick={() => handleIrAMovimientos(emp)}
                      >
                        Movimientos
                      </button>
                      <button 
                        className={styles.moreBtn} 
                        title="Opciones adicionales: Editar, Borrar, Consultar"
                        onClick={() => alert("Opciones en construcción")}
                      >
                        ...
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {empleados.length === 0 && (
                <tr style={{ background: "transparent" }}>
                  <td colSpan={3} style={{ textAlign: "center", color: "#888", padding: "30px 0" }}>
                    No se encontraron empleados registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}