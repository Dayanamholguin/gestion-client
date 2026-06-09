import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { createContext, useState } from "react";
import "./App.css";
import { useTheme } from "./Hooks/useTheme";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import PrivateRoute from "./components/PrivateRoute";
import Navbar from "./components/Navbar";
import LoginPage from "./pages/LoginPage";
import EmpleadosPage from "./pages/EmpleadosPage";
import EmpresasPage from "./pages/EmpresasPage";
import CargosPage from "./pages/CargosPage";
import UniversidadesPage from "./pages/UniversidadesPage";
import EmpleadoDetallePage from "./pages/EmpleadoDetallePage";
import UsuariosPage from "./pages/UsuariosPage";
import AuditoriaPage from "./pages/AuditoriaPage";
import VacacionesPage from "./pages/VacacionesPage";
import DashboardPage from "./pages/DashboardPage";
import ConfigEmpresaPage from "./pages/ConfigEmpresaPage";

export const ThemeContext = createContext(false);

// Layout con sidebar lateral para rutas protegidas
function ProtectedLayout({ darkMode, toggleTheme }) {
  const { token } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!token) return <Navigate to="/login" replace />;

  return (
    <div className="flex h-screen overflow-hidden">
      <Navbar
        darkMode={darkMode}
        toggleTheme={toggleTheme}
        mobileOpen={mobileMenuOpen}
        setMobileOpen={setMobileMenuOpen}
      />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top bar visible solo en móvil */}
        <header className="md:hidden flex-shrink-0 flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-20">
          <button
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Abrir menú"
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
          <span className="text-base font-bold text-indigo-600 dark:text-white">RRHH</span>
          <span className="text-xs text-gray-400 dark:text-gray-500">Sistema de Gestión</span>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 bg-gray-100 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

function App() {
  const { darkMode, toggleTheme } = useTheme();

  return (
    <AuthProvider>
      <ThemeContext.Provider value={darkMode}>
        <BrowserRouter>
          <div className={`font-poppins ${darkMode ? "dark" : ""} transition-colors duration-300`}>
            <Routes>
              {/* Ruta pública — sin Navbar */}
              <Route path="/login" element={<LoginPage />} />

              {/* Rutas protegidas — con Navbar */}
              <Route
                element={
                  <ProtectedLayout darkMode={darkMode} toggleTheme={toggleTheme} />
                }
              >
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/empleados" element={<EmpleadosPage />} />
                <Route path="/empleados/:id" element={<EmpleadoDetallePage />} />
                <Route
                  path="/auditoria"
                  element={
                    <PrivateRoute permiso="auditoria:ver">
                      <AuditoriaPage />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/usuarios"
                  element={
                    <PrivateRoute permiso="usuarios:listar">
                      <UsuariosPage />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/empresas"
                  element={
                    <PrivateRoute permiso="catalogos:empresas">
                      <EmpresasPage />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/cargos"
                  element={
                    <PrivateRoute permiso="catalogos:cargos">
                      <CargosPage />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/universidades"
                  element={
                    <PrivateRoute permiso="catalogos:universidades">
                      <UniversidadesPage />
                    </PrivateRoute>
                  }
                />
                <Route path="/vacaciones" element={<VacacionesPage />} />
                <Route path="/configuracion/empresa" element={<ConfigEmpresaPage />} />
              </Route>
            </Routes>
          </div>
        </BrowserRouter>
      </ThemeContext.Provider>
    </AuthProvider>
  );
}

export default App;
