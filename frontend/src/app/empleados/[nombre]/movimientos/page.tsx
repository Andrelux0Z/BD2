"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import styles from "../../page.module.css";

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
  const unwrappedParams = use(params);
  const [empleado, setEmpleado] = useState<EmpleadoInfo | null>(null);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const router = useRouter();
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
    // Revertir los guiones por espacios para buscarlo en la BD correctamente
    const nombreDecodificado = decodeURIComponent(nombreEmpleado).replace(/-/g, " ");

    const obtener = async () => {
      try {
        const res = await fetch(`http://localhost:5028/api/empleados/byname/${encodeURIComponent(nombreDecodificado)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.empleado) {
            fetchMovimientos(String(data.empleado.id));
          } else {
            router.push("/empleados");
          }
        } else {
          router.push("/empleados");
        }
      } catch (err) {
        console.error(err);
        router.push("/empleados");
      }
    };

    obtener();
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

        <div className={styles.listPlaceholder}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Usuario</th>
                <th>Monto</th>
                <th>Nuevo Saldo</th>
              </tr>
            </thead>
            <tbody>
              {movimientos.map((mov, index) => (
                <tr key={index}>
                  <td>{new Date(mov.fecha).toLocaleDateString()}</td>
                  <td>{mov.nombreTipoMovimiento}</td>
                  <td>{mov.nombreUsuario}</td>
                  <td>{mov.monto}</td>
                  <td>{mov.nuevoSaldo}</td>
                </tr>
              ))}
              {movimientos.length === 0 && (
                <tr style={{ background: "transparent" }}>
                  <td colSpan={5} style={{ textAlign: "center", color: "#888", padding: "30px 0" }}>
                    No se encontraron movimientos registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
