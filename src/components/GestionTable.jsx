function GestionTable({
  registrosFiltrados,
  editarEmpleado,
  eliminarEmpleado,
  verDetalleEmpleado,
  formatearFecha,
  mostrarInactivos,
  setMostrarInactivos,
  empleadosSeleccionados,
  setEmpleadosSeleccionados,
  setMostrarModalEstados,
}) {
  const allSelected =
    registrosFiltrados.length > 0 &&
    registrosFiltrados.every((emp) => empleadosSeleccionados.includes(Number(emp.id)));

  const someSelected = empleadosSeleccionados.length > 0 && !allSelected;

  return (
    <div>
      {/* Tabla */}
      <div className="overflow-hidden bg-white rounded-lg shadow-md dark:bg-gray-800">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => { if (el) el.indeterminate = someSelected; }}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setEmpleadosSeleccionados(registrosFiltrados.map((emp) => emp.id));
                      } else {
                        setEmpleadosSeleccionados([]);
                      }
                    }}
                  />
                </th>
                {["Empleado", "Documento", "Contacto", "Salario", "Empresa", "Estado", "Acciones"].map((h) => (
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
              {registrosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-10 font-medium text-center text-gray-500 dark:text-gray-300">
                    {mostrarInactivos ? "No hay empleados inactivos" : "No hay empleados activos"}
                  </td>
                </tr>
              ) : (
                registrosFiltrados.map((emp) => (
                  <tr key={emp.id} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={empleadosSeleccionados.includes(Number(emp.id))}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEmpleadosSeleccionados((prev) => [...prev, Number(emp.id)]);
                          } else {
                            setEmpleadosSeleccionados((prev) => prev.filter((id) => id !== Number(emp.id)));
                          }
                        }}
                      />
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {emp.nombre} {emp.apellido}
                      </div>
                      <div className="text-xs italic text-gray-500 dark:text-gray-400">
                        Ingreso: {formatearFecha(emp.fecha_ingreso)}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap dark:text-white">
                      {emp.documento}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{emp.correo}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {`(${emp.celular.slice(0, 3)}) ${emp.celular.slice(3, 6)} - ${emp.celular.slice(6)}`}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap dark:text-white">
                      ${new Intl.NumberFormat("es-CO").format(emp.salario)}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap dark:text-gray-300">
                      {emp.empresa_nombre || "—"}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 rounded-full text-white text-xs font-semibold ${
                          emp.estado_empleado_nombre === "Activo"
                            ? "bg-green-500"
                            : emp.estado_empleado_nombre === "Licencia"
                              ? "bg-yellow-500"
                              : emp.estado_empleado_nombre === "Vacaciones"
                                ? "bg-blue-500"
                                : emp.estado_empleado_nombre === "Suspendido"
                                  ? "bg-orange-500"
                                  : emp.estado_empleado_nombre === "Reingreso"
                                    ? "bg-purple-500"
                                    : "bg-gray-500"
                        }`}
                      >
                        {emp.estado_empleado_nombre}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                      {verDetalleEmpleado && (
                        <button
                          onClick={() => verDetalleEmpleado(emp.id)}
                          className="mr-3 text-blue-600 hover:text-blue-900 dark:hover:text-blue-400"
                        >
                          Detalle
                        </button>
                      )}
                      <button
                        onClick={() => editarEmpleado(emp.id)}
                        className="mr-3 text-indigo-600 hover:text-indigo-900 dark:hover:text-indigo-400"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => eliminarEmpleado(emp.id)}
                        className="text-red-600 hover:text-red-900 dark:hover:text-red-400"
                      >
                        Eliminar
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

export default GestionTable;
