<script lang="ts">
	import { networkStatus } from "@stellar-scaffold/app-lib"
	import { address, network } from "../stores/wallet"

	const status = $derived(networkStatus($address, $network))
</script>

<div
	class="network-pill"
	class:network-pill--mismatch={status.state === "mismatch"}
	title={status.title}
>
	<span class="network-dot network-dot--{status.state}"></span>
	{status.appNetwork}
</div>
