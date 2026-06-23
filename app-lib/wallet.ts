import {
	KitEventType,
	type Networks,
	StellarWalletsKit,
} from "@creit.tech/stellar-wallets-kit"
import { defaultModules } from "@creit.tech/stellar-wallets-kit/modules/utils"
import { Horizon } from "@stellar/stellar-sdk"
import { networkPassphrase, stellarNetwork } from "./env"

// v2 is a fully static API. `init` is called once here at module load; the kit
// owns its own localStorage persistence (active address, selected wallet) and
// restores it on reload, so the templates no longer mirror that state by hand.
StellarWalletsKit.init({
	network: networkPassphrase as Networks,
	modules: defaultModules(),
})

/** Open the built-in wallet-selection modal; resolves once a wallet is connected. */
export const connectWallet = () => StellarWalletsKit.authModal()

/** Open the built-in profile modal (shows the connected account + disconnect). */
export const profileModal = () => StellarWalletsKit.profileModal()

/** Disconnect the active wallet. The kit clears its own persisted state. */
export const disconnectWallet = () => StellarWalletsKit.disconnect()

/** Sign a transaction with the active wallet. Passed to generated contract clients. */
export const signTransaction = StellarWalletsKit.signTransaction

export interface WalletState {
	address: string | undefined
	networkPassphrase: string | undefined
}

/**
 * Subscribe to wallet state changes (active address / network). The callback
 * fires immediately with the current state on subscribe (covering reload
 * restore) and on every subsequent change. Returns an unsubscribe function.
 * Framework-agnostic — wrap in onMount / useEffect.
 */
export const onWalletStateChange = (
	cb: (state: WalletState) => void,
): (() => void) =>
	StellarWalletsKit.on(KitEventType.STATE_UPDATED, (event) =>
		cb({
			address: event.payload.address,
			networkPassphrase: event.payload.networkPassphrase,
		}),
	)

/** Subscribe to wallet disconnects. Returns an unsubscribe function. */
export const onWalletDisconnect = (cb: () => void): (() => void) =>
	StellarWalletsKit.on(KitEventType.DISCONNECT, cb)

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

// The kit itself, for templates that need `on(...)` subscriptions or `setWallet`.
export const wallet = StellarWalletsKit
