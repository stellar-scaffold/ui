import { Networks } from "@creit.tech/stellar-wallets-kit"
import { networkPassphrase, stellarNetwork } from "./env"

/** Shorten a Stellar address/contract id: first 4 + last 4, ellipsised. */
export const shortAddress = (addr: string): string =>
	`${addr.slice(0, 4)}...${addr.slice(-4)}`

/** Human-friendly network label (STANDALONE → Local; otherwise capitalized). */
export const formatNetworkName = (name: string): string =>
	name === "STANDALONE"
		? "Local"
		: name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()

/** Reverse lookup of a network passphrase to its `Networks` enum key. */
const passphraseToName: Record<string, string> = Object.fromEntries(
	Object.entries(Networks).map(([name, passphrase]) => [passphrase, name]),
)

export type NetworkState = "disconnected" | "mismatch" | "ok"

/**
 * Compare the app's configured network against the connected wallet's network.
 * The wallet network arrives as a passphrase (from the kit's state events), so
 * the authoritative comparison is passphrase vs. passphrase.
 * Pure — the component decides how to present `state` (dot color / class).
 */
export function networkStatus(
	address: string | null | undefined,
	walletPassphrase: string | null | undefined,
): {
	appNetwork: string
	walletNetwork: string
	state: NetworkState
	title: string
} {
	const appNetwork = formatNetworkName(stellarNetwork)
	// Label, in priority order: blank when there's no passphrase (disconnected);
	// the app's own label when the wallet matches the configured passphrase (so a
	// custom/standalone passphrase still reads as e.g. "Local" rather than
	// "Unknown" in the `ok` case); the known `Networks` name; else "Unknown".
	const walletNetwork = !walletPassphrase
		? ""
		: walletPassphrase === networkPassphrase
			? appNetwork
			: passphraseToName[walletPassphrase]
				? formatNetworkName(passphraseToName[walletPassphrase])
				: "Unknown"

	if (!address) {
		return {
			appNetwork,
			walletNetwork,
			state: "disconnected",
			title: "Connect your wallet using this network.",
		}
	}
	if (walletPassphrase !== networkPassphrase) {
		return {
			appNetwork,
			walletNetwork,
			state: "mismatch",
			title: `Wallet is on ${walletNetwork}, connect to ${appNetwork} instead.`,
		}
	}
	return { appNetwork, walletNetwork, state: "ok", title: "" }
}
