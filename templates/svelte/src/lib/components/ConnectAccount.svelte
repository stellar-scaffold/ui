<script lang="ts">
	import { stellarNetwork } from "@stellar-scaffold/ui-core"
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
