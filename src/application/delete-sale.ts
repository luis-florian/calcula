import { and, eq } from "drizzle-orm";

import { getDb } from "@/db/client";
import { financings, payments } from "@/db/schema";

export async function deleteSale(input: {
  financingId: string;
  ownerId: string;
}): Promise<boolean> {
  const db = getDb();

  return db.transaction(async (tx) => {
    const [financing] = await tx
      .select({ id: financings.id })
      .from(financings)
      .where(
        and(
          eq(financings.id, input.financingId),
          eq(financings.ownerId, input.ownerId),
        ),
      )
      .for("update")
      .limit(1);

    if (!financing) {
      return false;
    }

    await tx
      .delete(payments)
      .where(eq(payments.financingId, input.financingId));

    await tx
      .delete(financings)
      .where(
        and(
          eq(financings.id, input.financingId),
          eq(financings.ownerId, input.ownerId),
        ),
      );

    return true;
  });
}
