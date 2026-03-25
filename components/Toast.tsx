"use client";
import { useEffect } from "react";

export default function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error" | "info";
  onClose: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  const colors = {
    success: { bg: "#059669", shadow: "rgba(5,150,105,0.3)" },
    error:   { bg: "#dc2626", shadow: "rgba(220,38,38,0.3)"  },
    info:    { bg: "var(--primary)", shadow: "var(--primary-glow)" },
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: "28px",
        right: "28px",
        zIndex: 9999,
        padding: "14px 22px",
        borderRadius: "16px",
        background: colors[type].bg,
        color: "#fff",
        fontFamily: "Plus Jakarta Sans, sans-serif",
        fontSize: "13px",
        fontWeight: 600,
        boxShadow: `6px 6px 14px ${colors[type].shadow}, -3px -3px 8px rgba(255,255,255,0.5)`,
        display: "flex",
        alignItems: "center",
        gap: "10px",
        animation: "slideUp 0.3s ease",
      }}
    >
      {type === "success" && (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
      {type === "error" && (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      )}
      {type === "info" && (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      )}
      {message}
    </div>
  );
}
