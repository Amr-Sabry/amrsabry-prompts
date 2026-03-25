"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Header from "@/components/Header";
import { Users, Trash2, Plus, UserCheck } from "lucide-react";
import Toast from "@/components/Toast";

interface User { id: string; username: string; role: string; createdAt: string; }

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUser, setNewUser] = useState({ username: "", password: "", role: "user" });
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") return;
    if (status === "authenticated" && session?.user?.role !== "admin") return;
    fetch("/api/users")
      .then((r) => r.json())
      .then((data) => setUsers(data))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, [status, session]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid rgba(124,58,237,0.2)", borderTopColor: "var(--primary)", animation: "spin 0.7s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ color: "var(--text-soft)", fontFamily: "Outfit" }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)", fontFamily: "Outfit" }}>
        <div style={{ textAlign: "center", padding: 40 }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>Access Denied</p>
          <p style={{ fontSize: 12, color: "var(--text-soft)", marginTop: 8 }}>You need admin privileges to view this page.</p>
          <a href="/" className="neu-btn neu-btn-sm" style={{ display: "inline-block", marginTop: 20, textDecoration: "none" }}>Back to Home</a>
        </div>
      </div>
    );
  }

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.username || !newUser.password) return;
    setCreating(true);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUser),
    });
    setCreating(false);
    if (res.ok) {
      setToast({ message: `User "${newUser.username}" created!`, type: "success" });
      setNewUser({ username: "", password: "", role: "user" });
      fetch("/api/users").then((r) => r.json()).then((data) => setUsers(data));
    } else {
      const err = await res.json();
      setToast({ message: err.error || "Failed", type: "error" });
    }
  };

  const deleteUser = async (id: string, username: string) => {
    if (!confirm(`Delete user "@${username}"?`)) return;
    const res = await fetch("/api/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setToast({ message: "User deleted.", type: "info" });
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } else {
      setToast({ message: "Failed to delete.", type: "error" });
    }
  };

  const cardShadow = "10px 10px 24px var(--sh-dark), -10px -10px 24px var(--sh-light)";
  const insetShadow = "inset 4px 4px 10px var(--sh-dark), inset -4px -4px 10px var(--sh-light)";

  return (
    <div style={{ minHeight: "100vh", background: "#dde1ec", fontFamily: "Outfit, sans-serif" }}>
      <Header />
      <main style={{ maxWidth: 800, margin: "0 auto", padding: "36px 24px 60px", display: "flex", flexDirection: "column", gap: 28 }}>

        {/* Create User */}
        <div style={{ background: "var(--bg)", borderRadius: 28, boxShadow: cardShadow, padding: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <Plus size={16} color="var(--primary)" />
            <h2 style={{ fontSize: 14, fontWeight: 800, color: "var(--text)" }}>Create New User</h2>
          </div>
          <form onSubmit={createUser} style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
            <div style={{ flex: "1 1 160px" }}>
              <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Username</label>
              <input
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                className="neu-input"
                placeholder="username"
                required
                minLength={3}
              />
            </div>
            <div style={{ flex: "1 1 160px" }}>
              <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Password</label>
              <input
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                className="neu-input"
                placeholder="min 6 chars"
                required
                minLength={6}
              />
            </div>
            <div style={{ flex: "0 0 130px" }}>
              <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Role</label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                className="neu-input"
                style={{ padding: "10px 14px" }}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button type="submit" disabled={creating} className="neu-btn neu-btn-primary" style={{ flex: "0 0 auto", padding: "11px 22px" }}>
              {creating ? (
                <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", animation: "spin 0.7s linear infinite" }} />
              ) : (
                <><Plus size={13} /> Create</>
              )}
            </button>
          </form>
        </div>

        {/* Users List */}
        <div style={{ background: "var(--bg)", borderRadius: 28, boxShadow: cardShadow, padding: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <Users size={16} color="var(--primary)" />
            <h2 style={{ fontSize: 14, fontWeight: 800, color: "var(--text)" }}>
              Registered Users <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-soft)" }}>({users.length})</span>
            </h2>
          </div>

          {users.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "var(--text-soft)", background: "var(--bg)", borderRadius: 16, boxShadow: insetShadow }}>
              <UserCheck size={32} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
              <p style={{ fontSize: 13, fontWeight: 600 }}>No users yet</p>
              <p style={{ fontSize: 11, marginTop: 4 }}>Create the first user above.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {users.map((user) => (
                <div key={user.id} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "14px 18px",
                  background: "var(--bg)", borderRadius: 16,
                  boxShadow: "4px 4px 10px var(--sh-dark), -4px -4px 10px var(--sh-light)",
                  flexWrap: "wrap", gap: 10,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: "var(--bg)",
                      boxShadow: "2px 2px 6px var(--sh-dark), -2px -2px 6px var(--sh-light)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 13, fontWeight: 800, color: "var(--primary)",
                    }}>
                      {user.username[0].toUpperCase()}
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>@{user.username}</p>
                      <p style={{ fontSize: 10, color: "var(--text-soft)" }}>{new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{
                      fontSize: 9, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                      background: user.role === "admin" ? "linear-gradient(135deg, var(--primary), var(--primary-dark))" : "var(--bg)",
                      color: user.role === "admin" ? "white" : "var(--text-muted)",
                      boxShadow: user.role !== "admin" ? "2px 2px 6px var(--sh-dark), -2px -2px 6px var(--sh-light)" : "2px 2px 6px rgba(124,58,237,0.3)",
                    }}>
                      {user.role.toUpperCase()}
                    </span>
                    <button
                      onClick={() => deleteUser(user.id, user.username)}
                      className="neu-btn"
                      style={{ width: 32, height: 32, padding: 0, borderRadius: 8, color: "var(--danger)", gap: 0 }}
                    >
                      <Trash2 size={12} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
