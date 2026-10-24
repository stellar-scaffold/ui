import { test, expect } from "@playwright/test"

test("home page mounts", async ({ page }) => {
	const response = await page.goto("/")
	expect(response?.ok()).toBeTruthy()
	await expect(page.locator("body")).toBeVisible()
})

test("wallet connect button is present", async ({ page }) => {
	await page.goto("/")
	await expect(page.getByRole("button", { name: /connect/i })).toBeVisible()
})

test("contract explorer link is present", async ({ page }) => {
	await page.goto("/")
	await expect(page.locator('a[href="/debug"]').first()).toBeVisible()
})

test("guess-the-number sample contract form is present", async ({ page }) => {
	await page.goto("/")
	await expect(
		page.getByPlaceholder("Guess a number from 1 to 10!"),
	).toBeVisible()
	await expect(page.getByRole("button", { name: "Submit" })).toBeVisible()
})
