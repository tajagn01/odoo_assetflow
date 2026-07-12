import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log("[NextAuth] authorize called with email:", credentials?.email);
        if (!credentials?.email || !credentials?.password) {
          console.log("[NextAuth] Missing credentials");
          throw new Error("Please enter both email and password.");
        }

        try {
          const user = await db.user.findUnique({
            where: { email: credentials.email.toLowerCase() }
          });

          console.log("[NextAuth] User lookup result:", user ? `found (id: ${user.id})` : "not found");

          if (!user) {
            throw new Error("No user found with this email address.");
          }

          if (user.status !== "ACTIVE") {
            console.log("[NextAuth] User status is not ACTIVE:", user.status);
            throw new Error("Your account is deactivated. Please contact an administrator.");
          }

          const isPasswordMatch = await bcrypt.compare(credentials.password, user.passwordHash);
          console.log("[NextAuth] Password match:", isPasswordMatch);

          if (!isPasswordMatch) {
            throw new Error("Incorrect password.");
          }

          const returnUser = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            departmentId: user.departmentId,
          };
          console.log("[NextAuth] authorize returning user:", returnUser);
          return returnUser;
        } catch (error: any) {
          console.error("[NextAuth] Error in authorize:", error);
          throw error;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      console.log("[NextAuth] jwt callback called. user:", user, "token:", token);
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.departmentId = (user as any).departmentId;
      }
      return token;
    },
    async session({ session, token }) {
      console.log("[NextAuth] session callback called. token:", token, "session:", session);
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as any;
        session.user.departmentId = token.departmentId as string;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: true,
  logger: {
    error(code, metadata) {
      console.error("NextAuth Error:", code, metadata);
    },
    warn(code) {
      console.warn("NextAuth Warning:", code);
    },
    debug(code, metadata) {
      console.log("NextAuth Debug:", code, metadata);
    },
  },
};
