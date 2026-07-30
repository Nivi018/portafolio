"use client";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Power, Trash2, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
  deleteServiceAction,
  toggleServiceActiveAction,
} from "@/app/(dashboard)/business/services/actions";

export function DeleteServiceButton({
  serviceId,
  serviceName,
  hasAppointments,
}: {
  serviceId: string;
  serviceName: string;
  hasAppointments: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteServiceAction(serviceId);
      if (result.success) {
        if (result.error) {
          toast.warning(result.error);
        } else {
          toast.success("Servicio eliminado");
        }
        setOpen(false);
      } else {
        toast.error(result.error || "Error al eliminar");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Eliminar servicio
          </DialogTitle>
          <DialogDescription>
            ¿Estás seguro de eliminar <strong>{serviceName}</strong>?
          </DialogDescription>
        </DialogHeader>
        {hasAppointments && (
          <div className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-800 border border-yellow-200">
            Este servicio tiene citas asociadas. En lugar de eliminarse, se
            desactivará para mantener el historial.
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Eliminando...
              </>
            ) : (
              "Eliminar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ToggleActiveButton({
  serviceId,
  isActive,
}: {
  serviceId: string;
  isActive: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      const result = await toggleServiceActiveAction(serviceId);
      if (result.success) {
        toast.success(isActive ? "Servicio desactivado" : "Servicio activado");
      } else {
        toast.error(result.error || "Error al cambiar estado");
      }
    });
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleToggle}
      disabled={isPending}
    >
      <Power className="h-3 w-3" />
    </Button>
  );
}
