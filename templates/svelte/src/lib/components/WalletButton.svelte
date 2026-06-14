<script lang="ts">
	import {
		connectWallet,
		disconnectWallet,
		shortAddress,
	} from "@stellar-scaffold/app-lib"
	import { address, balances, isPending, walletWarnings } from "../stores/wallet"

	let dialog = $state<HTMLDialogElement>(null!)
</script>

{#if !$address}
	<button onclick={() => void connectWallet()} disabled={$isPending}>
		{$isPending ? "Loading..." : "Connect"}
	</button>
{:else}
	<div class="wallet-connected" style:opacity={$isPending ? 0.6 : 1}>
		<span class="wallet-balance">{$balances?.xlm?.balance ?? "-"} XLM</span>

		<div class="wallet-profile">
			<button onclick={() => dialog.showModal()}>
				{shortAddress($address)}
			</button>
			{#if $walletWarnings.hasWarnings}
				<span
					class="wallet-warning-badge"
					title={$walletWarnings.messages.join("") +
						($walletWarnings.helpUrl ? ` Learn more: ${$walletWarnings.helpUrl}` : "")}
				>⚠</span>
			{/if}
		</div>

		<dialog
			bind:this={dialog}
			onclick={(e) => {
				if (e.target === dialog) dialog.close()
			}}
		>
			<h3>Disconnect wallet?</h3>
			<p>Connected as <code title={$address}>{$address}</code></p>
			<div class="dialog-actions">
				<button onclick={() => void disconnectWallet().then(() => dialog.close())}>
					Disconnect
				</button>
				<button onclick={() => dialog.close()}>Cancel</button>
			</div>
		</dialog>
	</div>
{/if}
