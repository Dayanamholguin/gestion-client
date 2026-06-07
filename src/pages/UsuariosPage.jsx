import { useState, useEffect, useMemo } from "react";
import Swal from "sweetalert2";
import API_BASE from "../config/api";
import { useAuth } from "../contexts/AuthContext";

// Solo estos roles se pueden asignar manualmente.
// EMPLEADO se crea automáticamente al registrar un empleado en Gestión Empleados.
const ROLES_MANUALES = [
  { id: 1, nombre: "ADMIN" },
  { id: 2, nombre: "RRHH" },
];

const ROL_BADGE = {
  ADMIN:    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  RRHH:     "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  EMPLEADO: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

const FORM_VACIO = {
  nombre: "", apellido: "", correo: "",
  password: "", rol_id: 2, empleado_id: "",
};

const ES_EMPLEADO = (rolNombre) => rolNombre === "EMPLEADO";

function formatFecha(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-CO", {
    dateStyle: "short", timeStyle: "short",
  });
}

function UsuariosPage() {
  const { usuario } = useAuth();

  const [usuarios,  setUsuarios]  = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [cargando,  setCargando]  = useState(true);

  // ── Filtros ───────────────────────────────────────────────────────────────
  const [filtroTexto,  setFiltroTexto]  = useState("");
  const [filtroRol,    setFiltroRol]    = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");

  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((u) => {
      const texto = `${u.nombre} ${u.apellido} ${u.correo}`.toLowerCase();
      const coincideTexto  = !filtroTexto  || texto.includes(filtroTexto.toLowerCase());
      const coincideRol    = !filtroRol    || u.rol === filtroRol;
      const coincideEstado =
        filtroEstado === ""  ? true :
        filtroEstado === "1" ? !!u.activo  : !u.activo;
      return coincideTexto && coincideRol && coincideEstado;
    });
  }, [usuarios, filtroTexto, filtroRol, filtroEstado]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editandoId,  setEditandoId]  = useState(null);
  const [rolEditando, setRolEditando] = useState(null); // rol del usuario que se está editando
  const [form, setForm]           = useState(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [errForm,   setErrForm]   = useState("");

  // ── Carga inicial ─────────────────────────────────────────────────────────
  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [resU, resE] = await Promise.all([
        fetch(`${API_BASE}/usuarios`),
        fetch(`${API_BASE}/empleados`),
      ]);
      const [dataU, dataE] = await Promise.all([resU.json(), resE.json()]);
      setUsuarios(Array.isArray(dataU) ? dataU : []);
      setEmpleados(
        Array.isArray(dataE)
          ? dataE.filter((e) => e.estado === 1)
          : []
      );
    } catch {
      Swal.fire("Error", "No se pudieron cargar los datos", "error");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargarDatos(); }, []);

  // ── Modal helpers ─────────────────────────────────────────────────────────
  const abrirCrear = () => {
    setForm(FORM_VACIO);
    setEditandoId(null);
    setRolEditando(null);
    setErrForm("");
    setModalOpen(true);
  };

  const abrirEditar = (u) => {
    setForm({
      nombre:      u.nombre,
      apellido:    u.apellido,
      correo:      u.correo,
      password:    "",
      rol_id:      u.rol_id,
      empleado_id: u.empleado_id ?? "",
    });
    setEditandoId(u.id);
    setRolEditando(u.rol);
    setErrForm("");
    setModalOpen(true);
  };

  const cerrarModal = () => setModalOpen(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  // ── Guardar (crear o editar) ───────────────────────────────────────────────
  const guardar = async () => {
    setErrForm("");
    const { nombre, apellido, correo, password, rol_id, empleado_id } = form;

    if (!nombre.trim() || !apellido.trim() || !correo.trim() || !rol_id) {
      return setErrForm("Nombre, apellido, correo y rol son requeridos");
    }
    if (!editandoId && !password) {
      return setErrForm("La contraseña es requerida para nuevos usuarios");
    }
    if (password && password.length < 6) {
      return setErrForm("La contraseña debe tener al menos 6 caracteres");
    }

    setGuardando(true);
    try {
      const body = {
        nombre, apellido, correo,
        rol_id: Number(rol_id),
        empleado_id: empleado_id ? Number(empleado_id) : null,
        ...(password ? { password } : {}),
      };

      const url    = editandoId ? `${API_BASE}/usuarios/${editandoId}` : `${API_BASE}/usuarios`;
      const method = editandoId ? "PUT" : "POST";

      const res  = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) return setErrForm(data.error || "Error al guardar");

      cerrarModal();
      cargarDatos();
      Swal.fire({
        icon: "success",
        title: editandoId ? "Usuario actualizado" : "Usuario creado",
        timer: 1500, showConfirmButton: false,
      });
    } catch {
      setErrForm("Error de conexión");
    } finally {
      setGuardando(false);
    }
  };

  // ── Toggle estado ─────────────────────────────────────────────────────────
  const toggleEstado = async (u) => {
    const accion = u.activo ? "desactivar" : "activar";
    const { isConfirmed } = await Swal.fire({
      title: `¿${accion.charAt(0).toUpperCase() + accion.slice(1)} usuario?`,
      text: `${u.nombre} ${u.apellido}`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: accion.charAt(0).toUpperCase() + accion.slice(1),
      confirmButtonColor: u.activo ? "#dc2626" : "#16a34a",
      cancelButtonText: "Cancelar",
    });
    if (!isConfirmed) return;

    try {
      const res = await fetch(`${API_BASE}/usuarios/${u.id}/estado`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: u.activo ? 0 : 1 }),
      });
      if (!res.ok) {
        const data = await res.json();
        return Swal.fire("Error", data.error, "error");
      }
      cargarDatos();
    } catch {
      Swal.fire("Error", "Error de conexión", "error");
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  const inputClass =
    "w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg " +
    "bg-white dark:bg-gray-700 text-gray-900 dark:text-white " +
    "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition";

  const selectClass = inputClass;

  return (
    <div>
      {/* Encabezado */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Gestión de Usuarios</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Administra los accesos al sistema</p>
        </div>
        <button
          onClick={abrirCrear}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nuevo usuario
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-48">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por nombre o correo..."
            value={filtroTexto}
            onChange={(e) => setFiltroTexto(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select
          value={filtroRol}
          onChange={(e) => setFiltroRol(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Todos los roles</option>
          <option value="ADMIN">ADMIN</option>
          <option value="RRHH">RRHH</option>
          <option value="EMPLEADO">EMPLEADO</option>
        </select>
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Todos los estados</option>
          <option value="1">Activo</option>
          <option value="0">Inactivo</option>
        </select>
        {(filtroTexto || filtroRol || filtroEstado) && (
          <button
            onClick={() => { setFiltroTexto(""); setFiltroRol(""); setFiltroEstado(""); }}
            className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 transition-colors"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Tabla */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        {cargando ? (
          <div className="py-16 text-center text-gray-400 dark:text-gray-500">Cargando...</div>
        ) : usuariosFiltrados.length === 0 ? (
          <div className="py-16 text-center text-gray-400 dark:text-gray-500">
            {usuarios.length === 0 ? "No hay usuarios registrados" : "Sin resultados para los filtros aplicados"}
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/40">
              <tr>
                {["Usuario", "Correo", "Rol", "Empleado vinculado", "Último acceso", "Estado", ""].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {usuariosFiltrados.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  {/* Nombre */}
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {u.nombre[0]}{u.apellido[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{u.nombre} {u.apellido}</p>
                        {u.id === usuario?.id && (
                          <span className="text-[10px] text-indigo-500 font-medium">Tú</span>
                        )}
                      </div>
                    </div>
                  </td>
                  {/* Correo */}
                  <td className="px-5 py-3 text-sm text-gray-600 dark:text-gray-300">{u.correo}</td>
                  {/* Rol */}
                  <td className="px-5 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${ROL_BADGE[u.rol] ?? ""}`}>
                      {u.rol}
                    </span>
                  </td>
                  {/* Empleado vinculado */}
                  <td className="px-5 py-3 text-sm text-gray-600 dark:text-gray-300">
                    {u.empleado_nombre ?? <span className="text-gray-400">—</span>}
                  </td>
                  {/* Último acceso */}
                  <td className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {formatFecha(u.ultimo_acceso)}
                  </td>
                  {/* Estado */}
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                      u.activo
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${u.activo ? "bg-emerald-500" : "bg-gray-400"}`} />
                      {u.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  {/* Acciones */}
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => abrirEditar(u)}
                        title="Editar"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round"
                            d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                        </svg>
                      </button>
                      {u.id !== usuario?.id && (
                        <button
                          onClick={() => toggleEstado(u)}
                          title={u.activo ? "Desactivar" : "Activar"}
                          className={`p-1.5 rounded-lg transition-colors ${
                            u.activo
                              ? "text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                              : "text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                          }`}
                        >
                          {u.activo ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round"
                                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round"
                                d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal crear / editar */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={cerrarModal} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                {editandoId ? "Editar usuario" : "Nuevo usuario"}
              </h2>
              <button onClick={cerrarModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              {errForm && (
                <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                  {errForm}
                </p>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                    Nombre <span className="text-red-500">*</span>
                  </label>
                  <input name="nombre" value={form.nombre} onChange={handleChange}
                    className={inputClass} placeholder="Juan" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                    Apellido <span className="text-red-500">*</span>
                  </label>
                  <input name="apellido" value={form.apellido} onChange={handleChange}
                    className={inputClass} placeholder="Pérez" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                  Correo electrónico <span className="text-red-500">*</span>
                </label>
                <input name="correo" type="email" value={form.correo} onChange={handleChange}
                  className={inputClass} placeholder="usuario@empresa.com" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                  Contraseña {!editandoId && <span className="text-red-500">*</span>}
                </label>
                <input name="password" type="password" value={form.password} onChange={handleChange}
                  className={inputClass}
                  placeholder={editandoId ? "Dejar vacío para no cambiar" : "Mínimo 6 caracteres"} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                    Rol <span className="text-red-500">*</span>
                  </label>
                  {ES_EMPLEADO(rolEditando) ? (
                    <div>
                      <div className={`${selectClass} bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 cursor-not-allowed`}>
                        EMPLEADO
                      </div>
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
                        Asignado automáticamente · no editable
                      </p>
                    </div>
                  ) : (
                    <select name="rol_id" value={form.rol_id} onChange={handleChange} className={selectClass}>
                      {ROLES_MANUALES.map((r) => (
                        <option key={r.id} value={r.id}>{r.nombre}</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Solo visible al editar un usuario EMPLEADO (el vínculo se crea automáticamente) */}
                {ES_EMPLEADO(rolEditando) && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                      Empleado vinculado
                    </label>
                    <select name="empleado_id" value={form.empleado_id} onChange={handleChange}
                      className={selectClass} disabled>
                      <option value="">— Ninguno —</option>
                      {empleados.map((e) => (
                        <option key={e.id} value={e.id}>{e.nombre} {e.apellido}</option>
                      ))}
                    </select>
                    <p className="text-[11px] text-gray-400 mt-1">Asignado al registrar el empleado</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <button onClick={cerrarModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                Cancelar
              </button>
              <button onClick={guardar} disabled={guardando}
                className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition-colors">
                {guardando ? "Guardando..." : editandoId ? "Guardar cambios" : "Crear usuario"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UsuariosPage;
