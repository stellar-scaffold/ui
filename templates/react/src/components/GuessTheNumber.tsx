import { errorMessage } from "@stellar-scaffold/app-lib"
import { guessTheNumber } from "@stellar-scaffold/app-lib/clients"
import { useState } from "react"
import { useWallet } from "../hooks/useWallet"

export const GuessTheNumber = () => {
	const { address, updateBalances, signTransaction } = useWallet()
	const [result, setResult] = useState<
		"idle" | "loading" | "success" | "failure" | "error"
	>("idle")
	const [error, setError] = useState<string>()

	// Couldn't get an answer from the contract (rejected signature, network,
	// simulation or contract error). Not the same as a wrong guess.
	const fail = (e: unknown) => {
		console.error(e)
		setError(errorMessage(e))
		setResult("error")
	}

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

		try {
			const tx = await guessTheNumber.guess(
				{ a_number: BigInt(guess), guesser: address },
				{ publicKey: address },
			)

			const { result } = await tx.signAndSend({ signTransaction })

			if (result.isErr()) {
				fail(result.unwrapErr())
			} else {
				setResult(result.unwrap() ? "success" : "failure")
				await updateBalances()
			}
		} catch (e) {
			fail(e)
		}
	}

	const reset = () => setResult("idle")

	return (
		<div className="guess-the-number">
			<form action={submitGuess}>
				<input
					placeholder="Guess a number from 1 to 10!"
					id="guess"
					name="guess"
					type="number"
					min="1"
					max="10"
					required
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
			{result === "error" && (
				<div className="card guess-result guess-result--failure" role="alert">
					<p>Couldn&apos;t submit your guess: {error}</p>
				</div>
			)}
		</div>
	)
}
