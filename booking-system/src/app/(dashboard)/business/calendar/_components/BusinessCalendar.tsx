"use client";

import { useState, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar, Clock, User, Mail, Phone, FileText, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { formatTime, APPOINTMENT_STATUS_LABELS, APPOINTMENT_STATUS_COLORS } from "@/lib/utils";
import { toast } from "sonner";
import { updateAppointmentStatusAction } from "@/app/(dashboard)/appointments/actions";

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor: string;
  borderColor: string;
  extendedProps: {
    status: string;
    service: string;
    clientName: string;
    clientEmail: string;
    clientPhone: string | null;
    notes: string | null;
  };
}

interface BusinessCalendarProps {
  businessId: string;
}

export function BusinessCalendar({ businessId }: BusinessCalendarProps) {
  const calendarRef = useRef<FullCalendar | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function fetchEvents() {
    setLoading(true);
    try {
      const res = await fetch("/api/calendar/events");
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error("Error cargando eventos:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchEvents();
  }, []);

  async function handleStatusChange(appointmentId: string, newStatus: string) {
    setIsPending(true);
    try {
      const result = await updateAppointmentStatusAction({
        appointmentId,
        status: newStatus as any,
      });
      if (result.success) {
        toast.success("Estado actualizado");
        await fetchEvents();
        // Actualizar el evento seleccionado
        if (selectedEvent?.id === appointmentId) {
          setSelectedEvent({
            ...selectedEvent,
            extendedProps: { ...selectedEvent.extendedProps, status: newStatus },
          });
        }
      } else {
        toast.error(result.error || "Error");
      }
    } finally {
      setIsPending(false);
    }
  }

  const stats = {
    pending: events.filter((e) => e.extendedProps.status === "PENDING").length,
    confirmed: events.filter((e) => e.extendedProps.status === "CONFIRMED").length,
    cancelled: events.filter((e) => e.extendedProps.status === "CANCELLED").length,
    completed: events.filter((e) => e.extendedProps.status === "COMPLETED").length,
  };

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Pendientes" value={stats.pending} color="bg-yellow-100 text-yellow-800" />
        <StatCard label="Confirmadas" value={stats.confirmed} color="bg-green-100 text-green-800" />
        <StatCard label="Completadas" value={stats.completed} color="bg-blue-100 text-blue-800" />
        <StatCard label="Canceladas" value={stats.cancelled} color="bg-red-100 text-red-800" />
      </div>

      {/* Leyenda */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Leyenda de colores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {Object.entries(APPOINTMENT_STATUS_COLORS).map(([key, className]) => (
              <Badge key={key} variant="outline" className={className}>
                {APPOINTMENT_STATUS_LABELS[key as keyof typeof APPOINTMENT_STATUS_LABELS]}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Calendario */}
      <Card>
        <CardContent className="p-0 sm:p-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="calendar-container">
              <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                headerToolbar={{
                  left: "prev,next today",
                  center: "title",
                  right: "dayGridMonth,timeGridWeek,timeGridDay",
                }}
                locale="es"
                buttonText={{
                  today: "Hoy",
                  month: "Mes",
                  week: "Semana",
                  day: "Día",
                }}
                events={events}
                eventClick={(info) => {
                  setSelectedEvent(info.event as any);
                }}
                height="auto"
                slotMinTime="06:00:00"
                slotMaxTime="22:00:00"
                allDaySlot={false}
                weekends={true}
                firstDay={1}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de detalle */}
      <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DialogContent>
          {selectedEvent && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Detalle de la reserva
                </DialogTitle>
                <DialogDescription>
                  <Badge
                    variant="outline"
                    className={APPOINTMENT_STATUS_COLORS[selectedEvent.extendedProps.status]}
                  >
                    {APPOINTMENT_STATUS_LABELS[selectedEvent.extendedProps.status as keyof typeof APPOINTMENT_STATUS_LABELS]}
                  </Badge>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{selectedEvent.extendedProps.clientName}</p>
                    <p className="text-xs text-muted-foreground">Cliente</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm">{selectedEvent.extendedProps.clientEmail}</p>
                  </div>
                </div>

                {selectedEvent.extendedProps.clientPhone && (
                  <div className="flex items-start gap-3">
                    <Phone className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="text-sm">{selectedEvent.extendedProps.clientPhone}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{selectedEvent.extendedProps.service}</p>
                    <p className="text-xs text-muted-foreground">Servicio</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm">
                      {new Date(selectedEvent.start).toLocaleString("es-MX", {
                        dateStyle: "full",
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatTime(selectedEvent.start.split("T")[1].substring(0, 5))} -{" "}
                      {formatTime(selectedEvent.end.split("T")[1].substring(0, 5))}
                    </p>
                  </div>
                </div>

                {selectedEvent.extendedProps.notes && (
                  <div className="rounded-md bg-muted p-3 text-sm italic">
                    "{selectedEvent.extendedProps.notes}"
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2">
                {(selectedEvent.extendedProps.status === "PENDING" ||
                  selectedEvent.extendedProps.status === "CONFIRMED") && (
                  <>
                    {selectedEvent.extendedProps.status === "PENDING" && (
                      <Button
                        size="sm"
                        onClick={() => handleStatusChange(selectedEvent.id, "CONFIRMED")}
                        disabled={isPending}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Confirmar
                      </Button>
                    )}
                    {selectedEvent.extendedProps.status === "CONFIRMED" && (
                      <Button
                        size="sm"
                        onClick={() => handleStatusChange(selectedEvent.id, "COMPLETED")}
                        disabled={isPending}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Completar
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange(selectedEvent.id, "CANCELLED")}
                      disabled={isPending}
                      className="text-red-600"
                    >
                      <XCircle className="h-3 w-3 mr-1" />
                      Cancelar
                    </Button>
                  </>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        .fc {
          font-size: 0.9rem;
        }
        .fc-toolbar-title {
          font-size: 1.25rem !important;
          font-weight: 600;
        }
        .fc-button {
          background-color: hsl(var(--primary)) !important;
          border-color: hsl(var(--primary)) !important;
        }
        .fc-button:hover {
          opacity: 0.9;
        }
        .fc-button-active {
          background-color: hsl(var(--primary)) !important;
          opacity: 0.8;
        }
        .fc-event {
          cursor: pointer;
          padding: 2px 4px;
        }
        .fc-daygrid-event {
          white-space: normal !important;
        }
      `}</style>
    </>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
          </div>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
            {value}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
