import { connection } from "next/server";

import { listActiveSales } from "@/application/list-active-sales";
import { Simulator } from "@/components/simulator";

export default async function Home() {
  await connection();

  const activeSales = await listActiveSales("dev_user");

  return (
    <Simulator
      completedSales={activeSales.completedSales}
      initialSales={activeSales.sales}
      salesUnavailable={activeSales.databaseUnavailable}
    />
  );
}
