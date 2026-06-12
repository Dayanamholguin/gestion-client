import { useState, useMemo } from "react";

function getVal(obj, key) {
  return key.split(".").reduce((o, k) => (o != null ? o[k] : undefined), obj) ?? "";
}

function cmpValues(a, b) {
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  const na = Number(a), nb = Number(b);
  if (a !== "" && b !== "" && !isNaN(na) && !isNaN(nb)) return na - nb;
  return String(a).localeCompare(String(b), "es", { sensitivity: "base" });
}

export default function useSort(items, defaultKey = "", defaultDir = "asc") {
  const [sortConfig, setSortConfig] = useState({ key: defaultKey, dir: defaultDir });

  const sortedItems = useMemo(() => {
    if (!sortConfig.key) return items;
    return [...items].sort((a, b) => {
      const res = cmpValues(getVal(a, sortConfig.key), getVal(b, sortConfig.key));
      return sortConfig.dir === "desc" ? -res : res;
    });
  }, [items, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      dir: prev.key === key && prev.dir === "asc" ? "desc" : "asc",
    }));
  };

  return { sortedItems, sortConfig, handleSort };
}

export function SortIcon({ field, sortConfig }) {
  if (sortConfig.key !== field) {
    return (
      <svg className="inline w-3 h-3 ml-1 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 12l-4-4m4 4l4-4M17 8v12m0-12l4 4m-4-4l-4 4" />
      </svg>
    );
  }
  if (sortConfig.dir === "asc") {
    return (
      <svg className="inline w-3 h-3 ml-1 text-indigo-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
      </svg>
    );
  }
  return (
    <svg className="inline w-3 h-3 ml-1 text-indigo-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}
