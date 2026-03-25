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
        padding: "4px",
        borderRadius: "50px",
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(124,58,237,0.18)",
        gap: "2px",
      }}
    >
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            style={{
              padding: "7px 22px",
              borderRadius: "50px",
              fontSize: "12px",
              fontWeight: active ? 800 : 500,
              fontFamily: "Outfit, sans-serif",
              color: active ? "#ffffff" : "rgba(226,217,243,0.5)",
              background: active ? "linear-gradient(135deg, #6d28d9, #7c3aed)" : "transparent",
              textDecoration: "none",
              transition: "all 0.25s ease",
              letterSpacing: "0.02em",
              boxShadow: active ? "0 0 16px rgba(124,58,237,0.5), 0 0 30px rgba(124,58,237,0.2)" : "none",
            }}
            onMouseEnter={(e) => {
              if (!active) (e.target as HTMLElement).style.color = "#e2d9f3";
            }}
            onMouseLeave={(e) => {
              if (!active) (e.target as HTMLElement).style.color = "rgba(226,217,243,0.5)";
            }}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
