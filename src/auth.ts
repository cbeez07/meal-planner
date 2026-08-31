import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  trustHost: true,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60, updateAge: 24 * 60 * 60 },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const username = String(credentials?.username ?? "");
        const password = String(credentials?.password ?? "");
        if (!username || !password) return null;
        const { compare } = await import("bcryptjs");
        const { eq } = await import("drizzle-orm");
        const { getDb } = await import("@/lib/db");
        const { users } = await import("@/lib/db/schema");
        const db = await getDb();
        const user = (
          await db.select().from(users).where(eq(users.username, username)).limit(1)
        )[0];
        if (!user) return null;
        const ok = await compare(password, user.passwordHash);
        if (!ok) return null;
        return {
          id: user.id,
          name: user.displayName,
          email: user.username,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.username = user.email ?? undefined;
        token.displayName = user.name ?? undefined;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.username = String(token.username ?? "");
        session.user.displayName = String(token.displayName ?? session.user.name ?? "");
      }
      return session;
    },
  },
});
