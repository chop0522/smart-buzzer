import { expect, test } from "@playwright/test";

const shouldRunProductionSmoke = process.env.PLAYWRIGHT_PRODUCTION_SMOKE === "1";

test.describe("production read-only smoke", () => {
  test.skip(
    !shouldRunProductionSmoke,
    "Set PLAYWRIGHT_PRODUCTION_SMOKE=1 to run the read-only production smoke test.",
  );

  test("public pages render and admin pages require Basic auth", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /早押しルームを作って/i }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "無料でホスト登録" })).toBeVisible();

    await page.goto("/pricing");
    await expect(
      page.getByRole("heading", { name: /料金プラン比較/i }),
    ).toBeVisible();
    await expect(page.getByText("Starter", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Pro", { exact: true }).first()).toBeVisible();
    await expect(page.getByText(/Extra Pack/i).first()).toBeVisible();

    const hostResponse = await page.request.get("/host");
    expect(hostResponse.status()).toBe(401);

    const accountResponse = await page.request.get("/account");
    expect(accountResponse.status()).toBe(401);

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
});
