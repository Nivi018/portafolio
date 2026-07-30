import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";

/**
 * Allow-list of email addresses that may sign in without email verification.
 * Useful for the seed demo users (and CI) where we don't have a real
 * mail server. In production this list should be empty.
 */
const PREVERIFIED_EMAILS = new Set(
  [
    "admin@acme.test",
    "agent1@acme.test",
    "agent2@acme.test",
    "customer1@acme.test",
    "customer2@acme.test",
    "admin@globex.test",
    "agent@globex.test",
    "customer@globex.test",
    "power@multi.test",
  ].map((e) => e.toLowerCase()),
);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  providers: [
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.RESEND_FROM_EMAIL,
    }),
    Google,
  ],
  pages: {
    signIn: "/sign-in",
    verifyRequest: "/sign-in/verify",
  },
  callbacks: {
    /**
     * Mark Google OAuth users as email-verified on first sign-in.
     * Magic-link users are already verified by Auth.js. For dev/demo
     * we let the seed users in unverified.
     */
    signIn({ user }) {
      if (!user.email) return false;
      const u = user as { emailVerified?: Date | null };
      if (u.emailVerified) return true;
      if (PREVERIFIED_EMAILS.has(user.email.toLowerCase())) return true;
      // Reject unverified emails when not in dev mode.
      if (process.env.NODE_ENV === "production") {
        return false;
      }
      return true;
    },
    session({ session, user }) {
      if (user) {
        session.user.id = user.id;
        session.user.preferredLocale = (
          user as { preferredLocale?: string }
        ).preferredLocale;
      }
      return session;
    },
  },
  events: {
    /**
     * After a Google OAuth sign-in, mark the user's email as verified.
     * Magic-link sign-ins already set this.
     */
    async signIn({ user, account }) {
      const u = user as { emailVerified?: Date | null };
      if (account?.provider === "google" && user.id && !u.emailVerified) {
        try {
          await db.user.update({
            where: { id: user.id },
            data: { emailVerified: new Date() },
          });
        } catch (err) {
          console.error("[auth] failed to mark google user verified", err);
        }
      }
    },
  },
});
