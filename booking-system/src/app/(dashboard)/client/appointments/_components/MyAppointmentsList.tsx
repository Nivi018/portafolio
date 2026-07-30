"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { XCircle, Calendar, Clock, Building2, Loader2, AlertTriangle } from "lucide-react";
import { formatDate, formatTime, APPOINTMENT_STATUS_LABELS, APPOINTMENT_STATUS_COLORS } from "@/lib/utils";
import { toast } from "sonner";
import { cancelMyAppointmentAction } from "@/app/(dashboard)/appointments/actions";

interface MyAppointment {
  id: string;
  date: Date;
  startTime: string;
  endTime: string;
  status: string;
  notes: string | null;
  service: {
    name: string;
    duration: number;
    price: number;
  };
  business: {
    name: string;
    slug: string;
  };
}

export function MyAppointmentsList({ appointments }: { appointments: MyAppointment[] }) {
  const [filter, setFilter] = useState<"upcoming" | "past" | "all">("upcoming");

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const filtered = appointments.filter((apt) => {
    const aptDate = new Date(apt.date);
    if (filter === "upcoming") return aptDate >= now && apt.status !== "CANCELLED";
    if (filter === "past") return aptDate < now || apt.status === "CANCELLED";
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          variant={filter === "upcoming" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("upcoming")}
        >
          Próximas
        </Button>
        <Button
          variant={filter === "past" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("past")}
        >
          Pasadas
        </Button>
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
        >
          Todas
        </Button>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No hay reservas que mostrar
          </p>
        ) : (
          filtered.map((apt) => (
            <AppointmentCard key={apt.id} appointment={apt} />
          ))
        )}
      </div>
    </div>
  );
}

function AppointmentCard({ appointment }: { appointment: MyAppointment }) {
  return (
    <Card className="p-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <p className="font-medium">{appointment.service.name}</p>
            <Badge
              variant="outline"
              className={APPOINTMENT_STATUS_COLORS[appointment.status]}
            >
              {APPOINTMENT_STATUS_LABELS[appointment.status]}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <Building2 className="h-3 w-3" />
            {appointment.business.name}
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(appointment.date)}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
            </div>
          </div>
          {appointment.notes && (
            <p className="text-xs bg-muted px-2 py-1 rounded mt-2 italic">
              "{appointment.notes}"
            </p>
          )}
        </div>

        <div className="flex gap-2">
          {(appointment.status === "PENDING" || appointment.status === "CONFIRMED") && (
            <CancelButton appointmentId={appointment.id} />
          )}
        </div>
      </div>
    </Card>
  );
}

function CancelButton({ appointmentId }: { appointmentId: string }) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  function handleCancel() {
    startTransition(async () => {
      const result = await cancelMyAppointmentAction(appointmentId);
      if (result.success) {
        toast.success("Reserva cancelada");
        setOpen(false);
      } else {
        toast.error(result.error || "Error al cancelar");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="text-red-600">
            <XCircle className="h-3 w-3 mr-1" />
            Cancelar
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Cancelar reserva
          </DialogTitle>
          <DialogDescription>
            ¿Estás seguro de cancelar esta reserva? Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            No, mantener
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cancelando...
              </>
            ) : (
              "Sí, cancelar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
