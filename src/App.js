import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { createContext } from "react";
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

export const ThemeContext = createContext(false);

// Layout con Navbar para rutas protegidas
function ProtectedLayout({ darkMode, toggleTheme }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;

  return (
    <>
      <Navbar darkMode={darkMode} toggleTheme={toggleTheme} />
      <main className="p-8">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </>
  );
}

function App() {
  const { darkMode, toggleTheme } = useTheme();

  return (
    <AuthProvider>
      <ThemeContext.Provider value={darkMode}>
        <BrowserRouter>
          <div
            className={`font-poppins ${
              darkMode
                ? "dark min-h-screen bg-gray-900"
                : "min-h-screen bg-gray-100"
            } transition-colors duration-300`}
          >
            <Routes>
              {/* Ruta pública — sin Navbar */}
              <Route path="/login" element={<LoginPage />} />

              {/* Rutas protegidas — con Navbar */}
              <Route
                element={
                  <ProtectedLayout darkMode={darkMode} toggleTheme={toggleTheme} />
                }
              >
                <Route path="/" element={<Navigate to="/empleados" replace />} />
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
              </Route>
            </Routes>
          </div>
        </BrowserRouter>
      </ThemeContext.Provider>
    </AuthProvider>
  );
}

export default App;
