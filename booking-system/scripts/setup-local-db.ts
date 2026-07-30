import { Client } from "pg";

const DB_NAME = "booking_system";
const ADMIN_URL = "postgresql://postgres:12345@localhost:5432/postgres";
const DB_URL = `postgresql://postgres:12345@localhost:5432/${DB_NAME}`;

async function main() {
  console.log("🔧 Configurando base de datos local...\n");

  // 1. Conectar como admin
  const admin = new Client({ connectionString: ADMIN_URL });
  await admin.connect();
  console.log("✅ Conectado a PostgreSQL local");

  // 2. Verificar si la DB existe
  const exists = await admin.query(
    `SELECT 1 FROM pg_database WHERE datname = $1`,
    [DB_NAME]
  );

  // 3. Crear la base de datos si no existe
  if (exists.rowCount === 0) {
    await admin.query(`CREATE DATABASE ${DB_NAME}`);
    console.log(`✅ Base de datos '${DB_NAME}' creada`);
  } else {
    console.log(`ℹ️  Base de datos '${DB_NAME}' ya existe`);
  }

  await admin.end();

  // 4. Conectar a la nueva DB y aplicar schema
  const db = new Client({ connectionString: DB_URL });
  await db.connect();
  console.log(`✅ Conectado a '${DB_NAME}'`);

  // 5. Leer y ejecutar el schema
  const fs = await import("fs");
  const path = await import("path");

  const schemaPath = path.join(
    process.cwd(),
    "prisma",
    "migrations",
    "20240101000000_init",
    "migration.sql"
  );
  const schema = fs.readFileSync(schemaPath, "utf-8");

  console.log("📄 Aplicando schema...");
  await db.query(schema);
  console.log("✅ Schema aplicado (10 tablas creadas)");

  // 6. Verificar tablas
  const tables = await db.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `);

  console.log(`\n📊 Tablas creadas (${tables.rowCount}):`);
  for (const row of tables.rows) {
    console.log(`   - ${row.table_name}`);
  }

  await db.end();
  console.log("\n✅ ¡Base de datos local lista!");
  console.log("\n📝 URL de conexión:");
  console.log(`   ${DB_URL}`);
}

main().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
