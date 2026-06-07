/**
 * PrivateRoute.jsx
 *
 * Guard de rutas:
 *   - Sin sesión      → redirige a /login
 *   - Con permiso     → renderiza children
 *   - Sin permiso     → redirige a /empleados (acceso denegado silencioso)
 *
 * Uso:
 *   <Route path="/cargos" element={
 *     <PrivateRoute permiso="catalogos:cargos"><CargosPage /></PrivateRoute>
 *   } />
 *
 *   Sin `permiso`, solo verifica que exista sesión activa.
 */

import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function PrivateRoute({ children, permiso }) {
  const { token, tienePermiso } = useAuth();

  if (!token) return <Navigate to="/login" replace />;

  if (permiso && !tienePermiso(permiso)) {
    return <Navigate to="/empleados" replace />;
  }

  return children;
}

export default PrivateRoute;
