import { Client } from "pg";

const passwords = ["12345", "123456", "admin", "postgres"];

async function tryPassword(password: string) {
  const client = new Client({
    host: "localhost",
    port: 5432,
    user: "postgres",
    password,
    database: "postgres",
    connectionTimeoutMillis: 5000,
  });

  try {
    await client.connect();
    console.log(`✅ ¡Contraseña correcta: "${password}"!`);
    const res = await client.query("SELECT version()");
    console.log("Versión:", res.rows[0].version.substring(0, 50));
    await client.end();
    return true;
  } catch (err) {
    const e = err as Error;
    if (e.message.includes("autentificación")) {
      console.log(`❌ "${password}" - incorrecta`);
    } else {
      console.log(`❌ "${password}" - ${e.message.substring(0, 60)}`);
    }
    return false;
  }
}

async function main() {
  console.log("🔍 Probando contraseñas comunes para PostgreSQL local...\n");
  for (const pwd of passwords) {
    const success = await tryPassword(pwd);
    if (success) {
      console.log(`\n📝 Usa esta contraseña en tu .env:`);
      console.log(`DATABASE_URL="postgresql://postgres:${pwd}@localhost:5432/booking_system"`);
      break;
    }
  }
}

main();
