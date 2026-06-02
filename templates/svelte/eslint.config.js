import { config } from "@theahaco/ts-config/eslint"
import { globalIgnores } from "eslint/config"
import globals from "globals"

/** @type {import("eslint").Linter.Config[]} */
export default [
	globalIgnores([
		"dist",
		"packages",
		"target/packages",
		"src/contracts/*",
		"!src/contracts/util.ts",
	]),
	...config,
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
]
