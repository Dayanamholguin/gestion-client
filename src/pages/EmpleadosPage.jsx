import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import { useSearch } from "../Hooks/useSearch";
import { validarEmpleado } from "../validations/empleadoValidation";
import GestionForm from "../components/GestionForm";
import GestionTable from "../components/GestionTable";
import API_BASE from "../config/api";

function EmpleadosPage() {
  const navigate = useNavigate();
  const { usuario, tienePermiso } = useAuth();

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
  const [sedeId, setSedeId] = useState("");

  // Data state
  const [registros, setRegistros] = useState([]);
  const [cargos, setCargos] = useState([]);
  const [tiposContrato, setTiposContrato] = useState([]);
  const [estadosEmpleado, setEstadosEmpleado] = useState([]);
  const [sedes, setSedes] = useState([]);

  // UI state
  const [empleadoEditando, setEmpleadoEditando] = useState(null);
  const [errores, setErrores] = useState({});
  const [validandoDocumento, setValidandoDocumento] = useState(false);
  const [empleadosSeleccionados, setEmpleadosSeleccionados] = useState([]);
  const [mostrarModalEstados, setMostrarModalEstados] = useState(false);

  // Estado de importación Excel
  const [importando, setImportando] = useState(false);
  const [mostrarModalImport, setMostrarModalImport] = useState(false);
  const [erroresImport, setErroresImport] = useState([]);
  const fileInputRef = useRef(null);

  const { busqueda, setBusqueda, registrosFiltrados, mostrarInactivos, setMostrarInactivos } =
    useSearch(registros);

  // Filtros adicionales encadenados sobre los resultados de useSearch
  const [filtroCargo,    setFiltroCargo]    = useState("");
  const [filtroContrato, setFiltroContrato] = useState("");
  const [filtroSede,     setFiltroSede]     = useState("");

  const registrosFiltradosFinal = useMemo(() => {
    return registrosFiltrados.filter((emp) => {
      const coincideCargo    = !filtroCargo    || String(emp.cargo_id)         === filtroCargo;
      const coincideContrato = !filtroContrato || String(emp.tipo_contrato_id) === filtroContrato;
      const coincideSede     = !filtroSede     || String(emp.sede_id)          === filtroSede;
      return coincideCargo && coincideContrato && coincideSede;
    });
  }, [registrosFiltrados, filtroCargo, filtroContrato, filtroSede]);

  useEffect(() => {
    cargarEmpleados();
    cargarCargos();
    cargarTiposContrato();
    cargarEstadosEmpleado();
    cargarSedes();
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

  const cargarSedes = async () => {
    try {
      const response = await fetch(`${API_BASE}/sedes?activas=true`);
      const data = await response.json();
      setSedes(Array.isArray(data) ? data : []);
    } catch {
      setSedes([]);
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
    setSedeId("");
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
      sede_id: sedeId || null,
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
    setSedeId(String(empleado.sede_id || ""));
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

  // ── Plantilla Excel e Importación ────────────────────────────────────────────

  const descargarPlantilla = async () => {
    try {
      const response = await fetch(`${API_BASE}/empleados/plantilla`);
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        Swal.fire({ icon: "error", title: "Error", text: err.error || "No se pudo generar la plantilla", confirmButtonColor: "#4f46e5" });
        return;
      }
      const blob = await response.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = "plantilla_empleados.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      Swal.fire({ icon: "error", title: "Error", text: "No se pudo descargar la plantilla", confirmButtonColor: "#4f46e5" });
    }
  };

  // Convierte cualquier valor de celda de fecha a "YYYY-MM-DD"
  const normalizarFecha = (val) => {
    if (!val) return "";
    if (val instanceof Date) {
      const y = val.getUTCFullYear();
      const m = String(val.getUTCMonth() + 1).padStart(2, "0");
      const d = String(val.getUTCDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }
    return String(val).trim().split("T")[0];
  };

  const handleImportFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setImportando(true);
      const buffer = await file.arrayBuffer();
      const wb     = XLSX.read(buffer, { cellDates: true });
      const ws     = wb.Sheets["Empleados"];

      if (!ws) {
        Swal.fire({
          icon: "error",
          title: "Archivo inválido",
          text: 'El archivo no contiene la hoja "Empleados". Descargue la plantilla oficial.',
          confirmButtonColor: "#4f46e5",
        });
        return;
      }

      // Fila 1 = instrucción, Fila 2 = encabezados → datos desde fila 3 (índice 2 en aoa)
      const rows     = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: "" });
      const dataRows = rows.slice(2).filter(row =>
        row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== "")
      );

      if (dataRows.length === 0) {
        Swal.fire({ icon: "warning", title: "Sin datos", text: "La plantilla no contiene empleados.", confirmButtonColor: "#4f46e5" });
        return;
      }
      if (dataRows.length > 500) {
        Swal.fire({ icon: "warning", title: "Límite superado", text: "Máximo 500 empleados por importación.", confirmButtonColor: "#4f46e5" });
        return;
      }

      // Mapear columnas a campos (columnas del template)
      const empleados = dataRows.map(row => ({
        nombre:           String(row[0]  ?? "").trim(),
        apellido:         String(row[1]  ?? "").trim(),
        documento:        String(row[2]  ?? "").trim(),
        correo:           String(row[3]  ?? "").trim(),
        celular:          String(row[4]  ?? "").trim(),
        salario:          String(row[5]  ?? "").trim(),
        cargo:            String(row[6]  ?? "").trim(),
        tipo_contrato:    String(row[7]  ?? "").trim(),
        sede:             String(row[8]  ?? "").trim(),
        estado:           String(row[9]  ?? "").trim() || "Activo",
        fecha_ingreso:    normalizarFecha(row[10]),
        fecha_nacimiento: normalizarFecha(row[11]),
      }));

      const response = await fetch(`${API_BASE}/empleados/importar`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ empleados }),
      });
      const resultado = await response.json();

      if (resultado.ok) {
        await Swal.fire({
          icon: "success",
          title: "Importación exitosa",
          text: `${resultado.insertados} empleado(s) importados correctamente.`,
          confirmButtonColor: "#4f46e5",
        });
        cargarEmpleados();
      } else {
        setErroresImport(resultado.errores || []);
        setMostrarModalImport(true);
      }
    } catch {
      Swal.fire({ icon: "error", title: "Error", text: "No se pudo procesar el archivo. Verifique que sea un archivo Excel válido.", confirmButtonColor: "#4f46e5" });
    } finally {
      setImportando(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div>
      <header className="mb-4 md:mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">Gestión de Empleados</h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-300">
            Administra la información de tu personal de forma eficiente.
          </p>
        </div>

        {/* Botones Excel — solo ADMIN y RRHH */}
        {tienePermiso("empleados:crear") && <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={descargarPlantilla}
            title="Descargar plantilla Excel para importación masiva"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span className="hidden sm:inline">Plantilla</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importando}
            title="Importar empleados desde archivo Excel"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {importando ? (
              <svg className="w-4 h-4 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            )}
            <span className="hidden sm:inline">{importando ? "Importando…" : "Importar"}</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleImportFile}
            className="hidden"
          />
        </div>}
      </header>

      <div className="p-4 sm:p-6 mb-6 md:mb-10 bg-white rounded-lg shadow-md dark:bg-gray-800">
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
          sedes={sedes}
          cargoId={cargoId} setCargoId={setCargoId}
          tipoContratoId={tipoContratoId} setTipoContratoId={setTipoContratoId}
          estadoEmpleadoId={estadoEmpleadoId} setEstadoEmpleadoId={setEstadoEmpleadoId}
          sedeId={sedeId} setSedeId={setSedeId}
          errores={errores} setErrores={setErrores}
          empleadoEditando={empleadoEditando}
          limpiarFormulario={limpiarFormulario}
          setEmpleadoEditando={setEmpleadoEditando}
        />
      </div>

      {/* Barra de búsqueda y filtros unificada */}
      <div className="flex flex-wrap items-center gap-2 mb-4 px-3 py-2.5 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">

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
        <div className="relative flex-1 min-w-0 w-full sm:w-auto">
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

        {/* Filtro sede */}
        {sedes.length > 0 && (
          <select
            value={filtroSede}
            onChange={(e) => setFiltroSede(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 flex-shrink-0"
          >
            <option value="">Todas las sedes</option>
            {sedes.map((s) => (
              <option key={s.id} value={String(s.id)}>{s.nombre}</option>
            ))}
          </select>
        )}

        {/* Limpiar filtros */}
        {(busqueda || filtroCargo || filtroContrato || filtroSede) && (
          <button
            onClick={() => { setBusqueda(""); setFiltroCargo(""); setFiltroContrato(""); setFiltroSede(""); }}
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

      {/* Modal de errores de importación */}
      {mostrarModalImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            {/* Encabezado */}
            <div className="flex items-start justify-between p-5 border-b dark:border-gray-700">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Errores en la importación
                </h2>
                <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                  {erroresImport.length} fila(s) con errores — corrija el archivo y vuelva a importar.
                  <br />
                  <span className="text-xs">La fila del Excel = número de fila + 2 (fila 1 = instrucciones, fila 2 = encabezados).</span>
                </p>
              </div>
              <button
                onClick={() => setMostrarModalImport(false)}
                className="ml-4 p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Lista de errores por fila */}
            <div className="overflow-y-auto p-4 flex-1 space-y-3">
              {erroresImport.map(({ fila, errores: errs }) => (
                <div
                  key={fila}
                  className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                >
                  <p className="font-semibold text-sm text-red-700 dark:text-red-400">
                    Fila {fila}
                    <span className="ml-1 font-normal text-red-500 dark:text-red-500">
                      (fila {fila + 2} en el archivo Excel)
                    </span>
                  </p>
                  <ul className="mt-1.5 space-y-0.5 list-disc list-inside">
                    {errs.map((msg, i) => (
                      <li key={i} className="text-sm text-red-600 dark:text-red-300">{msg}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Pie */}
            <div className="p-4 border-t dark:border-gray-700">
              <button
                onClick={() => setMostrarModalImport(false)}
                className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Entendido — corregiré el archivo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EmpleadosPage;
