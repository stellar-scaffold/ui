import { stellarNetwork } from "./env"

/** Shorten a Stellar address/contract id: first 4 + last 4, ellipsised. */
export const shortAddress = (addr: string): string =>
	`${addr.slice(0, 4)}...${addr.slice(-4)}`

// TODO: workaround until @creit-tech/stellar-wallets-kit uses the new name for local network
/** Human-friendly network label (STANDALONE → Local; otherwise capitalized). */
export const formatNetworkName = (name: string): string =>
	name === "STANDALONE"
		? "Local"
		: name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()

export type NetworkState = "disconnected" | "mismatch" | "ok"

/**
 * Compare the app's configured network against the connected wallet's network.
 * Pure — the component decides how to present `state` (dot color / class).
 */
export function networkStatus(
	address: string | null | undefined,
	walletNetworkRaw: string | null | undefined,
): {
	appNetwork: string
	walletNetwork: string
	state: NetworkState
	title: string
} {
	const appNetwork = formatNetworkName(stellarNetwork)
	const walletNetwork = formatNetworkName(walletNetworkRaw ?? "")

	if (!address) {
		return {
			appNetwork,
			walletNetwork,
			state: "disconnected",
			title: "Connect your wallet using this network.",
		}
	}
	if (walletNetwork !== appNetwork) {
		return {
			appNetwork,
			walletNetwork,
			state: "mismatch",
			title: `Wallet is on ${walletNetwork}, connect to ${appNetwork} instead.`,
		}
	}
	return { appNetwork, walletNetwork, state: "ok", title: "" }
}
