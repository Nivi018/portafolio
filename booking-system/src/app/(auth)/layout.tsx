import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (session?.user) {
    const dashboardHref =
      session.user.role === "BUSINESS_OWNER"
        ? "/dashboard/business"
        : session.user.role === "SUPER_ADMIN"
          ? "/dashboard/admin"
          : "/dashboard/client";
    redirect(dashboardHref);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-purple-500/5 p-4">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
