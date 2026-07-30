import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { fakerES as faker } from "@faker-js/faker";
import * as bcrypt from "bcryptjs";
import { addMinutes, getDayOfWeek, timeToMinutes, minutesToTime } from "../src/lib/utils";

// Configurar Prisma con el adapter
const connectionString = process.env.DATABASE_URL;

if (!connectionString || connectionString.includes("[PASSWORD]")) {
  console.error(
    "❌ ERROR: DATABASE_URL no está configurada correctamente.\n" +
      "Por favor configura tu .env con la URL real de Supabase antes de ejecutar el seed.\n" +
      "Ejemplo: DATABASE_URL=postgresql://postgres:password@db.xxx.supabase.co:5432/postgres"
  );
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

/**
 * Script de seed para el sistema de reservas
 * Crea datos de prueba realistas para desarrollo
 */
async function main() {
  console.log("🌱 Iniciando seed de la base de datos...\n");

  try {
    // 1. Limpiar datos existentes
    console.log("🧹 Limpiando datos existentes...");
    await prisma.payment.deleteMany();
    await prisma.appointment.deleteMany();
    await prisma.blockedDate.deleteMany();
    await prisma.businessHours.deleteMany();
    await prisma.service.deleteMany();
    await prisma.business.deleteMany();
    await prisma.session.deleteMany();
    await prisma.account.deleteMany();
    await prisma.user.deleteMany();
    console.log("   ✅ Datos limpiados\n");

    // 2. Crear usuarios
    console.log("👥 Creando usuarios...");
    const hashedPassword = await bcrypt.hash("password123", 12);

    // Usuario admin
    const admin = await prisma.user.create({
      data: {
        email: "admin@bookingsystem.com",
        name: "Administrador",
        password: hashedPassword,
        role: "SUPER_ADMIN",
        emailVerified: new Date(),
      },
    });
    console.log(`   ✅ Admin: ${admin.email}`);

    // Usuarios clientes
    const clients = await Promise.all(
      Array.from({ length: 10 }).map(async (_, i) => {
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        return prisma.user.create({
          data: {
            email: `cliente${i + 1}@example.com`,
            name: `${firstName} ${lastName}`,
            password: hashedPassword,
            phone: faker.phone.number(),
            role: "CLIENT",
            emailVerified: new Date(),
          },
        });
      })
    );
    console.log(`   ✅ ${clients.length} clientes creados`);

    // Usuarios dueños de negocio
    const businessOwners = await Promise.all(
      Array.from({ length: 3 }).map(async (_, i) => {
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        return prisma.user.create({
          data: {
            email: `dueno${i + 1}@example.com`,
            name: `${firstName} ${lastName}`,
            password: hashedPassword,
            phone: faker.phone.number(),
            role: "BUSINESS_OWNER",
            emailVerified: new Date(),
          },
        });
      })
    );
    console.log(`   ✅ ${businessOwners.length} dueños creados\n`);

    // 3. Crear negocios
    console.log("🏢 Creando negocios...");
    const businessData = [
      {
        owner: businessOwners[0],
        name: "Barbería El Corte Perfecto",
        description:
          "Barbería especializada en cortes modernos y clásicos. Más de 10 años de experiencia.",
        type: "barbershop",
        services: [
          { name: "Corte de cabello", duration: 30, price: 200 },
          { name: "Corte + Barba", duration: 45, price: 280 },
          { name: "Corte niño", duration: 20, price: 150 },
          { name: "Afeitado clásico", duration: 30, price: 180 },
        ],
        hours: {
          MONDAY: { open: "09:00", close: "20:00" },
          TUESDAY: { open: "09:00", close: "20:00" },
          WEDNESDAY: { open: "09:00", close: "20:00" },
          THURSDAY: { open: "09:00", close: "20:00" },
          FRIDAY: { open: "09:00", close: "21:00" },
          SATURDAY: { open: "10:00", close: "21:00" },
          SUNDAY: { open: "10:00", close: "14:00" },
        },
      },
      {
        owner: businessOwners[1],
        name: "Spa Relajación Total",
        description:
          "Centro de bienestar y spa con masajes terapéuticos, faciales y tratamientos corporales.",
        type: "spa",
        services: [
          { name: "Masaje relajante 60min", duration: 60, price: 800 },
          { name: "Masaje terapéutico 90min", duration: 90, price: 1100 },
          { name: "Facial hidratante", duration: 45, price: 600 },
          { name: "Tratamiento corporal", duration: 120, price: 1500 },
        ],
        hours: {
          MONDAY: { open: "10:00", close: "19:00" },
          TUESDAY: { open: "10:00", close: "19:00" },
          WEDNESDAY: { open: "10:00", close: "19:00" },
          THURSDAY: { open: "10:00", close: "19:00" },
          FRIDAY: { open: "10:00", close: "20:00" },
          SATURDAY: { open: "09:00", close: "20:00" },
          SUNDAY: null, // Cerrado
        },
      },
      {
        owner: businessOwners[2],
        name: "Consultorio Dental Sonrisa",
        description:
          "Consultorio dental con tecnología de punta. Limpiezas, ortodoncia y estética dental.",
        type: "dental",
        services: [
          { name: "Consulta general", duration: 30, price: 500 },
          { name: "Limpieza dental", duration: 45, price: 800 },
          { name: "Blanqueamiento", duration: 60, price: 2500 },
          { name: "Ortodoncia consulta", duration: 45, price: 600 },
        ],
        hours: {
          MONDAY: { open: "08:00", close: "18:00" },
          TUESDAY: { open: "08:00", close: "18:00" },
          WEDNESDAY: { open: "08:00", close: "18:00" },
          THURSDAY: { open: "08:00", close: "18:00" },
          FRIDAY: { open: "08:00", close: "15:00" },
          SATURDAY: null, // Cerrado
          SUNDAY: null, // Cerrado
        },
      },
    ];

    const businesses = [];
    for (const data of businessData) {
      const slug = data.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");

      const business = await prisma.business.create({
        data: {
          ownerId: data.owner.id,
          name: data.name,
          slug,
          description: data.description,
          address: faker.location.streetAddress(),
          phone: faker.phone.number(),
          email: data.owner.email,
          website: `https://${slug}.com`,
          active: true,
        },
      });

      // Crear servicios
      for (const svc of data.services) {
        await prisma.service.create({
          data: {
            businessId: business.id,
            name: svc.name,
            description: `Servicio profesional de ${svc.name.toLowerCase()}`,
            duration: svc.duration,
            price: svc.price,
            currency: "MXN",
            active: true,
            maxBookingsPerSlot: 1,
          },
        });
      }

      // Crear horarios
      for (const [day, hours] of Object.entries(data.hours)) {
        if (hours) {
          await prisma.businessHours.create({
            data: {
              businessId: business.id,
              dayOfWeek: day as
                | "SUNDAY"
                | "MONDAY"
                | "TUESDAY"
                | "WEDNESDAY"
                | "THURSDAY"
                | "FRIDAY"
                | "SATURDAY",
              openTime: hours.open,
              closeTime: hours.close,
              isActive: true,
            },
          });
        }
      }

      businesses.push(business);
      console.log(`   ✅ ${business.name} creado con ${data.services.length} servicios`);
    }
    console.log();

    // 4. Crear fechas bloqueadas (vacaciones, feriados)
    console.log("🚫 Creando fechas bloqueadas...");
    const today = new Date();
    const nextYear = new Date(today.getFullYear() + 1, 11, 25); // Navidad del próximo año
    const blockedDates = [
      { business: businesses[0], date: nextYear, reason: "Navidad - Cerrado" },
      {
        business: businesses[0],
        date: new Date(today.getFullYear() + 1, 0, 1),
        reason: "Año Nuevo - Cerrado",
      },
      {
        business: businesses[1],
        date: new Date(today.getFullYear() + 1, 11, 25),
        reason: "Navidad - Cerrado",
      },
    ];

    for (const blocked of blockedDates) {
      const dateOnly = new Date(
        blocked.date.getFullYear(),
        blocked.date.getMonth(),
        blocked.date.getDate()
      );
      await prisma.blockedDate.create({
        data: {
          businessId: blocked.business.id,
          date: dateOnly,
          reason: blocked.reason,
        },
      });
    }
    console.log(`   ✅ ${blockedDates.length} fechas bloqueadas creadas\n`);

    // 5. Crear reservas de ejemplo
    console.log("📅 Creando reservas de ejemplo...");
    let appointmentCount = 0;

    // Reservas pasadas (completadas)
    for (let i = 0; i < 15; i++) {
      const business = faker.helpers.arrayElement(businesses);
      const services = await prisma.service.findMany({
        where: { businessId: business.id },
      });
      const service = faker.helpers.arrayElement(services);
      const client = faker.helpers.arrayElement(clients);

      const daysAgo = faker.number.int({ min: 1, max: 60 });
      const appointmentDate = new Date(today);
      appointmentDate.setDate(today.getDate() - daysAgo);

      const startMinutes = faker.number.int({ min: 540, max: 1020 - service.duration }); // 9:00 - 17:00
      const startTime = minutesToTime(startMinutes);
      const endTime = addMinutes(startTime, service.duration);

      await prisma.appointment.create({
        data: {
          clientId: client.id,
          businessId: business.id,
          serviceId: service.id,
          date: appointmentDate,
          startTime,
          endTime,
          status: faker.helpers.arrayElement([
            "COMPLETED",
            "COMPLETED",
            "COMPLETED",
            "CANCELLED",
          ]),
          clientName: client.name,
          clientEmail: client.email,
          clientPhone: client.phone,
          notes: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.3 }),
        },
      });
      appointmentCount++;
    }

    // Reservas futuras (confirmadas y pendientes)
    for (let i = 0; i < 20; i++) {
      const business = faker.helpers.arrayElement(businesses);
      const services = await prisma.service.findMany({
        where: { businessId: business.id },
      });
      const service = faker.helpers.arrayElement(services);
      const client = faker.helpers.arrayElement(clients);

      const daysAhead = faker.number.int({ min: 1, max: 30 });
      const appointmentDate = new Date(today);
      appointmentDate.setDate(today.getDate() + daysAhead);

      // Verificar que el día no esté bloqueado
      const dayOfWeek = getDayOfWeek(appointmentDate);
      const businessHours = await prisma.businessHours.findUnique({
        where: {
          businessId_dayOfWeek: {
            businessId: business.id,
            dayOfWeek: dayOfWeek as
              | "SUNDAY"
              | "MONDAY"
              | "TUESDAY"
              | "WEDNESDAY"
              | "THURSDAY"
              | "FRIDAY"
              | "SATURDAY",
          },
        },
      });

      if (!businessHours) continue;

      const openMinutes = timeToMinutes(businessHours.openTime);
      const closeMinutes = timeToMinutes(businessHours.closeTime);

      if (closeMinutes - openMinutes < service.duration) continue;

      const startMinutes = faker.number.int({
        min: openMinutes,
        max: closeMinutes - service.duration,
      });
      const startTime = minutesToTime(startMinutes);
      const endTime = addMinutes(startTime, service.duration);

      await prisma.appointment.create({
        data: {
          clientId: client.id,
          businessId: business.id,
          serviceId: service.id,
          date: appointmentDate,
          startTime,
          endTime,
          status: faker.helpers.arrayElement([
            "PENDING",
            "CONFIRMED",
            "CONFIRMED",
            "CONFIRMED",
          ]),
          clientName: client.name,
          clientEmail: client.email,
          clientPhone: client.phone,
          notes: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.2 }),
        },
      });
      appointmentCount++;
    }

    console.log(`   ✅ ${appointmentCount} reservas creadas\n`);

    // 6. Resumen
    console.log("📊 Resumen del seed:");
    const counts = {
      usuarios: await prisma.user.count(),
      negocios: await prisma.business.count(),
      servicios: await prisma.service.count(),
      horarios: await prisma.businessHours.count(),
      fechasBloqueadas: await prisma.blockedDate.count(),
      reservas: await prisma.appointment.count(),
    };

    for (const [key, value] of Object.entries(counts)) {
      console.log(`   ${key}: ${value}`);
    }

    console.log("\n🔑 Credenciales de prueba:");
    console.log("   Admin:       admin@bookingsystem.com / password123");
    console.log("   Negocio 1:   dueno1@example.com / password123 (Barbería)");
    console.log("   Negocio 2:   dueno2@example.com / password123 (Spa)");
    console.log("   Negocio 3:   dueno3@example.com / password123 (Dental)");
    console.log("   Cliente 1:   cliente1@example.com / password123");
    console.log("   ... y 9 clientes más\n");

    console.log("✅ ¡Seed completado exitosamente!");
  } catch (error) {
    console.error("❌ Error durante el seed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
