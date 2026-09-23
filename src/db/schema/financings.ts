import {
  date,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const calculationModeEnum = pgEnum("calculation_mode", [
  "PAYMENT",
  "TERM",
]);

export const financingStatusEnum = pgEnum("financing_status", [
  "ACTIVE",
  "COMPLETED",
]);

export const financings = pgTable("financings", {
  id: varchar("id", { length: 64 }).primaryKey(),
  ownerId: varchar("owner_id", { length: 128 }).notNull(),
  name: text("name").notNull(),
  buyerName: text("buyer_name"),
  initialCapital: numeric("initial_capital", {
    precision: 14,
    scale: 2,
  }).notNull(),
  currentBalance: numeric("current_balance", {
    precision: 14,
    scale: 2,
  }).notNull(),
  annualInterestRate: numeric("annual_interest_rate", {
    precision: 8,
    scale: 4,
  }).notNull(),
  calculationMode: calculationModeEnum("calculation_mode").notNull(),
  targetPayment: numeric("target_payment", {
    precision: 14,
    scale: 2,
  }).notNull(),
  targetEndDate: date("target_end_date", { mode: "string" }).notNull(),
  startDate: date("start_date", { mode: "string" }).notNull(),
  firstPaymentDate: date("first_payment_date", { mode: "string" }).notNull(),
  expectedPaymentDay: integer("expected_payment_day").notNull(),
  status: financingStatusEnum("status").default("ACTIVE").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export type Financing = typeof financings.$inferSelect;
export type NewFinancing = typeof financings.$inferInsert;
