"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wand2, FolderOpen } from "lucide-react";

export default function TabNav() {
  const pathname = usePathname();

  const tabs = [
    { href: "/", label: "Extract", icon: <Wand2 size={14} strokeWidth={2.5} /> },
    { href: "/library", label: "Library", icon: <FolderOpen size={14} strokeWidth={2.5} /> },
  ];

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0,
        padding: "5px",
        borderRadius: "50px",
        background: "#dde1ec",
        boxShadow: "inset 4px 4px 10px rgba(163,177,198,0.6), inset -4px -4px 10px rgba(255,255,255,0.9)",
      }}
    >
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "9px 22px",
              borderRadius: "50px",
              fontSize: "13px",
              fontWeight: active ? 800 : 600,
              fontFamily: "Outfit, sans-serif",
              color: active ? "#ffffff" : "#5c6478",
              background: active
                ? "linear-gradient(135deg, #7c3aed, #6d28d9)"
                : "transparent",
              textDecoration: "none",
              transition: "all 0.25s ease",
              letterSpacing: "0.02em",
              boxShadow: active
                ? "4px 4px 10px rgba(124,58,237,0.35), -3px -3px 8px rgba(255,255,255,0.9)"
                : "none",
            }}
            onMouseEnter={(e) => {
              if (!active) {
                (e.target as HTMLElement).style.color = "#1e2130";
              }
            }}
            onMouseLeave={(e) => {
              if (!active) {
                (e.target as HTMLElement).style.color = "#5c6478";
              }
            }}
          >
            {tab.icon}
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
