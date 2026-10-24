import { test, expect } from "@playwright/test"

// Visual guard for the styles centralization. Saves png snapshots of current
// UI and compares against previous run's png.
//
// During a style refactor an intended change shows up as a diff
// to review + re-baseline (`--update-snapshots`); an unintended one fails.
//
// First run fails, generating an initial png.

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
