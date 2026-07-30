import pg from "pg";

const { Client } = pg;

const adminUrl = "postgresql://postgres:12345@localhost:5432/postgres";
const targetDb = "tickets_app";

const client = new Client({ connectionString: adminUrl });

try {
  await client.connect();
  const { rows } = await client.query(
    "SELECT 1 FROM pg_database WHERE datname = $1",
    [targetDb],
  );

  if (rows.length > 0) {
    console.log(`Database "${targetDb}" already exists.`);
  } else {
    await client.query(`CREATE DATABASE "${targetDb}"`);
    console.log(`Database "${targetDb}" created.`);
  }
} catch (err) {
  console.error("Failed to create database:", err);
  process.exit(1);
} finally {
  await client.end();
}
