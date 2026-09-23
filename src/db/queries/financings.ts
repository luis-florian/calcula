import { and, asc, eq } from "drizzle-orm";

import { getDb } from "@/db/client";
import { createId } from "@/db/ids";
import { financings, type Financing, type NewFinancing } from "@/db/schema";

export type CreateFinancingInput = Omit<
  NewFinancing,
  "createdAt" | "id" | "updatedAt"
>;

export async function createFinancing(
  input: CreateFinancingInput,
): Promise<Financing> {
  const db = getDb();
  const [created] = await db
    .insert(financings)
    .values({
      id: createId("fin"),
      ...input,
    })
    .returning();

  return created;
}

export async function listActiveFinancingsByOwner(
  ownerId: string,
): Promise<Financing[]> {
  const db = getDb();

  return db
    .select()
    .from(financings)
    .where(
      and(eq(financings.ownerId, ownerId), eq(financings.status, "ACTIVE")),
    )
    .orderBy(asc(financings.createdAt));
}
