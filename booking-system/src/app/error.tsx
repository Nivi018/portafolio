"use client";

import { useEffect } from "react";
import { ButtonLink } from "@/components/ui/button-link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log del error para monitoring
    console.error("Error global:", error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-background to-orange-50 p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto h-20 w-20 rounded-2xl bg-red-100 flex items-center justify-center">
          <AlertTriangle className="h-10 w-10 text-red-600" />
        </div>

        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Algo salió mal
          </h1>
          <p className="text-muted-foreground mt-2">
            Ha ocurrido un error inesperado. Nuestro equipo ha sido notificado.
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground mt-2 font-mono">
              ID: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium h-11 px-8 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Intentar de nuevo
          </button>
          <ButtonLink href="/" size="lg" variant="outline">
            <Home className="mr-2 h-4 w-4" />
            Ir al inicio
          </ButtonLink>
        </div>

        <div className="pt-6 border-t">
          <p className="text-sm text-muted-foreground">
            Si el problema persiste, por favor contacta a soporte.
          </p>
        </div>
      </div>
    </main>
  );
}
