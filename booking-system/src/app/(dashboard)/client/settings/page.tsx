import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button-link";
import { User, Mail, Bell, Globe } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ClientSettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      email: true,
      emailVerified: true,
      name: true,
      createdAt: true,
    },
  });

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground mt-1">
          Gestiona las preferencias de tu cuenta
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Cuenta
          </CardTitle>
          <CardDescription>
            Información de tu cuenta y perfil
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Nombre</p>
              <p className="text-sm text-muted-foreground">{user?.name}</p>
            </div>
            <ButtonLink href="/dashboard/client/profile" variant="outline" size="sm">
              Editar
            </ButtonLink>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Email</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
            <ButtonLink href="/dashboard/client/profile" variant="outline" size="sm">
              Cambiar
            </ButtonLink>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificaciones
          </CardTitle>
          <CardDescription>
            Configura cómo quieres recibir notificaciones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
            Las notificaciones por email están activadas por defecto. Pronto
            podrás configurar más opciones.
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Idioma y región
          </CardTitle>
          <CardDescription>
            Configura tu idioma y zona horaria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Idioma:</span>
              <span className="font-medium">Español (México)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Zona horaria:</span>
              <span className="font-medium">
                {Intl.DateTimeFormat().resolvedOptions().timeZone}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Privacidad y datos
          </CardTitle>
          <CardDescription>
            Gestiona tus datos personales
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
            Tus datos están protegidos. Solo los negocios donde reserves pueden
            ver tu información de contacto.
          </div>
          <ButtonLink href="/dashboard/client/profile" variant="outline" size="sm">
            Ver política de privacidad
          </ButtonLink>
        </CardContent>
      </Card>
    </div>
  );
}
