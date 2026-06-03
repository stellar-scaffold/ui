import { stellarNetwork } from "@stellar-scaffold/ui-core"
import React from "react"
import FundAccountButton from "./FundAccountButton"
import NetworkPill from "./NetworkPill"
import { WalletButton } from "./WalletButton"

const ConnectAccount: React.FC = () => {
	return (
		<div className="connect-account">
			<NetworkPill />
			{stellarNetwork !== "PUBLIC" && <FundAccountButton />}
			<WalletButton />
		</div>
	)
}

export default ConnectAccount
