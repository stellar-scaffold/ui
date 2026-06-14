#!/usr/bin/env node
// Contributor-only guard: keep shared toolchain deps in lockstep across every
// template in the monorepo. End users only ever instantiate ONE template, so
// drift is purely a contributor problem — this lives in CI, not in the templates.
//
// Policy (semver-aware):
//   - MAJOR mismatch        -> FAIL  (e.g. vite 7 vs 8, typescript 5 vs 6)
//   - 0.x MINOR mismatch    -> FAIL  (for 0.x, minor is the breaking unit,
//                                     e.g. vite-plugin-node-polyfills 0.28 vs 0.25)
//   - minor / patch mismatch (>=1.0) -> WARN  (cosmetic; allowed)
//
// Edit MUST_MATCH to curate which shared deps are enforced.

import { readFileSync, readdirSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const MUST_MATCH = [
	"vite",
	"vite-plugin-node-polyfills",
	"vite-plugin-wasm",
	"typescript",
	"eslint",
	"prettier",
	"@theahaco/ts-config",
]

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const templatesDir = join(repoRoot, "templates")

const templates = readdirSync(templatesDir, { withFileTypes: true })
	.filter((d) => d.isDirectory())
	.map((d) => {
		const pkg = JSON.parse(
			readFileSync(join(templatesDir, d.name, "package.json"), "utf8"),
		)
		return {
			name: d.name,
			deps: { ...pkg.dependencies, ...pkg.devDependencies },
		}
	})

// "^8.0.7" -> {major:8,minor:0,patch:7,base:"8.0.7"}; returns null if uncomparable ("*", "workspace:*")
const parse = (range) => {
	const m = String(range).match(/(\d+)\.(\d+)\.(\d+)/)
	if (!m) return null
	const [, major, minor, patch] = m.map(Number)
	return { major, minor, patch, base: `${major}.${minor}.${patch}` }
}
// the unit that signals a breaking change: major for >=1.0, else the 0.x minor
const breakingKey = (v) => (v.major > 0 ? `${v.major}` : `0.${v.minor}`)

let failed = false
const lines = []

for (const dep of MUST_MATCH) {
	const present = templates
		.map((t) => ({ tpl: t.name, range: t.deps[dep] }))
		.filter((x) => x.range !== undefined)

	if (present.length < 2) continue // framework-specific or absent — nothing to compare

	const parsed = present.map((x) => ({ ...x, v: parse(x.range) }))
	const comparable = parsed.filter((x) => x.v)
	const shown = parsed.map((x) => `${x.tpl}:${x.range}`).join("  ")

	if (comparable.length < 2) {
		lines.push(`   ${dep.padEnd(30)} ${shown}   (skipped: uncomparable range)`)
		continue
	}

	const breakingSet = new Set(comparable.map((x) => breakingKey(x.v)))
	const baseSet = new Set(comparable.map((x) => x.v.base))

	if (breakingSet.size > 1) {
		failed = true
		lines.push(
			`❌ ${dep.padEnd(30)} ${shown}   (MAJOR drift — fix before merge)`,
		)
	} else if (baseSet.size > 1) {
		lines.push(`⚠️  ${dep.padEnd(30)} ${shown}   (minor/patch drift — allowed)`)
	} else {
		lines.push(`✅ ${dep.padEnd(30)} ${shown}`)
	}
}

console.log(
	`Template dependency parity (${templates.map((t) => t.name).join(", ")}):\n`,
)
console.log(lines.join("\n"))

if (failed) {
	console.error(
		"\nMAJOR version drift in a shared toolchain dependency. " +
			"Align the versions across templates (or update MUST_MATCH if intentional).",
	)
	process.exit(1)
}
console.log("\nNo blocking drift. ✅")
