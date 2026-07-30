"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button-link";
import { Input } from "@/components/ui/input";
import { Building2, MapPin, Search, Calendar, X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Business {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string | null;
  services: { name: string; price: import("@prisma/client").Prisma.Decimal; currency: string }[];
  _count: { appointments: number };
}

interface BusinessesListProps {
  businesses: Business[];
}

export function BusinessesList({ businesses }: BusinessesListProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return businesses;
    const s = search.toLowerCase().trim();
    return businesses.filter(
      (b) =>
        b.name.toLowerCase().includes(s) ||
        b.description?.toLowerCase().includes(s) ||
        b.address?.toLowerCase().includes(s) ||
        b.services.some((svc) => svc.name.toLowerCase().includes(s))
    );
  }, [businesses, search]);

  return (
    <>
      <div className="max-w-md mx-auto mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Buscar negocios, servicios o ubicaciones..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-10"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Limpiar búsqueda"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {search && (
          <p className="text-sm text-muted-foreground mt-2 text-center">
            {filtered.length} resultado{filtered.length === 1 ? "" : "s"} para
            "{search}"
          </p>
        )}
      </div>

      {filtered.length === 0 ? (
        <Card className="max-w-md mx-auto">
          <CardContent className="p-12 text-center">
            <Search className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 font-semibold">
              {search ? "Sin resultados" : "No hay negocios aún"}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {search
                ? `No encontramos negocios que coincidan con "${search}"`
                : "Sé el primero en registrar tu negocio"}
            </p>
            {!search && (
              <ButtonLink href="/register" className="mt-4">
                Registrar mi negocio
              </ButtonLink>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((business) => (
            <Card key={business.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-3 mb-4">
                  {business.name[0] && (
                    <div className="h-12 w-12 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold shrink-0">
                      {business.name[0]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{business.name}</h3>
                    {business.address && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{business.address}</span>
                      </p>
                    )}
                  </div>
                </div>
                {business.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {business.description}
                  </p>
                )}
                {business.services[0] && (
                  <div className="flex items-center justify-between mb-4 p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="text-xs text-muted-foreground">Desde</p>
                      <p className="text-sm font-medium">
                        {business.services[0].name}
                      </p>
                    </div>
                    <p className="font-bold">
                      {formatCurrency(
                        Number(business.services[0].price),
                        business.services[0].currency
                      )}
                    </p>
                  </div>
                )}
                <ButtonLink href={`/business/${business.slug}`} className="w-full">
                  <Calendar className="mr-2 h-4 w-4" />
                  Ver y reservar
                </ButtonLink>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
