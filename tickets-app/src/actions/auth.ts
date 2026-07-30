"use server";

import { z } from "zod";
import { AuthError } from "next-auth";
import { headers } from "next/headers";
import { signIn, signOut } from "@/lib/auth";
import { clientIpKey, rateLimit } from "@/lib/rate-limit";

const emailSchema = z.string().email();

export type SignInState = {
  error?: string;
  success?: boolean;
};

function sanitizeCallback(value: unknown): string {
  if (typeof value !== "string") return "/";
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

export async function signInWithEmail(
  _prev: SignInState,
  formData: FormData,
): Promise<SignInState> {
  // 5 sign-in attempts per email per 10 minutes
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const rl = rateLimit(`signin:${email}`, { limit: 5, windowMs: 10 * 60_000 });
  if (!rl.ok) {
    return {
      error: `Too many sign-in attempts. Try again in ${Math.ceil(rl.resetInMs / 60_000)} minutes.`,
    };
  }

  const parsed = emailSchema.safeParse(email);
  if (!parsed.success) {
    return { error: "Please enter a valid email address" };
  }

  const redirectTo = sanitizeCallback(formData.get("callbackUrl"));

  try {
    await signIn("resend", {
      email: parsed.data,
      redirectTo,
    });
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Could not send sign-in email. Please try again." };
    }
    throw error;
  }
}

export async function signInWithGoogle(formData: FormData): Promise<void> {
  // 10 Google attempts per IP per 10 minutes
  const h = await headers();
  const ip = clientIpKey(h);
  const rl = rateLimit(`signin-google:${ip}`, {
    limit: 10,
    windowMs: 10 * 60_000,
  });
  if (!rl.ok) {
    throw new Error("Too many sign-in attempts. Try again later.");
  }
  const redirectTo = sanitizeCallback(formData.get("callbackUrl"));
  await signIn("google", { redirectTo });
}

export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/" });
}
