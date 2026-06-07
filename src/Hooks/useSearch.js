import { useMemo, useState } from "react";

export const useSearch = (registros) => {
  const [busqueda, setBusqueda] = useState("");
  const [mostrarInactivos, setMostrarInactivos] = useState(false);

  const registrosFiltrados = useMemo(() => {
    if (!Array.isArray(registros)) return [];
    return registros.filter((emp) => {
      const texto = `
        ${emp.nombre}
        ${emp.apellido}
        ${emp.documento}
        ${emp.correo}
      `.toLowerCase();

      const coincideBusqueda = texto.includes(busqueda.toLowerCase());

      const coincideEstado = mostrarInactivos
        ? Number(emp.estado) === 0
        : Number(emp.estado) === 1;

      return coincideBusqueda && coincideEstado;
    });
  }, [busqueda, registros, mostrarInactivos]);

  return {
    busqueda,
    setBusqueda,
    registrosFiltrados,
    mostrarInactivos,
    setMostrarInactivos,
  };
};
