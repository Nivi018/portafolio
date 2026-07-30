import pg from "pg";

const { Client } = pg;

const client = new Client({
  connectionString: "postgresql://postgres:12345@localhost:5432/tickets_app",
});

try {
  await client.connect();
  const tables = [
    "User",
    "Organization",
    "Membership",
    "Ticket",
    "TicketReply",
    "Rating",
    "Tag",
    "CannedResponse",
    "ActivityLog",
  ];
  for (const table of tables) {
    const { rows } = await client.query(`SELECT COUNT(*) FROM "${table}"`);
    console.log(table.padEnd(20), rows[0].count);
  }
} finally {
  await client.end();
}
