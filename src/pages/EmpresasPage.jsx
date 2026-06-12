import { useState, useEffect, useMemo } from "react";
import Swal from "sweetalert2";
import API_BASE from "../config/api";
import useTour from "../Hooks/useTour";
import TourGuide from "../components/TourGuide";
import { STEPS_EMPRESAS } from "../utils/tourSteps";
import useSort, { SortIcon } from "../Hooks/useSort";
import usePagination from "../Hooks/usePagination";
import Pagination from "../components/Pagination";

const inputClass =
  "block w-full p-2 mt-1 border rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600";
const labelClass = "block text-sm font-medium text-gray-700 dark:text-white";

const formatTelefono = (tel) => {
  if (!tel) return "—";
  const d = String(tel).replace(/\D/g, "");
  if (d.length >= 7) return `(${d.slice(0, 3)}) ${d.slice(3, 6)} - ${d.slice(6, 10)}`;
  return tel;
};

function EmpresasPage() {
  const { run: tourRun, handleFinish: tourFinish, restart: tourRestart } = useTour("empresas");

  const [empresas, setEmpresas] = useState([]);
  const [empresaEditando, setEmpresaEditando] = useState(null);
  const [nombre, setNombre] = useState("");
  const [nit, setNit] = useState("");
  const [direccion, setDireccion] = useState("");
  const [telefono, setTelefono] = useState("");
  const [correo, setCorreo] = useState("");
  const [error, setError] = useState("");

  const [filtroTexto,  setFiltroTexto]  = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");

  const empresasFiltradas = useMemo(() => {
    if (!Array.isArray(empresas)) return [];
    return empresas.filter((e) => {
      const texto = `${e.nombre} ${e.nit} ${e.correo || ""}`.toLowerCase();
      const coincideTexto  = !filtroTexto  || texto.includes(filtroTexto.toLowerCase());
      const coincideEstado = filtroEstado === "" ? true : String(e.estado) === filtroEstado;
      return coincideTexto && coincideEstado;
    });
  }, [empresas, filtroTexto, filtroEstado]);

  const { sortedItems: sortedEmpresas, sortConfig, handleSort } = useSort(empresasFiltradas, "nombre");
  const { paginatedItems, page, setPage, pageSize, setPageSize, totalItems } = usePagination(sortedEmpresas);

  useEffect(() => {
    cargarEmpresas();
  }, []);

  const cargarEmpresas = async () => {
    try {
      const response = await fetch(`${API_BASE}/empresas?all=true`);
      const data = await response.json();
      setEmpresas(data);
    } catch {
      Swal.fire({ icon: "error", title: "Error", text: "Error al cargar las empresas" });
    }
  };

  const limpiarFormulario = () => {
    setNombre("");
    setNit("");
    setDireccion("");
    setTelefono("");
    setCorreo("");
    setError("");
    setEmpresaEditando(null);
  };

  const registrarEmpresa = async (e) => {
    e.preventDefault();
    setError("");

    if (!nombre.trim() || !nit.trim()) {
      setError("Nombre y NIT son requeridos");
      return;
    }

    const payload = {
      nombre,
      nit,
      direccion,
      telefono,
      correo,
      estado: empresaEditando ? empresaEditando.estado : 1,
    };

    try {
      let response;
      if (empresaEditando) {
        response = await fetch(`${API_BASE}/empresas/${empresaEditando.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch(`${API_BASE}/empresas`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Error al guardar la empresa");
        return;
      }

      await cargarEmpresas();
      limpiarFormulario();

      Swal.fire({
        icon: "success",
        title: empresaEditando ? "Empresa actualizada" : "Empresa registrada",
        confirmButtonColor: "#4f46e5",
      });
    } catch {
      Swal.fire({ icon: "error", title: "Error", text: "Error de conexión" });
    }
  };

  const editarEmpresa = (empresa) => {
    setEmpresaEditando(empresa);
    setNombre(empresa.nombre);
    setNit(empresa.nit);
    setDireccion(empresa.direccion || "");
    setTelefono((empresa.telefono?.replace(/\D/g, "") || "").slice(0, 10));
    setCorreo(empresa.correo || "");
    setError("");
  };

  const toggleEstado = async (empresa) => {
    try {
      const response = await fetch(`${API_BASE}/empresas/${empresa.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: empresa.nombre,
          nit: empresa.nit,
          direccion: empresa.direccion || "",
          telefono: empresa.telefono || "",
          correo: empresa.correo || "",
          estado: empresa.estado ? 0 : 1,
        }),
      });
      if (!response.ok) {
        Swal.fire({ icon: "error", title: "Error", text: "Error al cambiar el estado" });
        return;
      }
      await cargarEmpresas();
    } catch {
      Swal.fire({ icon: "error", title: "Error", text: "Error de conexión" });
    }
  };

  return (
    <div>
      <TourGuide run={tourRun} steps={STEPS_EMPRESAS} onFinish={tourFinish} />

      <header className="mb-8">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Empresas</h1>
          <button onClick={tourRestart} title="Ver tour del módulo" className="p-1 rounded-full text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path strokeLinecap="round" strokeLinejoin="round" d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"/></svg>
          </button>
        </div>
        <p className="text-gray-600 dark:text-gray-300">Administra las empresas del sistema.</p>
      </header>

      {/* Formulario */}
      <div data-tour="empresas-form" className="p-6 mb-10 bg-white rounded-lg shadow-md dark:bg-gray-800">
        <h2 className="pb-2 mb-6 text-xl font-semibold text-gray-700 border-b dark:text-white">
          {empresaEditando ? "Editar Empresa" : "Registrar Empresa"}
        </h2>

        {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

        <form
          onSubmit={registrarEmpresa}
          className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          <div>
            <label className={labelClass}>Nombre *</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>NIT *</label>
            <input
              type="text"
              value={nit}
              onChange={(e) => setNit(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Dirección</label>
            <input
              type="text"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Teléfono</label>
            <input
              type="text"
              value={
                telefono.length > 6
                  ? `(${telefono.slice(0, 3)}) ${telefono.slice(3, 6)} - ${telefono.slice(6)}`
                  : telefono.length > 3
                    ? `(${telefono.slice(0, 3)}) ${telefono.slice(3)}`
                    : telefono.length > 0
                      ? `(${telefono}`
                      : ""
              }
              onChange={(e) => {
                const valor = e.target.value.replace(/\D/g, "").slice(0, 10);
                setTelefono(valor);
              }}
              placeholder="(123) 456 - 7890"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Correo</label>
            <input
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="flex items-end gap-3">
            <button
              type="submit"
              className="px-6 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
            >
              {empresaEditando ? "Actualizar" : "Registrar"}
            </button>
            {empresaEditando && (
              <button
                type="button"
                onClick={limpiarFormulario}
                className="px-6 py-2 text-white bg-gray-500 rounded-md hover:bg-gray-600"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Barra de filtros */}
      <div data-tour="empresas-filtros" className="flex items-center gap-2 mb-4 px-3 py-2.5 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 flex-shrink-0">
          <button
            onClick={() => setFiltroEstado(filtroEstado === "1" ? "" : "1")}
            className={`px-4 py-1.5 text-sm font-medium transition-colors ${filtroEstado === "1" ? "bg-indigo-600 text-white" : "bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"}`}
          >Activos</button>
          <button
            onClick={() => setFiltroEstado(filtroEstado === "0" ? "" : "0")}
            className={`px-4 py-1.5 text-sm font-medium transition-colors border-l border-gray-200 dark:border-gray-600 ${filtroEstado === "0" ? "bg-red-500 text-white" : "bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"}`}
          >Inactivos</button>
        </div>
        <div className="h-5 w-px bg-gray-200 dark:bg-gray-600 flex-shrink-0" />
        <div className="relative flex-1 min-w-0">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por nombre, NIT o correo..."
            value={filtroTexto}
            onChange={(e) => setFiltroTexto(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          />
        </div>
        {(filtroTexto || filtroEstado) && (
          <button
            onClick={() => { setFiltroTexto(""); setFiltroEstado(""); }}
            title="Limpiar filtros"
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Tabla */}
      <div data-tour="empresas-tabla" className="overflow-hidden bg-white rounded-lg shadow-md dark:bg-gray-800">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th onClick={() => handleSort("nombre")} className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-white cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                  Nombre <SortIcon field="nombre" sortConfig={sortConfig} />
                </th>
                <th onClick={() => handleSort("nit")} className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-white cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                  NIT <SortIcon field="nit" sortConfig={sortConfig} />
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-white">Dirección</th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-white">Teléfono</th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-white">Correo</th>
                <th onClick={() => handleSort("estado")} className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-white cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                  Estado <SortIcon field="estado" sortConfig={sortConfig} />
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-white">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center text-gray-500 dark:text-gray-300">
                    {empresas.length === 0 ? "No hay empresas registradas" : "Sin resultados para los filtros aplicados"}
                  </td>
                </tr>
              ) : (
                paginatedItems.map((empresa) => (
                  <tr key={empresa.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {empresa.nombre}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {empresa.nit}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {empresa.direccion || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {formatTelefono(empresa.telefono)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {empresa.correo || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full text-white ${
                          empresa.estado ? "bg-green-500" : "bg-gray-400"
                        }`}
                      >
                        {empresa.estado ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <button
                        onClick={() => editarEmpresa(empresa)}
                        className="mr-4 text-indigo-600 hover:text-indigo-900 dark:hover:text-indigo-400"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => toggleEstado(empresa)}
                        className={
                          empresa.estado
                            ? "text-red-500 hover:text-red-700"
                            : "text-green-600 hover:text-green-800"
                        }
                      >
                        {empresa.estado ? "Desactivar" : "Activar"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} pageSize={pageSize} total={totalItems} onPageChange={setPage} onPageSizeChange={setPageSize} />
      </div>
    </div>
  );
}

export default EmpresasPage;
