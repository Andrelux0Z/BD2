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

interface TipoMovimiento {
  id: number;
  nombre: string;
  tipoAccion: string;
}

export default function MovimientosPage({ params }: { params: Promise<{ nombre: string }> }) {
  const unwrappedParams = use(params);
  const [empleado, setEmpleado] = useState<EmpleadoInfo | null>(null);
  const [empleadoId, setEmpleadoId] = useState<number | null>(null);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [showAddMovimiento, setShowAddMovimiento] = useState(false);
  const [tiposMovimiento, setTiposMovimiento] = useState<TipoMovimiento[]>([]);
  const [formTipoMovimiento, setFormTipoMovimiento] = useState<number>(0);
  const [formMonto, setFormMonto] = useState("");
  const [submitText, setSubmitText] = useState("Agregar");
  const [errorMessage, setErrorMessage] = useState("");
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
    const nombreDecodificado = decodeURIComponent(nombreEmpleado).replace(/-/g, " ");

    const obtener = async () => {
      try {
        const res = await fetch(`http://localhost:5028/api/empleados/byname/${encodeURIComponent(nombreDecodificado)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.empleado) {
            setEmpleadoId(data.empleado.id);
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

  useEffect(() => {
    if (showAddMovimiento) {
      fetch("http://localhost:5028/api/movimientos/tipos")
        .then((r) => r.json())
        .then((data) => setTiposMovimiento(data))
        .catch((err) => console.error(err));
    }
  }, [showAddMovimiento]);

  const handleRegresar = () => {
    router.push("/empleados");
  };

  const handleCerrarModal = () => {
    setShowAddMovimiento(false);
    setFormTipoMovimiento(0);
    setFormMonto("");
    setErrorMessage("");
  };

  const handleMontoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (/^\d*\.?\d{0,2}$/.test(val)) {
      setFormMonto(val);
    }
  };

  const submitAgregarMovimiento = async () => {
    setErrorMessage("");

    if (!empleadoId) {
      setErrorMessage("No se pudo identificar al empleado");
      return;
    }

    try {
      setSubmitText("Guardando...");

      const res = await fetch("http://localhost:5028/api/movimientos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idEmpleado: empleadoId,
          idTipoMovimiento: formTipoMovimiento,
          monto: parseFloat(formMonto) || 0,
          idUsuario: Number(localStorage.getItem("idUsuario") || "1")
        }),
      });

      if (res.ok) {
        handleCerrarModal();
        fetchMovimientos(String(empleadoId));
      } else if (res.status === 409) {
        const data = await res.json();
        setErrorMessage(data.message || "Saldo insuficiente");
      } else {
        const data = await res.json();
        setErrorMessage(data.message || "Error al crear movimiento");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Error al crear movimiento");
    } finally {
      setSubmitText("Agregar");
    }
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
      <div className={styles.contentWrap}>
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

        <div className={styles.addEmployeeSection}>
          <button className={styles.addEmployeeBtn} onClick={() => setShowAddMovimiento(true)}>
            Añadir Movimiento
          </button>
        </div>
      </div>

      {showAddMovimiento && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <h2 className={styles.addEmployeeMenuTitle}>Añadir movimiento</h2>

            <form className={styles.modalForm} onSubmit={(e) => e.preventDefault()}>
              <label className={styles.fieldLabel} htmlFor="movTipo">Tipo de Movimiento</label>
              <select
                id="movTipo"
                className={styles.modalInput}
                value={formTipoMovimiento}
                onChange={(e) => setFormTipoMovimiento(Number(e.target.value))}
              >
                <option value={0}>Seleccione...</option>
                {tiposMovimiento.map((t) => (
                  <option key={t.id} value={t.id}>{t.nombre}</option>
                ))}
              </select>

              <label className={styles.fieldLabel} htmlFor="movMonto">Monto</label>
              <input
                id="movMonto"
                className={styles.modalInput}
                type="text"
                value={formMonto}
                onChange={handleMontoChange}
                placeholder="0.00"
              />

              {errorMessage && (
                <p style={{ color: "red", marginTop: "1rem", textAlign: "center", fontSize: "14px" }}>
                  {errorMessage}
                </p>
              )}

              <div className={styles.modalActions}>
                <button type="button" className={styles.modalButton} onClick={handleCerrarModal}>Volver</button>
                <button type="submit" className={styles.modalButton} onClick={submitAgregarMovimiento}>{submitText}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

