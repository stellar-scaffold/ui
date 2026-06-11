import {
	connectWallet,
	disconnectWallet,
	shortAddress,
} from "@stellar-scaffold/app-lib"
import { useRef } from "react"
import { useWallet } from "../hooks/useWallet"

export const WalletButton = () => {
	const dialogRef = useRef<HTMLDialogElement>(null)
	const { address, isPending, balances, walletWarnings } = useWallet()

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

			<div className="wallet-profile">
				<button onClick={() => dialogRef.current?.showModal()}>
					{shortAddress(address)}
				</button>
				{walletWarnings.hasWarnings && (
					<span
						className="wallet-warning-badge"
						title={
							walletWarnings.messages.join("") +
							(walletWarnings.helpUrl
								? ` Learn more: ${walletWarnings.helpUrl}`
								: "")
						}
					>
						⚠
					</span>
				)}
			</div>

			<dialog ref={dialogRef}>
				<h3>Disconnect wallet?</h3>
				<p>
					Connected as <code title={address}>{address}</code>
				</p>
				<div className="dialog-actions">
					<button
						onClick={() =>
							void disconnectWallet().then(() => dialogRef.current?.close())
						}
					>
						Disconnect
					</button>
					<button onClick={() => dialogRef.current?.close()}>Cancel</button>
				</div>
			</dialog>
		</div>
	)
}
