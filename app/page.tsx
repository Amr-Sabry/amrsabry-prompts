"use client";
import { useState, useCallback } from "react";
import { Wand2, X, Edit3, Check, RotateCcw } from "lucide-react";
import { useSession } from "next-auth/react";
import Header from "@/components/Header";
import CopyButton from "@/components/CopyButton";
import Toast from "@/components/Toast";
import { OCRResult } from "@/types/prompt";
import { createWorker } from "tesseract.js";

// ─── Design Tokens ───────────────────────────────────────────────────────────
const C = {
  bg: "#dde1ec",
  bgDeep: "#c8ccd6",
  primary: "#7c3aed",
  primaryDark: "#6d28d9",
  secondary: "#0891b2",
  text: "#1e2130",
  textSoft: "#8891a5",
  textMuted: "#5c6478",
  success: "#16a34a",
  danger: "#dc2626",
  shDark: "rgba(163,177,198,0.72)",
  shLight: "rgba(255,255,255,0.95)",
  insetDark: "rgba(163,177,198,0.6)",
  insetLight: "rgba(255,255,255,0.9)",
};

const raised = `8px 8px 20px ${C.shDark}, -8px -8px 20px ${C.shLight}`;
const inset = `inset 4px 4px 10px ${C.insetDark}, inset -4px -4px 10px ${C.insetLight}`;
const pill = "50px";

// ─── Component ────────────────────────────────────────────────────────────────
export default function ExtractPage() {
  const { data: session } = useSession();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [editingText, setEditingText] = useState(false);
  const [editedText, setEditedText] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const processImage = useCallback(async (file: File) => {
    setIsProcessing(true);
    setOcrResult(null);
    setEditingText(false);
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setImageFile(file);
    try {
      const worker = await createWorker("eng+ara");
      const { data } = await worker.recognize(url);
      await worker.terminate();
      const text = data.text.trim();
      const arabicChars = (text.match(/[\u0600-\u06FF]/g) || []).length;
      const totalChars = text.replace(/\s/g, "").length;
      const lang = totalChars > 0 && arabicChars / totalChars > 0.3 ? "ara" : "eng";
      setOcrResult({ plainText: text, language: lang, confidence: data.confidence / 100 });
      setEditedText(text);
    } catch {
      setToast({ message: "OCR failed. Try another image.", type: "error" });
    } finally {
      setIsProcessing(false);
    }
  }, [imageUrl]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (isProcessing) return;
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) processImage(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImage(file);
  };

  const handleSave = useCallback(async () => {
    if (!editedText) return;
    if (!session) { window.location.href = "/login"; return; }
    try {
      let imageData = "";
      if (imageFile) {
        imageData = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(imageFile);
        });
      }
      const saved = {
        id: crypto.randomUUID(),
        plainText: editedText,
        jsonText: JSON.stringify({ text: editedText, language: ocrResult?.language || "unknown", confidence: ocrResult?.confidence || 0, format: "plain" }, null, 2),
        imageThumbnail: imageData,
        language: ocrResult?.language || "unknown",
        confidence: ocrResult?.confidence || 0,
        createdAt: new Date().toISOString(),
        userId: session.user.id,
        userName: session.user.username,
      };
      const res = await fetch("/api/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save", prompt: saved }),
      });
      if (res.ok) {
        setToast({ message: "Saved to Library!", type: "success" });
      } else {
        const err = await res.json();
        setToast({ message: err.error || "Failed to save.", type: "error" });
      }
    } catch {
      setToast({ message: "Failed to save.", type: "error" });
    }
  }, [editedText, imageFile, ocrResult, session]);

  const handleClear = () => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageUrl(null);
    setImageFile(null);
    setOcrResult(null);
    setEditingText(false);
  };

  const handleSaveEdit = () => {
    if (ocrResult) setOcrResult({ ...ocrResult, plainText: editedText });
    setEditingText(false);
    setToast({ message: "Text updated!", type: "success" });
  };

  const handleRevert = () => {
    setEditedText(ocrResult?.plainText || "");
    setEditingText(false);
  };

  const displayText = editingText ? editedText : (ocrResult?.plainText || "");
  const jsonOutput = ocrResult ? JSON.stringify({ text: displayText, language: ocrResult.language, confidence: Math.round(ocrResult.confidence * 100) / 100, format: "plain" }, null, 2) : "";

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "Outfit, sans-serif" }}>

      {/* ── SHARED HEADER ── */}
      <Header />

      {/* ── MAIN ── */}
      <main style={{
        maxWidth: 1100, margin: "0 auto",
        padding: "36px 24px 60px",
        display: "flex", flexDirection: "column", gap: 32,
      }}>

        {/* Drop Zone */}
        <div
          onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => !isProcessing && document.getElementById("file-input")?.click()}
          style={{
            background: C.bg, borderRadius: 24,
            boxShadow: dragActive ? `${inset}, 0 0 0 2px ${C.primary}` : inset,
            cursor: isProcessing ? "not-allowed" : "pointer",
            padding: "56px 32px", display: "flex", flexDirection: "column",
            alignItems: "center", gap: 16, transition: "all 0.2s ease", userSelect: "none",
          }}
        >
          <input id="file-input" type="file" accept="image/*" onChange={handleFileInput} style={{ display: "none" }} />
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: dragActive ? `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})` : C.bg,
            boxShadow: dragActive
              ? `8px 8px 20px rgba(124,58,237,0.4), -4px -4px 10px ${C.shLight}`
              : raised,
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.2s ease",
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={dragActive ? "white" : C.primary} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 16 12 12 8 16"/>
              <line x1="12" y1="12" x2="12" y2="21"/>
              <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
            </svg>
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 4 }}>
              {dragActive ? "Drop it!" : "Drop an image or click to browse"}
            </p>
            <p style={{ fontSize: 12, color: C.textSoft, fontWeight: 500 }}>PNG, JPG, WEBP, GIF, BMP</p>
          </div>
        </div>

        {/* Image Preview */}
        {imageUrl && (
          <div style={{ background: C.bg, borderRadius: 24, boxShadow: raised, padding: 24 }}>
            <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", background: C.bgDeep }}>
              <img src={imageUrl} alt="Uploaded" style={{ width: "100%", maxHeight: 400, objectFit: "contain", display: "block", margin: "0 auto" }} />
              <div style={{ position: "absolute", top: 12, right: 12, display: "flex", gap: 8 }}>
                <button onClick={handleClear} style={{
                  width: 36, height: 36, borderRadius: 12, background: C.bg, border: "none", cursor: "pointer",
                  boxShadow: "4px 4px 10px rgba(163,177,198,0.6), -4px -4px 10px rgba(255,255,255,0.9)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <X size={14} strokeWidth={2.5} color={C.textSoft} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Processing */}
        {isProcessing && (
          <div style={{ background: C.bg, borderRadius: 20, boxShadow: inset, padding: "24px 28px", display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 22, height: 22, borderRadius: "50%", border: `2.5px solid rgba(124,58,237,0.2)`, borderTopColor: C.primary, animation: "spin 0.7s linear infinite", flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Recognizing text...</p>
              <p style={{ fontSize: 11, color: C.textSoft, marginTop: 3 }}>Powered by Tesseract.js — runs locally in your browser</p>
            </div>
          </div>
        )}

        {/* OCR Results */}
        {ocrResult && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Plain Text */}
            <div style={{ background: C.bg, borderRadius: 24, boxShadow: raised, padding: 28 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: C.textMuted }}>Plain Text</span>
                  <span style={{ display: "inline-flex", alignItems: "center", padding: "4px 12px", fontSize: 10, fontWeight: 700, borderRadius: 20, background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})`, color: "white", boxShadow: "2px 2px 6px rgba(124,58,237,0.3)" }}>{ocrResult.language.toUpperCase()}</span>
                  <span style={{ fontSize: 11, color: C.textSoft }}>{Math.round(ocrResult.confidence * 100)}% conf.</span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {editingText ? (
                    <>
                      <button onClick={handleSaveEdit} style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 14px", borderRadius: 12, border: "none", cursor: "pointer", background: C.bg, color: C.success, fontSize: 11, fontWeight: 700, fontFamily: "Outfit, sans-serif", boxShadow: raised }}>
                        <Check size={12} strokeWidth={2.5} /> Save
                      </button>
                      <button onClick={handleRevert} style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 14px", borderRadius: 12, border: "none", cursor: "pointer", background: C.bg, color: C.text, fontSize: 11, fontWeight: 700, fontFamily: "Outfit, sans-serif", boxShadow: raised }}>
                        <RotateCcw size={11} strokeWidth={2} /> Revert
                      </button>
                    </>
                  ) : (
                    <button onClick={() => { setEditingText(true); setEditedText(ocrResult.plainText); }} style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 14px", borderRadius: 12, border: "none", cursor: "pointer", background: C.bg, color: C.text, fontSize: 11, fontWeight: 700, fontFamily: "Outfit, sans-serif", boxShadow: raised }}>
                      <Edit3 size={11} strokeWidth={2} /> Edit Text
                    </button>
                  )}
                  <CopyButton onCopy={() => navigator.clipboard.writeText(displayText)} />
                </div>
              </div>

              {editingText ? (
                <textarea value={editedText} onChange={(e) => setEditedText(e.target.value)}
                  style={{ width: "100%", padding: "14px 16px", borderRadius: 16, border: "none", outline: "none", background: C.bg, color: C.text, fontSize: 13, lineHeight: 1.7, boxShadow: inset, fontFamily: "JetBrains Mono, monospace", resize: "vertical" }}
                  rows={8}
                />
              ) : (
                <div style={{ background: C.bg, borderRadius: 16, boxShadow: inset, padding: 20 }}>
                  <p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 13, color: C.text, lineHeight: 1.75, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                    {ocrResult.plainText || <span style={{ color: C.textSoft, fontStyle: "italic" }}>No text detected. Try a clearer image.</span>}
                  </p>
                </div>
              )}
            </div>

            {/* JSON */}
            <div style={{ background: C.bg, borderRadius: 24, boxShadow: raised, padding: 28 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: C.textMuted }}>JSON Format</span>
                <CopyButton onCopy={() => navigator.clipboard.writeText(jsonOutput)} />
              </div>
              <div style={{ background: C.bgDeep, borderRadius: 16, borderLeft: `3px solid ${C.secondary}`, padding: 20, fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: C.text, lineHeight: 1.7, overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-word", boxShadow: inset }}>
                <pre style={{ margin: 0 }}>{jsonOutput}</pre>
              </div>
            </div>

            {/* Save Button */}
            {displayText && (
              <button onClick={handleSave} style={{
                width: "100%", padding: 18, borderRadius: 20, border: "none", cursor: "pointer",
                background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})`, color: "white",
                fontSize: 15, fontWeight: 700, fontFamily: "Outfit, sans-serif",
                boxShadow: `5px 5px 16px rgba(124,58,237,0.35), -3px -3px 8px ${C.shLight}`,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                  <polyline points="17 21 17 13 7 13 7 21"/>
                  <polyline points="7 3 7 8 15 8"/>
                </svg>
                Save to Library
              </button>
            )}
          </div>
        )}
      </main>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
