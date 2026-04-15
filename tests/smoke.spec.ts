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
