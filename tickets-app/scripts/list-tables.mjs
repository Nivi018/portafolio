import pg from "pg";

const { Client } = pg;

const client = new Client({
  connectionString: "postgresql://postgres:12345@localhost:5432/tickets_app",
});

try {
  await client.connect();
  const { rows } = await client.query(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename",
  );
  console.log("Tables in database:");
  for (const row of rows) {
    console.log(`  - ${row.tablename}`);
  }
} finally {
  await client.end();
}
