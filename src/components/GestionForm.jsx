import { useContext } from "react";
import Select from "react-select";
import { ThemeContext } from "../App";
import { getSelectStyles } from "../config/selectStyles";

function GestionForm({
  registrarDatos,
  nombre, setNombre,
  apellido, setApellido,
  documento, setDocumento,
  validarDocumentoExistente,
  correo, setCorreo,
  celular, setCelular,
  salario, setSalario,
  fechaIngreso, setFechaIngreso,
  fechaNacimiento, setFechaNacimiento,
  cargos,
  tiposContrato,
  estadosEmpleado,
  empresas,
  cargoId, setCargoId,
  tipoContratoId, setTipoContratoId,
  estadoEmpleadoId, setEstadoEmpleadoId,
  empresaId, setEmpresaId,
  errores, setErrores,
  empleadoEditando,
  limpiarFormulario,
  setEmpleadoEditando,
}) {
  const darkMode = useContext(ThemeContext);
  const selectStyles = getSelectStyles(darkMode);

  const cargoOptions = cargos.map((c) => ({ value: String(c.id), label: c.nombre }));
  const tipoOptions = tiposContrato.map((t) => ({ value: String(t.id), label: t.nombre }));
  const estadoOptions = estadosEmpleado.map((e) => ({ value: String(e.id), label: e.nombre }));
  const empresaOptions = empresas.map((e) => ({ value: String(e.id), label: e.nombre }));

  const selectedCargo = cargoOptions.find((o) => o.value === cargoId) || null;
  const selectedTipo = tipoOptions.find((o) => o.value === tipoContratoId) || null;
  const selectedEstado = estadoOptions.find((o) => o.value === estadoEmpleadoId) || null;
  const selectedEmpresa = empresaOptions.find((o) => o.value === empresaId) || null;

  return (
    <form
      onSubmit={registrarDatos}
      className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4"
    >
      {/* Nombre */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-white">Nombre</label>
        <input
          type="text"
          value={nombre}
          onChange={(e) => {
            const valor = e.target.value;
            setNombre(valor);
            setErrores((prev) => ({ ...prev, nombre: !valor.trim() ? "El nombre es obligatorio" : "" }));
          }}
          className="block w-full p-2 mt-1 border rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600"
        />
        {errores.nombre && <span className="text-sm text-red-500">{errores.nombre}</span>}
      </div>

      {/* Apellido */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-white">Apellido</label>
        <input
          type="text"
          value={apellido}
          onChange={(e) => {
            const valor = e.target.value;
            setApellido(valor);
            setErrores((prev) => ({ ...prev, apellido: !valor.trim() ? "El apellido es obligatorio" : "" }));
          }}
          className="block w-full p-2 mt-1 border rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600"
        />
        {errores.apellido && <span className="text-sm text-red-500">{errores.apellido}</span>}
      </div>

      {/* Documento */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-white">Documento</label>
        <input
          type="text"
          value={documento}
          onChange={async (e) => {
            const valor = e.target.value;
            setDocumento(valor);
            let error = "";
            if (!/^\d*$/.test(valor)) error = "El documento solo debe contener números";
            else if (valor.length < 6 || valor.length > 10) error = "El documento debe tener entre 6 y 10 dígitos";
            if (error) {
              setErrores((prev) => ({ ...prev, documento: error }));
              return;
            }
            setErrores((prev) => ({ ...prev, documento: "" }));
            await validarDocumentoExistente(valor);
          }}
          className="block w-full p-2 mt-1 border rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600"
        />
        {errores.documento && <span className="text-sm text-red-500">{errores.documento}</span>}
      </div>

      {/* Correo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-white">Correo</label>
        <input
          type="email"
          value={correo}
          onChange={(e) => {
            const valor = e.target.value;
            setCorreo(valor);
            setErrores((prev) => ({
              ...prev,
              correo: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor) ? "" : "Correo inválido",
            }));
          }}
          className="block w-full p-2 mt-1 border rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600"
        />
        {errores.correo && <span className="text-sm text-red-500">{errores.correo}</span>}
      </div>

      {/* Celular */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-white">Celular</label>
        <input
          type="text"
          value={
            celular.length > 6
              ? `(${celular.slice(0, 3)}) ${celular.slice(3, 6)} - ${celular.slice(6)}`
              : celular.length > 3
                ? `(${celular.slice(0, 3)}) ${celular.slice(3)}`
                : celular.length > 0
                  ? `(${celular}`
                  : ""
          }
          onChange={(e) => {
            const valor = e.target.value.replace(/\D/g, "").slice(0, 10);
            setCelular(valor);
            setErrores((prev) => ({
              ...prev,
              celular: valor.length === 10 ? "" : "El celular debe tener 10 dígitos",
            }));
          }}
          placeholder="(123) 456 - 7890"
          className="block w-full p-2 mt-1 border rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600"
        />
        {errores.celular && <span className="text-sm text-red-500">{errores.celular}</span>}
      </div>

      {/* Salario */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-white">Salario</label>
        <input
          type="text"
          value={new Intl.NumberFormat("es-CO").format(salario)}
          onChange={(e) => {
            const valor = e.target.value.replace(/\D/g, "");
            setSalario(valor);
            let error = "";
            if (Number(valor) <= 0) error = "El salario debe ser mayor a 0";
            else if (Number(valor) > 99999999999) error = "Salario demasiado alto";
            setErrores((prev) => ({ ...prev, salario: error }));
          }}
          className="block w-full p-2 mt-1 border rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600"
        />
        {errores.salario && <span className="text-sm text-red-500">{errores.salario}</span>}
      </div>

      {/* Cargo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-white">Cargo</label>
        <div className="mt-1">
          <Select
            options={cargoOptions}
            value={selectedCargo}
            onChange={(opt) => {
              const valor = opt?.value || "";
              setCargoId(valor);
              setErrores((prev) => ({ ...prev, cargoId: valor ? "" : "Seleccione un cargo" }));
            }}
            placeholder="Seleccione..."
            noOptionsMessage={() => "Sin opciones"}
            styles={selectStyles}
            menuPortalTarget={document.body}
            menuPosition="fixed"
          />
        </div>
        {errores.cargoId && <span className="text-sm text-red-500">{errores.cargoId}</span>}
      </div>

      {/* Tipo de contrato */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-white">Tipo contrato</label>
        <div className="mt-1">
          <Select
            options={tipoOptions}
            value={selectedTipo}
            onChange={(opt) => {
              const valor = opt?.value || "";
              setTipoContratoId(valor);
              setErrores((prev) => ({ ...prev, tipoContratoId: valor ? "" : "Seleccione un tipo de contrato" }));
            }}
            placeholder="Seleccione..."
            noOptionsMessage={() => "Sin opciones"}
            styles={selectStyles}
            menuPortalTarget={document.body}
            menuPosition="fixed"
          />
        </div>
        {errores.tipoContratoId && <span className="text-sm text-red-500">{errores.tipoContratoId}</span>}
      </div>

      {/* Empresa */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-white">Empresa</label>
        <div className="mt-1">
          <Select
            options={empresaOptions}
            value={selectedEmpresa}
            onChange={(opt) => setEmpresaId(opt?.value || "")}
            placeholder="Seleccione..."
            isClearable
            noOptionsMessage={() => "Sin opciones"}
            styles={selectStyles}
            menuPortalTarget={document.body}
            menuPosition="fixed"
          />
        </div>
      </div>

      {/* Estado del empleado */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-white">Estado empleado</label>
        {empleadoEditando === null ? (
          <input
            type="text"
            value="Activo"
            disabled
            className="block w-full p-2 mt-1 bg-gray-100 border rounded-md dark:bg-gray-600 dark:text-gray-300"
          />
        ) : (
          <div className="mt-1">
            <Select
              options={estadoOptions}
              value={selectedEstado}
              onChange={(opt) => setEstadoEmpleadoId(opt?.value || "")}
              placeholder="Seleccione..."
              noOptionsMessage={() => "Sin opciones"}
              styles={selectStyles}
              menuPortalTarget={document.body}
              menuPosition="fixed"
            />
          </div>
        )}
      </div>

      {/* Fecha ingreso */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-white">Fecha Ingreso</label>
        <input
          type="date"
          value={fechaIngreso}
          onChange={(e) => {
            const valor = e.target.value;
            setFechaIngreso(valor);
            let errorIngreso = "";
            if (fechaNacimiento && valor <= fechaNacimiento) {
              errorIngreso = "La fecha de ingreso debe ser posterior a la de nacimiento";
            }
            setErrores((prev) => ({ ...prev, fechaIngreso: errorIngreso }));
          }}
          className="block w-full p-2 mt-1 border rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600"
        />
        {errores.fechaIngreso && <span className="text-sm text-red-500">{errores.fechaIngreso}</span>}
      </div>

      {/* Fecha nacimiento */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-white">Fecha Nacimiento</label>
        <input
          type="date"
          value={fechaNacimiento}
          onChange={(e) => {
            const valor = e.target.value;
            setFechaNacimiento(valor);
            const hoy = new Date();
            const [yN, mN, dN] = valor.split("-");
            const nacimientoDate = new Date(Number(yN), Number(mN) - 1, Number(dN));
            let edad = hoy.getFullYear() - nacimientoDate.getFullYear();
            const mesActual = hoy.getMonth();
            const mesNacimiento = nacimientoDate.getMonth();
            if (mesActual < mesNacimiento || (mesActual === mesNacimiento && hoy.getDate() < nacimientoDate.getDate())) edad--;
            let errorNacimiento = "";
            let errorIngreso = "";
            if (edad < 5) errorNacimiento = "La edad mínima permitida es de 5 años";
            if (fechaIngreso && fechaIngreso <= valor) errorIngreso = "La fecha de ingreso debe ser posterior a la de nacimiento";
            setErrores((prev) => ({ ...prev, fechaNacimiento: errorNacimiento, fechaIngreso: errorIngreso }));
          }}
          className="block w-full p-2 mt-1 border rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600"
        />
        {errores.fechaNacimiento && <span className="text-sm text-red-500">{errores.fechaNacimiento}</span>}
      </div>

      {/* Botones */}
      <div className="flex gap-3 mt-4 md:col-span-2 lg:col-span-4">
        <button type="submit" className="px-6 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
          {empleadoEditando !== null ? "Actualizar" : "Registrar"}
        </button>
        {empleadoEditando !== null && (
          <button
            type="button"
            onClick={() => { limpiarFormulario(); setEmpleadoEditando(null); }}
            className="px-6 py-2 text-white bg-gray-500 rounded-md hover:bg-gray-600"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}

export default GestionForm;
