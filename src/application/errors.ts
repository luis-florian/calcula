export type ApplicationErrorCode =
  | "FINANCING_COMPLETED"
  | "FINANCING_NOT_FOUND"
  | "INVALID_PAYMENT_DATE"
  | "PAYMENT_TOO_LOW"
  | "UNAUTHORIZED";

const userMessages: Record<ApplicationErrorCode, string> = {
  FINANCING_COMPLETED: "Esta venta ya fue finalizada.",
  FINANCING_NOT_FOUND: "No encontramos esta venta.",
  INVALID_PAYMENT_DATE: "Revise la fecha del pago.",
  PAYMENT_TOO_LOW: "El pago es demasiado bajo para reducir la deuda.",
  UNAUTHORIZED: "No tiene permiso para ver esta información.",
};

export class ApplicationError extends Error {
  constructor(
    readonly code: ApplicationErrorCode,
    message?: string,
  ) {
    super(message ?? code);
    this.name = "ApplicationError";
  }
}

export function getUserMessageForError(error: unknown): string {
  if (error instanceof ApplicationError) {
    return userMessages[error.code];
  }

  return "Ocurrió un problema. Intente nuevamente.";
}
