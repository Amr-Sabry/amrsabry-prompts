/* PromptLens Library - Built with ❤️ by AmrSabry-Ai */
"use client";
import { useState, useEffect } from "react";
import { Search, X, Edit3, Copy, Wand2 } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import TabNav from "@/components/TabNav";
import Toast from "@/components/Toast";
import EditModal from "@/components/EditModal";
import { SavedPrompt } from "@/types/prompt";

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
      .then((data) => { if (Array.isArray(data)) setLibrary(data); })
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
      <header style={{ position: "sticky", top: 0, zIndex: 40, background: "rgba(221,225,236,0.9)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(163,177,198,0.3)" }}>
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div style={{ width: 42, height: 42, borderRadius: 12, background: "linear-gradient(135deg, var(--primary), var(--primary-dark))", boxShadow: "5px 5px 14px rgba(124,58,237,0.3), -3px -3px 8px rgba(255,255,255,0.8)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Wand2 size={18} color="white" strokeWidth={1.8} />
            </div>
            <div>
              <h1 style={{ fontSize: 17, fontWeight: 800, color: "var(--text)" }}>Library</h1>
              <p style={{ fontSize: 10, color: "var(--text-soft)" }}>{library.length} prompt{library.length !== 1 ? "s" : ""} saved</p>
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
                  <a href="/admin" style={{ fontSize: 9, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "var(--bg)", color: "var(--text-muted)", textDecoration: "none", boxShadow: "2px 2px 6px var(--sh-dark), -2px -2px 6px var(--sh-light)" }}>Admin</a>
                )}
                <button onClick={() => signOut({ callbackUrl: "/login" })} className="neu-btn neu-btn-sm" style={{ fontSize: 10, padding: "5px 10px" }}>Logout</button>
              </>
            ) : (
              <a href="/login" className="neu-btn neu-btn-sm" style={{ fontSize: 10, padding: "5px 10px", textDecoration: "none" }}>Login</a>
            )}
            <TabNav />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 flex flex-col gap-8">

        {/* Search */}
        {library.length > 0 && (
          <div style={{ position: "relative" }}>
            <Search size={16} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--text-soft)" }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="neu-input"
              placeholder="Search prompts, languages, users..."
              style={{ paddingLeft: 40 }}
            />
          </div>
        )}

        {/* Auth notice for guests */}
        {!session && (
          <div style={{
            background: "var(--bg)", borderRadius: 20,
            boxShadow: "inset 4px 4px 10px var(--sh-dark), inset -4px -4px 10px var(--sh-light)",
            padding: "16px 20px", display: "flex", alignItems: "center", gap: 12,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p style={{ fontSize: 12, color: "var(--text-soft)" }}>
              <a href="/login" style={{ color: "var(--primary)", fontWeight: 700, textDecoration: "none" }}>Sign in</a> to save and manage your prompts.
              You can still browse and copy existing prompts.
            </p>
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "var(--text-soft)" }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60 }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: "var(--text-muted)" }}>No prompts found</p>
            <p style={{ fontSize: 12, color: "var(--text-soft)", marginTop: 6 }}>
              {search ? "Try a different search." : "Extract text from an image to get started."}
            </p>
          </div>
        ) : (
          <div style={{ columns: 260, columnGap: 20 }}>
            {filtered.map((prompt) => (
              <div key={prompt.id} style={{
                breakInside: "avoid",
                marginBottom: 20,
                background: "var(--bg)",
                borderRadius: 24,
                boxShadow: "8px 8px 20px var(--sh-dark), -8px -8px 20px var(--sh-light)",
                overflow: "hidden",
              }}>
                {/* Thumbnail */}
                {prompt.imageThumbnail && (
                  <div style={{ background: "var(--bg-deep)", padding: "12px 12px 0" }}>
                    <img
                      src={prompt.imageThumbnail}
                      alt="Prompt thumbnail"
                      style={{ width: "100%", borderRadius: 14, objectFit: "cover", maxHeight: 260, display: "block" }}
                    />
                  </div>
                )}
                {/* Content */}
                <div style={{ padding: 18 }}>
                  {/* Meta row */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 6 }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span style={{
                        fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                        background: "linear-gradient(135deg, var(--primary), var(--primary-dark))",
                        color: "white",
                      }}>
                        {prompt.language.toUpperCase()}
                      </span>
                      <span style={{ fontSize: 9, color: "var(--text-soft)", fontWeight: 500 }}>
                        @{prompt.userName || "guest"}
                      </span>
                    </div>
                    <span style={{ fontSize: 9, color: "var(--text-soft)" }}>
                      {new Date(prompt.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {/* Text preview */}
                  <p style={{
                    fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "var(--text)",
                    lineHeight: 1.7, whiteSpace: "pre-wrap", wordBreak: "break-word",
                    display: "-webkit-box", WebkitLineClamp: 5,
                    WebkitBoxOrient: "vertical", overflow: "hidden",
                  }}>
                    {prompt.plainText}
                  </p>
                  {/* Actions */}
                  <div style={{ display: "flex", gap: 6, marginTop: 14, flexWrap: "wrap" }}>
                    <button onClick={() => handleCopy(prompt.plainText, "Text")} className="neu-btn neu-btn-sm" style={{ gap: 4 }}>
                      <Copy size={10} strokeWidth={2} /> Copy
                    </button>
                    <button onClick={() => handleShare(prompt)} className="neu-btn neu-btn-sm" style={{ gap: 4 }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                      Share
                    </button>
                    {canModify(prompt) && (
                      <>
                        <button onClick={() => setActivePrompt(prompt)} className="neu-btn neu-btn-sm" style={{ gap: 4 }}>
                          <Edit3 size={10} strokeWidth={2} /> Edit
                        </button>
                        <button onClick={() => handleDelete(prompt.id)} className="neu-btn neu-btn-sm" style={{ color: "var(--danger)", gap: 4 }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {activePrompt && (
        <EditModal
          prompt={activePrompt}
          onClose={() => setActivePrompt(null)}
          onSave={handleSave}
        />
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToToast(null)} />}
    </div>
  );
}


