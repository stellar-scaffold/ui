import { defineConfig, devices } from "@playwright/test"
import { existsSync, readdirSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")

type Target = { name: string; cwd: string; port: number }

// These tests run in both a generated Scaffold project (which has an `app`
// dir) and in the Scaffold UI monorepo (which has a `templates` dir). They are
// how the Scaffold team maintains parity and behavior for all of their
// templates, and they are also useful as a starting point for app developers
// who use Scaffold to initialize projects.
//
// If you used Scaffold to generate this project, feel free to simplify this
// function to remove the `templates` logic.
function resolveTargets(): Target[] {
	// generated Scaffold project
	const appDir = resolve(repoRoot, "app")
	if (existsSync(appDir)) {
		return [{ name: "app", cwd: appDir, port: 5180 }]
	}
	// the Scaffold UI monorepo (feel free to remove)
	const templatesDir = resolve(repoRoot, "templates")
	const frameworks = existsSync(templatesDir)
		? readdirSync(templatesDir, { withFileTypes: true })
				.filter((d) => d.isDirectory())
				.map((d) => d.name)
				.sort()
		: []
	return frameworks.map((name, i) => ({
		name,
		cwd: resolve(templatesDir, name),
		port: 5181 + i,
	}))
}

const targets = resolveTargets()

export default defineConfig({
	testDir: "./tests",
	reporter: "list",
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	projects: targets.map((t) => ({
		name: t.name,
		use: {
			...devices["Desktop Chrome"],
			baseURL: `http://localhost:${t.port}`,
		},
	})),
	webServer: targets.map((t) => ({
		// Run only the dev server (not `npm start`, which also spawns the
		// contract-watch process that needs Docker/network).
		command: `npx vite --port ${t.port} --strictPort`,
		cwd: t.cwd,
		url: `http://localhost:${t.port}`,
		reuseExistingServer: !process.env.CI,
		timeout: 120_000,
	})),
})
