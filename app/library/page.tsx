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

      {/* ── PREMIUM HEADER ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 40,
        background: "rgba(221,225,236,0.88)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderBottom: "1px solid rgba(255,255,255,0.6)",
        boxShadow: "0 4px 30px rgba(124,58,237,0.06), 0 1px 0 rgba(163,177,198,0.2)",
      }}>
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between gap: 16px">

          {/* Logo + Title */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
            {/* Animated gradient icon */}
            <div style={{
              width: 48, height: 48, borderRadius: 16,
              background: "linear-gradient(135deg, #7c3aed, #4f46e5, #7c3aed)",
              backgroundSize: "200% 200%",
              animation: "logoShimmer 3s ease infinite",
              boxShadow: "6px 6px 20px rgba(124,58,237,0.45), -4px -4px 12px rgba(255,255,255,0.9), inset 0 1px 0 rgba(255,255,255,0.4)",
              display: "flex", alignItems: "center", justifyContent: "center",
              position: "relative", overflow: "hidden",
            }}>
              <Wand2 size={20} color="white" strokeWidth={2} style={{ position: "relative", zIndex: 1 }} />
              {/* Shine sweep */}
              <div style={{
                position: "absolute", top: 0, left: "-75%",
                width: "50%", height: "100%",
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)",
                animation: "shine 2.5s ease infinite",
              }} />
            </div>

            <div>
              <h1 style={{ fontSize: 20, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.02em", lineHeight: 1 }}>
                PromptLens
              </h1>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                <span style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: "#22c55e",
                  boxShadow: "0 0 8px rgba(34,197,94,0.7)",
                  display: "inline-block",
                  animation: "pulse 2s ease infinite",
                }} />
                <p style={{ fontSize: 10, color: "var(--text-soft)", fontWeight: 500 }}>
                  {library.length} prompt{library.length !== 1 ? "s" : ""} saved
                </p>
              </div>
            </div>
          </div>

          {/* Right side: auth pill + tab nav */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
            {/* Auth pill — glassmorphism */}
            {session ? (
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "6px 6px 6px 14px",
                borderRadius: "50px",
                background: "rgba(255,255,255,0.25)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                border: "1px solid rgba(255,255,255,0.55)",
                boxShadow: "0 4px 16px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.6)",
              }}>
                {/* Avatar */}
                <div style={{
                  width: 30, height: 30, borderRadius: "50%",
                  background: "linear-gradient(135deg, var(--primary), var(--primary-dark))",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 800, color: "white",
                  boxShadow: "0 2px 8px rgba(124,58,237,0.4)",
                  flexShrink: 0,
                }}>
                  {(session.user.username || "U")[0].toUpperCase()}
                </div>

                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text)", letterSpacing: "0.01em" }}>
                  @{session.user.username}
                </span>

                {session.user.role === "admin" && (
                  <a href="/admin" style={{
                    fontSize: 9, fontWeight: 800, padding: "3px 10px", borderRadius: 20,
                    background: "linear-gradient(135deg, var(--primary), var(--primary-dark))",
                    color: "white", textDecoration: "none", letterSpacing: "0.05em",
                    boxShadow: "2px 2px 8px rgba(124,58,237,0.4)",
                  }}>ADMIN</a>
                )}

                <button onClick={() => signOut({ callbackUrl: "/login" })} style={{
                  fontSize: 9, fontWeight: 700, padding: "5px 12px", borderRadius: 20,
                  border: "none", cursor: "pointer",
                  background: "rgba(255,255,255,0.5)",
                  color: "var(--text-muted)",
                  backdropFilter: "blur(8px)",
                  boxShadow: "inset 1px 1px 3px rgba(0,0,0,0.08)",
                  letterSpacing: "0.04em",
                  transition: "all 0.2s",
                }}
                  onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.background = "rgba(220,38,38,0.1)"; (e.target as HTMLButtonElement).style.color = "#dc2626"; }}
                  onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.background = "rgba(255,255,255,0.5)"; (e.target as HTMLButtonElement).style.color = "var(--text-muted)"; }}
                >Logout</button>
              </div>
            ) : (
              <a href="/login" style={{
                fontSize: 11, fontWeight: 800, padding: "8px 20px", borderRadius: 50,
                textDecoration: "none", letterSpacing: "0.05em",
                background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                color: "white",
                boxShadow: "5px 5px 16px rgba(124,58,237,0.4), -3px -3px 8px rgba(255,255,255,0.8), inset 0 1px 0 rgba(255,255,255,0.25)",
                transition: "all 0.2s",
              }}
                onMouseEnter={(e) => { (e.target as HTMLAnchorElement).style.transform = "translateY(-1px)"; (e.target as HTMLAnchorElement).style.boxShadow = "7px 7px 20px rgba(124,58,237,0.5), -4px -4px 10px rgba(255,255,255,0.9)"; }}
                onMouseLeave={(e) => { (e.target as HTMLAnchorElement).style.transform = "translateY(0)"; (e.target as HTMLAnchorElement).style.boxShadow = "5px 5px 16px rgba(124,58,237,0.4), -3px -3px 8px rgba(255,255,255,0.8)"; }}
              >Sign in</a>
            )}

            {/* TabNav — glass pill */}
            <TabNav />
          </div>
        </div>

        {/* CSS Animations */}
        <style>{`
          @keyframes logoShimmer {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
          @keyframes shine {
            0% { left: -75%; }
            100% { left: 150%; }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.6; transform: scale(0.85); }
          }
        `}</style>
      </header>

      {/* ── MAIN ── */}
      <main className="max-w-6xl mx-auto px-6 py-10 flex flex-col gap-8" style={{ alignItems: "center" }}>

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
