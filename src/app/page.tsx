import { connection } from "next/server";

import { listActiveSales } from "@/application/list-active-sales";
import { Simulator } from "@/components/simulator";
import { requireAuthenticatedUser } from "@/lib/auth";

export default async function Home() {
  await connection();

  const user = await requireAuthenticatedUser();
  const activeSales = await listActiveSales(user.id);

  return (
    <Simulator
      completedSales={activeSales.completedSales}
      initialSales={activeSales.sales}
      salesUnavailable={activeSales.databaseUnavailable}
    />
  );
}
