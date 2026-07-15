import { test, expect } from "@playwright/test"

// Visual guard for the styles centralization. Per-project baselines (one per
// framework) are committed; the smoke specs assert behavior, these assert
// appearance. During the styles refactor an intended change shows up as a diff
// to review + re-baseline (`--update-snapshots`); an unintended one fails.

test("home page visual", async ({ page }) => {
	await page.goto("/")
	// ensure the app has mounted before snapshotting
	await expect(page.getByRole("button", { name: /connect/i })).toBeVisible()
	await expect(
		page.getByPlaceholder("Guess a number from 1 to 10!"),
	).toBeVisible()
	await expect(page).toHaveScreenshot("home.png", {
		fullPage: true,
		animations: "disabled",
	})
})
