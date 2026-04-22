"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import styles from "../../../page.module.css";

interface EmpleadoInfo {
  valorDocumentoIdentidad: string;
  nombre: string;
  saldoVacaciones: number;
}

interface Movimiento {
  fecha: string;
  nombreTipoMovimiento: string;
  monto: number;
  nuevoSaldo: number;
  nombreUsuario: string;
  ipPostIn: string;
  postTime: string;
}

export default function MovimientosPage({ params }: { params: Promise<{ nombre: string }> }) {
  const [empleado, setEmpleado] = useState<EmpleadoInfo | null>(null);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const router = useRouter();
  
  const unwrappedParams = use(params);
  const nombreEmpleado = unwrappedParams.nombre;

  const fetchMovimientos = async (id: string) => {
    try {
      const res = await fetch("http://localhost:5028/api/movimientos/" + id);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setEmpleado(data.empleado);
          setMovimientos(data.movimientos);
        } else {
          console.error("Error al cargar la lista de movimientos");
        }
      } else {
        console.error("Respuesta no satisfactoria al consultar movimientos");
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    // Leemos el ID del empleado que se guardó desde la pantalla anterior
    const idGuardado = sessionStorage.getItem("empleadoId");
    
    if (idGuardado) {
      fetchMovimientos(idGuardado);
    } else {
      // Si por alguna razón no hay ID (p.e. refrescó la página en una nueva pestaña), vuelve a empleados
      router.push("/empleados");
    }
  }, [router]);

  const handleRegresar = () => {
    router.push("/empleados");
  };

  if (!empleado) {
    return (
      <div className={styles.page}>
        <main className={styles.card}>
          <h1 className={styles.title}>Cargando...</h1>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <main className={styles.card}>
        <h1 className={styles.title}>{empleado.nombre}</h1>
        
        <div className={styles.filterRow}>
          <span style={{ fontSize: "16px", color: "var(--muted)", fontWeight: 600 }}>
            Identidad: {empleado.valorDocumentoIdentidad}
          </span>
        </div>

        <div 
          className={styles.listPlaceholder} 
          style={{ border: "2px dashed var(--outline)", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <span style={{ color: "var(--muted)" }}>Aquí irá la lista de movimientos</span>
        </div>
        
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button className={styles.button} onClick={handleRegresar}>
            Volver
          </button>
        </div>
      </main>
    </div>
  );
}
