import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { getSaleDetail } from "@/application/get-sale-detail";

export default async function SaleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();

  const { id } = await params;
  const result = await getSaleDetail({
    id,
    ownerId: "dev_user",
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

  const sale = result.sale;

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

          <button className="primary-action wide" disabled type="button">
            REGISTRAR PAGO
          </button>

          <div className="detail-actions" aria-label="Opciones de la venta">
            <button className="secondary-action wide" disabled type="button">
              Ver plan de pagos
            </button>
            <button className="secondary-action wide" disabled type="button">
              Ver pagos recibidos
            </button>
            <button className="secondary-action wide" disabled type="button">
              Datos de la venta
            </button>
          </div>
        </article>
      </main>
    </div>
  );
}
