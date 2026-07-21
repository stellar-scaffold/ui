import {
	fetchBalances,
	type MappedBalances,
	onWalletNetworkChange,
	onWalletDisconnect,
	onWalletStateChange,
	signTransaction,
} from "@stellar-scaffold/app-lib"
import { get, writable } from "svelte/store"

// Writable state
const _address = writable<string | undefined>()
const _networkPassphrase = writable<string | undefined>()
const _balances = writable<MappedBalances>({})
const _isPending = writable(true)

// Public readable exports
export const address = { subscribe: _address.subscribe }
export const networkPassphrase = { subscribe: _networkPassphrase.subscribe }
export const balances = { subscribe: _balances.subscribe }
export const isPending = { subscribe: _isPending.subscribe }
export { signTransaction }

export async function updateBalances() {
	const addr = get(_address)
	if (!addr) {
		_balances.set({})
		return
	}
	const b = await fetchBalances(addr)
	_balances.set(b)
}

// Mutable variable to cancel any previous polling for network changes
let stopNetworkWatch: (() => void) | undefined

onWalletStateChange(({ address }) => {
	_address.set(address)
	_isPending.set(false)
	stopNetworkWatch?.()
	stopNetworkWatch = undefined
	if (address) {
		stopNetworkWatch = onWalletNetworkChange((networkPassphrase) => {
			_networkPassphrase.set(networkPassphrase)
			// The same address holds different balances per network.
			void updateBalances()
		})
	} else {
		_networkPassphrase.set(undefined)
	}
	// Refetch on every state event: the same address holds different balances
	// per network, so a network change can change what's funded.
	void updateBalances()
})

onWalletDisconnect(() => {
	_address.set(undefined)
	_networkPassphrase.set(undefined)
	_balances.set({})
})
