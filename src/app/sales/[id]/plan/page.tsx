import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { getPaymentPlan } from "@/application/get-payment-plan";

export default async function PaymentPlanPage({
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

  return (
    <div className="app-frame">
      <main className="main-content narrow">
        <Link className="back-link" href={`/sales/${id}`}>
          ← VOLVER A LA VENTA
        </Link>

        <section className="ledger-view" aria-labelledby="plan-title">
          <p className="eyebrow">Plan de pagos</p>
          <h1 id="plan-title">{result.plan.saleName}</h1>

          {result.plan.projectedPayment ? (
            <p className="payment-note">
              Pago futuro aproximado: {result.plan.projectedPayment}
            </p>
          ) : null}

          <section className="ledger-section" aria-labelledby="past-title">
            <h2 id="past-title">Pagos recibidos</h2>
            {result.plan.history.length > 0 ? (
              <div className="ledger-list">
                {result.plan.history.map((payment) => (
                  <article className="ledger-row completed" key={payment.id}>
                    <div>
                      <p className="ledger-date">{payment.paymentDate}</p>
                      <p className="ledger-amount">{payment.amount}</p>
                    </div>
                    <span aria-label="Confirmado">✓</span>
                  </article>
                ))}
              </div>
            ) : (
              <p className="muted-copy">Todavía no hay pagos recibidos.</p>
            )}
          </section>

          <div className="today-divider">Futuro</div>

          <section className="ledger-section" aria-labelledby="future-title">
            <h2 id="future-title">Pagos futuros</h2>
            {result.plan.futurePayments.length > 0 ? (
              <div className="ledger-list">
                {result.plan.futurePayments.slice(0, 12).map((payment) => (
                  <article
                    className="ledger-row"
                    key={`${payment.paymentNumber}-${payment.expectedDate}`}
                  >
                    <div>
                      <p className="ledger-date">{payment.expectedDate}</p>
                      <p className="ledger-amount">{payment.payment}</p>
                    </div>
                    <p className="ledger-balance">
                      Saldo esperado {payment.closingBalance}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="muted-copy">No hay pagos futuros proyectados.</p>
            )}
          </section>
        </section>
      </main>
    </div>
  );
}

function UnavailableMessage() {
  return (
    <div className="app-frame">
      <main className="main-content">
        <section className="empty-state" aria-labelledby="plan-unavailable">
          <h1 id="plan-unavailable">No se pudo abrir el plan.</h1>
          <p>Configure la base de datos de desarrollo para consultar pagos.</p>
          <Link className="secondary-action action-link" href="/">
            VOLVER A MIS VENTAS
          </Link>
        </section>
      </main>
    </div>
  );
}
