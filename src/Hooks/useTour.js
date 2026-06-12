import { useState, useEffect, useCallback } from "react";
import { useTourCtx } from "../contexts/TourContext";

export default function useTour(tourId) {
  const { enabled, isSeen, markSeen, resetTour, seen } = useTourCtx();
  const [run, setRun] = useState(false);

  // Los tours de módulo esperan a que el tour del sistema se haya visto primero.
  // seen.sistema se añade a las deps para que el efecto se re-ejecute cuando termine.
  const sistemaSeen = Boolean(seen?.sistema);

  useEffect(() => {
    const listo = tourId === "sistema" ? true : sistemaSeen;
    if (enabled && listo && !isSeen(tourId)) {
      const t = setTimeout(() => setRun(true), 800);
      return () => clearTimeout(t);
    }
    if (!enabled) setRun(false);
    // isSeen se excluye intencionalmente para no re-disparar tras markSeen
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, tourId, sistemaSeen]);

  const handleFinish = useCallback(() => {
    markSeen(tourId);
    setRun(false);
  }, [tourId, markSeen]);

  const restart = useCallback(() => {
    resetTour(tourId);
    setTimeout(() => setRun(true), 100);
  }, [tourId, resetTour]);

  return { run, handleFinish, restart };
}
