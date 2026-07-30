"use client";

import { useActionState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
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
import {
  signInWithEmail,
  signInWithGoogle,
  type SignInState,
} from "@/actions/auth";

const schema = z.object({
  email: z.string().email(),
});

type FormValues = z.infer<typeof schema>;

const initialState: SignInState = {};

type Props = {
  callbackUrl?: string;
};

export function SignInForm({ callbackUrl }: Props = {}) {
  const t = useTranslations("Auth.signIn");
  const [state, formAction, pending] = useActionState(
    signInWithEmail,
    initialState,
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground text-sm">{t("subtitle")}</p>
      </div>

      {state.success ? (
        <div className="bg-card rounded-lg border p-4 text-sm">
          <p className="font-medium">{t("checkEmailTitle")}</p>
          <p className="text-muted-foreground mt-1">
            {t("checkEmailDescription")}
          </p>
        </div>
      ) : (
        <>
          <Form {...form}>
            <form action={formAction} className="space-y-4">
              {callbackUrl ? (
                <input type="hidden" name="callbackUrl" value={callbackUrl} />
              ) : null}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("email")}</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        autoComplete="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
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

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background text-muted-foreground px-2">
                {t("or")}
              </span>
            </div>
          </div>

          <form action={signInWithGoogle}>
            {callbackUrl ? (
              <input type="hidden" name="callbackUrl" value={callbackUrl} />
            ) : null}
            <Button
              type="submit"
              variant="outline"
              className="w-full"
              disabled={pending}
            >
              {t("google")}
            </Button>
          </form>
        </>
      )}

      <p className="text-muted-foreground text-center text-sm">
        {t("noAccount")}{" "}
        <Link
          href="/sign-up"
          className="text-foreground font-medium underline-offset-4 hover:underline"
        >
          {t("signUp")}
        </Link>
      </p>
    </div>
  );
}
