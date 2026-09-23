import { expect, test } from "@playwright/test";

test("calculates a financing simulation by payment amount", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Mis ventas" })).toBeVisible();
  await expect(
    page.getByText("Todavía no tiene ventas guardadas."),
  ).toBeVisible();

  await page.getByRole("button", { name: "CALCULAR UNA VENTA" }).click();
  await page.getByRole("button", { name: /QUIERO INDICAR EL PAGO/ }).click();

  await page.getByLabel("¿Cuánto se financiará?").fill("765000");
  await page.getByLabel("¿Cuál será el interés anual?").fill("6");
  await page.getByLabel("¿Cuánto quiere recibir cada mes?").fill("6000");
  await page
    .getByLabel("¿Desde cuándo empieza el financiamiento?")
    .fill("2026-09-15");
  await page.getByLabel("¿Cuándo será el primer pago?").fill("2026-10-15");
  await page.getByRole("button", { exact: true, name: "CALCULAR" }).click();

  await expect(page.getByText("Resultado")).toBeVisible();
  await expect(page.getByText("Q3,772.60")).toBeVisible();
  await expect(page.getByText("Q762,772.60")).toBeVisible();

  await page.getByRole("button", { name: "GUARDAR VENTA" }).click();
  await page
    .getByLabel("¿Cómo quiere identificar esta venta?")
    .fill("Casa zona 10");
  await page.getByLabel("¿A quién se la vendió?").fill("Ana López");
  await page.getByRole("button", { name: "CONTINUAR" }).click();

  await expect(page.getByText("Confirmar venta")).toBeVisible();
  await expect(page.getByText("Casa zona 10")).toBeVisible();
  await page.getByRole("button", { name: "GUARDAR VENTA" }).click();

  await expect(page.getByText(/Configure DATABASE_URL/)).toBeVisible();
});
