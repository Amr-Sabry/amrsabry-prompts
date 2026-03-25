import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { SavedPrompt } from "@/types/prompt";

const PROMPTS_GIST_URL = process.env.PROMPTS_GIST_URL || "https://api.github.com/gists/a1813d8fccf42a2e3107143e0bd127a3";
const GH_TOKEN = process.env.GH_TOKEN!;

async function getGist(url: string) {
  return fetch(url, {
    headers: { Authorization: `Bearer ${GH_TOKEN}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" },
    next: { revalidate: 0 },
  });
}

async function patchGist(body: object) {
  return fetch(PROMPTS_GIST_URL, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${GH_TOKEN}`, "Content-Type": "application/json", "X-GitHub-Api-Version": "2022-11-28" },
    body: JSON.stringify(body),
  });
}

async function getPrompts(): Promise<SavedPrompt[]> {
  try {
    const res = await getGist(PROMPTS_GIST_URL);
    if (!res.ok) {
      console.error("[getPrompts] Gist fetch failed:", res.status, await res.text());
      return [];
    }
    const data = await res.json();
    const content = data.files?.["prompts.json"]?.content;
    if (!content) return [];
    return JSON.parse(content) as SavedPrompt[];
  } catch (err) {
    console.error("[getPrompts] Error:", err);
    return [];
  }
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

  try {
    const prompts = await getPrompts();
    const idx = prompts.findIndex((p) => p.id === prompt.id);

    if (action === "save") {
      // Validate required fields
      if (!prompt.plainText) {
        return NextResponse.json({ error: "plainText is required" }, { status: 400 });
      }
      const newPrompt: SavedPrompt = {
        id: prompt.id || crypto.randomUUID(),
        plainText: prompt.plainText,
        jsonText: prompt.jsonText || JSON.stringify({ text: prompt.plainText, language: prompt.language || "eng", confidence: 0, format: "plain" }, null, 2),
        imageThumbnail: prompt.imageThumbnail || "",
        language: prompt.language || "eng",
        confidence: prompt.confidence ?? 0,
        createdAt: new Date().toISOString(),
        userId: session.user.id,
        userName: session.user.username,
      };
      prompts.unshift(newPrompt);

    } else if (action === "update") {
      if (idx === -1) {
        return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
      }
      // Only owner or admin can update
      if (prompts[idx].userId !== session.user.id && session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      // Merge: keep existing fields that aren't in prompt
      prompts[idx] = {
        ...prompts[idx],
        ...prompt,
        id: prompts[idx].id, // always keep original id
        userId: prompts[idx].userId, // always keep original userId
        userName: prompts[idx].userName, // always keep original userName
        createdAt: prompts[idx].createdAt, // always keep original createdAt
      };

    } else if (action === "delete") {
      if (idx === -1) {
        return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
      }
      if (prompts[idx].userId !== session.user.id && session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      prompts.splice(idx, 1);

    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const res = await patchGist({ files: { "prompts.json": { content: JSON.stringify(prompts, null, 2) } } });
    if (!res.ok) {
      const errText = await res.text();
      console.error("[PATCH Gist] Failed:", res.status, errText);
      return NextResponse.json({ error: `Gist write failed: ${res.status}` }, { status: 500 });
    }

    return NextResponse.json({ ok: true, prompts });

  } catch (err) {
    console.error("[POST /api/prompts] Unexpected error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
