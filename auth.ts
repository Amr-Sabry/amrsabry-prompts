import NextAuth, { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

const ADMIN_USER = {
  id: "admin",
  username: process.env.AUTH_ADMIN_USER || "amr",
  password: process.env.AUTH_ADMIN_PASS || "prompts2026",
  role: "admin" as const,
};

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      role: "admin" | "user";
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    username: string;
    role: "admin" | "user";
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (
          credentials.username === ADMIN_USER.username &&
          credentials.password === ADMIN_USER.password
        ) {
          return { id: ADMIN_USER.id, name: ADMIN_USER.username, role: ADMIN_USER.role };
        }
        // Check registered users from Gist
        try {
          const res = await fetch(process.env.USERS_GIST_URL!, {
            headers: { Authorization: `Bearer ${process.env.GH_TOKEN}` },
          });
          if (res.ok) {
            const data = await res.json();
            const users = JSON.parse(data.files["users.json"]?.content || "[]");
            const bcrypt = await import("bcryptjs");
            for (const user of users) {
              if (user.username === credentials.username) {
                const valid = await bcrypt.compare(credentials.password, user.passwordHash);
                if (valid) return { id: user.id, name: user.username, role: user.role || "user" };
              }
            }
          }
        } catch {}
        return null;
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.username = (user as any).name;
        token.role = (user as any).role;
      }
      return token;
    },
    session({ session, token }) {
      session.user = { id: token.id, username: token.username, role: token.role };
      return session;
    },
  },
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
} satisfies NextAuthConfig);
