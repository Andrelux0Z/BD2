"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

interface Empleado {
  id: number;
  nombre: string;
  documentoIdentidad: string;
}

interface EmpleadoDetalle {
  nombre: string;
  valorDocumentoIdentidad: string;
  nombrePuesto: string;
  saldoVacaciones: number;
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
  // Menu desplegable
  const [menuAbierto, setMenuAbierto] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  // consultar
  const [showConsultar, setShowConsultar] = useState(false);
  const [empleadoDetalle, setEmpleadoDetalle] = useState<EmpleadoDetalle | null>(null);
  // editar
  const [showEditar, setShowEditar] = useState(false);
  const [editId, setEditId] = useState<number>(0);
  const [editNombre, setEditNombre] = useState("");
  const [editDocumento, setEditDocumento] = useState("");
  const [editPuesto, setEditPuesto] = useState<number>(0);
  const [editError, setEditError] = useState("");
  // borrar
  const [showBorrar, setShowBorrar] = useState(false);
  const [borrarEmpleado, setBorrarEmpleado] = useState<Empleado | null>(null);

  const [idUsuario, setIdUsuario] = useState<number>(1);

  const fetchEmpleados = async (filtro?: string) => {
    try {
      const idUser = localStorage.getItem("idUsuario") || "1";
      let url = `http://localhost:5028/api/empleados?idUsuario=${idUser}`;
      if (filtro) {
        url += `&filtro=${encodeURIComponent(filtro)}`;
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
    const id = localStorage.getItem("idUsuario");
    if (id) setIdUsuario(Number(id));
    fetchEmpleados();
}, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuAbierto(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFilter = () => {
    fetchEmpleados(filterText);
  };

  const handleIrAMovimientos = (empleado: Empleado) => {
    // Reemplazar espacios por guiones para una URL más limpia
    const nombreFormateado = empleado.nombre.replace(/\s+/g, "-");
    router.push(`/empleados/${encodeURIComponent(nombreFormateado)}/movimientos`);
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

    try {
      setSubmitText("Guardando...");

      const res = await fetch("http://localhost:5028/api/empleados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
        nombre: formNombre.trim(), 
        documento: formDocumento.trim(), 
        idPuesto: formPuesto,
        nombrePuesto: puestos.find(p => p.id === formPuesto)?.nombre ?? "",
        idUsuario: localStorage.getItem("idUsuario") || "1" 
        }),
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
//  CONSULTAR 
  const handleConsultar = async (empleado: Empleado) => {
    setMenuAbierto(null);
    try {
      const idUser = localStorage.getItem("idUsuario") || "1";
      const res = await fetch(`http://localhost:5028/api/empleados/${empleado.id}?idUsuario=${idUser}`);
      const data = await res.json();
      if (data.success) {
        setEmpleadoDetalle(data.empleado);
        setShowConsultar(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  //  EDITAR 
  const handleAbrirEditar = async (empleado: Empleado) => {
    setMenuAbierto(null);
    setEditId(empleado.id);
    setEditNombre(empleado.nombre);
    setEditDocumento(empleado.documentoIdentidad);
    setEditError("");

    if (puestos.length === 0) {
      const res = await fetch("http://localhost:5028/api/empleados/puestos");
      const data = await res.json();
      setPuestos(data);
    }

    setShowEditar(true);
  };

  const handleGuardarEdicion = async () => {
    setEditError("");

    if (!editNombre.trim()) { setEditError("El nombre es requerido"); return; }
    if (!editDocumento.trim()) { setEditError("La identificación es requerida"); return; }
    if (editPuesto === 0) { setEditError("Seleccione un puesto"); return; }

    try {
      const res = await fetch(`http://localhost:5028/api/empleados/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: editNombre.trim(), documento: editDocumento.trim(), idPuesto: editPuesto, idUsuario: localStorage.getItem("idUsuario") || "1" })

      });

      if (res.ok) {
        setShowEditar(false);
        fetchEmpleados();
      } else {
        const data = await res.json();
        setEditError(data.message || "Error al actualizar");
      }
    } catch (err) {
      console.error(err);
      setEditError("Error de conexión");
    }
  };

  //  BORRAR 
  const handleAbrirBorrar = async (empleado: Empleado) => {
    setMenuAbierto(null);
    setBorrarEmpleado(empleado);

    try {
      const idUser = localStorage.getItem("idUsuario") || "1";
      await fetch(`http://localhost:5028/api/empleados/${empleado.id}/intento-borrado?idUsuario=${idUser}`, {
        method: "POST"
      });

    } catch (err) {
      console.error(err);
    }

    setShowBorrar(true);
  };

  const handleConfirmarBorrado = async () => {
    if (!borrarEmpleado) return;

    try {
      const idUser = localStorage.getItem("idUsuario") || "1";
      const res = await fetch(`http://localhost:5028/api/empleados/${borrarEmpleado.id}?idUsuario=${idUser}`, {
        method: "DELETE"
      });

      if (res.ok) {
        setShowBorrar(false);
        setBorrarEmpleado(null);
        fetchEmpleados();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
      const idUser = localStorage.getItem("idUsuario") || "1";
      try {
        await fetch("http://localhost:5028/api/login/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idUsuario: Number(idUser) })
        });
      } catch (err) {
        console.error(err);
      }
      localStorage.removeItem("isAuthenticated");
      localStorage.removeItem("idUsuario");
      router.push("/");
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
            <h1 className={styles.title}>Empleados</h1>
            <button
              className={styles.logoutBtn}
              onClick={handleLogout}
            >
              Cerrar sesión
            </button>
          </div>
        
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


                        <div ref={menuAbierto === emp.id ? menuRef : null} style={{ position: "relative" }}>
                          <button
                            className={styles.moreBtn}
                            onClick={() => setMenuAbierto(menuAbierto === emp.id ? null : emp.id)}
                          >
                            ...
                          </button>

                          {menuAbierto === emp.id && (
                            <div style={{
                              position: "absolute",
                              right: 0,
                              top: "110%",
                              background: "#fff",
                              border: "1px solid #dadada",
                              borderRadius: "6px",
                              boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                              zIndex: 100,
                              minWidth: "130px",
                              overflow: "hidden"
                            }}>
                              <button onClick={() => handleConsultar(emp)} style={menuItemStyle}>
                                Consultar
                              </button>
                              <button onClick={() => handleAbrirEditar(emp)} style={menuItemStyle}>
                                Actualizar
                              </button>
                              <button onClick={() => handleAbrirBorrar(emp)} style={{ ...menuItemStyle, color: "#cc2927" }}>
                                Borrar
                              </button>
                            </div>
                          )}
                        </div>
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

      {/*CONSULTAR*/}
      {showConsultar && empleadoDetalle && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <h2 className={styles.addEmployeeMenuTitle}>Consultar Empleado</h2>
            <div className={styles.modalForm}>
              <label className={styles.fieldLabel}>Nombre</label>
              <p style={{ margin: 0, fontSize: "14px" }}>{empleadoDetalle.nombre}</p>

              <label className={styles.fieldLabel}>Identificación</label>
              <p style={{ margin: 0, fontSize: "14px" }}>{empleadoDetalle.valorDocumentoIdentidad}</p>

              <label className={styles.fieldLabel}>Puesto</label>
              <p style={{ margin: 0, fontSize: "14px" }}>{empleadoDetalle.nombrePuesto}</p>

              <label className={styles.fieldLabel}>Saldo de Vacaciones</label>
              <p style={{ margin: 0, fontSize: "14px" }}>{String(empleadoDetalle.saldoVacaciones)}</p>

              <div className={styles.modalActions}>
                <button className={styles.modalButton} onClick={() => setShowConsultar(false)}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/*ACTUALIZAR*/}
      {showEditar && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <h2 className={styles.addEmployeeMenuTitle}>Actualizar Empleado</h2>
            <form className={styles.modalForm} onSubmit={(e) => e.preventDefault()}>
              <label className={styles.fieldLabel}>Nombre</label>
              <input
                className={styles.modalInput}
                type="text"
                value={editNombre}
                onChange={(e) => setEditNombre(e.target.value)}
              />

              <label className={styles.fieldLabel}>Identificación</label>
              <input
                className={styles.modalInput}
                type="text"
                value={editDocumento}
                onChange={(e) => {
                  if (/^\d*$/.test(e.target.value)) setEditDocumento(e.target.value);
                }}
              />

              <label className={styles.fieldLabel}>Puesto</label>
              <select
                className={styles.modalInput}
                value={editPuesto}
                onChange={(e) => setEditPuesto(Number(e.target.value))}
              >
                <option value={0}>Seleccione...</option>
                {puestos.map((p) => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>

              {editError && (
                <p style={{ color: "red", margin: 0, fontSize: "14px" }}>{editError}</p>
              )}

              <div className={styles.modalActions}>
                <button type="button" className={styles.modalButton} onClick={() => setShowEditar(false)}>
                  Cancelar
                </button>
                <button type="submit" className={styles.modalButton} onClick={handleGuardarEdicion}>
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/*BORRAR*/}
      {showBorrar && borrarEmpleado && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <h2 className={styles.addEmployeeMenuTitle}>Eliminar Empleado</h2>
            <div className={styles.modalForm}>
              <p style={{ margin: 0, fontSize: "14px" }}>
                ¿Está seguro de eliminar a <strong>{borrarEmpleado.nombre}</strong> con identificación <strong>{borrarEmpleado.documentoIdentidad}</strong>?
              </p>
              <div className={styles.modalActions}>
                <button className={styles.modalButton} onClick={() => setShowBorrar(false)}>
                  Cancelar
                </button>
                <button
                  className={styles.modalButton}
                  style={{ background: "#cc2927" }}
                  onClick={handleConfirmarBorrado}
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


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
    const menuItemStyle: React.CSSProperties = {
    display: "block",
    width: "100%",
    padding: "10px 16px",
    background: "transparent",
    border: "none",
    textAlign: "left",
    fontSize: "14px",
    cursor: "pointer",
    color: "#222222",
    fontFamily: "inherit"
  };
