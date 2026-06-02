<script lang="ts">
	import { connectWallet, disconnectWallet } from "../util/wallet"
	import { address, balances, isPending, walletWarnings } from "../stores/wallet"

	let dialog = $state<HTMLDialogElement>(null!)

	const shortAddress = (addr: string) => `${addr.slice(0, 4)}...${addr.slice(-4)}`
</script>

{#if !$address}
	<button onclick={() => void connectWallet()} disabled={$isPending}>
		{$isPending ? "Loading..." : "Connect"}
	</button>
{:else}
	<div class="wallet-connected" style:opacity={$isPending ? 0.6 : 1}>
		<span class="balance">{$balances?.xlm?.balance ?? "-"} XLM</span>

		<div class="profile-wrap">
			<button onclick={() => dialog.showModal()}>
				{shortAddress($address)}
			</button>
			{#if $walletWarnings.hasWarnings}
				<span
					class="warning-badge"
					title={$walletWarnings.messages.join("") +
						($walletWarnings.helpUrl ? ` Learn more: ${$walletWarnings.helpUrl}` : "")}
				>⚠</span>
			{/if}
		</div>

		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
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

<style>
	.wallet-connected {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.balance {
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}

	.profile-wrap {
		position: relative;
	}

	.warning-badge {
		position: absolute;
		bottom: -6px;
		right: -6px;
		font-size: 11px;
		cursor: help;
		line-height: 1;
		color: var(--color-warning);
	}

	dialog {
		width: 100%;
	}

	dialog h3 {
		margin: 0 0 0.75rem;
	}

	dialog p {
		margin: 0 0 1rem;
		font-size: 0.875rem;
	}

	dialog code {
		word-break: break-all;
	}

	.dialog-actions {
		display: flex;
		gap: 8px;
	}
</style>
