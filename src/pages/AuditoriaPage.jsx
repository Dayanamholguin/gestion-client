import { useState, useEffect } from "react";
import API_BASE from "../config/api";

const TABLAS = [
  "tb_empleados", "tb_usuarios", "tb_historial_cargos",
  "tb_estudios", "tb_experiencia_laboral",
];

const ACCION_BADGE = {
  CREATE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  UPDATE: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  DELETE: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const ACCION_LABEL = {
  CREATE: "Creación",
  UPDATE: "Actualización",
  DELETE: "Eliminación",
};

const TABLA_LABEL = {
  tb_empleados:          "Empleados",
  tb_usuarios:           "Usuarios",
  tb_historial_cargos:   "Historial cargos",
  tb_estudios:           "Estudios",
  tb_experiencia_laboral:"Experiencia laboral",
};

// Campos que nunca se muestran al usuario
const CAMPOS_OCULTOS = new Set([
  "id", "created_at", "updated_at", "creadoPor",
  "password", "password_hash", "estado",
]);

// Campos _id que se ocultan si existe su versión _nombre en el objeto
const CAMPOS_ID_CON_NOMBRE = {
  cargo_id:           "cargo_nombre",
  tipo_contrato_id:   "tipo_contrato_nombre",
  estado_empleado_id: "estado_empleado_nombre",
  empresa_id:         "empresa_nombre",
  nivel_educativo_id: "nivel_educativo_nombre",
  universidad_id:     "universidad_nombre",
  rol_id:             "rol",
  empleado_id:        "empleado_nombre",
};

// Etiquetas legibles para cada campo de la BD
const CAMPO_LABEL = {
  nombre:                 "Nombre",
  apellido:               "Apellido",
  documento:              "Documento",
  correo:                 "Correo electrónico",
  celular:                "Celular",
  salario:                "Salario",
  fecha_ingreso:          "Fecha de ingreso",
  fecha_nacimiento:       "Fecha de nacimiento",
  cargo_id:               "Cargo",
  cargo_nombre:           "Cargo",
  cargo:                  "Cargo",
  tipo_contrato_id:       "Tipo de contrato",
  tipo_contrato_nombre:   "Tipo de contrato",
  estado_empleado_id:     "Estado",
  estado_empleado_nombre: "Estado del empleado",
  empresa_id:             "Empresa",
  empresa_nombre:         "Empresa",
  empresa:                "Empresa",
  activo:                 "Activo",
  rol_id:                 "Rol",
  rol:                    "Rol",
  empleado_id:            "Empleado vinculado",
  empleado_nombre:        "Empleado vinculado",
  fecha_inicio:           "Fecha inicio",
  fecha_fin:              "Fecha fin",
  motivo:                 "Motivo",
  descripcion:            "Descripción",
  institucion:            "Institución",
  titulo:                 "Título",
  nivel_educativo_id:     "Nivel educativo",
  nivel_educativo_nombre: "Nivel educativo",
  graduado:               "Graduado",
  nit:                    "NIT",
  direccion:              "Dirección",
  telefono:               "Teléfono",
  universidad_id:         "Universidad",
  universidad_nombre:     "Universidad",
  ultimo_acceso:          "Último acceso",
  ids:                    "Empleados afectados",
};

const FECHA_CAMPOS = new Set([
  "fecha_ingreso", "fecha_nacimiento", "fecha_inicio", "fecha_fin",
]);

function formatValor(key, value) {
  if (value === null || value === undefined) return "—";
  if (Array.isArray(value)) {
    if (value.length === 0) return "ninguno";
    return `${value.length} empleado(s) — IDs: ${value.join(", ")}`;
  }
  if (key === "salario") {
    const n = Number(value);
    return isNaN(n) ? String(value) : `$${new Intl.NumberFormat("es-CO").format(n)}`;
  }
  if (key === "activo" || key === "graduado") return Number(value) ? "Sí" : "No";
  if (FECHA_CAMPOS.has(key)) {
    const d = new Date(value);
    return isNaN(d.getTime()) ? String(value)
      : d.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
  }
  if (key === "ultimo_acceso") {
    const d = new Date(value);
    return isNaN(d.getTime()) ? String(value)
      : d.toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" });
  }
  return String(value);
}

function debesMostrar(key, data) {
  if (CAMPOS_OCULTOS.has(key)) return false;
  const nombreEquivalente = CAMPOS_ID_CON_NOMBRE[key];
  if (nombreEquivalente && nombreEquivalente in data) return false;
  return true;
}

function formatFecha(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-CO", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

// Detecta qué campos cambiaron entre antes y después
function diffKeys(antes, despues) {
  if (!antes || !despues) return new Set();
  const changed = new Set();
  const allKeys = new Set([...Object.keys(antes), ...Object.keys(despues)]);
  allKeys.forEach((k) => {
    if (JSON.stringify(antes[k]) !== JSON.stringify(despues[k])) changed.add(k);
  });
  return changed;
}

function JsonPanel({ titulo, data, changedKeys = new Set(), colorBase }) {
  if (!data) return null;
  const entradas = Object.entries(data).filter(([k]) => debesMostrar(k, data));
  if (entradas.length === 0) return null;
  return (
    <div className={`flex-1 rounded-lg border ${colorBase} p-3 min-w-0`}>
      <p className="text-xs font-semibold uppercase tracking-wide mb-2 text-gray-600 dark:text-gray-300">
        {titulo}
      </p>
      <div className="space-y-1">
        {entradas.map(([k, v]) => {
          const changed = changedKeys.has(k);
          const label = CAMPO_LABEL[k] ?? k;
          return (
            <div key={k} className={`flex gap-2 text-xs rounded px-1 py-0.5 ${changed ? "bg-yellow-100 dark:bg-yellow-900/30" : ""}`}>
              <span className="text-gray-500 dark:text-gray-400 flex-shrink-0 font-medium min-w-28">
                {label}:
              </span>
              <span className="text-gray-800 dark:text-gray-200 break-all">
                {v === null ? <em className="opacity-40">Sin valor</em> : formatValor(k, v)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FilaAuditoria({ reg }) {
  const [abierto, setAbierto] = useState(false);
  const changed = diffKeys(reg.datos_anteriores, reg.datos_nuevos);
  const usuarioNombre = reg.usuario_nombre
    ? `${reg.usuario_nombre} ${reg.usuario_apellido}`
    : "Sistema";

  return (
    <>
      <tr
        className="hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer transition-colors"
        onClick={() => setAbierto((v) => !v)}
      >
        {/* Fecha */}
        <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
          {formatFecha(reg.created_at)}
        </td>
        {/* Tabla */}
        <td className="px-4 py-3">
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {TABLA_LABEL[reg.tabla] ?? reg.tabla}
          </span>
        </td>
        {/* Acción */}
        <td className="px-4 py-3">
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ACCION_BADGE[reg.accion] ?? ""}`}>
            {ACCION_LABEL[reg.accion] ?? reg.accion}
          </span>
        </td>
        {/* Registro ID */}
        <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 text-center">
          {Number(reg.registro_id) === 0
            ? <span className="italic text-gray-400 dark:text-gray-500">Masivo</span>
            : `#${reg.registro_id}`}
        </td>
        {/* Usuario */}
        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
          {usuarioNombre}
        </td>
        {/* IP */}
        <td className="px-4 py-3 text-xs text-gray-400 dark:text-gray-500">
          {reg.ip ?? "—"}
        </td>
        {/* Expand icon */}
        <td className="px-4 py-3 text-right">
          <svg
            className={`w-4 h-4 text-gray-400 inline-block transition-transform ${abierto ? "rotate-180" : ""}`}
            fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </td>
      </tr>

      {/* Detalle expandible */}
      {abierto && (
        <tr className="bg-gray-50 dark:bg-gray-900/40">
          <td colSpan={7} className="px-6 py-4">
            <div className="flex gap-4">
              {reg.datos_anteriores && (
                <JsonPanel
                  titulo="Antes"
                  data={reg.datos_anteriores}
                  changedKeys={changed}
                  colorBase="border-red-200 dark:border-red-800/50 bg-red-50/50 dark:bg-red-900/10"
                />
              )}
              {reg.datos_nuevos && (
                <JsonPanel
                  titulo="Después"
                  data={reg.datos_nuevos}
                  changedKeys={changed}
                  colorBase="border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-900/10"
                />
              )}
              {!reg.datos_anteriores && !reg.datos_nuevos && (
                <p className="text-xs text-gray-400">Sin datos registrados</p>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function AuditoriaPage() {
  const [registros,  setRegistros]  = useState([]);
  const [usuarios,   setUsuarios]   = useState([]);
  const [cargando,   setCargando]   = useState(false);
  const [buscado,    setBuscado]    = useState(false);

  const [filtros, setFiltros] = useState({
    tabla: "", accion: "", usuario_id: "",
    fecha_desde: "", fecha_hasta: "",
  });

  // Carga los usuarios para el select de filtro
  useEffect(() => {
    fetch(`${API_BASE}/usuarios`)
      .then((r) => r.json())
      .then((d) => setUsuarios(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  const handleFiltro = (e) => {
    const { name, value } = e.target;
    setFiltros((f) => ({ ...f, [name]: value }));
  };

  const buscar = async () => {
    setCargando(true);
    setBuscado(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filtros).forEach(([k, v]) => { if (v) params.append(k, v); });
      const res  = await fetch(`${API_BASE}/auditoria?${params}`);
      const data = await res.json();
      setRegistros(Array.isArray(data) ? data : []);
    } catch {
      setRegistros([]);
    } finally {
      setCargando(false);
    }
  };

  const limpiar = () => {
    setFiltros({ tabla: "", accion: "", usuario_id: "", fecha_desde: "", fecha_hasta: "" });
    setRegistros([]);
    setBuscado(false);
  };

  const inputClass =
    "px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg " +
    "bg-white dark:bg-gray-700 text-gray-900 dark:text-white " +
    "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition";

  return (
    <div>
      {/* Encabezado */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Auditoría</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Historial de cambios en el sistema (últimas 500 operaciones por búsqueda)
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 mb-6">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Filtros</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Tabla */}
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Módulo</label>
            <select name="tabla" value={filtros.tabla} onChange={handleFiltro} className={inputClass + " w-full"}>
              <option value="">Todos</option>
              {TABLAS.map((t) => (
                <option key={t} value={t}>{TABLA_LABEL[t] ?? t}</option>
              ))}
            </select>
          </div>
          {/* Acción */}
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Acción</label>
            <select name="accion" value={filtros.accion} onChange={handleFiltro} className={inputClass + " w-full"}>
              <option value="">Todas</option>
              <option value="CREATE">Creación</option>
              <option value="UPDATE">Actualización</option>
              <option value="DELETE">Eliminación</option>
            </select>
          </div>
          {/* Usuario */}
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Usuario</label>
            <select name="usuario_id" value={filtros.usuario_id} onChange={handleFiltro} className={inputClass + " w-full"}>
              <option value="">Todos</option>
              {usuarios.map((u) => (
                <option key={u.id} value={u.id}>{u.nombre} {u.apellido}</option>
              ))}
            </select>
          </div>
          {/* Fecha desde */}
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Desde</label>
            <input type="date" name="fecha_desde" value={filtros.fecha_desde}
              onChange={handleFiltro} className={inputClass + " w-full"} />
          </div>
          {/* Fecha hasta */}
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Hasta</label>
            <input type="date" name="fecha_hasta" value={filtros.fecha_hasta}
              onChange={handleFiltro} className={inputClass + " w-full"} />
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={buscar}
            disabled={cargando}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z" />
            </svg>
            {cargando ? "Buscando..." : "Buscar"}
          </button>
          <button
            onClick={limpiar}
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Limpiar
          </button>
        </div>
      </div>

      {/* Resultados */}
      {buscado && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          {cargando ? (
            <div className="py-16 text-center text-gray-400">Cargando...</div>
          ) : registros.length === 0 ? (
            <div className="py-16 text-center text-gray-400 dark:text-gray-500">
              No hay registros de auditoría con los filtros seleccionados
            </div>
          ) : (
            <>
              <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {registros.length} registro{registros.length !== 1 ? "s" : ""} — haz clic en una fila para ver el detalle
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900/40">
                    <tr>
                      {["Fecha / Hora", "Módulo", "Acción", "ID", "Usuario", "IP", ""].map((h) => (
                        <th key={h}
                          className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                    {registros.map((r) => (
                      <FilaAuditoria key={r.id} reg={r} />
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {!buscado && (
        <div className="text-center py-16 text-gray-400 dark:text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <p className="text-sm">Aplica filtros y haz clic en <strong>Buscar</strong> para ver el historial</p>
        </div>
      )}
    </div>
  );
}

export default AuditoriaPage;
