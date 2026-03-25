import { auth } from "@/auth";
import { NextResponse } from "next/server";

const USERS_GIST_URL = process.env.USERS_GIST_URL!;
const GH_TOKEN = process.env.GH_TOKEN!;

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const res = await fetch(USERS_GIST_URL, {
      headers: { Authorization: `Bearer ${GH_TOKEN}`, Accept: "application/vnd.github+json" },
    });
    if (!res.ok) throw new Error();
    const data = await res.json();
    const users = JSON.parse(data.files["users.json"]?.content || "[]");
    return NextResponse.json(users.map((u: any) => ({ id: u.id, username: u.username, role: u.role, createdAt: u.createdAt })));
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { username, password, role = "user" } = await req.json();
  if (!username || !password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 chars" }, { status: 400 });
  }
  try {
    const res = await fetch(USERS_GIST_URL, {
      headers: { Authorization: `Bearer ${GH_TOKEN}`, Accept: "application/vnd.github+json" },
    });
    const data = await res.json();
    const users: any[] = JSON.parse(data.files["users.json"]?.content || "[]");
    if (users.find((u) => u.username === username)) {
      return NextResponse.json({ error: "Username already exists" }, { status: 409 });
    }
    const bcrypt = await import("bcryptjs");
    const passwordHash = await bcrypt.hash(password, 10);
    users.push({ id: crypto.randomUUID(), username, passwordHash, role, createdAt: new Date().toISOString() });
    await fetch(USERS_GIST_URL, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${GH_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ files: { "users.json": { content: JSON.stringify(users, null, 2) } } }),
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await req.json();
  try {
    const res = await fetch(USERS_GIST_URL, {
      headers: { Authorization: `Bearer ${GH_TOKEN}`, Accept: "application/vnd.github+json" },
    });
    const data = await res.json();
    const users: any[] = JSON.parse(data.files["users.json"]?.content || "[]");
    const filtered = users.filter((u) => u.id !== id);
    await fetch(USERS_GIST_URL, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${GH_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ files: { "users.json": { content: JSON.stringify(filtered, null, 2) } } }),
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
