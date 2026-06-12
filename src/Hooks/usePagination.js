import { useState, useMemo, useEffect, useRef } from "react";

export default function usePagination(items, initialPageSize = 10) {
  const [page, setPage]         = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage   = Math.min(page, totalPages);

  // Vuelve a página 1 cada vez que cambia el total filtrado
  const prevTotal = useRef(totalItems);
  useEffect(() => {
    if (prevTotal.current !== totalItems) {
      setPage(1);
      prevTotal.current = totalItems;
    }
  }, [totalItems]);

  const paginatedItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, safePage, pageSize]);

  const handlePageChange = (p) => setPage(Math.max(1, Math.min(p, totalPages)));

  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setPage(1);
  };

  return {
    paginatedItems,
    page: safePage,
    setPage: handlePageChange,
    pageSize,
    setPageSize: handlePageSizeChange,
    totalItems,
    totalPages,
  };
}
