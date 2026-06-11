<script lang="ts">
	import { guessTheNumber } from "@stellar-scaffold/app-lib/clients"
	import { address, signTransaction, updateBalances } from "../stores/wallet"

	let result = $state<"idle" | "loading" | "success" | "failure">("idle")

	async function submitGuess(e: SubmitEvent) {
		e.preventDefault()
		if (!$address) {
			result = "failure"
			return
		}
		const formData = new FormData(e.currentTarget as HTMLFormElement)
		const guess = formData.get("guess")
		if (typeof guess !== "string" || !guess) {
			result = "failure"
			return
		}

		result = "loading"

		const tx = await guessTheNumber.guess(
			{ a_number: BigInt(guess), guesser: $address },
			{ publicKey: $address },
		)

		const { result: txResult } = await tx.signAndSend({ signTransaction })

		if (txResult.isErr()) {
			console.error(txResult.unwrapErr())
		} else {
			result = txResult.unwrap() ? "success" : "failure"
			await updateBalances()
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
			id="guess"
			name="guess"
			type="number"
			min="1"
			max="10"
			onchange={reset}
		/>
		<button type="submit" disabled={result === "loading"}>Submit</button>
	</form>

	{#if result === "success"}
		<div class="card guess-result guess-result--success">
			<p>
				You got it! Play again by calling <code>reset</code> in the Contract Explorer.
			</p>
		</div>
	{/if}
	{#if result === "failure"}
		<div class="card guess-result guess-result--failure">
			{#if !$address}
				<p>Connect to your wallet in order to guess.</p>
			{:else}
				<p>Incorrect guess. Try again!</p>
			{/if}
		</div>
	{/if}
</div>
