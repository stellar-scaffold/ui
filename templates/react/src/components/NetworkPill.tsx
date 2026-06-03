import { networkStatus } from "@stellar-scaffold/ui-core"
import React from "react"
import { useWallet } from "../hooks/useWallet"

const DOT_COLOR = {
	ok: "#2ED06E",
	mismatch: "#FF3B30",
	disconnected: "#C1C7D0",
} as const

const NetworkPill: React.FC = () => {
	const { network, address } = useWallet()
	const { appNetwork, state, title } = networkStatus(address, network)
	const isNetworkMismatch = state === "mismatch"
	const dotColor = DOT_COLOR[state]

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
