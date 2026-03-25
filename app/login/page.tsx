"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Toast from "@/components/Toast";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    setLoading(true);
    const res = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.ok) {
      router.push("/");
    } else {
      setToast({ message: "Invalid username or password", type: "error" });
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#dde1ec", fontFamily: "Outfit, sans-serif" }}>
      <Header />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
      <div style={{
        width: "100%",
        maxWidth: 400,
        background: "var(--bg)",
        borderRadius: 32,
        boxShadow: "16px 16px 40px var(--sh-dark), -16px -16px 40px var(--sh-light)",
        padding: "40px 36px",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18,
            background: "linear-gradient(135deg, var(--primary), var(--primary-dark))",
            boxShadow: "6px 6px 16px rgba(124,58,237,0.3), -4px -4px 10px rgba(255,255,255,0.8)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px",
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", marginBottom: 4 }}>AmrSabry-prompts</h1>
          <p style={{ fontSize: 12, color: "var(--text-soft)" }}>Sign in to access your library</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="neu-input"
              placeholder="Enter your username"
              autoComplete="username"
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="neu-input"
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !username || !password}
            className="neu-btn neu-btn-primary"
            style={{ width: "100%", justifyContent: "center", padding: "14px", fontSize: 15, borderRadius: 16, marginTop: 4 }}
          >
            {loading ? (
              <div style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", animation: "spin 0.7s linear infinite" }} />
            ) : "Sign In"}
          </button>
        </form>

        <p style={{ textAlign: "center", fontSize: 11, color: "var(--text-soft)", marginTop: 24 }}>
          <a href="/" style={{ color: "var(--text-muted)", textDecoration: "none" }}>← Back to Extract</a>
        </p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
