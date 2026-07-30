"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema, loginSchema } from "@/lib/validators";
import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

export type ActionResult = {
  success: boolean;
  error?: string;
  message?: string;
};

export async function registerAction(
  data: z.infer<typeof registerSchema>
): Promise<ActionResult> {
  try {
    const validated = registerSchema.safeParse(data);

    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0]?.message || "Datos inválidos",
      };
    }

    const { name, email, password, phone } = validated.data;

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return {
        success: false,
        error: "Ya existe una cuenta con este email",
      };
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 12);

    // Crear usuario
    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        role: "CLIENT",
      },
    });

    // Auto login después del registro
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    return {
      success: true,
      message: "Cuenta creada exitosamente",
    };
  } catch (error) {
    console.error("Error en registerAction:", error);
    return {
      success: false,
      error: "Error al crear la cuenta. Intenta de nuevo.",
    };
  }
}

export async function loginAction(
  data: z.infer<typeof loginSchema>
): Promise<ActionResult> {
  try {
    const validated = loginSchema.safeParse(data);

    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0]?.message || "Datos inválidos",
      };
    }

    await signIn("credentials", {
      email: validated.data.email,
      password: validated.data.password,
      redirect: false,
    });

    return {
      success: true,
      message: "Inicio de sesión exitoso",
    };
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        return {
          success: false,
          error: "Email o contraseña incorrectos",
        };
      }
      return {
        success: false,
        error: "Error de autenticación",
      };
    }
    console.error("Error en loginAction:", error);
    return {
      success: false,
      error: "Error al iniciar sesión. Intenta de nuevo.",
    };
  }
}
