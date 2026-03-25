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
    <nav
      style={{
        display: "flex",
        gap: "6px",
        padding: "5px",
        borderRadius: "16px",
        background: "var(--bg)",
        boxShadow:
          "inset 3px 3px 8px var(--shadow-dark), inset -3px -3px 8px var(--shadow-light)",
      }}
    >
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            style={{
              padding: "8px 20px",
              borderRadius: "12px",
              fontSize: "13px",
              fontWeight: active ? 700 : 500,
              fontFamily: "Plus Jakarta Sans, sans-serif",
              color: active ? "white" : "var(--text-muted)",
              background: active
                ? "linear-gradient(135deg, var(--primary), var(--primary-hover))"
                : "transparent",
              boxShadow: active
                ? "3px 3px 8px rgba(124,58,237,0.35), -2px -2px 6px var(--shadow-light)"
                : "none",
              textDecoration: "none",
              transition: "all 0.2s ease",
            }}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
