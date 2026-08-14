// src/lib/db.ts
// Prisma 7 client singleton using the @prisma/adapter-pg driver adapter.
// Prisma 7 requires an explicit driver adapter — the internal Rust connection
// handler has been removed.
//
// Import `db` everywhere instead of instantiating PrismaClient directly.

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  });

  return new PrismaClient({
    adapter,
    // log:
    //   process.env.NODE_ENV === "development"
    //     ? ["query", "error", "warn"]
    //     : ["error"],
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Check if cached client is missing newly generated models in dev mode
if (globalForPrisma.prisma && !("restaurantSettings" in globalForPrisma.prisma)) {
  globalForPrisma.prisma = undefined;
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}



