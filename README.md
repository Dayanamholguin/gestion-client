# 🗂️ Frontend — Sistema de Gestión de RRHH (empresa COL)

Interfaz web construida con **React 19** y **Tailwind CSS** para la gestión de recursos humanos de la empresa COL.

---

## Descripción del proyecto

Aplicación SPA (Single Page Application) que permite a los equipos de RRHH y administración gestionar empleados, sus datos, historial de cargos, estudios, experiencia laboral y usuarios del sistema. Incluye modo oscuro, exportación a PDF y un sistema de auditoría visual.

### Funcionalidades principales

- **Gestión de empleados**: listado con filtros avanzados, creación, edición y cambio de estado masivo
- **Detalle del empleado**: información personal, historial de cargos (automático), estudios académicos y experiencia laboral
- **Historial de cargos**: solo lectura — gestionado automáticamente por el backend al cambiar el cargo del empleado
- **Experiencia laboral**: editor de texto enriquecido (negrita, cursiva, listas con viñetas, listas numeradas)
- **Drag & drop**: reordenamiento de historial, estudios y experiencia con persistencia en base de datos
- **Exportación PDF**: genera un PDF completo del expediente del empleado
- **Gestión de usuarios**: CRUD de cuentas de acceso al sistema
- **Catálogos**: cargos, empresas y universidades con filtros y toggle activo/inactivo
- **Auditoría**: log de operaciones con etiquetas en español y formato legible
- **Autenticación JWT**: login, rutas protegidas, auto-inyección de token en todas las llamadas a la API
- **Modo oscuro/claro**: persistido en `localStorage`

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
| Tiptap (`@tiptap/react`, `@tiptap/starter-kit`) | 3.x | Editor de texto enriquecido (experiencia laboral) |
| Create React App | 5.x | Toolchain (webpack, babel, jest) |

---

## Requisitos previos

- Node.js 18 o superior
- El servidor backend corriendo en `http://localhost:3001` (ver `server/README.md`)

---

## Instalación

```bash
# 1. Entrar a la carpeta del cliente
cd client

# 2. Instalar dependencias
npm install
```

No requiere archivo `.env`. La URL de la API está definida en:

```
src/config/api.js  →  export default "http://localhost:3001"
```

Si el backend corre en otro puerto o dominio, modificar ese archivo.

---

## Ejecución

```bash
# Modo desarrollo — http://localhost:3000
npm start

# Build de producción (carpeta build/)
npm run build

# Tests (modo watch)
npm test
```

---

## Arquitectura general

```
client/src/
│
├── App.jsx                     ← Raíz: ThemeContext, AuthProvider, Router, Navbar
├── config/
│   ├── api.js                  ← URL base de la API (http://localhost:3001)
│   └── selectStyles.js         ← Estilos react-select adaptados a dark/light mode
│
├── contexts/
│   └── AuthContext.jsx         ← JWT en localStorage, interceptor global de fetch,
│                                  login/logout, tienePermiso()
│
├── pages/
│   ├── LoginPage.jsx           ← Formulario de autenticación
│   ├── EmpleadosPage.jsx       ← Lista de empleados + barra de filtros unificada
│   ├── EmpleadoDetallePage.jsx ← Detalle + tabs: Historial, Estudios, Experiencia
│   ├── UsuariosPage.jsx        ← Gestión de usuarios del sistema
│   ├── EmpresasPage.jsx        ← Catálogo de empresas
│   ├── CargosPage.jsx          ← Catálogo de cargos
│   ├── UniversidadesPage.jsx   ← Catálogo de universidades
│   └── AuditoriaPage.jsx       ← Log de auditoría con filtros
│
├── components/
│   ├── Navbar.jsx              ← Navegación sticky, links según rol/permisos
│   ├── themeBotton.jsx         ← Botón ícono sol/luna (dark mode)
│   ├── RichTextEditor.jsx      ← Editor Tiptap (negrita, cursiva, listas)
│   ├── PrivateRoute.jsx        ← Redirige a /login si no hay sesión activa
│   ├── GestionTable.jsx        ← Tabla de empleados
│   ├── GestionForm.jsx         ← Formulario de empleado
│   └── SearchInput.jsx         ← Input de búsqueda reutilizable
│
└── Hooks/
    ├── useTheme.js             ← Toggle dark/light mode, persiste en localStorage
    ├── useSearch.js            ← Filtra registros por texto + toggle activo/inactivo
    └── useCrud.js              ← (reservado, sin implementar)
```

---

## Autenticación y rutas protegidas

El sistema usa **JWT almacenado en `localStorage`**. El `AuthContext` parchea `window.fetch` para inyectar automáticamente el header `Authorization: Bearer <token>` en todas las peticiones que van a la API, sin necesidad de modificar ningún componente individual.

En respuesta **401**, el contexto ejecuta logout automático y redirige a `/login`.

Las rutas de la app están protegidas con `<PrivateRoute>`. Si no hay sesión, cualquier ruta redirige a `/login`.

### Roles del sistema

| Rol | Acceso |
|---|---|
| **ADMIN** | Acceso total a todas las secciones |
| **RRHH** | Empleados, catálogos, auditoría, usuarios (sin gestión de roles ADMIN) |
| **EMPLEADO** | Solo su propio perfil (nombre, apellido, correo, celular) |

El Navbar muestra los links según los permisos del usuario en sesión.

---

## Módulo de detalle del empleado

`EmpleadoDetallePage` está organizado en tabs, cada uno con su propio componente interno:

### Historial de Cargos
- **Solo lectura** — el historial es gestionado 100% por el backend
- Muestra badge `● Actual` (verde) para el cargo vigente (`fecha_fin = null`)
- Drag & drop para reordenar (disponible para ADMIN/RRHH)
- El orden se persiste automáticamente en la base de datos

### Estudios Académicos
- CRUD completo con validaciones
- Drag & drop con persistencia

### Experiencia Laboral
- CRUD con editor de texto enriquecido en el campo Descripción
- **Toolbar del editor**: Negrita · Cursiva · Lista con viñetas · Lista numerada · Quitar formato
- El contenido se guarda como **HTML** en la base de datos
- En la tabla se muestra renderizado (con formato)
- En la exportación PDF se convierte a texto plano con viñetas y numeración preservadas

---

## Filtros en las páginas de lista

### Empleados (barra unificada en una línea)
Toggle **Activos / Inactivos** → búsqueda por texto → select cargo → select contrato → botón Limpiar → botón Cambiar estado masivo

### Usuarios
Búsqueda texto (nombre/correo) → select rol → select estado → Limpiar

### Empresas / Cargos / Universidades
Toggle Activos/Inactivos (click sobre el activo lo deselecciona → muestra todos) → búsqueda texto → Limpiar

### Auditoría
Filtros por tabla, acción, usuario, fecha desde/hasta

---

## Exportación a PDF

Desde el detalle del empleado, el botón **Exportar PDF** genera un documento con:

- Encabezado con datos personales del empleado
- Historial de cargos (tabla)
- Estudios académicos (tabla)
- Experiencia laboral (tabla — descripción convertida de HTML a texto legible)

La generación ocurre completamente en el navegador (jsPDF + jsPDF-AutoTable).

---

## Editor de texto enriquecido

Implementado con **Tiptap** (`@tiptap/react` + `@tiptap/starter-kit`).

- Guarda contenido como **HTML** en la columna `descripcion` de `tb_experiencia_laboral`
- Compatible con dark mode (sin CSS externo — estilos en `App.css` bajo `.ProseMirror`)
- Cuando el editor está vacío, envía `null` al backend
- Al cargar un registro existente, sincroniza el HTML al editor vía `useEffect`

---

## Despliegue en producción — Vercel

1. Asegurarse de tener el backend ya desplegado en Railway y su URL pública disponible
2. Crear cuenta en [vercel.com](https://vercel.com) → **Add New Project**
3. Importar el repositorio de GitHub
4. Configurar el proyecto:
   - **Framework Preset**: Create React App (Vercel lo detecta automáticamente)
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
5. En **Environment Variables** agregar:

   | Variable | Valor |
   |---|---|
   | `REACT_APP_API_URL` | URL del servidor Railway (ej: `https://gestion-rrhh.up.railway.app`) |

6. Clic en **Deploy**
7. Copiar la URL de Vercel generada (ej: `https://gestion-rrhh.vercel.app`) y agregarla como `CLIENT_URL` en las variables de Railway para el CORS

> Vercel despliega automáticamente en cada push a la rama principal. Las rutas del SPA (React Router) funcionan sin configuración adicional.

---

## Variables de entorno

| Variable | Descripción | Requerida en producción |
|---|---|---|
| `REACT_APP_API_URL` | URL completa del backend (Railway) | ✅ Sí |

En desarrollo local **no es necesario** ningún `.env` — la app usa `http://localhost:3001` por defecto.

---

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm start` | Inicia el servidor de desarrollo en `http://localhost:3000` |
| `npm run build` | Genera el build de producción en `build/` |
| `npm test` | Ejecuta los tests con Jest en modo watch |
