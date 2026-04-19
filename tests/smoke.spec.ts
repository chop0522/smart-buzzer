import { expect, test } from "@playwright/test";

test("top page and demo join entry render on mobile", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /スマホだけで始める/i }),
  ).toBeVisible();

  await page.getByRole("link", { name: "DEMO 参加導線" }).click();
  await expect(page).toHaveURL(/\/join\/DEMO42$/);
  await expect(
    page.getByRole("heading", { name: "ルーム DEMO42 に参加" }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "参加者はゲスト参加です。次の画面で表示名を入力し、ラウンド開始後に大きなボタンを押します。",
    ),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "参加画面へ進む" })).toBeVisible();
  await expect(page.getByRole("link", { name: "トップへ戻る" })).toBeVisible();
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
