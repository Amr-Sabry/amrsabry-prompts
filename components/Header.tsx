"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wand2, FolderOpen } from "lucide-react";
import { useSession, signOut } from "next-auth/react";

export default function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const tabs = [
    { href: "/", label: "Extract", icon: <Wand2 size={14} strokeWidth={2.5} /> },
    { href: "/library", label: "Library", icon: <FolderOpen size={14} strokeWidth={2.5} /> },
  ];

  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 40,
      width: "100vw",
      background: "rgba(221,225,236,0.92)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      boxShadow: "0 8px 32px rgba(163,177,198,0.35), 0 1px 0 rgba(255,255,255,0.8)",
      borderRadius: "0 0 28px 28px",
    }}>
      <div style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: "14px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
      }}>

        {/* LEFT ─ Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: "linear-gradient(145deg, #e8ecf4, #cdd2df)",
            boxShadow: "4px 4px 10px rgba(163,177,198,0.72), -3px -3px 8px rgba(255,255,255,0.95)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9,
              background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
              boxShadow: "3px 3px 7px rgba(124,58,237,0.4), -2px -2px 5px rgba(139,92,246,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Wand2 size={14} color="white" strokeWidth={2.2} />
            </div>
          </div>
          <div>
            <h1 style={{ fontFamily: '"Orbitron", sans-serif', fontSize: 14, fontWeight: 900, color: "#1e2130", letterSpacing: "0.04em", lineHeight: 1 }}>
              AmrSabry-prompts
            </h1>
            <p style={{ fontSize: 9, color: "#8891a5", fontWeight: 500 }}>
              Extract · Edit · Save
            </p>
          </div>
        </div>

        {/* CENTER ─ TabNav */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1 }}>
          <div style={{
            display: "inline-flex", alignItems: "center",
            padding: "4px",
            borderRadius: 50,
            background: "#dde1ec",
            boxShadow: "inset 3px 3px 8px rgba(163,177,198,0.6), inset -3px -3px 8px rgba(255,255,255,0.9)",
          }}>
            {tabs.map((tab) => {
              const active = pathname === tab.href;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "8px 18px",
                    borderRadius: "50px",
                    fontSize: "12px",
                    fontWeight: active ? 800 : 600,
                    fontFamily: "Outfit, sans-serif",
                    color: active ? "#ffffff" : "#5c6478",
                    background: active ? "linear-gradient(135deg, #7c3aed, #6d28d9)" : "transparent",
                    textDecoration: "none",
                    transition: "all 0.25s ease",
                    letterSpacing: "0.02em",
                    whiteSpace: "nowrap",
                    boxShadow: active
                      ? "3px 3px 8px rgba(124,58,237,0.35), -2px -2px 6px rgba(255,255,255,0.9)"
                      : "none",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) (e.target as HTMLElement).style.color = "#1e2130";
                  }}
                  onMouseLeave={(e) => {
                    if (!active) (e.target as HTMLElement).style.color = "#5c6478";
                  }}
                >
                  {tab.icon}
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* RIGHT ─ Auth */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {session ? (
            <>
              {session.user.role === "admin" && (
                <a href="/admin" style={{
                  fontSize: 9, fontWeight: 800, padding: "3px 9px", borderRadius: 20,
                  background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
                  color: "white", textDecoration: "none", letterSpacing: "0.06em",
                  boxShadow: "3px 3px 8px rgba(124,58,237,0.35), -2px -2px 6px rgba(255,255,255,0.8)",
                  whiteSpace: "nowrap",
                }}>ADMIN</a>
              )}
              <div style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "4px 6px 4px 10px",
                borderRadius: 50,
                background: "#dde1ec",
                boxShadow: "3px 3px 8px rgba(163,177,198,0.6), -3px -3px 8px rgba(255,255,255,0.9)",
              }}>
                <div style={{
                  width: 26, height: 26, borderRadius: "50%",
                  background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontWeight: 800, color: "white",
                  boxShadow: "2px 2px 5px rgba(124,58,237,0.35)",
                  flexShrink: 0,
                }}>
                  {(session.user.username || "U")[0].toUpperCase()}
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#1e2130", whiteSpace: "nowrap" }}>
                  @{session.user.username}
                </span>
                <button onClick={() => signOut({ callbackUrl: "/login" })} style={{
                  fontSize: 9, fontWeight: 700, padding: "3px 9px", borderRadius: 20,
                  border: "none", cursor: "pointer",
                  background: "#dde1ec",
                  color: "#5c6478",
                  boxShadow: "2px 2px 5px rgba(163,177,198,0.6), -2px -2px 5px rgba(255,255,255,0.9)",
                  transition: "all 0.2s",
                  whiteSpace: "nowrap",
                }}
                  onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.color = "#dc2626"; }}
                  onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.color = "#5c6478"; }}
                >Logout</button>
              </div>
            </>
          ) : (
            <a href="/login" style={{
              fontSize: 11, fontWeight: 800, padding: "8px 18px", borderRadius: 50,
              textDecoration: "none", letterSpacing: "0.05em",
              background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
              color: "white",
              boxShadow: "4px 4px 12px rgba(124,58,237,0.35), -3px -3px 8px rgba(255,255,255,0.8)",
              transition: "all 0.2s",
              whiteSpace: "nowrap",
            }}
              onMouseEnter={(e) => { (e.target as HTMLAnchorElement).style.transform = "translateY(-1px)"; }}
              onMouseLeave={(e) => { (e.target as HTMLAnchorElement).style.transform = "translateY(0)"; }}
            >Sign in</a>
          )}
        </div>

      </div>
    </header>
  );
}
