import { useEffect } from "react"
import { type Api } from "@stellar/stellar-sdk/rpc"
import { subscribeToEvents } from "../util/subscription"

export function useSubscription(
	contractId: string,
	topic: string,
	onEvent: (event: Api.EventResponse) => void,
	pollInterval = 5000,
) {
	useEffect(() => {
		return subscribeToEvents(contractId, topic, onEvent, pollInterval)
	}, [contractId, topic, onEvent, pollInterval])
}
