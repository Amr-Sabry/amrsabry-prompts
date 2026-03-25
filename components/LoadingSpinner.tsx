"use client";

interface LoadingSpinnerProps {
  size?: "sm" | "md";
  color?: string;
  label?: string;
}

export default function LoadingSpinner({ size = "md", color, label }: LoadingSpinnerProps) {
  const dim = size === "sm" ? 28 : 48;
  const border = size === "sm" ? "2.5px" : "3px";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <div style={{
        width: dim, height: dim,
        borderRadius: "50%",
        border: `${border} solid rgba(163,177,198,0.4)`,
        borderTopColor: color || "#7c3aed",
        animation: "spin 0.8s linear infinite",
        boxShadow: "5px 5px 12px rgba(163,177,198,0.5), -5px -5px 12px rgba(255,255,255,0.9)",
        flexShrink: 0,
      }} />
      {label && (
        <p style={{ fontSize: 13, color: "#8891a5", fontFamily: "Outfit, sans-serif" }}>{label}</p>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
