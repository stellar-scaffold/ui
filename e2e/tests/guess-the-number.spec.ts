import { test, expect, type Page } from "@playwright/test"
import { Keypair, xdr } from "@stellar/stellar-sdk"
import { connectFakeFreighter, DECLINED } from "../util/fake-freighter"
import { CONTRACT_ERROR, stubRpc } from "../util/stub-rpc"

const guesser = Keypair.random()
const INCORRECT = "Incorrect guess. Try again!"
const CORRECT = "You got it!"
const COULD_NOT_SUBMIT = /couldn't submit your guess/i

test("a wrong guess is signed, sent, and reported as incorrect", async ({
	page,
	baseURL,
}) => {
	const wallet = await connectFakeFreighter(page, guesser, {
		onSign: "approve",
	})
	const rpc = await stubRpc(page, baseURL!, {
		account: guesser.publicKey(),
		simulation: "succeeds",
		returns: false,
	})

	await guess(page, "7")

	await expect(page.getByText(INCORRECT)).toBeVisible()
	expect(wallet.signRequests.map(guessIn)).toEqual([7n])
	expect(rpc.sent.map(guessIn)).toEqual([7n])
	await expect(page.getByText(COULD_NOT_SUBMIT)).toBeHidden()
	await expect(page.getByRole("button", { name: "Submit" })).toBeEnabled()
})

test("a right guess is signed, sent, and reported as a win", async ({
	page,
	baseURL,
}) => {
	await connectFakeFreighter(page, guesser, { onSign: "approve" })
	const rpc = await stubRpc(page, baseURL!, {
		account: guesser.publicKey(),
		simulation: "succeeds",
		returns: true,
	})

	await guess(page, "7")

	await expect(page.getByText(CORRECT)).toBeVisible()
	expect(rpc.sent.map(guessIn)).toEqual([7n])
	await expect(page.getByText(INCORRECT)).toBeHidden()
})

test("a declined signature is reported as an error, not a wrong guess", async ({
	page,
	baseURL,
}) => {
	const wallet = await connectFakeFreighter(page, guesser, {
		onSign: "decline",
	})
	const rpc = await stubRpc(page, baseURL!, {
		account: guesser.publicKey(),
		simulation: "succeeds",
	})

	await guess(page, "7")

	await expect(page.getByText(COULD_NOT_SUBMIT)).toContainText(DECLINED)
	expect(wallet.signRequests.map(guessIn)).toEqual([7n])
	expect(rpc.sent).toHaveLength(0)
	await expect(page.getByText(INCORRECT)).toBeHidden()
	await expect(page.getByRole("button", { name: "Submit" })).toBeEnabled()
})

test("a failed simulation is reported as an error, not a wrong guess", async ({
	page,
	baseURL,
}) => {
	const wallet = await connectFakeFreighter(page, guesser, {
		onSign: "approve",
	})
	const rpc = await stubRpc(page, baseURL!, {
		account: guesser.publicKey(),
		simulation: "fails",
	})

	await guess(page, "7")

	await expect(page.getByText(COULD_NOT_SUBMIT)).toContainText(CONTRACT_ERROR)
	expect(rpc.simulated.map(guessIn)).toEqual([7n])
	expect(wallet.signRequests).toHaveLength(0)
	await expect(page.getByText(INCORRECT)).toBeHidden()
	await expect(page.getByRole("button", { name: "Submit" })).toBeEnabled()
})

/** Load the app, wait for the stand-in wallet to connect, and submit a guess. */
async function guess(page: Page, value: string) {
	await page.goto("/")
	const address = guesser.publicKey()
	const short = `${address.slice(0, 4)}...${address.slice(-4)}`
	await expect(page.getByRole("button", { name: short })).toBeVisible()

	await page.getByPlaceholder("Guess a number from 1 to 10!").fill(value)
	await page.getByRole("button", { name: "Submit" }).click()
}

/** The number passed to `guess` in a base64 transaction envelope. */
function guessIn(envelope: string): bigint {
	const [op] = xdr.TransactionEnvelope.fromXDR(envelope, "base64")
		.v1()
		.tx()
		.operations()
	const call = op.body().invokeHostFunctionOp().hostFunction().invokeContract()
	expect(call.functionName().toString()).toBe("guess")
	return call.args()[0].u64().toBigInt()
}
