import { config } from "@theahaco/ts-config/eslint"
import { globalIgnores } from "eslint/config"
import svelte from "eslint-plugin-svelte"
import globals from "globals"
import tseslint from "typescript-eslint"

/** @type {import("eslint").Linter.Config[]} */
export default [
	globalIgnores(["dist", "build", ".svelte-kit", "reset.d.ts"]),
	...config,
	...svelte.configs.recommended,
	{
		rules: {
			// Starter template favors plain hrefs over SvelteKit's resolve()
			// ceremony for its handful of demo links.
			"svelte/no-navigation-without-resolve": "off",
		},
	},
	{
		files: ["**/*.{ts,tsx}"],
		languageOptions: {
			ecmaVersion: 2020,
			globals: globals.browser,
			parserOptions: {
				tsconfigRoot: import.meta.dirname,
			},
		},
	},
	{
		// Let the Svelte parser hand <script lang="ts"> to the TS parser.
		files: ["**/*.svelte", "**/*.svelte.ts"],
		languageOptions: {
			parserOptions: {
				parser: tseslint.parser,
				projectService: true,
				extraFileExtensions: [".svelte"],
			},
		},
	},
]
