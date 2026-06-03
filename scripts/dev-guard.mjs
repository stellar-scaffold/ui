import { execSync } from "node:child_process"
import { existsSync, readdirSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

// Runs as the root `prestart` hook. Two jobs:
//   1. Lifecycle gate — post-`init` the instantiated `app/` exists, so pass
//      through and let `start` run the app (works out of the box for users).
//      In a raw clone of the monorepo there's no single app; point the newcomer
//      at the happy path instead of starting the wrong thing.
//   2. Tool check — `start` runs `stellar scaffold watch`, so verify the
//      required CLIs are installed and print install instructions if not.
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")

const TOOLS = [
	{
		name: "Stellar CLI",
		check: "stellar --version",
		install: "cargo install --locked stellar-cli",
		binstall: "cargo binstall -y --locked stellar-cli",
		url: "https://developers.stellar.org/docs/tools/developer-tools/cli/install-cli",
	},
	{
		name: "Stellar Scaffold CLI",
		check: "stellar scaffold --version",
		install: "cargo install --locked stellar-scaffold-cli",
		binstall: "cargo binstall -y --locked stellar-scaffold-cli",
		url: "https://github.com/stellar-scaffold/cli#quickstart-new-developers-welcome",
	},
]

function has(cmd) {
	try {
		execSync(cmd, { stdio: "ignore" })
		return true
	} catch {
		return false
	}
}

function toolInstructions() {
	const missing = TOOLS.filter((t) => !has(t.check))
	if (missing.length === 0) return ""
	const hasBinstall = has("cargo binstall --version")
	return [
		"",
		"Missing required tools:",
		...missing.flatMap((t) => [
			`  - ${t.name}`,
			`      ${hasBinstall ? t.binstall : t.install}`,
			`      docs: ${t.url}`,
		]),
	].join("\n")
}

// Lifecycle gate.
if (existsSync(resolve(root, "app"))) {
	const tools = toolInstructions()
	if (!tools) process.exit(0)
	console.error(`\nCannot start — install the required Stellar tools first:${tools}\n`)
	process.exit(1)
}

const templatesDir = resolve(root, "templates")
const frameworks = existsSync(templatesDir)
	? readdirSync(templatesDir, { withFileTypes: true })
			.filter((d) => d.isDirectory())
			.map((d) => d.name)
			.sort()
	: []

const devLines =
	frameworks.length > 0
		? frameworks.map((f) => `  npm start --workspace templates/${f}`).join("\n")
		: "  (no templates found)"

console.error(
	[
		"",
		"This is the Stellar Scaffold UI monorepo, not a single app.",
		"",
		"To create a new project (recommended):",
		"  stellar scaffold init my-app",
		"",
		"To develop a template in place (contributors) — see CONTRIBUTING.md:",
		devLines,
		toolInstructions(),
		"",
	].join("\n"),
)
process.exit(1)
