"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wand2, FolderOpen } from "lucide-react";

export default function TabNav() {
  const pathname = usePathname();

  const tabs = [
    {
      href: "/",
      label: "Extract",
      icon: <Wand2 size={15} strokeWidth={2.2} />,
    },
    {
      href: "/library",
      label: "Library",
      icon: <FolderOpen size={15} strokeWidth={2.2} />,
    },
  ];

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "5px",
        borderRadius: "50px",
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.1)",
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
              color: active ? "#ffffff" : "rgba(226,217,243,0.55)",
              background: active ? "linear-gradient(135deg, #6d28d9, #7c3aed)" : "transparent",
              textDecoration: "none",
              transition: "all 0.25s ease",
              letterSpacing: "0.02em",
              boxShadow: active
                ? "0 0 20px rgba(124,58,237,0.55), 0 0 40px rgba(124,58,237,0.2), inset 0 1px 0 rgba(255,255,255,0.15)"
                : "none",
              border: active ? "1px solid rgba(167,139,250,0.3)" : "1px solid transparent",
            }}
            onMouseEnter={(e) => {
              if (!active) {
                (e.target as HTMLElement).style.color = "#e2d9f3";
                (e.target as HTMLElement).style.background = "rgba(124,58,237,0.08)";
              }
            }}
            onMouseLeave={(e) => {
              if (!active) {
                (e.target as HTMLElement).style.color = "rgba(226,217,243,0.55)";
                (e.target as HTMLElement).style.background = "transparent";
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
