export default function Pagination({ page, pageSize, total, onPageChange, onPageSizeChange }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  const range = [];
  for (let i = Math.max(1, page - 1); i <= Math.min(totalPages, page + 1); i++) range.push(i);
  const showLeftDots  = range[0] > 2;
  const showRightDots = range[range.length - 1] < totalPages - 1;
  const showFirst = range[0] > 1;
  const showLast  = range[range.length - 1] < totalPages;

  if (total === 0) return null;

  const base     = "w-8 h-8 flex items-center justify-center text-sm rounded-md transition-colors";
  const active   = "bg-indigo-600 text-white font-semibold";
  const normal   = "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700";
  const disabled = "text-gray-300 dark:text-gray-600 cursor-not-allowed pointer-events-none";

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800">
      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
        <span className="whitespace-nowrap">Filas por página:</span>
        <select
          value={pageSize}
          onChange={e => onPageSizeChange(Number(e.target.value))}
          className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          {[10, 25, 50].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <span className="whitespace-nowrap">
          <strong>{start}–{end}</strong> de <strong>{total}</strong>
        </span>
      </div>

      <div className="flex items-center gap-0.5">
        <button onClick={() => onPageChange(1)} disabled={page === 1}
          className={`${base} ${page === 1 ? disabled : normal}`} title="Primera">«</button>
        <button onClick={() => onPageChange(page - 1)} disabled={page === 1}
          className={`${base} ${page === 1 ? disabled : normal}`} title="Anterior">‹</button>

        {showFirst && <button onClick={() => onPageChange(1)} className={`${base} ${normal}`}>1</button>}
        {showLeftDots && <span className="w-8 text-center text-gray-400">…</span>}
        {range.map(p => (
          <button key={p} onClick={() => onPageChange(p)}
            className={`${base} ${p === page ? active : normal}`}>{p}</button>
        ))}
        {showRightDots && <span className="w-8 text-center text-gray-400">…</span>}
        {showLast && <button onClick={() => onPageChange(totalPages)} className={`${base} ${normal}`}>{totalPages}</button>}

        <button onClick={() => onPageChange(page + 1)} disabled={page === totalPages}
          className={`${base} ${page === totalPages ? disabled : normal}`} title="Siguiente">›</button>
        <button onClick={() => onPageChange(totalPages)} disabled={page === totalPages}
          className={`${base} ${page === totalPages ? disabled : normal}`} title="Última">»</button>
      </div>
    </div>
  );
}
