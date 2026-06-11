import {
	subscribeToEvents,
	type SubscriptionEvent,
} from "@stellar-scaffold/app-lib"
import { useEffect } from "react"

export function useSubscription(
	contractId: string,
	topic: string,
	onEvent: (event: SubscriptionEvent) => void,
	pollInterval = 5000,
) {
	useEffect(() => {
		return subscribeToEvents(contractId, topic, onEvent, pollInterval)
	}, [contractId, topic, onEvent, pollInterval])
}
