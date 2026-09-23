import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { getSaleDetail } from "@/application/get-sale-detail";
import { requireAuthenticatedUser } from "@/lib/auth";

export default async function SaleDetailPage({
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
          <section className="empty-state" aria-labelledby="sale-unavailable">
            <h1 id="sale-unavailable">No se pudo abrir la venta.</h1>
            <p>
              Configure la base de datos de desarrollo para consultar ventas
              guardadas.
            </p>
            <Link className="secondary-action action-link" href="/">
              VOLVER A MIS VENTAS
            </Link>
          </section>
        </main>
      </div>
    );
  }

  if (!result.sale) {
    notFound();
  }

  if (result.sale.kind === "COMPLETED") {
    const sale = result.sale.finalSummary;

    return (
      <div className="app-frame">
        <main className="main-content">
          <article className="sale-detail" aria-labelledby="sale-title">
            <Link className="back-link" href="/">
              ← MIS VENTAS
            </Link>

            <section className="payment-result" aria-labelledby="sale-title">
              <p className="payment-check" aria-hidden="true">
                ✓
              </p>
              <h1 id="sale-title">Venta completada</h1>
              <p className="payment-form-buyer">
                {sale.name} · {sale.buyerName}
              </p>

              <dl className="payment-result-summary">
                <SummaryItem
                  label="Total recibido"
                  value={sale.totalReceived}
                />
                <SummaryItem label="Capital" value={sale.capital} />
                <SummaryItem
                  label="Intereses recibidos"
                  value={sale.totalInterest}
                />
                <SummaryItem
                  label="Primer pago"
                  value={sale.firstPaymentDate}
                />
                <SummaryItem label="Último pago" value={sale.lastPaymentDate} />
              </dl>

              <Link
                className="primary-action wide"
                href={`/sales/${id}/payments`}
              >
                VER HISTORIAL
              </Link>
            </section>
          </article>
        </main>
      </div>
    );
  }

  const sale = result.sale.summary;

  return (
    <div className="app-frame">
      <main className="main-content">
        <article className="sale-detail" aria-labelledby="sale-title">
          <Link className="back-link" href="/">
            ← MIS VENTAS
          </Link>

          <header className="sale-detail-heading">
            <h1 id="sale-title">{sale.name}</h1>
            <p>{sale.buyerName}</p>
          </header>

          <section className="balance-panel" aria-labelledby="balance-title">
            <p id="balance-title">Saldo pendiente</p>
            <strong>{sale.currentBalance}</strong>
          </section>

          <dl className="detail-summary">
            <div>
              <dt>Próximo pago</dt>
              <dd>{sale.nextPaymentDate}</dd>
            </div>
            <div>
              <dt>Aproximadamente</dt>
              <dd>{sale.targetPayment}</dd>
            </div>
          </dl>

          <Link
            className="primary-action wide"
            href={`/sales/${sale.id}/payments/new`}
          >
            REGISTRAR PAGO
          </Link>

          <div className="detail-actions" aria-label="Opciones de la venta">
            <Link
              className="secondary-action wide"
              href={`/sales/${sale.id}/plan`}
            >
              Ver plan de pagos
            </Link>
            <Link
              className="secondary-action wide"
              href={`/sales/${sale.id}/payments`}
            >
              Ver pagos recibidos
            </Link>
            <button className="secondary-action wide" disabled type="button">
              Datos de la venta
            </button>
          </div>
        </article>
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
