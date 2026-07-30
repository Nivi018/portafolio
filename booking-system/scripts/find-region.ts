import "dotenv/config";
import { Client } from "pg";

const PROJECT_REF = "bmrqlujvkkmtxjvuqrph";
const PASSWORD = "98741236bussines";

const regions = [
  "us-east-1",
  "us-west-1",
  "us-west-2",
  "eu-west-1",
  "eu-west-2",
  "eu-central-1",
  "ap-southeast-1",
  "ap-southeast-2",
  "ap-northeast-1",
  "ap-northeast-2",
  "ap-south-1",
  "sa-east-1",
  "ca-central-1",
];

async function testRegion(region: string) {
  const client = new Client({
    connectionString: `postgresql://postgres.${PROJECT_REF}:${PASSWORD}@aws-0-${region}.pooler.supabase.com:5432/postgres`,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 8000,
  });

  try {
    await client.connect();
    const res = await client.query("SELECT 1 as test, current_database() as db");
    console.log(`✅ ${region}: OK - DB: ${res.rows[0].db}`);
    await client.end();
    return region;
  } catch (err) {
    const e = err as Error;
    const msg = e.message.split("\n")[0].substring(0, 60);
    console.log(`❌ ${region}: ${msg}`);
    return null;
  }
}

async function main() {
  console.log("🔍 Probando todas las regiones del pooler de Supabase...\n");

  for (const region of regions) {
    const result = await testRegion(region);
    if (result) {
      console.log(`\n🎉 ¡REGIÓN ENCONTRADA: ${result}!`);
      console.log(
        `\nUsa esta URL en tu .env:`
      );
      console.log(
        `postgresql://postgres.${PROJECT_REF}:${PASSWORD}@aws-0-${result}.pooler.supabase.com:5432/postgres`
      );
      break;
    }
  }
}

main();
