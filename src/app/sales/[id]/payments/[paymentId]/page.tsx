import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { getPaymentDetail } from "@/application/get-payment-plan";

export default async function PaymentDetailPage({
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
    return <UnavailableMessage />;
  }

  if (!result.payment || !result.saleName) {
    notFound();
  }

  return (
    <div className="app-frame">
      <main className="main-content narrow">
        <Link className="back-link" href={`/sales/${id}/payments`}>
          ← PAGOS RECIBIDOS
        </Link>

        <section
          className="payment-detail-view"
          aria-labelledby="payment-title"
        >
          <p className="eyebrow">{result.saleName}</p>
          <h1 id="payment-title">Pago del {result.payment.paymentDate}</h1>
          <p className="hero-number">{result.payment.amount}</p>

          <dl className="payment-preview-summary">
            <SummaryItem label="Interés" value={result.payment.interest} />
            <SummaryItem
              label="Abono a deuda"
              value={result.payment.principal}
            />
            <SummaryItem
              label="Saldo anterior"
              value={result.payment.openingBalance}
            />
            <SummaryItem
              label="Saldo resultante"
              value={result.payment.closingBalance}
            />
            <SummaryItem
              label="Días calculados"
              value={`${result.payment.daysElapsed}`}
            />
          </dl>
          <Link
            className="secondary-action wide"
            href={`/sales/${id}/payments/${paymentId}/correct`}
          >
            Corregir este pago
          </Link>
        </section>
      </main>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="summary-item">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function UnavailableMessage() {
  return (
    <div className="app-frame">
      <main className="main-content">
        <section className="empty-state" aria-labelledby="payment-unavailable">
          <h1 id="payment-unavailable">No se pudo abrir el pago.</h1>
          <p>Configure la base de datos de desarrollo para consultar pagos.</p>
          <Link className="secondary-action action-link" href="/">
            VOLVER A MIS VENTAS
          </Link>
        </section>
      </main>
    </div>
  );
}
