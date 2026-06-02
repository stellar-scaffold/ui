import React from "react"
import { stellarNetwork } from "../contracts/util"
import FundAccountButton from "./FundAccountButton"
import NetworkPill from "./NetworkPill"
import { WalletButton } from "./WalletButton"

const ConnectAccount: React.FC = () => {
	return (
		<div
			style={{
				display: "flex",
				flexDirection: "row",
				alignItems: "center",
				gap: "10px",
				verticalAlign: "middle",
			}}
		>
			<NetworkPill />
			{stellarNetwork !== "PUBLIC" && <FundAccountButton />}
			<WalletButton />
		</div>
	)
}

export default ConnectAccount
