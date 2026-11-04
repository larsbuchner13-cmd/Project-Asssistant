import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { prisma } from "@/lib/prisma";
import { consumeRateLimit } from "@/lib/rate-limit";
import { loginFormSchema } from "@/lib/validations/auth";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginFormSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const email = parsed.data.email.toLowerCase().trim();
        await consumeRateLimit("login", email, 10, 15 * 60_000);

        const user = await prisma.user.findUnique({
          where: { email },
        });
        if (!user) return null;

        const passwordValid = await bcrypt.compare(parsed.data.password, user.password);
        if (!passwordValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status,
          sessionVersion: user.sessionVersion,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.status = user.status;
        token.sessionVersion = user.sessionVersion;
      } else if (token.id) {
        // Recheck account state on every server session lookup. Credential and
        // administrative changes rotate sessionVersion and revoke old sessions.
        const current = await prisma.user.findUnique({
          where: { id: token.id },
          select: { role: true, status: true, sessionVersion: true },
        });
        if (current && token.sessionVersion === current.sessionVersion) {
          token.role = current.role;
          token.status = current.status;
        } else {
          token.id = "";
          token.role = "USER";
          token.status = "DISABLED";
        }
      }
      if (!token.id) {
        token.role = "USER";
        token.status = "DISABLED";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.status = token.status;
      }
      return session;
    },
  },
};
