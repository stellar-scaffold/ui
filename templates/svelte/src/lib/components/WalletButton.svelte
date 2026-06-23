<script lang="ts">
	import {
		connectWallet,
		profileModal,
		shortAddress,
	} from "@stellar-scaffold/app-lib"
	import { address, balances, isPending } from "../stores/wallet"
</script>

{#if !$address}
	<button onclick={() => void connectWallet()} disabled={$isPending}>
		{$isPending ? "Loading..." : "Connect"}
	</button>
{:else}
	<div class="wallet-connected" style:opacity={$isPending ? 0.6 : 1}>
		<span class="wallet-balance">{$balances?.xlm?.balance ?? "-"} XLM</span>

		<button class="wallet-profile" onclick={() => void profileModal()}>
			{shortAddress($address)}
		</button>
	</div>
{/if}
