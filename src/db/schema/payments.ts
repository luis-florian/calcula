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

import { financings } from "@/db/schema/financings";

export const paymentStatusEnum = pgEnum("payment_status", [
  "CONFIRMED",
  "VOIDED",
]);

export const payments = pgTable("payments", {
  id: varchar("id", { length: 64 }).primaryKey(),
  financingId: varchar("financing_id", { length: 64 })
    .notNull()
    .references(() => financings.id),
  paymentDate: date("payment_date", { mode: "string" }).notNull(),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  previousPaymentDate: date("previous_payment_date", {
    mode: "string",
  }).notNull(),
  daysElapsed: integer("days_elapsed").notNull(),
  openingBalance: numeric("opening_balance", {
    precision: 14,
    scale: 2,
  }).notNull(),
  interestAmount: numeric("interest_amount", {
    precision: 14,
    scale: 2,
  }).notNull(),
  principalAmount: numeric("principal_amount", {
    precision: 14,
    scale: 2,
  }).notNull(),
  closingBalance: numeric("closing_balance", {
    precision: 14,
    scale: 2,
  }).notNull(),
  status: paymentStatusEnum("status").default("CONFIRMED").notNull(),
  voidedAt: timestamp("voided_at", { withTimezone: true }),
  voidReason: text("void_reason"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
