import { guessTheNumber } from "@stellar-scaffold/app-lib/clients"
import { useState } from "react"
import { useWallet } from "../hooks/useWallet"

export const GuessTheNumber = () => {
	const { address, balances, updateBalances, signTransaction } = useWallet()
	const [result, setResult] = useState<
		"idle" | "loading" | "success" | "failure"
	>("idle")

	// An account must be connected and funded before it can submit a guess: an
	// unfunded account doesn't exist on-chain, so the contract call fails. An
	// unfunded account has no `xlm` balance key (see `fetchBalances`).
	const isConnected = Boolean(address)
	const isFunded = Boolean(balances.xlm)
	const canGuess = isConnected && isFunded

	const submitGuess = async (formData: FormData) => {
		const guess = formData.get("guess")
		if (typeof guess != "string" || !guess) {
			setResult("failure")
			return
		}

		setResult("loading")

		try {
			const tx = await guessTheNumber.guess(
				{ a_number: BigInt(guess), guesser: address! },
				{ publicKey: address! },
			)

			const { result } = await tx.signAndSend({ signTransaction })

			if (result.isErr()) {
				console.error(result.unwrapErr())
				setResult("failure")
			} else {
				setResult(result.unwrap() ? "success" : "failure")
				await updateBalances()
			}
		} catch (err) {
			console.error(err)
			setResult("failure")
		}
	}

	const reset = () => setResult("idle")

	return (
		<div className="guess-the-number">
			<form action={submitGuess}>
				<input
					placeholder="Guess a number from 1 to 10!"
					name="guess"
					type="number"
					min="1"
					max="10"
					onChange={reset}
					disabled={!canGuess}
				/>
				<button type="submit" disabled={!canGuess || result === "loading"}>
					Submit
				</button>
			</form>

			{!canGuess && (
				<div className="card guess-result guess-result--failure">
					<p>
						{!isConnected
							? "Connect your wallet in order to guess."
							: "Your account isn't funded yet. Fund it to play."}
					</p>
				</div>
			)}

			{canGuess && result === "success" && (
				<div className="card guess-result guess-result--success">
					<p>
						You got it! Play again by calling <code>reset</code> in the Contract
						Explorer.
					</p>
				</div>
			)}
			{canGuess && result === "failure" && (
				<div className="card guess-result guess-result--failure">
					<p>Incorrect guess. Try again!</p>
				</div>
			)}
		</div>
	)
}
