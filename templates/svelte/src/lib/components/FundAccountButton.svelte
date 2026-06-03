<script lang="ts">
	import { fundAccount } from "@stellar-scaffold/ui-core"
	import { address } from "../stores/wallet"
	import { addNotification } from "../stores/notifications"

	let isPending = $state(false)

	async function handleFundAccount() {
		if (!$address || isPending) return
		isPending = true
		const { ok, message } = await fundAccount($address)
		addNotification(message, ok ? "success" : "error")
		isPending = false
	}
</script>

{#if $address}
	<button
		disabled={isPending}
		onclick={handleFundAccount}
		title="Fund your account with test XLM via Friendbot"
	>
		Fund Account
	</button>
{/if}
