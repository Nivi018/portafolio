import { createRouteHandler } from "uploadthing/next";
import { ticketFileRouter, type TicketFileRouter } from "@/lib/uploadthing";

export const { GET, POST } = createRouteHandler({
  router: ticketFileRouter,
});

export type OurFileRouter = TicketFileRouter;
