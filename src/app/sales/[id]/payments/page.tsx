import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { getPaymentPlan } from "@/application/get-payment-plan";

export default async function PaymentHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();

  const { id } = await params;
  const result = await getPaymentPlan({
    financingId: id,
    ownerId: "dev_user",
  });

  if (result.databaseUnavailable) {
    return <UnavailableMessage />;
  }

  if (!result.plan) {
    notFound();
  }

  const reversedHistory = [...result.plan.history].reverse();

  return (
    <div className="app-frame">
      <main className="main-content narrow">
        <Link className="back-link" href={`/sales/${id}`}>
          ← VOLVER A LA VENTA
        </Link>

        <section className="ledger-view" aria-labelledby="history-title">
          <p className="eyebrow">Pagos recibidos</p>
          <h1 id="history-title">{result.plan.saleName}</h1>

          {reversedHistory.length > 0 ? (
            <div className="history-list">
              {reversedHistory.map((payment) => (
                <Link
                  className="history-card"
                  href={`/sales/${id}/payments/${payment.id}`}
                  key={payment.id}
                >
                  <div>
                    <p className="ledger-date">{payment.paymentDate}</p>
                    <p className="ledger-amount">{payment.amount}</p>
                  </div>
                  <p>Saldo después del pago {payment.closingBalance}</p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="muted-copy">Todavía no hay pagos recibidos.</p>
          )}
        </section>
      </main>
    </div>
  );
}

function UnavailableMessage() {
  return (
    <div className="app-frame">
      <main className="main-content">
        <section className="empty-state" aria-labelledby="history-unavailable">
          <h1 id="history-unavailable">No se pudo abrir el historial.</h1>
          <p>Configure la base de datos de desarrollo para consultar pagos.</p>
          <Link className="secondary-action action-link" href="/">
            VOLVER A MIS VENTAS
          </Link>
        </section>
      </main>
    </div>
  );
}
