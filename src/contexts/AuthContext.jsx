/**
 * AuthContext.jsx
 *
 * Provee la sesión del usuario a toda la aplicación:
 *   - token JWT almacenado en localStorage
 *   - datos del usuario (id, nombre, rol, permisos, empleado_id)
 *   - funciones login / logout
 *   - helper tienePermiso(permiso)
 *
 * Interceptor global de fetch:
 *   Agrega automáticamente el header "Authorization: Bearer <token>"
 *   a todas las llamadas que vayan a API_BASE, sin tocar ningún componente.
 *   En respuesta 401 (token expirado / inválido) ejecuta logout y redirige.
 */

import { createContext, useContext, useState, useEffect, useRef } from "react";
import API_BASE from "../config/api";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("auth_token"));
  const [usuario, setUsuario] = useState(() => {
    try {
      const saved = localStorage.getItem("auth_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [ultimoAcceso, setUltimoAcceso] = useState(() => localStorage.getItem("ultimo_acceso") || null);

  // Ref para que el interceptor lea siempre el token más reciente
  const tokenRef = useRef(token);
  // Ref estable para logout, evita dependencias circulares en el interceptor
  const logoutRef = useRef(null);

  useEffect(() => { tokenRef.current = token; }, [token]);

  const login = (nuevoToken, nuevoUsuario, prevUltimoAcceso = null) => {
    setToken(nuevoToken);
    setUsuario(nuevoUsuario);
    setUltimoAcceso(prevUltimoAcceso);
    localStorage.setItem("auth_token", nuevoToken);
    localStorage.setItem("auth_user", JSON.stringify(nuevoUsuario));
    if (prevUltimoAcceso) {
      localStorage.setItem("ultimo_acceso", prevUltimoAcceso);
    } else {
      localStorage.removeItem("ultimo_acceso");
    }
  };

  const logout = () => {
    setToken(null);
    setUsuario(null);
    setUltimoAcceso(null);
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    localStorage.removeItem("ultimo_acceso");
  };

  logoutRef.current = logout;

  // ── Interceptor global de fetch ───────────────────────────────────────────
  // Se instala una sola vez al montar el Provider.
  // No requiere cambios en ningún componente existente.
  useEffect(() => {
    const originalFetch = window.fetch.bind(window);

    window.fetch = async (input, init = {}) => {
      const url = typeof input === "string" ? input
                : input instanceof Request  ? input.url
                : "";

      if (url.startsWith(API_BASE)) {
        const currentToken = tokenRef.current;
        if (currentToken) {
          init = {
            ...init,
            headers: {
              ...init.headers,
              Authorization: `Bearer ${currentToken}`,
            },
          };
        }

        const res = await originalFetch(input, init);

        // Token expirado o inválido → cerrar sesión y redirigir
        if (res.status === 401 && !url.includes("/auth/login")) {
          logoutRef.current?.();
          window.location.replace("/login");
        }

        return res;
      }

      return originalFetch(input, init);
    };

    return () => { window.fetch = originalFetch; };
  }, []);

  // ── Helper de permisos ────────────────────────────────────────────────────
  const tienePermiso = (permiso) => {
    if (!usuario) return false;
    const permisos = usuario.permisos || [];
    return permisos.includes("*") || permisos.includes(permiso);
  };

  return (
    <AuthContext.Provider value={{ token, usuario, ultimoAcceso, login, logout, tienePermiso }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
