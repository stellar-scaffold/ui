import { config as baseConfig } from "@theahaco/ts-config/prettier"
import * as sveltePlugin from "prettier-plugin-svelte"

/**
 * @type {import("prettier").Config}
 */
const config = {
	...baseConfig,
	plugins: [sveltePlugin],
}

export default config
