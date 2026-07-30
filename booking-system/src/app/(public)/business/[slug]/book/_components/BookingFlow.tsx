"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, Loader2, Calendar, Clock, ChevronLeft, ChevronRight, User, CreditCard } from "lucide-react";
import { formatCurrency, formatTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { createBookingAction } from "../actions";
import { PaymentForm } from "@/components/payment/PaymentForm";

interface BusinessData {
  id: string;
  name: string;
  slug: string;
  services: {
    id: string;
    name: string;
    description: string | null;
    duration: number;
    price: number;
    currency: string;
  }[];
  businessHours: {
    dayOfWeek: string;
    label: string;
    openTime: string;
    closeTime: string;
  }[];
}

interface BookingFlowProps {
  business: BusinessData;
  currentUser: {
    name: string;
    email: string;
    phone: string | null;
  } | null;
  preselectedServiceId?: string;
}

type Step = "service" | "date" | "time" | "details" | "confirm" | "payment" | "success";

export function BookingFlow({ business, currentUser, preselectedServiceId }: BookingFlowProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(
    preselectedServiceId ? "date" : "service"
  );
  const [isPending, startTransition] = useTransition();
  const [selectedServiceId, setSelectedServiceId] = useState<string>(
    preselectedServiceId || ""
  );
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [availableSlots, setAvailableSlots] = useState<{ startTime: string; endTime: string; available: boolean }[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const [clientName, setClientName] = useState(currentUser?.name || "");
  const [clientEmail, setClientEmail] = useState(currentUser?.email || "");
  const [clientPhone, setClientPhone] = useState(currentUser?.phone || "");
  const [notes, setNotes] = useState("");
  const [createdAppointmentId, setCreatedAppointmentId] = useState<string | null>(null);
  const [requirePayment, setRequirePayment] = useState(false);
  const [stripeConfigured, setStripeConfigured] = useState(false);

  const selectedService = business.services.find((s) => s.id === selectedServiceId);

  // Cargar slots cuando cambia la fecha
  useEffect(() => {
    if (selectedServiceId && selectedDate) {
      loadAvailableSlots();
    }
  }, [selectedServiceId, selectedDate]);

  async function loadAvailableSlots() {
    setLoadingSlots(true);
    try {
      const res = await fetch(
        `/api/availability?businessId=${business.id}&serviceId=${selectedServiceId}&date=${selectedDate}`
      );
      const data = await res.json();
      if (res.ok) {
        setAvailableSlots(data.slots || []);
      } else {
        setAvailableSlots([]);
      }
    } catch (error) {
      console.error("Error cargando slots:", error);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }

  function handleConfirmBooking() {
    if (!selectedServiceId || !selectedDate || !selectedTime) {
      toast.error("Faltan datos");
      return;
    }

    setBookingError(null);
    startTransition(async () => {
      const result = await createBookingAction(business.id, {
        serviceId: selectedServiceId,
        date: selectedDate,
        startTime: selectedTime,
        clientName,
        clientEmail,
        clientPhone,
        notes,
      });

      if (result.success) {
        if (result.appointmentId) {
          setCreatedAppointmentId(result.appointmentId);
        }

        // Si requiere pago y Stripe está configurado, ir al paso de pago
        if (requirePayment && stripeConfigured && result.appointmentId) {
          setStep("payment");
        } else {
          setStep("success");
        }
        toast.success("¡Reserva creada exitosamente!");
      } else {
        setBookingError(result.error || "Error al crear la reserva");
        toast.error(result.error || "Error al crear la reserva");
      }
    });
  }

  // Verificar si Stripe está configurado
  useEffect(() => {
    setStripeConfigured(!!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
  }, []);

  const steps = [
    { key: "service", label: "Servicio" },
    { key: "date", label: "Fecha" },
    { key: "time", label: "Hora" },
    { key: "details", label: "Datos" },
    { key: "confirm", label: "Confirmar" },
    { key: "payment", label: "Pago" },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === step);

  return (
    <div className="space-y-6">
      {/* Progress */}
      {step !== "success" && (
        <div className="flex items-center justify-center">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center">
              <div
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium",
                  i <= currentStepIndex
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                <span className="h-5 w-5 rounded-full bg-background/20 flex items-center justify-center text-xs">
                  {i + 1}
                </span>
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={cn("h-px w-8 mx-1", i < currentStepIndex ? "bg-primary" : "bg-muted")} />
              )}
            </div>
          ))}
        </div>
      )}

      <Card>
        <CardContent className="p-6">
          {step === "service" && (
            <ServiceStep
              services={business.services}
              selected={selectedServiceId}
              onSelect={(id) => {
                setSelectedServiceId(id);
                setStep("date");
              }}
            />
          )}

          {step === "date" && (
            <DateStep
              service={selectedService!}
              businessHours={business.businessHours}
              selectedDate={selectedDate}
              onSelect={(date) => {
                setSelectedDate(date);
                setStep("time");
              }}
              onBack={() => setStep("service")}
            />
          )}

          {step === "time" && (
            <TimeStep
              date={selectedDate}
              service={selectedService!}
              slots={availableSlots}
              loading={loadingSlots}
              selectedTime={selectedTime}
              onSelect={(time) => {
                setSelectedTime(time);
                setStep("details");
              }}
              onBack={() => setStep("date")}
            />
          )}

          {step === "details" && (
            <DetailsStep
              clientName={clientName}
              setClientName={setClientName}
              clientEmail={clientEmail}
              setClientEmail={setClientEmail}
              clientPhone={clientPhone}
              setClientPhone={setClientPhone}
              notes={notes}
              setNotes={setNotes}
              isLoggedIn={!!currentUser}
              onContinue={() => setStep("confirm")}
              onBack={() => setStep("time")}
            />
          )}

          {step === "confirm" && (
            <ConfirmStep
              business={business}
              service={selectedService!}
              date={selectedDate}
              startTime={selectedTime}
              clientName={clientName}
              clientEmail={clientEmail}
              clientPhone={clientPhone}
              notes={notes}
              error={bookingError}
              isPending={isPending}
              requirePayment={requirePayment}
              stripeConfigured={stripeConfigured}
              onRequirePaymentChange={setRequirePayment}
              onConfirm={handleConfirmBooking}
              onBack={() => setStep("details")}
            />
          )}

          {step === "payment" && createdAppointmentId && selectedService && (
            <PaymentStep
              appointmentId={createdAppointmentId}
              amount={selectedService.price}
              currency={selectedService.currency}
              onSuccess={() => setStep("success")}
              onBack={() => setStep("confirm")}
            />
          )}

          {step === "success" && (
            <SuccessStep
              businessName={business.name}
              serviceName={selectedService?.name || ""}
              date={selectedDate}
              startTime={selectedTime}
              isLoggedIn={!!currentUser}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Step Components

function ServiceStep({
  services,
  selected,
  onSelect,
}: {
  services: BusinessData["services"];
  selected: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Elige un servicio</h2>
        <p className="text-sm text-muted-foreground">Selecciona el servicio que deseas reservar</p>
      </div>
      <div className="space-y-2">
        {services.map((service) => (
          <button
            key={service.id}
            onClick={() => onSelect(service.id)}
            className={cn(
              "w-full text-left p-4 rounded-lg border-2 transition-all hover:border-primary",
              selected === service.id ? "border-primary bg-primary/5" : "border-border"
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium">{service.name}</p>
                {service.description && (
                  <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                    {service.description}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {service.duration} min
                </div>
              </div>
              <p className="text-lg font-bold">
                {formatCurrency(service.price, service.currency)}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function DateStep({
  service,
  businessHours,
  selectedDate,
  onSelect,
  onBack,
}: {
  service: BusinessData["services"][0];
  businessHours: BusinessData["businessHours"];
  selectedDate: string;
  onSelect: (date: string) => void;
  onBack: () => void;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Generar próximos 30 días
  const dates: { date: string; dayName: string; dayNum: number; monthName: string; available: boolean }[] = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dayKey = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"][d.getDay()];
    const hours = businessHours.find((h) => h.dayOfWeek === dayKey);
    dates.push({
      date: d.toISOString().split("T")[0],
      dayName: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"][d.getDay()],
      dayNum: d.getDate(),
      monthName: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"][d.getMonth()],
      available: !!hours,
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Elige una fecha</h2>
          <p className="text-sm text-muted-foreground">Servicio: {service.name} ({service.duration} min)</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {dates.map((d) => (
          <button
            key={d.date}
            disabled={!d.available}
            onClick={() => onSelect(d.date)}
            className={cn(
              "p-3 rounded-lg border text-center transition-all",
              !d.available && "opacity-40 cursor-not-allowed",
              d.available && "hover:border-primary cursor-pointer",
              selectedDate === d.date && "border-primary bg-primary/5"
            )}
          >
            <p className="text-xs text-muted-foreground">{d.dayName}</p>
            <p className="text-xl font-bold">{d.dayNum}</p>
            <p className="text-xs text-muted-foreground">{d.monthName}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function TimeStep({
  date,
  service,
  slots,
  loading,
  selectedTime,
  onSelect,
  onBack,
}: {
  date: string;
  service: BusinessData["services"][0];
  slots: { startTime: string; endTime: string; available: boolean }[];
  loading: boolean;
  selectedTime: string;
  onSelect: (time: string) => void;
  onBack: () => void;
}) {
  const availableCount = slots.filter((s) => s.available).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Elige una hora</h2>
          <p className="text-sm text-muted-foreground">
            {new Date(date + "T00:00:00").toLocaleDateString("es-MX", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}{" "}
            • {availableCount} horarios disponibles
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : slots.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No hay horarios disponibles para este día</p>
          <Button variant="outline" onClick={onBack} className="mt-3">
            Elegir otro día
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {slots.map((slot) => (
            <button
              key={slot.startTime}
              disabled={!slot.available}
              onClick={() => onSelect(slot.startTime)}
              className={cn(
                "p-3 rounded-lg border text-center transition-all",
                !slot.available && "opacity-40 cursor-not-allowed line-through",
                slot.available && "hover:border-primary cursor-pointer",
                selectedTime === slot.startTime && "border-primary bg-primary/5"
              )}
            >
              <p className="font-semibold">{formatTime(slot.startTime)}</p>
              <p className="text-xs text-muted-foreground">
                {formatTime(slot.endTime)}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function DetailsStep({
  clientName,
  setClientName,
  clientEmail,
  setClientEmail,
  clientPhone,
  setClientPhone,
  notes,
  setNotes,
  isLoggedIn,
  onContinue,
  onBack,
}: {
  clientName: string;
  setClientName: (s: string) => void;
  clientEmail: string;
  setClientEmail: (s: string) => void;
  clientPhone: string;
  setClientPhone: (s: string) => void;
  notes: string;
  setNotes: (s: string) => void;
  isLoggedIn: boolean;
  onContinue: () => void;
  onBack: () => void;
}) {
  const isValid = clientName.length >= 2 && clientEmail.includes("@");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Tus datos</h2>
          <p className="text-sm text-muted-foreground">Confirma tu información de contacto</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      {isLoggedIn && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800 flex items-center gap-2">
          <User className="h-4 w-4" />
          Estás usando tu cuenta. Solo confirma los datos.
        </div>
      )}

      <div className="space-y-3">
        <div>
          <Label htmlFor="name">Nombre completo *</Label>
          <Input
            id="name"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Juan Pérez"
          />
        </div>
        <div>
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
            placeholder="tu@email.com"
          />
        </div>
        <div>
          <Label htmlFor="phone">Teléfono</Label>
          <Input
            id="phone"
            type="tel"
            value={clientPhone}
            onChange={(e) => setClientPhone(e.target.value)}
            placeholder="+52 999 123 4567"
          />
        </div>
        <div>
          <Label htmlFor="notes">Notas o comentarios</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="¿Alguna preferencia o requisito especial?"
            rows={3}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button onClick={onContinue} disabled={!isValid}>
          Continuar
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function ConfirmStep({
  business,
  service,
  date,
  startTime,
  clientName,
  clientEmail,
  clientPhone,
  notes,
  error,
  isPending,
  requirePayment,
  stripeConfigured,
  onRequirePaymentChange,
  onConfirm,
  onBack,
}: {
  business: BusinessData;
  service: BusinessData["services"][0];
  date: string;
  startTime: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  notes: string;
  error: string | null;
  isPending: boolean;
  requirePayment: boolean;
  stripeConfigured: boolean;
  onRequirePaymentChange: (value: boolean) => void;
  onConfirm: () => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Confirma tu reserva</h2>
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-3">
        <div className="rounded-lg border p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">
              {new Date(date + "T00:00:00").toLocaleDateString("es-MX", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{formatTime(startTime)} • {service.duration} min</span>
          </div>
          <div className="pt-2 border-t">
            <p className="font-medium">{service.name}</p>
            <p className="text-sm text-muted-foreground">
              {business.name} • {formatCurrency(service.price, service.currency)}
            </p>
          </div>
        </div>

        <div className="rounded-lg border p-4 space-y-2">
          <p className="font-medium text-sm">Datos del cliente</p>
          <p className="text-sm">{clientName}</p>
          <p className="text-sm text-muted-foreground">{clientEmail}</p>
          {clientPhone && <p className="text-sm text-muted-foreground">{clientPhone}</p>}
          {notes && (
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">Notas:</p>
              <p className="text-sm">{notes}</p>
            </div>
          )}
        </div>

        {stripeConfigured && service.price > 0 && (
          <div className="rounded-lg border p-4 bg-muted/30">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={requirePayment}
                onChange={(e) => onRequirePaymentChange(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300"
              />
              <div>
                <p className="font-medium text-sm flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Pagar ahora ({formatCurrency(service.price, service.currency)})
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Paga en línea para confirmar tu reserva inmediatamente. También puedes pagar en el local.
                </p>
              </div>
            </label>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 border border-red-200">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button onClick={onConfirm} disabled={isPending} size="lg" className="w-full sm:w-auto">
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Confirmando...
            </>
          ) : (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              {requirePayment ? "Crear y pagar" : "Confirmar reserva"}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function PaymentStep({
  appointmentId,
  amount,
  currency,
  onSuccess,
  onBack,
}: {
  appointmentId: string;
  amount: number;
  currency: string;
  onSuccess: () => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Realizar pago</h2>
          <p className="text-sm text-muted-foreground">
            Completa el pago para confirmar tu reserva
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      <PaymentForm
        appointmentId={appointmentId}
        amount={amount}
        currency={currency}
        onSuccess={onSuccess}
        onCancel={onBack}
      />
    </div>
  );
}

function SuccessStep({
  businessName,
  serviceName,
  date,
  startTime,
  isLoggedIn,
}: {
  businessName: string;
  serviceName: string;
  date: string;
  startTime: string;
  isLoggedIn: boolean;
}) {
  return (
    <div className="text-center py-8 space-y-4">
      <div className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
        <CheckCircle className="h-10 w-10 text-green-600" />
      </div>
      <div>
        <h2 className="text-2xl font-bold">¡Reserva confirmada!</h2>
        <p className="text-muted-foreground mt-2">
          Hemos enviado los detalles a tu email.
        </p>
      </div>
      <div className="rounded-lg border p-4 inline-block text-left">
        <p className="text-sm text-muted-foreground">Resumen</p>
        <p className="font-medium">{serviceName}</p>
        <p className="text-sm">{businessName}</p>
        <p className="text-sm text-muted-foreground mt-2">
          {new Date(date + "T00:00:00").toLocaleDateString("es-MX", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}{" "}
          • {formatTime(startTime)}
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 justify-center pt-4">
        {isLoggedIn ? (
          <ButtonLink href="/dashboard/client">Ver mis reservas</ButtonLink>
        ) : (
          <>
            <ButtonLink href="/register" variant="outline">
              Crear cuenta
            </ButtonLink>
            <ButtonLink href="/">Volver al inicio</ButtonLink>
          </>
        )}
      </div>
    </div>
  );
}
