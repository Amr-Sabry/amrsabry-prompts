"use client";
import { useState, useCallback } from "react";
import { Wand2, X, Edit3, Check, RotateCcw } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import TabNav from "@/components/TabNav";
import CopyButton from "@/components/CopyButton";
import Toast from "@/components/Toast";
import { OCRResult, SavedPrompt } from "@/types/prompt";
import { createWorker } from "tesseract.js";

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

  const cardShadow = "10px 10px 24px var(--sh-dark), -10px -10px 24px var(--sh-light)";
  const insetShadow = "inset 4px 4px 10px var(--sh-dark), inset -4px -4px 10px var(--sh-light)";

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)", fontFamily: "Outfit, sans-serif" }}>

      {/* ===== STICKY HEADER ===== */}
      <header style={{ position: "sticky", top: 0, zIndex: 40, background: "rgba(221,225,236,0.9)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(163,177,198,0.3)" }}>
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div style={{ width: 42, height: 42, borderRadius: 12, background: "linear-gradient(135deg, var(--primary), var(--primary-dark))", boxShadow: "5px 5px 14px rgba(124,58,237,0.3), -3px -3px 8px rgba(255,255,255,0.8)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Wand2 size={18} color="white" strokeWidth={1.8} />
            </div>
            <div>
              <h1 style={{ fontSize: 17, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.3px" }}>AmrSabry-prompts</h1>
              <p style={{ fontSize: 10, color: "var(--text-soft)", fontWeight: 500, letterSpacing: "0.02em" }}>Extract • Edit • Save</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {session ? (
                    <>
                      <span style={{ fontSize: 11, color: "var(--text-soft)" }}>@{session.user.username}</span>
                      <button onClick={() => signOut({ callbackUrl: "/login" })} className="neu-btn neu-btn-sm" style={{ fontSize: 10, padding: "5px 10px" }}>Logout</button>
                    </>
                  ) : (
                    <a href="/login" className="neu-btn neu-btn-sm" style={{ fontSize: 10, padding: "5px 10px", textDecoration: "none" }}>Login</a>
                  )}
                  <TabNav />
                </div>
        </div>
      </header>

      {/* ===== MAIN ===== */}
      <main className="max-w-5xl mx-auto px-6 py-12 flex flex-col gap-8">

        {/* Drop Zone */}
        <div
          onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => !isProcessing && document.getElementById("file-input")?.click()}
          style={{
            background: "var(--bg)",
            borderRadius: 28,
            boxShadow: dragActive
              ? "inset 6px 6px 16px var(--sh-dark), inset -6px -6px 16px var(--sh-light), 0 0 0 2px var(--primary)"
              : "inset 5px 5px 14px var(--sh-dark), inset -5px -5px 14px var(--sh-light)",
            cursor: isProcessing ? "not-allowed" : "pointer",
            padding: "56px 32px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
            transition: "all 0.2s ease",
            userSelect: "none",
          }}
        >
          <input id="file-input" type="file" accept="image/*" className="hidden" onChange={handleFileInput} />
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: dragActive ? "linear-gradient(135deg, var(--primary), var(--primary-dark))" : "var(--bg)",
            boxShadow: dragActive
              ? "8px 8px 20px rgba(124,58,237,0.4), -4px -4px 10px var(--sh-light)"
              : "8px 8px 18px var(--sh-dark), -8px -8px 18px var(--sh-light)",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.2s ease",
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={dragActive ? "white" : "var(--primary)"} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 16 12 12 8 16"/>
              <line x1="12" y1="12" x2="12" y2="21"/>
              <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
            </svg>
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>
              {dragActive ? "Drop it!" : "Drop an image or click to browse"}
            </p>
            <p style={{ fontSize: 12, color: "var(--text-soft)", fontWeight: 500 }}>PNG, JPG, WEBP, GIF, BMP</p>
          </div>
        </div>

        {/* Image Preview */}
        {imageUrl && (
          <div style={{ background: "var(--bg)", borderRadius: 28, boxShadow: cardShadow, padding: 24 }}>
            <div style={{ position: "relative", borderRadius: 18, overflow: "hidden", background: "var(--bg-deep)" }}>
              <img src={imageUrl} alt="Uploaded" style={{ width: "100%", maxHeight: 400, objectFit: "contain", display: "block", margin: "0 auto" }} />
              <div style={{ position: "absolute", top: 12, right: 12, display: "flex", gap: 8 }}>
                <button onClick={handleClear} style={{ width: 36, height: 36, borderRadius: 10, background: "var(--bg)", border: "none", cursor: "pointer", boxShadow: "4px 4px 10px var(--sh-dark), -4px -4px 10px var(--sh-light)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <X size={14} strokeWidth={2.5} color="var(--text-muted)" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Processing */}
        {isProcessing && (
          <div style={{ background: "var(--bg)", borderRadius: 20, boxShadow: insetShadow, padding: "24px 28px", display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 22, height: 22, borderRadius: "50%", border: "2.5px solid rgba(124,58,237,0.2)", borderTopColor: "var(--primary)", animation: "spin 0.7s linear infinite", flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>Recognizing text...</p>
              <p style={{ fontSize: 11, color: "var(--text-soft)", marginTop: 3 }}>Powered by Tesseract.js — runs locally in your browser</p>
            </div>
          </div>
        )}

        {/* OCR Results */}
        {ocrResult && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Plain Text */}
            <div style={{ background: "var(--bg)", borderRadius: 28, boxShadow: cardShadow, padding: 28 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>Plain Text</span>
                  <span style={{ display: "inline-flex", alignItems: "center", padding: "4px 12px", fontSize: 10, fontWeight: 700, borderRadius: 20, background: "linear-gradient(135deg, var(--primary), var(--primary-dark))", color: "white", boxShadow: "2px 2px 6px rgba(124,58,237,0.3)" }}>{ocrResult.language.toUpperCase()}</span>
                  <span style={{ fontSize: 11, color: "var(--text-soft)" }}>{Math.round(ocrResult.confidence * 100)}% conf.</span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {editingText ? (
                    <>
                      <button onClick={handleSaveEdit} className="neu-btn neu-btn-sm" style={{ color: "var(--success)", gap: 5 }}>
                        <Check size={12} strokeWidth={2.5} /> Save
                      </button>
                      <button onClick={handleRevert} className="neu-btn neu-btn-sm" style={{ gap: 5 }}>
                        <RotateCcw size={11} strokeWidth={2} /> Revert
                      </button>
                    </>
                  ) : (
                    <button onClick={() => { setEditingText(true); setEditedText(ocrResult.plainText); }} className="neu-btn neu-btn-sm" style={{ gap: 5 }}>
                      <Edit3 size={11} strokeWidth={2} /> Edit Text
                    </button>
                  )}
                  <CopyButton onCopy={() => navigator.clipboard.writeText(displayText)} />
                </div>
              </div>

              {editingText ? (
                <textarea value={editedText} onChange={(e) => setEditedText(e.target.value)} className="neu-input" rows={8} style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 13, lineHeight: 1.7 }} />
              ) : (
                <div style={{ background: "var(--bg)", borderRadius: 16, boxShadow: insetShadow, padding: 20 }}>
                  <p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 13, color: "var(--text)", lineHeight: 1.75, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                    {ocrResult.plainText || <span style={{ color: "var(--text-soft)", fontStyle: "italic" }}>No text detected. Try a clearer image.</span>}
                  </p>
                </div>
              )}
            </div>

            {/* JSON */}
            <div style={{ background: "var(--bg)", borderRadius: 28, boxShadow: cardShadow, padding: 28 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>JSON Format</span>
                <CopyButton onCopy={() => navigator.clipboard.writeText(jsonOutput)} />
              </div>
              <div style={{ background: "var(--mono-bg)", borderRadius: 16, borderLeft: "3px solid var(--secondary)", padding: 20, fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "var(--text)", lineHeight: 1.7, overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-word", boxShadow: "inset 3px 3px 8px rgba(163,177,198,0.5), inset -3px -3px 8px rgba(255,255,255,0.65)" }}>
                <pre style={{ margin: 0 }}>{jsonOutput}</pre>
              </div>
            </div>

            {/* Save Button */}
            {displayText && (
              <button onClick={handleSave} className="neu-btn neu-btn-primary" style={{ width: "100%", justifyContent: "center", padding: 18, fontSize: 15, borderRadius: 20, gap: 10 }}>
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
