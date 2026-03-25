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
    if (!res.ok) return [];
    const data = await res.json();
    return JSON.parse(data.files["prompts.json"]?.content || "[]");
  } catch {
    return [];
  }
}

// GET /api/prompts — anyone can read (guest too)
export async function GET() {
  try {
    const prompts = await getPrompts();
    return NextResponse.json(prompts);
  } catch {
    return NextResponse.json([]);
  }
}

// POST /api/prompts — logged-in users only
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const { action, prompt } = body;
    const prompts = await getPrompts();

    if (action === "save") {
      const newPrompt: SavedPrompt = {
        ...prompt,
        userId: session.user.id,
        userName: session.user.username,
        createdAt: new Date().toISOString(),
      };
      prompts.unshift(newPrompt);
    } else if (action === "update") {
      const idx = prompts.findIndex((p) => p.id === prompt.id);
      if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
      // Only owner or admin can update
      if (prompts[idx].userId !== session.user.id && session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      prompts[idx] = { ...prompts[idx], ...prompt };
    } else if (action === "delete") {
      const idx = prompts.findIndex((p) => p.id === prompt.id);
      if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
      // Only owner or admin can delete
      if (prompts[idx].userId !== session.user.id && session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      prompts.splice(idx, 1);
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const res = await patchGist({ files: { "prompts.json": { content: JSON.stringify(prompts, null, 2) } } });
    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: 500 });
    }
    return NextResponse.json({ ok: true, prompts });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
