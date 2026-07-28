// prisma.config.ts
// Prisma 7 configuration file.
// The database connection URL is defined here (no longer in schema.prisma).
// dotenv must be imported first — Prisma 7 does not auto-load .env files.

import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
  migrations: {
    path: "prisma/migrations",
  },
});
