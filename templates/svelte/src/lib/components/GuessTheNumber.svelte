<script lang="ts">
	import { guessTheNumber } from "@stellar-scaffold/app-lib/clients"
	import {
		address,
		balances,
		signTransaction,
		updateBalances,
	} from "../stores/wallet"

	let result = $state<"idle" | "loading" | "success" | "failure">("idle")

	// An account must be connected and funded before it can submit a guess: an
	// unfunded account doesn't exist on-chain, so the contract call fails. An
	// unfunded account has no `xlm` balance key (see `fetchBalances`).
	const isConnected = $derived(Boolean($address))
	const isFunded = $derived(Boolean($balances.xlm))
	const canGuess = $derived(isConnected && isFunded)

	async function submitGuess(e: SubmitEvent) {
		e.preventDefault()
		const formData = new FormData(e.currentTarget as HTMLFormElement)
		const guess = formData.get("guess")
		if (typeof guess !== "string" || !guess) {
			result = "failure"
			return
		}

		result = "loading"

		try {
			const tx = await guessTheNumber.guess(
				{ a_number: BigInt(guess), guesser: $address! },
				{ publicKey: $address! },
			)

			const { result: txResult } = await tx.signAndSend({ signTransaction })

			if (txResult.isErr()) {
				console.error(txResult.unwrapErr())
				result = "failure"
			} else {
				result = txResult.unwrap() ? "success" : "failure"
				await updateBalances()
			}
		} catch (err) {
			console.error(err)
			result = "failure"
		}
	}

	function reset() {
		result = "idle"
	}
</script>

<div class="guess-the-number">
	<form onsubmit={submitGuess}>
		<input
			placeholder="Guess a number from 1 to 10!"
			name="guess"
			type="number"
			min="1"
			max="10"
			onchange={reset}
			disabled={!canGuess}
		/>
		<button type="submit" disabled={!canGuess || result === "loading"}>Submit</button>
	</form>

	{#if !canGuess}
		<div class="card guess-result guess-result--failure">
			<p>
				{!isConnected
					? "Connect your wallet in order to guess."
					: "Your account isn't funded yet. Fund it to play."}
			</p>
		</div>
	{/if}

	{#if canGuess && result === "success"}
		<div class="card guess-result guess-result--success">
			<p>
				You got it! Play again by calling <code>reset</code> in the Contract Explorer.
			</p>
		</div>
	{/if}
	{#if canGuess && result === "failure"}
		<div class="card guess-result guess-result--failure">
			<p>Incorrect guess. Try again!</p>
		</div>
	{/if}
</div>
