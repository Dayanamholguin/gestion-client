import { useState, useEffect, useCallback } from "react";
import Swal from "sweetalert2";
import { useAuth } from "../contexts/AuthContext";
import API_BASE from "../config/api";
import CalendarioInput from "../components/CalendarioInput";
import { getFestivos, contarDiasHabiles } from "../utils/festivos";

// ── Helpers de fecha ──────────────────────────────────────────────────────────
const parseDate = (s) => {
  if (!s) return null;
  const [y, m, d] = String(s).split("T")[0].split("-");
  return new Date(Number(y), Number(m) - 1, Number(d));
};
const formatFecha = (s) => {
  const d = parseDate(s);
  if (!d) return "—";
  return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
};

// Convierte config BD {lunes:1,...} → array de getDay() values que son LABORALES
// getDay(): 0=Dom, 1=Lun, 2=Mar, 3=Mié, 4=Jue, 5=Vie, 6=Sáb
function configToDiasLaborales(cfg) {
  if (!cfg) return [1, 2, 3, 4, 5]; // lunes a viernes por defecto
  const dias = [];
  if (cfg.domingo)   dias.push(0);
  if (cfg.lunes)     dias.push(1);
  if (cfg.martes)    dias.push(2);
  if (cfg.miercoles) dias.push(3);
  if (cfg.jueves)    dias.push(4);
  if (cfg.viernes)   dias.push(5);
  if (cfg.sabado)    dias.push(6);
  return dias;
}

// Inverso: días de semana NO laborales (para CalendarioInput)
function diasNoLaboralesFromConfig(cfg) {
  const laborales = configToDiasLaborales(cfg);
  return [0, 1, 2, 3, 4, 5, 6].filter((d) => !laborales.includes(d));
}

function calcularDiasHabiles(inicio, fin, cfg) {
  if (!inicio || !fin) return null;
  // Normalizar a YYYY-MM-DD (las fechas de MySQL pueden venir como ISO con hora)
  const ini = String(inicio).split("T")[0];
  const fin2 = String(fin).split("T")[0];
  const laborales = configToDiasLaborales(cfg);
  const añoIni = Number(ini.split("-")[0]);
  const añoFin = Number(fin2.split("-")[0]);
  const festivosMap = new Map([
    ...getFestivos(añoIni),
    ...(añoFin !== añoIni ? getFestivos(añoFin) : []),
  ]);
  return contarDiasHabiles(ini, fin2, laborales, festivosMap);
}

// ── Badge de estado ───────────────────────────────────────────────────────────
const BADGE = {
  Pendiente: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  Aprobada:  "bg-green-100  text-green-700  dark:bg-green-900/30  dark:text-green-400",
  Rechazada: "bg-red-100    text-red-700    dark:bg-red-900/30    dark:text-red-400",
};

function EstadoBadge({ estado }) {
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${BADGE[estado] ?? ""}`}>
      {estado}
    </span>
  );
}

// ── Modal configuración días laborales ────────────────────────────────────────
const DIAS_CONFIG = [
  { key: "lunes",     label: "Lunes" },
  { key: "martes",    label: "Martes" },
  { key: "miercoles", label: "Miércoles" },
  { key: "jueves",    label: "Jueves" },
  { key: "viernes",   label: "Viernes" },
  { key: "sabado",    label: "Sábado" },
  { key: "domingo",   label: "Domingo" },
];

function ModalConfigLaboral({ config, onClose, onGuardar }) {
  const [form, setForm] = useState({ ...config });
  const [guardando, setGuardando] = useState(false);

  const toggle = (key) => setForm((f) => ({ ...f, [key]: f[key] ? 0 : 1 }));

  const handleGuardar = async () => {
    setGuardando(true);
    await onGuardar(form);
    setGuardando(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-sm mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-gray-800 dark:text-white">Días laborales</h3>
          <button type="button" onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Selecciona qué días de la semana son laborales. Esto afecta el conteo de días hábiles en las solicitudes de vacaciones.
        </p>
        <div className="space-y-2 mb-6">
          {DIAS_CONFIG.map(({ key, label }) => (
            <label key={key} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={!!form[key]}
                onChange={() => toggle(key)}
                className="w-4 h-4 rounded accent-indigo-600 cursor-pointer"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {label}
              </span>
            </label>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            Cancelar
          </button>
          <button type="button" onClick={handleGuardar} disabled={guardando}
            className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium rounded-lg transition-colors">
            {guardando ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function VacacionesPage() {
  const { tienePermiso, usuario } = useAuth();
  const esGestor = tienePermiso("vacaciones:gestionar") || usuario?.rol === "ADMIN" || usuario?.rol === "RRHH";
  const esAdmin  = usuario?.rol === "ADMIN" || tienePermiso("*");

  const [vacaciones, setVacaciones]   = useState([]);
  const [cargando, setCargando]       = useState(true);
  const [filtroEstado, setFiltroEstado] = useState("");
  const [busqueda, setBusqueda]       = useState("");

  // Configuración laboral
  const [configLaboral, setConfigLaboral] = useState(null);
  const [modalConfig, setModalConfig]     = useState(false);

  // Formulario de nueva solicitud
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm]               = useState({ fecha_inicio: "", fecha_fin: "", observaciones: "" });
  const [errorForm, setErrorForm]     = useState("");
  const [guardando, setGuardando]     = useState(false);

  // Hoy en formato YYYY-MM-DD (zona Colombia)
  const ahoraCol = new Date(Date.now() - 5 * 60 * 60 * 1000);
  const hoy = ahoraCol.toISOString().split("T")[0];

  // ── Carga configuración laboral ───────────────────────────────────────────
  useEffect(() => {
    fetch(`${API_BASE}/configuracion/laboral`)
      .then((r) => r.json())
      .then((d) => setConfigLaboral(d))
      .catch(() => setConfigLaboral(null));
  }, []);

  // ── Carga vacaciones ──────────────────────────────────────────────────────
  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const params = new URLSearchParams();
      if (filtroEstado) params.set("estado", filtroEstado);
      const res  = await fetch(`${API_BASE}/vacaciones?${params}`);
      const data = await res.json();
      setVacaciones(Array.isArray(data) ? data : []);
    } catch {
      setVacaciones([]);
    } finally {
      setCargando(false);
    }
  }, [filtroEstado]);

  useEffect(() => { cargar(); }, [cargar]);

  // ── Filtro por nombre (solo gestor) ───────────────────────────────────────
  const registrosFiltrados = esGestor && busqueda.trim()
    ? vacaciones.filter((v) =>
        v.empleado_nombre?.toLowerCase().includes(busqueda.toLowerCase())
      )
    : vacaciones;

  // Días hábiles del formulario
  const diasHabilesForm = calcularDiasHabiles(form.fecha_inicio, form.fecha_fin, configLaboral);

  // ── Crear solicitud ───────────────────────────────────────────────────────
  const handleCrear = async (e) => {
    e.preventDefault();
    setErrorForm("");
    if (!form.fecha_inicio || !form.fecha_fin) {
      setErrorForm("Las fechas de inicio y fin son obligatorias");
      return;
    }
    if (form.fecha_fin <= form.fecha_inicio) {
      setErrorForm("La fecha de fin debe ser posterior a la de inicio");
      return;
    }
    setGuardando(true);
    try {
      const res = await fetch(`${API_BASE}/vacaciones`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setErrorForm(data.error || "Error al enviar"); return; }
      setMostrarForm(false);
      setForm({ fecha_inicio: "", fecha_fin: "", observaciones: "" });
      await cargar();
      Swal.fire({ toast: true, position: "top-end", icon: "success", title: "Solicitud enviada", showConfirmButton: false, timer: 2500 });
    } catch {
      setErrorForm("Error de conexión");
    } finally {
      setGuardando(false);
    }
  };

  // ── Aprobar ───────────────────────────────────────────────────────────────
  const handleAprobar = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: "¿Aprobar solicitud?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Aprobar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#16a34a",
    });
    if (!isConfirmed) return;
    const res = await fetch(`${API_BASE}/vacaciones/${id}/estado`, {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ estado: "Aprobada" }),
    });
    if (res.ok) {
      await cargar();
      Swal.fire({ toast: true, position: "top-end", icon: "success", title: "Solicitud aprobada", showConfirmButton: false, timer: 2000 });
    }
  };

  // ── Rechazar ──────────────────────────────────────────────────────────────
  const handleRechazar = async (id) => {
    const { value: motivo, isConfirmed } = await Swal.fire({
      title: "Rechazar solicitud",
      input: "textarea",
      inputLabel: "Motivo del rechazo (opcional)",
      inputPlaceholder: "Escribe el motivo aquí...",
      showCancelButton: true,
      confirmButtonText: "Rechazar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626",
    });
    if (!isConfirmed) return;
    const res = await fetch(`${API_BASE}/vacaciones/${id}/estado`, {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ estado: "Rechazada", motivo_rechazo: motivo }),
    });
    if (res.ok) {
      await cargar();
      Swal.fire({ toast: true, position: "top-end", icon: "info", title: "Solicitud rechazada", showConfirmButton: false, timer: 2000 });
    }
  };

  // ── Cancelar ──────────────────────────────────────────────────────────────
  const handleCancelar = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: "¿Cancelar solicitud?",
      text: "Esta acción no se puede deshacer",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, cancelar",
      cancelButtonText: "No",
      confirmButtonColor: "#dc2626",
    });
    if (!isConfirmed) return;
    const res = await fetch(`${API_BASE}/vacaciones/${id}`, { method: "DELETE" });
    if (res.ok) {
      await cargar();
      Swal.fire({ toast: true, position: "top-end", icon: "success", title: "Solicitud cancelada", showConfirmButton: false, timer: 2000 });
    }
  };

  // ── Guardar configuración laboral ─────────────────────────────────────────
  const handleGuardarConfig = async (nuevaConfig) => {
    try {
      const res = await fetch(`${API_BASE}/configuracion/laboral`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(nuevaConfig),
      });
      if (!res.ok) throw new Error("Error al guardar");
      setConfigLaboral(nuevaConfig);
      setModalConfig(false);
      Swal.fire({ toast: true, position: "top-end", icon: "success", title: "Días laborales actualizados", showConfirmButton: false, timer: 2000 });
    } catch {
      Swal.fire({ toast: true, position: "top-end", icon: "error", title: "Error al guardar la configuración", showConfirmButton: false, timer: 3000 });
    }
  };

  const noLaborales = diasNoLaboralesFromConfig(configLaboral);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Modal de configuración */}
      {modalConfig && configLaboral && (
        <ModalConfigLaboral
          config={configLaboral}
          onClose={() => setModalConfig(false)}
          onGuardar={handleGuardarConfig}
        />
      )}

      {/* Encabezado */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            {esGestor ? "Solicitudes de Vacaciones" : "Mis Vacaciones"}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {esGestor
              ? "Revisa, aprueba o rechaza las solicitudes de los empleados"
              : "Consulta el estado de tus solicitudes o crea una nueva"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {esAdmin && configLaboral && (
            <button
              onClick={() => setModalConfig(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Días laborales
            </button>
          )}
          {!esGestor && (
            <button
              onClick={() => { setMostrarForm((v) => !v); setErrorForm(""); }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              {mostrarForm ? "Cerrar formulario" : "Solicitar vacaciones"}
            </button>
          )}
        </div>
      </div>

      {/* Formulario de nueva solicitud (solo empleado) */}
      {!esGestor && mostrarForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Nueva solicitud</h2>
          <form onSubmit={handleCrear} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <CalendarioInput
                label="Fecha de inicio"
                required
                value={form.fecha_inicio}
                onChange={(v) => setForm((f) => ({ ...f, fecha_inicio: v }))}
                min={hoy}
                diasNoLaborales={noLaborales}
                placeholder="Seleccionar fecha"
              />
            </div>
            <div>
              <CalendarioInput
                label="Fecha de fin"
                required
                value={form.fecha_fin}
                onChange={(v) => setForm((f) => ({ ...f, fecha_fin: v }))}
                min={form.fecha_inicio || hoy}
                diasNoLaborales={noLaborales}
                placeholder="Seleccionar fecha"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Observaciones</label>
              <textarea
                rows={2}
                placeholder="Opcional..."
                value={form.observaciones}
                onChange={(e) => setForm((f) => ({ ...f, observaciones: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            {/* Contador de días hábiles */}
            {diasHabilesForm !== null && (
              <div className="sm:col-span-3">
                <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">
                  <svg className="w-4 h-4 inline mr-1 -mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75" />
                  </svg>
                  {diasHabilesForm} día{diasHabilesForm !== 1 ? "s" : ""} hábil{diasHabilesForm !== 1 ? "es" : ""}
                  <span className="text-gray-400 dark:text-gray-500 font-normal ml-1">(sin festivos ni fines de semana no laborales)</span>
                </p>
              </div>
            )}

            {errorForm && (
              <p className="sm:col-span-3 text-sm text-red-600 dark:text-red-400">{errorForm}</p>
            )}
            <div className="sm:col-span-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { setMostrarForm(false); setErrorForm(""); }}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando}
                className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium rounded-lg transition-colors"
              >
                {guardando ? "Enviando..." : "Enviar solicitud"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-4 flex flex-wrap gap-3 items-center">
        {esGestor && (
          <input
            type="text"
            placeholder="Buscar por empleado..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="flex-1 min-w-[180px] px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        )}
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Todos los estados</option>
          <option value="Pendiente">Pendiente</option>
          <option value="Aprobada">Aprobada</option>
          <option value="Rechazada">Rechazada</option>
        </select>
        {(filtroEstado || busqueda) && (
          <button
            onClick={() => { setFiltroEstado(""); setBusqueda(""); }}
            className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Limpiar
          </button>
        )}
        <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">
          {registrosFiltrados.length} registro{registrosFiltrados.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Tabla */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {cargando ? (
          <div className="flex items-center justify-center py-16 text-gray-400 dark:text-gray-500 text-sm">
            Cargando solicitudes...
          </div>
        ) : registrosFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
            <svg className="w-10 h-10 mb-3 opacity-40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            <p className="text-sm">No hay solicitudes de vacaciones</p>
            {!esGestor && (
              <p className="text-xs mt-1">Usa el botón "Solicitar vacaciones" para crear una</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                  {esGestor && (
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300 text-xs uppercase tracking-wide">
                      Empleado
                    </th>
                  )}
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300 text-xs uppercase tracking-wide">
                    Fecha inicio
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300 text-xs uppercase tracking-wide">
                    Fecha fin
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600 dark:text-gray-300 text-xs uppercase tracking-wide">
                    Días hábiles
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300 text-xs uppercase tracking-wide">
                    Estado
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300 text-xs uppercase tracking-wide">
                    Observaciones
                  </th>
                  {esGestor && (
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300 text-xs uppercase tracking-wide">
                      Revisado por
                    </th>
                  )}
                  {!esGestor && (
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300 text-xs uppercase tracking-wide">
                      Motivo rechazo
                    </th>
                  )}
                  <th className="text-center px-4 py-3 font-semibold text-gray-600 dark:text-gray-300 text-xs uppercase tracking-wide">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {registrosFiltrados.map((v) => {
                  const dias = calcularDiasHabiles(v.fecha_inicio, v.fecha_fin, configLaboral);
                  return (
                    <tr key={v.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      {esGestor && (
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-800 dark:text-white">{v.empleado_nombre}</p>
                          {v.cargo_nombre && (
                            <p className="text-xs text-gray-400 dark:text-gray-500">{v.cargo_nombre}</p>
                          )}
                        </td>
                      )}
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        {formatFecha(v.fecha_inicio)}
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        {formatFecha(v.fecha_fin)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                          {dias ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <EstadoBadge estado={v.estado} />
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 max-w-[180px]">
                        <span className="line-clamp-2">{v.observaciones || "—"}</span>
                      </td>
                      {esGestor && (
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs">
                          {v.revisado_por_nombre || "—"}
                        </td>
                      )}
                      {!esGestor && (
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400 max-w-[180px]">
                          {v.estado === "Rechazada" && v.motivo_rechazo ? (
                            <span className="text-red-500 dark:text-red-400 text-xs line-clamp-2">
                              {v.motivo_rechazo}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          {esGestor && v.estado === "Pendiente" && (
                            <>
                              <button
                                onClick={() => handleAprobar(v.id)}
                                className="px-2.5 py-1 text-xs font-medium bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 rounded-md transition-colors"
                              >
                                Aprobar
                              </button>
                              <button
                                onClick={() => handleRechazar(v.id)}
                                className="px-2.5 py-1 text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 rounded-md transition-colors"
                              >
                                Rechazar
                              </button>
                            </>
                          )}
                          {!esGestor && v.estado === "Pendiente" && (
                            <button
                              onClick={() => handleCancelar(v.id)}
                              className="px-2.5 py-1 text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 rounded-md transition-colors"
                            >
                              Cancelar
                            </button>
                          )}
                          {v.estado !== "Pendiente" && (
                            <span className="text-xs text-gray-300 dark:text-gray-600">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
