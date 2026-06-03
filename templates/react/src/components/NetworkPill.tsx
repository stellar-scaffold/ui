import { networkStatus } from "@stellar-scaffold/ui-core"
import React from "react"
import { useWallet } from "../hooks/useWallet"

const NetworkPill: React.FC = () => {
	const { network, address } = useWallet()
	const { appNetwork, state, title } = networkStatus(address, network)

	return (
		<div
			className={`network-pill${state === "mismatch" ? " network-pill--mismatch" : ""}`}
			title={title}
		>
			<span className={`network-dot network-dot--${state}`} />
			{appNetwork}
		</div>
	)
}

export default NetworkPill
