import { useEffect, useState, useCallback, useContext } from "react";
import Select from "react-select";
import Swal from "sweetalert2";
import API_BASE from "../config/api";
import { DEPARTAMENTOS, CIUDADES } from "../utils/colombiaData";
import { ThemeContext } from "../App";
import { getSelectStyles } from "../config/selectStyles";

export default function ConfigEmpresaPage() {
  const [empresa, setEmpresa] = useState({ nombre: "", nit: "" });
  const [sedes, setSedes]     = useState([]);
  const [cargando, setCargando] = useState(true);

  // form sede
  const sedeVacia = { nombre: "", departamento: "", ciudad: "", direccion: "" };
  const [formSede, setFormSede]   = useState(sedeVacia);
  const [editandoId, setEditandoId] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const darkMode = useContext(ThemeContext);
  const selectStyles = getSelectStyles(darkMode);

  const deptoOptions = DEPARTAMENTOS.map((d) => ({ value: d, label: d }));
  const ciudadOptions = formSede.departamento
    ? (CIUDADES[formSede.departamento] || []).map((c) => ({ value: c, label: c }))
    : [];

  const selectedDepto  = formSede.departamento ? { value: formSede.departamento, label: formSede.departamento } : null;
  const selectedCiudad = formSede.ciudad       ? { value: formSede.ciudad,       label: formSede.ciudad }       : null;

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    try {
      const [resEmp, resSedes] = await Promise.all([
        fetch(`${API_BASE}/configuracion/empresa`),
        fetch(`${API_BASE}/sedes`),
      ]);
      const dataEmp   = await resEmp.json();
      const dataSedes = await resSedes.json();
      setEmpresa({ nombre: dataEmp.nombre || "", nit: dataEmp.nit || "" });
      setSedes(Array.isArray(dataSedes) ? dataSedes : []);
    } catch {
      Swal.fire("Error", "No se pudieron cargar los datos", "error");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  // ── Empresa ────────────────────────────────────────────────────────────────
  const guardarEmpresa = async (e) => {
    e.preventDefault();
    if (!empresa.nombre.trim()) {
      return Swal.fire("Validación", "El nombre de la empresa es obligatorio", "warning");
    }
    try {
      const res = await fetch(`${API_BASE}/configuracion/empresa`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: empresa.nombre.trim(), nit: empresa.nit.trim() || null }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      Swal.fire({ icon: "success", title: "Guardado", text: "Datos de la empresa actualizados", timer: 1500, showConfirmButton: false });
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  // ── Sedes ──────────────────────────────────────────────────────────────────
  const abrirNuevaSede = () => { setFormSede(sedeVacia); setEditandoId(null); };
  const abrirEditarSede = (sede) => {
    setFormSede({
      nombre:      sede.nombre,
      departamento: sede.departamento || "",
      ciudad:      sede.ciudad || "",
      direccion:   sede.direccion || "",
    });
    setEditandoId(sede.id);
  };
  const cancelarSede = () => { setFormSede(sedeVacia); setEditandoId(null); };

  const guardarSede = async (e) => {
    e.preventDefault();
    if (!formSede.nombre.trim()) {
      return Swal.fire("Validación", "El nombre de la sede es obligatorio", "warning");
    }
    setGuardando(true);
    try {
      const url    = editandoId ? `${API_BASE}/sedes/${editandoId}` : `${API_BASE}/sedes`;
      const method = editandoId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre:       formSede.nombre.trim(),
          departamento: formSede.departamento || null,
          ciudad:       formSede.ciudad || null,
          direccion:    formSede.direccion.trim() || null,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      cancelarSede();
      await cargarDatos();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setGuardando(false);
    }
  };

  const desactivarSede = async (sede) => {
    const confirm = await Swal.fire({
      title: `¿Desactivar "${sede.nombre}"?`,
      text: "La sede dejará de aparecer en el formulario de empleados.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, desactivar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#ef4444",
    });
    if (!confirm.isConfirmed) return;
    try {
      const res = await fetch(`${API_BASE}/sedes/${sede.id}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      await cargarDatos();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  const reactivarSede = async (sede) => {
    try {
      const res = await fetch(`${API_BASE}/sedes/${sede.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: sede.nombre, departamento: sede.departamento, ciudad: sede.ciudad, direccion: sede.direccion, activo: 1 }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      await cargarDatos();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-indigo-500 rounded-full animate-spin border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Configuración de la empresa</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Administra el nombre de tu empresa y sus sedes. Las sedes aparecen en el formulario de empleados.
        </p>
      </div>

      {/* ── Datos generales ── */}
      <section className="p-6 bg-white shadow dark:bg-gray-800 rounded-2xl">
        <h2 className="mb-4 text-base font-semibold text-gray-700 dark:text-gray-200">Datos generales</h2>
        <form onSubmit={guardarEmpresa} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">
              Nombre de la empresa <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={empresa.nombre}
              onChange={(e) => setEmpresa((p) => ({ ...p, nombre: e.target.value }))}
              className="w-full px-3 py-2 text-sm text-gray-800 bg-white border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="Ej. Empresa COL S.A.S."
            />
          </div>
          <div>
            <label className="block mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">NIT</label>
            <input
              type="text"
              value={empresa.nit}
              onChange={(e) => setEmpresa((p) => ({ ...p, nit: e.target.value }))}
              className="w-full px-3 py-2 text-sm text-gray-800 bg-white border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="Ej. 900.123.456-7"
            />
          </div>
          <div className="flex justify-end sm:col-span-2">
            <button
              type="submit"
              className="px-5 py-2 text-sm font-medium text-white transition-colors bg-indigo-600 rounded-lg hover:bg-indigo-700"
            >
              Guardar datos
            </button>
          </div>
        </form>
      </section>

      {/* ── Sedes ── */}
      <section className="p-6 bg-white shadow dark:bg-gray-800 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-700 dark:text-gray-200">Sedes</h2>
          {editandoId === null && (
            <button
              onClick={abrirNuevaSede}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
            >
              + Nueva sede
            </button>
          )}
        </div>

        {/* form inline */}
        {(editandoId !== null || formSede !== sedeVacia) && (
          <form
            onSubmit={guardarSede}
            className="grid grid-cols-1 gap-3 p-4 mb-6 border border-indigo-200 sm:grid-cols-2 lg:grid-cols-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 dark:border-indigo-700"
          >
            {/* Nombre */}
            <div>
              <label className="block mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formSede.nombre}
                onChange={(e) => setFormSede((p) => ({ ...p, nombre: e.target.value }))}
                className="w-full px-3 py-2 text-sm text-gray-800 bg-white border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="Sede principal"
                autoFocus
              />
            </div>

            {/* Departamento */}
            <div>
              <label className="block mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">Departamento</label>
              <Select
                options={deptoOptions}
                value={selectedDepto}
                onChange={(opt) => setFormSede((p) => ({ ...p, departamento: opt?.value || "", ciudad: "" }))}
                placeholder="Seleccione departamento…"
                isClearable
                noOptionsMessage={() => "Sin resultados"}
                styles={selectStyles}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            </div>

            {/* Ciudad */}
            <div>
              <label className={`block text-xs font-medium mb-1 ${formSede.departamento ? "text-gray-500 dark:text-gray-400" : "text-gray-300 dark:text-gray-600"}`}>
                Ciudad
              </label>
              <Select
                options={ciudadOptions}
                value={selectedCiudad}
                onChange={(opt) => setFormSede((p) => ({ ...p, ciudad: opt?.value || "" }))}
                placeholder={formSede.departamento ? "Seleccione ciudad…" : "Seleccione ciudad"}
                isClearable
                isDisabled={!formSede.departamento}
                noOptionsMessage={() => "Sin resultados"}
                styles={selectStyles}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            </div>

            {/* Dirección */}
            <div>
              <label className="block mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">Dirección</label>
              <input
                type="text"
                value={formSede.direccion}
                onChange={(e) => setFormSede((p) => ({ ...p, direccion: e.target.value }))}
                className="w-full px-3 py-2 text-sm text-gray-800 bg-white border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="Calle 50 # 10-20"
              />
            </div>
            <div className="flex justify-end gap-2 sm:col-span-2 lg:col-span-4">
              <button
                type="button"
                onClick={cancelarSede}
                className="px-4 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium transition-colors"
              >
                {guardando ? "Guardando…" : editandoId ? "Actualizar" : "Crear sede"}
              </button>
            </div>
          </form>
        )}

        {/* tabla */}
        {sedes.length === 0 ? (
          <p className="py-6 text-sm text-center text-gray-400">No hay sedes registradas</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs font-semibold tracking-wide text-left text-gray-500 uppercase border-b border-gray-200 dark:text-gray-400 dark:border-gray-700">
                  <th className="pb-2 pr-4">Nombre</th>
                  <th className="pb-2 pr-4">Departamento</th>
                  <th className="pb-2 pr-4">Ciudad</th>
                  <th className="pb-2 pr-4">Dirección</th>
                  <th className="pb-2 text-center">Estado</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody>
                {sedes.map((s) => (
                  <tr key={s.id} className={`border-b border-gray-100 dark:border-gray-700 ${!s.activo ? "opacity-50" : ""}`}>
                    <td className="py-3 pr-4 font-medium text-gray-800 dark:text-gray-100">{s.nombre}</td>
                    <td className="py-3 pr-4 text-gray-600 dark:text-gray-300">{s.departamento || "—"}</td>
                    <td className="py-3 pr-4 text-gray-600 dark:text-gray-300">{s.ciudad || "—"}</td>
                    <td className="py-3 pr-4 text-gray-600 dark:text-gray-300">{s.direccion || "—"}</td>
                    <td className="py-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                        s.activo
                          ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                          : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                      }`}>
                        {s.activo ? "Activa" : "Inactiva"}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex justify-end gap-2">
                        {s.activo ? (
                          <>
                            <button
                              onClick={() => abrirEditarSede(s)}
                              className="px-3 py-1 text-xs font-medium text-indigo-600 transition-colors rounded-lg bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => desactivarSede(s)}
                              className="px-3 py-1 text-xs font-medium text-red-600 transition-colors rounded-lg bg-red-50 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/60"
                            >
                              Desactivar
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => reactivarSede(s)}
                            className="px-3 py-1 text-xs font-medium text-green-600 transition-colors rounded-lg bg-green-50 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/60"
                          >
                            Reactivar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
