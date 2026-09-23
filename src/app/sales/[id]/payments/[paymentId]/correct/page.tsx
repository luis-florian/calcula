import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { getPaymentDetail } from "@/application/get-payment-plan";
import { PaymentCorrection } from "@/components/payment-correction";

export default async function CorrectPaymentPage({
  params,
}: {
  params: Promise<{ id: string; paymentId: string }>;
}) {
  await connection();

  const { id, paymentId } = await params;
  const result = await getPaymentDetail({
    financingId: id,
    ownerId: "dev_user",
    paymentId,
  });

  if (result.databaseUnavailable) {
    return (
      <div className="app-frame">
        <main className="main-content">
          <section
            className="empty-state"
            aria-labelledby="correction-unavailable"
          >
            <h1 id="correction-unavailable">No se pudo corregir el pago.</h1>
            <p>
              Configure la base de datos de desarrollo para consultar pagos.
            </p>
            <Link className="secondary-action action-link" href="/">
              VOLVER A MIS VENTAS
            </Link>
          </section>
        </main>
      </div>
    );
  }

  if (!result.payment) {
    notFound();
  }

  return (
    <div className="app-frame">
      <main className="main-content narrow">
        <Link className="back-link" href={`/sales/${id}/payments/${paymentId}`}>
          ← VOLVER AL PAGO
        </Link>
        <PaymentCorrection financingId={id} payment={result.payment} />
      </main>
    </div>
  );
}
