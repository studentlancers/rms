"use strict";
// src/lib/db.ts
// Prisma 7 client singleton using the @prisma/adapter-pg driver adapter.
// Prisma 7 requires an explicit driver adapter — the internal Rust connection
// handler has been removed.
//
// Import `db` everywhere instead of instantiating PrismaClient directly.
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
function createPrismaClient() {
    const adapter = new adapter_pg_1.PrismaPg({
        connectionString: process.env.DATABASE_URL,
    });
    return new client_1.PrismaClient({
        adapter,
        // log:
        //   process.env.NODE_ENV === "development"
        //     ? ["query", "error", "warn"]
        //     : ["error"],
    });
}
const globalForPrisma = globalThis;
exports.db = globalForPrisma.prisma ?? createPrismaClient();
if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = exports.db;
}
