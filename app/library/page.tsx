/* PromptLens Library - Neumorphism Premium */
"use client";
import { useState, useEffect } from "react";
import { Search, X, Edit3, Copy, Wand2, Share2, Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";
import Header from "@/components/Header";
import Toast from "@/components/Toast";
import EditModal from "@/components/EditModal";
import { SavedPrompt } from "@/types/prompt";

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

function ImageBlock({ prompt }: { prompt: SavedPrompt }) {
  const imgSrc = prompt.imageThumbnail || "";
  const dims = useImageDimensions(imgSrc);
  // aspect-ratio: "w/h" e.g. "1920/1080" for landscape, "1080/1920" for portrait
  const aspectRatio = dims ? `${dims.w}/${dims.h}` : "16/9";

  if (!imgSrc) {
    return (
      <div style={{
        background: "linear-gradient(135deg, #6d28d9, #7c3aed, #a78bfa)",
        borderRadius: "18px 18px 0 0",
        height: 160,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        {[...Array(5)].map((_, i) => (
          <div key={i} style={{
            position: "absolute",
            width: 4, height: 4, borderRadius: "50%",
            background: "rgba(255,255,255,0.3)",
            left: `${15 + i * 18}%`,
            top: `${20 + (i % 2) * 15}%`,
          }} />
        ))}
        <div style={{ position: "absolute", bottom: 20, left: 20, right: 20, height: 1, background: "rgba(255,255,255,0.1)" }} />
        <div style={{ position: "absolute", bottom: 28, left: 20, right: 60, height: 1, background: "rgba(255,255,255,0.06)" }} />
        <Wand2 size={32} color="rgba(255,255,255,0.25)" strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <div style={{ position: "relative", borderRadius: "18px 18px 0 0", overflow: "hidden", background: "#c8cdd8" }}>
      <div style={{ aspectRatio }}>
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
      .then((data) => {
        if (Array.isArray(data)) setLibrary(data);
        else if (data.error) setLibrary([]);
      })
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
    const shareData = { title: "AmrSabry-prompts", text: prompt.plainText };
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

  const cardShadow = "8px 8px 20px rgba(163,177,198,0.72), -8px -8px 20px rgba(255,255,255,0.95)";
  const cardShadowHover = "12px 12px 28px rgba(163,177,198,0.8), -12px -12px 28px rgba(255,255,255,1)";

  return (
    <div style={{
      minHeight: "100vh",
      background: "#dde1ec",
      fontFamily: "Outfit, sans-serif",
      color: "#1e2130",
    }}>

      {/* ── SHARED HEADER ── */}
      <Header />

      {/* ── MAIN ── */}
      <main style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: "36px 24px 60px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 32,
      }}>

        {/* Search */}
        {library.length > 0 && (
          <div style={{ position: "relative", width: "100%", maxWidth: 520 }}>
            <Search size={16} style={{
              position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)",
              color: "#8891a5", pointerEvents: "none",
            }} />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search prompts, languages, users..."
              style={{
                width: "100%", padding: "13px 16px 13px 44px",
                borderRadius: 14, border: "none", outline: "none",
                background: "#dde1ec", color: "#1e2130", fontSize: 13,
                boxShadow: "inset 4px 4px 10px rgba(163,177,198,0.6), inset -4px -4px 10px rgba(255,255,255,0.9)",
                fontFamily: "Outfit, sans-serif",
                transition: "all 0.2s",
              }}
              onFocus={(e) => {
                (e.target as HTMLInputElement).style.boxShadow =
                  "inset 5px 5px 12px rgba(163,177,198,0.6), inset -5px -5px 12px rgba(255,255,255,0.9), 0 0 0 2px rgba(124,58,237,0.25)";
              }}
              onBlur={(e) => {
                (e.target as HTMLInputElement).style.boxShadow =
                  "inset 4px 4px 10px rgba(163,177,198,0.6), inset -4px -4px 10px rgba(255,255,255,0.9)";
              }}
            />
            {search && (
              <button onClick={() => setSearch("")} style={{
                position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer", color: "#8891a5", padding: 4,
              }}>
                <X size={14} />
              </button>
            )}
          </div>
        )}

        {/* Auth notice */}
        {!session && (
          <div style={{
            background: "#dde1ec",
            borderRadius: 20,
            boxShadow: "inset 4px 4px 10px rgba(163,177,198,0.5), inset -4px -4px 10px rgba(255,255,255,0.8)",
            padding: "14px 22px", display: "flex", alignItems: "center", gap: 12,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p style={{ fontSize: 12, color: "#5c6478" }}>
              <a href="/login" style={{ color: "#7c3aed", fontWeight: 700, textDecoration: "none" }}>Sign in</a> to save and manage your prompts.
            </p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: 80 }}>
            <div style={{
              width: 48, height: 48, borderRadius: "50%",
              border: "3px solid rgba(163,177,198,0.4)",
              borderTopColor: "#7c3aed",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto 16px",
              boxShadow: "5px 5px 12px rgba(163,177,198,0.5), -5px -5px 12px rgba(255,255,255,0.9)",
            }} />
            <p style={{ fontSize: 13, color: "#8891a5" }}>Loading prompts...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: 80 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
            <p style={{ fontSize: 16, fontWeight: 700, color: "#5c6478" }}>
              {search ? "No results found" : "No prompts yet"}
            </p>
            <p style={{ fontSize: 12, color: "#8891a5", marginTop: 6 }}>
              {search ? `No prompts match "${search}"` : "Extract text from an image to get started."}
            </p>
          </div>
        )}

        {/* ── PINTEREST MASONRY GRID ── */}
        {!loading && filtered.length > 0 && (
          <div style={{
            columns: "280px 3",
            columnGap: "22px",
            width: "100%",
          }}>
            {filtered.map((prompt) => (
              <div key={prompt.id} style={{
                breakInside: "avoid",
                marginBottom: "22px",
                background: "#e8ecf4",
                borderRadius: 22,
                boxShadow: cardShadow,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                transition: "transform 0.25s ease, box-shadow 0.25s ease",
                cursor: "default",
              }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = cardShadowHover;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = cardShadow;
                }}
              >
                {/* ── IMAGE: natural aspect ratio, Pinterest style ── */}
                <ImageBlock prompt={prompt} />

                {/* ── CONTENT ── */}
                <div style={{ padding: "16px 18px 18px", flex: 1, display: "flex", flexDirection: "column" }}>

                  {/* Meta */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span style={{
                        fontSize: 9, fontWeight: 800, padding: "3px 10px", borderRadius: 20,
                        background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
                        color: "white",
                        boxShadow: "3px 3px 8px rgba(124,58,237,0.3), -2px -2px 6px rgba(255,255,255,0.8)",
                        letterSpacing: "0.05em",
                      }}>
                        {prompt.language.toUpperCase()}
                      </span>
                      <span style={{ fontSize: 9, color: "#8891a5", fontWeight: 500 }}>
                        @{prompt.userName || "guest"}
                      </span>
                    </div>
                    <span style={{ fontSize: 9, color: "#8891a5" }}>
                      {new Date(prompt.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Prompt text */}
                  <div style={{ flex: 1 }}>
                    <p style={{
                      fontFamily: "JetBrains Mono, monospace",
                      fontSize: 10.5,
                      color: "#1e2130",
                      lineHeight: 1.8,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      overflow: "hidden",
                      display: "-webkit-box",
                      WebkitLineClamp: 7,
                      WebkitBoxOrient: "vertical",
                    }}>
                      {prompt.plainText}
                    </p>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 6, marginTop: 14, flexWrap: "wrap" }}>
                    <button onClick={() => handleCopy(prompt.plainText, "Text")} style={{
                      flex: 1, minWidth: 60,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                      padding: "8px 8px", borderRadius: 11, border: "none", cursor: "pointer",
                      background: "#dde1ec",
                      color: "#1e2130",
                      fontSize: 10, fontWeight: 700,
                      fontFamily: "Outfit, sans-serif",
                      boxShadow: "3px 3px 8px rgba(163,177,198,0.6), -3px -3px 8px rgba(255,255,255,0.9)",
                      transition: "all 0.2s",
                    }}
                      onMouseEnter={(e) => {
                        (e.target as HTMLButtonElement).style.boxShadow = "inset 3px 3px 8px rgba(163,177,198,0.6), inset -3px -3px 8px rgba(255,255,255,0.9)";
                        (e.target as HTMLButtonElement).style.color = "#7c3aed";
                      }}
                      onMouseLeave={(e) => {
                        (e.target as HTMLButtonElement).style.boxShadow = "3px 3px 8px rgba(163,177,198,0.6), -3px -3px 8px rgba(255,255,255,0.9)";
                        (e.target as HTMLButtonElement).style.color = "#1e2130";
                      }}
                    >
                      <Copy size={10} strokeWidth={2.5} /> Copy
                    </button>

                    <button onClick={() => handleShare(prompt)} style={{
                      flex: 1, minWidth: 60,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                      padding: "8px 8px", borderRadius: 11, border: "none", cursor: "pointer",
                      background: "#dde1ec",
                      color: "#1e2130",
                      fontSize: 10, fontWeight: 700,
                      fontFamily: "Outfit, sans-serif",
                      boxShadow: "3px 3px 8px rgba(163,177,198,0.6), -3px -3px 8px rgba(255,255,255,0.9)",
                      transition: "all 0.2s",
                    }}
                      onMouseEnter={(e) => {
                        (e.target as HTMLButtonElement).style.boxShadow = "inset 3px 3px 8px rgba(163,177,198,0.6), inset -3px -3px 8px rgba(255,255,255,0.9)";
                        (e.target as HTMLButtonElement).style.color = "#7c3aed";
                      }}
                      onMouseLeave={(e) => {
                        (e.target as HTMLButtonElement).style.boxShadow = "3px 3px 8px rgba(163,177,198,0.6), -3px -3px 8px rgba(255,255,255,0.9)";
                        (e.target as HTMLButtonElement).style.color = "#1e2130";
                      }}
                    >
                      <Share2 size={10} strokeWidth={2.5} /> Share
                    </button>

                    {canModify(prompt) && (
                      <>
                        <button onClick={() => setActivePrompt(prompt)} style={{
                          flex: 1, minWidth: 60,
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                          padding: "8px 8px", borderRadius: 11, border: "none", cursor: "pointer",
                          background: "#dde1ec",
                          color: "#1e2130",
                          fontSize: 10, fontWeight: 700,
                          fontFamily: "Outfit, sans-serif",
                          boxShadow: "3px 3px 8px rgba(163,177,198,0.6), -3px -3px 8px rgba(255,255,255,0.9)",
                          transition: "all 0.2s",
                        }}
                          onMouseEnter={(e) => {
                            (e.target as HTMLButtonElement).style.boxShadow = "inset 3px 3px 8px rgba(163,177,198,0.6), inset -3px -3px 8px rgba(255,255,255,0.9)";
                            (e.target as HTMLButtonElement).style.color = "#7c3aed";
                          }}
                          onMouseLeave={(e) => {
                            (e.target as HTMLButtonElement).style.boxShadow = "3px 3px 8px rgba(163,177,198,0.6), -3px -3px 8px rgba(255,255,255,0.9)";
                            (e.target as HTMLButtonElement).style.color = "#1e2130";
                          }}
                        >
                          <Edit3 size={10} strokeWidth={2.5} /> Edit
                        </button>
                        <button onClick={() => handleDelete(prompt.id)} style={{
                          flex: 1, minWidth: 60,
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                          padding: "8px 8px", borderRadius: 11, border: "none", cursor: "pointer",
                          background: "#dde1ec",
                          color: "#dc2626",
                          fontSize: 10, fontWeight: 700,
                          fontFamily: "Outfit, sans-serif",
                          boxShadow: "3px 3px 8px rgba(163,177,198,0.6), -3px -3px 8px rgba(255,255,255,0.9)",
                          transition: "all 0.2s",
                        }}
                          onMouseEnter={(e) => {
                            (e.target as HTMLButtonElement).style.boxShadow = "inset 3px 3px 8px rgba(163,177,198,0.6), inset -3px -3px 8px rgba(255,255,255,0.9)";
                          }}
                          onMouseLeave={(e) => {
                            (e.target as HTMLButtonElement).style.boxShadow = "3px 3px 8px rgba(163,177,198,0.6), -3px -3px 8px rgba(255,255,255,0.9)";
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
          <p style={{ textAlign: "center", fontSize: 11, color: "#8891a5", paddingBottom: 20 }}>
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
