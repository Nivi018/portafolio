import "server-only";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const f = createUploadthing();

export const ticketFileRouter = {
  ticketAttachment: f({
    "image/jpeg": { maxFileSize: "8MB", maxFileCount: 5 },
    "image/png": { maxFileSize: "8MB", maxFileCount: 5 },
    "image/webp": { maxFileSize: "8MB", maxFileCount: 5 },
    "image/gif": { maxFileSize: "8MB", maxFileCount: 5 },
    "application/pdf": { maxFileSize: "8MB", maxFileCount: 5 },
    "text/plain": { maxFileSize: "8MB", maxFileCount: 5 },
    "text/csv": { maxFileSize: "8MB", maxFileCount: 5 },
    "application/zip": { maxFileSize: "8MB", maxFileCount: 5 },
  })
    .middleware(async () => {
      const session = await auth();
      if (!session?.user?.id) throw new Error("Unauthorized");
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ file, metadata }) => {
      await db.attachment.create({
        data: {
          url: file.ufsUrl ?? file.url,
          name: file.name,
          size: file.size,
          mimeType: file.type,
        },
      });
      return {
        url: file.ufsUrl ?? file.url,
        name: file.name,
        size: file.size,
        mimeType: file.type,
        uploadedBy: metadata.userId,
      };
    }),
} satisfies FileRouter;

export type TicketFileRouter = typeof ticketFileRouter;
