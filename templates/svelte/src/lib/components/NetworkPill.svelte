<script lang="ts">
	import { networkStatus } from "@stellar-scaffold/ui-core"
	import { address, network } from "../stores/wallet"

	const DOT_COLOR = {
		ok: "#2ED06E",
		mismatch: "#FF3B30",
		disconnected: "#C1C7D0",
	} as const

	const status = $derived(networkStatus($address, $network))
	const dotColor = $derived(DOT_COLOR[status.state])
</script>

<div
	class="pill"
	style:cursor={status.state === "mismatch" ? "help" : "default"}
	title={status.title}
>
	<span class="dot" style:background-color={dotColor}></span>
	{status.appNetwork}
</div>

<style>
	.pill {
		background-color: #f0f2f5;
		color: #4a5362;
		padding: 4px 10px;
		border-radius: 16px;
		font-size: 12px;
		font-weight: bold;
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		flex-shrink: 0;
	}
</style>
