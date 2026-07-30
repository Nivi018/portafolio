"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Save, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import {
  updateScheduleAction,
  type ScheduleInput,
} from "@/app/(dashboard)/business/schedule/actions";
import { cn } from "@/lib/utils";

const DAYS = [
  { key: "MONDAY", label: "Lunes" },
  { key: "TUESDAY", label: "Martes" },
  { key: "WEDNESDAY", label: "Miércoles" },
  { key: "THURSDAY", label: "Jueves" },
  { key: "FRIDAY", label: "Viernes" },
  { key: "SATURDAY", label: "Sábado" },
  { key: "SUNDAY", label: "Domingo" },
] as const;

interface ScheduleFormProps {
  initialSchedule: ScheduleInput[];
}

const DEFAULT_SCHEDULE: ScheduleInput = {
  dayOfWeek: "MONDAY",
  openTime: "09:00",
  closeTime: "18:00",
  isActive: true,
};

export function ScheduleForm({ initialSchedule }: ScheduleFormProps) {
  const [isPending, startTransition] = useTransition();
  const [schedule, setSchedule] = useState<ScheduleInput[]>(() => {
    // Combinar schedule inicial con defaults para días faltantes
    const initial = [...initialSchedule];
    DAYS.forEach((day) => {
      if (!initial.find((s) => s.dayOfWeek === day.key)) {
        initial.push({ ...DEFAULT_SCHEDULE, dayOfWeek: day.key as any });
      }
    });
    // Ordenar por día
    return initial.sort(
      (a, b) =>
        DAYS.findIndex((d) => d.key === a.dayOfWeek) -
        DAYS.findIndex((d) => d.key === b.dayOfWeek)
    );
  });

  function getDaySchedule(day: string) {
    return schedule.find((s) => s.dayOfWeek === day) || DEFAULT_SCHEDULE;
  }

  function updateDay(day: string, field: keyof ScheduleInput, value: any) {
    setSchedule((prev) =>
      prev.map((s) => (s.dayOfWeek === day ? { ...s, [field]: value } : s))
    );
  }

  function handleSave() {
    startTransition(async () => {
      const result = await updateScheduleAction(schedule);
      if (result.success) {
        toast.success("Horarios guardados");
      } else {
        toast.error(result.error || "Error al guardar");
      }
    });
  }

  function setBusinessHours(day: string) {
    updateDay(day, "openTime", "09:00");
    updateDay(day, "closeTime", "18:00");
  }

  function applyToAll() {
    const firstActive = schedule.find((s) => s.isActive);
    if (!firstActive) return;
    const newSchedule = schedule.map((s) => ({
      ...s,
      openTime: firstActive.openTime,
      closeTime: firstActive.closeTime,
    }));
    setSchedule(newSchedule);
    toast.info("Horarios aplicados a todos los días activos");
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={applyToAll}
          disabled={isPending}
        >
          Aplicar horario a todos los días
        </Button>
      </div>

      <div className="space-y-3">
        {DAYS.map((day) => {
          const daySchedule = getDaySchedule(day.key);
          return (
            <div
              key={day.key}
              className={cn(
                "flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-lg border transition-colors",
                daySchedule.isActive
                  ? "bg-background"
                  : "bg-muted/30 opacity-60"
              )}
            >
              <div className="flex items-center gap-3 sm:w-40">
                <Switch
                  checked={daySchedule.isActive}
                  onCheckedChange={(checked) =>
                    updateDay(day.key, "isActive", checked)
                  }
                  disabled={isPending}
                />
                <span className="font-medium">{day.label}</span>
              </div>

              {daySchedule.isActive ? (
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    type="time"
                    value={daySchedule.openTime}
                    onChange={(e) =>
                      updateDay(day.key, "openTime", e.target.value)
                    }
                    className="w-32"
                    disabled={isPending}
                  />
                  <span className="text-muted-foreground">a</span>
                  <Input
                    type="time"
                    value={daySchedule.closeTime}
                    onChange={(e) =>
                      updateDay(day.key, "closeTime", e.target.value)
                    }
                    className="w-32"
                    disabled={isPending}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setBusinessHours(day.key)}
                    disabled={isPending}
                    className="ml-auto"
                  >
                    9-18
                  </Button>
                </div>
              ) : (
                <div className="flex-1 text-sm text-muted-foreground italic">
                  Cerrado
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-end pt-4 border-t">
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Guardar horarios
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
