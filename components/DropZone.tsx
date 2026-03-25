"use client";
import { useState, useRef } from "react";
import { UploadCloud } from "lucide-react";

interface DropZoneProps {
  onFile: (file: File) => void;
  disabled?: boolean;
}

export default function DropZone({ onFile, disabled }: DropZoneProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) onFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFile(file);
  };

  return (
    <div
      className={`
        relative w-full py-20 px-8 flex flex-col items-center justify-center gap-5 cursor-pointer
        transition-all duration-200 select-none
        ${dragging ? "scale-[1.01]" : "scale-100"}
      `}
      style={{
        background: "var(--bg)",
        borderRadius: "28px",
        boxShadow: dragging
          ? "inset 6px 6px 16px var(--shadow-dark), inset -6px -6px 16px var(--shadow-light), 0 0 0 2px var(--primary-glow)"
          : "inset 5px 5px 14px var(--shadow-dark), inset -5px -5px 14px var(--shadow-light)",
      }}
      onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={(e) => { e.preventDefault(); setDragging(false); }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />

      {/* Icon bubble */}
      <div
        className="w-20 h-20 flex items-center justify-center rounded-3xl transition-all duration-200"
        style={{
          background: dragging
            ? "linear-gradient(135deg, var(--primary), var(--primary-hover))"
            : "var(--bg)",
          boxShadow: dragging
            ? "8px 8px 18px rgba(124,58,237,0.4), -4px -4px 10px var(--shadow-light)"
            : "8px 8px 18px var(--shadow-dark), -8px -8px 18px var(--shadow-light)",
        }}
      >
        <UploadCloud
          size={36}
          strokeWidth={1.5}
          style={{ color: dragging ? "#fff" : "var(--primary)" }}
        />
      </div>

      {/* Text */}
      <div className="text-center space-y-1">
        <p
          className="text-base font-bold"
          style={{ color: "var(--text)", fontFamily: "Plus Jakarta Sans, sans-serif" }}
        >
          {dragging ? "Drop it!" : "Drop an image or click to browse"}
        </p>
        <p
          className="text-sm font-medium"
          style={{ color: "var(--text-soft)", fontFamily: "Plus Jakarta Sans, sans-serif" }}
        >
          PNG, JPG, WEBP, GIF, BMP
        </p>
      </div>
    </div>
  );
}
