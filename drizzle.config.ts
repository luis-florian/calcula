import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";

loadEnvConfig(process.cwd());

const databaseUrl = process.env.DATABASE_URL;
const command = process.argv.slice(2).join(" ");
const requiresDatabase =
  command.includes("migrate") ||
  command.includes("pull") ||
  command.includes("push") ||
  command.includes("studio");

if (requiresDatabase && !databaseUrl) {
  throw new Error("DATABASE_URL is required for Drizzle database commands.");
}

export default defineConfig({
  dialect: "postgresql",
  out: "./drizzle",
  schema: "./src/db/schema/index.ts",
  dbCredentials: {
    url: databaseUrl ?? "postgresql://user:password@localhost:5432/amorta",
  },
});
