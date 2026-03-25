import { NextRequest, NextResponse } from "next/server";

const GIST_ID = "a1813d8fccf42a2e3107143e0bd127a3";
const GIST_URL = `https://api.github.com/gists/${GIST_ID}`;
const GH_TOKEN = process.env.GH_TOKEN!;

export async function GET() {
  try {
    const res = await fetch(GIST_URL, {
      headers: {
        Authorization: `Bearer ${GH_TOKEN}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      next: { revalidate: 0 },
    });
    if (!res.ok) throw new Error("Failed to fetch gist");
    const data = await res.json();
    const content = data.files["prompts.json"]?.content || "[]";
    return NextResponse.json(JSON.parse(content));
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  try {
    const prompts = await req.json();
    const payloadSize = JSON.stringify(prompts).length;
    const res = await fetch(GIST_URL, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${GH_TOKEN}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({
        files: {
          "prompts.json": {
            content: JSON.stringify(prompts, null, 2),
          },
        },
      }),
    });
    if (!res.ok) {
      const errorText = await res.text();
      console.error("Gist PATCH failed:", res.status, errorText);
      return NextResponse.json({ ok: false, error: errorText, status: res.status }, { status: 500 });
    }
    return NextResponse.json({ ok: true, promptsCount: prompts.length, payloadSize });
  } catch (err) {
    console.error("Gist PATCH exception:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
