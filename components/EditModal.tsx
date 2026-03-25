"use client";
import { useState } from "react";
import { SavedPrompt } from "@/types/prompt";

interface EditModalProps {
  prompt: SavedPrompt;
  onClose: () => void;
  onSave: (updated: SavedPrompt) => void;
}

export default function EditModal({ prompt, onClose, onSave }: EditModalProps) {
  const [plainText, setPlainText] = useState(prompt.plainText);
  const [language, setLanguage] = useState(prompt.language);

  const jsonText = JSON.stringify({
    text: plainText,
    language,
    confidence: prompt.confidence,
    format: "plain",
  }, null, 2);

  const handleSave = () => {
    onSave({ ...prompt, plainText, language, jsonText });
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>Edit Prompt</h2>
          <button onClick={onClose} className="neu-btn" style={{ width: 36, height: 36, padding: 0, borderRadius: 10 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Language */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Language</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="neu-input"
            style={{ padding: "10px 14px" }}
          >
            <option value="eng">English</option>
            <option value="ara">Arabic (العربية)</option>
            <option value="mixed">Mixed</option>
          </select>
        </div>

        {/* Plain Text */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Plain Text</label>
          <textarea
            value={plainText}
            onChange={(e) => setPlainText(e.target.value)}
            className="neu-input"
            rows={8}
            style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 13, lineHeight: 1.7 }}
          />
        </div>

        {/* JSON Preview */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>JSON Preview</label>
          <div style={{
            background: "var(--mono-bg)",
            borderRadius: 14,
            borderLeft: "3px solid var(--secondary)",
            padding: 16,
            fontFamily: "JetBrains Mono, monospace",
            fontSize: 12,
            color: "var(--text)",
            lineHeight: 1.7,
            overflowX: "auto",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            boxShadow: "inset 3px 3px 8px rgba(163,177,198,0.5), inset -3px -3px 8px rgba(255,255,255,0.65)",
          }}>
            <pre style={{ margin: 0 }}>{jsonText}</pre>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} className="neu-btn">Cancel</button>
          <button onClick={handleSave} className="neu-btn neu-btn-primary">Save Changes</button>
        </div>
      </div>
    </div>
  );
}
