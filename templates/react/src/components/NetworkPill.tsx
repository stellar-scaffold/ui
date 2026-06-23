import { networkStatus } from "@stellar-scaffold/app-lib"
import React from "react"
import { useWallet } from "../hooks/useWallet"

const NetworkPill: React.FC = () => {
	const { networkPassphrase, address } = useWallet()
	const { appNetwork, state, title } = networkStatus(address, networkPassphrase)

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
