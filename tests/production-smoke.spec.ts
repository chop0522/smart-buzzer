import { expect, test } from "@playwright/test";

const shouldRunProductionSmoke = process.env.PLAYWRIGHT_PRODUCTION_SMOKE === "1";

test.describe("production read-only smoke", () => {
  test.skip(
    !shouldRunProductionSmoke,
    "Set PLAYWRIGHT_PRODUCTION_SMOKE=1 to run the read-only production smoke test.",
  );

  test("public pages and logged-out account render", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /スマホだけで始める/i }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "料金ページ" })).toBeVisible();

    await page.goto("/pricing");
    await expect(
      page.getByRole("heading", { name: /料金プラン比較/i }),
    ).toBeVisible();
    await expect(page.getByText("Starter", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Pro", { exact: true }).first()).toBeVisible();
    await expect(page.getByText(/Extra Pack/i).first()).toBeVisible();

    await page.goto("/account");
    await expect(
      page.getByRole("heading", { name: "契約状況ページ" }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "ホストログインへ" })).toBeVisible();
    await expect(
      page.getByText("ホストだけログインして閲覧できます。参加者はゲスト参加です。"),
    ).toBeVisible();
  });
});
