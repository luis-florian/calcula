import { expect, test } from "@playwright/test";
import { loadEnvConfig } from "@next/env";
import { Client } from "pg";

test("calculates a financing simulation by payment amount", async ({
  page,
}) => {
  loadEnvConfig(process.cwd());
  const databaseUrl = process.env.DATABASE_URL;
  const loginPassword = process.env.AMORTA_E2E_PASSWORD;
  const loginUsername = process.env.AMORTA_LOGIN_USERNAME;
  const saleName = `Casa zona 10 ${Date.now()}`;
  const buyerName = "Ana López";

  try {
    await page.goto("/");

    if (
      await page.getByRole("heading", { name: "Entrar a Amorta" }).isVisible()
    ) {
      if (!loginUsername || !loginPassword) {
        throw new Error(
          "AMORTA_LOGIN_USERNAME and AMORTA_E2E_PASSWORD are required for authenticated E2E tests.",
        );
      }

      await page.getByLabel("Usuario").fill(loginUsername);
      await page.getByLabel("Contraseña").fill(loginPassword);
      await page.getByRole("button", { name: "ENTRAR" }).click();
    }

    await expect(
      page.getByRole("heading", { name: "Mis ventas" }),
    ).toBeVisible();

    await page
      .getByRole("button", { name: /CALCULAR (UNA|NUEVA) VENTA/ })
      .click();
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
      .fill(saleName);
    await page.getByLabel("¿A quién se la vendió?").fill(buyerName);
    await page.getByRole("button", { name: "CONTINUAR" }).click();

    await expect(page.getByText("Confirmar venta")).toBeVisible();
    await expect(page.getByText(saleName)).toBeVisible();
    await page.getByRole("button", { name: "GUARDAR VENTA" }).click();

    if (databaseUrl) {
      await expect(page.getByText("Venta guardada.")).toBeVisible();

      await page.getByRole("button", { name: "Mis ventas" }).click();
      await page
        .locator("article")
        .filter({ hasText: saleName })
        .getByRole("link", { name: "VER VENTA" })
        .click();
      await expect(page.getByRole("heading", { name: saleName })).toBeVisible();

      page.once("dialog", async (dialog) => {
        expect(dialog.message()).toContain(
          "¿Está seguro de borrar esta venta?",
        );
        await dialog.dismiss();
      });
      await page.getByRole("button", { name: "Borrar venta" }).click();
      await expect(page.getByRole("heading", { name: saleName })).toBeVisible();

      page.once("dialog", async (dialog) => {
        expect(dialog.message()).toContain(
          "¿Está seguro de borrar esta venta?",
        );
        await dialog.accept();
      });
      await page.getByRole("button", { name: "Borrar venta" }).click();

      await expect(
        page.getByRole("heading", { name: "Mis ventas" }),
      ).toBeVisible();
      await expect(page.getByText(saleName)).toHaveCount(0);
    } else {
      await expect(page.getByText(/Configure DATABASE_URL/)).toBeVisible();
    }
  } finally {
    if (databaseUrl) {
      await cleanupSale(databaseUrl, saleName, buyerName);
    }
  }
});

async function cleanupSale(
  databaseUrl: string,
  saleName: string,
  buyerName: string,
) {
  const client = new Client({ connectionString: databaseUrl });

  await client.connect();

  try {
    await client.query(
      `delete from payments
       where financing_id in (
         select id from financings where name = $1 and buyer_name = $2
       )`,
      [saleName, buyerName],
    );
    await client.query(
      "delete from financings where name = $1 and buyer_name = $2",
      [saleName, buyerName],
    );
  } finally {
    await client.end();
  }
}
