import {
	fetchBalances,
	type MappedBalances,
	onWalletChange,
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

// Subscribe to wallet state. Gets values immediately and on every subsequent
// change: connect, disconnect, and the wallet switching networks.
onWalletChange(({ address, networkPassphrase: net }) => {
	_address.set(address)
	_networkPassphrase.set(net)
	_isPending.set(false)
	// Refetch on every state event: the same address holds different balances
	// per network, so a network change can change what's funded.
	void updateBalances()
})
