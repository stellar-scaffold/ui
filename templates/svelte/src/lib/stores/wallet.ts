import {
	fetchBalances,
	type MappedBalances,
	onWalletDisconnect,
	onWalletStateChange,
	signTransaction,
} from "@stellar-scaffold/app-lib"
import { get, writable } from "svelte/store"

// Writable state, driven entirely by Stellar-Wallets-Kit v2 state events. The
// kit owns persistence and restoration, so there's no polling or manual
// localStorage mirroring here.
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

// Fires immediately with current state (covering reload restore) and on every
// change thereafter.
onWalletStateChange(({ address, networkPassphrase }) => {
	_address.set(address)
	_networkPassphrase.set(networkPassphrase)
	_isPending.set(false)
	// Refetch on every state event: the same address holds different balances
	// per network, so a network change can change what's funded.
	void updateBalances()
})

onWalletDisconnect(() => {
	_address.set(undefined)
	_networkPassphrase.set(undefined)
	_balances.set({})
})
