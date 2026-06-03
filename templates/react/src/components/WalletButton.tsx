import { connectWallet, disconnectWallet } from "@stellar-scaffold/ui-core"
import { useRef } from "react"
import { useWallet } from "../hooks/useWallet"
import styles from "./WalletButton.module.css"

const shortAddress = (addr: string) => `${addr.slice(0, 4)}...${addr.slice(-4)}`

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
		<div
			className={styles.walletConnected}
			style={{ opacity: isPending ? 0.6 : 1 }}
		>
			<span className={styles.balance}>
				{balances?.xlm?.balance ?? "-"} XLM
			</span>

			<div className={styles.profileWrap}>
				<button onClick={() => dialogRef.current?.showModal()}>
					{shortAddress(address)}
				</button>
				{walletWarnings.hasWarnings && (
					<span
						className={styles.warningBadge}
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
				<h3 style={{ margin: "0 0 0.75rem" }}>Disconnect wallet?</h3>
				<p style={{ margin: "0 0 1rem", fontSize: "0.875rem" }}>
					Connected as{" "}
					<code title={address} style={{ wordBreak: "break-all" }}>
						{address}
					</code>
				</p>
				<div className={styles.dialogActions}>
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
