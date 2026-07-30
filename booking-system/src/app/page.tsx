import Link from "next/link";
import {
  Calendar,
  Clock,
  Users,
  BarChart3,
  CreditCard,
  Bell,
  Check,
  ArrowRight,
  Star,
  Scissors,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/layout/Navbar";

const features = [
  {
    icon: Calendar,
    title: "Reservas 24/7",
    description:
      "Tus clientes pueden reservar en cualquier momento, desde cualquier dispositivo.",
  },
  {
    icon: Clock,
    title: "Gestión de horarios",
    description:
      "Configura tus horarios de atención, días libres y disponibilidad por servicio.",
  },
  {
    icon: Users,
    title: "Roles y permisos",
    description:
      "Administra tu equipo con roles personalizables y control total de accesos.",
  },
  {
    icon: BarChart3,
    title: "Dashboard inteligente",
    description:
      "Visualiza estadísticas, ingresos y tendencias de tu negocio en tiempo real.",
  },
  {
    icon: CreditCard,
    title: "Pagos con Stripe",
    description:
      "Cobra anticipos o el total del servicio con integración segura a Stripe.",
  },
  {
    icon: Bell,
    title: "Notificaciones email",
    description:
      "Confirmaciones, recordatorios y cancelaciones automáticas para tus clientes.",
  },
];

const plans = [
  {
    name: "Gratis",
    price: "$0",
    period: "siempre",
    description: "Perfecto para empezar",
    features: [
      "Hasta 50 reservas/mes",
      "1 negocio",
      "Servicios ilimitados",
      "Emails básicos",
    ],
    cta: "Empezar gratis",
    href: "/register",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$19",
    period: "/mes",
    description: "Para negocios en crecimiento",
    features: [
      "Reservas ilimitadas",
      "Pagos con Stripe",
      "Estadísticas avanzadas",
      "Recordatorios automáticos",
      "Soporte prioritario",
    ],
    cta: "Probar Pro gratis",
    href: "/register?plan=pro",
    highlighted: true,
  },
  {
    name: "Business",
    price: "$49",
    period: "/mes",
    description: "Para equipos grandes",
    features: [
      "Todo lo del plan Pro",
      "Múltiples usuarios",
      "Roles personalizados",
      "API access",
      "Soporte dedicado",
    ],
    cta: "Contactar ventas",
    href: "/register?plan=business",
    highlighted: false,
  },
];

const stats = [
  { value: "10K+", label: "Reservas mensuales" },
  { value: "500+", label: "Negocios activos" },
  { value: "98%", label: "Satisfacción" },
  { value: "24/7", label: "Disponibilidad" },
];

export default function HomePage() {
  return (
    <>
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5" />
          <div className="container mx-auto px-4 py-20 md:py-32">
            <div className="mx-auto max-w-3xl text-center">
              <Badge variant="secondary" className="mb-6">
                <Star className="mr-1 h-3 w-3 fill-current" />
                Nuevo: Integración con Stripe
              </Badge>
              <h1 className="text-4xl font-bold tracking-tight sm:text-6xl md:text-7xl">
                Gestiona tus reservas{" "}
                <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  sin complicaciones
                </span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground md:text-xl">
                La plataforma todo-en-uno para que barberías, consultorios,
                gimnasios y cualquier negocio de servicios gestione citas,
                clientes y pagos de forma profesional.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <ButtonLink href="/register" size="lg">
                  Empezar gratis
                  <ArrowRight className="ml-2 h-4 w-4" />
                </ButtonLink>
                <ButtonLink href="/businesses" size="lg" variant="outline">
                  Ver demo
                </ButtonLink>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Sin tarjeta de crédito • Configuración en 5 minutos
              </p>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="border-y bg-muted/30">
          <div className="container mx-auto px-4 py-12">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl font-bold md:text-4xl">
                    {stat.value}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-20 md:py-32">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Todo lo que necesitas para crecer
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Herramientas pensadas para profesionales que valoran su tiempo y
                el de sus clientes.
              </p>
            </div>
            <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <Card key={feature.title} className="border-2">
                  <CardContent className="p-6">
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-semibold">{feature.title}</h3>
                    <p className="mt-2 text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Demo Section */}
        <section className="border-y bg-muted/30 py-20 md:py-32">
          <div className="container mx-auto px-4">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div>
                <Badge variant="secondary" className="mb-4">
                  <Scissors className="mr-1 h-3 w-3" />
                  Para cualquier negocio
                </Badge>
                <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                  Desde barberías hasta consultorios médicos
                </h2>
                <p className="mt-4 text-lg text-muted-foreground">
                  Nuestra plataforma se adapta a cualquier tipo de negocio de
                  servicios. Configura tus servicios, precios y horarios, y
                  empieza a recibir reservas en minutos.
                </p>
                <ul className="mt-8 space-y-3">
                  {[
                    "Configuración sin código técnico",
                    "Calendario visual intuitivo",
                    "Notificaciones automáticas por email",
                    "Pagos seguros con Stripe",
                    "Estadísticas y reportes detallados",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Check className="h-3 w-3" />
                      </div>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative">
                <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 p-8 shadow-2xl">
                  <div className="h-full w-full rounded-xl bg-background p-6 shadow-lg">
                    <div className="flex items-center gap-3 border-b pb-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10" />
                      <div>
                        <div className="h-3 w-24 rounded bg-muted" />
                        <div className="mt-1 h-2 w-16 rounded bg-muted/60" />
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 rounded-lg border p-3"
                        >
                          <div className="h-8 w-8 rounded bg-primary/10" />
                          <div className="flex-1 space-y-1">
                            <div className="h-2 w-3/4 rounded bg-muted" />
                            <div className="h-2 w-1/2 rounded bg-muted/60" />
                          </div>
                          <div className="h-2 w-12 rounded bg-muted" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-20 md:py-32">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Planes simples y transparentes
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Empieza gratis y crece según tus necesidades. Sin sorpresas.
              </p>
            </div>
            <div className="mt-16 grid gap-8 lg:grid-cols-3">
              {plans.map((plan) => (
                <Card
                  key={plan.name}
                  className={
                    plan.highlighted
                      ? "border-2 border-primary shadow-xl"
                      : "border-2"
                  }
                >
                  <CardContent className="p-8">
                    {plan.highlighted && (
                      <Badge className="mb-4">Más popular</Badge>
                    )}
                    <h3 className="text-2xl font-bold">{plan.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {plan.description}
                    </p>
                    <div className="mt-6 flex items-baseline gap-1">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground">
                        {plan.period}
                      </span>
                    </div>
                    <ul className="mt-6 space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2">
                          <Check className="mt-0.5 h-4 w-4 text-primary" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <ButtonLink
                      href={plan.href}
                      className="mt-8 w-full"
                      variant={plan.highlighted ? "default" : "outline"}
                    >
                      {plan.cta}
                    </ButtonLink>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t bg-muted/30 py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                ¿Listo para transformar tu negocio?
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Únete a cientos de negocios que ya gestionan sus reservas con
                BookingSystem.
              </p>
              <ButtonLink href="/register" size="lg" className="mt-8">
                Crear cuenta gratis
                <ArrowRight className="ml-2 h-4 w-4" />
              </ButtonLink>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Calendar className="h-4 w-4" />
              </div>
              <span className="font-semibold">BookingSystem</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} BookingSystem. Todos los derechos
              reservados.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
