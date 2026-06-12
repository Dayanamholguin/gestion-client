import { useState, useEffect, useCallback, useRef } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { useAuth } from "../contexts/AuthContext";
import API_BASE from "../config/api";
import useTour from "../Hooks/useTour";
import TourGuide from "../components/TourGuide";
import { STEPS_DASHBOARD } from "../utils/tourSteps";

// ── Constantes ────────────────────────────────────────────────────────────────
const MESES_ES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const REFRESH_SEG = 30;

const BAR_COLORS = [
  "bg-indigo-500","bg-violet-500","bg-sky-500","bg-emerald-500",
  "bg-amber-500","bg-rose-500","bg-teal-500","bg-orange-500",
];

const ALL_WIDGETS = [
  { id: "resumen",    titulo: "Resumen general",          mdSpan: "md:col-span-3" },
  { id: "cargo",      titulo: "Empleados por cargo",      mdSpan: "md:col-span-2" },
  { id: "contrato",   titulo: "Tipos de contrato",        mdSpan: "md:col-span-1" },
  { id: "empresa",    titulo: "Por sede",                 mdSpan: "md:col-span-1" },
  { id: "estado",     titulo: "Por estado",               mdSpan: "md:col-span-1" },
  { id: "salarios",   titulo: "Indicadores salariales",   mdSpan: "md:col-span-1" },
  { id: "recientes",  titulo: "Incorporaciones recientes",mdSpan: "md:col-span-2" },
  { id: "cumpleanos", titulo: "Cumpleaños del mes",       mdSpan: "md:col-span-1" },
];
const ALL_IDS = ALL_WIDGETS.map((w) => w.id);
const WIDGET_MAP = Object.fromEntries(ALL_WIDGETS.map((w) => [w.id, w]));

// ── Persistencia de config ────────────────────────────────────────────────────
const loadCfg = (uid) => {
  try {
    const s = localStorage.getItem(`dash_cfg_${uid}`);
    if (s) { const c = JSON.parse(s); if (Array.isArray(c.widgets)) return c; }
  } catch {}
  return { widgets: [...ALL_IDS] };
};
const saveCfg = (uid, cfg) => {
  try { localStorage.setItem(`dash_cfg_${uid}`, JSON.stringify(cfg)); } catch {}
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt$ = (n) => n ? `$${new Intl.NumberFormat("es-CO").format(n)}` : "—";
const fmtFecha = (s) => {
  if (!s) return "—";
  const [y, m, d] = String(s).split("T")[0].split("-");
  return new Date(+y, +m - 1, +d).toLocaleDateString("es-CO", { day:"2-digit", month:"short", year:"numeric" });
};
const fmtNombre = (r) => `${r.nombre} ${r.apellido}`;

// ── Sub-componentes ───────────────────────────────────────────────────────────
function BarH({ label, value, max, colorIdx = 0 }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  const color = BAR_COLORS[colorIdx % BAR_COLORS.length];
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-28 text-right text-gray-500 dark:text-gray-400 truncate shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-6 relative overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-700 flex items-center justify-end pr-2`}
          style={{ width: `${Math.max(pct, pct > 0 ? 6 : 0)}%` }}
        >
          {pct > 20 && <span className="text-white text-[11px] font-bold">{value}</span>}
        </div>
        {pct <= 20 && (
          <span className="absolute left-2 top-0 h-full flex items-center text-[11px] font-semibold text-gray-700 dark:text-gray-200">
            {value}
          </span>
        )}
      </div>
    </div>
  );
}

function StatNum({ label, value, sub, colorClass = "text-indigo-600 dark:text-indigo-400" }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl bg-gray-50 dark:bg-gray-700/50 p-4 text-center">
      <span className="text-3xl font-extrabold {colorClass} text-indigo-600 dark:text-indigo-400">{value}</span>
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">{label}</span>
      {sub && <span className="text-[10px] text-gray-400 mt-0.5">{sub}</span>}
    </div>
  );
}

function WidgetCard({ titulo, children, loading }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col h-full">
      <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-700">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">{titulo}</p>
      </div>
      <div className="flex-1 p-5 overflow-auto">
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="h-6 bg-gray-100 dark:bg-gray-700 rounded-full animate-pulse" style={{ width: `${85 - i*15}%` }} />
            ))}
          </div>
        ) : children}
      </div>
    </div>
  );
}

// ── Contenido de widgets ───────────────────────────────────────────────────────
function WResumen({ s }) {
  const items = [
    { label: "Total empleados",    value: s.resumen.total,    color: "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800", num: "text-indigo-700 dark:text-indigo-300" },
    { label: "Activos",            value: s.resumen.activos,  color: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800", num: "text-emerald-700 dark:text-emerald-300" },
    { label: "Inactivos",          value: s.resumen.inactivos, color: "bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800", num: "text-red-600 dark:text-red-400" },
    { label: "Vacaciones pendientes", value: s.resumen.vacaciones_pendientes, color: "bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800", num: "text-amber-700 dark:text-amber-300" },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {items.map(({ label, value, color, num }) => (
        <div key={label} className={`rounded-xl border p-4 ${color} flex flex-col items-center text-center`}>
          <span className={`text-4xl font-black ${num}`}>{value}</span>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1.5">{label}</span>
        </div>
      ))}
    </div>
  );
}

function WBarras({ data, emptyMsg = "Sin datos" }) {
  if (!data?.length) return <p className="text-xs text-gray-400 text-center py-4">{emptyMsg}</p>;
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-2.5">
      {data.map((d, i) => <BarH key={d.label} label={d.label} value={d.value} max={max} colorIdx={i} />)}
    </div>
  );
}

const ESTADO_COLORS = {
  Activo:    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  Inactivo:  "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  Suspendido:"bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};
function WEstado({ data }) {
  if (!data?.length) return <p className="text-xs text-gray-400 text-center py-4">Sin datos</p>;
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  return (
    <div className="space-y-3">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-3">
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${ESTADO_COLORS[d.label] ?? "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"}`}>
            {d.label}
          </span>
          <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-2">
            <div
              className="h-2 rounded-full bg-indigo-500 transition-all duration-700"
              style={{ width: `${(d.value / total) * 100}%` }}
            />
          </div>
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 shrink-0">{d.value}</span>
        </div>
      ))}
    </div>
  );
}

function WSalarios({ s }) {
  const { promedio, maximo, minimo } = s.salarios;
  return (
    <div className="space-y-3">
      {[
        { label: "Promedio", value: fmt$(promedio), color: "text-indigo-600 dark:text-indigo-400" },
        { label: "Máximo",   value: fmt$(maximo),   color: "text-emerald-600 dark:text-emerald-400" },
        { label: "Mínimo",   value: fmt$(minimo),   color: "text-rose-600 dark:text-rose-400" },
      ].map(({ label, value, color }) => (
        <div key={label} className="rounded-xl bg-gray-50 dark:bg-gray-700/50 px-4 py-3">
          <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">{label}</p>
          <p className={`text-lg font-bold mt-0.5 ${color}`}>{value}</p>
        </div>
      ))}
    </div>
  );
}

function WRecientes({ data }) {
  if (!data?.length) return <p className="text-xs text-gray-400 text-center py-4">Sin incorporaciones en los últimos 30 días</p>;
  return (
    <div className="overflow-x-auto -mx-5 px-5">
      <table className="w-full text-xs min-w-[360px]">
        <thead>
          <tr className="border-b border-gray-100 dark:border-gray-700">
            <th className="text-left pb-2 font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Empleado</th>
            <th className="text-left pb-2 font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Cargo</th>
            <th className="text-left pb-2 font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Ingreso</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
          {data.map((r, i) => (
            <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors">
              <td className="py-2 font-medium text-gray-800 dark:text-white">{fmtNombre(r)}</td>
              <td className="py-2 text-gray-500 dark:text-gray-400">{r.cargo}</td>
              <td className="py-2 text-indigo-600 dark:text-indigo-400 whitespace-nowrap">{fmtFecha(r.fecha_ingreso)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WCumpleanos({ data }) {
  if (!data?.length) return <p className="text-xs text-gray-400 text-center py-4">No hay cumpleaños este mes</p>;
  const hoy = new Date();
  return (
    <div className="space-y-2">
      {data.map((r, i) => {
        const [,, d] = String(r.fecha_nacimiento).split("T")[0].split("-");
        const esHoy = +d === hoy.getDate();
        return (
          <div key={i} className={`flex items-center gap-3 rounded-lg px-3 py-2 ${esHoy ? "bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800" : "bg-gray-50 dark:bg-gray-700/30"}`}>
            <span className={`text-lg ${esHoy ? "animate-bounce" : ""}`}>🎂</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800 dark:text-white truncate">{fmtNombre(r)}</p>
              {esHoy && <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">¡Hoy!</p>}
            </div>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 shrink-0">{d}</span>
          </div>
        );
      })}
    </div>
  );
}

function WidgetContent({ id, stats }) {
  if (!stats) return null;
  switch (id) {
    case "resumen":    return <WResumen s={stats} />;
    case "cargo":      return <WBarras data={stats.por_cargo} emptyMsg="Sin cargos" />;
    case "contrato":   return <WBarras data={stats.por_contrato} emptyMsg="Sin contratos" />;
    case "empresa":    return <WBarras data={stats.por_empresa} emptyMsg="Sin sedes" />;
    case "estado":     return <WEstado data={stats.por_estado} />;
    case "salarios":   return <WSalarios s={stats} />;
    case "recientes":  return <WRecientes data={stats.recientes} />;
    case "cumpleanos": return <WCumpleanos data={stats.cumpleanos} />;
    default:           return null;
  }
}

// ── Panel de configuración ────────────────────────────────────────────────────
function PanelConfig({ config, onClose, onChange }) {
  const habilitados = config.widgets;
  const deshabilitados = ALL_IDS.filter((id) => !habilitados.includes(id));
  const lista = [...habilitados, ...deshabilitados];

  const toggle = (id) => {
    const enabled = habilitados.includes(id);
    const next = enabled
      ? habilitados.filter((w) => w !== id)
      : [...habilitados, id];
    onChange({ ...config, widgets: next });
  };

  const mover = (id, dir) => {
    const arr = [...habilitados];
    const idx = arr.indexOf(id);
    if (idx === -1) return;
    const nIdx = idx + dir;
    if (nIdx < 0 || nIdx >= arr.length) return;
    [arr[idx], arr[nIdx]] = [arr[nIdx], arr[idx]];
    onChange({ ...config, widgets: arr });
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="w-72 bg-white dark:bg-gray-800 h-full shadow-2xl border-l border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-800 dark:text-white">Personalizar tablero</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 px-5 pt-4 pb-2">
          Activa, desactiva y ordena los widgets. Solo afecta tu sesión.
        </p>
        <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1">
          {lista.map((id) => {
            const def = WIDGET_MAP[id];
            if (!def) return null;
            const activo = habilitados.includes(id);
            const idx = habilitados.indexOf(id);
            return (
              <div key={id} className={`flex items-center gap-2 rounded-lg px-3 py-2.5 transition-colors ${activo ? "bg-indigo-50 dark:bg-indigo-900/20" : "bg-gray-50 dark:bg-gray-700/30 opacity-60"}`}>
                <input
                  type="checkbox"
                  checked={activo}
                  onChange={() => toggle(id)}
                  className="w-4 h-4 rounded accent-indigo-600 cursor-pointer"
                />
                <span className="flex-1 text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{def.titulo}</span>
                {activo && (
                  <div className="flex gap-0.5">
                    <button
                      onClick={() => mover(id, -1)}
                      disabled={idx === 0}
                      className="p-1 rounded text-gray-400 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                      </svg>
                    </button>
                    <button
                      onClick={() => mover(id, 1)}
                      disabled={idx === habilitados.length - 1}
                      className="p-1 rounded text-gray-400 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="p-4 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={() => onChange({ widgets: [...ALL_IDS] })}
            className="w-full text-xs text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 py-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-indigo-400 transition-colors"
          >
            Restablecer configuración
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Exportar PDF ──────────────────────────────────────────────────────────────
function exportarPDF(stats, usuario) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const PW = 210;
  const ML = 14;
  const CW = PW - ML * 2; // 182 mm

  // Paleta de colores (RGB)
  const C = {
    indigo:      [79,  70,  229],
    indigoDark:  [55,  48,  163],
    indigoLight: [238, 242, 255],
    violet:      [124, 58,  237],
    sky:         [14,  165, 233],
    emerald:     [16,  185, 129],
    emeraldLight:[209, 250, 229],
    amber:       [245, 158, 11],
    amberLight:  [254, 243, 199],
    rose:        [244, 63,  94],
    roseLight:   [254, 226, 226],
    teal:        [20,  184, 166],
    orange:      [249, 115, 22],
    gray50:      [249, 250, 251],
    gray100:     [243, 244, 246],
    gray200:     [229, 231, 235],
    gray500:     [107, 114, 128],
    gray600:     [75,  85,  99],
    gray700:     [55,  65,  81],
    gray900:     [17,  24,  39],
    white:       [255, 255, 255],
  };

  const CHART_COLORS = [
    C.indigo, C.violet, C.sky, C.emerald,
    C.amber, C.rose, C.teal, C.orange,
  ];

  let y = 0;

  // ── Helpers ────────────────────────────────────────────────────────────────
  const checkPage = (needed = 20) => {
    if (y + needed > 282) { doc.addPage(); y = 16; }
  };

  const sectionHeader = (title) => {
    checkPage(14);
    doc.setFillColor(...C.indigo);
    doc.rect(ML, y, 3, 5.5, "F");
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.gray900);
    doc.text(title, ML + 5.5, y + 4.2);
    y += 10;
  };

  const drawStatCard = (x, cy, w, h, value, label, bgRgb, numRgb) => {
    doc.setFillColor(...bgRgb);
    doc.roundedRect(x, cy, w, h, 2.5, 2.5, "F");
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...numRgb);
    doc.text(String(value ?? 0), x + w / 2, cy + h * 0.54, { align: "center" });
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.gray500);
    doc.text(label, x + w / 2, cy + h * 0.83, { align: "center" });
  };

  const drawSalaryCard = (x, cy, w, h, valueStr, label, bgRgb, numRgb) => {
    doc.setFillColor(...bgRgb);
    doc.roundedRect(x, cy, w, h, 2.5, 2.5, "F");
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...numRgb);
    doc.text(valueStr, x + w / 2, cy + h * 0.5, { align: "center" });
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.gray500);
    doc.text(label, x + w / 2, cy + h * 0.78, { align: "center" });
  };

  const drawHBars = (data, labelW = 44, barH = 6, rowGap = 3.5) => {
    if (!data?.length) return;
    const max = Math.max(...data.map((d) => d.value), 1);
    const bx = ML + labelW + 2;
    const availW = CW - labelW - 2;
    data.forEach((d, i) => {
      checkPage(barH + rowGap + 2);
      const color = CHART_COLORS[i % CHART_COLORS.length];
      const pct = d.value / max;
      const labelStr = d.label.length > 24 ? d.label.slice(0, 23) + "…" : d.label;

      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...C.gray700);
      doc.text(labelStr, ML + labelW, y + barH / 2 + 2.5, { align: "right" });

      // fondo
      doc.setFillColor(...C.gray100);
      doc.roundedRect(bx, y, availW, barH, 1.5, 1.5, "F");

      // relleno
      const fillW = Math.max(pct * availW, pct > 0 ? 4 : 0);
      if (fillW > 0) {
        doc.setFillColor(...color);
        doc.roundedRect(bx, y, fillW, barH, 1.5, 1.5, "F");
      }

      // valor
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      if (fillW > 14) {
        doc.setTextColor(...C.white);
        doc.text(String(d.value), bx + fillW - 2, y + barH / 2 + 2.2, { align: "right" });
      } else {
        doc.setTextColor(...C.gray700);
        doc.text(String(d.value), bx + fillW + 2.5, y + barH / 2 + 2.2);
      }
      y += barH + rowGap;
    });
    y += 2;
  };

  // ── Encabezado ─────────────────────────────────────────────────────────────
  doc.setFillColor(...C.indigoDark);
  doc.rect(0, 0, PW, 26, "F");
  doc.setFillColor(...C.indigo);
  doc.rect(0, 22, PW, 5, "F");

  doc.setFontSize(17);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.white);
  doc.text("Dashboard RRHH", ML, 13);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(199, 210, 254);
  doc.text("Empresa COL — Sistema de Gestión de Recursos Humanos", ML, 19);

  const fechaDoc = new Date().toLocaleDateString("es-CO", {
    day: "2-digit", month: "long", year: "numeric",
  });
  doc.setFontSize(8);
  doc.setTextColor(...C.white);
  doc.text(fechaDoc, PW - ML, 11, { align: "right" });
  if (usuario) {
    doc.setFontSize(7.5);
    doc.setTextColor(199, 210, 254);
    doc.text(
      `Generado por: ${usuario.nombre ?? ""} ${usuario.apellido ?? ""}`.trim(),
      PW - ML, 17, { align: "right" }
    );
  }

  y = 36;

  // ── Resumen ────────────────────────────────────────────────────────────────
  sectionHeader("Resumen general");
  const cW4 = (CW - 9) / 4;
  const cH4 = 22;
  const statCards = [
    { v: stats.resumen.total,                 label: "Total empleados",    bg: C.indigoLight,   num: C.indigo },
    { v: stats.resumen.activos,               label: "Activos",            bg: C.emeraldLight,  num: C.emerald },
    { v: stats.resumen.inactivos,             label: "Inactivos",          bg: C.roseLight,     num: C.rose },
    { v: stats.resumen.vacaciones_pendientes, label: "Vac. pendientes",    bg: C.amberLight,    num: C.amber },
  ];
  statCards.forEach((c, i) => {
    drawStatCard(ML + i * (cW4 + 3), y, cW4, cH4, c.v, c.label, c.bg, c.num);
  });
  y += cH4 + 8;

  // ── Salarios ───────────────────────────────────────────────────────────────
  if (stats.salarios?.promedio || stats.salarios?.maximo) {
    sectionHeader("Indicadores salariales");
    const sW = (CW - 6) / 3;
    const sH = 18;
    const salCards = [
      { v: fmt$(stats.salarios.promedio), label: "Salario promedio", bg: C.indigoLight,  num: C.indigo },
      { v: fmt$(stats.salarios.maximo),   label: "Salario máximo",   bg: C.emeraldLight, num: C.emerald },
      { v: fmt$(stats.salarios.minimo),   label: "Salario mínimo",   bg: C.roseLight,    num: C.rose },
    ];
    salCards.forEach((c, i) => {
      drawSalaryCard(ML + i * (sW + 3), y, sW, sH, c.v, c.label, c.bg, c.num);
    });
    y += sH + 8;
  }

  // ── Barras: cargo ──────────────────────────────────────────────────────────
  if (stats.por_cargo?.length) {
    checkPage(14 + stats.por_cargo.length * 10);
    sectionHeader("Empleados por cargo");
    drawHBars(stats.por_cargo);
  }

  // ── Barras: contrato ───────────────────────────────────────────────────────
  if (stats.por_contrato?.length) {
    checkPage(14 + stats.por_contrato.length * 10);
    sectionHeader("Tipos de contrato");
    drawHBars(stats.por_contrato);
  }

  // ── Barras: empresa ────────────────────────────────────────────────────────
  if (stats.por_empresa?.length) {
    checkPage(14 + stats.por_empresa.length * 10);
    sectionHeader("Por sede");
    drawHBars(stats.por_empresa);
  }

  // ── Estado ─────────────────────────────────────────────────────────────────
  if (stats.por_estado?.length) {
    checkPage(14 + stats.por_estado.length * 10);
    sectionHeader("Por estado");
    const total = stats.por_estado.reduce((s, d) => s + d.value, 0) || 1;
    const STATUS_COLOR = { Activo: C.emerald, Inactivo: C.rose, Suspendido: C.amber };
    const pillAreaW = 36;
    const barAreaX = ML + pillAreaW + 4;
    const barAreaW = CW - pillAreaW - 4;
    stats.por_estado.forEach((d) => {
      checkPage(12);
      const color = STATUS_COLOR[d.label] || C.indigo;
      const pct = d.value / total;

      doc.setFillColor(...color);
      doc.roundedRect(ML, y, pillAreaW, 6.5, 3, 3, "F");
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...C.white);
      doc.text(d.label, ML + pillAreaW / 2, y + 4.5, { align: "center" });

      doc.setFillColor(...C.gray100);
      doc.roundedRect(barAreaX, y, barAreaW, 6.5, 1.5, 1.5, "F");
      const fw = pct * barAreaW;
      if (fw > 0) {
        doc.setFillColor(...color);
        doc.roundedRect(barAreaX, y, fw, 6.5, 1.5, 1.5, "F");
      }
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...C.gray700);
      doc.text(
        `${d.value}  (${Math.round(pct * 100)}%)`,
        barAreaX + barAreaW + 2, y + 4.5
      );
      y += 10;
    });
    y += 4;
  }

  // ── Incorporaciones recientes ──────────────────────────────────────────────
  if (stats.recientes?.length) {
    checkPage(20);
    sectionHeader("Incorporaciones recientes (últimos 30 días)");
    autoTable(doc, {
      startY: y,
      margin: { left: ML, right: ML },
      head: [["Empleado", "Cargo", "Fecha ingreso"]],
      body: stats.recientes.map((r) => [fmtNombre(r), r.cargo, fmtFecha(r.fecha_ingreso)]),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: C.indigo, textColor: C.white, fontStyle: "bold", fontSize: 8 },
      alternateRowStyles: { fillColor: C.indigoLight },
      columnStyles: { 2: { halign: "center", cellWidth: 34 } },
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  // ── Cumpleaños ─────────────────────────────────────────────────────────────
  if (stats.cumpleanos?.length) {
    checkPage(20);
    sectionHeader("Cumpleaños del mes");
    const hoy = new Date().getDate();
    stats.cumpleanos.forEach((r) => {
      checkPage(10);
      const dia = Number(String(r.fecha_nacimiento).split("T")[0].split("-")[2]);
      const esHoy = dia === hoy;

      if (esHoy) {
        doc.setFillColor(...C.amberLight);
        doc.roundedRect(ML, y - 1, CW, 8, 1.5, 1.5, "F");
      }

      doc.setFillColor(...(esHoy ? C.amber : C.indigo));
      doc.circle(ML + 3, y + 3, 1.8, "F");

      doc.setFontSize(8.5);
      doc.setFont("helvetica", esHoy ? "bold" : "normal");
      doc.setTextColor(...C.gray700);
      doc.text(fmtNombre(r), ML + 8, y + 4.5);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(...(esHoy ? C.amber : C.gray500));
      doc.text(
        `Día ${dia}${esHoy ? "  — ¡Hoy!" : ""}`,
        PW - ML, y + 4.5, { align: "right" }
      );
      y += 9;
    });
  }

  // ── Pie de página en todas las páginas ─────────────────────────────────────
  const totalPags = doc.getNumberOfPages();
  for (let p = 1; p <= totalPags; p++) {
    doc.setPage(p);
    doc.setFillColor(...C.gray100);
    doc.rect(0, 289, PW, 8, "F");
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.gray500);
    doc.text("Empresa COL — Sistema de Gestión de Recursos Humanos", ML, 294.5);
    doc.text(`Página ${p} de ${totalPags}`, PW - ML, 294.5, { align: "right" });
  }

  doc.save(`dashboard_${new Date().toISOString().split("T")[0]}.pdf`);
}

// ── Exportar Excel ────────────────────────────────────────────────────────────
function exportarExcel(stats) {
  const wb = XLSX.utils.book_new();

  const addSheet = (nombre, cabeceras, filas) => {
    const ws = XLSX.utils.aoa_to_sheet([cabeceras, ...filas]);
    ws["!cols"] = cabeceras.map(() => ({ wch: 22 }));
    XLSX.utils.book_append_sheet(wb, ws, nombre);
  };

  addSheet("Resumen", ["Métrica", "Valor"], [
    ["Total empleados",       stats.resumen.total],
    ["Activos",               stats.resumen.activos],
    ["Inactivos",             stats.resumen.inactivos],
    ["Vacaciones pendientes", stats.resumen.vacaciones_pendientes],
    ["Salario promedio",      stats.salarios.promedio],
    ["Salario máximo",        stats.salarios.maximo],
    ["Salario mínimo",        stats.salarios.minimo],
  ]);

  if (stats.por_cargo.length)
    addSheet("Por cargo", ["Cargo", "Cantidad"], stats.por_cargo.map((r) => [r.label, r.value]));

  if (stats.por_contrato.length)
    addSheet("Por contrato", ["Tipo de contrato", "Cantidad"], stats.por_contrato.map((r) => [r.label, r.value]));

  if (stats.por_empresa.length)
    addSheet("Por sede", ["Sede", "Cantidad"], stats.por_empresa.map((r) => [r.label, r.value]));

  if (stats.por_estado.length)
    addSheet("Por estado", ["Estado", "Cantidad"], stats.por_estado.map((r) => [r.label, r.value]));

  if (stats.recientes.length)
    addSheet("Recientes", ["Nombre", "Apellido", "Cargo", "Fecha ingreso"],
      stats.recientes.map((r) => [r.nombre, r.apellido, r.cargo, fmtFecha(r.fecha_ingreso)]));

  if (stats.cumpleanos.length)
    addSheet("Cumpleaños", ["Nombre", "Apellido", "Fecha nacimiento"],
      stats.cumpleanos.map((r) => [r.nombre, r.apellido, fmtFecha(r.fecha_nacimiento)]));

  XLSX.writeFile(wb, `dashboard_${new Date().toISOString().split("T")[0]}.xlsx`);
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { usuario } = useAuth();
  const { run: tourRun, handleFinish: tourFinish, restart: tourRestart } = useTour("dashboard");
  const [stats, setStats]         = useState(null);
  const [cargando, setCargando]   = useState(true);
  const [error, setError]         = useState("");
  const [ultimaTs, setUltimaTs]   = useState(null);
  const [segs, setSegs]           = useState(0);
  const [configOpen, setConfigOpen] = useState(false);
  const [config, setConfigState]  = useState(() => loadCfg(usuario?.id));
  const intervalRef = useRef(null);

  // Filtro de sede
  const [sedes, setSedes]       = useState([]);
  const [filtroSede, setFiltroSede] = useState("");

  const updateConfig = useCallback((next) => {
    setConfigState(next);
    saveCfg(usuario?.id, next);
  }, [usuario?.id]);

  const cargar = useCallback(async (silencioso = false, sedeId = filtroSede) => {
    if (!silencioso) setCargando(true);
    setError("");
    try {
      const qs  = sedeId ? `?sede_id=${sedeId}` : "";
      const res  = await fetch(`${API_BASE}/dashboard/stats${qs}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al cargar");
      setStats(data);
      setUltimaTs(Date.now());
      setSegs(0);
    } catch (e) {
      if (!silencioso) setError(e.message);
    } finally {
      if (!silencioso) setCargando(false);
    }
  }, [filtroSede]);

  // Cargar sedes una sola vez al montar
  useEffect(() => {
    fetch(`${API_BASE}/sedes?activas=true`)
      .then((r) => r.json())
      .then((d) => setSedes(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  // Carga inicial + polling — se reinicia si cambia filtroSede
  useEffect(() => {
    cargar();
    intervalRef.current = setInterval(() => cargar(true), REFRESH_SEG * 1000);
    const onVisible = () => { if (document.visibilityState === "visible") cargar(true); };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [cargar]);

  // Contador de segundos desde última actualización
  useEffect(() => {
    if (!ultimaTs) return;
    const t = setInterval(() => setSegs(Math.round((Date.now() - ultimaTs) / 1000)), 1000);
    return () => clearInterval(t);
  }, [ultimaTs]);

  const handleManualRefresh = () => {
    clearInterval(intervalRef.current);
    cargar(false, filtroSede);
    intervalRef.current = setInterval(() => cargar(true), REFRESH_SEG * 1000);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div>
      <TourGuide run={tourRun} steps={STEPS_DASHBOARD} onFinish={tourFinish} />

      {/* Panel de configuración */}
      {configOpen && (
        <PanelConfig
          config={config}
          onClose={() => setConfigOpen(false)}
          onChange={updateConfig}
        />
      )}

      {/* Encabezado */}
      <div data-tour="dashboard-header" className="flex items-start justify-between mb-4 md:mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">Dashboard</h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Indicadores en tiempo real — empresa COL
          </p>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {/* Filtro por sede */}
          {sedes.length > 0 && (
            <select
              value={filtroSede}
              onChange={(e) => setFiltroSede(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Todas las sedes</option>
              {sedes.map((s) => (
                <option key={s.id} value={String(s.id)}>{s.nombre}</option>
              ))}
            </select>
          )}
          {/* Última actualización */}
          {ultimaTs && !cargando && (
            <span className="text-xs text-gray-400 dark:text-gray-500 mr-1">
              Actualizado hace {segs}s
            </span>
          )}

          {/* Refresh manual */}
          <button
            onClick={handleManualRefresh}
            disabled={cargando}
            title="Actualizar ahora"
            className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            <svg className={`w-4 h-4 ${cargando ? "animate-spin" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </button>

          {/* Personalizar */}
          <button
            data-tour="dashboard-config"
            onClick={() => setConfigOpen(true)}
            title="Personalizar tablero"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="hidden sm:inline">Personalizar</span>
          </button>

          {/* Exportar Excel */}
          <button
            onClick={() => stats && exportarExcel(stats)}
            disabled={!stats}
            title="Exportar a Excel"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            <span className="hidden sm:inline">Excel</span>
          </button>

          {/* Exportar PDF */}
          <button
            onClick={() => stats && exportarPDF(stats, usuario)}
            disabled={!stats}
            title="Exportar a PDF"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 text-sm text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <span className="hidden sm:inline">PDF</span>
          </button>

          {/* Reiniciar tour */}
          <button
            onClick={tourRestart}
            title="Ver guía de este módulo"
            className="flex items-center justify-center w-8 h-8 rounded-full border border-indigo-200 dark:border-indigo-700 text-indigo-400 dark:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors text-sm font-bold flex-shrink-0"
          >
            ?
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Grid de widgets */}
      {config.widgets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500">
          <svg className="w-12 h-12 mb-3 opacity-30" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
          </svg>
          <p className="text-sm font-medium">No hay widgets activos</p>
          <button onClick={() => setConfigOpen(true)} className="mt-2 text-xs text-indigo-500 hover:underline">
            Personalizar tablero
          </button>
        </div>
      ) : (
        <div data-tour="dashboard-widgets" className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {config.widgets.map((id) => {
            const def = WIDGET_MAP[id];
            if (!def) return null;
            return (
              <div key={id} className={def.mdSpan}>
                <WidgetCard titulo={def.titulo} loading={cargando && !stats}>
                  {stats && <WidgetContent id={id} stats={stats} />}
                </WidgetCard>
              </div>
            );
          })}
        </div>
      )}

      {/* Nota de actualización */}
      {!cargando && ultimaTs && (
        <p className="mt-6 text-center text-[11px] text-gray-300 dark:text-gray-600">
          Se actualiza automáticamente cada {REFRESH_SEG}s · Última vez:{" "}
          {new Date(ultimaTs).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </p>
      )}
    </div>
  );
}
