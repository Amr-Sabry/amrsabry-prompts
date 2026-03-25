"use client";
import { useState, useCallback } from "react";
import { Wand2, X, Edit3, Check, RotateCcw } from "lucide-react";
import TabNav from "@/components/TabNav";
import DropZone from "@/components/DropZone";
import CopyButton from "@/components/CopyButton";
import Toast from "@/components/Toast";
import { OCRResult, SavedPrompt } from "@/types/prompt";
import { createWorker } from "tesseract.js";

const STORAGE_KEY = "amrsabry_prompts_library";

export default function ExtractPage() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [editingText, setEditingText] = useState(false);
  const [editedText, setEditedText] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const processImage = useCallback(async (file: File) => {
    setIsProcessing(true);
    setOcrResult(null);
    setEditingText(false);

    if (imageUrl) URL.revokeObjectURL(imageUrl);
    const url = URL.createObjectURL(file);
    setImageUrl(url);

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

  const handleSave = useCallback(async () => {
    if (!editedText) return;
    try {
      let thumbnail = "";
      if (imageUrl) {
        const img = new window.Image();
        await new Promise<void>((resolve, reject) => { img.onload = () => resolve(); img.onerror = reject; img.src = imageUrl; });
        const maxW = 800;
        const ratio = img.width > maxW ? maxW / img.width : 1;
        const canvas = document.createElement("canvas");
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        thumbnail = canvas.toDataURL("image/jpeg", 0.95);
      }

      const saved: SavedPrompt = {
        id: crypto.randomUUID(),
        plainText: editedText,
        jsonText: JSON.stringify({
          text: editedText,
          language: ocrResult?.language || "unknown",
          confidence: ocrResult?.confidence || 0,
          format: "plain",
        }, null, 2),
        imageThumbnail: thumbnail,
        language: ocrResult?.language || "unknown",
        confidence: ocrResult?.confidence || 0,
        createdAt: new Date().toISOString(),
      };

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      localStorage.setItem(STORAGE_KEY, JSON.stringify([saved, ...stored]));
      setToast({ message: "Saved to Library!", type: "success" });
    } catch {
      setToast({ message: "Failed to save.", type: "error" });
    }
  }, [editedText, imageUrl, ocrResult]);

  const handleClear = () => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageUrl(null);
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

  const handleImageEdit = () => {
    if (!imageUrl) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) processImage(file);
    };
    input.click();
  };

  const displayText = editingText ? editedText : (ocrResult?.plainText || "");
  const jsonOutput = ocrResult
    ? JSON.stringify({
        text: displayText,
        language: ocrResult.language,
        confidence: Math.round(ocrResult.confidence * 100) / 100,
        format: "plain",
      }, null, 2)
    : "";

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)", fontFamily: "Outfit, sans-serif" }}>

      {/* ===== STICKY HEADER ===== */}
      <header style={{
        position: "sticky", top: 0, zIndex: 40,
        background: "rgba(221,225,236,0.88)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(163,177,198,0.35)",
      }}>
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div style={{
              width: "42px", height: "42px", borderRadius: "12px",
              background: "linear-gradient(135deg, var(--primary), var(--primary-dark))",
              boxShadow: "5px 5px 14px rgba(124,58,237,0.3), -3px -3px 8px rgba(255,255,255,0.8)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Wand2 size={18} color="white" strokeWidth={1.8} />
            </div>
            <div>
              <h1 style={{ fontSize: "17px", fontWeight: 800, color: "var(--text)", letterSpacing: "-0.3px" }}>
                AmrSabry-prompts
              </h1>
              <p style={{ fontSize: "10px", color: "var(--text-soft)", fontWeight: 500, letterSpacing: "0.02em" }}>
                Extract â€¢ Edit â€¢ Save
              </p>
            </div>
          </div>
          <TabNav />
        </div>
      </header>

      {/* ===== MAIN ===== */}
      <main className="max-w-3xl mx-auto px-6 py-10 flex flex-col items-center gap-8">

        {/* Drop Zone */}
        <div className="w-full">
          <DropZone onFile={processImage} disabled={isProcessing} />
        </div>

        {/* Image Preview */}
        {imageUrl && (
          <div style={{
            width: "100%",
            background: "var(--bg)",
            borderRadius: "24px",
            boxShadow: "10px 10px 22px var(--sh-dark), -10px -10px 22px var(--sh-light)",
            padding: "20px",
          }}>
            <div style={{ position: "relative", borderRadius: "16px", overflow: "hidden", background: "var(--bg-deep)" }}>
              <img
                src={imageUrl}
                alt="Uploaded"
                style={{ width: "100%", maxHeight: "300px", objectFit: "contain", display: "block", padding: "12px" }}
              />
              <div style={{
                position: "absolute", bottom: "10px", left: "10px", right: "10px",
                display: "flex", gap: "6px", justifyContent: "flex-end",
              }}>
                <button onClick={handleImageEdit} className="neu-btn neu-btn-sm" style={{ gap: "4px" }}>
                  <Edit3 size={10} strokeWidth={2} /> Edit Image
                </button>
                <button
                  onClick={handleClear}
                  style={{
                    width: "32px", height: "32px", borderRadius: "9px",
                    background: "var(--bg)", border: "none", cursor: "pointer",
                    boxShadow: "3px 3px 8px var(--sh-dark), -3px -3px 8px var(--sh-light)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "var(--text-muted)",
                  }}
                >
                  <X size={12} strokeWidth={2} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Processing State */}
        {isProcessing && (
          <div style={{
            width: "100%",
            background: "var(--bg)",
            borderRadius: "18px",
            boxShadow: "inset 5px 5px 12px var(--sh-dark), inset -5px -5px 12px var(--sh-light)",
            display: "flex", alignItems: "center", gap: "14px", padding: "20px 24px",
          }}>
            <div style={{
              width: "20px", height: "20px", borderRadius: "50%",
              border: "2.5px solid rgba(124,58,237,0.2)", borderTopColor: "var(--primary)",
              animation: "spin 0.7s linear infinite", flexShrink: 0,
            }} />
            <div>
              <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)" }}>Recognizing text...</p>
              <p style={{ fontSize: "11px", color: "var(--text-soft)", marginTop: "2px" }}>Powered by Tesseract.js â€” runs locally in your browser</p>
            </div>
          </div>
        )}

        {/* OCR Results */}
        {ocrResult && (
          <div className="w-full flex flex-col gap-5">

            {/* Plain Text Card */}
            <div style={{
              background: "var(--bg)",
              borderRadius: "24px",
              boxShadow: "10px 10px 22px var(--sh-dark), -10px -10px 22px var(--sh-light)",
              padding: "24px",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>
                    Plain Text
                  </span>
                  <span className="neu-badge">{ocrResult.language.toUpperCase()}</span>
                  <span style={{ fontSize: "11px", color: "var(--text-soft)", fontWeight: 500 }}>
                    {Math.round(ocrResult.confidence * 100)}% conf.
                  </span>
                </div>
                <div style={{ display: "flex", gap: "6px" }}>
                  {editingText ? (
                    <>
                      <button onClick={handleSaveEdit} className="neu-btn neu-btn-sm" style={{ color: "var(--success)", gap: "4px" }}>
                        <Check size={11} strokeWidth={2.5} /> Save
                      </button>
                      <button onClick={handleRevert} className="neu-btn neu-btn-sm" style={{ gap: "4px" }}>
                        <RotateCcw size={10} strokeWidth={2} /> Revert
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => { setEditingText(true); setEditedText(ocrResult.plainText); }}
                      className="neu-btn neu-btn-sm"
                      style={{ gap: "4px" }}
                    >
                      <Edit3 size={10} strokeWidth={2} /> Edit Text
                    </button>
                  )}
                  <CopyButton onCopy={() => navigator.clipboard.writeText(displayText)} />
                </div>
              </div>

              {editingText ? (
                <textarea
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  className="neu-input"
                  rows={8}
                  style={{ width: "100%", minHeight: "140px", fontFamily: "JetBrains Mono, monospace", fontSize: "13px", lineHeight: "1.65" }}
                />
              ) : (
                <div style={{
                  background: "var(--bg)",
                  borderRadius: "14px",
                  boxShadow: "inset 4px 4px 10px var(--sh-dark), inset -4px -4px 10px var(--sh-light)",
                  padding: "16px", minHeight: "80px",
                }}>
                  <p style={{
                    fontFamily: "JetBrains Mono, monospace", fontSize: "13px", color: "var(--text)",
                    lineHeight: "1.7", whiteSpace: "pre-wrap", wordBreak: "break-word",
                  }}>
                    {ocrResult.plainText || (
                      <span style={{ color: "var(--text-soft)", fontStyle: "italic", fontFamily: "Outfit, sans-serif" }}>
                        No text detected. Try a clearer image.
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* JSON Card */}
            <div style={{
              background: "var(--bg)",
              borderRadius: "24px",
              boxShadow: "10px 10px 22px var(--sh-dark), -10px -10px 22px var(--sh-light)",
              padding: "24px",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>
                  JSON Format
                </span>
                <CopyButton onCopy={() => navigator.clipboard.writeText(jsonOutput)} />
              </div>
              <div style={{
                background: "var(--mono-bg)",
                borderRadius: "14px", borderLeft: "3px solid var(--secondary)",
                padding: "16px", fontFamily: "JetBrains Mono, monospace", fontSize: "12px",
                color: "var(--text)", lineHeight: "1.65", overflowX: "auto",
                whiteSpace: "pre-wrap", wordBreak: "break-word",
                boxShadow: "inset 3px 3px 8px rgba(163,177,198,0.5), inset -3px -3px 8px rgba(255,255,255,0.65)",
              }}>
                <pre style={{ margin: 0 }}>{jsonOutput}</pre>
              </div>
            </div>

            {/* Save Button */}
            {displayText && (
              <button
                onClick={handleSave}
                className="neu-btn neu-btn-primary"
                style={{ width: "100%", justifyContent: "center", padding: "16px", fontSize: "15px", borderRadius: "18px" }}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
