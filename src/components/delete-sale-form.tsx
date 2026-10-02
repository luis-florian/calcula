"use client";

import { useFormStatus } from "react-dom";

import { deleteSaleAction } from "@/app/sale-actions";

export function DeleteSaleForm({ financingId }: { financingId: string }) {
  return (
    <form
      action={deleteSaleAction}
      onSubmit={(event) => {
        if (
          !window.confirm(
            "¿Está seguro de borrar esta venta? También se borrarán sus pagos registrados.",
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      <input name="financingId" type="hidden" value={financingId} />
      <DeleteButton />
    </form>
  );
}

function DeleteButton() {
  const { pending } = useFormStatus();

  return (
    <button className="danger-action wide" disabled={pending} type="submit">
      {pending ? "BORRANDO..." : "Borrar venta"}
    </button>
  );
}
