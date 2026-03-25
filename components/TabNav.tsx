"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function TabNav() {
  const pathname = usePathname();

  const tabs = [
    { href: "/", label: "Extract" },
    { href: "/library", label: "Library" },
  ];

  return (
    <div
      style={{
        position: "relative",
        display: "inline-flex",
        padding: "5px",
        borderRadius: "50px",
        background: "rgba(255,255,255,0.08)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.15)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.2)",
      }}
    >
      {/* Active tab sliding indicator */}
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        if (!active) return null;
        return (
          <div
            key={tab.href}
            style={{
              position: "absolute",
              top: "5px",
              left: "5px",
              width: `calc(50% - 5px)`,
              height: "calc(100% - 10px)",
              borderRadius: "50px",
              background: "linear-gradient(135deg, #7c3aed, #4f46e5, #7c3aed)",
              backgroundSize: "200% 200%",
              animation: "tabShimmer 3s ease infinite",
              boxShadow: "0 4px 20px rgba(124,58,237,0.5), 0 0 40px rgba(124,58,237,0.2), inset 0 1px 0 rgba(255,255,255,0.3)",
              transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
              zIndex: 0,
            }}
          />
        );
      })}

      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            style={{
              position: "relative",
              zIndex: 1,
              padding: "9px 28px",
              borderRadius: "50px",
              fontSize: "13px",
              fontWeight: active ? 800 : 500,
              fontFamily: "Plus Jakarta Sans, sans-serif",
              color: active ? "#ffffff" : "rgba(255,255,255,0.65)",
              textDecoration: "none",
              transition: "all 0.3s ease",
              letterSpacing: "0.02em",
              textShadow: active ? "0 1px 8px rgba(124,58,237,0.8)" : "none",
            }}
            onMouseEnter={(e) => {
              if (!active) (e.target as HTMLElement).style.color = "#ffffff";
            }}
            onMouseLeave={(e) => {
              if (!active) (e.target as HTMLElement).style.color = "rgba(255,255,255,0.65)";
            }}
          >
            {tab.label}
          </Link>
        );
      })}

      <style>{`
        @keyframes tabShimmer {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </div>
  );
}
