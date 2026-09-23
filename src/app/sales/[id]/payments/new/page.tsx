import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { getSaleDetail } from "@/application/get-sale-detail";
import { PaymentRegistration } from "@/components/payment-registration";
import { requireAuthenticatedUser } from "@/lib/auth";

export default async function NewPaymentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();

  const { id } = await params;
  const user = await requireAuthenticatedUser();
  const result = await getSaleDetail({
    id,
    ownerId: user.id,
  });

  if (result.databaseUnavailable) {
    return (
      <div className="app-frame">
        <main className="main-content">
          <section
            className="empty-state"
            aria-labelledby="payment-unavailable"
          >
            <h1 id="payment-unavailable">No se pudo registrar el pago.</h1>
            <p>
              Configure la base de datos de desarrollo para consultar ventas y
              registrar pagos.
            </p>
            <Link className="secondary-action action-link" href="/">
              VOLVER A MIS VENTAS
            </Link>
          </section>
        </main>
      </div>
    );
  }

  if (!result.sale || result.sale.kind === "COMPLETED") {
    notFound();
  }

  return (
    <div className="app-frame">
      <main className="main-content narrow">
        <Link className="back-link" href={`/sales/${result.sale.summary.id}`}>
          ← VOLVER A LA VENTA
        </Link>
        <PaymentRegistration sale={result.sale.summary} />
      </main>
    </div>
  );
}
