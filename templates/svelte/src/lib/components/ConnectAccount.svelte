<script lang="ts">
	import { stellarNetwork } from "../contracts/util"
	import FundAccountButton from "./FundAccountButton.svelte"
	import NetworkPill from "./NetworkPill.svelte"
	import WalletButton from "./WalletButton.svelte"
</script>

<div class="connect-account">
	<NetworkPill />
	{#if stellarNetwork !== "PUBLIC"}
		<FundAccountButton />
	{/if}
	<WalletButton />
</div>

<style>
	.connect-account {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 10px;
	}
</style>
