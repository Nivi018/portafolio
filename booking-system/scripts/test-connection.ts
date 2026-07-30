import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

async function testConnection() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error("❌ DATABASE_URL no definida");
    process.exit(1);
  }

  console.log("🔌 Probando conexión a Supabase...");
  console.log("URL:", connectionString.replace(/:[^:@]+@/, ":****@"));

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    const userCount = await prisma.user.count();
    const businessCount = await prisma.business.count();
    const serviceCount = await prisma.service.count();
    const appointmentCount = await prisma.appointment.count();

    console.log("\n✅ ¡Conexión exitosa!");
    console.log(`   👥 Usuarios: ${userCount}`);
    console.log(`   🏢 Negocios: ${businessCount}`);
    console.log(`   💼 Servicios: ${serviceCount}`);
    console.log(`   📅 Reservas: ${appointmentCount}`);
  } catch (error: unknown) {
    const err = error as Error;
    console.error("\n❌ Error de conexión:");
    console.error("   ", err.message);

    if (err.message.includes("ENOTFOUND")) {
      console.log("\n💡 Posibles soluciones:");
      console.log("   1. Verifica que el PROJECT-REF sea correcto");
      console.log("   2. Verifica que la región sea correcta");
      console.log("   3. Prueba con otra región (us-west-1, eu-west-1, etc.)");
    }
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
