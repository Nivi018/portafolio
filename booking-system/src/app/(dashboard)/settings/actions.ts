"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import * as bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  profileSchema,
  businessSchema,
  changePasswordSchema,
  blockedDateSchema,
} from "@/lib/validators";

export type ProfileResult = {
  success: boolean;
  error?: string;
};

// ============================================
// Profile actions
// ============================================

export async function updateProfileAction(
  data: z.infer<typeof profileSchema>
): Promise<ProfileResult> {
  try {
    const session = await auth();
    if (!session?.user) return { success: false, error: "No autorizado" };

    const validated = profileSchema.safeParse(data);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0]?.message || "Datos inválidos",
      };
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: validated.data.name,
        phone: validated.data.phone,
        image: validated.data.image || null,
      },
    });

    revalidatePath("/dashboard/client");
    revalidatePath("/dashboard/client/profile");
    revalidatePath("/dashboard/business");
    return { success: true };
  } catch (error) {
    console.error("Error en updateProfileAction:", error);
    return { success: false, error: "Error al actualizar perfil" };
  }
}

export async function changePasswordAction(
  data: z.infer<typeof changePasswordSchema>
): Promise<ProfileResult> {
  try {
    const session = await auth();
    if (!session?.user) return { success: false, error: "No autorizado" };

    const validated = changePasswordSchema.safeParse(data);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0]?.message || "Datos inválidos",
      };
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || !user.password) {
      return { success: false, error: "Usuario no encontrado" };
    }

    const isValid = await bcrypt.compare(
      validated.data.currentPassword,
      user.password
    );

    if (!isValid) {
      return { success: false, error: "Contraseña actual incorrecta" };
    }

    const hashedPassword = await bcrypt.hash(validated.data.newPassword, 12);

    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword },
    });

    return { success: true };
  } catch (error) {
    console.error("Error en changePasswordAction:", error);
    return { success: false, error: "Error al cambiar contraseña" };
  }
}

// ============================================
// Business actions
// ============================================

export async function updateBusinessAction(
  data: z.infer<typeof businessSchema>
): Promise<ProfileResult> {
  try {
    const session = await auth();
    if (!session?.user) return { success: false, error: "No autorizado" };

    const validated = businessSchema.safeParse(data);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0]?.message || "Datos inválidos",
      };
    }

    const business = await prisma.business.findUnique({
      where: { ownerId: session.user.id },
    });

    if (!business) {
      return { success: false, error: "Negocio no encontrado" };
    }

    await prisma.business.update({
      where: { id: business.id },
      data: {
        name: validated.data.name,
        description: validated.data.description,
        address: validated.data.address,
        phone: validated.data.phone,
        email: validated.data.email || null,
        website: validated.data.website || null,
      },
    });

    revalidatePath("/dashboard/business");
    revalidatePath("/dashboard/business/settings");
    revalidatePath(`/business/${business.slug}`);
    return { success: true };
  } catch (error) {
    console.error("Error en updateBusinessAction:", error);
    return { success: false, error: "Error al actualizar negocio" };
  }
}

// ============================================
// Blocked dates actions
// ============================================

export async function addBlockedDateAction(
  data: z.infer<typeof blockedDateSchema>
): Promise<ProfileResult> {
  try {
    const session = await auth();
    if (!session?.user) return { success: false, error: "No autorizado" };

    const business = await prisma.business.findUnique({
      where: { ownerId: session.user.id },
    });

    if (!business) {
      return { success: false, error: "Negocio no encontrado" };
    }

    const validated = blockedDateSchema.safeParse(data);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0]?.message || "Datos inválidos",
      };
    }

    const date = new Date(validated.data.date + "T00:00:00");

    // Verificar que no exista ya
    const existing = await prisma.blockedDate.findUnique({
      where: {
        businessId_date: {
          businessId: business.id,
          date,
        },
      },
    });

    if (existing) {
      return { success: false, error: "Esta fecha ya está bloqueada" };
    }

    await prisma.blockedDate.create({
      data: {
        businessId: business.id,
        date,
        reason: validated.data.reason,
      },
    });

    revalidatePath("/dashboard/business/schedule");
    return { success: true };
  } catch (error) {
    console.error("Error en addBlockedDateAction:", error);
    return { success: false, error: "Error al bloquear fecha" };
  }
}

export async function removeBlockedDateAction(
  blockedDateId: string
): Promise<ProfileResult> {
  try {
    const session = await auth();
    if (!session?.user) return { success: false, error: "No autorizado" };

    const business = await prisma.business.findUnique({
      where: { ownerId: session.user.id },
    });

    if (!business) return { success: false, error: "Negocio no encontrado" };

    const blockedDate = await prisma.blockedDate.findUnique({
      where: { id: blockedDateId },
    });

    if (!blockedDate || blockedDate.businessId !== business.id) {
      return { success: false, error: "Fecha bloqueada no encontrada" };
    }

    await prisma.blockedDate.delete({
      where: { id: blockedDateId },
    });

    revalidatePath("/dashboard/business/schedule");
    return { success: true };
  } catch (error) {
    console.error("Error en removeBlockedDateAction:", error);
    return { success: false, error: "Error al desbloquear fecha" };
  }
}
