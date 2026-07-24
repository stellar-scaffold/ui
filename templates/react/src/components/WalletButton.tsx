import {
	connectWallet,
	profileModal,
	shortAddress,
} from "@stellar-scaffold/app-lib"
import { useWallet } from "../hooks/useWallet"

export const WalletButton = () => {
	const { address, isPending, balances } = useWallet()

	if (!address) {
		return (
			<button onClick={() => void connectWallet()} disabled={isPending}>
				{isPending ? "Loading..." : "Connect"}
			</button>
		)
	}

	return (
		<div className="wallet-connected" style={{ opacity: isPending ? 0.6 : 1 }}>
			<span className="wallet-balance">
				{balances?.xlm?.balance ?? "-"} XLM
			</span>

			<button className="wallet-profile" onClick={() => void profileModal()}>
				{shortAddress(address)}
			</button>
		</div>
	)
}
