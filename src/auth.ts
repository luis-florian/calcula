import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { z } from "zod";

import { serverEnv } from "@/lib/env";

const loginCredentialsSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
});

export const { auth, handlers, signIn, signOut } = NextAuth({
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        username: { label: "Usuario", type: "text" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginCredentialsSchema.safeParse(credentials);

        if (
          !parsed.success ||
          !serverEnv.AMORTA_LOGIN_USERNAME ||
          !serverEnv.AMORTA_LOGIN_PASSWORD_HASH ||
          parsed.data.username !== serverEnv.AMORTA_LOGIN_USERNAME
        ) {
          return null;
        }

        const passwordMatches = await compare(
          parsed.data.password,
          serverEnv.AMORTA_LOGIN_PASSWORD_HASH,
        );

        if (!passwordMatches) {
          return null;
        }

        return {
          id: serverEnv.AMORTA_SINGLE_USER_ID,
          name: serverEnv.AMORTA_LOGIN_USERNAME,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
      }

      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }

      return session;
    },
  },
  session: {
    maxAge: 60 * 60 * 24 * 30,
    strategy: "jwt",
  },
  secret: serverEnv.AUTH_SECRET,
});
