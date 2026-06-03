import { xdr } from "@stellar/stellar-sdk"
import { Server, type Api } from "@stellar/stellar-sdk/rpc"
import { rpcUrl, stellarNetwork } from "./env"

/** A Soroban contract event delivered to a subscription callback. Re-exported so
 * templates depend only on @stellar-scaffold/ui-core, not @stellar/stellar-sdk. */
export type SubscriptionEvent = Api.EventResponse

type PagingKey = string

const paging: Record<
	PagingKey,
	{ lastLedgerStart?: number; pagingToken?: string }
> = {}

// NOTE: Server is configured using envvars which shouldn't change during runtime
const server = new Server(rpcUrl, { allowHttp: stellarNetwork === "LOCAL" })

/**
 * Subscribe to events for a given topic from a given contract. Returns a
 * cleanup function that stops polling when called.
 *
 * Framework-agnostic — wrap in useEffect, $effect, watchEffect, etc.
 */
export function subscribeToEvents(
	contractId: string,
	topic: string,
	onEvent: (event: SubscriptionEvent) => void,
	pollInterval = 5000,
): () => void {
	const id = `${contractId}:${topic}`
	if (!paging[id]) paging[id] = {}
	const page = paging[id]

	let timeoutId: NodeJS.Timeout | null = null
	let stopped = false

	async function pollEvents(): Promise<void> {
		try {
			if (!page.lastLedgerStart) {
				const latestLedgerState = await server.getLatestLedger()
				page.lastLedgerStart = latestLedgerState.sequence
			}

			const lastLedger = page.lastLedgerStart

			const response = await server.getEvents(
				page.pagingToken
					? {
							cursor: page.pagingToken,
							filters: [
								{
									contractIds: [contractId],
									topics: [[xdr.ScVal.scvSymbol(topic).toXDR("base64")]],
									type: "contract",
								},
							],
							limit: 10,
						}
					: {
							startLedger: lastLedger,
							endLedger: lastLedger + 100,
							filters: [
								{
									contractIds: [contractId],
									topics: [[xdr.ScVal.scvSymbol(topic).toXDR("base64")]],
									type: "contract",
								},
							],
							limit: 10,
						},
			)

			page.pagingToken = undefined
			if (response.latestLedger) {
				page.lastLedgerStart = response.latestLedger
			}
			if (response.events && response.events.length > 0) {
				response.events.forEach((event) => {
					try {
						onEvent(event)
					} catch (error) {
						console.error(
							"Poll Events: subscription callback had error: ",
							error,
						)
					}
				})
				if (response.cursor) {
					page.pagingToken = response.cursor
				}
			}
		} catch (error) {
			console.error("Poll Events: error: ", error)
		} finally {
			if (!stopped) {
				timeoutId = setTimeout(() => void pollEvents(), pollInterval)
			}
		}
	}

	void pollEvents()

	return () => {
		stopped = true
		if (timeoutId != null) clearTimeout(timeoutId)
	}
}
