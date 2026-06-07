import { NavLink, useNavigate } from "react-router-dom";
import ThemeButton from "./themeBotton";
import { useAuth } from "../contexts/AuthContext";

function Navbar({ darkMode, toggleTheme }) {
  const { usuario, logout, tienePermiso } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const linkClass = ({ isActive }) =>
    `px-4 py-2 rounded-md font-medium transition-colors text-sm ${
      isActive
        ? "bg-indigo-600 text-white"
        : "text-gray-600 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
    }`;

  const initiales = usuario
    ? `${usuario.nombre?.[0] ?? ""}${usuario.apellido?.[0] ?? ""}`.toUpperCase()
    : "?";

  const rolLabel = { ADMIN: "Administrador", RRHH: "RRHH", EMPLEADO: "Empleado" };

  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-gray-800 shadow-md px-8 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Marca */}
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-indigo-600 dark:text-white">RRHH</span>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <span className="text-sm text-gray-500 dark:text-gray-400">Sistema de Gestión</span>
        </div>

        {/* Links según permisos */}
        <div className="flex items-center gap-2">
          {tienePermiso("auditoria:ver") && (
            <NavLink to="/auditoria" className={linkClass}>Auditoría</NavLink>
          )}
          {tienePermiso("usuarios:listar") && (
            <NavLink to="/usuarios" className={linkClass}>Usuarios</NavLink>
          )}
          {tienePermiso("empleados:listar") && usuario?.rol !== "EMPLEADO" && (
            <NavLink to="/empleados" className={linkClass}>Empleados</NavLink>
          )}
          {usuario?.rol === "EMPLEADO" && usuario.empleado_id && (
            <NavLink to={`/empleados/${usuario.empleado_id}`} className={linkClass}>Mi Perfil</NavLink>
          )}
          {tienePermiso("catalogos:empresas") && (
            <NavLink to="/empresas" className={linkClass}>Empresas</NavLink>
          )}
          {tienePermiso("catalogos:cargos") && (
            <NavLink to="/cargos" className={linkClass}>Cargos</NavLink>
          )}
          {tienePermiso("catalogos:universidades") && (
            <NavLink to="/universidades" className={linkClass}>Universidades</NavLink>
          )}

          {/* Separador */}
          <span className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

          <ThemeButton darkMode={darkMode} toggleTheme={toggleTheme} />

          {/* Avatar + info + logout */}
          {usuario && (
            <div className="flex items-center gap-2 ml-1">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700">
                {/* Avatar con iniciales */}
                <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {initiales}
                </div>
                <div className="leading-tight text-left">
                  <p className="text-xs font-semibold text-gray-800 dark:text-white truncate max-w-[120px]">
                    {usuario.nombre} {usuario.apellido}
                  </p>
                  <p className="text-[10px] text-indigo-500 dark:text-indigo-400 font-medium">
                    {rolLabel[usuario.rol] ?? usuario.rol}
                  </p>
                </div>
              </div>

              {/* Botón de cerrar sesión */}
              <button
                onClick={handleLogout}
                title="Cerrar sesión"
                className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
