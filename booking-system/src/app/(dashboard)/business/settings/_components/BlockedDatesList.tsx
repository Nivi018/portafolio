"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { blockedDateSchema, type BlockedDateInput } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card } from "@/components/ui/card";
import { Loader2, Plus, Trash2, CalendarOff, X } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import {
  addBlockedDateAction,
  removeBlockedDateAction,
} from "@/app/(dashboard)/settings/actions";

interface BlockedDatesListProps {
  blockedDates: {
    id: string;
    date: Date;
    reason: string | null;
  }[];
}

export function BlockedDatesList({ blockedDates }: BlockedDatesListProps) {
  const [isAdding, setIsAdding] = useState(false);

  const form = useForm<BlockedDateInput>({
    resolver: zodResolver(blockedDateSchema) as any,
    defaultValues: {
      date: "",
      reason: "",
    },
  });

  function onSubmit(values: BlockedDateInput) {
    startAddTransition(async () => {
      const result = await addBlockedDateAction(values);
      if (result.success) {
        toast.success("Fecha bloqueada");
        form.reset();
        setIsAdding(false);
      } else {
        toast.error(result.error || "Error");
      }
    });
  }

  const [isAddPending, startAddTransition] = useTransition();
  const [isRemovePending, startRemoveTransition] = useTransition();

  function handleRemove(id: string) {
    startRemoveTransition(async () => {
      const result = await removeBlockedDateAction(id);
      if (result.success) {
        toast.success("Fecha desbloqueada");
      } else {
        toast.error(result.error || "Error");
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Add new */}
      {isAdding ? (
        <Card className="p-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Motivo (opcional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Vacaciones, feriado, etc."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={isAddPending}>
                  {isAddPending ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      Bloqueando...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-3 w-3" />
                      Bloquear
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsAdding(false);
                    form.reset();
                  }}
                >
                  <X className="mr-2 h-3 w-3" />
                  Cancelar
                </Button>
              </div>
            </form>
          </Form>
        </Card>
      ) : (
        <Button onClick={() => setIsAdding(true)} variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          Bloquear nueva fecha
        </Button>
      )}

      {/* List */}
      {blockedDates.length === 0 ? (
        <div className="text-center py-8 border rounded-lg">
          <CalendarOff className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground mt-2">
            No tienes fechas bloqueadas
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {blockedDates.map((bd) => (
            <div
              key={bd.id}
              className="flex items-center justify-between p-3 rounded-lg border"
            >
              <div>
                <p className="font-medium">
                  {formatDate(bd.date, "es-MX")}
                </p>
                {bd.reason && (
                  <p className="text-sm text-muted-foreground">{bd.reason}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemove(bd.id)}
                disabled={isRemovePending}
                className="text-red-600"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
