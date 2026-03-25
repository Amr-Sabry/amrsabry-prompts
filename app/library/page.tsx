/* PromptLens Library - Pinterest Masonry Style */
"use client";
import { useState, useEffect, useRef } from "react";
import { Search, X, Edit3, Copy, Wand2, Share2, Trash2 } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import TabNav from "@/components/TabNav";
import Toast from "@/components/Toast";
import EditModal from "@/components/EditModal";
import { SavedPrompt } from "@/types/prompt";

// Extracts natural dimensions from a base64 or URL image
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

  // No image → gradient placeholder
  if (!imgSrc) {
    return (
      <div style={{
        background: "linear-gradient(135deg, var(--primary-dark), var(--primary))",
        padding: "24px 10px 0",
      }}>
        <div style={{
          borderRadius: "18px 18px 0 0",
          height: 80,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <Wand2 size={28} color="rgba(255,255,255,0.35)" strokeWidth={1.5} />
        </div>
      </div>
    );
  }

  // Calculate aspect-ratio–constrained height
  // Wider than 600px → constrain to 600, else natural width
  const maxW = 600;
  const aspectRatio = dims ? dims.h / dims.w : 0.625; // default 16:10
  const renderedW = dims ? Math.min(dims.w, maxW) : maxW;
  const renderedH = Math.round(renderedW * aspectRatio);

  return (
    <div style={{
      background: "#e8e8f0",
      padding: "10px 10px 0",
    }}>
      <div style={{
        borderRadius: "18px 18px 0 0",
        overflow: "hidden",
        background: "var(--bg-deep)",
        // Dynamic aspect-ratio container — enforces Pinterest ratio
        aspectRatio: dims ? `${renderedW}/${renderedH}` : "auto",
        height: dims ? undefined : 200,
      }}>
        <img
          src={imgSrc}
          alt={`Prompt thumbnail`}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            borderRadius: "18px 18px 0 0",
          }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
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

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)", fontFamily: "Outfit, sans-serif" }}>

      {/* ── HEADER ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 40,
        background: "rgba(221,225,236,0.92)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(163,177,198,0.3)",
      }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 14,
              background: "linear-gradient(135deg, var(--primary), var(--primary-dark))",
              boxShadow: "5px 5px 14px rgba(124,58,237,0.35), -3px -3px 8px rgba(255,255,255,0.8)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Wand2 size={18} color="white" strokeWidth={1.8} />
            </div>
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 800, color: "var(--text)" }}>Library</h1>
              <p style={{ fontSize: 10, color: "var(--text-soft)" }}>
                {library.length} prompt{library.length !== 1 ? "s" : ""} saved
              </p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {session ? (
              <>
                <span style={{
                  fontSize: 9, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                  background: session.user.role === "admin"
                    ? "linear-gradient(135deg, var(--primary), var(--primary-dark))"
                    : "var(--bg)",
                  color: session.user.role === "admin" ? "white" : "var(--text-muted)",
                  boxShadow: session.user.role !== "admin"
                    ? "2px 2px 6px var(--sh-dark), -2px -2px 6px var(--sh-light)"
                    : "2px 2px 6px rgba(124,58,237,0.3)",
                }}>
                  {session.user.role.toUpperCase()}
                </span>
                <span style={{ fontSize: 11, color: "var(--text-soft)" }}>@{session.user.username}</span>
                {session.user.role === "admin" && (
                  <a href="/admin" style={{
                    fontSize: 9, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                    background: "var(--bg)", color: "var(--text-muted)", textDecoration: "none",
                    boxShadow: "2px 2px 6px var(--sh-dark), -2px -2px 6px var(--sh-light)",
                  }}>Admin</a>
                )}
                <button onClick={() => signOut({ callbackUrl: "/login" })} style={{
                  fontSize: 10, fontWeight: 600, padding: "5px 12px", borderRadius: 12,
                  border: "none", cursor: "pointer",
                  background: "var(--bg)", color: "var(--text-muted)",
                  boxShadow: "3px 3px 8px var(--sh-dark), -3px -3px 8px var(--sh-light)",
                }}>Logout</button>
              </>
            ) : (
              <a href="/login" style={{
                fontSize: 10, fontWeight: 700, padding: "5px 14px", borderRadius: 12,
                textDecoration: "none",
                background: "linear-gradient(135deg, var(--primary), var(--primary-dark))",
                color: "white",
                boxShadow: "3px 3px 8px rgba(124,58,237,0.3)",
              }}>Login</a>
            )}
            <TabNav />
          </div>
        </div>
      </header>

      {/* ── MAIN ── */}
      <main className="max-w-6xl mx-auto px-6 py-10 flex flex-col gap-8">

        {/* Search */}
        {library.length > 0 && (
          <div style={{ position: "relative" }}>
            <Search size={16} style={{
              position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)",
              color: "var(--text-soft)", pointerEvents: "none",
            }} />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search prompts, languages, users..."
              style={{
                width: "100%", padding: "12px 16px 12px 42px",
                borderRadius: 14, border: "none", outline: "none",
                background: "var(--bg)", color: "var(--text)", fontSize: 13,
                boxShadow: "inset 4px 4px 10px var(--sh-dark), inset -4px -4px 10px var(--sh-light)",
                fontFamily: "Outfit, sans-serif",
              }}
            />
            {search && (
              <button onClick={() => setSearch("")} style={{
                position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer", color: "var(--text-soft)", padding: 4,
              }}>
                <X size={14} />
              </button>
            )}
          </div>
        )}

        {/* Auth notice */}
        {!session && (
          <div style={{
            background: "var(--bg)", borderRadius: 20,
            boxShadow: "inset 4px 4px 10px var(--sh-dark), inset -4px -4px 10px var(--sh-light)",
            padding: "16px 22px", display: "flex", alignItems: "center", gap: 12,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p style={{ fontSize: 12, color: "var(--text-soft)" }}>
              <a href="/login" style={{ color: "var(--primary)", fontWeight: 700, textDecoration: "none" }}>Sign in</a> to save and manage your prompts.
            </p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: 80 }}>
            <div style={{
              width: 48, height: 48, borderRadius: "50%",
              border: "3px solid var(--sh-dark)",
              borderTopColor: "var(--primary)",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto 16px",
            }} />
            <p style={{ fontSize: 13, color: "var(--text-soft)" }}>Loading prompts...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: 80 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
            <p style={{ fontSize: 16, fontWeight: 700, color: "var(--text-muted)" }}>
              {search ? "No results found" : "No prompts yet"}
            </p>
            <p style={{ fontSize: 12, color: "var(--text-soft)", marginTop: 6 }}>
              {search ? `No prompts match "${search}"` : "Extract text from an image to get started."}
            </p>
          </div>
        )}

        {/* ── PINTEREST MASONRY GRID ── */}
        {!loading && filtered.length > 0 && (
          <div style={{
            columns: "220px 3",
            columnGap: "20px",
          }}>
            {filtered.map((prompt) => (
              <div key={prompt.id} style={{
                breakInside: "avoid",
                marginBottom: "20px",
                background: "var(--bg)",
                borderRadius: 24,
                boxShadow: "8px 8px 20px var(--sh-dark), -8px -8px 20px var(--sh-light)",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                transition: "transform 0.2s, box-shadow 0.2s",
                cursor: "default",
              }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "14px 14px 32px var(--sh-dark), -14px -14px 32px var(--sh-light)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "8px 8px 20px var(--sh-dark), -8px -8px 20px var(--sh-light)";
                }}
              >
                {/* ── IMAGE (Pinterest style – full width, real aspect ratio) ── */}
                <ImageBlock prompt={prompt} />

                {/* ── CONTENT ── */}
                <div style={{ padding: "14px 16px 16px", flex: 1, display: "flex", flexDirection: "column" }}>

                  {/* Meta row */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, marginBottom: 10 }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span style={{
                        fontSize: 9, fontWeight: 700, padding: "2px 9px", borderRadius: 20,
                        background: "linear-gradient(135deg, var(--primary), var(--primary-dark))",
                        color: "white",
                      }}>
                        {prompt.language.toUpperCase()}
                      </span>
                    </div>
                    <span style={{ fontSize: 9, color: "var(--text-soft)", fontWeight: 500 }}>
                      @{prompt.userName || "guest"} · {new Date(prompt.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Prompt text */}
                  <div style={{ flex: 1, textAlign: "center" }}>
                    <p style={{
                      fontFamily: "JetBrains Mono, monospace",
                      fontSize: 10.5,
                      color: "var(--text)",
                      lineHeight: 1.75,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      overflow: "hidden",
                      display: "-webkit-box",
                      WebkitLineClamp: 7,
                      WebkitBoxOrient: "vertical",
                      textAlign: "center",
                    }}>
                      {prompt.plainText}
                    </p>
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
                    <button onClick={() => handleCopy(prompt.plainText, "Text")} style={{
                      flex: 1, minWidth: 60,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                      padding: "7px 8px", borderRadius: 12, border: "none", cursor: "pointer",
                      background: "var(--bg)", color: "var(--text)",
                      fontSize: 10, fontWeight: 600,
                      fontFamily: "Outfit, sans-serif",
                      boxShadow: "3px 3px 8px var(--sh-dark), -3px -3px 8px var(--sh-light)",
                    }}>
                      <Copy size={10} strokeWidth={2.5} /> Copy
                    </button>

                    <button onClick={() => handleShare(prompt)} style={{
                      flex: 1, minWidth: 60,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                      padding: "7px 8px", borderRadius: 12, border: "none", cursor: "pointer",
                      background: "var(--bg)", color: "var(--text)",
                      fontSize: 10, fontWeight: 600,
                      fontFamily: "Outfit, sans-serif",
                      boxShadow: "3px 3px 8px var(--sh-dark), -3px -3px 8px var(--sh-light)",
                    }}>
                      <Share2 size={10} strokeWidth={2.5} /> Share
                    </button>

                    {canModify(prompt) && (
                      <>
                        <button onClick={() => setActivePrompt(prompt)} style={{
                          flex: 1, minWidth: 60,
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                          padding: "7px 8px", borderRadius: 12, border: "none", cursor: "pointer",
                          background: "var(--bg)", color: "var(--text)",
                          fontSize: 10, fontWeight: 600,
                          fontFamily: "Outfit, sans-serif",
                          boxShadow: "3px 3px 8px var(--sh-dark), -3px -3px 8px var(--sh-light)",
                        }}>
                          <Edit3 size={10} strokeWidth={2.5} /> Edit
                        </button>
                        <button onClick={() => handleDelete(prompt.id)} style={{
                          flex: 1, minWidth: 60,
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                          padding: "7px 8px", borderRadius: 12, border: "none", cursor: "pointer",
                          background: "var(--bg)", color: "#e74c3c",
                          fontSize: 10, fontWeight: 600,
                          fontFamily: "Outfit, sans-serif",
                          boxShadow: "3px 3px 8px var(--sh-dark), -3px -3px 8px var(--sh-light)",
                        }}>
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
          <p style={{ textAlign: "center", fontSize: 11, color: "var(--text-soft)", paddingBottom: 20 }}>
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
