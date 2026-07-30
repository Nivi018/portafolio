import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/layout/Providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "BookingSystem - Sistema de Reservas",
    template: "%s | BookingSystem",
  },
  description:
    "Plataforma completa de gestión de reservas para negocios. Reserva servicios, gestiona horarios y administra tu negocio.",
  keywords: [
    "reservas",
    "booking",
    "citas",
    "agenda",
    "negocios",
    "servicios",
  ],
  authors: [{ name: "BookingSystem" }],
  openGraph: {
    type: "website",
    locale: "es_ES",
    siteName: "BookingSystem",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Providers>{children}</Providers>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
