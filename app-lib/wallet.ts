import {
	KitEventType,
	type Networks,
	StellarWalletsKit,
} from "@creit.tech/stellar-wallets-kit"
import { defaultModules } from "@creit.tech/stellar-wallets-kit/modules/utils"
import { Horizon } from "@stellar/stellar-sdk"
import { networkPassphrase, stellarNetwork } from "./env"

// These wallets work on Local and Futurenet while the rest enforce or fail on
// any networks beside Testnet and Mainnet. Filter below based on dApp config.
const CUSTOM_NETWORK_WALLETS = new Set(["freighter", "xbull", "hana"])

StellarWalletsKit.init({
	network: networkPassphrase as Networks,
	modules:
		stellarNetwork === "LOCAL" || stellarNetwork === "FUTURENET"
			? defaultModules({
					filterBy: (m) => CUSTOM_NETWORK_WALLETS.has(m.productId),
				})
			: defaultModules(),
})

/** Open the built-in wallet-selection modal; resolves once a wallet is connected. */
export const connectWallet = () => StellarWalletsKit.authModal()

/** Open the built-in profile modal (shows the connected account + disconnect). */
export const profileModal = () => StellarWalletsKit.profileModal()

/** Disconnect the active wallet. The kit clears its own persisted state. */
export const disconnectWallet = () => StellarWalletsKit.disconnect()

/** Sign a transaction with the active wallet. Passed to generated contract clients. */
export const signTransaction = StellarWalletsKit.signTransaction

/**
 * Use the wallet's reported network if it supports it, otherwise flag the
 * wallet as unsupported. Note that even if a wallet is `unsupported`, this
 * only means it does not support the `getNetwork` function. It *may* still
 * support passing `networkPassphrase` to `signTransaction`. For the wallets
 * that do not support the `networkPassphrase` argument to `signTransaction`,
 * you can fall back to error parsing to determine if `signTransaction`
 * failures were due to network mismatch.
 */
export const getWalletNetwork = async (): Promise<{
	supported: boolean
	networkPassphrase?: string
}> => {
	try {
		const { networkPassphrase } = await StellarWalletsKit.getNetwork()
		return { supported: true, networkPassphrase }
	} catch {
		return { supported: false }
	}
}

/**
 * Watch the network the wallet itself reports. Extensions emit no event when
 * the user switches networks, so this polls `getNetwork` — the only available
 * signal. The callback fires immediately with the current passphrase
 * (`undefined` when the wallet can't report one) and again on every change.
 *
 * Returns a cleanup function that stops polling. Only used in `onWalletChange`
 */
const onWalletNetworkChange = (
	cb: (networkPassphrase: string | undefined) => void,
	pollInterval = 3000,
): (() => void) => {
	let last: string | undefined
	let first = true
	let timeoutId: ReturnType<typeof setTimeout> | null = null
	let stopped = false

	const poll = async () => {
		const { networkPassphrase } = await getWalletNetwork()
		if (stopped) return
		if (first || networkPassphrase !== last) {
			first = false
			last = networkPassphrase
			cb(networkPassphrase)
		}
		timeoutId = setTimeout(() => void poll(), pollInterval)
	}
	void poll()

	return () => {
		stopped = true
		if (timeoutId != null) clearTimeout(timeoutId)
	}
}

export interface WalletState {
	address: string | undefined
	networkPassphrase: string | undefined
}

/**
 * Subscribe to full wallet state: connected address and network. Fires
 * immediately with the current state on subscribe (covering reload restore)
 * and on every subsequent change: connect, disconnect, or the wallet
 * switching networks (detected via polling, see `onWalletNetworkChange`).
 *
 * Returns an framework-agnostic unsubscribe function.
 */
export const onWalletChange = (
	cb: (state: WalletState) => void,
): (() => void) => {
	let stopPoll: (() => void) | undefined

	const stopState = StellarWalletsKit.on(
		KitEventType.STATE_UPDATED,
		(event) => {
			stopPoll?.()
			stopPoll = undefined
			// NOTE: `event.networkPassphrase` is the app's configured network, not
			// the wallet's connected network. Disregard it and start our own polling
			// logic below if we have an address.
			const { address } = event.payload
			if (address) {
				stopPoll = onWalletNetworkChange((networkPassphrase) =>
					cb({ address, networkPassphrase }),
				)
			} else {
				cb({ address: undefined, networkPassphrase: undefined })
			}
		},
	)

	const stopDisconnect = StellarWalletsKit.on(KitEventType.DISCONNECT, () => {
		stopPoll?.()
		stopPoll = undefined
		cb({ address: undefined, networkPassphrase: undefined })
	})

	return () => {
		stopState()
		stopDisconnect()
		stopPoll?.()
	}
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

// The kit itself, for templates that need `on(...)` subscriptions or `setWallet`.
export const wallet = StellarWalletsKit
