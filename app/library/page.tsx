"use client";
import { useState, useEffect, useRef } from "react";
import { Library, Search, X, Edit3, Copy, Check, Wand2 } from "lucide-react";
import TabNav from "@/components/TabNav";
import Toast from "@/components/Toast";
import { SavedPrompt } from "@/types/prompt";

const STORAGE_KEY = "amrsabry_prompts_library";

export default function LibraryPage() {
  const [library, setLibrary] = useState<SavedPrompt[]>([]);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePrompt, setActivePrompt] = useState<SavedPrompt | null>(null);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      setLibrary(stored);
    } catch {
      setLibrary([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
  };

  const handleDelete = (id: string) => {
    const updated = library.filter((p) => p.id !== id);
    setLibrary(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    showToast("Prompt deleted.", "info");
    if (activePrompt?.id === id) setActivePrompt(null);
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      showToast(`${label} copied!`, "success");
    });
  };

  // Live search filtering
  const filtered = search.trim()
    ? library.filter(
        (p) =>
          p.plainText.toLowerCase().includes(search.toLowerCase()) ||
          p.language.toLowerCase().includes(search.toLowerCase())
      )
    : library;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)", fontFamily: "Outfit, sans-serif" }}>

      {/* ===== HEADER ===== */}
      <header style={{
        position: "sticky", top: 0, zIndex: 40,
        background: "rgba(221,225,236,0.88)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(163,177,198,0.35)",
      }}>
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div style={{
              width: "42px", height: "42px", borderRadius: "12px",
              background: "linear-gradient(135deg, var(--primary), var(--primary-dark))",
              boxShadow: "5px 5px 14px rgba(124,58,237,0.3), -3px -3px 8px rgba(255,255,255,0.8)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Library size={18} color="white" strokeWidth={1.8} />
            </div>
            <div>
              <h1 style={{ fontSize: "17px", fontWeight: 800, color: "var(--text)", letterSpacing: "-0.3px" }}>
                AmrSabry-prompts
              </h1>
              <p style={{ fontSize: "10px", color: "var(--text-soft)", fontWeight: 500, letterSpacing: "0.02em" }}>
                Extract • Edit • Save
              </p>
            </div>
          </div>
          <TabNav />
        </div>
      </header>

      {/* ===== MAIN ===== */}
      <main className="max-w-5xl mx-auto px-6 py-10">

        {/* Title Row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "14px", marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Library size={22} color="var(--primary)" strokeWidth={1.5} />
            <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--text)" }}>Library</h2>
            {!loading && (
              <span className="neu-badge" style={{ fontSize: "10px" }}>{library.length}</span>
            )}
          </div>

          {/* Search */}
          {!loading && library.length > 0 && (
            <div style={{ position: "relative" }}>
              <Search size={13} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-soft)", pointerEvents: "none" }} />
              <input
                type="text"
                placeholder="Search prompts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="neu-input"
                style={{
                  paddingLeft: "34px",
                  paddingRight: search ? "34px" : "14px",
                  minWidth: "240px",
                  height: "40px",
                  fontSize: "13px",
                }}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  style={{
                    position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer",
                    color: "var(--text-soft)", fontSize: "10px", lineHeight: 1,
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
            <div style={{
              width: "34px", height: "34px", borderRadius: "50%",
              border: "3px solid rgba(163,177,198,0.35)", borderTopColor: "var(--primary)",
              animation: "spin 0.7s linear infinite",
            }} />
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "100px 20px", gap: "18px", textAlign: "center" }}>
            <div className="neu-raised" style={{ width: "80px", height: "80px", borderRadius: "22px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {search ? (
                <Search size={32} color="var(--text-soft)" strokeWidth={1.3} />
              ) : (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-soft)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18M9 21V9"/>
                </svg>
              )}
            </div>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)", marginBottom: "6px" }}>
                {search ? "No results found" : "Your library is empty"}
              </h3>
              <p style={{ fontSize: "12px", color: "var(--text-soft)", maxWidth: "260px", lineHeight: "1.6" }}>
                {search ? `Nothing matches "${search}".` : "Upload an image on the Extract page to get started."}
              </p>
            </div>
          </div>
        )}

        {/* ===== MASONRY BENTO GRID ===== */}
        {!loading && filtered.length > 0 && (
          <div style={{
            columns: "280px",
            columnGap: "18px",
          }}>
            {filtered.map((prompt) => (
              <div
                key={prompt.id}
                className="neu-raised-sm"
                style={{
                  breakInside: "avoid",
                  marginBottom: "18px",
                  overflow: "hidden",
                  cursor: "pointer",
                  transition: "transform 0.15s ease",
                  padding: "0",
                }}
                onClick={() => setActivePrompt(prompt)}
              >
                {/* Image — original ratio, no crop */}
                {prompt.imageThumbnail && (
                  <div style={{
                    background: "var(--bg-deep)",
                    display: "block",
                    padding: "0",
                  }}>
                    <img
                      src={prompt.imageThumbnail}
                      alt="Prompt source"
                      style={{
                        width: "100%",
                        height: "auto",
                        display: "block",
                        borderRadius: "0",
                      }}
                      onLoad={(e) => {
                        const img = e.currentTarget;
                        if (img.parentElement) {
                          img.parentElement.style.padding = "0";
                        }
                      }}
                    />
                  </div>
                )}

                {/* Card Body */}
                <div style={{ padding: "14px 16px 16px" }}>
                  {/* Text preview */}
                  <p style={{
                    fontFamily: "JetBrains Mono, monospace",
                    fontSize: "11px",
                    color: "var(--text)",
                    lineHeight: "1.65",
                    marginBottom: "14px",
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical" as const,
                    overflow: "hidden",
                    opacity: 0.78,
                  }}>
                    {prompt.plainText}
                  </p>

                  {/* Meta row */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span className="neu-badge" style={{ fontSize: "9px", padding: "3px 8px" }}>
                        {prompt.language.toUpperCase()}
                      </span>
                      <span style={{ fontSize: "10px", color: "var(--text-soft)" }}>
                        {Math.round(prompt.confidence * 100)}%
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: "5px" }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCopy(prompt.plainText, "Text"); }}
                        className="neu-btn neu-btn-sm"
                        style={{ padding: "5px 9px", fontSize: "10px", gap: "3px" }}
                        title="Copy text"
                      >
                        <Copy size={10} strokeWidth={2} /> Plain
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCopy(prompt.jsonText, "JSON"); }}
                        className="neu-btn neu-btn-sm"
                        style={{ padding: "5px 9px", fontSize: "10px", gap: "3px" }}
                        title="Copy JSON"
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1"/><path d="M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1"/></svg>
                        JSON
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(prompt.id); }}
                        className="neu-btn neu-btn-sm"
                        style={{ padding: "5px 7px", color: "var(--danger)" }}
                        title="Delete"
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Result count */}
        {!loading && search && (
          <p style={{ fontSize: "11px", color: "var(--text-soft)", marginTop: "12px", textAlign: "center" }}>
            {filtered.length} result{filtered.length !== 1 ? "s" : ""} for &ldquo;{search}&rdquo;
          </p>
        )}
      </main>

      {/* ===== EDIT MODAL ===== */}
      {activePrompt && (
        <EditModal
          prompt={activePrompt}
          onClose={() => setActivePrompt(null)}
          onSave={(updated) => {
            const idx = library.findIndex((p) => p.id === updated.id);
            if (idx !== -1) {
              const next = [...library];
              next[idx] = updated;
              setLibrary(next);
              localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
              showToast("Saved!", "success");
            }
            setActivePrompt(null);
          }}
          onCopy={handleCopy}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

/* ===== EDIT MODAL COMPONENT ===== */
interface EditModalProps {
  prompt: SavedPrompt;
  onClose: () => void;
  onSave: (p: SavedPrompt) => void;
  onCopy: (text: string, label: string) => void;
}

function EditModal({ prompt, onClose, onSave, onCopy }: EditModalProps) {
  const [text, setText] = useState(prompt.plainText);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [imgLoading, setImgLoading] = useState(false);
  const imgInputRef = useRef<HTMLInputElement>(null);

  // Build JSON preview
  const jsonPreview = JSON.stringify({ text, language: prompt.language, confidence: Math.round(prompt.confidence * 100) / 100, format: "plain" }, null, 2);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated: SavedPrompt = { ...prompt, plainText: text };
      onSave(updated);
    } finally {
      setSaving(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImgLoading(true);
    try {
      const url = URL.createObjectURL(file);
      const img = new Image();
      await new Promise<void>((resolve, reject) => { img.onload = () => resolve(); img.onerror = reject; img.src = url; });
      const max = 160;
      const ratio = Math.min(max / img.width, max / img.height);
      const canvas = document.createElement("canvas");
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const thumbnail = canvas.toDataURL("image/jpeg", 0.75);

      const ocrWorker = await import("tesseract.js").then(m => m.createWorker("eng+ara"));
      const { data } = await ocrWorker.recognize(url);
      await ocrWorker.terminate();

      const arabicChars = (data.text.match(/[\u0600-\u06FF]/g) || []).length;
      const totalChars = data.text.replace(/\s/g, "").length;
      const lang = totalChars > 0 && arabicChars / totalChars > 0.3 ? "ara" : "eng";

      const updated: SavedPrompt = {
        ...prompt,
        imageThumbnail: thumbnail,
        plainText: data.text.trim(),
        jsonText: JSON.stringify({ text: data.text.trim(), language: lang, confidence: data.confidence / 100, format: "plain" }, null, 2),
        language: lang,
        confidence: data.confidence / 100,
      };
      setText(data.text.trim());
      onSave(updated);
    } catch {
      // silently fail
    } finally {
      setImgLoading(false);
    }
  };

  const handleCopyAll = () => {
    onCopy(text, "Text");
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "600px" }}>

        {/* Modal Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "36px", height: "36px", borderRadius: "10px",
              background: "linear-gradient(135deg, var(--primary), var(--primary-dark))",
              boxShadow: "4px 4px 10px rgba(124,58,237,0.28), -2px -2px 6px rgba(255,255,255,0.8)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Edit3 size={15} color="white" strokeWidth={2} />
            </div>
            <div>
              <h3 style={{ fontSize: "15px", fontWeight: 800, color: "var(--text)" }}>Edit Prompt</h3>
              <p style={{ fontSize: "10px", color: "var(--text-soft)" }}>Modify text or replace image</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="neu-btn"
            style={{ width: "34px", height: "34px", padding: 0, borderRadius: "10px" }}
          >
            <X size={14} strokeWidth={2} />
          </button>
        </div>

        {/* Image Section */}
        <div style={{ marginBottom: "18px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>
              Image
            </span>
            <button
              onClick={() => imgInputRef.current?.click()}
              className="neu-btn neu-btn-sm"
              disabled={imgLoading}
              style={{ gap: "4px" }}
            >
              {imgLoading ? (
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", border: "2px solid rgba(124,58,237,0.2)", borderTopColor: "var(--primary)", animation: "spin 0.7s linear infinite" }} />
              ) : (
                <Edit3 size={10} strokeWidth={2} />
              )}
              Replace Image
            </button>
            <input ref={imgInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageChange} />
          </div>

          {/* Image preview */}
          <div style={{
            background: "var(--bg-deep)",
            borderRadius: "16px",
            padding: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "180px",
            maxHeight: "280px",
            overflow: "hidden",
          }}>
            {prompt.imageThumbnail ? (
              <img
                src={prompt.imageThumbnail}
                alt="Prompt"
                style={{ maxWidth: "100%", maxHeight: "248px", objectFit: "contain", borderRadius: "10px", display: "block" }}
              />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", color: "var(--text-soft)" }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                <span style={{ fontSize: "11px" }}>No image</span>
              </div>
            )}
          </div>
        </div>

        {/* Text Section */}
        <div style={{ marginBottom: "18px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>
              Plain Text
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span className="neu-badge" style={{ fontSize: "9px" }}>{prompt.language.toUpperCase()}</span>
              <button onClick={handleCopyAll} className="neu-btn neu-btn-sm" style={{ gap: "4px" }}>
                {copied ? <Check size={10} strokeWidth={2.5} color="var(--success)" /> : <Copy size={10} strokeWidth={2} />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="neu-input"
            rows={7}
            style={{
              width: "100%", minHeight: "140px",
              fontFamily: "JetBrains Mono, monospace",
              fontSize: "12px",
              lineHeight: "1.7",
              resize: "vertical",
            }}
          />
        </div>

        {/* JSON Preview */}
        <div style={{ marginBottom: "22px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>
              JSON
            </span>
            <button
              onClick={() => onCopy(jsonPreview, "JSON")}
              className="neu-btn neu-btn-sm"
              style={{ gap: "4px" }}
            >
              <Copy size={10} strokeWidth={2} /> Copy
            </button>
          </div>
          <div style={{
            background: "var(--mono-bg)",
            borderRadius: "13px",
            borderLeft: "3px solid var(--secondary)",
            padding: "14px",
            fontFamily: "JetBrains Mono, monospace",
            fontSize: "11px",
            color: "var(--text)",
            lineHeight: "1.65",
            overflowX: "auto",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            boxShadow: "inset 3px 3px 8px rgba(163,177,198,0.5), inset -3px -3px 8px rgba(255,255,255,0.65)",
          }}>
            <pre style={{ margin: 0 }}>{jsonPreview}</pre>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button onClick={onClose} className="neu-btn">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="neu-btn neu-btn-primary" style={{ gap: "6px" }}>
            {saving ? (
              <><div style={{ width: "12px", height: "12px", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", animation: "spin 0.7s linear infinite" }} /> Saving...</>
            ) : (
              <><Check size={13} strokeWidth={2.5} /> Save Changes</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
