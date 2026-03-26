import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { SavedPrompt } from "@/types/prompt";

const PROMPTS_GIST_URL = process.env.PROMPTS_GIST_URL || "https://api.github.com/gists/a1813d8fccf42a2e3107143e0bd127a3";
const GH_TOKEN = process.env.GH_TOKEN!;

const ghHeaders = {
  Authorization: `Bearer ${GH_TOKEN}`,
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
};

// Get prompts with retry — returns current state or empty array on failure
async function getPrompts(): Promise<SavedPrompt[]> {
  try {
    const res = await fetch(PROMPTS_GIST_URL, {
      headers: ghHeaders,
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    const content = data.files?.["prompts.json"]?.content;
    if (!content) return [];
    return JSON.parse(content) as SavedPrompt[];
  } catch {
    return [];
  }
}

// Write prompts to Gist with retry
async function writePrompts(prompts: SavedPrompt[]): Promise<{ ok: boolean; error?: string }> {
  const payload = JSON.stringify(prompts, null, 2);
  // GitHub Gist has 8MB limit — warn if approaching
  if (payload.length > 7_000_000) {
    return { ok: false, error: "Library is too large to save. Please delete some prompts." };
  }

  let lastError = "";
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(PROMPTS_GIST_URL, {
        method: "PATCH",
        headers: { ...ghHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ files: { "prompts.json": { content: payload } } }),
      });
      if (res.ok) return { ok: true };
      lastError = `Attempt ${attempt + 1}: ${res.status}`;
      // If conflict (409), wait and retry — another write might have happened
      if (res.status === 409) await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    } catch (err) {
      lastError = `Attempt ${attempt + 1}: ${String(err)}`;
    }
  }
  return { ok: false, error: lastError };
}

// GET /api/prompts — anyone can read (guest too)
export async function GET() {
  const prompts = await getPrompts();
  return NextResponse.json(prompts);
}

// POST /api/prompts — logged-in users only
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }

  let body: { action: string; prompt?: Partial<SavedPrompt> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { action, prompt } = body;

  if (!prompt?.id) {
    return NextResponse.json({ error: "Prompt ID is required" }, { status: 400 });
  }

  // ── SAVE: create new prompt ─────────────────────────────────────────────────
  if (action === "save") {
    if (!prompt.plainText) {
      return NextResponse.json({ error: "plainText is required" }, { status: 400 });
    }
    const newPrompt: SavedPrompt = {
      id: prompt.id || (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`),
      plainText: prompt.plainText,
      jsonText: prompt.jsonText || JSON.stringify({ text: prompt.plainText, language: prompt.language || "eng", confidence: 0, format: "plain" }, null, 2),
      imageThumbnail: prompt.imageThumbnail || "",
      language: prompt.language || "eng",
      confidence: prompt.confidence ?? 0,
      createdAt: new Date().toISOString(),
      userId: session.user.id,
      userName: session.user.username,
    };
    const prompts = await getPrompts();
    prompts.unshift(newPrompt);
    const result = await writePrompts(prompts);
    if (!result.ok) return NextResponse.json({ error: result.error || "Save failed" }, { status: 500 });
    return NextResponse.json({ ok: true, saved: newPrompt });

  // ── UPDATE: edit existing prompt ────────────────────────────────────────────
  } else if (action === "update") {
    const prompts = await getPrompts();
    const idx = prompts.findIndex((p) => p.id === prompt.id);
    if (idx === -1) {
      return NextResponse.json({ error: "Prompt not found — it may have been deleted" }, { status: 404 });
    }
    if (prompts[idx].userId !== session.user.id && session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    // Preserve immutable fields from the stored prompt
    const stored = prompts[idx];
    prompts[idx] = {
      ...stored,
      ...prompt,
      id: stored.id,
      userId: stored.userId,
      userName: stored.userName,
      createdAt: stored.createdAt,
    };
    const result = await writePrompts(prompts);
    if (!result.ok) return NextResponse.json({ error: result.error || "Update failed" }, { status: 500 });
    return NextResponse.json({ ok: true, updated: prompts[idx] });

  // ── DELETE: remove prompt ───────────────────────────────────────────────────
  } else if (action === "delete") {
    const prompts = await getPrompts();
    const idx = prompts.findIndex((p) => p.id === prompt.id);
    if (idx === -1) {
      return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
    }
    if (prompts[idx].userId !== session.user.id && session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    prompts.splice(idx, 1);
    const result = await writePrompts(prompts);
    if (!result.ok) return NextResponse.json({ error: result.error || "Delete failed" }, { status: 500 });
    return NextResponse.json({ ok: true });

  // ── INVALID ACTION ─────────────────────────────────────────────────────────
  } else {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }
}
