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

// Read once — returns null on failure
async function readPrompts(): Promise<SavedPrompt[] | null> {
  try {
    const res = await fetch(PROMPTS_GIST_URL, { headers: ghHeaders, cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    const content = data.files?.["prompts.json"]?.content;
    if (!content) return null;
    return JSON.parse(content) as SavedPrompt[];
  } catch {
    return null;
  }
}

// Atomic write: read → mutate → write (retry only the write, not the read)
// Returns updated prompts array on success, throws on failure
async function atomicWrite(
  currentPrompts: SavedPrompt[],
  action: "save" | "update" | "delete",
  promptData: Partial<SavedPrompt> & { id: string },
  sessionUser: { id: string; username: string; role: string }
): Promise<SavedPrompt[]> {
  const MAX_RETRIES = 5;
  let prompts = [...currentPrompts];

  // Mutate in memory
  if (action === "save") {
    if (!promptData.plainText) throw new Error("plainText is required");
    prompts.unshift({
      id: promptData.id || (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`),
      plainText: promptData.plainText,
      jsonText: promptData.jsonText || JSON.stringify({ text: promptData.plainText, language: promptData.language || "eng", confidence: 0, format: "plain" }, null, 2),
      imageThumbnail: promptData.imageThumbnail || "",
      language: promptData.language || "eng",
      confidence: promptData.confidence ?? 0,
      createdAt: new Date().toISOString(),
      userId: sessionUser.id,
      userName: sessionUser.username,
    });
  } else if (action === "update") {
    const idx = prompts.findIndex((p) => p.id === promptData.id);
    if (idx === -1) throw new Error("Prompt not found");
    if (prompts[idx].userId !== sessionUser.id && sessionUser.role !== "admin") throw new Error("Forbidden");
    prompts[idx] = { ...prompts[idx], ...promptData, id: prompts[idx].id, userId: prompts[idx].userId, userName: prompts[idx].userName, createdAt: prompts[idx].createdAt };
  } else if (action === "delete") {
    const idx = prompts.findIndex((p) => p.id === promptData.id);
    if (idx === -1) throw new Error("Prompt not found");
    if (prompts[idx].userId !== sessionUser.id && sessionUser.role !== "admin") throw new Error("Forbidden");
    prompts.splice(idx, 1);
  }

  // Validate size before writing
  const payload = JSON.stringify(prompts, null, 2);
  if (payload.length > 7_500_000) throw new Error("Library too large. Delete some prompts first.");

  // Write with retry on conflict (409) or rate-limit (503)
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const res = await fetch(PROMPTS_GIST_URL, {
      method: "PATCH",
      headers: { ...ghHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ files: { "prompts.json": { content: payload } } }),
    });

    if (res.ok) return prompts; // success

    const status = res.status;
    if (status === 409 || status === 503) {
      // Conflict or rate-limited — re-read current state and retry
      const fresh = await readPrompts();
      if (fresh === null) throw new Error("Storage unavailable. Try again in a moment.");
      prompts = fresh;
      // Re-apply mutation on fresh state
      if (action === "save") {
        if (!promptData.plainText) throw new Error("plainText is required");
        prompts.unshift({
          id: promptData.id || (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`),
          plainText: promptData.plainText,
          jsonText: promptData.jsonText || JSON.stringify({ text: promptData.plainText, language: promptData.language || "eng", confidence: 0, format: "plain" }, null, 2),
          imageThumbnail: promptData.imageThumbnail || "",
          language: promptData.language || "eng",
          confidence: promptData.confidence ?? 0,
          createdAt: new Date().toISOString(),
          userId: sessionUser.id,
          userName: sessionUser.username,
        });
      } else if (action === "update") {
        const idx = prompts.findIndex((p) => p.id === promptData.id);
        if (idx === -1) throw new Error("Prompt not found");
        if (prompts[idx].userId !== sessionUser.id && sessionUser.role !== "admin") throw new Error("Forbidden");
        prompts[idx] = { ...prompts[idx], ...promptData, id: prompts[idx].id, userId: prompts[idx].userId, userName: prompts[idx].userName, createdAt: prompts[idx].createdAt };
      } else if (action === "delete") {
        const idx = prompts.findIndex((p) => p.id === promptData.id);
        if (idx === -1) throw new Error("Prompt not found");
        prompts.splice(idx, 1);
      }
      const newPayload = JSON.stringify(prompts, null, 2);
      if (newPayload.length > 7_500_000) throw new Error("Library too large. Delete some prompts first.");
      // Wait with backoff before retry
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1) + Math.random() * 300));
      continue;
    }

    throw new Error(`Storage write failed: HTTP ${status}`);
  }

  throw new Error(`Save failed after ${MAX_RETRIES} attempts. Please try again.`);
}

// GET /api/prompts
export async function GET() {
  const prompts = await readPrompts();
  return NextResponse.json(prompts ?? []);
}

// POST /api/prompts
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
  if (!["save", "update", "delete"].includes(action)) return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  // Read current state ONCE before entering retry loop
  const currentPrompts = await readPrompts();
  if (currentPrompts === null) {
    return NextResponse.json({ error: "Cannot read library. Storage may be temporarily unavailable." }, { status: 503 });
  }

  try {
    const updated = await atomicWrite(
      currentPrompts,
      action as "save" | "update" | "delete",
      prompt as Partial<SavedPrompt> & { id: string },
      session.user as { id: string; username: string; role: string }
    );
    return NextResponse.json({ ok: true, prompts: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    console.error(`[POST /api/prompts] ${action} error:`, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
