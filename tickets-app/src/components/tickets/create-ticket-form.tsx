"use client";

import { useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Priority } from "@prisma/client";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createTicket, type CreateTicketState } from "@/actions/tickets";
import {
  createTicketSchema,
  type CreateTicketInput,
} from "@/lib/validators/ticket";

const initialState: CreateTicketState = {};

type Props = {
  orgSlug: string;
};

export function CreateTicketForm({ orgSlug }: Props) {
  const t = useTranslations("Tickets.create");
  const [state, formAction, pending] = useActionState(
    createTicket.bind(null, orgSlug),
    initialState,
  );

  const form = useForm<CreateTicketInput>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      subject: "",
      description: "",
      priority: Priority.MEDIUM,
    },
  });

  useEffect(() => {
    if (state.fieldErrors) {
      for (const [key, value] of Object.entries(state.fieldErrors)) {
        if (value) {
          form.setError(key as keyof CreateTicketInput, { message: value });
        }
      }
    }
  }, [state, form]);

  return (
    <Form {...form}>
      <form action={formAction} className="space-y-6">
        <FormField
          control={form.control}
          name="subject"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("subjectLabel")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("subjectPlaceholder")}
                  autoComplete="off"
                  {...field}
                />
              </FormControl>
              <FormDescription>{t("subjectDescription")}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("descriptionLabel")}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t("descriptionPlaceholder")}
                  rows={8}
                  {...field}
                />
              </FormControl>
              <FormDescription>{t("descriptionDescription")}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="priority"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("priorityLabel")}</FormLabel>
              <Select
                value={field.value}
                onValueChange={field.onChange}
                name={field.name}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t("priorityPlaceholder")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={Priority.LOW}>
                    {t("priorities.LOW")}
                  </SelectItem>
                  <SelectItem value={Priority.MEDIUM}>
                    {t("priorities.MEDIUM")}
                  </SelectItem>
                  <SelectItem value={Priority.HIGH}>
                    {t("priorities.HIGH")}
                  </SelectItem>
                  <SelectItem value={Priority.URGENT}>
                    {t("priorities.URGENT")}
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>{t("priorityDescription")}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {state.error ? (
          <p className="text-destructive text-sm">{state.error}</p>
        ) : null}

        <div className="flex gap-2">
          <Button type="submit" disabled={pending}>
            {pending ? t("submitting") : t("submit")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
