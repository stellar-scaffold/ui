import { Networks } from "@creit.tech/stellar-wallets-kit"
import { options } from "./clients"

type NetworkType = "mainnet" | "testnet" | "futurenet" | "local"

interface Network {
	id: NetworkType
	label: string
	passphrase: string
	rpcUrl: string
}

/**
 * The Stellar networks app-lib knows how to link to and fund on, keyed by
 * passphrase. Custom networks that `extends` one of these share its
 * passphrase, so they resolve to it too.
 */
const KNOWN_NETWORKS = {
	[Networks.PUBLIC]: "PUBLIC",
	[Networks.TESTNET]: "TESTNET",
	[Networks.FUTURENET]: "FUTURENET",
	[Networks.STANDALONE]: "LOCAL",
} as const

type StellarNetwork = (typeof KNOWN_NETWORKS)[keyof typeof KNOWN_NETWORKS]

/**
 * The network the generated clients were built for. `stellar scaffold` writes
 * `options` into `clients/index.ts` from the network selected in
 * `scaffold.yml`, so the frontend can never disagree with the contracts it
 * calls. An unrecognized passphrase is an error rather than a silent fallback
 * to the local network.
 */
const stellarNetworkFor = (passphrase: string): StellarNetwork => {
	if (passphrase in KNOWN_NETWORKS) {
		return KNOWN_NETWORKS[passphrase as keyof typeof KNOWN_NETWORKS]
	}
	throw new Error(
		`Unsupported network passphrase in generated clients: "${passphrase}". app-lib supports the local, testnet, futurenet, and mainnet passphrases.`,
	)
}

export const networkPassphrase = options.networkPassphrase
export const rpcUrl = options.rpcUrl
// Plain HTTP is only allowed where `scaffold.yml` allows it (local by default)
export const allowHttp = options.allowHttp
export const stellarNetwork = stellarNetworkFor(networkPassphrase)

const stellarEncode = (str: string) => {
	return str.replace(/\//g, "//").replace(/;/g, "/;")
}

/**
 * Stellar Lab's network state for a transaction-dashboard link. Lab also wants
 * a Horizon URL: SDF's public instance for the public networks, and the
 * quickstart container's root (where its Horizon is served) for local.
 */
const labNetwork = (): {
	host: string
	id: string
	label: string
	horizonUrl: string
} => {
	switch (stellarNetwork) {
		case "LOCAL":
			return {
				host: "http://localhost:8000/lab",
				id: "custom",
				label: "Custom",
				horizonUrl: new URL(rpcUrl).origin,
			}
		case "PUBLIC":
			return {
				host: "https://lab.stellar.org",
				id: "mainnet",
				label: "Mainnet",
				horizonUrl: "https://horizon.stellar.org",
			}
		case "FUTURENET":
			return {
				host: "https://lab.stellar.org",
				id: "futurenet",
				label: "Futurenet",
				horizonUrl: "https://horizon-futurenet.stellar.org",
			}
		case "TESTNET":
			return {
				host: "https://lab.stellar.org",
				id: "testnet",
				label: "Testnet",
				horizonUrl: "https://horizon-testnet.stellar.org",
			}
	}
}

export const labPrefix = () => {
	const lab = labNetwork()
	return `${lab.host}/transaction-dashboard?$=network$id=${lab.id}&label=${lab.label}&horizonUrl=${stellarEncode(lab.horizonUrl)}&rpcUrl=${stellarEncode(rpcUrl)}&passphrase=${stellarEncode(networkPassphrase)};`
}

const networkToId = (network: StellarNetwork): NetworkType => {
	switch (network) {
		case "PUBLIC":
			return "mainnet"
		case "TESTNET":
			return "testnet"
		case "FUTURENET":
			return "futurenet"
		case "LOCAL":
			return "local"
	}
}

export const network: Network = {
	id: networkToId(stellarNetwork),
	label: stellarNetwork.toLowerCase(),
	passphrase: networkPassphrase,
	rpcUrl: rpcUrl,
}
