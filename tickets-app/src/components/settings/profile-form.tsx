"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { updateProfile, type ProfileState } from "@/actions/profile";
import { signOutAction } from "@/actions/auth";

const schema = z.object({
  name: z.string().min(1, "Required").max(80),
  preferredLocale: z.enum(["en", "es"]),
});

type FormValues = z.infer<typeof schema>;

const initialState: ProfileState = {};

type Props = {
  defaultName: string;
  defaultEmail: string;
  defaultLocale: "en" | "es";
};

export function ProfileForm({
  defaultName,
  defaultEmail,
  defaultLocale,
}: Props) {
  const t = useTranslations("Profile");
  const router = useRouter();
  const [state, action, pending] = useActionState<ProfileState, FormData>(
    updateProfile,
    initialState,
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: defaultName,
      preferredLocale: defaultLocale,
    },
  });

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form
          key={state.success ? "ok" : state.error ? "err" : "init"}
          action={action}
          className="space-y-4 rounded-lg border p-4"
        >
          <div className="space-y-1">
            <label className="text-sm font-medium">{t("email")}</label>
            <Input value={defaultEmail} readOnly disabled />
            <p className="text-muted-foreground text-xs">{t("emailHint")}</p>
          </div>

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("name")}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
                {state.fieldErrors?.name ? (
                  <p className="text-destructive text-xs">
                    {state.fieldErrors.name}
                  </p>
                ) : null}
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="preferredLocale"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("preferredLocale")}</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="en">{t("languages.en")}</SelectItem>
                    <SelectItem value="es">{t("languages.es")}</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-muted-foreground text-xs">
                  {t("preferredLocaleHint")}
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          {state.error && !state.fieldErrors ? (
            <p className="text-destructive text-xs">{state.error}</p>
          ) : null}
          {state.success ? (
            <p className="text-sm text-green-600 dark:text-green-400">
              {t("saved")}
            </p>
          ) : null}

          <div className="flex justify-end">
            <Button type="submit" disabled={pending}>
              {pending ? t("saving") : t("save")}
            </Button>
          </div>
        </form>
      </Form>

      <form
        action={async () => {
          await signOutAction();
          router.push("/");
        }}
        className="rounded-lg border p-4"
      >
        <h3 className="font-medium">{t("signOutTitle")}</h3>
        <p className="text-muted-foreground mb-3 text-sm">
          {t("signOutDescription")}
        </p>
        <Button type="submit" variant="outline">
          {t("signOut")}
        </Button>
      </form>
    </div>
  );
}
