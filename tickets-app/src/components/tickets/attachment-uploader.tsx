"use client";

import { useState } from "react";
import { UploadButton } from "@uploadthing/react";
import { Paperclip, X } from "lucide-react";
import type { OurFileRouter } from "@/app/api/uploadthing/route";

type Uploaded = {
  url: string;
  name: string;
  size: number;
  mimeType: string;
};

type Props = {
  value: Uploaded[];
  onChange: (files: Uploaded[]) => void;
  disabled?: boolean;
};

export function AttachmentUploader({ value, onChange, disabled }: Props) {
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {value.map((file) => (
          <div
            key={file.url}
            className="bg-muted flex items-center gap-2 rounded-md px-2 py-1 text-xs"
          >
            <Paperclip className="size-3" />
            <a
              href={file.url}
              target="_blank"
              rel="noreferrer"
              className="hover:underline"
            >
              {file.name}
            </a>
            <button
              type="button"
              onClick={() => onChange(value.filter((f) => f.url !== file.url))}
              className="hover:text-destructive"
              aria-label="Remove"
            >
              <X className="size-3" />
            </button>
          </div>
        ))}
        <UploadButton<OurFileRouter, "ticketAttachment">
          endpoint="ticketAttachment"
          appearance={{
            button:
              "bg-secondary text-secondary-foreground h-8 px-3 rounded-md text-xs",
          }}
          content={{ button: "Attach files" }}
          disabled={disabled}
          onBeforeUploadBegin={(files: File[]) => {
            if (files.length + value.length > 5) {
              setError("Maximum 5 files");
              return [];
            }
            setError(null);
            return files;
          }}
          onClientUploadComplete={(
            res: Array<{
              serverData?: { url?: string };
              ufsUrl?: string;
              url: string;
              name: string;
              size: number;
              type: string;
            }>,
          ) => {
            const uploaded: Uploaded[] = res.map((f) => ({
              url: f.serverData?.url ?? f.ufsUrl ?? f.url,
              name: f.name,
              size: f.size,
              mimeType: f.type,
            }));
            onChange([...value, ...uploaded]);
          }}
          onUploadError={(err: Error) => {
            setError(err.message);
          }}
        />
      </div>
      {error ? <p className="text-destructive text-xs">{error}</p> : null}
    </div>
  );
}
