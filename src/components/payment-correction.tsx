"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import {
  correctPaymentAction,
  type PaymentCorrectionActionState,
} from "@/app/payment-correction-actions";
import type { PaymentHistoryItem } from "@/application/payment-plan-summary";

const initialState: PaymentCorrectionActionState = {};

export function PaymentCorrection({
  financingId,
  payment,
}: {
  financingId: string;
  payment: PaymentHistoryItem;
}) {
  const [acceptedWarning, setAcceptedWarning] = useState(false);
  const [state, formAction, pending] = useActionState(
    correctPaymentAction,
    initialState,
  );

  if (state.result) {
    if (state.result.completed && state.result.finalSummary) {
      return (
        <section className="payment-result" aria-labelledby="correction-title">
          <p className="payment-check" aria-hidden="true">
            ✓
          </p>
          <h1 id="correction-title">Venta completada</h1>
          <p className="payment-form-buyer">
            {state.result.finalSummary.name} ·{" "}
            {state.result.finalSummary.buyerName}
          </p>
          <dl className="payment-result-summary">
            <SummaryItem
              label="Total recibido"
              value={state.result.finalSummary.totalReceived}
            />
            <SummaryItem
              label="Capital"
              value={state.result.finalSummary.capital}
            />
            <SummaryItem
              label="Intereses recibidos"
              value={state.result.finalSummary.totalInterest}
            />
          </dl>
          <Link className="primary-action wide" href={`/sales/${financingId}`}>
            LISTO
          </Link>
        </section>
      );
    }

    return (
      <section className="payment-result" aria-labelledby="correction-title">
        <p className="payment-check" aria-hidden="true">
          ✓
        </p>
        <h1 id="correction-title">Pago corregido</h1>
        <dl className="payment-result-summary">
          <SummaryItem
            label="Nuevo saldo"
            value={state.result.closingBalance}
          />
          <SummaryItem
            label="Próximo pago"
            value={state.result.nextPaymentDate}
          />
        </dl>
        <Link className="primary-action wide" href={`/sales/${financingId}`}>
          LISTO
        </Link>
      </section>
    );
  }

  if (!acceptedWarning) {
    return (
      <section className="payment-review" aria-labelledby="warning-title">
        <p className="eyebrow">Corregir pago</p>
        <h1 id="warning-title">Cambiar este pago puede modificar el saldo.</h1>
        <p className="payment-note">
          También se recalcularán los pagos posteriores de esta venta.
        </p>
        <div className="form-actions">
          <button
            className="primary-action"
            type="button"
            onClick={() => setAcceptedWarning(true)}
          >
            CONTINUAR
          </button>
          <Link
            className="secondary-action"
            href={`/sales/${financingId}/payments/${payment.id}`}
          >
            CANCELAR
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="payment-form-view" aria-labelledby="correction-title">
      <p className="eyebrow">Corregir pago</p>
      <h1 id="correction-title">Pago del {payment.paymentDate}</h1>
      <form
        className="calculation-form standalone"
        aria-busy={pending}
        action={formAction}
      >
        <input name="financingId" type="hidden" value={financingId} />
        <input name="paymentId" type="hidden" value={payment.id} />
        <Field
          defaultValue={state.values?.amount ?? payment.amountRaw}
          label="Cantidad correcta"
          name="amount"
          prefix="Q"
          required
        />
        <Field
          defaultValue={state.values?.paymentDate ?? payment.paymentDateRaw}
          label="Fecha correcta"
          name="paymentDate"
          type="date"
          required
        />

        {state.error ? (
          <p className="form-error" role="alert">
            {state.error}
          </p>
        ) : null}

        <div className="form-actions">
          <button className="primary-action" disabled={pending}>
            {pending ? "CORRIGIENDO..." : "CORREGIR PAGO"}
          </button>
          <Link
            className="secondary-action"
            href={`/sales/${financingId}/payments/${payment.id}`}
          >
            CANCELAR
          </Link>
        </div>
      </form>
    </section>
  );
}

function Field({
  defaultValue,
  label,
  name,
  prefix,
  required,
  type = "text",
}: {
  defaultValue?: string;
  label: string;
  name: string;
  prefix?: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <span className="input-wrap">
        {prefix ? <span className="input-affix">{prefix}</span> : null}
        <input
          defaultValue={defaultValue}
          name={name}
          required={required}
          type={type}
        />
      </span>
    </label>
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
