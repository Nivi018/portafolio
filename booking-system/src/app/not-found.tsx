import Link from "next/link";
import { ButtonLink } from "@/components/ui/button-link";
import { Calendar, Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-purple-500/5 p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Calendar className="h-10 w-10 text-primary" />
        </div>

        <div>
          <h1 className="text-6xl font-bold tracking-tight">404</h1>
          <h2 className="text-2xl font-semibold mt-2">Página no encontrada</h2>
          <p className="text-muted-foreground mt-2">
            Lo sentimos, la página que buscas no existe o fue movida.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <ButtonLink href="/" size="lg">
            <Home className="mr-2 h-4 w-4" />
            Ir al inicio
          </ButtonLink>
          <ButtonLink href="/businesses" size="lg" variant="outline">
            <Search className="mr-2 h-4 w-4" />
            Explorar negocios
          </ButtonLink>
        </div>

        <div className="pt-6 border-t">
          <p className="text-sm text-muted-foreground">
            ¿Necesitas ayuda?{" "}
            <Link href="/" className="text-primary hover:underline">
              Contáctanos
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
