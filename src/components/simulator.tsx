"use client";

import { useActionState, useMemo, useState } from "react";

import {
  calculateSimulation,
  saveSimulationAsSale,
  type SaveSaleActionState,
  type SimulationActionState,
} from "@/app/actions";

type Mode = "PAYMENT" | "TERM";
type SaveStep = "idle" | "form" | "confirm";

const initialState: SimulationActionState = {};
const initialSaveState: SaveSaleActionState = {};
const simulationFieldNames = [
  "mode",
  "capital",
  "annualRate",
  "paymentAmount",
  "termYears",
  "startDate",
  "firstPaymentDate",
] as const;

export function Simulator() {
  const [activeSection, setActiveSection] = useState<"sales" | "calculate">(
    "sales",
  );
  const [mode, setMode] = useState<Mode | null>(null);
  const [buyerName, setBuyerName] = useState("");
  const [saleName, setSaleName] = useState("");
  const [saveStep, setSaveStep] = useState<SaveStep>("idle");
  const [visiblePayments, setVisiblePayments] = useState(6);
  const [state, formAction, pending] = useActionState(
    calculateSimulation,
    initialState,
  );
  const [saveState, saveFormAction, saving] = useActionState(
    saveSimulationAsSale,
    initialSaveState,
  );
  const projectionPreview = useMemo(
    () => state.result?.projection.slice(0, visiblePayments) ?? [],
    [state.result?.projection, visiblePayments],
  );

  return (
    <div className="app-frame">
      <header className="top-bar">
        <div>
          <p className="brand">AMORTA</p>
          <h1>{activeSection === "sales" ? "Mis ventas" : "Calcular"}</h1>
        </div>
      </header>

      <main className="main-content">
        {activeSection === "sales" ? (
          <section className="empty-state" aria-labelledby="sales-title">
            <h2 id="sales-title">Todavía no tiene ventas guardadas.</h2>
            <button
              className="primary-action"
              type="button"
              onClick={() => {
                setActiveSection("calculate");
                setMode(null);
              }}
            >
              CALCULAR UNA VENTA
            </button>
          </section>
        ) : (
          <section aria-labelledby="calculate-title">
            {!mode ? (
              <div className="choice-view">
                <h2 id="calculate-title">¿Qué quiere calcular?</h2>
                <div className="choice-grid">
                  <button
                    className="choice-button"
                    type="button"
                    onClick={() => setMode("PAYMENT")}
                  >
                    <strong>QUIERO INDICAR EL PAGO</strong>
                    <span>Ejemplo: quiero recibir Q6,000 cada mes.</span>
                    <span>Calcularemos cuánto tiempo tardará en terminar.</span>
                  </button>
                  <button
                    className="choice-button"
                    type="button"
                    onClick={() => setMode("TERM")}
                  >
                    <strong>QUIERO INDICAR EL TIEMPO</strong>
                    <span>Ejemplo: quiero terminar en 15 años.</span>
                    <span>Calcularemos cuánto debería recibir cada mes.</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="simulator-layout">
                <form
                  className="calculation-form"
                  action={formAction}
                  onSubmit={() => setSaveStep("idle")}
                >
                  <input type="hidden" name="mode" value={mode} />
                  <div className="form-heading">
                    <p className="eyebrow">Calcular venta</p>
                    <h2>
                      {mode === "PAYMENT"
                        ? "Indicar el pago"
                        : "Indicar el tiempo"}
                    </h2>
                  </div>

                  <Field
                    defaultValue={state.values?.capital}
                    error={state.fieldErrors?.capital?.[0]}
                    label="¿Cuánto se financiará?"
                    name="capital"
                    prefix="Q"
                    placeholder="765,000"
                    required
                  />

                  <Field
                    defaultValue={state.values?.annualRate}
                    error={state.fieldErrors?.annualRate?.[0]}
                    label="¿Cuál será el interés anual?"
                    name="annualRate"
                    suffix="%"
                    placeholder="6"
                    required
                  />

                  {mode === "PAYMENT" ? (
                    <Field
                      defaultValue={state.values?.paymentAmount}
                      error={state.fieldErrors?.paymentAmount?.[0]}
                      label="¿Cuánto quiere recibir cada mes?"
                      name="paymentAmount"
                      prefix="Q"
                      placeholder="6,000"
                      required
                    />
                  ) : (
                    <Field
                      defaultValue={state.values?.termYears}
                      error={state.fieldErrors?.termYears?.[0]}
                      label="¿En cuántos años quiere terminar?"
                      name="termYears"
                      placeholder="15"
                      required
                    />
                  )}

                  <Field
                    defaultValue={state.values?.startDate}
                    error={state.fieldErrors?.startDate?.[0]}
                    label="¿Desde cuándo empieza el financiamiento?"
                    name="startDate"
                    type="date"
                    required
                  />

                  <Field
                    defaultValue={state.values?.firstPaymentDate}
                    error={state.fieldErrors?.firstPaymentDate?.[0]}
                    label="¿Cuándo será el primer pago?"
                    name="firstPaymentDate"
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
                      {pending ? "CALCULANDO..." : "CALCULAR"}
                    </button>
                    <button
                      className="secondary-action"
                      type="button"
                      onClick={() => {
                        setMode(null);
                        setBuyerName("");
                        setSaleName("");
                        setSaveStep("idle");
                        setVisiblePayments(6);
                      }}
                    >
                      REGRESAR
                    </button>
                  </div>
                </form>

                {state.result ? (
                  <section
                    className="result-view"
                    aria-labelledby="result-title"
                  >
                    <p className="eyebrow">Resultado</p>
                    <h2 id="result-title">
                      {state.result.mode === "TERM"
                        ? "Pago aproximado"
                        : "Tiempo aproximado"}
                    </h2>
                    <p className="hero-number">
                      {state.result.mode === "TERM"
                        ? state.result.approximatePayment
                        : state.result.approximateTime}
                    </p>
                    <dl className="summary-list">
                      <SummaryItem
                        label="Capital"
                        value={state.result.capital}
                      />
                      <SummaryItem
                        label="Interés"
                        value={state.result.annualRate}
                      />
                      <SummaryItem
                        label="Pago aproximado"
                        value={state.result.approximatePayment}
                      />
                      <SummaryItem
                        label="Número de pagos"
                        value={`${state.result.numberOfPayments}`}
                      />
                      <SummaryItem
                        label="Total de intereses"
                        value={state.result.totalInterest}
                      />
                      <SummaryItem
                        label="Total a recibir"
                        value={state.result.totalPaid}
                      />
                      <SummaryItem
                        label="Primer pago"
                        value={state.result.firstPaymentDate}
                      />
                      <SummaryItem
                        label="Último pago"
                        value={state.result.estimatedEndDate}
                      />
                    </dl>

                    <section
                      className="projection-section"
                      aria-labelledby="projection-title"
                    >
                      <h3 id="projection-title">Plan de pagos</h3>
                      <div className="projection-list">
                        {projectionPreview.map((row) => (
                          <article
                            className="payment-row"
                            key={row.paymentNumber}
                          >
                            <p className="payment-date">{row.expectedDate}</p>
                            <dl>
                              <SummaryItem label="Pago" value={row.payment} />
                              <SummaryItem
                                label="Interés"
                                value={row.interest}
                              />
                              <SummaryItem
                                label="Abono a capital"
                                value={row.principal}
                              />
                              <SummaryItem
                                label="Saldo"
                                value={row.closingBalance}
                              />
                            </dl>
                          </article>
                        ))}
                      </div>

                      {visiblePayments < state.result.projection.length ? (
                        <button
                          className="secondary-action wide"
                          type="button"
                          onClick={() =>
                            setVisiblePayments((current) => current + 6)
                          }
                        >
                          VER MÁS PAGOS
                        </button>
                      ) : null}
                    </section>

                    <SaveSalePanel
                      buyerName={buyerName}
                      result={state.result}
                      saleName={saleName}
                      saveFormAction={saveFormAction}
                      saveState={saveState}
                      saveStep={saveStep}
                      saving={saving}
                      setBuyerName={setBuyerName}
                      setSaleName={setSaleName}
                      setSaveStep={setSaveStep}
                      values={state.values}
                    />

                    <button
                      className="secondary-action wide"
                      type="button"
                      onClick={() => {
                        setSaveStep("idle");
                        setVisiblePayments(6);
                      }}
                    >
                      CAMBIAR DATOS
                    </button>
                  </section>
                ) : null}
              </div>
            )}
          </section>
        )}
      </main>

      <nav className="bottom-nav" aria-label="Navegación principal">
        <button
          className={activeSection === "sales" ? "active" : ""}
          type="button"
          onClick={() => setActiveSection("sales")}
        >
          Mis ventas
        </button>
        <button
          className={activeSection === "calculate" ? "active" : ""}
          type="button"
          onClick={() => setActiveSection("calculate")}
        >
          Calcular
        </button>
      </nav>
    </div>
  );
}

function SaveSalePanel({
  buyerName,
  result,
  saleName,
  saveFormAction,
  saveState,
  saveStep,
  saving,
  setBuyerName,
  setSaleName,
  setSaveStep,
  values,
}: {
  buyerName: string;
  result: NonNullable<SimulationActionState["result"]>;
  saleName: string;
  saveFormAction: (payload: FormData) => void;
  saveState: SaveSaleActionState;
  saveStep: SaveStep;
  saving: boolean;
  setBuyerName: (value: string) => void;
  setSaleName: (value: string) => void;
  setSaveStep: (value: SaveStep) => void;
  values?: Record<string, string>;
}) {
  if (saveState.success) {
    return (
      <div className="save-panel" role="status">
        <p className="save-title">{saveState.success}</p>
        <p className="save-copy">ID: {saveState.financingId}</p>
      </div>
    );
  }

  if (saveStep === "idle") {
    return (
      <button
        className="primary-action wide"
        type="button"
        onClick={() => setSaveStep("form")}
      >
        GUARDAR VENTA
      </button>
    );
  }

  if (saveStep === "form") {
    return (
      <div className="save-panel">
        <p className="save-title">Datos de la venta</p>
        <label className="field">
          <span>¿Cómo quiere identificar esta venta?</span>
          <span className="input-wrap">
            <input
              name="saleNameDraft"
              onChange={(event) => setSaleName(event.target.value)}
              placeholder="Casa zona 10"
              required
              value={saleName}
            />
          </span>
        </label>
        <label className="field">
          <span>¿A quién se la vendió?</span>
          <span className="input-wrap">
            <input
              name="buyerNameDraft"
              onChange={(event) => setBuyerName(event.target.value)}
              placeholder="Nombre del comprador"
              value={buyerName}
            />
          </span>
        </label>
        {saveState.error ? (
          <p className="form-error" role="alert">
            {saveState.error}
          </p>
        ) : null}
        <div className="form-actions two-columns">
          <button
            className="primary-action"
            disabled={!saleName.trim()}
            type="button"
            onClick={() => setSaveStep("confirm")}
          >
            CONTINUAR
          </button>
          <button
            className="secondary-action"
            type="button"
            onClick={() => setSaveStep("idle")}
          >
            CANCELAR
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className="save-panel" action={saveFormAction}>
      <SimulationHiddenFields values={values} />
      <input name="saleName" type="hidden" value={saleName.trim()} />
      <input name="buyerName" type="hidden" value={buyerName.trim()} />
      <p className="save-title">Confirmar venta</p>
      <dl className="summary-list compact">
        <SummaryItem label="Venta" value={saleName.trim()} />
        <SummaryItem
          label="Comprador"
          value={buyerName.trim() || "Sin nombre"}
        />
        <SummaryItem label="Capital" value={result.capital} />
        <SummaryItem label="Interés" value={result.annualRate} />
        <SummaryItem
          label="Pago aproximado"
          value={result.approximatePayment}
        />
        <SummaryItem label="Último pago" value={result.estimatedEndDate} />
      </dl>
      {saveState.error ? (
        <p className="form-error" role="alert">
          {saveState.error}
        </p>
      ) : null}
      <div className="form-actions two-columns">
        <button className="primary-action" disabled={saving}>
          {saving ? "GUARDANDO..." : "GUARDAR VENTA"}
        </button>
        <button
          className="secondary-action"
          type="button"
          onClick={() => setSaveStep("form")}
        >
          EDITAR
        </button>
      </div>
    </form>
  );
}

function SimulationHiddenFields({
  values,
}: {
  values?: Record<string, string>;
}) {
  if (!values) {
    return null;
  }

  return (
    <>
      {simulationFieldNames.map((name) =>
        values[name] ? (
          <input key={name} name={name} type="hidden" value={values[name]} />
        ) : null,
      )}
    </>
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
  suffix,
  type = "text",
}: {
  defaultValue?: string;
  error?: string;
  label: string;
  name: string;
  placeholder?: string;
  prefix?: string;
  required?: boolean;
  suffix?: string;
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
        {suffix ? <span className="input-affix">{suffix}</span> : null}
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
