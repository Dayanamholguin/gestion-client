# Frontend — Sistema de Gestión de RRHH (empresa COL)

Interfaz web construida con **React 19** y **Tailwind CSS** para la gestión de recursos humanos de la empresa COL. Desplegada en producción en **Vercel**.

**URL de producción:** https://gestion-clientes-col.vercel.app

---

## Descripción del proyecto

Aplicación SPA (Single Page Application) que permite a los equipos de RRHH y administración gestionar empleados, vacaciones, configuración de la empresa y más. Incluye modo oscuro, dashboard con métricas en tiempo real, exportación a PDF y Excel, y un selector de fecha con festivos colombianos.

### Funcionalidades principales

- **Dashboard**: métricas en tiempo real (empleados por cargo, contrato, sede, estado), widgets configurables por usuario, filtro por sede, exportación a Excel y PDF, auto-refresh cada 30 segundos
- **Gestión de empleados**: listado con filtros avanzados (texto, cargo, contrato, sede), creación, edición y cambio de estado masivo
- **Importación masiva**: descarga de plantilla Excel con dropdowns reales y carga de hasta 500 empleados con validación todo-o-nada
- **Detalle del empleado**: información personal, historial de cargos (automático), estudios académicos y experiencia laboral
- **Historial de cargos**: solo lectura — gestionado automáticamente por el backend al cambiar el cargo
- **Experiencia laboral**: editor de texto enriquecido (negrita, cursiva, listas con viñetas, listas numeradas)
- **Drag & drop**: reordenamiento de historial, estudios y experiencia con persistencia en base de datos
- **Vacaciones**: solicitud, aprobación, rechazo y cancelación con cálculo de días hábiles y festivos colombianos
- **Calendario con festivos**: selector de fecha personalizado con festivos colombianos en naranja, navegación rápida por mes y año
- **Exportación PDF**: expediente completo del empleado (datos, historial, estudios, experiencia)
- **Configuración de empresa**: nombre, NIT y CRUD de sedes con datos de departamento/ciudad de Colombia
- **Gestión de usuarios**: CRUD de cuentas con roles ADMIN, RRHH, EMPLEADO
- **Catálogos**: cargos, empresas externas y universidades con filtros
- **Auditoría**: log de operaciones con etiquetas en español, filtros por tabla/acción/usuario/fecha
- **Autenticación JWT**: login, rutas protegidas, auto-inyección de token, último acceso con notificación
- **Modo oscuro/claro**: persistido en `localStorage`
- **Diseño responsive**: completamente usable en móvil con sidebar overlay

---

## Tecnologías utilizadas

| Tecnología | Versión | Uso |
|---|---|---|
| React | 19.x | Librería UI principal |
| React Router DOM | 7.x | Enrutamiento SPA |
| Tailwind CSS | 3.x | Estilos utilitarios + dark mode |
| react-select | 5.x | Selects estilizados con soporte dark mode |
| SweetAlert2 | 11.x | Modales de confirmación y alertas |
| jsPDF | 4.x | Generación de PDF en el navegador |
| jsPDF-AutoTable | 5.x | Tablas formateadas en PDF |
| xlsx (SheetJS) | — | Lectura de archivos Excel importados + exportación dashboard |
| Tiptap (`@tiptap/react`, `@tiptap/starter-kit`) | 3.x | Editor de texto enriquecido |
| Create React App | 5.x | Toolchain (webpack, babel, jest) |

---

## Requisitos previos

- Node.js 18 o superior
- El servidor backend corriendo en `http://localhost:3001` (ver `server/README.md`)

---

## Instalación

```bash
cd client
npm install
```

No requiere archivo `.env`. La URL de la API está en:

```
src/config/api.js  →  export default "http://localhost:3001"
```

Si el backend corre en otro puerto o dominio, modificar ese archivo.

---

## Ejecución

```bash
npm start        # Desarrollo — http://localhost:3000
npm run build    # Build de producción (carpeta build/)
npm test         # Tests (modo watch)
```

---

## Arquitectura

```
client/src/
│
├── App.js                       ← ThemeContext, AuthProvider, Router, layout principal
├── config/
│   ├── api.js                   ← URL base de la API (default export, sin llaves)
│   └── selectStyles.js          ← Estilos react-select dark/light
│
├── contexts/
│   └── AuthContext.jsx          ← JWT, interceptor global de fetch, tienePermiso(), ultimoAcceso
│
├── pages/
│   ├── LoginPage.jsx            ← Login + toast de último acceso
│   ├── DashboardPage.jsx        ← Dashboard con widgets, filtro sede, exportación
│   ├── EmpleadosPage.jsx        ← Lista + filtros + importación masiva Excel
│   ├── EmpleadoDetallePage.jsx  ← Detalle + Historial + Estudios + Experiencia
│   ├── VacacionesPage.jsx       ← Vacaciones (solicitar/aprobar/rechazar/cancelar)
│   ├── UsuariosPage.jsx         ← Gestión de usuarios
│   ├── EmpresasPage.jsx         ← Catálogo de empresas externas
│   ├── CargosPage.jsx           ← Catálogo de cargos
│   ├── UniversidadesPage.jsx    ← Catálogo de universidades
│   ├── AuditoriaPage.jsx        ← Log de auditoría con filtros (incluye CalendarioInput)
│   └── ConfigEmpresaPage.jsx    ← Config empresa: nombre/NIT + CRUD sedes
│
├── components/
│   ├── Navbar.jsx               ← Sidebar responsive (overlay en móvil, sticky en desktop)
│   ├── CalendarioInput.jsx      ← Selector de fecha con festivos colombianos (3 modos)
│   ├── RichTextEditor.jsx       ← Editor Tiptap (negrita, cursiva, listas)
│   ├── GestionTable.jsx         ← Tabla de empleados
│   ├── GestionForm.jsx          ← Formulario de empleado (usa CalendarioInput)
│   ├── PrivateRoute.jsx         ← Redirige a /login si no hay sesión
│   ├── SearchInput.jsx          ← Input de búsqueda reutilizable
│   └── themeBotton.jsx          ← Botón toggle dark/light
│
├── Hooks/
│   ├── useTheme.js              ← Toggle dark/light, persiste en localStorage
│   └── useSearch.js             ← Filtra registros por texto + toggle activo/inactivo
│
└── utils/
    ├── festivos.js              ← getFestivos(year) y contarDiasHabiles() — Ley Emiliani + Gauss
    └── colombiaData.js          ← 32 departamentos + Bogotá D.C. con municipios (cascada sedes)
```

---

## Autenticación y roles

JWT almacenado en `localStorage`. El `AuthContext` parchea `window.fetch` para inyectar `Authorization: Bearer <token>` en todas las peticiones a la API. En respuesta 401, logout automático y redirección a `/login`.

| Rol | Acceso |
|---|---|
| **ADMIN** | Acceso total — dashboard, empleados, vacaciones, usuarios, catálogos, auditoría, configuración |
| **RRHH** | Empleados (crear/editar/desactivar), catálogos, auditoría, usuarios (lista), vacaciones (gestionar) |
| **EMPLEADO** | Solo su propio perfil (nombre, apellido, correo, celular) + solicitar vacaciones |

El Navbar muestra links según los permisos del usuario en sesión.

---

## CalendarioInput — selector de fecha con festivos

Reemplaza `<input type="date">` en **todo el sistema**. No existe ningún input de fecha nativo en el cliente.

**Características:**
- Festivos colombianos resaltados en naranja (Ley Emiliani + algoritmo de Gauss para Pascua)
- **Navegación de 3 modos** — clic en el encabezado para cambiar entre:
  1. **Vista de días** — cuadrícula del mes con flechas mes a mes
  2. **Vista de meses** — cuadrícula 3×4, flechas cambian el año, el año es clickeable
  3. **Vista de años** — cuadrícula 3×4 de 12 años, flechas saltan 12 años
- Soporta `min`/`max` para restringir rango de fechas
- `diasNoLaborales` marca días en gris (vacaciones usa config de BD; demás campos usan `[]`)
- Usa `createPortal` para evitar el clipping del contenedor con `overflow-y-auto`
- Se usa en: formulario de empleado, secciones de estudios/experiencia, filtros de auditoría, vacaciones

---

## Importación masiva de empleados (Excel)

Solo visible para ADMIN y RRHH.

1. **Descargar plantilla** (botón verde): archivo Excel generado en el servidor con dropdowns reales para Cargo, Tipo Contrato, Sede y Estado
2. **Llenar** la plantilla respetando los formatos (documentos y teléfonos como texto, fechas YYYY-MM-DD)
3. **Importar** (botón índigo): carga el archivo, valida todas las filas y muestra errores específicos por fila

**Regla todo-o-nada**: si cualquier fila tiene error, no se guarda ningún empleado hasta que el archivo esté completamente correcto.

**Validaciones**: nombre/apellido obligatorios; documento 6–10 dígitos único; correo válido; celular 10 dígitos; salario positivo; cargo/tipo_contrato deben existir en catálogos activos; sede opcional; fechas YYYY-MM-DD válidas con mínimo 5 años de diferencia entre nacimiento e ingreso.

---

## Dashboard

Solo visible para ADMIN y RRHH. Ruta por defecto (`/`).

- **8 widgets** configurables por usuario: resumen general, por cargo, por contrato, por sede, por estado, salarios, incorporaciones recientes, cumpleaños del mes
- **Filtro por sede** en el encabezado — afecta todos los widgets simultáneamente
- **Auto-refresh** cada 30 segundos + al volver a la pestaña
- **Configuración personal** guardada en `localStorage` por usuario (activar/desactivar/reordenar widgets)
- **Exportación**: Excel (hoja por cada métrica) y PDF (gráficas de barras + tablas formateadas)

---

## Vacaciones

- **EMPLEADO**: solicitar con CalendarioInput, ver sus propias solicitudes, cancelar pendientes
- **ADMIN/RRHH**: ver todas, aprobar/rechazar (con motivo opcional), configurar días laborales (checkboxes por día de semana)
- Cálculo en tiempo real de días hábiles excluyendo festivos colombianos y días no laborales configurados

---

## Configuración de empresa

Ruta `/configuracion/empresa` — solo ADMIN.

- Datos generales: nombre y NIT de la empresa
- **CRUD de sedes**: nombre, departamento y ciudad (selects en cascada con datos de Colombia), dirección. Soft-delete (desactivar/reactivar).

---

## Filtros por página

| Página | Filtros disponibles |
|---|---|
| Empleados | Toggle activos/inactivos · texto · cargo · contrato · sede · botón limpiar |
| Vacaciones (gestor) | Texto (empleado) · estado · botón limpiar |
| Vacaciones (empleado) | Estado · botón limpiar |
| Usuarios | Texto · rol · estado activo/inactivo · botón limpiar |
| Empresas/Cargos/Universidades | Toggle activos/inactivos · texto · botón limpiar |
| Auditoría | Tabla · acción · usuario · fecha desde (CalendarioInput) · fecha hasta · botón buscar/limpiar |

---

## Despliegue en producción — Vercel

El frontend se despliega automáticamente en Vercel desde el repositorio `Dayanamholguin/gestion-client` rama `main`.

Para un nuevo despliegue manual:
1. Crear proyecto en [vercel.com](https://vercel.com) → importar repo
2. **Root Directory**: `client` (o raíz si el repo solo tiene client/)
3. **Framework Preset**: Create React App
4. Deploy — Vercel detecta la configuración automáticamente

> Vercel despliega en cada push a `main`. Las rutas del SPA funcionan sin configuración adicional (vercel.json incluido).
