import { stellarNetwork } from "./env"

// Utility to get the correct Friendbot URL based on environment
export function getFriendbotUrl(address: string) {
	switch (stellarNetwork) {
		case "LOCAL":
			// Use proxy in development for local
			return `/friendbot?addr=${address}`
		case "FUTURENET":
			return `https://friendbot-futurenet.stellar.org/?addr=${address}`
		case "TESTNET":
			return `https://friendbot.stellar.org/?addr=${address}`
		default:
			throw new Error(
				`Unknown or unsupported PUBLIC_STELLAR_NETWORK for friendbot: ${stellarNetwork}`,
			)
	}
}

/**
 * Fund an account via Friendbot. Returns a result the caller can surface as a
 * notification — framework-agnostic (no UI/state concerns here).
 */
export async function fundAccount(
	address: string,
): Promise<{ ok: boolean; message: string }> {
	try {
		const response = await fetch(getFriendbotUrl(address))
		if (response.ok) {
			return { ok: true, message: "Account funded successfully!" }
		}
		const body: unknown = await response.json()
		if (
			body !== null &&
			typeof body === "object" &&
			"detail" in body &&
			typeof body.detail === "string"
		) {
			return { ok: false, message: `Error funding account: ${body.detail}` }
		}
		return { ok: false, message: "Error funding account: Unknown error" }
	} catch {
		return { ok: false, message: "Error funding account. Please try again." }
	}
}
