import { stellarNetwork } from "../contracts/util"

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
