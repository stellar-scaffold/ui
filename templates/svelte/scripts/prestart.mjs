import { exec, execSync, spawnSync } from "child_process"
import { readFileSync, rmSync, writeFileSync } from "fs"
import { createInterface } from "readline"
import { config } from "dotenv"

// NOTE: Skip setup for Scaffold Frontend contributors
config()
if (process.env.SKIP_SETUP) process.exit(0)

const rl = createInterface({ input: process.stdin, output: process.stdout })
rl.pause()
import { promisify } from "util"

const execAsync = promisify(exec)

// Ordered — scaffold depends on stellar being installed first
const TOOLS = [
	{
		cmd: "stellar --version",
		name: "Stellar CLI",
		installCmd: "cargo install --locked stellar-cli",
		binstallCmd: "cargo binstall -y --locked stellar-cli",
		url: "https://developers.stellar.org/docs/tools/developer-tools/cli/install-cli",
	},
	{
		cmd: "stellar scaffold --version",
		name: "Scaffold Stellar",
		installCmd: "cargo install --locked stellar-scaffold-cli",
		binstallCmd: "cargo binstall -y --locked stellar-scaffold-cli",
		url: "https://github.com/stellar-scaffold/cli#quickstart-new-developers-welcome",
	},
]

const isTTY = process.stdin.isTTY || process.env.PRESTART_FORCE_TTY === "1"

// Parse package.json — presence of this prestart script is the "setup needed" flag
const pkgPath = new URL("../package.json", import.meta.url).pathname
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"))
const setupNeeded = pkg.scripts?.prestart === "node scripts/prestart.mjs"

if (!setupNeeded) process.exit(0)

function hasBin(bin) {
	try {
		execSync(`${bin} --version`, { stdio: "ignore" })
		return true
	} catch {
		return false
	}
}

async function toolMissing({ cmd }) {
	try {
		await execAsync(cmd, { stdio: "ignore" })
		return false
	} catch {
		return true
	}
}

async function prompt(question) {
	return new Promise((resolve) => {
		rl.resume()
		rl.question(question, (answer) => {
			rl.pause()
			resolve(answer.trim().toLowerCase())
		})
	})
}

async function installTool(tool) {
	if (!hasBin("cargo")) {
		console.error(`  cargo not found — install manually: ${tool.url}`)
		return false
	}

	const cmd = hasBin("cargo-binstall") ? tool.binstallCmd : tool.installCmd
	console.log(`\n  Running: ${cmd}`)
	if (!hasBin("cargo-binstall")) {
		console.log(
			"  (tip: cargo-binstall installs pre-built binaries much faster)",
		)
	}

	const result = spawnSync(cmd, { shell: true, stdio: "inherit" })
	if (result.status !== 0) {
		console.error(`  Install failed. Try manually: ${tool.url}`)
		return false
	}
	return true
}

function markSetupComplete() {
	delete pkg.scripts.prestart
	writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n")
	for (const rel of ["test-stubs", "test-prestart.sh"]) {
		rmSync(new URL(rel, import.meta.url).pathname, {
			recursive: true,
			force: true,
		})
	}
}

// --- Check all tools in parallel for speed ---
const missingFlags = await Promise.all(TOOLS.map(toolMissing))
const missing = TOOLS.filter((_, i) => missingFlags[i])

// --- Handle missing CLIs ---
if (missing.length > 0) {
	if (!isTTY) {
		console.error("\nMissing required tools:\n")
		for (const { name, url } of missing) {
			console.error(`  ${name}: ${url}`)
		}
		process.exit(1)
	}

	console.log("\nMissing required tools:")
	for (const { name } of missing) console.log(`  - ${name}`)

	const answer = await prompt("\nInstall them now? [Y/n] ")
	const confirmed = answer === "" || answer === "y" || answer === "yes"

	if (!confirmed) {
		console.log("\nInstall manually:")
		for (const { name, url } of missing) console.log(`  ${name}: ${url}`)
		process.exit(1)
	}

	console.log(
		"\nNote: cargo install compiles from source and can take several minutes.",
	)

	let anyFailed = false
	for (const tool of missing) {
		console.log(`\nInstalling ${tool.name}...`)
		const ok = await installTool(tool)
		if (!ok) anyFailed = true
	}

	if (anyFailed) {
		console.error(
			"\nSome installs failed. Fix errors above and re-run npm start.",
		)
		process.exit(1)
	}

	console.log("\nAll tools installed.")
}

// --- Handle project setup ---
if (!isTTY) {
	console.error(
		"\nProject setup incomplete. Run npm start in an interactive terminal to complete setup.",
	)
	process.exit(1)
}

const answer = await prompt(
	"\nProject hasn't been set up yet. Run `stellar scaffold setup` now? [Y/n] ",
)
const confirmed = answer === "" || answer === "y" || answer === "yes"

if (!confirmed) {
	console.log(
		"\nRun `stellar scaffold setup` when ready, then re-run npm start.",
	)
	process.exit(1)
}

console.log()
const result = spawnSync("stellar scaffold setup", {
	shell: true,
	stdio: "inherit",
})
if (result.status !== 0) {
	console.error("\nSetup failed. Fix errors above and re-run npm start.")
	process.exit(1)
}

markSetupComplete()
console.log("\nSetup complete. Starting dev server...\n")
