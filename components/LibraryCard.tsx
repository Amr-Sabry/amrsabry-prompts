"use client";
import { useState } from "react";
import { Search, ImageOff } from "lucide-react";

interface LibraryCardProps {
  prompt: {
    id: string;
    plainText: string;
    jsonText: string;
    imageThumbnail: string;
    language: string;
    confidence: number;
    createdAt: string;
  };
  onCopyPlain: () => void;
  onCopyJson: () => void;
  onDelete: () => void;
}

export default function LibraryCard({
  prompt,
  onCopyPlain,
  onCopyJson,
  onDelete,
}: LibraryCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState<"plain" | "json" | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleCopy = (type: "plain" | "json") => {
    if (type === "plain") onCopyPlain();
    else onCopyJson();
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div
      style={{
        background: "var(--bg)",
        borderRadius: "24px",
        boxShadow: "8px 8px 18px var(--shadow-dark), -8px -8px 18px var(--shadow-light)",
        overflow: "hidden",
        transition: "all 0.2s ease",
      }}
    >
      {/* Image */}
      {prompt.imageThumbnail && (
        <div
          style={{
            background: "#d8dde8",
            padding: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img
            src={prompt.imageThumbnail}
            alt="Prompt source"
            style={{
              maxWidth: "100%",
              maxHeight: "200px",
              objectFit: "contain",
              borderRadius: "14px",
            }}
          />
        </div>
      )}

      {/* Content */}
      <div style={{ padding: "16px 18px 18px" }}>
        {/* Preview */}
        <div
          onClick={() => setExpanded(!expanded)}
          style={{
            cursor: "pointer",
            marginBottom: "12px",
          }}
        >
          <p
            style={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: "12px",
              color: "var(--text)",
              lineHeight: "1.6",
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: expanded ? "none" : 3,
              WebkitBoxOrient: "vertical" as const,
              opacity: 0.85,
            }}
          >
            {prompt.plainText}
          </p>
        </div>

        {/* Meta row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "8px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                fontSize: "10px",
                fontWeight: 800,
                padding: "3px 10px",
                borderRadius: "20px",
                background: "var(--primary-soft)",
                color: "var(--primary)",
                fontFamily: "Plus Jakarta Sans, sans-serif",
              }}
            >
              {prompt.language.toUpperCase()}
            </span>
            <span
              style={{
                fontSize: "10px",
                color: "var(--text-soft)",
                fontFamily: "Plus Jakarta Sans, sans-serif",
              }}
            >
              {Math.round(prompt.confidence * 100)}%
            </span>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: "6px" }}>
            <button
              onClick={() => handleCopy("plain")}
              className="neu-btn neu-btn-sm"
              style={{ padding: "6px 12px", gap: "5px" }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-muted)" }}>
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
              </svg>
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                {copied === "plain" ? "✓" : "Plain"}
              </span>
            </button>

            <button
              onClick={() => handleCopy("json")}
              className="neu-btn neu-btn-sm"
              style={{ padding: "6px 12px", gap: "5px" }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-muted)" }}>
                <path d="M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4" />
                <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                <path d="m5 12-3 3 3 3" /><path d="m9 18 3-3-3-3" />
              </svg>
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                {copied === "json" ? "✓" : "JSON"}
              </span>
            </button>

            <button
              onClick={() => {
                if (confirmDelete) {
                  onDelete();
                  setConfirmDelete(false);
                } else {
                  setConfirmDelete(true);
                  setTimeout(() => setConfirmDelete(false), 3000);
                }
              }}
              className="neu-btn neu-btn-sm"
              style={{
                padding: "6px 10px",
                background: confirmDelete ? "var(--danger)" : "var(--bg)",
                color: confirmDelete ? "#fff" : "var(--danger)",
              }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
