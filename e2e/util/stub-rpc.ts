import { createHash } from "node:crypto"
import type { Page } from "@playwright/test"
import { Keypair, SorobanDataBuilder, xdr } from "@stellar/stellar-sdk"

export interface StubRpcOptions {
	/** The funded account the app is connected as (a `G…` address). */
	account: string
	/** Whether simulating a contract call succeeds or fails with a contract error. */
	simulation: "succeeds" | "fails"
	/** What a contract call returns, in simulation and once it lands. */
	returns?: boolean
}

/** The error a failing simulation reports. */
export const CONTRACT_ERROR = "HostError: Error(Contract, #3)"

/**
 * Answer the app's Stellar RPC calls with a minimal, consistent network:
 *
 * - `account` exists and is funded; no other ledger entry does.
 * - Simulating a transaction either fails with {@link CONTRACT_ERROR}, or
 *   succeeds returning `returns`, with a write in its footprint so the SDK
 *   treats it as a call that needs signing and sending.
 * - A sent transaction lands immediately, successfully, returning `returns`.
 *
 * Requests are matched by their JSON-RPC body on anything that leaves the
 * app's own origin, so this works whichever network the clients were built
 * for. Returns the envelopes it was asked to simulate and to send, so tests
 * can check what the app actually submitted.
 */
export async function stubRpc(
	page: Page,
	baseURL: string,
	{ account, simulation, returns = false }: StubRpcOptions,
) {
	const simulated: string[] = []
	const sent: string[] = []
	const byHash = new Map<string, string>()

	const latestLedger = 1000
	const closeTime = String(Math.floor(Date.now() / 1000))
	const ledgerInfo = {
		latestLedger,
		latestLedgerCloseTime: closeTime,
		oldestLedger: 1,
		oldestLedgerCloseTime: closeTime,
	}

	const accountId = Keypair.fromPublicKey(account).xdrPublicKey()
	const accountKey = xdr.LedgerKey.account(
		new xdr.LedgerKeyAccount({ accountId }),
	)
	const accountEntry = xdr.LedgerEntryData.account(
		new xdr.AccountEntry({
			accountId,
			balance: xdr.Int64.fromString("100000000000"),
			seqNum: xdr.Int64.fromString("1"),
			numSubEntries: 0,
			inflationDest: null,
			flags: 0,
			homeDomain: "",
			thresholds: Buffer.from([1, 0, 0, 0]),
			signers: [],
			ext: new xdr.AccountEntryExt(0),
		}),
	)

	const returnValue = xdr.ScVal.scvBool(returns)

	// What the network reports for a landed contract call. The SDK reads the
	// call's result from `sorobanMeta.returnValue`; the rest only has to decode.
	const landedResult = new xdr.TransactionResult({
		feeCharged: xdr.Int64.fromString("100"),
		result: xdr.TransactionResultResult.txSuccess([
			xdr.OperationResult.opInner(
				xdr.OperationResultTr.invokeHostFunction(
					xdr.InvokeHostFunctionResult.invokeHostFunctionSuccess(
						Buffer.alloc(32),
					),
				),
			),
		]),
		ext: new xdr.TransactionResultExt(0),
	})
	const landedMeta = new xdr.TransactionMeta(
		3,
		new xdr.TransactionMetaV3({
			ext: new xdr.ExtensionPoint(0),
			txChangesBefore: [],
			operations: [],
			txChangesAfter: [],
			sorobanMeta: new xdr.SorobanTransactionMeta({
				ext: new xdr.SorobanTransactionMetaExt(0),
				events: [],
				returnValue,
				diagnosticEvents: [],
			}),
		}),
	)

	const results: Record<string, (params: any) => object> = {
		getLatestLedger: () => ({
			id: "0".repeat(64),
			protocolVersion: 23,
			sequence: latestLedger,
		}),
		getLedgerEntries: ({ keys }: { keys: string[] }) => ({
			latestLedger,
			entries: keys
				.filter((key) => key === accountKey.toXDR("base64"))
				.map((key) => ({
					key,
					xdr: accountEntry.toXDR("base64"),
					lastModifiedLedgerSeq: latestLedger,
				})),
		}),
		simulateTransaction: ({ transaction }: { transaction: string }) => {
			simulated.push(transaction)
			if (simulation === "fails") {
				return { latestLedger, error: CONTRACT_ERROR }
			}
			return {
				latestLedger,
				minResourceFee: "100",
				transactionData: new SorobanDataBuilder()
					.setReadWrite([accountKey])
					.build()
					.toXDR("base64"),
				results: [{ auth: [], xdr: returnValue.toXDR("base64") }],
			}
		},
		sendTransaction: ({ transaction }: { transaction: string }) => {
			sent.push(transaction)
			const hash = createHash("sha256").update(transaction).digest("hex")
			byHash.set(hash, transaction)
			return {
				status: "PENDING",
				hash,
				latestLedger,
				latestLedgerCloseTime: closeTime,
			}
		},
		getTransaction: ({ hash }: { hash: string }) => {
			const envelopeXdr = byHash.get(hash)
			if (!envelopeXdr) return { status: "NOT_FOUND", ...ledgerInfo }
			return {
				status: "SUCCESS",
				...ledgerInfo,
				ledger: latestLedger,
				createdAt: closeTime,
				applicationOrder: 1,
				feeBump: false,
				envelopeXdr,
				resultXdr: landedResult.toXDR("base64"),
				resultMetaXdr: landedMeta.toXDR("base64"),
			}
		},
	}

	const cors = {
		"access-control-allow-origin": "*",
		"access-control-allow-headers": "*",
		"access-control-allow-methods": "POST, OPTIONS",
	}
	const appOrigin = new URL(baseURL).origin

	await page.route(
		(url) => url.origin !== appOrigin,
		async (route) => {
			const request = route.request()
			if (request.method() === "OPTIONS") {
				return route.fulfill({ status: 204, headers: cors })
			}
			let body: {
				jsonrpc?: string
				id?: unknown
				method?: string
				params?: unknown
			}
			try {
				body = request.postDataJSON() ?? {}
			} catch {
				body = {}
			}
			if (body.jsonrpc !== "2.0") return route.fallback()

			const answer = body.method ? results[body.method] : undefined
			const response = answer
				? { result: answer(body.params) }
				: { error: { code: -32601, message: `Not stubbed: ${body.method}` } }
			return route.fulfill({
				headers: cors,
				json: { jsonrpc: "2.0", id: body.id, ...response },
			})
		},
	)

	return { simulated, sent }
}
