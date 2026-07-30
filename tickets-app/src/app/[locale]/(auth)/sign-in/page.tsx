import { setRequestLocale } from "next-intl/server";
import { SignInForm } from "@/components/auth/sign-in-form";

function sanitizeCallbackUrl(value: string | string[] | undefined): string {
  if (!value || typeof value !== "string") return "/";
  // Only allow same-origin relative paths starting with /
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

export default async function SignInPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ callbackUrl?: string | string[] }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const { callbackUrl } = await searchParams;
  const safeCallback = sanitizeCallbackUrl(callbackUrl);

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <SignInForm callbackUrl={safeCallback} />
    </main>
  );
}
