export const validarEmpleado = ({
  nombre,
  apellido,
  documento,
  correo,
  celular,
  salario,
  fechaNacimiento,
  fechaIngreso,
  cargoId,
  tipoContratoId,
}) => {
  const errores = {};

  if (!nombre.trim()) {
    errores.nombre = "El nombre es obligatorio";
  }

  if (!apellido.trim()) {
    errores.apellido = "El apellido es obligatorio";
  }

  if (!/^\d+$/.test(documento)) {
    errores.documento = "El documento solo debe contener números";
  }

  if (documento.length < 6 || documento.length > 10) {
    errores.documento = "El documento debe tener entre 6 y 10 dígitos";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    errores.correo = "Correo inválido";
  }

  if (celular.length !== 10) {
    errores.celular = "El celular debe tener 10 dígitos";
  }

  if (Number(salario) <= 0) {
    errores.salario = "El salario debe ser mayor a 0";
  }

  if (!fechaIngreso) {
    errores.fechaIngreso = "Seleccione fecha de ingreso";
  }

  if (!fechaNacimiento) {
    errores.fechaNacimiento = "Seleccione fecha de nacimiento";
  }

  if (!cargoId) {
    errores.cargoId = "Seleccione un cargo";
  }

  if (!tipoContratoId) {
    errores.tipoContratoId = "Seleccione un tipo de contrato";
  }

  const hoy = new Date();

  const [yN, mN, dN] = String(fechaNacimiento).split("-");
  const nacimientoDate = new Date(Number(yN), Number(mN) - 1, Number(dN));

  const [yI, mI, dI] = String(fechaIngreso).split("-");
  const ingresoDate = new Date(Number(yI), Number(mI) - 1, Number(dI));

  let edad = hoy.getFullYear() - nacimientoDate.getFullYear();

  const mesActual = hoy.getMonth();

  const mesNacimiento = nacimientoDate.getMonth();

  if (
    mesActual < mesNacimiento ||
    (mesActual === mesNacimiento && hoy.getDate() < nacimientoDate.getDate())
  ) {
    edad--;
  }

  if (edad < 5) {
    errores.fechaNacimiento = "La edad mínima permitida es de 5 años";
  }

  if (fechaIngreso === fechaNacimiento) {
    errores.fechaIngreso =
      "La fecha de ingreso no puede ser igual a la fecha de nacimiento";
  }

  if (ingresoDate <= nacimientoDate) {
    errores.fechaIngreso =
      "La fecha de ingreso debe ser posterior a la fecha de nacimiento";
  }

  return errores;
};
