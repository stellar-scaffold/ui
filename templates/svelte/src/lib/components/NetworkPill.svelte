<script lang="ts">
	import { stellarNetwork } from "@stellar-scaffold/ui-core"
	import { address, network } from "../stores/wallet"

	// TODO: workaround until @creit-tech/stellar-wallets-kit uses the new name for local network
	const formatNetworkName = (name: string) =>
		name === "STANDALONE"
			? "Local"
			: name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()

	const appNetwork = formatNetworkName(stellarNetwork)

	const walletNetwork = $derived(formatNetworkName($network ?? ""))
	const isNetworkMismatch = $derived(walletNetwork !== appNetwork)
	const dotColor = $derived(!$address ? "#C1C7D0" : isNetworkMismatch ? "#FF3B30" : "#2ED06E")
	const title = $derived(
		!$address
			? "Connect your wallet using this network."
			: isNetworkMismatch
				? `Wallet is on ${walletNetwork}, connect to ${appNetwork} instead.`
				: "",
	)
</script>

<div
	class="pill"
	style:cursor={isNetworkMismatch ? "help" : "default"}
	{title}
>
	<span class="dot" style:background-color={dotColor}></span>
	{appNetwork}
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
