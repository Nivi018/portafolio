import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

async function test() {
  console.log("🔌 Probando Prisma con PostgreSQL local...\n");

  const connectionString = process.env.DATABASE_URL;
  console.log("URL:", connectionString?.replace(/:[^:@]+@/, ":****@"));

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    const users = await prisma.user.count();
    const businesses = await prisma.business.count();
    const services = await prisma.service.count();
    const appointments = await prisma.appointment.count();

    console.log("\n✅ ¡Conexión exitosa con Prisma!");
    console.log(`   👥 Usuarios: ${users}`);
    console.log(`   🏢 Negocios: ${businesses}`);
    console.log(`   💼 Servicios: ${services}`);
    console.log(`   📅 Reservas: ${appointments}`);

    // Probar una query con relaciones
    const business = await prisma.business.findFirst({
      include: {
        services: true,
        businessHours: true,
        _count: { select: { appointments: true } },
      },
    });

    if (business) {
      console.log(`\n📋 Negocio de ejemplo: ${business.name}`);
      console.log(`   Servicios: ${business.services.length}`);
      console.log(`   Horarios: ${business.businessHours.length}`);
      console.log(`   Reservas: ${business._count.appointments}`);
    }
  } catch (error) {
    console.error("\n❌ Error:", (error as Error).message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
