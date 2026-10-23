import type { Page } from "@playwright/test"
import type { Keypair } from "@stellar/stellar-sdk"
import { KeypairSigner } from "@stellar/stellar-sdk/contract"

export interface FakeFreighterOptions {
	/**
	 * What the player does when the app asks for a signature: `"approve"` signs
	 * with the keypair, `"decline"` rejects as if they clicked Reject.
	 */
	onSign: "approve" | "decline"
}

/** The message Freighter rejects with when the player declines to sign. */
export const DECLINED = "User declined access"

/**
 * Stand in for the Freighter extension, connected as `keypair`.
 *
 * Wallets Kit restores the last-used wallet and address from localStorage, and
 * `@stellar/freighter-api` talks to the extension over `window.postMessage`, so
 * an init script can play the extension's side of that conversation with no
 * change to the app. Signing happens here in Node, with the SDK's
 * `KeypairSigner`, so the secret key never enters the page.
 *
 * Returns `signRequests`: every envelope the app asked to have signed, as sent
 * (unsigned), whether it was approved or declined.
 */
export async function connectFakeFreighter(
	page: Page,
	keypair: Keypair,
	{ onSign }: FakeFreighterOptions,
) {
	const signRequests: string[] = []

	await page.exposeFunction(
		"__fakeFreighterSign",
		async (transactionXdr: string, networkPassphrase: string) => {
			signRequests.push(transactionXdr)
			if (onSign === "decline") {
				return { apiError: { code: -4, message: DECLINED } }
			}
			try {
				const { signedTxXdr } = await new KeypairSigner(
					keypair,
					networkPassphrase,
				).signTransaction(transactionXdr)
				return {
					signedTransaction: signedTxXdr,
					signerAddress: keypair.publicKey(),
				}
			} catch (e) {
				// Reply rather than throw, so the app sees a wallet error instead
				// of waiting forever for an answer
				return { apiError: { code: -1, message: `Fake Freighter: ${e}` } }
			}
		},
	)

	await page.addInitScript((address) => {
		type Sign = (xdr: string, passphrase: string) => Promise<object>
		const sign = (window as unknown as { __fakeFreighterSign: Sign })
			.__fakeFreighterSign

		localStorage.setItem("@StellarWalletsKit/selectedModuleId", "freighter")
		localStorage.setItem("@StellarWalletsKit/activeAddress", address)
		Object.assign(window, { freighter: true })

		window.addEventListener("message", (event) => {
			const req = event.data
			if (
				event.source !== window ||
				req?.source !== "FREIGHTER_EXTERNAL_MSG_REQUEST"
			) {
				return
			}
			const reply = (payload: object) =>
				window.postMessage(
					{
						source: "FREIGHTER_EXTERNAL_MSG_RESPONSE",
						messagedId: req.messageId, // sic, freighter-api's spelling
						...payload,
					},
					window.location.origin,
				)

			switch (req.type) {
				case "REQUEST_CONNECTION_STATUS":
					return reply({ isConnected: true })
				case "SUBMIT_TRANSACTION":
					return void sign(req.transactionXdr, req.networkPassphrase).then(
						reply,
					)
				default:
					// e.g. REQUEST_NETWORK: the app then treats the network as
					// unverified, like most wallets that don't report one
					return reply({
						apiError: { code: -1, message: `Not supported: ${req.type}` },
					})
			}
		})
	}, keypair.publicKey())

	return { signRequests }
}
