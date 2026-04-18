import { expect, test } from "@playwright/test";

test("top page and demo join flow render on mobile", async ({ page }) => {
  const uniqueName = `Playwright-${Date.now()}`;

  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /スマホだけで始める/i }),
  ).toBeVisible();

  await page.getByRole("link", { name: "DEMO 参加導線" }).click();
  await expect(page).toHaveURL(/\/join\/DEMO42$/);

  await page.getByRole("link", { name: "参加画面へ進む" }).click();
  await expect(page).toHaveURL(/\/room\/DEMO42$/);

  await page.getByLabel("表示名").fill(uniqueName);
  await page.getByRole("button", { name: "この名前で参加" }).click();

  await expect(
    page.getByText("ホストがラウンドを開始するのを待っています。"),
  ).toBeVisible();
  await expect(page.getByText(uniqueName).first()).toBeVisible();
});

test("pricing page shows billing tiers", async ({ page }) => {
  await page.goto("/pricing");

  await expect(
    page.getByRole("heading", { name: /料金プラン比較/i }),
  ).toBeVisible();
  await expect(page.getByText("Starter", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Pro", { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/Extra Pack/i).first()).toBeVisible();
});
