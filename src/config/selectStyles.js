export const getSelectStyles = (isDark = false) => ({
  control: (base, state) => ({
    ...base,
    backgroundColor: isDark ? "#374151" : "#ffffff",
    borderColor: state.isFocused ? "#4f46e5" : isDark ? "#4b5563" : "#d1d5db",
    boxShadow: state.isFocused ? "0 0 0 1px #4f46e5" : "none",
    minHeight: "40px",
    fontSize: "0.875rem",
    borderRadius: "0.375rem",
    "&:hover": { borderColor: "#6366f1" },
  }),
  menu: (base) => ({
    ...base,
    backgroundColor: isDark ? "#374151" : "#ffffff",
    border: `1px solid ${isDark ? "#4b5563" : "#d1d5db"}`,
    borderRadius: "0.375rem",
    marginTop: "2px",
  }),
  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
  option: (base, { isSelected, isFocused }) => ({
    ...base,
    backgroundColor: isSelected
      ? "#4f46e5"
      : isFocused
        ? isDark ? "#4b5563" : "#e0e7ff"
        : "transparent",
    color: isSelected ? "#ffffff" : isDark ? "#f3f4f6" : "#374151",
    cursor: "pointer",
    fontSize: "0.875rem",
    padding: "8px 12px",
    ":active": { backgroundColor: "#4f46e5", color: "#ffffff" },
  }),
  singleValue: (base) => ({
    ...base,
    color: isDark ? "#f3f4f6" : "#374151",
    fontSize: "0.875rem",
  }),
  input: (base) => ({
    ...base,
    color: isDark ? "#f3f4f6" : "#374151",
    fontSize: "0.875rem",
    margin: 0,
    padding: 0,
  }),
  placeholder: (base) => ({
    ...base,
    color: "#9ca3af",
    fontSize: "0.875rem",
  }),
  clearIndicator: (base) => ({
    ...base,
    color: isDark ? "#9ca3af" : "#6b7280",
    padding: "4px",
    cursor: "pointer",
    "&:hover": { color: isDark ? "#f3f4f6" : "#374151" },
  }),
  dropdownIndicator: (base) => ({
    ...base,
    color: isDark ? "#9ca3af" : "#6b7280",
    padding: "4px",
    cursor: "pointer",
    "&:hover": { color: isDark ? "#f3f4f6" : "#374151" },
  }),
  indicatorSeparator: (base) => ({
    ...base,
    backgroundColor: isDark ? "#4b5563" : "#e5e7eb",
  }),
  valueContainer: (base) => ({
    ...base,
    padding: "2px 8px",
  }),
  noOptionsMessage: (base) => ({
    ...base,
    color: isDark ? "#9ca3af" : "#6b7280",
    fontSize: "0.875rem",
  }),
});
