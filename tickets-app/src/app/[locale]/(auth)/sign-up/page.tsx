import { setRequestLocale } from "next-intl/server";
import { SignUpForm } from "@/components/auth/sign-up-form";

function sanitizeCallbackUrl(value: string | string[] | undefined): string {
  if (!value || typeof value !== "string") return "/";
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

export default async function SignUpPage({
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
      <SignUpForm callbackUrl={safeCallback} />
    </main>
  );
}
