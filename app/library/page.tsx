/* PromptLens Library - Dark Glassmorphism Premium */
"use client";
import { useState, useEffect, useRef } from "react";
import { Search, X, Edit3, Copy, Wand2, Share2, Trash2 } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import TabNav from "@/components/TabNav";
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
  const aspectRatio = dims ? dims.h / dims.w : 0.5625;

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
        {/* Decorative dots */}
        {[...Array(5)].map((_, i) => (
          <div key={i} style={{
            position: "absolute",
            width: 4, height: 4, borderRadius: "50%",
            background: "rgba(255,255,255,0.3)",
            left: `${15 + i * 18}%`,
            top: `${20 + (i % 2) * 15}%`,
          }} />
        ))}
        {/* Decorative lines */}
        <div style={{ position: "absolute", bottom: 20, left: 20, right: 20, height: 1, background: "rgba(255,255,255,0.1)" }} />
        <div style={{ position: "absolute", bottom: 28, left: 20, right: 60, height: 1, background: "rgba(255,255,255,0.06)" }} />
        <Wand2 size={32} color="rgba(255,255,255,0.25)" strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <div style={{ position: "relative", borderRadius: "18px 18px 0 0", overflow: "hidden" }}>
      <div style={{
        aspectRatio: `1/${aspectRatio}`,
        maxHeight: 220,
      }}>
        <img
          src={imgSrc}
          alt={`Prompt thumbnail`}
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

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #0e0b1f 0%, #1a0f2e 40%, #0f0b22 100%)",
      fontFamily: "Outfit, sans-serif",
      color: "#e2d9f3",
    }}>

      {/* ── DARK HEADER ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 40,
        background: "rgba(14,11,31,0.85)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderBottom: "1px solid rgba(124,58,237,0.2)",
        boxShadow: "0 4px 30px rgba(124,58,237,0.1)",
      }}>
        <div style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "14px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 20,
        }}>

          {/* LEFT ─ Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 11,
              background: "linear-gradient(135deg, #6d28d9, #7c3aed)",
              boxShadow: "0 0 18px rgba(124,58,237,0.5), inset 0 1px 0 rgba(255,255,255,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Wand2 size={17} color="white" strokeWidth={2} />
            </div>
            <div>
              <h1 style={{ fontSize: 17, fontWeight: 900, color: "#ffffff", letterSpacing: "-0.01em", lineHeight: 1 }}>
                PromptLens
              </h1>
              <p style={{ fontSize: 10, color: "rgba(226,217,243,0.4)", fontWeight: 500 }}>
                {library.length} prompt{library.length !== 1 ? "s" : ""} saved
              </p>
            </div>
          </div>

          {/* CENTER ─ TabNav */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1 }}>
            <TabNav />
          </div>

          {/* RIGHT ─ Auth */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            {session ? (
              <>
                {session.user.role === "admin" && (
                  <a href="/admin" style={{
                    fontSize: 9, fontWeight: 800, padding: "3px 10px", borderRadius: 20,
                    background: "linear-gradient(135deg, #6d28d9, #7c3aed)",
                    color: "white", textDecoration: "none", letterSpacing: "0.06em",
                    boxShadow: "0 0 12px rgba(124,58,237,0.4)",
                  }}>ADMIN</a>
                )}
                <div style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "5px 8px 5px 12px",
                  borderRadius: "50px",
                  background: "rgba(124,58,237,0.08)",
                  border: "1px solid rgba(124,58,237,0.18)",
                }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: "50%",
                    background: "linear-gradient(135deg, #6d28d9, #7c3aed)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 800, color: "white",
                    boxShadow: "0 0 8px rgba(124,58,237,0.4)",
                  }}>
                    {(session.user.username || "U")[0].toUpperCase()}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(226,217,243,0.8)" }}>
                    @{session.user.username}
                  </span>
                  <button onClick={() => signOut({ callbackUrl: "/login" })} style={{
                    fontSize: 9, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                    border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer",
                    background: "rgba(255,255,255,0.05)", color: "rgba(226,217,243,0.5)",
                    transition: "all 0.2s",
                  }}
                    onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.color = "#f87171"; }}
                    onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.color = "rgba(226,217,243,0.5)"; }}
                  >Logout</button>
                </div>
              </>
            ) : (
              <a href="/login" style={{
                fontSize: 11, fontWeight: 800, padding: "7px 18px", borderRadius: 50,
                textDecoration: "none", letterSpacing: "0.05em",
                background: "linear-gradient(135deg, #6d28d9, #7c3aed)",
                color: "white",
                boxShadow: "0 0 20px rgba(124,58,237,0.4)",
              }}>Sign in</a>
            )}
          </div>

        </div>
      </header>

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
              color: "rgba(167,139,250,0.6)", pointerEvents: "none",
            }} />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search prompts, languages, users..."
              style={{
                width: "100%", padding: "13px 16px 13px 44px",
                borderRadius: 14, border: "none", outline: "none",
                background: "rgba(255,255,255,0.05)",
                color: "#e2d9f3", fontSize: 13,
                border: "1px solid rgba(124,58,237,0.15)",
                boxShadow: "0 0 0 3px rgba(124,58,237,0.05), inset 0 1px 3px rgba(0,0,0,0.2)",
                fontFamily: "Outfit, sans-serif",
                transition: "all 0.2s",
              }}
              onFocus={(e) => {
                (e.target as HTMLInputElement).style.borderColor = "rgba(124,58,237,0.45)";
                (e.target as HTMLInputElement).style.boxShadow = "0 0 0 3px rgba(124,58,237,0.12), inset 0 1px 3px rgba(0,0,0,0.2)";
              }}
              onBlur={(e) => {
                (e.target as HTMLInputElement).style.borderColor = "rgba(124,58,237,0.15)";
                (e.target as HTMLInputElement).style.boxShadow = "0 0 0 3px rgba(124,58,237,0.05), inset 0 1px 3px rgba(0,0,0,0.2)";
              }}
            />
            {search && (
              <button onClick={() => setSearch("")} style={{
                position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer", color: "rgba(167,139,250,0.5)", padding: 4,
              }}>
                <X size={14} />
              </button>
            )}
          </div>
        )}

        {/* Auth notice */}
        {!session && (
          <div style={{
            background: "rgba(124,58,237,0.08)",
            borderRadius: 20,
            border: "1px solid rgba(124,58,237,0.15)",
            padding: "14px 22px", display: "flex", alignItems: "center", gap: 12,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p style={{ fontSize: 12, color: "rgba(226,217,243,0.6)" }}>
              <a href="/login" style={{ color: "#a78bfa", fontWeight: 700, textDecoration: "none" }}>Sign in</a> to save and manage your prompts.
            </p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: 80 }}>
            <div style={{
              width: 48, height: 48, borderRadius: "50%",
              border: "2px solid rgba(124,58,237,0.2)",
              borderTopColor: "#7c3aed",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto 16px",
              boxShadow: "0 0 20px rgba(124,58,237,0.3)",
            }} />
            <p style={{ fontSize: 13, color: "rgba(226,217,243,0.4)" }}>Loading prompts...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: 80 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
            <p style={{ fontSize: 16, fontWeight: 700, color: "rgba(226,217,243,0.5)" }}>
              {search ? "No results found" : "No prompts yet"}
            </p>
            <p style={{ fontSize: 12, color: "rgba(226,217,243,0.3)", marginTop: 6 }}>
              {search ? `No prompts match "${search}"` : "Extract text from an image to get started."}
            </p>
          </div>
        )}

        {/* ── DARK GLASS CARDS ── */}
        {!loading && filtered.length > 0 && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 24,
            width: "100%",
          }}>
            {filtered.map((prompt) => (
              <div key={prompt.id} style={{
                background: "linear-gradient(160deg, rgba(30,20,60,0.9) 0%, rgba(20,12,45,0.95) 100%)",
                borderRadius: 22,
                border: "1px solid rgba(124,58,237,0.22)",
                boxShadow: "0 8px 40px rgba(0,0,0,0.4), 0 0 30px rgba(124,58,237,0.06), inset 0 1px 0 rgba(255,255,255,0.06)",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                transition: "transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease",
                cursor: "default",
              }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "0 16px 50px rgba(0,0,0,0.5), 0 0 40px rgba(124,58,237,0.12), inset 0 1px 0 rgba(255,255,255,0.08)";
                  (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(124,58,237,0.4)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 40px rgba(0,0,0,0.4), 0 0 30px rgba(124,58,237,0.06), inset 0 1px 0 rgba(255,255,255,0.06)";
                  (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(124,58,237,0.22)";
                }}
              >
                {/* ── IMAGE ── */}
                <ImageBlock prompt={prompt} />

                {/* ── CONTENT ── */}
                <div style={{ padding: "16px 18px 18px", flex: 1, display: "flex", flexDirection: "column" }}>

                  {/* Meta */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span style={{
                        fontSize: 9, fontWeight: 800, padding: "3px 10px", borderRadius: 20,
                        background: "linear-gradient(135deg, #6d28d9, #7c3aed)",
                        color: "white",
                        boxShadow: "0 0 10px rgba(124,58,237,0.35)",
                        letterSpacing: "0.05em",
                      }}>
                        {prompt.language.toUpperCase()}
                      </span>
                      <span style={{ fontSize: 9, color: "rgba(226,217,243,0.45)", fontWeight: 500 }}>
                        @{prompt.userName || "guest"}
                      </span>
                    </div>
                    <span style={{ fontSize: 9, color: "rgba(226,217,243,0.3)" }}>
                      {new Date(prompt.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Prompt text */}
                  <div style={{ flex: 1 }}>
                    <p style={{
                      fontFamily: "JetBrains Mono, monospace",
                      fontSize: 10.5,
                      color: "rgba(226,217,243,0.75)",
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
                      background: "rgba(124,58,237,0.1)",
                      color: "#a78bfa",
                      fontSize: 10, fontWeight: 700,
                      fontFamily: "Outfit, sans-serif",
                      border: "1px solid rgba(124,58,237,0.15)",
                      transition: "all 0.2s",
                    }}
                      onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.background = "rgba(124,58,237,0.2)"; (e.target as HTMLButtonElement).style.color = "#c4b5fd"; }}
                      onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.background = "rgba(124,58,237,0.1)"; (e.target as HTMLButtonElement).style.color = "#a78bfa"; }}
                    >
                      <Copy size={10} strokeWidth={2.5} /> Copy
                    </button>

                    <button onClick={() => handleShare(prompt)} style={{
                      flex: 1, minWidth: 60,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                      padding: "8px 8px", borderRadius: 11, border: "none", cursor: "pointer",
                      background: "rgba(124,58,237,0.1)",
                      color: "#a78bfa",
                      fontSize: 10, fontWeight: 700,
                      fontFamily: "Outfit, sans-serif",
                      border: "1px solid rgba(124,58,237,0.15)",
                      transition: "all 0.2s",
                    }}
                      onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.background = "rgba(124,58,237,0.2)"; (e.target as HTMLButtonElement).style.color = "#c4b5fd"; }}
                      onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.background = "rgba(124,58,237,0.1)"; (e.target as HTMLButtonElement).style.color = "#a78bfa"; }}
                    >
                      <Share2 size={10} strokeWidth={2.5} /> Share
                    </button>

                    {canModify(prompt) && (
                      <>
                        <button onClick={() => setActivePrompt(prompt)} style={{
                          flex: 1, minWidth: 60,
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                          padding: "8px 8px", borderRadius: 11, border: "none", cursor: "pointer",
                          background: "rgba(124,58,237,0.1)",
                          color: "#a78bfa",
                          fontSize: 10, fontWeight: 700,
                          fontFamily: "Outfit, sans-serif",
                          border: "1px solid rgba(124,58,237,0.15)",
                          transition: "all 0.2s",
                        }}
                          onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.background = "rgba(124,58,237,0.2)"; (e.target as HTMLButtonElement).style.color = "#c4b5fd"; }}
                          onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.background = "rgba(124,58,237,0.1)"; (e.target as HTMLButtonElement).style.color = "#a78bfa"; }}
                        >
                          <Edit3 size={10} strokeWidth={2.5} /> Edit
                        </button>
                        <button onClick={() => handleDelete(prompt.id)} style={{
                          flex: 1, minWidth: 60,
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                          padding: "8px 8px", borderRadius: 11, border: "none", cursor: "pointer",
                          background: "rgba(239,68,68,0.08)",
                          color: "rgba(252,165,165,0.7)",
                          fontSize: 10, fontWeight: 700,
                          fontFamily: "Outfit, sans-serif",
                          border: "1px solid rgba(239,68,68,0.12)",
                          transition: "all 0.2s",
                        }}
                          onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.background = "rgba(239,68,68,0.15)"; (e.target as HTMLButtonElement).style.color = "#fca5a5"; }}
                          onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.background = "rgba(239,68,68,0.08)"; (e.target as HTMLButtonElement).style.color = "rgba(252,165,165,0.7)"; }}
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
          <p style={{ textAlign: "center", fontSize: 11, color: "rgba(226,217,243,0.25)", paddingBottom: 20 }}>
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
