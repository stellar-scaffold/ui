import { getFriendbotUrl } from "@stellar-scaffold/ui-core"
import React, { useTransition } from "react"
import { useNotification } from "../hooks/useNotification.ts"
import { useWallet } from "../hooks/useWallet.ts"

const FundAccountButton: React.FC = () => {
	const { addNotification } = useNotification()
	const [isPending, startTransition] = useTransition()
	const { address } = useWallet()

	if (!address) return null

	const handleFundAccount = () => {
		startTransition(async () => {
			try {
				const response = await fetch(getFriendbotUrl(address))

				if (response.ok) {
					addNotification("Account funded successfully!", "success")
				} else {
					const body: unknown = await response.json()
					if (
						body !== null &&
						typeof body === "object" &&
						"detail" in body &&
						typeof body.detail === "string"
					) {
						addNotification(`Error funding account: ${body.detail}`, "error")
					} else {
						addNotification("Error funding account: Unknown error", "error")
					}
				}
			} catch {
				addNotification("Error funding account. Please try again.", "error")
			}
		})
	}

	return (
		<button
			disabled={isPending}
			onClick={handleFundAccount}
			title="Fund your account with test XLM via Friendbot"
		>
			Fund Account
		</button>
	)
}

export default FundAccountButton
