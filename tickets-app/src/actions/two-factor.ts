"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateTotpSecret, verifyTotp } from "@/lib/totp";

const codeSchema = z.string().regex(/^\d{6}$/, "Code must be 6 digits");

export type TwoFactorState = {
  error?: string;
  qrCode?: string;
  secret?: string;
  success?: boolean;
};

/**
 * Step 1 of enabling 2FA: generate a secret + QR code, return to the
 * client so the user can scan it. We don't persist the secret yet.
 */
export async function startTwoFactorSetup(): Promise<TwoFactorState> {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return { error: "Not signed in" };
  }

  const { secret, qrCodeDataUrl } = generateTotpSecret(session.user.email);
  return {
    secret,
    qrCode: await qrCodeDataUrl,
  };
}

/**
 * Step 2: user submits a 6-digit code from their authenticator app.
 * We verify it against the in-memory secret (passed back from the
 * client) and only then persist.
 */
export async function confirmTwoFactorSetup(
  _prev: TwoFactorState,
  formData: FormData,
): Promise<TwoFactorState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not signed in" };

  const codeRaw = String(formData.get("code") ?? "");
  const secretBase32 = String(formData.get("secret") ?? "");
  const parsed = codeSchema.safeParse(codeRaw);
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Invalid" };

  if (!secretBase32 || !verifyTotp(secretBase32, parsed.data)) {
    return { error: "Invalid code, try again" };
  }

  await db.$transaction([
    db.twoFactorSecret.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id, secret: secretBase32 },
      update: { secret: secretBase32 },
    }),
    db.user.update({
      where: { id: session.user.id },
      data: { twoFactorEnabled: true },
    }),
  ]);

  revalidatePath("/", "layout");
  return { success: true };
}

export async function disableTwoFactor(
  _prev: TwoFactorState,
  formData: FormData,
): Promise<TwoFactorState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not signed in" };

  const codeRaw = String(formData.get("code") ?? "");
  const parsed = codeSchema.safeParse(codeRaw);
  if (!parsed.success) return { error: "Invalid code" };

  const stored = await db.twoFactorSecret.findUnique({
    where: { userId: session.user.id },
    select: { secret: true },
  });
  if (!stored) return { error: "2FA is not enabled" };

  if (!verifyTotp(stored.secret, parsed.data)) {
    return { error: "Invalid code" };
  }

  await db.$transaction([
    db.twoFactorSecret.delete({ where: { userId: session.user.id } }),
    db.user.update({
      where: { id: session.user.id },
      data: { twoFactorEnabled: false },
    }),
  ]);

  revalidatePath("/", "layout");
  return { success: true };
}
