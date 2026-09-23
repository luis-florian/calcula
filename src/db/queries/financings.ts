import { and, asc, eq } from "drizzle-orm";

import { getDb } from "@/db/client";
import { createId } from "@/db/ids";
import {
  financings,
  type Financing,
  type NewFinancing,
  type financingStatusEnum,
} from "@/db/schema";

type FinancingStatus = (typeof financingStatusEnum.enumValues)[number];

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
  return listFinancingsByOwnerAndStatus({
    ownerId,
    status: "ACTIVE",
  });
}

export async function listCompletedFinancingsByOwner(
  ownerId: string,
): Promise<Financing[]> {
  return listFinancingsByOwnerAndStatus({
    ownerId,
    status: "COMPLETED",
  });
}

async function listFinancingsByOwnerAndStatus(input: {
  ownerId: string;
  status: FinancingStatus;
}): Promise<Financing[]> {
  const db = getDb();

  return db
    .select()
    .from(financings)
    .where(
      and(
        eq(financings.ownerId, input.ownerId),
        eq(financings.status, input.status),
      ),
    )
    .orderBy(asc(financings.createdAt));
}

export async function getActiveFinancingByOwner(input: {
  id: string;
  ownerId: string;
}): Promise<Financing | null> {
  return getFinancingByOwnerAndStatus({
    ...input,
    status: "ACTIVE",
  });
}

export async function getFinancingByOwner(input: {
  id: string;
  ownerId: string;
}): Promise<Financing | null> {
  const db = getDb();
  const [financing] = await db
    .select()
    .from(financings)
    .where(
      and(eq(financings.id, input.id), eq(financings.ownerId, input.ownerId)),
    )
    .limit(1);

  return financing ?? null;
}

async function getFinancingByOwnerAndStatus(input: {
  id: string;
  ownerId: string;
  status: FinancingStatus;
}): Promise<Financing | null> {
  const db = getDb();
  const [financing] = await db
    .select()
    .from(financings)
    .where(
      and(
        eq(financings.id, input.id),
        eq(financings.ownerId, input.ownerId),
        eq(financings.status, input.status),
      ),
    )
    .limit(1);

  return financing ?? null;
}
