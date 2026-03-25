"use client";
import { useState, useEffect, useCallback } from "react";
import { SavedPrompt } from "@/types/prompt";

const STORAGE_KEY = "promptlens_library";

export function useLocalStorage() {
  const [library, setLibrary] = useState<SavedPrompt[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setLibrary(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load library from localStorage", e);
    }
  }, []);

  const savePrompt = useCallback((prompt: SavedPrompt) => {
    setLibrary((prev) => {
      const updated = [prompt, ...prev];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to save to localStorage", e);
        throw new Error("Storage full. Please delete some prompts.");
      }
      return updated;
    });
  }, []);

  const deletePrompt = useCallback((id: string) => {
    setLibrary((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return { library, savePrompt, deletePrompt };
}
