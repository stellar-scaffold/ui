import {
	fetchBalances,
	type MappedBalances,
	wallet,
	storage,
} from "@stellar-scaffold/app-lib"
import { derived, get, writable } from "svelte/store"

interface WalletBehavior {
	getAddressBehavior: "standard" | "popup-always"
	supportsGetNetwork: boolean
	helpUrl?: string
}

const DEFAULT_WALLET_BEHAVIOR: WalletBehavior = {
	getAddressBehavior: "popup-always",
	supportsGetNetwork: false,
}

const WALLET_BEHAVIORS: Record<string, WalletBehavior> = {
	freighter: { getAddressBehavior: "standard", supportsGetNetwork: true },
	"hot-wallet": {
		getAddressBehavior: "popup-always",
		supportsGetNetwork: true,
		helpUrl: "https://github.com/hot-dao/hot-sdk-js/issues/6",
	},
	hana: { getAddressBehavior: "standard", supportsGetNetwork: false },
	lobstr: {
		getAddressBehavior: "popup-always",
		supportsGetNetwork: false,
		helpUrl: "https://github.com/Lobstrco/lobstr-browser-extension/issues/2",
	},
	albedo: {
		getAddressBehavior: "popup-always",
		supportsGetNetwork: false,
		helpUrl: "https://github.com/stellar-expert/albedo/issues/104",
	},
	xbull: {
		getAddressBehavior: "standard",
		supportsGetNetwork: false,
		helpUrl: "https://github.com/Creit-Tech/xBull-Wallet-Connect/issues/4",
	},
	rabet: {
		getAddressBehavior: "standard",
		supportsGetNetwork: false,
		helpUrl: "https://github.com/rabetofficial/rabet-extension/issues/14",
	},
	klever: { getAddressBehavior: "popup-always", supportsGetNetwork: true },
}

function getWalletBehavior(walletId: string): WalletBehavior {
	return WALLET_BEHAVIORS[walletId] ?? DEFAULT_WALLET_BEHAVIOR
}

export interface WalletWarnings {
	hasWarnings: boolean
	popupAlways: boolean
	noGetNetworkSupport: boolean
	messages: string[]
	helpUrl?: string
}

function getWalletWarnings(walletId: string | null): WalletWarnings {
	if (!walletId) {
		return {
			hasWarnings: false,
			popupAlways: false,
			noGetNetworkSupport: false,
			messages: [],
		}
	}
	const behavior = getWalletBehavior(walletId)
	const popupAlways = behavior.getAddressBehavior === "popup-always"
	const noGetNetworkSupport = !behavior.supportsGetNetwork
	const messages: string[] = []
	if (popupAlways)
		messages.push("This wallet triggers a popup on every interaction. ")
	if (noGetNetworkSupport)
		messages.push("This wallet doesn't support network detection. ")
	return {
		hasWarnings: popupAlways || noGetNetworkSupport,
		popupAlways,
		noGetNetworkSupport,
		messages,
		helpUrl: behavior.helpUrl,
	}
}

// Writable state
const _address = writable<string | undefined>()
const _network = writable<string | undefined>()
const _networkPassphrase = writable<string | undefined>()
const _balances = writable<MappedBalances>({})
const _isPending = writable(true)
const _walletId = writable<string | null>(null)

// Public readable exports
export const address = { subscribe: _address.subscribe }
export const network = { subscribe: _network.subscribe }
export const networkPassphrase = { subscribe: _networkPassphrase.subscribe }
export const balances = { subscribe: _balances.subscribe }
export const isPending = { subscribe: _isPending.subscribe }
export const walletWarnings = derived(_walletId, ($id) =>
	getWalletWarnings($id),
)
export const signTransaction = wallet.signTransaction.bind(wallet)

export async function updateBalances() {
	const addr = get(_address)
	if (!addr) {
		_balances.set({})
		return
	}
	const b = await fetchBalances(addr)
	_balances.set(b)
}

function nullify() {
	_address.set(undefined)
	_network.set(undefined)
	_networkPassphrase.set(undefined)
	_balances.set({})
	_walletId.set(null)
	storage.setItem("walletId", "")
	storage.setItem("walletAddress", "")
	storage.setItem("walletNetwork", "")
	storage.setItem("networkPassphrase", "")
}

async function fetchAddress(
	walletId: string,
	cachedAddress: string | null,
): Promise<{ address: string }> {
	const behavior = getWalletBehavior(walletId)
	if (behavior.getAddressBehavior === "popup-always" && cachedAddress) {
		return { address: cachedAddress }
	}
	return wallet.getAddress()
}

async function fetchNetwork(
	walletId: string,
	cachedNetwork: string | null,
	cachedPassphrase: string | null,
): Promise<{ network: string; networkPassphrase: string }> {
	const behavior = getWalletBehavior(walletId)
	if (!behavior.supportsGetNetwork) {
		return {
			network: cachedNetwork ?? "testnet",
			networkPassphrase:
				cachedPassphrase ?? "Test SDF Network ; September 2015",
		}
	}
	return wallet.getNetwork()
}

let popupLock = false

async function updateCurrentWalletState() {
	const storedWalletId = storage.getItem("walletId")
	const walletNetwork = storage.getItem("walletNetwork")
	const walletAddr = storage.getItem("walletAddress")
	const passphrase = storage.getItem("networkPassphrase")

	_walletId.set(storedWalletId)

	const currentAddress = get(_address)
	if (!currentAddress && walletAddr && walletNetwork && passphrase) {
		_address.set(walletAddr)
		_network.set(walletNetwork)
		_networkPassphrase.set(passphrase)
	}

	if (!storedWalletId) {
		nullify()
		return
	}

	if (popupLock) return

	try {
		popupLock = true
		wallet.setWallet(storedWalletId)

		const [addressResult, networkResult] = await Promise.all([
			fetchAddress(storedWalletId, walletAddr),
			fetchNetwork(storedWalletId, walletNetwork, passphrase),
		])

		if (!addressResult.address) {
			storage.setItem("walletId", "")
			return
		}

		const curAddr = get(_address)
		const curNetwork = get(_network)
		const curPassphrase = get(_networkPassphrase)

		if (
			addressResult.address !== curAddr ||
			networkResult.network !== curNetwork ||
			networkResult.networkPassphrase !== curPassphrase
		) {
			storage.setItem("walletAddress", addressResult.address)
			storage.setItem("walletNetwork", networkResult.network)
			storage.setItem("networkPassphrase", networkResult.networkPassphrase)
			_address.set(addressResult.address)
			_network.set(networkResult.network)
			_networkPassphrase.set(networkResult.networkPassphrase)
		}
	} catch (e) {
		nullify()
		console.error(e)
	} finally {
		popupLock = false
	}
}

const POLL_INTERVAL = 1000

async function poll() {
	await updateCurrentWalletState()
	setTimeout(() => void poll(), POLL_INTERVAL)
}

// Start polling on module import
_isPending.set(true)
void updateCurrentWalletState()
	.then(() => updateBalances())
	.finally(() => {
		_isPending.set(false)
		setTimeout(() => void poll(), POLL_INTERVAL)
	})
