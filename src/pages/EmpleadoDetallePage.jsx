import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Swal from "sweetalert2";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ThemeContext } from "../App";
import { getSelectStyles } from "../config/selectStyles";
import API_BASE from "../config/api";
import RichTextEditor from "../components/RichTextEditor";
import CalendarioInput from "../components/CalendarioInput";

const inputClass =
  "block w-full p-2 mt-1 border rounded-md text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600";
const labelClass = "block text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wide";

const NIVEL_PREFIJOS = {
  Bachillerato: "Bachiller académico",
  Técnico: "Técnico en ",
  Tecnólogo: "Tecnólogo en ",
  Profesional: "Profesional en ",
  Especialización: "Especialista en ",
  Maestría: "Magíster en ",
  Doctorado: "Doctor en ",
};

const formatFecha = (fecha) => {
  if (!fecha) return "—";
  const [y, m, d] = String(fecha).split("T")[0].split("-");
  return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatSalario = (val) =>
  val ? `$${new Intl.NumberFormat("es-CO").format(val)}` : "—";

const formatCelular = (c) => {
  const d = String(c || "").replace(/\D/g, "");
  if (!d) return "—";
  if (d.length > 6) return `(${d.slice(0, 3)}) ${d.slice(3, 6)} - ${d.slice(6)}`;
  if (d.length > 3) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d}`;
};

// ─── SECCIÓN HISTORIAL ──────────────────────────────────────────────────────

function HistorialSection({ empleadoId, soloLectura }) {
  const [registros, setRegistros] = useState([]);
  const [dragIdx,  setDragIdx]  = useState(null);
  const [dragOver, setDragOver] = useState(null);

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    const res  = await fetch(`${API_BASE}/historial-cargos/empleado/${empleadoId}`);
    const data = await res.json();
    setRegistros(Array.isArray(data) ? data : []);
  };

  const onDragStart = (i) => setDragIdx(i);
  const onDragOver  = (e, i) => { e.preventDefault(); setDragOver(i); };
  const onDrop      = (e, i) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === i) { setDragIdx(null); setDragOver(null); return; }
    const lista = [...registros];
    const [item] = lista.splice(dragIdx, 1);
    lista.splice(i, 0, item);
    setRegistros(lista);
    setDragIdx(null);
    setDragOver(null);
    fetch(`${API_BASE}/historial-cargos/reorder`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: lista.map((r) => ({ id: r.id })) }),
    }).catch((err) => console.error("Error al guardar orden historial:", err));
  };
  const onDragEnd = () => { setDragIdx(null); setDragOver(null); };

  const colSpan = soloLectura ? 6 : 7;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            {!soloLectura && <th className="w-6 px-2 py-2" />}
            {["Cargo", "Contrato", "Salario", "Inicio", "Fin", "Motivo"].map((h) => (
              <th key={h} className="px-4 py-2 text-xs font-medium text-left text-gray-500 uppercase dark:text-gray-300">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {registros.length === 0 ? (
            <tr><td colSpan={colSpan} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">Sin registros de historial</td></tr>
          ) : registros.map((r, i) => (
            <tr
              key={r.id}
              draggable={!soloLectura}
              onDragStart={() => onDragStart(i)}
              onDragOver={(e) => onDragOver(e, i)}
              onDrop={(e) => onDrop(e, i)}
              onDragEnd={onDragEnd}
              className={`transition-colors ${
                dragOver === i && dragIdx !== i
                  ? "bg-indigo-50 dark:bg-indigo-900/20"
                  : dragIdx === i
                    ? "opacity-40 bg-gray-100 dark:bg-gray-600"
                    : "hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              {!soloLectura && (
                <td className="px-2 py-3 text-gray-300 select-none cursor-grab dark:text-gray-600" title="Arrastra para reordenar">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                    <rect y="2.5" width="16" height="1.5" rx="0.75" />
                    <rect y="7" width="16" height="1.5" rx="0.75" />
                    <rect y="11.5" width="16" height="1.5" rx="0.75" />
                  </svg>
                </td>
              )}
              <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{r.cargo_nombre}</td>
              <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{r.tipo_contrato_nombre}</td>
              <td className="px-4 py-3 text-gray-600 dark:text-gray-300">${new Intl.NumberFormat("es-CO").format(r.salario)}</td>
              <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{formatFecha(r.fecha_inicio)}</td>
              <td className="px-4 py-3">
                {r.fecha_fin
                  ? <span className="text-gray-600 dark:text-gray-300">{formatFecha(r.fecha_fin)}</span>
                  : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                      Actual
                    </span>
                }
              </td>
              <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{r.motivo || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── SECCIÓN ESTUDIOS ────────────────────────────────────────────────────────

function EstudiosSection({ empleadoId, nivelesEducativos, universidades, soloLectura, fechaNacimiento }) {
  const darkMode = useContext(ThemeContext);
  const selectStyles = getSelectStyles(darkMode);

  const [registros, setRegistros] = useState([]);
  const [editando, setEditando] = useState(null);
  const [nivelId, setNivelId] = useState("");
  const [titulo, setTitulo] = useState("");
  const [institucion, setInstitucion] = useState("");
  const [universidadId, setUniversidadId] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [graduado, setGraduado] = useState(false);
  const [error, setError] = useState("");

  // Drag & drop state
  const [dragIdx, setDragIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);

  const nivelOptions = nivelesEducativos.map((n) => ({ value: String(n.id), label: n.nombre }));
  const univOptions = universidades.map((u) => ({ value: String(u.id), label: u.nombre }));

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    const res = await fetch(`${API_BASE}/estudios/empleado/${empleadoId}`);
    const data = await res.json();
    setRegistros(data);
  };

  const limpiar = () => {
    setEditando(null);
    setNivelId(""); setTitulo(""); setInstitucion(""); setUniversidadId("");
    setFechaInicio(""); setFechaFin(""); setGraduado(false); setError("");
  };

  const handleNivelChange = (opt) => {
    const nivelNuevo = opt?.value || "";
    setNivelId(nivelNuevo);
    if (!nivelNuevo) return;
    const nivel = nivelesEducativos.find((n) => String(n.id) === nivelNuevo);
    const newPrefix = nivel ? (NIVEL_PREFIJOS[nivel.nombre] || "") : "";
    if (!newPrefix) return;
    const existingPrefix = Object.values(NIVEL_PREFIJOS).find((p) => titulo.startsWith(p));
    if (!titulo.trim()) {
      setTitulo(newPrefix);
    } else if (existingPrefix) {
      setTitulo(newPrefix + titulo.slice(existingPrefix.length));
    }
  };

  const guardar = async (e) => {
    e.preventDefault();
    setError("");
    if (!nivelId || !titulo.trim() || !institucion.trim()) {
      setError("Nivel educativo, título e institución son requeridos");
      return;
    }
    if (fechaNacimiento && fechaInicio && fechaInicio <= fechaNacimiento) {
      setError("La fecha de inicio debe ser posterior a la fecha de nacimiento del empleado");
      return;
    }
    if (fechaFin && fechaInicio && fechaFin < fechaInicio) {
      setError("La fecha fin no puede ser anterior a la fecha de inicio");
      return;
    }
    const payload = {
      empleado_id: empleadoId,
      nivel_educativo_id: nivelId,
      titulo,
      institucion,
      fecha_inicio: fechaInicio || null,
      fecha_fin: fechaFin || null,
      graduado,
      universidad_id: universidadId || null,
    };
    try {
      const url = editando ? `${API_BASE}/estudios/${editando.id}` : `${API_BASE}/estudios`;
      const method = editando ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Error al guardar"); return; }
      await cargar();
      limpiar();
    } catch { setError("Error de conexión"); }
  };

  const eliminar = async (id) => {
    const confirm = await Swal.fire({
      title: "¿Eliminar estudio?", icon: "warning", showCancelButton: true,
      confirmButtonColor: "#dc2626", cancelButtonText: "Cancelar", confirmButtonText: "Sí, eliminar",
    });
    if (!confirm.isConfirmed) return;
    await fetch(`${API_BASE}/estudios/${id}`, { method: "DELETE" });
    await cargar();
  };

  const iniciarEdicion = (r) => {
    setEditando(r);
    setNivelId(String(r.nivel_educativo_id));
    setTitulo(r.titulo);
    setInstitucion(r.institucion);
    setUniversidadId(String(r.universidad_id || ""));
    setFechaInicio(r.fecha_inicio?.split("T")[0] || "");
    setFechaFin(r.fecha_fin?.split("T")[0] || "");
    setGraduado(!!r.graduado);
  };

  // ── Drag & drop handlers ──
  const handleDragStart = (e, idx) => {
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, idx) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverIdx !== idx) setDragOverIdx(idx);
  };

  const handleDragLeave = () => setDragOverIdx(null);

  const handleDrop = async (e, dropIdx) => {
    e.preventDefault();
    setDragOverIdx(null);
    if (dragIdx === null || dragIdx === dropIdx) { setDragIdx(null); return; }
    const updated = [...registros];
    const [moved] = updated.splice(dragIdx, 1);
    updated.splice(dropIdx, 0, moved);
    setRegistros(updated);
    setDragIdx(null);
    const ordenes = updated.map((r, i) => ({ id: r.id, orden: i }));
    try {
      await fetch(`${API_BASE}/estudios/empleado/${empleadoId}/orden`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ordenes }),
      });
    } catch { /* order is already updated in UI */ }
  };

  const handleDragEnd = () => { setDragIdx(null); setDragOverIdx(null); };

  return (
    <div>
      {!soloLectura && (
        <div className="p-4 mb-6 border rounded-lg dark:border-gray-700">
          <h3 className="mb-4 font-semibold text-gray-700 dark:text-white">
            {editando ? "Editar estudio" : "Agregar estudio"}
          </h3>
          {error && <p className="mb-3 text-sm text-red-500">{error}</p>}
          <form onSubmit={guardar} className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <div>
              <label className={labelClass}>Nivel educativo *</label>
              <div className="mt-1">
                <Select options={nivelOptions} value={nivelOptions.find((o) => o.value === nivelId) || null}
                  onChange={handleNivelChange} placeholder="Seleccione..."
                  noOptionsMessage={() => "Sin opciones"} styles={selectStyles}
                  menuPortalTarget={document.body} menuPosition="fixed" />
              </div>
            </div>
            <div>
              <label className={labelClass}>Título *</label>
              <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)}
                className={inputClass} placeholder="Ej: Ingeniería de Sistemas" />
            </div>
            <div>
              <label className={labelClass}>Institución *</label>
              <input type="text" value={institucion} onChange={(e) => setInstitucion(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Universidad</label>
              <div className="mt-1">
                <Select options={univOptions} value={univOptions.find((o) => o.value === universidadId) || null}
                  onChange={(opt) => setUniversidadId(opt?.value || "")} placeholder="Seleccione..."
                  isClearable noOptionsMessage={() => "Sin universidades activas"} styles={selectStyles}
                  menuPortalTarget={document.body} menuPosition="fixed" />
              </div>
            </div>
            <div>
              <CalendarioInput
                label="Fecha inicio"
                value={fechaInicio}
                onChange={setFechaInicio}
                min={fechaNacimiento || undefined}
                diasNoLaborales={[]}
              />
            </div>
            <div>
              <CalendarioInput
                label="Fecha fin"
                value={fechaFin}
                onChange={setFechaFin}
                min={fechaInicio || undefined}
                diasNoLaborales={[]}
              />
            </div>
            <div className="flex items-center gap-2 mt-5">
              <input type="checkbox" id="graduado" checked={graduado}
                onChange={(e) => setGraduado(e.target.checked)} className="w-4 h-4" />
              <label htmlFor="graduado" className="text-sm text-gray-700 dark:text-white">Graduado</label>
            </div>
            <div className="flex col-span-2 gap-2 mt-1 md:col-span-3">
              <button type="submit" className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
                {editando ? "Actualizar" : "Agregar"}
              </button>
              {editando && (
                <button type="button" onClick={limpiar} className="px-4 py-2 text-sm text-white bg-gray-500 rounded-md hover:bg-gray-600">
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {!soloLectura && registros.length > 1 && (
        <p className="flex items-center gap-1 mb-2 text-xs text-gray-400 dark:text-gray-500">
          <span>⠿</span> Arrastra las filas para reordenar los estudios
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              {!soloLectura && <th className="w-6 px-2 py-2"></th>}
              {["Nivel", "Título", "Institución", "Universidad", "Inicio", "Fin", "Graduado", ...(soloLectura ? [] : [""])].map((h) => (
                <th key={h} className="px-4 py-2 text-xs font-medium text-left text-gray-500 uppercase dark:text-gray-300">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {registros.length === 0 ? (
              <tr>
                <td colSpan={soloLectura ? 7 : 10} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  Sin estudios registrados
                </td>
              </tr>
            ) : registros.map((r, i) => (
              <tr
                key={r.id}
                draggable={!soloLectura}
                onDragStart={!soloLectura ? (e) => handleDragStart(e, i) : undefined}
                onDragOver={!soloLectura ? (e) => handleDragOver(e, i) : undefined}
                onDragLeave={!soloLectura ? handleDragLeave : undefined}
                onDrop={!soloLectura ? (e) => handleDrop(e, i) : undefined}
                onDragEnd={!soloLectura ? handleDragEnd : undefined}
                className={`transition-colors ${
                  dragOverIdx === i
                    ? "bg-indigo-50 dark:bg-indigo-900/30 border-t-2 border-indigo-400"
                    : dragIdx === i
                    ? "opacity-40"
                    : "hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                {!soloLectura && (
                  <td className="px-2 py-3 text-center text-gray-400 select-none cursor-grab active:cursor-grabbing dark:text-gray-500">
                    ⠿
                  </td>
                )}
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{r.nivel_nombre}</td>
                <td className="px-4 py-3 text-gray-900 dark:text-white">{r.titulo}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{r.institucion}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{r.universidad_nombre || "—"}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{formatFecha(r.fecha_inicio)}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{formatFecha(r.fecha_fin)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs rounded-full text-white ${r.graduado ? "bg-green-500" : "bg-gray-400"}`}>
                    {r.graduado ? "Sí" : "No"}
                  </span>
                </td>
                {!soloLectura && (
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button onClick={() => iniciarEdicion(r)} className="mr-3 text-indigo-600 hover:text-indigo-900 dark:hover:text-indigo-400">Editar</button>
                    <button onClick={() => eliminar(r.id)} className="text-red-600 hover:text-red-900 dark:hover:text-red-400">Eliminar</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── SECCIÓN EXPERIENCIA LABORAL ─────────────────────────────────────────────

function ExperienciaSection({ empleadoId, soloLectura, fechaNacimiento }) {
  const darkMode = useContext(ThemeContext);
  const selectStyles = getSelectStyles(darkMode);

  const [registros, setRegistros] = useState([]);
  const [editando, setEditando] = useState(null);
  const [empresa, setEmpresa] = useState("");
  const [cargo, setCargo] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [empresasExternas, setEmpresasExternas] = useState([]);
  const [error, setError] = useState("");
  const [dragIdx,  setDragIdx]  = useState(null);
  const [dragOver, setDragOver] = useState(null);

  useEffect(() => { cargar(); cargarEmpresasExternas(); }, []);

  const cargar = async () => {
    const res  = await fetch(`${API_BASE}/experiencia-laboral/empleado/${empleadoId}`);
    const data = await res.json();
    setRegistros(Array.isArray(data) ? data : []);
  };

  const cargarEmpresasExternas = async () => {
    try {
      const res = await fetch(`${API_BASE}/empresas`);
      const data = await res.json();
      setEmpresasExternas(data);
    } catch { /* silently fail */ }
  };

  const limpiar = () => {
    setEditando(null);
    setEmpresa(""); setCargo(""); setFechaInicio("");
    setFechaFin(""); setDescripcion(""); setError("");
  };

  const guardar = async (e) => {
    e.preventDefault();
    setError("");
    if (!empresa.trim() || !cargo.trim() || !fechaInicio) {
      setError("Empresa, cargo y fecha de inicio son requeridos");
      return;
    }
    if (fechaNacimiento && fechaInicio <= fechaNacimiento) {
      setError("La fecha de inicio debe ser posterior a la fecha de nacimiento del empleado");
      return;
    }
    if (fechaFin && fechaFin < fechaInicio) {
      setError("La fecha fin no puede ser anterior a la fecha de inicio");
      return;
    }
    const payload = { empleado_id: empleadoId, empresa, cargo, fecha_inicio: fechaInicio, fecha_fin: fechaFin || null, descripcion: descripcion || null };
    try {
      const url = editando ? `${API_BASE}/experiencia-laboral/${editando.id}` : `${API_BASE}/experiencia-laboral`;
      const method = editando ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Error al guardar"); return; }
      await cargar();
      limpiar();
    } catch { setError("Error de conexión"); }
  };

  const eliminar = async (id) => {
    const confirm = await Swal.fire({
      title: "¿Eliminar experiencia?", icon: "warning", showCancelButton: true,
      confirmButtonColor: "#dc2626", cancelButtonText: "Cancelar", confirmButtonText: "Sí, eliminar",
    });
    if (!confirm.isConfirmed) return;
    await fetch(`${API_BASE}/experiencia-laboral/${id}`, { method: "DELETE" });
    await cargar();
  };

  const iniciarEdicion = (r) => {
    setEditando(r);
    setEmpresa(r.empresa);
    setCargo(r.cargo);
    setFechaInicio(r.fecha_inicio?.split("T")[0] || "");
    setFechaFin(r.fecha_fin?.split("T")[0] || "");
    setDescripcion(r.descripcion || "");
  };

  const onDragStart = (i) => setDragIdx(i);
  const onDragOver  = (e, i) => { e.preventDefault(); setDragOver(i); };
  const onDrop      = (e, i) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === i) { setDragIdx(null); setDragOver(null); return; }
    const lista = [...registros];
    const [item] = lista.splice(dragIdx, 1);
    lista.splice(i, 0, item);
    setRegistros(lista);
    setDragIdx(null);
    setDragOver(null);
    fetch(`${API_BASE}/experiencia-laboral/reorder`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: lista.map((r) => ({ id: r.id })) }),
    }).catch((err) => console.error("Error al guardar orden experiencia:", err));
  };
  const onDragEnd = () => { setDragIdx(null); setDragOver(null); };

  const empresaOptions = empresasExternas.map((e) => ({ value: e.nombre, label: e.nombre }));
  const empresaValue = empresa ? { value: empresa, label: empresa } : null;

  return (
    <div>
      {!soloLectura && (
        <div className="p-4 mb-6 border rounded-lg dark:border-gray-700">
          <h3 className="mb-4 font-semibold text-gray-700 dark:text-white">
            {editando ? "Editar experiencia" : "Agregar experiencia"}
          </h3>
          {error && <p className="mb-3 text-sm text-red-500">{error}</p>}
          <form onSubmit={guardar} className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <div>
              <label className={labelClass}>Empresa *</label>
              <div className="mt-1">
                <CreatableSelect options={empresaOptions} value={empresaValue}
                  onChange={(opt) => setEmpresa(opt?.value || "")} isClearable
                  placeholder="Seleccione o escriba..." formatCreateLabel={(input) => `Usar "${input}"`}
                  noOptionsMessage={() => "Sin opciones"} styles={selectStyles}
                  menuPortalTarget={document.body} menuPosition="fixed" />
              </div>
            </div>
            <div>
              <label className={labelClass}>Cargo *</label>
              <input type="text" value={cargo} onChange={(e) => setCargo(e.target.value)} className={inputClass} />
            </div>
            <div>
              <CalendarioInput
                label="Fecha inicio *"
                value={fechaInicio}
                onChange={setFechaInicio}
                min={fechaNacimiento || undefined}
                diasNoLaborales={[]}
              />
            </div>
            <div>
              <CalendarioInput
                label="Fecha fin"
                value={fechaFin}
                onChange={setFechaFin}
                min={fechaInicio || undefined}
                diasNoLaborales={[]}
              />
            </div>
            <div className="col-span-2 md:col-span-3">
              <label className={labelClass}>Descripción</label>
              <RichTextEditor value={descripcion} onChange={setDescripcion} />
            </div>
            <div className="flex col-span-2 gap-2 mt-1 md:col-span-3">
              <button type="submit" className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
                {editando ? "Actualizar" : "Agregar"}
              </button>
              {editando && (
                <button type="button" onClick={limpiar} className="px-4 py-2 text-sm text-white bg-gray-500 rounded-md hover:bg-gray-600">
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              {!soloLectura && <th className="w-6 px-2 py-2" />}
              {["Empresa", "Cargo", "Inicio", "Fin", "Descripción"].map((h) => (
                <th key={h} className="px-4 py-2 text-xs font-medium text-left text-gray-500 uppercase dark:text-gray-300">{h}</th>
              ))}
              {!soloLectura && <th className="px-4 py-2" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {registros.length === 0 ? (
              <tr><td colSpan={soloLectura ? 5 : 7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">Sin experiencia laboral registrada</td></tr>
            ) : registros.map((r, i) => (
              <tr
                key={r.id}
                draggable={!soloLectura}
                onDragStart={() => onDragStart(i)}
                onDragOver={(e) => onDragOver(e, i)}
                onDrop={(e) => onDrop(e, i)}
                onDragEnd={onDragEnd}
                className={`transition-colors ${
                  dragOver === i && dragIdx !== i
                    ? "bg-indigo-50 dark:bg-indigo-900/20"
                    : dragIdx === i
                      ? "opacity-40 bg-gray-100 dark:bg-gray-600"
                      : "hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                {!soloLectura && (
                  <td className="px-2 py-3 text-gray-300 select-none cursor-grab dark:text-gray-600" title="Arrastra para reordenar">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                      <rect y="2.5" width="16" height="1.5" rx="0.75" />
                      <rect y="7" width="16" height="1.5" rx="0.75" />
                      <rect y="11.5" width="16" height="1.5" rx="0.75" />
                    </svg>
                  </td>
                )}
                <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{r.empresa}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{r.cargo}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{formatFecha(r.fecha_inicio)}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{formatFecha(r.fecha_fin)}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300" style={{ maxWidth: "280px" }}>
                  {r.descripcion
                    ? <div className="rich-content line-clamp-3" dangerouslySetInnerHTML={{ __html: r.descripcion }} />
                    : "—"}
                </td>
                {!soloLectura && (
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => iniciarEdicion(r)} className="mr-3 text-indigo-600 hover:text-indigo-900 dark:hover:text-indigo-400">Editar</button>
                    <button onClick={() => eliminar(r.id)} className="text-red-600 hover:text-red-900 dark:hover:text-red-400">Eliminar</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── GENERADOR DE PDF ────────────────────────────────────────────────────────

const htmlToText = (html) => {
  if (!html) return "—";
  const div = document.createElement("div");
  div.innerHTML = html;
  // Numerar ítems de listas ordenadas
  div.querySelectorAll("ol").forEach((ol) => {
    let n = 1;
    Array.from(ol.children).forEach((li) => {
      if (li.tagName === "LI") { li.textContent = `${n}. ${li.textContent}`; n++; }
    });
  });
  // Añadir viñeta a listas desordenadas
  div.querySelectorAll("ul > li").forEach((li) => { li.textContent = `• ${li.textContent}`; });
  // Salto de línea tras cada bloque
  div.querySelectorAll("p, li").forEach((el) => el.after("\n"));
  const text = div.textContent?.trim().replace(/\n{3,}/g, "\n\n") || "";
  return text || "—";
};

async function generarPDFEmpleado(empleado, apiBase) {
  const [historialRes, estudiosRes, experienciaRes] = await Promise.all([
    fetch(`${apiBase}/historial-cargos/empleado/${empleado.id}`),
    fetch(`${apiBase}/estudios/empleado/${empleado.id}`),
    fetch(`${apiBase}/experiencia-laboral/empleado/${empleado.id}`),
  ]);
  const historial = await historialRes.json();
  const estudios = await estudiosRes.json();
  const experiencia = await experienciaRes.json();

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentW = pageW - margin * 2;

  // ── Header ──
  doc.setFillColor(79, 70, 229);
  doc.rect(0, 0, pageW, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("HOJA DE VIDA", margin, 12);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("empresa COL — Sistema de Gestión de Empleados", margin, 20);

  // ── Info del empleado ──
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`${empleado.nombre} ${empleado.apellido}`, margin, 38);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);

  const col1 = margin;
  const col2 = margin + contentW / 2;
  let y = 46;

  const campo = (label, valor, x, yPos) => {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 100, 100);
    doc.text(label, x, yPos);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 30, 30);
    doc.text(String(valor || "—"), x + 28, yPos);
  };

  campo("Documento:", empleado.documento, col1, y);
  campo("Estado:", empleado.estado_empleado_nombre || "—", col2, y);
  y += 6;
  campo("Correo:", empleado.correo || "—", col1, y);
  campo("Celular:", empleado.celular || "—", col2, y);
  y += 6;
  campo("Cargo:", empleado.cargo_nombre || "—", col1, y);
  campo("Sede:", empleado.empresa_nombre || "—", col2, y);
  y += 6;
  campo("Contrato:", empleado.tipo_contrato_nombre || "—", col1, y);
  campo("Salario:", formatSalario(empleado.salario), col2, y);
  y += 6;
  campo("F. Nacimiento:", formatFecha(empleado.fecha_nacimiento), col1, y);
  campo("F. Ingreso:", formatFecha(empleado.fecha_ingreso), col2, y);
  y += 8;

  // Divider
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageW - margin, y);
  y += 6;

  const sectionTitle = (title, yPos) => {
    doc.setFillColor(240, 240, 255);
    doc.rect(margin, yPos, contentW, 7, "F");
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(79, 70, 229);
    doc.text(title, margin + 2, yPos + 5);
    return yPos + 10;
  };

  // ── Historial de Cargos ──
  y = sectionTitle("HISTORIAL DE CARGOS", y);
  if (historial.length === 0) {
    doc.setFontSize(9); doc.setFont("helvetica", "italic"); doc.setTextColor(150, 150, 150);
    doc.text("Sin registros", margin, y + 4);
    y += 10;
  } else {
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [["Cargo", "Contrato", "Salario", "Inicio", "Fin", "Motivo"]],
      body: historial.map((r) => [
        r.cargo_nombre,
        r.tipo_contrato_nombre,
        formatSalario(r.salario),
        formatFecha(r.fecha_inicio),
        r.fecha_fin ? formatFecha(r.fecha_fin) : "Actual",
        r.motivo || "—",
      ]),
      headStyles: { fillColor: [79, 70, 229], textColor: 255, fontSize: 8, fontStyle: "bold" },
      bodyStyles: { fontSize: 8, textColor: [50, 50, 50] },
      alternateRowStyles: { fillColor: [248, 248, 255] },
      styles: { cellPadding: 2 },
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  // ── Estudios ──
  y = sectionTitle("ESTUDIOS", y);
  if (estudios.length === 0) {
    doc.setFontSize(9); doc.setFont("helvetica", "italic"); doc.setTextColor(150, 150, 150);
    doc.text("Sin registros", margin, y + 4);
    y += 10;
  } else {
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [["Nivel", "Título", "Institución / Universidad", "Inicio", "Fin", "Graduado"]],
      body: estudios.map((r) => [
        r.nivel_nombre,
        r.titulo,
        r.universidad_nombre ? `${r.institucion} / ${r.universidad_nombre}` : r.institucion,
        formatFecha(r.fecha_inicio),
        formatFecha(r.fecha_fin),
        r.graduado ? "Sí" : "No",
      ]),
      headStyles: { fillColor: [79, 70, 229], textColor: 255, fontSize: 8, fontStyle: "bold" },
      bodyStyles: { fontSize: 8, textColor: [50, 50, 50] },
      alternateRowStyles: { fillColor: [248, 248, 255] },
      styles: { cellPadding: 2 },
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  // ── Experiencia Laboral ──
  y = sectionTitle("EXPERIENCIA LABORAL", y);
  if (experiencia.length === 0) {
    doc.setFontSize(9); doc.setFont("helvetica", "italic"); doc.setTextColor(150, 150, 150);
    doc.text("Sin registros", margin, y + 4);
  } else {
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [["Empresa", "Cargo", "Inicio", "Fin", "Descripción"]],
      body: experiencia.map((r) => [
        r.empresa,
        r.cargo,
        formatFecha(r.fecha_inicio),
        formatFecha(r.fecha_fin),
        htmlToText(r.descripcion),
      ]),
      headStyles: { fillColor: [79, 70, 229], textColor: 255, fontSize: 8, fontStyle: "bold" },
      bodyStyles: { fontSize: 8, textColor: [50, 50, 50] },
      alternateRowStyles: { fillColor: [248, 248, 255] },
      styles: { cellPadding: 2 },
      columnStyles: { 4: { cellWidth: 50 } },
    });
  }

  // Footer on every page
  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Generado el ${new Date().toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" })}   —   Página ${p} de ${totalPages}`,
      pageW / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: "center" },
    );
  }

  doc.save(`HojaDeVida_${empleado.nombre}_${empleado.apellido}.pdf`);
}

// ─── PÁGINA PRINCIPAL ────────────────────────────────────────────────────────

function EmpleadoDetallePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const esRolEmpleado = usuario?.rol === "EMPLEADO";

  const [empleado, setEmpleado] = useState(null);
  const [cargos, setCargos] = useState([]);
  const [tiposContrato, setTiposContrato] = useState([]);
  const [nivelesEducativos, setNivelesEducativos] = useState([]);
  const [universidades, setUniversidades] = useState([]);
  const [tabActivo, setTabActivo] = useState("historial");
  const [cargando, setCargando] = useState(true);
  const [generandoPDF, setGenerandoPDF] = useState(false);

  // Mini-form para edición de perfil propio (rol EMPLEADO)
  const [editNombre,    setEditNombre]    = useState("");
  const [editApellido,  setEditApellido]  = useState("");
  const [editCorreo,    setEditCorreo]    = useState("");
  const [editCelular,   setEditCelular]   = useState(""); // dígitos crudos, sin formato
  const [guardandoPerfil, setGuardandoPerfil] = useState(false);

  useEffect(() => {
    const cargarTodo = async () => {
      try {
        const [empRes, cargosRes, tiposRes, nivelesRes, univRes] = await Promise.all([
          fetch(`${API_BASE}/empleados`),
          fetch(`${API_BASE}/cargos?all=true`),
          fetch(`${API_BASE}/tipos-contrato`),
          fetch(`${API_BASE}/nivel-educativo`),
          fetch(`${API_BASE}/universidades`),
        ]);
        const empleados = await empRes.json();
        const emp = empleados.find((e) => String(e.id) === String(id));
        if (!emp) {
          Swal.fire({ icon: "error", title: "No encontrado", text: "El empleado no existe" });
          navigate("/empleados");
          return;
        }
        setEmpleado(emp);
        setEditNombre(emp.nombre || "");
        setEditApellido(emp.apellido || "");
        setEditCorreo(emp.correo || "");
        setEditCelular((emp.celular || "").replace(/\D/g, ""));
        setCargos(await cargosRes.json());
        setTiposContrato(await tiposRes.json());
        setNivelesEducativos(await nivelesRes.json());
        setUniversidades(await univRes.json());
      } catch {
        Swal.fire({ icon: "error", title: "Error", text: "Error al cargar datos del empleado" });
      } finally {
        setCargando(false);
      }
    };
    cargarTodo();
  }, [id]);

  const handleGuardarPerfil = async (e) => {
    e.preventDefault();
    if (!editNombre.trim() || !editApellido.trim() || !editCorreo.trim()) {
      Swal.fire({ icon: "warning", title: "Campos requeridos", text: "Nombre, apellido y correo son obligatorios" });
      return;
    }
    setGuardandoPerfil(true);
    try {
      const res = await fetch(`${API_BASE}/empleados/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...empleado,
          nombre:   editNombre.trim(),
          apellido: editApellido.trim(),
          correo:   editCorreo.trim(),
          celular:  editCelular,
        }),
      });
      const data = await res.json();
      if (!res.ok) return Swal.fire({ icon: "error", title: "Error", text: data.error });
      setEmpleado(data);
      Swal.fire({ icon: "success", title: "Perfil actualizado", timer: 1500, showConfirmButton: false });
    } catch {
      Swal.fire({ icon: "error", title: "Error de conexión" });
    } finally {
      setGuardandoPerfil(false);
    }
  };

  const handleExportarPDF = async () => {
    setGenerandoPDF(true);
    try {
      await generarPDFEmpleado(empleado, API_BASE);
    } catch {
      Swal.fire({ icon: "error", title: "Error", text: "No se pudo generar el PDF" });
    } finally {
      setGenerandoPDF(false);
    }
  };

  const tabs = [
    { key: "historial", label: "Historial de cargos en la empresa" },
    { key: "estudios", label: "Estudios" },
    { key: "experiencia", label: "Experiencia Laboral" },
  ];

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        Cargando...
      </div>
    );
  }

  if (!empleado) return null;

  // EMPLEADO no puede ver el perfil de otro empleado
  if (esRolEmpleado && usuario.empleado_id && Number(id) !== Number(usuario.empleado_id)) {
    return <Navigate to={`/empleados/${usuario.empleado_id}`} replace />;
  }

  const soloLectura = empleado.estado === 0;
  // Las secciones de historial/estudios/experiencia son siempre solo lectura para el rol EMPLEADO
  const soloLecturaSeccion = soloLectura || esRolEmpleado;
  const fechaNacimiento = empleado.fecha_nacimiento?.split("T")[0] || "";

  const esHoyCumple = (() => {
    if (!empleado.fecha_nacimiento) return false;
    const [, m, d] = String(empleado.fecha_nacimiento).split("T")[0].split("-");
    const hoy = new Date();
    return hoy.getMonth() + 1 === Number(m) && hoy.getDate() === Number(d);
  })();

  return (
    <div>
      {!esRolEmpleado && (
        <button
          onClick={() => navigate("/empleados")}
          className="flex items-center gap-2 mb-6 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          ← Volver a Empleados
        </button>
      )}

      {soloLectura && (
        <div className="flex items-center gap-2 px-4 py-3 mb-6 text-sm border rounded-lg text-amber-800 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700">
          <svg className="flex-shrink-0 w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
          Este empleado está retirado. El detalle es de solo lectura.
        </div>
      )}

      {esHoyCumple && (
        <div className="relative p-6 mb-6 overflow-hidden shadow-lg rounded-xl bg-gradient-to-r from-amber-400 via-orange-400 to-pink-500">
          {/* Círculos decorativos de fondo */}
          <div className="absolute w-40 h-40 rounded-full pointer-events-none -top-8 -right-8 bg-white/10" />
          <div className="absolute rounded-full pointer-events-none -bottom-6 -left-6 w-28 h-28 bg-white/10" />
          <div className="absolute w-16 h-16 rounded-full pointer-events-none top-2 right-32 bg-white/10" />

          {/* Confeti decorativo */}
          <span className="absolute top-4 right-16 w-2.5 h-2.5 rounded-full bg-yellow-200 opacity-80" />
          <span className="absolute w-3 h-3 bg-pink-200 rounded-full top-10 right-10 opacity-70" />
          <span className="absolute w-2 h-2 rounded-full bottom-5 right-24 bg-white/60" />
          <span className="absolute w-2 h-2 bg-yellow-100 rounded-full bottom-3 left-1/3 opacity-60" />
          <span className="absolute top-3 left-1/2 w-2.5 h-2.5 rounded-full bg-pink-100 opacity-50" />

          <div className="relative flex items-center gap-5">
            <div className="flex-shrink-0 text-6xl select-none" aria-hidden="true">🎂</div>
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-white/80 mb-0.5">
                ¡Hoy es un día especial!
              </p>
              <h2 className="text-2xl font-bold leading-tight text-white">
                ¡Feliz cumpleaños, {empleado.nombre}!
              </h2>
              <p className="mt-1.5 text-sm text-white/90">
                Todo el equipo te desea un día increíble. ¡Gracias por ser parte de la familia!
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 mb-6 bg-white rounded-lg shadow-md sm:p-6 md:mb-8 dark:bg-gray-800">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-bold leading-tight text-gray-900 sm:text-2xl dark:text-white">
              {empleado.nombre} {empleado.apellido}
            </h1>
            <p className="mt-1 text-xs text-gray-500 break-all sm:text-sm dark:text-gray-400">
              Doc: {empleado.documento} · {empleado.correo} · {formatCelular(empleado.celular)}
            </p>
          </div>
          <span
            className={`flex-shrink-0 px-3 py-1 text-xs font-semibold rounded-full text-white ${
              empleado.estado_empleado_nombre === "Activo" ? "bg-green-500" :
              empleado.estado_empleado_nombre === "Licencia" ? "bg-yellow-500" :
              empleado.estado_empleado_nombre === "Vacaciones" ? "bg-blue-500" :
              "bg-gray-500"
            }`}
          >
            {empleado.estado_empleado_nombre}
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 mt-4 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <p className={labelClass}>Cargo actual</p>
            <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white">{empleado.cargo_nombre || "—"}</p>
          </div>
          <div>
            <p className={labelClass}>Contrato</p>
            <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white">{empleado.tipo_contrato_nombre || "—"}</p>
          </div>
          <div>
            <p className={labelClass}>Salario</p>
            <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white">
              ${new Intl.NumberFormat("es-CO").format(empleado.salario)}
            </p>
          </div>
          <div>
            <p className={labelClass}>Sede</p>
            <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white">{empleado.empresa_nombre || "—"}</p>
          </div>
          <div>
            <p className={labelClass}>Fecha de ingreso</p>
            <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white">{formatFecha(empleado.fecha_ingreso)}</p>
          </div>
          <div>
            <p className={labelClass}>Fecha de nacimiento</p>
            <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white">{formatFecha(empleado.fecha_nacimiento)}</p>
          </div>
        </div>
      </div>

      {/* Mini-form: solo visible para rol EMPLEADO viendo su propio perfil */}
      {esRolEmpleado && !soloLectura && (
        <div className="p-6 mb-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
          <h2 className="mb-4 text-base font-semibold text-gray-800 dark:text-white">Editar mi información</h2>
          <form onSubmit={handleGuardarPerfil}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className={labelClass}>Nombre</label>
                <input
                  value={editNombre}
                  onChange={(e) => setEditNombre(e.target.value)}
                  className={inputClass}
                  placeholder="Nombre"
                />
              </div>
              <div>
                <label className={labelClass}>Apellido</label>
                <input
                  value={editApellido}
                  onChange={(e) => setEditApellido(e.target.value)}
                  className={inputClass}
                  placeholder="Apellido"
                />
              </div>
              <div>
                <label className={labelClass}>Correo electrónico</label>
                <input
                  type="email"
                  value={editCorreo}
                  onChange={(e) => setEditCorreo(e.target.value)}
                  className={inputClass}
                  placeholder="correo@empresa.com"
                />
              </div>
              <div>
                <label className={labelClass}>Celular</label>
                <input
                  type="text"
                  value={
                    editCelular.length > 6
                      ? `(${editCelular.slice(0, 3)}) ${editCelular.slice(3, 6)} - ${editCelular.slice(6)}`
                      : editCelular.length > 3
                        ? `(${editCelular.slice(0, 3)}) ${editCelular.slice(3)}`
                        : editCelular.length > 0
                          ? `(${editCelular}`
                          : ""
                  }
                  onChange={(e) => {
                    const soloDigitos = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setEditCelular(soloDigitos);
                  }}
                  className={inputClass}
                  placeholder="(123) 456 - 7890"
                />
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button
                type="submit"
                disabled={guardandoPerfil}
                className="px-4 py-2 text-sm font-semibold text-white transition-colors bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-60"
              >
                {guardandoPerfil ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md dark:bg-gray-800">
        <div className="flex flex-col border-b sm:flex-row sm:items-center sm:justify-between dark:border-gray-700">
          <div className="flex overflow-x-auto scrollbar-none">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setTabActivo(tab.key)}
                className={`flex-shrink-0 px-4 sm:px-6 py-3 text-xs sm:text-sm font-medium transition-colors border-b-2 ${
                  tabActivo === tab.key
                    ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400"
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportarPDF}
            disabled={generandoPDF}
            className="flex items-center gap-2 mx-3 mb-3 sm:mb-0 sm:mr-4 px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors self-start sm:self-auto"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            {generandoPDF ? "Generando..." : "Exportar PDF"}
          </button>
        </div>

        <div className="p-4 sm:p-6">
          {tabActivo === "historial" && (
            <HistorialSection
              empleadoId={id}
              soloLectura={soloLecturaSeccion}
            />
          )}
          {tabActivo === "estudios" && (
            <EstudiosSection
              empleadoId={id}
              nivelesEducativos={nivelesEducativos}
              universidades={universidades}
              soloLectura={soloLectura}
              fechaNacimiento={fechaNacimiento}
            />
          )}
          {tabActivo === "experiencia" && (
            <ExperienciaSection
              empleadoId={id}
              soloLectura={soloLectura}
              fechaNacimiento={fechaNacimiento}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default EmpleadoDetallePage;
