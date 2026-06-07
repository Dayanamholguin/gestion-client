import { useState, useEffect, useMemo } from "react";
import Swal from "sweetalert2";
import API_BASE from "../config/api";

const inputClass =
  "block w-full p-2 mt-1 border rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600";
const labelClass = "block text-sm font-medium text-gray-700 dark:text-white";

function CargosPage() {
  const [cargos, setCargos] = useState([]);
  const [cargoEditando, setCargoEditando] = useState(null);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [error, setError] = useState("");

  const [filtroTexto,  setFiltroTexto]  = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");

  const cargosFiltrados = useMemo(() => {
    if (!Array.isArray(cargos)) return [];
    return cargos.filter((c) => {
      const texto = `${c.nombre} ${c.descripcion || ""}`.toLowerCase();
      const coincideTexto  = !filtroTexto  || texto.includes(filtroTexto.toLowerCase());
      const coincideEstado = filtroEstado === "" ? true : String(c.estado) === filtroEstado;
      return coincideTexto && coincideEstado;
    });
  }, [cargos, filtroTexto, filtroEstado]);

  useEffect(() => {
    cargarCargos();
  }, []);

  const cargarCargos = async () => {
    try {
      const response = await fetch(`${API_BASE}/cargos?all=true`);
      const data = await response.json();
      setCargos(data);
    } catch {
      Swal.fire({ icon: "error", title: "Error", text: "Error al cargar los cargos" });
    }
  };

  const limpiarFormulario = () => {
    setNombre("");
    setDescripcion("");
    setError("");
    setCargoEditando(null);
  };

  const registrarCargo = async (e) => {
    e.preventDefault();
    setError("");

    if (!nombre.trim()) {
      setError("El nombre del cargo es requerido");
      return;
    }

    const payload = {
      nombre,
      descripcion,
      estado: cargoEditando ? cargoEditando.estado : 1,
    };

    try {
      let response;
      if (cargoEditando) {
        response = await fetch(`${API_BASE}/cargos/${cargoEditando.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch(`${API_BASE}/cargos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Error al guardar el cargo");
        return;
      }

      await cargarCargos();
      limpiarFormulario();

      Swal.fire({
        icon: "success",
        title: cargoEditando ? "Cargo actualizado" : "Cargo registrado",
        confirmButtonColor: "#4f46e5",
      });
    } catch {
      Swal.fire({ icon: "error", title: "Error", text: "Error de conexión" });
    }
  };

  const editarCargo = (cargo) => {
    setCargoEditando(cargo);
    setNombre(cargo.nombre);
    setDescripcion(cargo.descripcion || "");
    setError("");
  };

  const toggleEstado = async (cargo) => {
    try {
      const response = await fetch(`${API_BASE}/cargos/${cargo.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: cargo.nombre,
          descripcion: cargo.descripcion || "",
          estado: cargo.estado ? 0 : 1,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        Swal.fire({ icon: "error", title: "Error", text: data.error || "Error al cambiar estado" });
        return;
      }
      await cargarCargos();
    } catch {
      Swal.fire({ icon: "error", title: "Error", text: "Error de conexión" });
    }
  };

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Cargos</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Administra los cargos disponibles en la empresa.
        </p>
      </header>

      {/* Formulario */}
      <div className="p-6 mb-10 bg-white rounded-lg shadow-md dark:bg-gray-800">
        <h2 className="pb-2 mb-6 text-xl font-semibold text-gray-700 border-b dark:text-white">
          {cargoEditando ? "Editar Cargo" : "Registrar Cargo"}
        </h2>

        {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

        <form onSubmit={registrarCargo} className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
            <label className={labelClass}>Descripción</label>
            <input
              type="text"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="flex gap-3 md:col-span-2">
            <button
              type="submit"
              className="px-6 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
            >
              {cargoEditando ? "Actualizar" : "Registrar"}
            </button>
            {cargoEditando && (
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
      <div className="flex items-center gap-2 mb-4 px-3 py-2.5 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
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
            placeholder="Buscar por nombre o descripción..."
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
      <div className="overflow-hidden bg-white rounded-lg shadow-md dark:bg-gray-800">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                {["Nombre", "Descripción", "Estado", "Acciones"].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-white"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
              {cargosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-10 text-center text-gray-500 dark:text-gray-300">
                    {cargos.length === 0 ? "No hay cargos registrados" : "Sin resultados para los filtros aplicados"}
                  </td>
                </tr>
              ) : (
                cargosFiltrados.map((cargo) => (
                  <tr key={cargo.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {cargo.nombre}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {cargo.descripcion || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full text-white ${
                          cargo.estado ? "bg-green-500" : "bg-gray-400"
                        }`}
                      >
                        {cargo.estado ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <button
                        onClick={() => editarCargo(cargo)}
                        className="mr-4 text-indigo-600 hover:text-indigo-900 dark:hover:text-indigo-400"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => toggleEstado(cargo)}
                        className={
                          cargo.estado
                            ? "text-red-500 hover:text-red-700"
                            : "text-green-600 hover:text-green-800"
                        }
                      >
                        {cargo.estado ? "Desactivar" : "Activar"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default CargosPage;
