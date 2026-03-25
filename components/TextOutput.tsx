"use client";
import CopyButton from "./CopyButton";

interface TextOutputProps {
  label: string;
  value: string;
  onCopy: () => void;
  accentColor?: string;
  language?: string;
  confidence?: number;
}

export default function TextOutput({
  label,
  value,
  onCopy,
  accentColor = "var(--primary)",
  language,
  confidence,
}: TextOutputProps) {
  return (
    <div className="space-y-3">
      {/* Label row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: "var(--text-muted)", fontFamily: "Plus Jakarta Sans, sans-serif" }}
          >
            {label}
          </span>
          {language && (
            <span
              className="text-[10px] font-extrabold px-2 py-0.5 rounded-full"
              style={{
                background: "var(--secondary-soft)",
                color: "var(--secondary)",
                fontFamily: "Plus Jakarta Sans, sans-serif",
              }}
            >
              {language.toUpperCase()}
            </span>
          )}
          {confidence !== undefined && (
            <span
              className="text-[10px] font-medium"
              style={{ color: "var(--text-soft)", fontFamily: "Plus Jakarta Sans, sans-serif" }}
            >
              {Math.round(confidence * 100)}%
            </span>
          )}
        </div>
        <CopyButton onCopy={onCopy} />
      </div>

      {/* Text box — neumorphic inset */}
      <div
        style={{
          background: "var(--bg)",
          borderRadius: "16px",
          boxShadow: "inset 4px 4px 10px var(--shadow-dark), inset -4px -4px 10px var(--shadow-light)",
          borderLeft: `3px solid ${accentColor}`,
          padding: "16px",
          minHeight: "120px",
          maxHeight: "280px",
          overflowY: "auto",
        }}
      >
        <pre
          className="whitespace-pre-wrap break-words text-sm leading-relaxed"
          style={{
            color: "var(--text)",
            fontFamily: "JetBrains Mono, monospace",
            fontSize: "13px",
          }}
        >
          {value || (
            <span style={{ color: "var(--text-soft)", fontStyle: "italic", fontFamily: "Plus Jakarta Sans, sans-serif", fontSize: "13px" }}>
              Extracted text will appear here...
            </span>
          )}
        </pre>
      </div>
    </div>
  );
}
