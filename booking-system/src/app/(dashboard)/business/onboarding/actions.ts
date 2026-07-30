"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { businessSchema } from "@/lib/validators";
import { slugify } from "@/lib/utils";

export type OnboardingResult = {
  success: boolean;
  error?: string;
};

export async function createBusinessAction(
  data: z.infer<typeof businessSchema>
): Promise<OnboardingResult> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "No autorizado" };
    }

    const validated = businessSchema.safeParse(data);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0]?.message || "Datos inválidos",
      };
    }

    // Verificar si ya tiene un negocio
    const existing = await prisma.business.findUnique({
      where: { ownerId: session.user.id },
    });

    if (existing) {
      return { success: false, error: "Ya tienes un negocio registrado" };
    }

    // Generar slug único
    let slug = slugify(validated.data.name);
    let counter = 1;
    while (await prisma.business.findUnique({ where: { slug } })) {
      slug = `${slugify(validated.data.name)}-${counter}`;
      counter++;
    }

    // Crear negocio y actualizar rol del usuario
    await prisma.$transaction([
      prisma.business.create({
        data: {
          ownerId: session.user.id,
          name: validated.data.name,
          slug,
          description: validated.data.description,
          address: validated.data.address,
          phone: validated.data.phone,
          email: validated.data.email || session.user.email,
          website: validated.data.website,
        },
      }),
      prisma.user.update({
        where: { id: session.user.id },
        data: { role: "BUSINESS_OWNER" },
      }),
    ]);

    revalidatePath("/dashboard/business");
    return { success: true };
  } catch (error) {
    console.error("Error en createBusinessAction:", error);
    return { success: false, error: "Error al crear el negocio" };
  }
}
