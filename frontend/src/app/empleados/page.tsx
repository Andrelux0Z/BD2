"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

interface Empleado {
  nombre: string;
  documentoIdentidad: string;
}

export default function Empleados() {
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [filterText, setFilterText] = useState("");
  const [showAddEmployeeMenu, setShowAddEmployeeMenu] = useState(false);
  const router = useRouter();
  const [formNombre, setFormNombre] = useState("");
  const [formDocumento, setFormDocumento] = useState("");
  const [puestos, setPuestos] = useState<Array<{ id: number; nombre: string }>>([]);
  const [formPuesto, setFormPuesto] = useState<number>(0);
  const [submitText, setSubmitText] = useState("Agregar");
  const [errorMessage, setErrorMessage] = useState("");

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
    // Navega usando el nombre (sin espacios) en la URL
    const nombreSinEspacios = empleado.nombre.replace(/\s+/g, "");
    router.push(`/empleados/${encodeURIComponent(nombreSinEspacios)}/movimientos`);
  };

  const handleAgregarEmpleado = () => {
    setShowAddEmployeeMenu(true);
  };

  useEffect(() => {
    // Cuando se abre el modal, cargar la lista de puestos
    if (showAddEmployeeMenu) {
      fetch("http://localhost:5028/api/empleados/puestos")
        .then((r) => r.json())
        .then((data) => setPuestos(data))
        .catch((err) => console.error(err));
    }
  }, [showAddEmployeeMenu]);

  const nameAllowed = (name: string) => {
    return /^[A-Za-zÁÉÍÓÚáéíóúÑñ ]+$/.test(name.trim());
  };

  const handleDocumentoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (/^\d*$/.test(val)) {
      setFormDocumento(val);
    }
  };

  const submitAgregarEmpleado = async () => {
    setErrorMessage("");

    if (!formNombre.trim()) {
      setErrorMessage("El nombre es requerido");
      return;
    }
    if (!nameAllowed(formNombre)) {
      setErrorMessage("El nombre solo puede tener letras");
      return;
    }
    if (!formDocumento.trim()) {
      setErrorMessage("La identificación es requerida");
      return;
    }
    if (formPuesto === 0) {
      setErrorMessage("Por favor seleccione un puesto");
      return;
    }

    try {
      setSubmitText("Validando...");

      // Comprobar duplicados en backend
      const q = new URLSearchParams();
      q.set("nombre", formNombre);
      q.set("documento", formDocumento);

      const chkRes = await fetch(`http://localhost:5028/api/empleados/exists?${q.toString()}`);
      const chk = await chkRes.json();
      if (chk.existsName) {
        setErrorMessage("Ya existe un empleado con ese nombre.");
        setSubmitText("Agregar");
        return;
      }
      if (chk.existsDocumento) {
        setErrorMessage("Ya existe un empleado con esa identificación.");
        setSubmitText("Agregar");
        return;
      }

      setSubmitText("Guardando...");

      const res = await fetch("http://localhost:5028/api/empleados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: formNombre.trim(), documento: formDocumento.trim(), idPuesto: formPuesto }),
      });

      if (res.ok) {
        // refrescar la lista
        handleCerrarMenu();
        fetchEmpleados();
      } else if (res.status === 409) {
        const data = await res.json();
        setErrorMessage(data.message || "Conflicto al crear empleado");
      } else {
        const data = await res.json();
        setErrorMessage(data.message || "Error al crear empleado");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Error al crear empleado");
    } finally {
      setSubmitText("Agregar");
    }
  };

  const handleCerrarMenu = () => {
    setShowAddEmployeeMenu(false);
    setFormNombre("");
    setFormDocumento("");
    setFormPuesto(0);
    setErrorMessage("");
  };

  return (
    <div className={styles.page}>
      <div className={styles.contentWrap}>
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
                  <tr key={emp.documentoIdentidad}>
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

        <div className={styles.addEmployeeSection}>
          <button className={styles.addEmployeeBtn} onClick={handleAgregarEmpleado}>
            Agregar Empleado
          </button>
        </div>
      </div>

      {showAddEmployeeMenu && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <h2 className={styles.addEmployeeMenuTitle}>Agregar empleado</h2>

            <form className={styles.modalForm} onSubmit={(e) => e.preventDefault()}>
              <label className={styles.fieldLabel} htmlFor="empNombre">Nombre</label>
              <input id="empNombre" className={styles.modalInput} type="text" name="nombre" value={formNombre} onChange={(e) => setFormNombre(e.target.value)} placeholder="Nombre completo" />

              <label className={styles.fieldLabel} htmlFor="empDocumento">Identificación</label>
              <input id="empDocumento" className={styles.modalInput} type="text" name="documento" value={formDocumento} onChange={handleDocumentoChange} placeholder="Sólo números" />

              <label className={styles.fieldLabel} htmlFor="empPuesto">Puesto</label>
              <select id="empPuesto" className={styles.modalInput} value={formPuesto} onChange={(e) => setFormPuesto(Number(e.target.value))}>
                <option value={0}>Seleccione...</option>
                {puestos.map((p) => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>

              {errorMessage && (
                <p style={{ color: "red", marginTop: "1rem", textAlign: "center", fontSize: "14px" }}>
                  {errorMessage}
                </p>
              )}

              <div className={styles.modalActions}>
                <button type="button" className={styles.modalButton} onClick={handleCerrarMenu}>Volver</button>
                <button type="submit" className={styles.modalButton} onClick={submitAgregarEmpleado}>{submitText}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}