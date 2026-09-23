import { describe, expect, it } from "vitest";

import { ApplicationError, getUserMessageForError } from "@/application/errors";

describe("getUserMessageForError", () => {
  it("maps expected application errors to user-friendly text", () => {
    expect(
      getUserMessageForError(new ApplicationError("PAYMENT_TOO_LOW")),
    ).toBe("El pago es demasiado bajo para reducir la deuda.");
  });

  it("hides unexpected technical error details", () => {
    expect(getUserMessageForError(new Error("PostgresError"))).toBe(
      "Ocurrió un problema. Intente nuevamente.",
    );
  });
});
