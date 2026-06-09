import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { getFestivos } from "../utils/festivos";

const MESES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];
const MESES_CORTO = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const DIAS = ["Do","Lu","Ma","Mi","Ju","Vi","Sá"];

function ymd(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function parseYMD(s) {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatDisplay(s) {
  const d = parseYMD(s);
  if (!d) return "";
  return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
}

/**
 * CalendarioInput — selector de fecha con festivos colombianos resaltados.
 *
 * Props:
 *   value          string "YYYY-MM-DD" | ""
 *   onChange       (string) => void
 *   label          string (opcional)
 *   required       bool
 *   min / max      string "YYYY-MM-DD" (opcional)
 *   diasNoLaborales  number[]  días de semana NO laborales [0=Dom..6=Sáb] (por defecto [0,6])
 *   placeholder    string
 */
export default function CalendarioInput({
  value = "",
  onChange,
  label,
  required,
  min,
  max,
  diasNoLaborales = [0, 6],
  placeholder = "Seleccionar fecha",
}) {
  const today = new Date();
  const todayStr = ymd(today.getFullYear(), today.getMonth(), today.getDate());

  const initYear  = value ? Number(value.split("-")[0]) : today.getFullYear();
  const initMonth = value ? Number(value.split("-")[1]) - 1 : today.getMonth();

  const [open, setOpen]           = useState(false);
  const [mode, setMode]           = useState("days"); // "days" | "months"
  const [viewYear, setViewYear]   = useState(initYear);
  const [viewMonth, setViewMonth] = useState(initMonth);
  const [popupPos, setPopupPos]   = useState({ top: 0, left: 0, width: 0 });

  const btnRef   = useRef(null);
  const popupRef = useRef(null);

  // Actualizar vista cuando el valor cambia externamente
  useEffect(() => {
    if (value) {
      setViewYear(Number(value.split("-")[0]));
      setViewMonth(Number(value.split("-")[1]) - 1);
    }
  }, [value]);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (
        popupRef.current && !popupRef.current.contains(e.target) &&
        btnRef.current  && !btnRef.current.contains(e.target)
      ) {
        setOpen(false);
        setMode("days");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleOpen = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const popupHeight = 340;
      const top = spaceBelow >= popupHeight
        ? rect.bottom + window.scrollY + 4
        : rect.top + window.scrollY - popupHeight - 4;
      setPopupPos({ top, left: rect.left + window.scrollX, width: Math.max(rect.width, 288) });
    }
    if (open) setMode("days");
    setOpen((o) => !o);
  };

  // Festivos del mes actual y siguiente (para cubrir cambios de mes)
  const festivosActual    = getFestivos(viewYear);
  const festivosSiguiente = viewMonth === 11 ? getFestivos(viewYear + 1) : getFestivos(viewYear);
  const festivos = new Map([...festivosActual, ...festivosSiguiente]);

  // Construir grid del mes
  const firstDow    = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const navPrev = (e) => {
    e.stopPropagation();
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const navNext = (e) => {
    e.stopPropagation();
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  const handleSelect = (day) => {
    if (!day) return;
    const dateStr = ymd(viewYear, viewMonth, day);
    if (min && dateStr < min) return;
    if (max && dateStr > max) return;
    onChange(dateStr);
    setOpen(false);
    setMode("days");
  };

  const handleSelectMonth = (monthIdx) => {
    setViewMonth(monthIdx);
    setMode("days");
  };

  // Estilos de celda de días
  const cellClass = (day) => {
    if (!day) return "";
    const dateStr = ymd(viewYear, viewMonth, day);
    const dow = new Date(viewYear, viewMonth, day).getDay();
    const disabled  = (min && dateStr < min) || (max && dateStr > max);
    const selected  = dateStr === value;
    const esHoy     = dateStr === todayStr;
    const esFest    = festivos.has(dateStr);
    const noLaboral = diasNoLaborales.includes(dow);

    let base = "flex items-center justify-center text-xs h-8 w-8 rounded-full mx-auto transition-colors ";

    if (disabled) return base + "text-gray-300 dark:text-gray-600 cursor-not-allowed";
    if (selected) return base + "bg-indigo-600 text-white font-bold cursor-pointer";
    if (esFest)   return base + "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 font-semibold cursor-pointer hover:bg-orange-200 dark:hover:bg-orange-900/60" + (esHoy ? " ring-2 ring-orange-400" : "");
    if (noLaboral) return base + "text-gray-400 dark:text-gray-500 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" + (esHoy ? " ring-2 ring-indigo-300" : "");
    return base + "text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/30" + (esHoy ? " ring-2 ring-indigo-400" : "");
  };

  // Mes resaltado en el selector de mes (si coincide con el valor seleccionado)
  const selectedYear  = value ? Number(value.split("-")[0]) : null;
  const selectedMonth = value ? Number(value.split("-")[1]) - 1 : null;

  const monthCellClass = (idx) => {
    const isSelected = selectedMonth === idx && selectedYear === viewYear;
    const isCurrent  = today.getMonth() === idx && today.getFullYear() === viewYear;
    let base = "py-2 text-sm rounded-lg text-center transition-colors cursor-pointer ";
    if (isSelected) return base + "bg-indigo-600 text-white font-bold";
    if (isCurrent)  return base + "ring-2 ring-indigo-400 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30";
    return base + "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700";
  };

  // Vista: selector de mes/año
  const monthPickerView = (
    <>
      {/* Navegación de año */}
      <div className="flex items-center justify-between mb-4">
        <button type="button" onClick={(e) => { e.stopPropagation(); setViewYear((y) => y - 1); }}
          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <button type="button" onClick={(e) => { e.stopPropagation(); setMode("years"); }}
          className="text-sm font-bold text-gray-800 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
          {viewYear}
        </button>
        <button type="button" onClick={(e) => { e.stopPropagation(); setViewYear((y) => y + 1); }}
          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>
      {/* Cuadrícula de meses */}
      <div className="grid grid-cols-3 gap-2">
        {MESES_CORTO.map((mes, idx) => (
          <div key={idx} className={monthCellClass(idx)}
            onClick={(e) => { e.stopPropagation(); handleSelectMonth(idx); }}>
            {mes}
          </div>
        ))}
      </div>
    </>
  );

  // Vista: selector de año (cuadrícula de 12 años)
  const yearRangeStart = Math.floor(viewYear / 12) * 12;
  const yearPickerView = (
    <>
      <div className="flex items-center justify-between mb-4">
        <button type="button" onClick={(e) => { e.stopPropagation(); setViewYear((y) => y - 12); }}
          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <span className="text-sm font-bold text-gray-800 dark:text-white">
          {yearRangeStart} – {yearRangeStart + 11}
        </span>
        <button type="button" onClick={(e) => { e.stopPropagation(); setViewYear((y) => y + 12); }}
          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 12 }, (_, i) => yearRangeStart + i).map((yr) => {
          const isSelected = selectedYear === yr;
          const isCurrent  = today.getFullYear() === yr;
          let cls = "py-2 text-sm rounded-lg text-center transition-colors cursor-pointer ";
          if (isSelected) cls += "bg-indigo-600 text-white font-bold";
          else if (isCurrent) cls += "ring-2 ring-indigo-400 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30";
          else cls += "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700";
          return (
            <div key={yr} className={cls}
              onClick={(e) => { e.stopPropagation(); setViewYear(yr); setMode("months"); }}>
              {yr}
            </div>
          );
        })}
      </div>
    </>
  );

  // Vista: grid de días
  const daysView = (
    <>
      {/* Cabeceras días de semana */}
      <div className="grid grid-cols-7 mb-1">
        {DIAS.map((d) => (
          <div key={d} className="text-center text-[10px] font-semibold text-gray-400 dark:text-gray-500 py-1">{d}</div>
        ))}
      </div>
      {/* Grid de días */}
      <div className="grid grid-cols-7">
        {cells.map((day, i) => (
          <div key={i} className="py-0.5">
            {day ? (
              <div className={cellClass(day)} onClick={() => handleSelect(day)}
                title={festivos.get(ymd(viewYear, viewMonth, day)) ?? ""}>
                {day}
              </div>
            ) : null}
          </div>
        ))}
      </div>
      {/* Leyenda */}
      <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-gray-700 flex flex-wrap gap-3 text-[10px] text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-orange-100 dark:bg-orange-900/40 border border-orange-300" />
          Festivo
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-indigo-600" />
          Seleccionado
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full ring-2 ring-indigo-400" />
          Hoy
        </span>
      </div>
    </>
  );

  const calendar = (
    <div
      ref={popupRef}
      style={{ position: "fixed", top: popupPos.top, left: popupPos.left, minWidth: 288, zIndex: 9999 }}
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-4"
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Encabezado de navegación */}
      <div className="flex items-center justify-between mb-3">
        {mode === "days" && (
          <button type="button" onClick={navPrev}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
        )}
        {mode !== "days" && <div className="w-7" />}

        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setMode((m) => m === "days" ? "months" : "days"); }}
          className="flex items-center gap-1 text-sm font-semibold text-gray-800 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          {mode === "days" ? `${MESES[viewMonth]} ${viewYear}` : mode === "months" ? "Selecciona mes" : "Selecciona año"}
          <svg className={`w-3.5 h-3.5 transition-transform ${mode !== "days" ? "rotate-180" : ""}`}
            fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>

        {mode === "days" && (
          <button type="button" onClick={navNext}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        )}
        {mode !== "days" && <div className="w-7" />}
      </div>

      {mode === "days"   && daysView}
      {mode === "months" && monthPickerView}
      {mode === "years"  && yearPickerView}
    </div>
  );

  return (
    <div className="relative">
      {label && (
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <button
        ref={btnRef}
        type="button"
        onClick={handleOpen}
        className={`w-full px-3 py-2 text-sm text-left border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500
          ${value
            ? "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-400"
          }`}
      >
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
          {value ? formatDisplay(value) : placeholder}
        </span>
      </button>

      {open && createPortal(calendar, document.body)}
    </div>
  );
}
