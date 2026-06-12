// Paso centrado en pantalla (sin target específico)
const centered = (title, content) => ({
  target: "body",
  placement: "center",
  disableBeacon: true,
  title,
  content,
});

// ── Tour del sistema (sidebar) ────────────────────────────────────────────────
export function getSystemSteps(usuario, tienePermiso) {
  const esEmpleado = usuario?.rol === "EMPLEADO";

  const steps = [
    centered(
      "¡Bienvenido al sistema de RRHH!",
      "Este sistema te permite gestionar empleados, vacaciones y más. Te mostramos las funciones principales en un recorrido rápido."
    ),
    {
      target: "[data-tour='nav-sidebar']",
      placement: "right",
      disableBeacon: true,
      title: "Menú de navegación",
      content: "Accede a todos los módulos desde aquí. En escritorio puedes colapsarlo para tener más espacio.",
    },
  ];

  if (!esEmpleado) {
    steps.push({
      target: "[data-tour='nav-dashboard']",
      placement: "right",
      disableBeacon: true,
      title: "Dashboard",
      content: "Visualiza métricas en tiempo real: empleados activos, distribución por cargo, cumpleaños del mes y más.",
    });
    steps.push({
      target: "[data-tour='nav-empleados']",
      placement: "right",
      disableBeacon: true,
      title: "Empleados",
      content: "Gestiona todo el personal: crea, edita, consulta historial de cargos, estudios y experiencia laboral.",
    });
  }

  if (esEmpleado && usuario?.empleado_id) {
    steps.push({
      target: "[data-tour='nav-perfil']",
      placement: "right",
      disableBeacon: true,
      title: "Mi Perfil",
      content: "Accede a tu información personal y actualiza tus datos de contacto.",
    });
  }

  steps.push({
    target: "[data-tour='nav-vacaciones']",
    placement: "right",
    disableBeacon: true,
    title: "Vacaciones",
    content: esEmpleado
      ? "Solicita tus vacaciones y consulta el estado de tus solicitudes."
      : "Gestiona las solicitudes del equipo: aprueba, rechaza y configura los días laborales.",
  });

  if (tienePermiso("auditoria:ver")) {
    steps.push({
      target: "[data-tour='nav-auditoria']",
      placement: "right",
      disableBeacon: true,
      title: "Auditoría",
      content: "Historial completo de todas las operaciones: quién creó, editó o eliminó cada registro y cuándo.",
    });
  }

  if (tienePermiso("usuarios:listar")) {
    steps.push({
      target: "[data-tour='nav-usuarios']",
      placement: "right",
      disableBeacon: true,
      title: "Usuarios",
      content: "Gestiona las cuentas de acceso al sistema: crea usuarios, asigna roles (ADMIN, RRHH, EMPLEADO) y actívalos o desactívalos.",
    });
  }

  if (tienePermiso("catalogos:empresas")) {
    steps.push({
      target: "[data-tour='nav-empresas']",
      placement: "right",
      disableBeacon: true,
      title: "Empresas externas",
      content: "Catálogo de organizaciones externas usado para registrar la experiencia laboral previa de los empleados.",
    });
  }

  if (tienePermiso("catalogos:cargos")) {
    steps.push({
      target: "[data-tour='nav-cargos']",
      placement: "right",
      disableBeacon: true,
      title: "Cargos",
      content: "Define los cargos disponibles en la empresa. Los cargos activos aparecen al crear o editar empleados.",
    });
  }

  if (tienePermiso("catalogos:universidades")) {
    steps.push({
      target: "[data-tour='nav-universidades']",
      placement: "right",
      disableBeacon: true,
      title: "Universidades",
      content: "Catálogo de instituciones educativas usado al registrar los estudios académicos de los empleados.",
    });
  }

  if (tienePermiso("*") || usuario?.rol === "ADMIN") {
    steps.push({
      target: "[data-tour='nav-configuracion']",
      placement: "right",
      disableBeacon: true,
      title: "Configuración",
      content: "Actualiza el nombre y NIT de la empresa, y gestiona las sedes de trabajo disponibles.",
    });
  }

  steps.push(
    centered(
      "¡Listo para comenzar!",
      "Ya conoces todos los módulos del sistema. Recuerda que en la parte inferior del menú lateral puedes reiniciar cualquier tour cuando lo necesites. ¡Adelante!"
    )
  );

  return steps;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const STEPS_DASHBOARD = [
  centered("Dashboard de RRHH", "Aquí encuentras un resumen visual de todos los indicadores clave de tu equipo."),
  {
    target: "[data-tour='dashboard-header']",
    placement: "bottom",
    disableBeacon: true,
    title: "Controles del dashboard",
    content: "Filtra por sede, recarga los datos manualmente o exporta el reporte a Excel o PDF.",
  },
  {
    target: "[data-tour='dashboard-config']",
    placement: "left",
    disableBeacon: true,
    title: "Personalizar widgets",
    content: "Activa, desactiva y reordena los widgets según lo que necesites ver.",
  },
  {
    target: "[data-tour='dashboard-widgets']",
    placement: "top",
    disableBeacon: true,
    title: "Widgets de métricas",
    content: "Cada tarjeta muestra una métrica diferente. Los datos se actualizan automáticamente cada 30 segundos.",
  },
];

// ── Empleados ─────────────────────────────────────────────────────────────────
export const STEPS_EMPLEADOS = [
  centered("Gestión de empleados", "En este módulo gestionas todo el personal de la empresa."),
  {
    target: "[data-tour='empleados-acciones']",
    placement: "bottom",
    disableBeacon: true,
    title: "Importación masiva",
    content: "Descarga la plantilla Excel, llénala con los datos y súbela para crear hasta 500 empleados de una vez.",
  },
  {
    target: "[data-tour='empleados-filtros']",
    placement: "bottom",
    disableBeacon: true,
    title: "Filtros de búsqueda",
    content: "Busca empleados por nombre, cargo, contrato o sede. Alterna entre activos e inactivos con los botones.",
  },
  {
    target: "[data-tour='empleados-tabla']",
    placement: "top",
    disableBeacon: true,
    title: "Lista de empleados",
    content: "Haz clic en un empleado para ver su detalle completo: historial de cargos, estudios y experiencia laboral.",
  },
];

// ── Vacaciones (gestor ADMIN/RRHH) ────────────────────────────────────────────
export const STEPS_VACACIONES_GESTOR = [
  centered("Gestión de vacaciones", "Administra las solicitudes de vacaciones de todo el equipo."),
  {
    target: "[data-tour='vacaciones-filtros']",
    placement: "bottom",
    disableBeacon: true,
    title: "Filtros",
    content: "Busca solicitudes por nombre de empleado o filtra por estado: Pendiente, Aprobada o Rechazada.",
  },
  {
    target: "[data-tour='vacaciones-tabla']",
    placement: "top",
    disableBeacon: true,
    title: "Solicitudes",
    content: "Las solicitudes pendientes muestran los botones Aprobar y Rechazar. Puedes añadir un motivo al rechazar.",
  },
  {
    target: "[data-tour='vacaciones-config']",
    placement: "bottom",
    disableBeacon: true,
    title: "Días laborales",
    content: "Configura qué días de la semana son laborables. Afecta el cálculo de días hábiles en todas las solicitudes.",
  },
];

// ── Vacaciones (empleado) ─────────────────────────────────────────────────────
export const STEPS_VACACIONES_EMPLEADO = [
  centered("Mis vacaciones", "Solicita y sigue el estado de tus períodos de vacaciones."),
  {
    target: "[data-tour='vacaciones-solicitar']",
    placement: "bottom",
    disableBeacon: true,
    title: "Solicitar vacaciones",
    content: "Haz clic aquí para abrir el formulario. Selecciona fechas y el sistema calculará automáticamente los días hábiles.",
  },
  {
    target: "[data-tour='vacaciones-filtros']",
    placement: "bottom",
    disableBeacon: true,
    title: "Filtrar solicitudes",
    content: "Filtra tus solicitudes por estado para encontrar rápidamente lo que buscas.",
  },
  {
    target: "[data-tour='vacaciones-tabla']",
    placement: "top",
    disableBeacon: true,
    title: "Mis solicitudes",
    content: "Aquí aparecen todas tus solicitudes con su estado actual. Las pendientes se pueden cancelar.",
  },
];

// ── Auditoría ─────────────────────────────────────────────────────────────────
export const STEPS_AUDITORIA = [
  centered("Auditoría del sistema", "Registro completo de todas las operaciones realizadas: creaciones, modificaciones y eliminaciones."),
  {
    target: "[data-tour='auditoria-filtros']",
    placement: "bottom",
    disableBeacon: true,
    title: "Filtros de búsqueda",
    content: "Filtra por módulo, tipo de acción, usuario o rango de fechas para encontrar registros específicos.",
  },
  {
    target: "[data-tour='auditoria-tabla']",
    placement: "top",
    disableBeacon: true,
    title: "Registros de auditoría",
    content: "Cada fila muestra quién hizo qué y cuándo. Haz clic en 'Ver' para ver los datos antes y después del cambio.",
  },
];

// ── Usuarios ──────────────────────────────────────────────────────────────────
export const STEPS_USUARIOS = [
  centered("Gestión de usuarios", "Administra las cuentas de acceso al sistema para todo el equipo."),
  {
    target: "[data-tour='usuarios-nuevo']",
    placement: "bottom",
    disableBeacon: true,
    title: "Nuevo usuario",
    content: "Crea una cuenta de acceso al sistema asignando rol (ADMIN, RRHH o EMPLEADO) y vinculando al empleado correspondiente.",
  },
  {
    target: "[data-tour='usuarios-filtros']",
    placement: "bottom",
    disableBeacon: true,
    title: "Filtros",
    content: "Busca por nombre o correo, filtra por rol o por estado activo/inactivo.",
  },
  {
    target: "[data-tour='usuarios-tabla']",
    placement: "top",
    disableBeacon: true,
    title: "Lista de usuarios",
    content: "Aquí ves todos los usuarios con su rol, último acceso y estado. Puedes editar o desactivar cualquier cuenta.",
  },
];

// ── Empresas externas ─────────────────────────────────────────────────────────
export const STEPS_EMPRESAS = [
  centered("Empresas externas", "Catálogo de organizaciones externas utilizado para registrar la experiencia laboral previa de los empleados."),
  {
    target: "[data-tour='empresas-form']",
    placement: "bottom",
    disableBeacon: true,
    title: "Registrar empresa",
    content: "Añade una nueva empresa externa con su nombre, NIT, dirección y datos de contacto.",
  },
  {
    target: "[data-tour='empresas-filtros']",
    placement: "bottom",
    disableBeacon: true,
    title: "Filtros",
    content: "Alterna entre empresas activas e inactivas, o busca por nombre, NIT o correo.",
  },
  {
    target: "[data-tour='empresas-tabla']",
    placement: "top",
    disableBeacon: true,
    title: "Lista de empresas",
    content: "Edita o desactiva empresas según sea necesario. Las inactivas no aparecen en los formularios de experiencia laboral.",
  },
];

// ── Cargos ────────────────────────────────────────────────────────────────────
export const STEPS_CARGOS = [
  centered("Gestión de cargos", "Define los cargos disponibles en la empresa. Los cargos activos aparecen al crear o editar empleados."),
  {
    target: "[data-tour='cargos-form']",
    placement: "bottom",
    disableBeacon: true,
    title: "Registrar cargo",
    content: "Añade un nuevo cargo con su nombre y descripción. Haz clic en un cargo de la tabla para editarlo.",
  },
  {
    target: "[data-tour='cargos-filtros']",
    placement: "bottom",
    disableBeacon: true,
    title: "Filtros",
    content: "Filtra entre cargos activos e inactivos, o busca por nombre.",
  },
  {
    target: "[data-tour='cargos-tabla']",
    placement: "top",
    disableBeacon: true,
    title: "Lista de cargos",
    content: "Activa o desactiva cargos según necesites. Los inactivos no están disponibles para nuevos empleados.",
  },
];

// ── Universidades ─────────────────────────────────────────────────────────────
export const STEPS_UNIVERSIDADES = [
  centered("Universidades e instituciones", "Catálogo de centros educativos utilizado al registrar los estudios académicos de los empleados."),
  {
    target: "[data-tour='universidades-form']",
    placement: "bottom",
    disableBeacon: true,
    title: "Registrar institución",
    content: "Añade una nueva universidad o institución educativa al catálogo.",
  },
  {
    target: "[data-tour='universidades-filtros']",
    placement: "bottom",
    disableBeacon: true,
    title: "Filtros",
    content: "Alterna entre activas e inactivas, o busca por nombre.",
  },
  {
    target: "[data-tour='universidades-tabla']",
    placement: "top",
    disableBeacon: true,
    title: "Lista de instituciones",
    content: "Edita o activa/desactiva instituciones. Solo las activas aparecen en los formularios de estudios académicos.",
  },
];

// ── Configuración de empresa ──────────────────────────────────────────────────
export const STEPS_CONFIGURACION = [
  centered("Configuración de la empresa", "Personaliza los datos de tu organización y gestiona las sedes de trabajo."),
  {
    target: "[data-tour='config-empresa']",
    placement: "bottom",
    disableBeacon: true,
    title: "Datos generales",
    content: "Actualiza el nombre y NIT de tu empresa. Esta información aparece en los reportes PDF.",
  },
  {
    target: "[data-tour='config-sedes']",
    placement: "top",
    disableBeacon: true,
    title: "Sedes",
    content: "Gestiona las sedes de trabajo. Puedes crear nuevas sedes, editarlas o desactivarlas. Las sedes activas se asignan a los empleados.",
  },
];
