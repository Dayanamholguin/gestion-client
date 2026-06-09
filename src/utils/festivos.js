// ── Festivos colombianos ──────────────────────────────────────────────────────
// Implementa la Ley 51/1983 (Ley Emiliani) y la fórmula de Gauss para Pascua.

function _fmt(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function _addDias(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

// Mueve al siguiente lunes si no cae en lunes (Ley Emiliani)
function _sigLunes(d) {
  const r = new Date(d);
  const dow = r.getDay(); // 0=Dom
  if (dow !== 1) r.setDate(r.getDate() + ((8 - dow) % 7));
  return r;
}

// Domingo de Pascua — algoritmo de Gauss
function _pascua(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31) - 1;
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, mes, dia);
}

const _NOMBRES_FIJOS = {
  "01-01": "Año Nuevo",
  "05-01": "Día del Trabajo",
  "07-20": "Día de la Independencia",
  "08-07": "Batalla de Boyacá",
  "12-08": "Inmaculada Concepción",
  "12-25": "Navidad",
};

/**
 * Retorna un Map<"YYYY-MM-DD", string> con todos los festivos del año dado.
 * Clave: fecha en formato ISO  |  Valor: nombre del festivo
 */
export function getFestivos(year) {
  const p = _pascua(year);

  const lista = [
    // ── Fijos ────────────────────────────────────────────────────────────────
    [new Date(year, 0, 1),   "Año Nuevo"],
    [new Date(year, 4, 1),   "Día del Trabajo"],
    [new Date(year, 6, 20),  "Día de la Independencia"],
    [new Date(year, 7, 7),   "Batalla de Boyacá"],
    [new Date(year, 11, 8),  "Inmaculada Concepción"],
    [new Date(year, 11, 25), "Navidad"],

    // ── Ley Emiliani (siguiente lunes) ───────────────────────────────────────
    [_sigLunes(new Date(year, 0, 6)),   "Reyes Magos"],
    [_sigLunes(new Date(year, 2, 19)),  "San José"],
    [_sigLunes(new Date(year, 5, 29)),  "San Pedro y San Pablo"],
    [_sigLunes(new Date(year, 7, 15)),  "Asunción de la Virgen"],
    [_sigLunes(new Date(year, 9, 12)),  "Día de la Raza"],
    [_sigLunes(new Date(year, 10, 1)),  "Todos los Santos"],
    [_sigLunes(new Date(year, 10, 11)), "Independencia de Cartagena"],

    // ── Basados en Pascua ────────────────────────────────────────────────────
    [_addDias(p, -3),            "Jueves Santo"],
    [_addDias(p, -2),            "Viernes Santo"],
    [_sigLunes(_addDias(p, 39)), "Ascensión del Señor"],
    [_sigLunes(_addDias(p, 60)), "Corpus Christi"],
    [_sigLunes(_addDias(p, 68)), "Sagrado Corazón de Jesús"],
  ];

  const map = new Map();
  for (const [date, nombre] of lista) {
    map.set(_fmt(date), nombre);
  }
  return map;
}

/**
 * Cuenta los días hábiles entre dos fechas "YYYY-MM-DD" (ambas inclusive).
 * @param {string} inicio
 * @param {string} fin
 * @param {number[]} diasLaborales  días de la semana laborales [0=Dom..6=Sáb]
 * @param {Map}     festivosMap     resultado de getFestivos()
 */
export function contarDiasHabiles(inicio, fin, diasLaborales, festivosMap) {
  const [yi, mi, di] = inicio.split("-").map(Number);
  const [yf, mf, df] = fin.split("-").map(Number);
  const start = new Date(yi, mi - 1, di);
  const end   = new Date(yf, mf - 1, df);

  let count = 0;
  const cur = new Date(start);

  while (cur <= end) {
    const dow     = cur.getDay();
    const fechaStr = _fmt(cur);
    if (diasLaborales.includes(dow) && !festivosMap.has(fechaStr)) {
      count++;
    }
    cur.setDate(cur.getDate() + 1);
  }

  return count;
}
