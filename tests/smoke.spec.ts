import { expect, test } from "@playwright/test";

test("top page and demo join entry render on mobile", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /早押しルームを作って/i }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "無料でホスト登録" })).toBeVisible();

  await page.getByRole("link", { name: "参加デモ" }).click();
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
  await expect(
    page.getByRole("link", { name: "特定商取引法に基づく表記" }).first(),
  ).toBeVisible();
});

test("legal pages render", async ({ page }) => {
  await page.goto("/legal/tokushoho");
  await expect(
    page.getByRole("heading", { name: "特定商取引法に基づく表記" }),
  ).toBeVisible();

  await page.goto("/legal/terms");
  await expect(page.getByRole("heading", { name: "利用規約" })).toBeVisible();

  await page.goto("/legal/privacy");
  await expect(
    page.getByRole("heading", { name: "プライバシーポリシー" }),
  ).toBeVisible();

  await page.goto("/legal/cancellation");
  await expect(
    page.getByRole("heading", { name: "解約・返金ポリシー" }),
  ).toBeVisible();
});
