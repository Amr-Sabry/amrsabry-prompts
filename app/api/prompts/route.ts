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

// Validate that raw content is valid JSON with an array
function parsePromptsContent(content: string): SavedPrompt[] | null {
  if (!content || typeof content !== "string") return null;
  try {
    const parsed = JSON.parse(content);
    if (!Array.isArray(parsed)) return null;
    return parsed as SavedPrompt[];
  } catch {
    return null;
  }
}

// Read current prompts — returns empty array if corrupted or missing
async function readPrompts(): Promise<SavedPrompt[]> {
  try {
    const res = await fetch(PROMPTS_GIST_URL, { headers: ghHeaders, cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    const content = data.files?.["prompts.json"]?.content;
    if (!content) return [];
    const prompts = parsePromptsContent(content);
    return prompts ?? [];
  } catch {
    return [];
  }
}

// Safely write prompts — returns { ok: true } or { ok: false, error }
async function writePromptsSafe(prompts: SavedPrompt[]): Promise<{ ok: boolean; error?: string }> {
  const payload = JSON.stringify(prompts, null, 2);

  // Guard: if the resulting payload is NOT valid JSON (should never happen), refuse
  try {
    JSON.parse(payload);
  } catch {
    return { ok: false, error: "Failed to serialize prompts. Data too large or malformed." };
  }

  // Size guard — GitHub Gist has 8MB soft limit
  if (payload.length > 7_000_000) {
    return { ok: false, error: "Library is too large. Please delete some prompts." };
  }

  const res = await fetch(PROMPTS_GIST_URL, {
    method: "PATCH",
    headers: { ...ghHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({ files: { "prompts.json": { content: payload } } }),
  });

  if (!res.ok) {
    return { ok: false, error: `GitHub error: ${res.status}` };
  }
  return { ok: true };
}

// ─── GET ──────────────────────────────────────────────────────────────────────
export async function GET() {
  const prompts = await readPrompts();
  return NextResponse.json(prompts);
}

// ─── POST ─────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Login required" }, { status: 401 });

  let body: { action: string; prompt?: Partial<SavedPrompt> & { id?: string } };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { action, prompt } = body;

  if (!prompt?.id) return NextResponse.json({ error: "Prompt ID is required" }, { status: 400 });
  if (!["save", "update", "delete"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  // Read current state ONCE
  const prompts = await readPrompts();

  // Validate — if prompts is somehow not an array, reset to empty
  if (!Array.isArray(prompts)) {
    console.error("[POST /api/prompts] prompts is not an array, resetting to []");
  }

  const user = session.user as { id: string; username: string; role: string };

  if (action === "save") {
    if (!prompt.plainText) return NextResponse.json({ error: "plainText is required" }, { status: 400 });
    const newPrompt: SavedPrompt = {
      id: prompt.id || (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`),
      plainText: prompt.plainText,
      jsonText: prompt.jsonText || JSON.stringify({ text: prompt.plainText, language: prompt.language || "eng", confidence: 0, format: "plain" }, null, 2),
      imageThumbnail: prompt.imageThumbnail || "",
      language: prompt.language || "eng",
      confidence: prompt.confidence ?? 0,
      createdAt: new Date().toISOString(),
      userId: user.id,
      userName: user.username,
    };
    prompts.unshift(newPrompt);
  } else if (action === "update") {
    const idx = prompts.findIndex((p) => p.id === prompt.id);
    if (idx === -1) return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
    if (prompts[idx].userId !== user.id && user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    // Preserve immutable fields
    prompts[idx] = {
      ...prompts[idx],
      ...prompt,
      id: prompts[idx].id,
      userId: prompts[idx].userId,
      userName: prompts[idx].userName,
      createdAt: prompts[idx].createdAt,
    };
  } else if (action === "delete") {
    const idx = prompts.findIndex((p) => p.id === prompt.id);
    if (idx === -1) return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
    if (prompts[idx].userId !== user.id && user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    prompts.splice(idx, 1);
  }

  const result = await writePromptsSafe(prompts);
  if (!result.ok) {
    return NextResponse.json({ error: result.error || "Save failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, prompts });
}
