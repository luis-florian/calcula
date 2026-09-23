"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import {
  previewPaymentAction,
  registerPaymentAction,
  type PaymentPreviewActionState,
  type PaymentRegistrationActionState,
} from "@/app/payment-actions";
import type { ActiveSaleSummary } from "@/application/sales-summary";

const initialPreviewState: PaymentPreviewActionState = {};
const initialRegistrationState: PaymentRegistrationActionState = {};

export function PaymentRegistration({ sale }: { sale: ActiveSaleSummary }) {
  const [isEditing, setIsEditing] = useState(true);
  const [previewState, previewFormAction, previewPending] = useActionState(
    previewPaymentAction,
    initialPreviewState,
  );
  const [registrationState, registrationFormAction, registrationPending] =
    useActionState(registerPaymentAction, initialRegistrationState);

  if (registrationState.result) {
    if (
      registrationState.result.completed &&
      registrationState.result.finalSummary
    ) {
      return (
        <section
          className="payment-result"
          aria-labelledby="payment-result-title"
        >
          <p className="payment-check" aria-hidden="true">
            ✓
          </p>
          <h1 id="payment-result-title">Venta completada</h1>
          <p className="payment-form-buyer">
            {registrationState.result.finalSummary.name} ·{" "}
            {registrationState.result.finalSummary.buyerName}
          </p>
          <dl className="payment-result-summary">
            <SummaryItem
              label="Total recibido"
              value={registrationState.result.finalSummary.totalReceived}
            />
            <SummaryItem
              label="Capital"
              value={registrationState.result.finalSummary.capital}
            />
            <SummaryItem
              label="Intereses recibidos"
              value={registrationState.result.finalSummary.totalInterest}
            />
            <SummaryItem
              label="Primer pago"
              value={registrationState.result.finalSummary.firstPaymentDate}
            />
            <SummaryItem
              label="Último pago"
              value={registrationState.result.finalSummary.lastPaymentDate}
            />
          </dl>
          <Link
            className="primary-action wide"
            href={`/sales/${sale.id}/payments`}
          >
            VER HISTORIAL
          </Link>
        </section>
      );
    }

    return (
      <section
        className="payment-result"
        aria-labelledby="payment-result-title"
      >
        <p className="payment-check" aria-hidden="true">
          ✓
        </p>
        <h1 id="payment-result-title">Pago registrado</h1>
        <dl className="payment-result-summary">
          <SummaryItem
            label="Recibió"
            value={registrationState.result.amount}
          />
          <SummaryItem
            label="Nuevo saldo"
            value={registrationState.result.closingBalance}
          />
          <SummaryItem
            label="Próximo pago"
            value={registrationState.result.nextPaymentDate}
          />
        </dl>
        <Link className="primary-action wide" href={`/sales/${sale.id}`}>
          LISTO
        </Link>
      </section>
    );
  }

  if (previewState.preview && previewState.idempotencyKey && !isEditing) {
    return (
      <section
        className="payment-review"
        aria-labelledby="payment-review-title"
      >
        <p className="eyebrow">Revise el pago</p>
        <h1 id="payment-review-title">Recibió</h1>
        <p className="hero-number">{previewState.preview.amount}</p>
        <p className="payment-date-text">
          el {previewState.preview.paymentDateLong}
        </p>

        {previewState.preview.isAboveExpected ? (
          <p className="payment-note">Este pago es mayor al esperado.</p>
        ) : null}
        {previewState.preview.isBelowExpected ? (
          <p className="payment-note">El pago fue menor al esperado.</p>
        ) : null}

        <dl className="payment-preview-summary">
          <SummaryItem
            label="Cantidad recibida"
            value={previewState.preview.amount}
          />
          <SummaryItem
            label="Días"
            value={`${previewState.preview.daysElapsed}`}
          />
          <SummaryItem label="Interés" value={previewState.preview.interest} />
          <SummaryItem
            label="Abono a la deuda"
            value={previewState.preview.principal}
          />
          <SummaryItem
            label="Saldo anterior"
            value={previewState.preview.openingBalance}
          />
          <SummaryItem
            label="Nuevo saldo"
            value={previewState.preview.closingBalance}
          />
        </dl>

        {registrationState.error ? (
          <p className="form-error" role="alert">
            {registrationState.error}
          </p>
        ) : null}

        <form className="form-actions" action={registrationFormAction}>
          <input
            name="amount"
            type="hidden"
            value={previewState.preview.amountRaw}
          />
          <input name="financingId" type="hidden" value={sale.id} />
          <input
            name="idempotencyKey"
            type="hidden"
            value={previewState.idempotencyKey}
          />
          <input
            name="paymentDate"
            type="hidden"
            value={previewState.values?.paymentDate ?? ""}
          />
          <button className="primary-action" disabled={registrationPending}>
            {registrationPending ? "CONFIRMANDO..." : "CONFIRMAR PAGO"}
          </button>
          <button
            className="secondary-action"
            disabled={registrationPending}
            type="button"
            onClick={() => setIsEditing(true)}
          >
            REGRESAR
          </button>
        </form>
      </section>
    );
  }

  return (
    <section className="payment-form-view" aria-labelledby="payment-form-title">
      <p className="eyebrow">Registrar pago</p>
      <h1 id="payment-form-title">{sale.name}</h1>
      <p className="payment-form-buyer">{sale.buyerName}</p>

      <form
        className="calculation-form standalone"
        action={previewFormAction}
        onSubmit={() => setIsEditing(false)}
      >
        <input name="financingId" type="hidden" value={sale.id} />
        <Field
          defaultValue={previewState.values?.amount}
          error={previewState.fieldErrors?.amount?.[0]}
          label="¿Cuánto recibió?"
          name="amount"
          prefix="Q"
          placeholder="6,000"
          required
        />
        <Field
          defaultValue={previewState.values?.paymentDate}
          error={previewState.fieldErrors?.paymentDate?.[0]}
          label="¿Qué día recibió el dinero?"
          name="paymentDate"
          type="date"
          required
        />

        {previewState.error ? (
          <p className="form-error" role="alert">
            {previewState.error}
          </p>
        ) : null}

        <div className="form-actions">
          <button className="primary-action" disabled={previewPending}>
            {previewPending ? "REVISANDO..." : "CONTINUAR"}
          </button>
          <Link className="secondary-action" href={`/sales/${sale.id}`}>
            CANCELAR
          </Link>
        </div>
      </form>
    </section>
  );
}

function Field({
  defaultValue,
  error,
  label,
  name,
  placeholder,
  prefix,
  required,
  type = "text",
}: {
  defaultValue?: string;
  error?: string;
  label: string;
  name: string;
  placeholder?: string;
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
          placeholder={placeholder}
          required={required}
          type={type}
        />
      </span>
      {error ? <span className="field-error">{error}</span> : null}
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
