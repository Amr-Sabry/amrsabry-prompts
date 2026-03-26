"use client";
import { useState, useRef } from "react";
import { SavedPrompt } from "@/types/prompt";
import { ImagePlus, RefreshCw } from "lucide-react";

interface EditModalProps {
  prompt: SavedPrompt;
  onClose: () => void;
  onSave: (updated: SavedPrompt) => void;
}

export default function EditModal({ prompt, onClose, onSave }: EditModalProps) {
  const [plainText, setPlainText] = useState(prompt.plainText);
  const [language, setLanguage] = useState(prompt.language);
  const [imageThumbnail, setImageThumbnail] = useState(prompt.imageThumbnail);
  const [isUploading, setIsUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const jsonText = JSON.stringify({
    text: plainText,
    language,
    confidence: prompt.confidence,
    format: "plain",
  }, null, 2);

  // Convert uploaded file → base64 data URL
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImageThumbnail(ev.target?.result as string);
      setIsUploading(false);
    };
    reader.onerror = () => setIsUploading(false);
    reader.readAsDataURL(file);
  };

  // Remove custom image → revert to original
  const handleRemoveImage = () => {
    setImageThumbnail(prompt.imageThumbnail);
  };

  const hasImageChanged = imageThumbnail !== prompt.imageThumbnail;

  const handleSave = () => {
    // Only include imageThumbnail if it actually changed, to avoid wiping the field
    const updated = { ...prompt, plainText, language, jsonText };
    if (imageThumbnail !== prompt.imageThumbnail) {
      updated.imageThumbnail = imageThumbnail;
    }
    onSave(updated as SavedPrompt);
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>Edit Prompt</h2>
          <button onClick={onClose} className="neu-btn"
            style={{ width: 36, height: 36, padding: 0, borderRadius: 10 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* ── IMAGE SECTION ── */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--text-muted)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Cover Image
          </label>

          {/* Image preview */}
          <div style={{
            borderRadius: 16,
            overflow: "hidden",
            background: "var(--bg-deep)",
            boxShadow: "inset 4px 4px 10px var(--sh-inset-dark), inset -4px -4px 10px var(--sh-inset-light)",
            position: "relative",
            aspectRatio: "16/7",
            marginBottom: 10,
          }}>
            {imageThumbnail ? (
              <img
                src={imageThumbnail}
                alt="Cover preview"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            ) : (
              <div style={{
                width: "100%", height: "100%",
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "linear-gradient(135deg, var(--primary-dark), var(--primary))",
              }}>
                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>No image</span>
              </div>
            )}

            {/* Upload overlay button */}
            <button
              onClick={() => fileRef.current?.click()}
              style={{
                position: "absolute", bottom: 10, right: 10,
                display: "flex", alignItems: "center", gap: 6,
                padding: "7px 14px", borderRadius: 20,
                border: "none", cursor: "pointer",
                background: "rgba(0,0,0,0.55)",
                backdropFilter: "blur(12px)",
                color: "white",
                fontSize: 11, fontWeight: 700,
                fontFamily: "Outfit, sans-serif",
                boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.background = "rgba(124,58,237,0.85)"; }}
              onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.background = "rgba(0,0,0,0.55)"; }}
            >
              {isUploading ? (
                <><RefreshCw size={12} style={{ animation: "spin 0.8s linear infinite" }} /> Uploading...</>
              ) : (
                <><ImagePlus size={12} /> {imageThumbnail ? "Change" : "Upload"}</>
              )}
            </button>
          </div>

          {/* Reset button (only if image changed) */}
          {hasImageChanged && (
            <button
              onClick={handleRemoveImage}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "5px 12px", borderRadius: 10,
                border: "none", cursor: "pointer",
                background: "var(--bg)",
                color: "var(--text-muted)",
                fontSize: 10, fontWeight: 600,
                fontFamily: "Outfit, sans-serif",
                boxShadow: "3px 3px 8px var(--sh-dark), -3px -3px 8px var(--sh-light)",
                margin: "0 auto",
              }}>
              <RefreshCw size={10} /> Reset to original
            </button>
          )}

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            style={{ display: "none" }}
          />
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
            rows={7}
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

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
