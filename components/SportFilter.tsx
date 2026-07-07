import React from "react";

export type SportOption = "all" | "baseball" | "softball";

interface Props {
  value: SportOption;
  onChange: (value: SportOption) => void;
}

const OPTIONS: { value: SportOption; label: string }[] = [
  { value: "all", label: "⚾🥎 Alle" },
  { value: "baseball", label: "⚾ Baseball" },
  { value: "softball", label: "🥎 Softball" },
];

export default function SportFilter({ value, onChange }: Props) {
  return (
    <div style={{
      display: "flex",
      gap: "8px",
      padding: "0 16px 12px",
      backgroundColor: "#0f172a",
    }}>
      {OPTIONS.map((opt) => {
        const isActive = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              flexShrink: 0,
              padding: "6px 12px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: isActive ? 700 : 500,
              backgroundColor: isActive ? "#3b82f6" : "#1e293b",
              color: isActive ? "#ffffff" : "#94a3b8",
              transition: "background-color 0.15s, color 0.15s",
              whiteSpace: "nowrap",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
