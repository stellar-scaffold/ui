<script lang="ts">
	import { page } from "$app/stores"
	import ConnectAccount from "$lib/components/ConnectAccount.svelte"
	import { labPrefix } from "@stellar-scaffold/ui-core"
	import { notifications } from "$lib/stores/notifications"
	import "@stellar-scaffold/ui-core/styles.css"

	let { children } = $props()
</script>

<div class="app-layout">
	<header class="app-header">
		<span class="logo">Scaffold</span>
		<nav class="header-nav">
			<a
				href="/debug"
				class:active={$page.url.pathname.startsWith("/debug")}
			>
				Contract Explorer
			</a>
			<a href={labPrefix()} target="_blank" rel="noreferrer">Transaction Explorer</a>
		</nav>
		<ConnectAccount />
	</header>

	<main class="main">
		{@render children()}
	</main>

	<footer class="app-footer">
		<nav class="footer-nav">
			<a
				href="https://github.com/stellar-scaffold/cli"
				target="_blank"
				rel="noreferrer">GitHub</a
			>
			<a
				href="https://www.youtube.com/watch?v=0syGaIn3ULk&list=PLmr3tp_7-7Gjj6gn5-bBn-QTMyaWzwOU5"
				target="_blank"
				rel="noreferrer">Tutorial</a
			>
			<a href="https://scaffoldstellar.org" target="_blank" rel="noreferrer">View docs</a>
		</nav>
	</footer>
</div>

<div class="notification-container">
	{#each $notifications as n (n.id)}
		<div class="notification {n.isVisible ? 'slide-in' : 'slide-out'} notification-{n.type}">
			{n.message}
		</div>
	{/each}
</div>

<style>
	.app-layout {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	.app-header {
		display: flex;
		align-items: center;
		gap: 2rem;
		padding: 1rem 3rem;
		border-bottom: 1px solid var(--color-border);
	}

	.logo {
		font-weight: 600;
		font-size: 1.1rem;
		white-space: nowrap;
	}

	.header-nav {
		display: flex;
		gap: 0.5rem;
		flex: 1;
	}

	.header-nav a {
		color: var(--color-text-muted);
		text-decoration: none;
		padding: 0.25rem 0.5rem;
		border-radius: var(--radius);
		font-size: 0.9rem;
	}

	.header-nav a:hover,
	.header-nav a.active {
		color: var(--color-text);
		background: var(--color-surface);
	}

	.main {
		flex: 1;
		padding: 2rem 3rem;
		max-width: 1200px;
		margin: 0 auto;
		width: 100%;
	}

	.app-footer {
		border-top: 1px solid var(--color-border);
		padding: 1rem 3rem;
	}

	.footer-nav {
		display: flex;
		gap: 1.5rem;
		justify-content: flex-end;
	}

	.footer-nav a {
		color: var(--color-text-muted);
		text-decoration: none;
		font-size: 0.875rem;
	}

	.footer-nav a:hover {
		color: var(--color-text);
	}

	:global(.notification-container) {
		position: fixed;
		top: 10px;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		flex-direction: column;
		gap: 10px;
		z-index: 1000;
	}

	:global(.notification) {
		padding: 0.75rem 1rem;
		border-radius: 6px;
		font-size: 0.875rem;
		border: 1px solid var(--color-border);
		background: var(--color-bg);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
		min-width: 280px;
		max-width: 400px;
		transition:
			transform 0.3s ease,
			opacity 0.3s ease;
	}

	:global(.notification.slide-in) {
		transform: translateY(0);
		opacity: 1;
	}

	:global(.notification.slide-out) {
		transform: translateY(-20px);
		opacity: 0;
	}

	:global(.notification-success) {
		border-color: var(--color-success);
		color: var(--color-success);
	}

	:global(.notification-error) {
		border-color: var(--color-error);
		color: var(--color-error);
	}

	:global(.notification-warning) {
		border-color: var(--color-warning);
		color: var(--color-warning);
	}
</style>
