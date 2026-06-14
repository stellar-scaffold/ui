import { defineConfig, devices } from "@playwright/test"
import { existsSync, readdirSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

// Self-adapting target list, so the same suite works in both lifecycle states
// without `init` having to rewrite this file:
//   - Post-init (user project): only the instantiated `app/` exists → 1 target.
//   - Contributor view (UI monorepo): one target per `templates/<framework>/`.
// The shared, framework-agnostic specs then run against whichever targets exist,
// which is what enforces feature parity between templates.
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")

type Target = { name: string; cwd: string; port: number }

function resolveTargets(): Target[] {
	const appDir = resolve(repoRoot, "app")
	if (existsSync(appDir)) {
		return [{ name: "app", cwd: appDir, port: 5180 }]
	}
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
