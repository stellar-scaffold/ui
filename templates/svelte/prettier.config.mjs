import { config as baseConfig } from "@theahaco/ts-config/prettier"

/**
 * @type {import("prettier").Config}
 */
const config = {
	...baseConfig,
	plugins: ["prettier-plugin-svelte"],
}

export default config
