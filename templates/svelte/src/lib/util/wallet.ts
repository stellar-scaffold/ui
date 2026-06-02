import {
	type ISupportedWallet,
	StellarWalletsKit,
	type WalletNetwork,
	allowAllModules,
} from "@creit.tech/stellar-wallets-kit"
import { Horizon } from "@stellar/stellar-sdk"
import { networkPassphrase, stellarNetwork } from "../contracts/util"
import storage from "./storage"

const kit: StellarWalletsKit = new StellarWalletsKit({
	network: networkPassphrase as WalletNetwork,
	modules: allowAllModules(),
})

export const connectWallet = async () => {
	await kit.openModal({
		modalTitle: "Connect to your wallet",
		onWalletSelected: (option: ISupportedWallet) => {
			const selectedId = option.id
			kit.setWallet(selectedId)

			// Now open selected wallet's login flow by calling `getAddress` --
			// Yes, it's strange that a getter has a side effect of opening a modal
			void kit.getAddress().then((address) => {
				// Once `getAddress` returns successfully, we know they actually
				// connected the selected wallet, and we set our localStorage
				if (address.address) {
					storage.setItem("walletId", selectedId)
					storage.setItem("walletAddress", address.address)
				} else {
					storage.setItem("walletId", "")
					storage.setItem("walletAddress", "")
				}
			})
			if (selectedId == "freighter" || selectedId == "hot-wallet") {
				void kit.getNetwork().then((network) => {
					if (network.network && network.networkPassphrase) {
						storage.setItem("walletNetwork", network.network)
						storage.setItem("networkPassphrase", network.networkPassphrase)
					} else {
						storage.setItem("walletNetwork", "")
						storage.setItem("networkPassphrase", "")
					}
				})
			}
		},
	})
}

export const disconnectWallet = async () => {
	await kit.disconnect()
	storage.removeItem("walletId")
	storage.removeItem("walletAddress")
	storage.removeItem("walletNetwork")
	storage.removeItem("networkPassphrase")
}

function getHorizonHost(mode: string) {
	switch (mode) {
		case "LOCAL":
			return "http://localhost:8000"
		case "FUTURENET":
			return "https://horizon-futurenet.stellar.org"
		case "TESTNET":
			return "https://horizon-testnet.stellar.org"
		case "PUBLIC":
			return "https://horizon.stellar.org"
		default:
			throw new Error(`Unknown Stellar network: ${mode}`)
	}
}

const horizon = new Horizon.Server(getHorizonHost(stellarNetwork), {
	allowHttp: stellarNetwork === "LOCAL",
})

const formatter = new Intl.NumberFormat()

export type MappedBalances = Record<string, Horizon.HorizonApi.BalanceLine>

export const fetchBalances = async (address: string) => {
	try {
		const { balances } = await horizon.accounts().accountId(address).call()
		const mapped = balances.reduce((acc, b) => {
			b.balance = formatter.format(Number(b.balance))
			const key =
				b.asset_type === "native"
					? "xlm"
					: b.asset_type === "liquidity_pool_shares"
						? b.liquidity_pool_id
						: `${b.asset_code}:${b.asset_issuer}`
			acc[key] = b
			return acc
		}, {} as MappedBalances)
		return mapped
	} catch (err) {
		// `not found` is sort of expected, indicating an unfunded wallet, which
		// the consumer of `balances` can understand via the lack of `xlm` key.
		// If the error does NOT match 'not found', log the error.
		// We should also possibly not return `{}` in this case?
		if (!(err instanceof Error && err.message.match(/not found/i))) {
			console.error(err)
		}
		return {}
	}
}

export const wallet = kit
