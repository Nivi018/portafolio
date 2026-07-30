"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { serviceSchema, type ServiceInput } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import {
  createServiceAction,
  updateServiceAction,
} from "@/app/(dashboard)/business/services/actions";

interface ServiceFormProps {
  service?: {
    id: string;
    name: string;
    description: string | null;
    duration: number;
    price: import("@prisma/client").Prisma.Decimal;
    currency: string;
    maxBookingsPerSlot: number;
    active: boolean;
  };
}

export function ServiceForm({ service }: ServiceFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const isEditing = !!service;

  const form = useForm<ServiceInput>({
    resolver: zodResolver(serviceSchema) as any,
    defaultValues: {
      name: service?.name || "",
      description: service?.description || "",
      duration: service?.duration || 30,
      price: service ? Number(service.price) : 0,
      currency: service?.currency || "MXN",
      maxBookingsPerSlot: service?.maxBookingsPerSlot || 1,
      active: service?.active ?? true,
    },
  });

  function onSubmit(values: ServiceInput) {
    setError(null);
    startTransition(async () => {
      const result = isEditing
        ? await updateServiceAction(service!.id, values)
        : await createServiceAction(values);

      if (result.success) {
        toast.success(
          isEditing ? "Servicio actualizado" : "Servicio creado"
        );
        router.push("/dashboard/business/services");
        router.refresh();
      } else {
        setError(result.error || "Error al guardar");
        toast.error(result.error || "Error al guardar");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? "Editar servicio" : "Nuevo servicio"}</CardTitle>
        <CardDescription>
          {isEditing
            ? "Modifica la información del servicio"
            : "Completa la información del servicio que ofreces"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del servicio *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Corte de cabello"
                      autoComplete="off"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe el servicio..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Describe brevemente lo que incluye el servicio
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duración (minutos) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={5}
                        max={480}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Moneda</FormLabel>
                    <FormControl>
                      <Input placeholder="MXN" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="maxBookingsPerSlot"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reservas simultáneas</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Cuántos clientes pueden reservar el mismo horario
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Servicio activo</FormLabel>
                      <FormDescription>
                        Visible para reservar
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 border border-red-200">
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {isEditing ? "Actualizar" : "Crear servicio"}
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isPending}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
