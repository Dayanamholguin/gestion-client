import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import ThemeButton from "./themeBotton";
import { useAuth } from "../contexts/AuthContext";

// ── Iconos ────────────────────────────────────────────────────────────────────
const IcoUsers = () => (
  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
  </svg>
);

const IcoUser = () => (
  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const IcoCalendar = () => (
  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
  </svg>
);

const IcoDocument = () => (
  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

const IcoUserGroup = () => (
  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
  </svg>
);

const IcoBuilding = () => (
  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
  </svg>
);

const IcoBriefcase = () => (
  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
  </svg>
);

const IcoAcademic = () => (
  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
  </svg>
);

const IcoDashboard = () => (
  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
  </svg>
);

const IcoLogout = () => (
  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
  </svg>
);

const IcoGear = () => (
  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const IcoX = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// ── Ítem de navegación ────────────────────────────────────────────────────────
function NavItem({ to, icon, label, collapsed, onNavigate }) {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
        ${collapsed ? "md:justify-center" : ""}
        ${isActive
          ? "bg-indigo-600 text-white"
          : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
        }`
      }
    >
      {icon}
      {/* En móvil siempre mostrar label; en desktop respetar collapsed */}
      <span className={`truncate ${collapsed ? "md:hidden" : ""}`}>{label}</span>
    </NavLink>
  );
}

// ── Sidebar principal ─────────────────────────────────────────────────────────
function Navbar({ darkMode, toggleTheme, mobileOpen, setMobileOpen }) {
  const [collapsed, setCollapsed] = useState(false);
  const { usuario, logout, tienePermiso, ultimoAcceso } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate("/login", { replace: true }); };
  const closeMobile = () => setMobileOpen(false);

  const initiales = usuario
    ? `${usuario.nombre?.[0] ?? ""}${usuario.apellido?.[0] ?? ""}`.toUpperCase()
    : "?";

  const rolLabel = { ADMIN: "Administrador", RRHH: "RRHH", EMPLEADO: "Empleado" };

  const formatUltimoAcceso = (iso) => {
    if (!iso) return null;
    return new Date(iso).toLocaleString("es-CO", {
      day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
    });
  };

  // En desktop collapsed, el sidebar tiene w-16; en móvil siempre w-64 cuando abre
  const sidebarW = collapsed ? "md:w-16" : "md:w-60";

  return (
    <>
      {/* Backdrop oscuro al abrir en móvil */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          flex flex-col h-screen flex-shrink-0 z-40
          fixed md:sticky top-0 left-0
          bg-white dark:bg-gray-800
          border-r border-gray-200 dark:border-gray-700
          shadow-sm transition-all duration-300
          w-72 sm:w-64 ${sidebarW}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* Cabecera */}
        <div className={`
          flex items-center p-4 border-b border-gray-200 dark:border-gray-700
          ${collapsed ? "md:justify-center" : "justify-between"}
        `}>
          <div className={`leading-tight ${collapsed ? "md:hidden" : ""}`}>
            <span className="text-base font-bold text-indigo-600 dark:text-white">RRHH</span>
            <span className="block text-[10px] text-gray-400 dark:text-gray-500">Sistema de Gestión</span>
          </div>

          {/* Botón colapsar — solo visible en desktop */}
          <button
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? "Expandir menú" : "Comprimir menú"}
            className="hidden md:block p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>

          {/* Botón cerrar — solo visible en móvil */}
          <button
            onClick={closeMobile}
            className="md:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Cerrar menú"
          >
            <IcoX />
          </button>
        </div>

        {/* Navegación */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {(tienePermiso("*") || usuario?.rol === "ADMIN" || usuario?.rol === "RRHH") && (
            <NavItem to="/dashboard" icon={<IcoDashboard />} label="Dashboard" collapsed={collapsed} onNavigate={closeMobile} />
          )}
          {tienePermiso("empleados:listar") && usuario?.rol !== "EMPLEADO" && (
            <NavItem to="/empleados" icon={<IcoUsers />} label="Empleados" collapsed={collapsed} onNavigate={closeMobile} />
          )}
          {usuario?.rol === "EMPLEADO" && usuario.empleado_id && (
            <NavItem to={`/empleados/${usuario.empleado_id}`} icon={<IcoUser />} label="Mi Perfil" collapsed={collapsed} onNavigate={closeMobile} />
          )}
          {usuario && (
            <NavItem to="/vacaciones" icon={<IcoCalendar />} label="Vacaciones" collapsed={collapsed} onNavigate={closeMobile} />
          )}
          {tienePermiso("auditoria:ver") && (
            <NavItem to="/auditoria" icon={<IcoDocument />} label="Auditoría" collapsed={collapsed} onNavigate={closeMobile} />
          )}
          {tienePermiso("usuarios:listar") && (
            <NavItem to="/usuarios" icon={<IcoUserGroup />} label="Usuarios" collapsed={collapsed} onNavigate={closeMobile} />
          )}
          {tienePermiso("catalogos:empresas") && (
            <NavItem to="/empresas" icon={<IcoBuilding />} label="Empresas" collapsed={collapsed} onNavigate={closeMobile} />
          )}
          {tienePermiso("catalogos:cargos") && (
            <NavItem to="/cargos" icon={<IcoBriefcase />} label="Cargos" collapsed={collapsed} onNavigate={closeMobile} />
          )}
          {tienePermiso("catalogos:universidades") && (
            <NavItem to="/universidades" icon={<IcoAcademic />} label="Universidades" collapsed={collapsed} onNavigate={closeMobile} />
          )}
          {(tienePermiso("*") || usuario?.rol === "ADMIN") && (
            <NavItem to="/configuracion/empresa" icon={<IcoGear />} label="Configuración" collapsed={collapsed} onNavigate={closeMobile} />
          )}
        </nav>

        {/* Pie: usuario + tema + cerrar sesión */}
        <div className={`border-t border-gray-200 dark:border-gray-700 p-3 ${collapsed ? "md:flex md:flex-col md:items-center md:gap-2" : ""}`}>
          {/* En desktop collapsed: modo icono. En cualquier otro caso: modo expandido */}
          <div className={collapsed ? "md:hidden" : ""}>
            {/* Info del usuario */}
            <div className="flex items-center gap-2 mb-2.5">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {initiales}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-800 dark:text-white truncate">
                  {usuario?.nombre} {usuario?.apellido}
                </p>
                <p className="text-[10px] text-indigo-500 dark:text-indigo-400 font-medium">
                  {rolLabel[usuario?.rol] ?? usuario?.rol}
                </p>
                {formatUltimoAcceso(ultimoAcceso) && (
                  <p
                    className="text-[9px] text-gray-400 dark:text-gray-500 truncate"
                    title={`Última conexión: ${formatUltimoAcceso(ultimoAcceso)}`}
                  >
                    Últ: {formatUltimoAcceso(ultimoAcceso)}
                  </p>
                )}
              </div>
            </div>
            {/* Acciones */}
            <div className="flex items-center gap-1">
              <ThemeButton darkMode={darkMode} toggleTheme={toggleTheme} />
              <button
                onClick={handleLogout}
                title="Cerrar sesión"
                className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <IcoLogout />
                <span>Cerrar sesión</span>
              </button>
            </div>
          </div>

          {/* Solo en desktop collapsed */}
          <div className={`hidden ${collapsed ? "md:flex md:flex-col md:items-center md:gap-2" : ""}`}>
            <div
              className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold cursor-default"
              title={`${usuario?.nombre} ${usuario?.apellido} — ${rolLabel[usuario?.rol] ?? usuario?.rol}`}
            >
              {initiales}
            </div>
            <ThemeButton darkMode={darkMode} toggleTheme={toggleTheme} />
            <button
              onClick={handleLogout}
              title="Cerrar sesión"
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <IcoLogout />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Navbar;
