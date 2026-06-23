import { Networks } from "@creit.tech/stellar-wallets-kit"
import { z } from "zod"

type NetworkType = "mainnet" | "testnet" | "futurenet" | "local"

interface Network {
	id: NetworkType
	label: string
	passphrase: string
	rpcUrl: string
	horizonUrl: string
}

const envSchema = z.object({
	PUBLIC_STELLAR_NETWORK: z.enum([
		"PUBLIC",
		"FUTURENET",
		"TESTNET",
		"LOCAL",
		"STANDALONE", // deprecated in favor of LOCAL
	] as const),
	PUBLIC_STELLAR_NETWORK_PASSPHRASE: z.enum(Networks),
	PUBLIC_STELLAR_RPC_URL: z.string(),
	PUBLIC_STELLAR_HORIZON_URL: z.string(),
})

const parsed = envSchema.safeParse(import.meta.env)

const env: z.infer<typeof envSchema> = parsed.success
	? parsed.data
	: {
			PUBLIC_STELLAR_NETWORK: "LOCAL",
			PUBLIC_STELLAR_NETWORK_PASSPHRASE: Networks.STANDALONE,
			PUBLIC_STELLAR_RPC_URL: "http://localhost:8000/rpc",
			PUBLIC_STELLAR_HORIZON_URL: "http://localhost:8000",
		}

export const stellarNetwork =
	env.PUBLIC_STELLAR_NETWORK === "STANDALONE"
		? "LOCAL"
		: env.PUBLIC_STELLAR_NETWORK
export const networkPassphrase = env.PUBLIC_STELLAR_NETWORK_PASSPHRASE

const stellarEncode = (str: string) => {
	return str.replace(/\//g, "//").replace(/;/g, "/;")
}

export const labPrefix = () => {
	switch (stellarNetwork) {
		case "LOCAL":
			return `http://localhost:8000/lab/transaction-dashboard?$=network$id=custom&label=Custom&horizonUrl=${stellarEncode(horizonUrl)}&rpcUrl=${stellarEncode(rpcUrl)}&passphrase=${stellarEncode(networkPassphrase)};`
		case "PUBLIC":
			return `https://lab.stellar.org/transaction-dashboard?$=network$id=mainnet&label=Mainnet&horizonUrl=${stellarEncode(horizonUrl)}&rpcUrl=${stellarEncode(rpcUrl)}&passphrase=${stellarEncode(networkPassphrase)};`
		case "TESTNET":
			return `https://lab.stellar.org/transaction-dashboard?$=network$id=testnet&label=Testnet&horizonUrl=${stellarEncode(horizonUrl)}&rpcUrl=${stellarEncode(rpcUrl)}&passphrase=${stellarEncode(networkPassphrase)};`
		case "FUTURENET":
			return `https://lab.stellar.org/transaction-dashboard?$=network$id=futurenet&label=Futurenet&horizonUrl=${stellarEncode(horizonUrl)}&rpcUrl=${stellarEncode(rpcUrl)}&passphrase=${stellarEncode(networkPassphrase)};`
		default:
			return `https://lab.stellar.org/transaction-dashboard?$=network$id=testnet&label=Testnet&horizonUrl=${stellarEncode(horizonUrl)}&rpcUrl=${stellarEncode(rpcUrl)}&passphrase=${stellarEncode(networkPassphrase)};`
	}
}

// NOTE: needs to be exported for contract files in this directory
export const rpcUrl = env.PUBLIC_STELLAR_RPC_URL
export const horizonUrl = env.PUBLIC_STELLAR_HORIZON_URL

const networkToId = (network: string): NetworkType => {
	switch (network) {
		case "PUBLIC":
			return "mainnet"
		case "TESTNET":
			return "testnet"
		case "FUTURENET":
			return "futurenet"
		default:
			return "local"
	}
}

export const network: Network = {
	id: networkToId(stellarNetwork),
	label: stellarNetwork.toLowerCase(),
	passphrase: networkPassphrase,
	rpcUrl: rpcUrl,
	horizonUrl: horizonUrl,
}
