import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "lucide-react";
import { ProfileForm } from "./_components/ProfileForm";
import { PasswordForm } from "./_components/PasswordForm";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      image: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) redirect("/login");

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mi perfil</h1>
        <p className="text-muted-foreground mt-1">
          Gestiona tu información personal
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Información personal
          </CardTitle>
          <CardDescription>
            Actualiza tu nombre, teléfono y foto de perfil
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm
            user={{
              name: user.name || "",
              phone: user.phone,
              image: user.image,
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cambiar contraseña</CardTitle>
          <CardDescription>
            Actualiza tu contraseña para mantener tu cuenta segura
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PasswordForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Información de la cuenta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email:</span>
            <span className="font-medium">{user.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Rol:</span>
            <span className="font-medium">
              {user.role === "CLIENT" && "Cliente"}
              {user.role === "BUSINESS_OWNER" && "Dueño de negocio"}
              {user.role === "SUPER_ADMIN" && "Administrador"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Miembro desde:</span>
            <span className="font-medium">
              {new Date(user.createdAt).toLocaleDateString("es-MX", {
                dateStyle: "long",
              })}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
