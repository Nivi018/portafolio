"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  updateOrgSettings,
  type UpdateOrgSettingsState,
} from "@/actions/settings";
import { slugify } from "@/lib/slug";

const initial: UpdateOrgSettingsState = {};

type Props = {
  orgSlug: string;
  defaults: {
    name: string;
    slug: string;
    primaryColor: string | null;
    logo: string | null;
  };
};

export function OrgSettingsForm({ orgSlug, defaults }: Props) {
  const t = useTranslations("Settings");
  const [state, action, pending] = useActionState<
    UpdateOrgSettingsState,
    FormData
  >(updateOrgSettings.bind(null, orgSlug), initial);
  const [name, setName] = useState(defaults.name);
  const [slug, setSlug] = useState(defaults.slug);
  const [auto, setAuto] = useState(true);

  function handleNameChange(value: string) {
    setName(value);
    if (auto) {
      setSlug(slugify(value));
    }
  }

  function handleSlugChange(value: string) {
    setAuto(false);
    setSlug(value);
  }

  return (
    <form action={action} className="space-y-4 rounded-lg border p-4">
      <div className="space-y-1">
        <label className="text-sm font-medium">{t("name")}</label>
        <Input
          name="name"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
        />
        {state.fieldErrors?.name ? (
          <p className="text-destructive text-xs">{state.fieldErrors.name}</p>
        ) : null}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">{t("slug")}</label>
        <Input
          name="slug"
          value={slug}
          onChange={(e) => handleSlugChange(e.target.value)}
        />
        <p className="text-muted-foreground text-xs">{t("slugDescription")}</p>
        {state.fieldErrors?.slug ? (
          <p className="text-destructive text-xs">{state.fieldErrors.slug}</p>
        ) : null}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">{t("primaryColor")}</label>
        <div className="flex items-center gap-2">
          <Input
            type="color"
            name="primaryColor"
            defaultValue={defaults.primaryColor ?? "#0ea5e9"}
            className="h-10 w-20 cursor-pointer p-1"
          />
          <Input
            type="text"
            defaultValue={defaults.primaryColor ?? ""}
            placeholder="#0ea5e9"
            readOnly
            className="text-muted-foreground text-xs"
          />
        </div>
        {state.fieldErrors?.primaryColor ? (
          <p className="text-destructive text-xs">
            {state.fieldErrors.primaryColor}
          </p>
        ) : null}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">{t("logo")}</label>
        <Input
          name="logo"
          type="url"
          placeholder="https://..."
          defaultValue={defaults.logo ?? ""}
        />
        <p className="text-muted-foreground text-xs">{t("logoDescription")}</p>
        {state.fieldErrors?.logo ? (
          <p className="text-destructive text-xs">{state.fieldErrors.logo}</p>
        ) : null}
      </div>

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
  );
}
