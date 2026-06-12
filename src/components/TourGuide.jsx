import { Joyride } from "react-joyride";

const locale = {
  back: "Atrás",
  close: "Cerrar",
  last: "Finalizar",
  next: "Siguiente",
  skip: "Saltar tour",
};

const joyrideStyles = {
  options: {
    primaryColor: "#6366f1",
    zIndex: 10000,
    backgroundColor: "#ffffff",
    textColor: "#374151",
    arrowColor: "#ffffff",
  },
  tooltip: {
    borderRadius: "12px",
    padding: "20px 22px 16px",
    maxWidth: "360px",
    boxShadow: "0 10px 40px rgba(0,0,0,0.18)",
  },
  tooltipTitle: {
    fontSize: "15px",
    fontWeight: "700",
    color: "#111827",
    marginBottom: "6px",
  },
  tooltipContent: {
    fontSize: "13.5px",
    lineHeight: "1.65",
    color: "#4b5563",
  },
  tooltipFooter: { marginTop: "14px", gap: "8px" },
  buttonNext: {
    backgroundColor: "#6366f1",
    borderRadius: "8px",
    padding: "8px 18px",
    fontSize: "13px",
    fontWeight: "500",
  },
  buttonBack: {
    color: "#6366f1",
    fontSize: "13px",
    padding: "8px 10px",
  },
  buttonSkip: { color: "#9ca3af", fontSize: "12px" },
  buttonClose: { width: "12px", height: "12px", top: "12px", right: "12px" },
  spotlight: { borderRadius: "8px" },
  overlay: { backgroundColor: "rgba(0,0,0,0.45)" },
};

export default function TourGuide({ run, steps, onFinish }) {
  if (!run || !steps?.length) return null;

  // Solo incluir pasos cuyo target existe en el DOM
  const validSteps = steps.filter((s) =>
    s.target === "body" || Boolean(document.querySelector(s.target))
  );

  if (!validSteps.length) {
    onFinish?.();
    return null;
  }

  return (
    <Joyride
      steps={validSteps}
      run={run}
      continuous
      showProgress
      showSkipButton
      disableOverlayClose={false}
      spotlightPadding={6}
      callback={({ status, type }) => {
        if (["finished", "skipped"].includes(status)) onFinish?.();
        // Si joyride no puede encontrar el target en tiempo de ejecución, terminar igual
        if (type === "error" || type === "target:notFound") onFinish?.();
      }}
      locale={locale}
      styles={joyrideStyles}
    />
  );
}
