import { expect, test } from "@playwright/test";

test("loads the starter application", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Amorta" })).toBeVisible();
  await expect(page.getByText("Proyecto base")).toBeVisible();
});
