import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";

const TourContext = createContext(null);

const KEY = (uid) => `tour_v1_${uid}`;

function loadCfg(uid) {
  if (!uid) return { enabled: true, seen: {} };
  try {
    const raw = localStorage.getItem(KEY(uid));
    if (!raw) return { enabled: true, seen: {} };
    return { enabled: true, seen: {}, ...JSON.parse(raw) };
  } catch {
    return { enabled: true, seen: {} };
  }
}

function persistCfg(uid, data) {
  if (!uid) return;
  try { localStorage.setItem(KEY(uid), JSON.stringify(data)); } catch {}
}

export function TourProvider({ children }) {
  const { usuario } = useAuth();
  const uid = usuario?.id;

  const [cfg, setCfg] = useState(() => loadCfg(uid));

  useEffect(() => { setCfg(loadCfg(uid)); }, [uid]);

  const setEnabled = useCallback((val) => {
    setCfg((p) => {
      const n = { ...p, enabled: !!val };
      persistCfg(uid, n);
      return n;
    });
  }, [uid]);

  const markSeen = useCallback((tourId) => {
    setCfg((p) => {
      const n = { ...p, seen: { ...p.seen, [tourId]: true } };
      persistCfg(uid, n);
      return n;
    });
  }, [uid]);

  const resetTour = useCallback((tourId) => {
    setCfg((p) => {
      const seen = { ...p.seen };
      delete seen[tourId];
      const n = { ...p, seen };
      persistCfg(uid, n);
      return n;
    });
  }, [uid]);

  const resetAll = useCallback(() => {
    setCfg((p) => {
      const n = { ...p, seen: {} };
      persistCfg(uid, n);
      return n;
    });
  }, [uid]);

  const isSeen = useCallback((tourId) => Boolean(cfg.seen[tourId]), [cfg]);

  return (
    <TourContext.Provider value={{ enabled: cfg.enabled, setEnabled, markSeen, resetTour, resetAll, isSeen, seen: cfg.seen }}>
      {children}
    </TourContext.Provider>
  );
}

export function useTourCtx() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error("useTourCtx debe usarse dentro de TourProvider");
  return ctx;
}
