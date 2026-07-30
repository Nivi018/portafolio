import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Load .env from the monorepo root
config({ path: "../../.env" });

export default defineConfig({
  schema: "src/database/prisma/schema.prisma",
  migrations: {
    path: "src/database/prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
