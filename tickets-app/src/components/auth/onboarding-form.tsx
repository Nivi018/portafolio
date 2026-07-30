"use client";

import { useActionState, useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { createOrganization, type CreateOrgState } from "@/actions/orgs";
import { slugify } from "@/lib/slug";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(80),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(40)
    .regex(/^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$/, {
      message: "Slug can only contain lowercase letters, numbers and hyphens",
    }),
});

type FormValues = z.infer<typeof schema>;

const initialState: CreateOrgState = {};

export function OnboardingForm() {
  const t = useTranslations("Onboarding");
  const [state, formAction, pending] = useActionState(
    createOrganization,
    initialState,
  );
  const [autoSlug, setAutoSlug] = useState(true);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", slug: "" },
  });

  const name = useWatch({ control: form.control, name: "name" });

  useEffect(() => {
    if (autoSlug) {
      form.setValue("slug", slugify(name ?? ""), { shouldValidate: false });
    }
  }, [name, autoSlug, form]);

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground text-sm">{t("subtitle")}</p>
      </div>

      <Form {...form}>
        <form action={formAction} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("nameLabel")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("namePlaceholder")}
                    autoComplete="organization"
                    {...field}
                  />
                </FormControl>
                <FormDescription>{t("nameDescription")}</FormDescription>
                <FormMessage />
                {state.fieldErrors?.name ? (
                  <p className="text-destructive text-sm">
                    {state.fieldErrors.name}
                  </p>
                ) : null}
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("slugLabel")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("slugPlaceholder")}
                    onChange={(e) => {
                      setAutoSlug(false);
                      field.onChange(e);
                    }}
                    value={field.value}
                  />
                </FormControl>
                <FormDescription>{t("slugDescription")}</FormDescription>
                <FormMessage />
                {state.fieldErrors?.slug ? (
                  <p className="text-destructive text-sm">
                    {state.fieldErrors.slug}
                  </p>
                ) : null}
              </FormItem>
            )}
          />

          {state.error ? (
            <p className="text-destructive text-sm">{state.error}</p>
          ) : null}

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? t("submitting") : t("submit")}
          </Button>
        </form>
      </Form>
    </div>
  );
}
