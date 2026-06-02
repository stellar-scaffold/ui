import React from "react"
import { stellarNetwork } from "../contracts/util"
import { useWallet } from "../hooks/useWallet"

// TODO: workaround until @creit-tech/stellar-wallets-kit uses the new name for local network
const formatNetworkName = (name: string) =>
	name === "STANDALONE"
		? "Local"
		: name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()

const appNetwork = formatNetworkName(stellarNetwork)

const NetworkPill: React.FC = () => {
	const { network, address } = useWallet()

	const walletNetwork = formatNetworkName(network ?? "")
	const isNetworkMismatch = walletNetwork !== appNetwork

	let title = ""
	let dotColor = "#2ED06E"
	if (!address) {
		title = "Connect your wallet using this network."
		dotColor = "#C1C7D0"
	} else if (isNetworkMismatch) {
		title = `Wallet is on ${walletNetwork}, connect to ${appNetwork} instead.`
		dotColor = "#FF3B30"
	}

	return (
		<div
			style={{
				backgroundColor: "#F0F2F5",
				color: "#4A5362",
				padding: "4px 10px",
				borderRadius: "16px",
				fontSize: "12px",
				fontWeight: "bold",
				display: "flex",
				alignItems: "center",
				gap: "6px",
				cursor: isNetworkMismatch ? "help" : "default",
			}}
			title={title}
		>
			<span
				style={{
					width: 8,
					height: 8,
					borderRadius: "50%",
					backgroundColor: dotColor,
					display: "inline-block",
					flexShrink: 0,
				}}
			/>
			{appNetwork}
		</div>
	)
}

export default NetworkPill
