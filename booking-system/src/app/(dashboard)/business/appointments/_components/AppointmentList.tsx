"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle, XCircle, Clock, User, Calendar, Search } from "lucide-react";
import { formatDate, formatTime, APPOINTMENT_STATUS_LABELS, APPOINTMENT_STATUS_COLORS } from "@/lib/utils";
import { toast } from "sonner";
import { updateAppointmentStatusAction } from "@/app/(dashboard)/appointments/actions";

interface Appointment {
  id: string;
  date: Date;
  startTime: string;
  endTime: string;
  status: string;
  notes: string | null;
  clientName: string;
  clientEmail: string;
  clientPhone: string | null | undefined;
  service: {
    name: string;
    duration: number;
    price: number;
  };
}

export function AppointmentList({ appointments }: { appointments: Appointment[] }) {
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  const filtered = appointments.filter((apt) => {
    if (filter !== "all" && apt.status !== filter) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        apt.clientName.toLowerCase().includes(s) ||
        apt.clientEmail.toLowerCase().includes(s) ||
        apt.service.name.toLowerCase().includes(s)
      );
    }
    return true;
  });

  function handleStatusChange(appointmentId: string, newStatus: string) {
    startTransition(async () => {
      const result = await updateAppointmentStatusAction({
        appointmentId,
        status: newStatus as any,
      });
      if (result.success) {
        toast.success("Estado actualizado");
      } else {
        toast.error(result.error || "Error");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente, email o servicio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as string)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="PENDING">Pendientes</SelectItem>
            <SelectItem value="CONFIRMED">Confirmadas</SelectItem>
            <SelectItem value="COMPLETED">Completadas</SelectItem>
            <SelectItem value="CANCELLED">Canceladas</SelectItem>
            <SelectItem value="NO_SHOW">No asistió</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No hay reservas que coincidan con los filtros
          </p>
        ) : (
          filtered.map((apt) => (
            <Card key={apt.id} className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium">{apt.clientName}</p>
                    <Badge
                      variant="outline"
                      className={APPOINTMENT_STATUS_COLORS[apt.status]}
                    >
                      {APPOINTMENT_STATUS_LABELS[apt.status]}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{apt.service.name}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(apt.date)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTime(apt.startTime)} - {formatTime(apt.endTime)}
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {apt.clientEmail}
                    </div>
                  </div>
                  {apt.notes && (
                    <p className="text-xs bg-muted px-2 py-1 rounded mt-2 italic">
                      "{apt.notes}"
                    </p>
                  )}
                </div>

                <div className="flex gap-2 sm:flex-col sm:items-end">
                  {(apt.status === "PENDING" || apt.status === "CONFIRMED") && (
                    <>
                      {apt.status === "PENDING" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(apt.id, "CONFIRMED")}
                          disabled={isPending}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Confirmar
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange(apt.id, "CANCELLED")}
                        disabled={isPending}
                        className="text-red-600"
                      >
                        <XCircle className="h-3 w-3 mr-1" />
                        Cancelar
                      </Button>
                      {apt.status === "CONFIRMED" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(apt.id, "COMPLETED")}
                          disabled={isPending}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Completar
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
