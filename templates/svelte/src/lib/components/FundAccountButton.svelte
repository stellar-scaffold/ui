<script lang="ts">
	import { getFriendbotUrl } from "@stellar-scaffold/ui-core"
	import { address } from "../stores/wallet"
	import { addNotification } from "../stores/notifications"

	let isPending = $state(false)

	async function handleFundAccount() {
		if (!$address || isPending) return
		isPending = true
		try {
			const response = await fetch(getFriendbotUrl($address))
			if (response.ok) {
				addNotification("Account funded successfully!", "success")
			} else {
				const body: unknown = await response.json()
				if (
					body !== null &&
					typeof body === "object" &&
					"detail" in body &&
					typeof body.detail === "string"
				) {
					addNotification(`Error funding account: ${body.detail}`, "error")
				} else {
					addNotification("Error funding account: Unknown error", "error")
				}
			}
		} catch {
			addNotification("Error funding account. Please try again.", "error")
		} finally {
			isPending = false
		}
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
