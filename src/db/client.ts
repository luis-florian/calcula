import "server-only";

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "@/db/schema";

const globalForDb = globalThis as typeof globalThis & {
  amortaPool?: Pool;
};

function getPool(): Pool {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is required to access the database.");
  }

  const pool =
    globalForDb.amortaPool ??
    new Pool({
      connectionString,
    });

  if (process.env.NODE_ENV !== "production") {
    globalForDb.amortaPool = pool;
  }

  return pool;
}

export function getDb() {
  return drizzle(getPool(), { schema });
}
