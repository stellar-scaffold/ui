import {
	fetchBalances,
	type MappedBalances,
	onWalletDisconnect,
	onWalletStateChange,
	signTransaction,
} from "@stellar-scaffold/app-lib"
import { createContext, useCallback, useEffect, useMemo, useState } from "react"

/**
 * A good-enough implementation of deepEqual.
 *
 * Used in this file to compare MappedBalances.
 *
 * Should maybe add & use a new dependency instead, if needed elsewhere.
 */
function deepEqual<T>(a: T, b: T): boolean {
	if (a === b) {
		return true
	}

	const bothAreObjects =
		a && b && typeof a === "object" && typeof b === "object"

	return Boolean(
		bothAreObjects &&
		Object.keys(a).length === Object.keys(b).length &&
		Object.entries(a).every(([k, v]) => deepEqual(v, b[k as keyof T])),
	)
}

export interface WalletContextType {
	address?: string
	balances: MappedBalances
	isPending: boolean
	networkPassphrase?: string
	signTransaction: typeof signTransaction
	updateBalances: () => Promise<void>
}

export const WalletContext = // @ts-ignore
	createContext<WalletContextType>({
		isPending: true,
		balances: {},
		updateBalances: async () => {},
		signTransaction,
	})

export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
	const [balances, setBalances] = useState<MappedBalances>({})
	const [address, setAddress] = useState<string>()
	const [networkPassphrase, setNetworkPassphrase] = useState<string>()
	const [isPending, setIsPending] = useState(true)

	const updateBalances = useCallback(async () => {
		if (!address) {
			setBalances({})
			return
		}

		const newBalances = await fetchBalances(address)
		setBalances((prev) => {
			if (deepEqual(newBalances, prev)) return prev
			return newBalances
		})
	}, [address])

	// Refetch on address change (via `updateBalances`' identity) and on network
	// change — the same address holds different balances per network.
	useEffect(() => {
		void updateBalances()
	}, [updateBalances, networkPassphrase])

	// Subscribe to Stellar-Wallets-Kit v2 state events. The callbacks fire
	// immediately with the current state (covering reload restore) and on every
	// change thereafter. The kit owns persistence — no polling needed.
	useEffect(() => {
		const unsubscribeState = onWalletStateChange((state) => {
			setAddress(state.address)
			setNetworkPassphrase(state.networkPassphrase)
			setIsPending(false)
		})
		const unsubscribeDisconnect = onWalletDisconnect(() => {
			setAddress(undefined)
			setNetworkPassphrase(undefined)
			setBalances({})
		})

		return () => {
			unsubscribeState()
			unsubscribeDisconnect()
		}
	}, [])

	const contextValue = useMemo(
		() => ({
			address,
			networkPassphrase,
			balances,
			updateBalances,
			isPending,
			signTransaction,
		}),
		[address, networkPassphrase, balances, updateBalances, isPending],
	)

	return <WalletContext value={contextValue}>{children}</WalletContext>
}
