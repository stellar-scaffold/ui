import { guessTheNumber } from "@stellar-scaffold/app-lib/clients"
import { useState } from "react"
import { useWallet } from "../hooks/useWallet"

export const GuessTheNumber = () => {
	const { address, updateBalances, signTransaction } = useWallet()
	const [result, setResult] = useState<
		"idle" | "loading" | "success" | "failure"
	>("idle")

	const submitGuess = async (formData: FormData) => {
		if (!address) {
			setResult("failure")
			return
		}

		const guess = formData.get("guess")
		if (typeof guess != "string" || !guess) {
			setResult("failure")
			return
		}

		setResult("loading")

		const tx = await guessTheNumber.guess(
			{ a_number: BigInt(guess), guesser: address },
			{ publicKey: address },
		)

		const { result } = await tx.signAndSend({ signTransaction })

		if (result.isErr()) {
			console.error(result.unwrapErr())
		} else {
			setResult(result.unwrap() ? "success" : "failure")
			await updateBalances()
		}
	}

	const reset = () => setResult("idle")

	return (
		<div className="guess-the-number">
			<form action={submitGuess}>
				<input
					placeholder="Guess a number from 1 to 10!"
					id="guess"
					type="number"
					min="1"
					max="10"
					onChange={reset}
				/>
				<button type="submit" disabled={result === "loading"}>
					Submit
				</button>
			</form>

			{result === "success" && (
				<div className="card guess-result guess-result--success">
					<p>
						You got it! Play again by calling <code>reset</code> in the Contract
						Explorer.
					</p>
				</div>
			)}
			{result === "failure" && (
				<div className="card guess-result guess-result--failure">
					{!address ? (
						<p>Connect to your wallet in order to guess.</p>
					) : (
						<p>Incorrect guess. Try again!</p>
					)}
				</div>
			)}
		</div>
	)
}
