import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Swal from "sweetalert2";
import { useSearch } from "../Hooks/useSearch";
import { validarEmpleado } from "../validations/empleadoValidation";
import GestionForm from "../components/GestionForm";
import GestionTable from "../components/GestionTable";
import API_BASE from "../config/api";

function EmpleadosPage() {
  const navigate = useNavigate();
  const { usuario } = useAuth();

  // EMPLEADO solo puede ver su propio perfil
  useEffect(() => {
    if (usuario?.rol === "EMPLEADO") {
      if (usuario.empleado_id) {
        navigate(`/empleados/${usuario.empleado_id}`, { replace: true });
      }
    }
  }, [usuario, navigate]);

  // Form state
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [documento, setDocumento] = useState("");
  const [correo, setCorreo] = useState("");
  const [celular, setCelular] = useState("");
  const [salario, setSalario] = useState("");
  const [fechaIngreso, setFechaIngreso] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [cargoId, setCargoId] = useState("");
  const [tipoContratoId, setTipoContratoId] = useState("");
  const [estadoEmpleadoId, setEstadoEmpleadoId] = useState("1");
  const [empresaId, setEmpresaId] = useState("");

  // Data state
  const [registros, setRegistros] = useState([]);
  const [cargos, setCargos] = useState([]);
  const [tiposContrato, setTiposContrato] = useState([]);
  const [estadosEmpleado, setEstadosEmpleado] = useState([]);
  const [empresas, setEmpresas] = useState([]);

  // UI state
  const [empleadoEditando, setEmpleadoEditando] = useState(null);
  const [errores, setErrores] = useState({});
  const [validandoDocumento, setValidandoDocumento] = useState(false);
  const [empleadosSeleccionados, setEmpleadosSeleccionados] = useState([]);
  const [mostrarModalEstados, setMostrarModalEstados] = useState(false);

  const { busqueda, setBusqueda, registrosFiltrados, mostrarInactivos, setMostrarInactivos } =
    useSearch(registros);

  // Filtros adicionales encadenados sobre los resultados de useSearch
  const [filtroCargo,    setFiltroCargo]    = useState("");
  const [filtroContrato, setFiltroContrato] = useState("");

  const registrosFiltradosFinal = useMemo(() => {
    return registrosFiltrados.filter((emp) => {
      const coincideCargo    = !filtroCargo    || String(emp.cargo_id)          === filtroCargo;
      const coincideContrato = !filtroContrato || String(emp.tipo_contrato_id)  === filtroContrato;
      return coincideCargo && coincideContrato;
    });
  }, [registrosFiltrados, filtroCargo, filtroContrato]);

  useEffect(() => {
    cargarEmpleados();
    cargarCargos();
    cargarTiposContrato();
    cargarEstadosEmpleado();
    cargarEmpresas();
  }, []);

  const cargarEmpleados = async () => {
    try {
      const response = await fetch(`${API_BASE}/empleados`);
      const data = await response.json();
      setRegistros(Array.isArray(data) ? data : []);
    } catch {
      Swal.fire({ icon: "error", title: "Error", text: "Error al cargar los empleados" });
    }
  };

  const cargarCargos = async () => {
    try {
      const response = await fetch(`${API_BASE}/cargos`);
      const data = await response.json();
      setCargos(Array.isArray(data) ? data : []);
    } catch { setCargos([]); }
  };

  const cargarTiposContrato = async () => {
    try {
      const response = await fetch(`${API_BASE}/tipos-contrato`);
      const data = await response.json();
      setTiposContrato(Array.isArray(data) ? data : []);
    } catch { setTiposContrato([]); }
  };

  const cargarEstadosEmpleado = async () => {
    try {
      const response = await fetch(`${API_BASE}/estados-empleado`);
      const data = await response.json();
      setEstadosEmpleado(Array.isArray(data) ? data : []);
    } catch { setEstadosEmpleado([]); }
  };

  const cargarEmpresas = async () => {
    try {
      const response = await fetch(`${API_BASE}/empresas`);
      const data = await response.json();
      setEmpresas(Array.isArray(data) ? data : []);
    } catch {
      // Silently fail — empresas may not exist yet
    }
  };

  const validarDocumentoExistente = async (doc) => {
    if (doc.length < 6) return;
    try {
      setValidandoDocumento(true);
      const empleadoId = empleadoEditando?.id || "";
      const url = empleadoId
        ? `${API_BASE}/empleados/documento/${doc}/${empleadoId}`
        : `${API_BASE}/empleados/documento/${doc}`;
      const response = await fetch(url);
      const data = await response.json();
      setErrores((prev) => ({
        ...prev,
        documento: data.existe ? "Este documento ya está registrado" : "",
      }));
    } catch (error) {
      console.error(error);
    } finally {
      setValidandoDocumento(false);
    }
  };

  const limpiarFormulario = () => {
    setNombre("");
    setApellido("");
    setDocumento("");
    setCorreo("");
    setCelular("");
    setSalario("");
    setFechaIngreso("");
    setFechaNacimiento("");
    setCargoId("");
    setTipoContratoId("");
    setEstadoEmpleadoId("1");
    setEmpresaId("");
  };

  const validarFormulario = () => {
    const nuevosErrores = validarEmpleado({
      nombre,
      apellido,
      documento,
      correo,
      celular,
      salario,
      fechaIngreso,
      fechaNacimiento,
      cargoId,
      tipoContratoId,
    });

    if (errores.documento === "Este documento ya está registrado") {
      nuevosErrores.documento = errores.documento;
    }

    const erroresFiltrados = Object.fromEntries(
      Object.entries(nuevosErrores).filter(([_, value]) => value),
    );

    setErrores(erroresFiltrados);
    return Object.keys(erroresFiltrados).length === 0;
  };

  const registrarDatos = async (e) => {
    e.preventDefault();
    if (!validarFormulario()) return;

    const payload = {
      nombre,
      apellido,
      documento,
      correo,
      celular,
      salario,
      fecha_ingreso: fechaIngreso,
      fecha_nacimiento: fechaNacimiento,
      cargo_id: cargoId,
      tipo_contrato_id: tipoContratoId,
      estado_empleado_id: estadoEmpleadoId,
      empresa_id: empresaId || null,
    };

    if (empleadoEditando !== null) {
      try {
        const response = await fetch(`${API_BASE}/empleados/${empleadoEditando.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (response.ok) {
          setRegistros((prev) =>
            prev.map((emp) => (emp.id === empleadoEditando.id ? data : emp)),
          );
          setEmpleadoEditando(null);
          limpiarFormulario();
          Swal.fire({ icon: "success", title: "Empleado actualizado", confirmButtonColor: "#4f46e5" });
        } else {
          Swal.fire({ icon: "error", title: "Error", text: data.error || "Error al actualizar" });
        }
      } catch {
        Swal.fire({ icon: "error", title: "Error", text: "Error de conexión al actualizar" });
      }
    } else {
      try {
        const response = await fetch(`${API_BASE}/empleados`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (response.ok) {
          setRegistros([...registros, data]);
          limpiarFormulario();
          Swal.fire({ icon: "success", title: "Empleado creado", confirmButtonColor: "#4f46e5" });
        } else {
          Swal.fire({ icon: "error", title: "Error", text: data.error || "Error al registrar" });
        }
      } catch {
        Swal.fire({ icon: "error", title: "Error", text: "Error de conexión al registrar" });
      }
    }
  };

  const eliminarEmpleado = async (id) => {
    const empleado = registros.find((emp) => emp.id === id);
    const result = await Swal.fire({
      title: "¿Eliminar empleado?",
      text: `Se eliminará a ${empleado.nombre} ${empleado.apellido}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });
    if (result.isConfirmed) {
      try {
        const response = await fetch(`${API_BASE}/empleados/${empleado.id}`, { method: "DELETE" });
        if (response.ok) {
          setRegistros((prev) => prev.filter((emp) => emp.id !== id));
          if (empleadoEditando?.id === id) {
            setEmpleadoEditando(null);
            limpiarFormulario();
          }
          Swal.fire({ icon: "success", title: "Empleado eliminado", confirmButtonColor: "#4f46e5" });
        } else {
          const err = await response.json().catch(() => ({}));
          Swal.fire({ icon: "error", title: "Error", text: err.error || "Error al eliminar" });
        }
      } catch {
        Swal.fire({ icon: "error", title: "Error", text: "Error de conexión al eliminar" });
      }
    }
  };

  const editarEmpleado = (id) => {
    const empleado = registros.find((emp) => emp.id === id);
    setNombre(empleado.nombre);
    setApellido(empleado.apellido);
    setDocumento(empleado.documento);
    setCorreo(empleado.correo);
    setCelular(empleado.celular);
    setSalario(empleado.salario);
    setFechaIngreso(empleado.fecha_ingreso?.split("T")[0]);
    setFechaNacimiento(empleado.fecha_nacimiento?.split("T")[0]);
    setCargoId(String(empleado.cargo_id));
    setTipoContratoId(String(empleado.tipo_contrato_id));
    setEstadoEmpleadoId(String(empleado.estado_empleado_id));
    setEmpresaId(String(empleado.empresa_id || ""));
    setEmpleadoEditando(empleado);
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return "—";
    const [y, m, d] = String(fecha).split("T")[0].split("-");
    return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString("es-CO", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const actualizarEstadosMasivos = async (estado) => {
    try {
      if (empleadosSeleccionados.length === 0) {
        Swal.fire({ icon: "warning", title: "Selecciona empleados" });
        return;
      }
      const response = await fetch(`${API_BASE}/empleados/estado-masivo`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          empleadosIds: empleadosSeleccionados.map(Number),
          estado_empleado_id: Number(estado.id),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        Swal.fire({ icon: "error", title: "Error", text: data.error || "Error desconocido" });
        return;
      }
      setRegistros((prev) =>
        prev.map((emp) =>
          empleadosSeleccionados.includes(emp.id)
            ? {
                ...emp,
                estado_empleado_id: estado.id,
                estado_empleado_nombre: estado.nombre,
                estado: estado.id === 2 ? 0 : 1,
              }
            : emp,
        ),
      );
      setEmpleadosSeleccionados([]);
      setMostrarModalEstados(false);
      Swal.fire({
        icon: "success",
        title: "Estados actualizados",
        text: `${empleadosSeleccionados.length} empleado(s) actualizados a ${estado.nombre}`,
        confirmButtonColor: "#4f46e5",
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Gestión de Empleados</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Administra la información de tu personal de forma eficiente.
        </p>
      </header>

      <div className="p-6 mb-10 bg-white rounded-lg shadow-md dark:bg-gray-800">
        <h2 className="pb-2 mb-6 text-xl font-semibold text-gray-700 border-b dark:text-white">
          {empleadoEditando !== null ? "Editar Empleado" : "Registrar Nuevo Empleado"}
        </h2>
        <GestionForm
          registrarDatos={registrarDatos}
          nombre={nombre} setNombre={setNombre}
          apellido={apellido} setApellido={setApellido}
          documento={documento} setDocumento={setDocumento}
          validarDocumentoExistente={validarDocumentoExistente}
          correo={correo} setCorreo={setCorreo}
          celular={celular} setCelular={setCelular}
          salario={salario} setSalario={setSalario}
          fechaIngreso={fechaIngreso} setFechaIngreso={setFechaIngreso}
          fechaNacimiento={fechaNacimiento} setFechaNacimiento={setFechaNacimiento}
          cargos={cargos}
          tiposContrato={tiposContrato}
          estadosEmpleado={estadosEmpleado}
          empresas={empresas}
          cargoId={cargoId} setCargoId={setCargoId}
          tipoContratoId={tipoContratoId} setTipoContratoId={setTipoContratoId}
          estadoEmpleadoId={estadoEmpleadoId} setEstadoEmpleadoId={setEstadoEmpleadoId}
          empresaId={empresaId} setEmpresaId={setEmpresaId}
          errores={errores} setErrores={setErrores}
          empleadoEditando={empleadoEditando}
          limpiarFormulario={limpiarFormulario}
          setEmpleadoEditando={setEmpleadoEditando}
        />
      </div>

      {/* Barra de búsqueda y filtros unificada */}
      <div className="flex items-center gap-2 mb-4 px-3 py-2.5 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">

        {/* Toggle activos / inactivos */}
        <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 flex-shrink-0">
          <button
            onClick={() => setMostrarInactivos(false)}
            className={`px-4 py-1.5 text-sm font-medium transition-colors ${
              !mostrarInactivos
                ? "bg-indigo-600 text-white"
                : "bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
            }`}
          >
            Activos
          </button>
          <button
            onClick={() => setMostrarInactivos(true)}
            className={`px-4 py-1.5 text-sm font-medium transition-colors border-l border-gray-200 dark:border-gray-600 ${
              mostrarInactivos
                ? "bg-red-500 text-white"
                : "bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
            }`}
          >
            Inactivos
          </button>
        </div>

        <div className="h-5 w-px bg-gray-200 dark:bg-gray-600 flex-shrink-0" />

        {/* Buscador de texto */}
        <div className="relative flex-1 min-w-0">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por nombre, apellido, documento o correo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          />
        </div>

        {/* Filtro cargo */}
        <select
          value={filtroCargo}
          onChange={(e) => setFiltroCargo(e.target.value)}
          className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 flex-shrink-0"
        >
          <option value="">Todos los cargos</option>
          {cargos.map((c) => (
            <option key={c.id} value={String(c.id)}>{c.nombre}</option>
          ))}
        </select>

        {/* Filtro tipo contrato */}
        <select
          value={filtroContrato}
          onChange={(e) => setFiltroContrato(e.target.value)}
          className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 flex-shrink-0"
        >
          <option value="">Todos los contratos</option>
          {tiposContrato.map((t) => (
            <option key={t.id} value={String(t.id)}>{t.nombre}</option>
          ))}
        </select>

        {/* Limpiar filtros */}
        {(busqueda || filtroCargo || filtroContrato) && (
          <button
            onClick={() => { setBusqueda(""); setFiltroCargo(""); setFiltroContrato(""); }}
            title="Limpiar filtros"
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Acción masiva */}
        {empleadosSeleccionados.length > 0 && (
          <>
            <div className="h-5 w-px bg-gray-200 dark:bg-gray-600 flex-shrink-0" />
            <button
              onClick={() => setMostrarModalEstados(true)}
              className="px-3 py-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors whitespace-nowrap flex-shrink-0"
            >
              Cambiar estado ({empleadosSeleccionados.length})
            </button>
          </>
        )}
      </div>

      <div className="overflow-hidden rounded-lg shadow-md">
        <GestionTable
          registrosFiltrados={registrosFiltradosFinal}
          editarEmpleado={editarEmpleado}
          eliminarEmpleado={eliminarEmpleado}
          verDetalleEmpleado={(id) => navigate(`/empleados/${id}`)}
          formatearFecha={formatearFecha}
          mostrarInactivos={mostrarInactivos}
          setMostrarInactivos={setMostrarInactivos}
          empleadosSeleccionados={empleadosSeleccionados}
          setEmpleadosSeleccionados={setEmpleadosSeleccionados}
          setMostrarModalEstados={setMostrarModalEstados}
        />
      </div>

      {mostrarModalEstados && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="p-6 bg-white rounded-lg w-96 dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold dark:text-white">Cambiar estado</h2>
            <div className="flex flex-col gap-2">
              {estadosEmpleado.map((estado) => (
                <button
                  key={estado.id}
                  onClick={() => actualizarEstadosMasivos(estado)}
                  className="p-2 border rounded-md hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
                >
                  {estado.nombre}
                </button>
              ))}
            </div>
            <button onClick={() => setMostrarModalEstados(false)} className="mt-4 text-red-500">
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default EmpleadosPage;
