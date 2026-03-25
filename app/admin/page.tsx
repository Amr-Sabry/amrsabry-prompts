"use client";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Toast from "@/components/Toast";

interface User { id: string; username: string; role: string; createdAt: string; }

export default function AdminPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUser, setNewUser] = useState({ username: "", password: "", role: "user" });
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    const res = await fetch("/api/users");
    if (res.ok) setUsers(await res.json());
    setLoading(false);
  };

  useEffect(() => { loadUsers(); }, []);

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUser),
    });
    if (res.ok) {
      setToast({ message: `User "${newUser.username}" created!`, type: "success" });
      setNewUser({ username: "", password: "", role: "user" });
      loadUsers();
    } else {
      const err = await res.json();
      setToast({ message: err.error || "Failed", type: "error" });
    }
  };

  const deleteUser = async (id: string, username: string) => {
    if (!confirm(`Delete user "${username}"?`)) return;
    const res = await fetch("/api/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setToast({ message: "User deleted.", type: "info" });
      loadUsers();
    }
  };

  if (!session) return <div style={{ padding: 40, textAlign: "center", color: "var(--text)" }}>Loading...</div>;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)", fontFamily: "Outfit, sans-serif" }}>
      <header style={{
        position: "sticky", top: 0, zIndex: 40,
        background: "rgba(221,225,236,0.9)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(163,177,198,0.3)",
      }}>
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div style={{
              width: 40, height: 40, borderRadius: 11,
              background: "linear-gradient(135deg, var(--primary), var(--primary-dark))",
              boxShadow: "4px 4px 12px rgba(124,58,237,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div>
              <h1 style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>Admin Panel</h1>
              <p style={{ fontSize: 10, color: "var(--text-soft)" }}>Manage users & access</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>@{session.user.username}</span>
            <button onClick={() => signOut({ callbackUrl: "/login" })} className="neu-btn neu-btn-sm">Sign Out</button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12" style={{ display: "flex", flexDirection: "column", gap: 28 }}>

        {/* Create User */}
        <div style={{ background: "var(--bg)", borderRadius: 28, boxShadow: "10px 10px 24px var(--sh-dark), -10px -10px 24px var(--sh-light)", padding: 28 }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, color: "var(--text)", marginBottom: 20 }}>Create New User</h2>
          <form onSubmit={createUser} style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
            <div style={{ flex: "1 1 180px" }}>
              <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase" }}>Username</label>
              <input value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} className="neu-input" placeholder="username" required />
            </div>
            <div style={{ flex: "1 1 180px" }}>
              <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase" }}>Password</label>
              <input type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} className="neu-input" placeholder="min 6 chars" required minLength={6} />
            </div>
            <div style={{ flex: "0 0 140px" }}>
              <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase" }}>Role</label>
              <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })} className="neu-input" style={{ padding: "10px 14px" }}>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button type="submit" className="neu-btn neu-btn-primary" style={{ flex: "0 0 auto", padding: "11px 22px" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Create
            </button>
          </form>
        </div>

        {/* Users List */}
        <div style={{ background: "var(--bg)", borderRadius: 28, boxShadow: "10px 10px 24px var(--sh-dark), -10px -10px 24px var(--sh-light)", padding: 28 }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, color: "var(--text)", marginBottom: 20 }}>Registered Users ({users.length})</h2>
          {loading ? (
            <div style={{ textAlign: "center", padding: 32, color: "var(--text-soft)" }}>Loading...</div>
          ) : users.length === 0 ? (
            <div style={{ textAlign: "center", padding: 32, color: "var(--text-soft)" }}>No users yet.</div>
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
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>@{user.username}</span>
                    <span style={{
                      marginLeft: 8, fontSize: 10, fontWeight: 700,
                      padding: "2px 10px", borderRadius: 20,
                      background: user.role === "admin" ? "linear-gradient(135deg, var(--primary), var(--primary-dark))" : "var(--bg)",
                      color: user.role === "admin" ? "white" : "var(--text-muted)",
                      boxShadow: user.role !== "admin" ? "2px 2px 6px var(--sh-dark), -2px -2px 6px var(--sh-light)" : "2px 2px 6px rgba(124,58,237,0.3)",
                    }}>
                      {user.role.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 10, color: "var(--text-soft)" }}>{new Date(user.createdAt).toLocaleDateString()}</span>
                    <button onClick={() => deleteUser(user.id, user.username)} className="neu-btn neu-btn-sm" style={{ color: "var(--danger)", gap: 4 }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
