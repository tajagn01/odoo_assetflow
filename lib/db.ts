import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined };

let prisma: PrismaClient;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set in environmental variables.");
}

const poolConfig: pg.PoolConfig = {
  connectionString,
  max: 10,
  connectionTimeoutMillis: 15000,
  idleTimeoutMillis: 30000,
};

const createPoolAndAdapter = () => {
  const pool = new pg.Pool(poolConfig);
  pool.on("error", (err) => {
    console.error("Unexpected error on idle pg pool client:", err.message);
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
};

if (process.env.NODE_ENV === "production") {
  prisma = createPoolAndAdapter();
} else {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPoolAndAdapter();
  }
  prisma = globalForPrisma.prisma;
}

export const db = prisma;
