/* PromptLens Library - Neumorphism Premium */
"use client";
import { useState, useEffect } from "react";
import { Search, X, Edit3, Copy, Wand2, Share2, Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";
import Header from "@/components/Header";
import Toast from "@/components/Toast";
import EditModal from "@/components/EditModal";
import { SavedPrompt } from "@/types/prompt";

// ─── Design Tokens ───────────────────────────────────────────────────────────
const C = {
  bg: "#dde1ec",
  bgDeep: "#c8ccd6",
  primary: "#7c3aed",
  primaryDark: "#6d28d9",
  text: "#1e2130",
  textSoft: "#8891a5",
  textMuted: "#5c6478",
  danger: "#dc2626",
  shDark: "rgba(163,177,198,0.72)",
  shLight: "rgba(255,255,255,0.95)",
  insetDark: "rgba(163,177,198,0.6)",
  insetLight: "rgba(255,255,255,0.9)",
};

const raised = `8px 8px 20px ${C.shDark}, -8px -8px 20px ${C.shLight}`;
const inset = `inset 4px 4px 10px ${C.insetDark}, inset -4px -4px 10px ${C.insetLight}`;

// ─── Hooks ────────────────────────────────────────────────────────────────────
function useImageDimensions(src: string) {
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);
  useEffect(() => {
    if (!src) return;
    const img = new Image();
    img.onload = () => setDims({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = src;
  }, [src]);
  return dims;
}

// ─── ImageBlock ───────────────────────────────────────────────────────────────
function ImageBlock({ prompt }: { prompt: SavedPrompt }) {
  const imgSrc = prompt.imageThumbnail || "";
  const dims = useImageDimensions(imgSrc);
  const renderedRatio = dims ? `${dims.w}/${dims.h}` : "3/2";

  if (!imgSrc) {
    return (
      <div style={{
        background: `linear-gradient(135deg, ${C.primaryDark}, ${C.primary}, #a78bfa)`,
        borderRadius: "22px 22px 0 0",
        height: 160, display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative", overflow: "hidden",
      }}>
        {[...Array(5)].map((_, i) => (
          <div key={i} style={{
            position: "absolute", width: 4, height: 4, borderRadius: "50%",
            background: "rgba(255,255,255,0.3)",
            left: `${15 + i * 18}%`, top: `${20 + (i % 2) * 15}%`,
          }} />
        ))}
        <div style={{ position: "absolute", bottom: 20, left: 20, right: 20, height: 1, background: "rgba(255,255,255,0.1)" }} />
        <div style={{ position: "absolute", bottom: 28, left: 20, right: 60, height: 1, background: "rgba(255,255,255,0.06)" }} />
        <Wand2 size={32} color="rgba(255,255,255,0.25)" strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <div style={{ position: "relative", borderRadius: "22px 22px 0 0", overflow: "hidden", background: C.bgDeep }}>
      <div style={{ aspectRatio: renderedRatio }}>
        <img
          src={imgSrc}
          alt="Prompt thumbnail"
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LibraryPage() {
  const { data: session } = useSession();
  const [library, setLibrary] = useState<SavedPrompt[]>([]);
  const [search, setSearch] = useState("");
  const [toast, setToToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePrompt, setActivePrompt] = useState<SavedPrompt | null>(null);

  useEffect(() => {
    fetch("/api/prompts")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setLibrary(data); else if (data.error) setLibrary([]); })
      .catch(() => setLibrary([]))
      .finally(() => setLoading(false));
  }, []);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToToast({ message, type });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this prompt?")) return;
    const res = await fetch("/api/prompts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", prompt: { id } }),
    });
    if (res.ok) {
      setLibrary((prev) => prev.filter((p) => p.id !== id));
      showToast("Prompt deleted.", "info");
      if (activePrompt?.id === id) setActivePrompt(null);
    } else {
      const err = await res.json();
      showToast(err.error || "Failed to delete.", "error");
    }
  };

  const handleSave = async (updated: SavedPrompt) => {
    const res = await fetch("/api/prompts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update", prompt: updated }),
    });
    if (res.ok) {
      setLibrary((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      showToast("Saved!", "success");
      setActivePrompt(null);
    } else {
      showToast("Failed to save.", "error");
    }
  };

  const handleShare = async (prompt: SavedPrompt) => {
    const shareData = { title: "PromptLens", text: prompt.plainText };
    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try { await navigator.share(shareData); } catch {}
    } else {
      navigator.clipboard.writeText(prompt.plainText);
      showToast("Prompt copied!", "success");
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => showToast(`${label} copied!`, "success"));
  };

  const canModify = (prompt: SavedPrompt) => {
    if (!session) return false;
    return session.user.role === "admin" || session.user.id === prompt.userId;
  };

  const filtered = search.trim()
    ? library.filter((p) =>
        p.plainText.toLowerCase().includes(search.toLowerCase()) ||
        p.language.toLowerCase().includes(search.toLowerCase()) ||
        p.userName.toLowerCase().includes(search.toLowerCase())
      )
    : library;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "Outfit, sans-serif" }}>

      {/* ── SHARED HEADER ── */}
      <Header />

      {/* ── MAIN ── */}
      <main style={{
        maxWidth: 1100, margin: "0 auto",
        padding: "36px 24px 60px",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 32,
      }}>

        {/* Search */}
        {library.length > 0 && (
          <div style={{ position: "relative", width: "100%", maxWidth: 520 }}>
            <Search size={16} style={{
              position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
              color: C.textSoft, pointerEvents: "none",
            }} />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search prompts, languages, users..."
              style={{
                width: "100%", padding: "12px 14px 12px 42px",
                borderRadius: 12, border: "none", outline: "none",
                background: C.bg, color: C.text, fontSize: 13,
                boxShadow: inset, fontFamily: "Outfit, sans-serif", transition: "all 0.2s",
              }}
              onFocus={(e) => {
                (e.target as HTMLInputElement).style.boxShadow = `inset 5px 5px 12px ${C.insetDark}, inset -5px -5px 12px ${C.insetLight}, 0 0 0 2px rgba(124,58,237,0.2)`;
              }}
              onBlur={(e) => {
                (e.target as HTMLInputElement).style.boxShadow = inset;
              }}
            />
            {search && (
              <button onClick={() => setSearch("")} style={{
                position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer", color: C.textSoft, padding: 4,
              }}>
                <X size={14} />
              </button>
            )}
          </div>
        )}

        {/* Auth notice */}
        {!session && (
          <div style={{
            background: C.bg, borderRadius: 20,
            boxShadow: inset, padding: "14px 22px", display: "flex", alignItems: "center", gap: 12,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p style={{ fontSize: 12, color: C.textMuted }}>
              <a href="/login" style={{ color: C.primary, fontWeight: 700, textDecoration: "none" }}>Sign in</a> to save and manage your prompts.
            </p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: 80 }}>
            <div style={{
              width: 48, height: 48, borderRadius: "50%",
              border: `3px solid ${C.shDark}`,
              borderTopColor: C.primary,
              animation: "spin 0.8s linear infinite",
              margin: "0 auto 16px",
              boxShadow: raised,
            }} />
            <p style={{ fontSize: 13, color: C.textSoft }}>Loading prompts...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: 80 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
            <p style={{ fontSize: 16, fontWeight: 700, color: C.textMuted }}>
              {search ? "No results found" : "No prompts yet"}
            </p>
            <p style={{ fontSize: 12, color: C.textSoft, marginTop: 6 }}>
              {search ? `No prompts match "${search}"` : "Extract text from an image to get started."}
            </p>
          </div>
        )}

        {/* ── PINTEREST MASONRY GRID ── */}
        {!loading && filtered.length > 0 && (
          <div style={{ columns: "280px 3", columnGap: "22px", width: "100%" }}>
            {filtered.map((prompt) => (
              <div key={prompt.id} style={{
                breakInside: "avoid", marginBottom: "22px",
                background: C.bg, borderRadius: 24,
                boxShadow: raised, overflow: "hidden",
                display: "flex", flexDirection: "column",
                transition: "transform 0.25s ease, box-shadow 0.25s ease", cursor: "default",
              }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = `12px 12px 28px ${C.shDark}, -12px -12px 28px ${C.shLight}`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = raised;
                }}
              >
                <ImageBlock prompt={prompt} />

                {/* ── CONTENT ── */}
                <div style={{ padding: "16px 18px 18px", flex: 1, display: "flex", flexDirection: "column" }}>

                  {/* Meta */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span style={{
                        fontSize: 9, fontWeight: 800, padding: "3px 10px", borderRadius: 20,
                        background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})`,
                        color: "white",
                        boxShadow: "3px 3px 8px rgba(124,58,237,0.3), -2px -2px 6px rgba(255,255,255,0.8)",
                        letterSpacing: "0.05em",
                      }}>
                        {prompt.language.toUpperCase()}
                      </span>
                      <span style={{ fontSize: 9, color: C.textSoft, fontWeight: 500 }}>
                        @{prompt.userName || "guest"}
                      </span>
                    </div>
                    <span style={{ fontSize: 9, color: C.textSoft }}>
                      {new Date(prompt.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Prompt text */}
                  <div style={{ flex: 1 }}>
                    <p style={{
                      fontFamily: "JetBrains Mono, monospace", fontSize: 10.5,
                      color: C.text, lineHeight: 1.8, whiteSpace: "pre-wrap",
                      wordBreak: "break-word", overflow: "hidden",
                      display: "-webkit-box", WebkitLineClamp: 7, WebkitBoxOrient: "vertical",
                    }}>
                      {prompt.plainText}
                    </p>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 6, marginTop: 14, flexWrap: "wrap" }}>
                    <button onClick={() => handleCopy(prompt.plainText, "Text")} style={{
                      flex: 1, minWidth: 60,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                      padding: "8px 6px", borderRadius: 12, border: "none", cursor: "pointer",
                      background: C.bg, color: C.text, fontSize: 10, fontWeight: 700,
                      fontFamily: "Outfit, sans-serif", boxShadow: raised, transition: "all 0.2s",
                    }}
                      onMouseEnter={(e) => {
                        (e.target as HTMLButtonElement).style.boxShadow = `inset 3px 3px 8px ${C.insetDark}, inset -3px -3px 8px ${C.insetLight}`;
                        (e.target as HTMLButtonElement).style.color = C.primary;
                      }}
                      onMouseLeave={(e) => {
                        (e.target as HTMLButtonElement).style.boxShadow = raised;
                        (e.target as HTMLButtonElement).style.color = C.text;
                      }}
                    >
                      <Copy size={10} strokeWidth={2.5} /> Copy
                    </button>

                    <button onClick={() => handleShare(prompt)} style={{
                      flex: 1, minWidth: 60,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                      padding: "8px 6px", borderRadius: 12, border: "none", cursor: "pointer",
                      background: C.bg, color: C.text, fontSize: 10, fontWeight: 700,
                      fontFamily: "Outfit, sans-serif", boxShadow: raised, transition: "all 0.2s",
                    }}
                      onMouseEnter={(e) => {
                        (e.target as HTMLButtonElement).style.boxShadow = `inset 3px 3px 8px ${C.insetDark}, inset -3px -3px 8px ${C.insetLight}`;
                        (e.target as HTMLButtonElement).style.color = C.primary;
                      }}
                      onMouseLeave={(e) => {
                        (e.target as HTMLButtonElement).style.boxShadow = raised;
                        (e.target as HTMLButtonElement).style.color = C.text;
                      }}
                    >
                      <Share2 size={10} strokeWidth={2.5} /> Share
                    </button>

                    {canModify(prompt) && (
                      <>
                        <button onClick={() => setActivePrompt(prompt)} style={{
                          flex: 1, minWidth: 60,
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                          padding: "8px 6px", borderRadius: 12, border: "none", cursor: "pointer",
                          background: C.bg, color: C.text, fontSize: 10, fontWeight: 700,
                          fontFamily: "Outfit, sans-serif", boxShadow: raised, transition: "all 0.2s",
                        }}
                          onMouseEnter={(e) => {
                            (e.target as HTMLButtonElement).style.boxShadow = `inset 3px 3px 8px ${C.insetDark}, inset -3px -3px 8px ${C.insetLight}`;
                            (e.target as HTMLButtonElement).style.color = C.primary;
                          }}
                          onMouseLeave={(e) => {
                            (e.target as HTMLButtonElement).style.boxShadow = raised;
                            (e.target as HTMLButtonElement).style.color = C.text;
                          }}
                        >
                          <Edit3 size={10} strokeWidth={2.5} /> Edit
                        </button>
                        <button onClick={() => handleDelete(prompt.id)} style={{
                          flex: 1, minWidth: 60,
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                          padding: "8px 6px", borderRadius: 12, border: "none", cursor: "pointer",
                          background: C.bg, color: C.danger, fontSize: 10, fontWeight: 700,
                          fontFamily: "Outfit, sans-serif", boxShadow: raised, transition: "all 0.2s",
                        }}
                          onMouseEnter={(e) => {
                            (e.target as HTMLButtonElement).style.boxShadow = `inset 3px 3px 8px ${C.insetDark}, inset -3px -3px 8px ${C.insetLight}`;
                          }}
                          onMouseLeave={(e) => {
                            (e.target as HTMLButtonElement).style.boxShadow = raised;
                          }}
                        >
                          <Trash2 size={10} strokeWidth={2.5} /> Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        {!loading && filtered.length > 0 && (
          <p style={{ textAlign: "center", fontSize: 11, color: C.textSoft, paddingBottom: 20 }}>
            Showing {filtered.length} of {library.length} prompt{library.length !== 1 ? "s" : ""}
            {search && ` matching "${search}"`}
          </p>
        )}
      </main>

      {activePrompt && (
        <EditModal prompt={activePrompt} onClose={() => setActivePrompt(null)} onSave={handleSave} />
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToToast(null)} />}
    </div>
  );
}
