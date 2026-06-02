<script lang="ts">
	import GuessTheNumber from "$lib/components/GuessTheNumber.svelte"
	import { labPrefix } from "$lib/contracts/util"
</script>

<div class="home">
	<div class="intro">
		<h1>Yay! You're on Stellar Svelte!</h1>
		<p>
			A local development template designed to help you build dApps on the Stellar network. This
			environment lets you easily test wallet connections, smart contract interactions, transaction
			verifications, etc.
			<a href="https://scaffoldstellar.org/docs/intro" target="_blank" rel="noreferrer">
				View docs
			</a>
		</p>
	</div>

	<div class="card">
		<h2>Sample Contracts</h2>
		<p>
			<strong>Guess The Number:</strong> Interact with the sample contract from the
			<a
				href="https://scaffoldstellar.org/docs/tutorial/overview"
				target="_blank"
				rel="noreferrer">Scaffold Tutorial</a
			>
			using an automatically generated contract client.
		</p>
		<GuessTheNumber />
		<p>Or take a look at other sample contracts to get you started:</p>
		<nav class="contract-nav">
			<a
				href="https://github.com/OpenZeppelin/stellar-contracts/tree/main/examples"
				target="_blank"
				rel="noreferrer">OpenZeppelin sample contracts</a
			>
			<a
				href="https://github.com/stellar/soroban-examples"
				target="_blank"
				rel="noreferrer">Soroban sample contracts</a
			>
		</nav>
	</div>

	<div class="card">
		<h2>Start Building</h2>
		<ol>
			<li>Add your contract under <code>/src/lib/contracts</code></li>
			<li>Contracts are built by Scaffold when you run <code>npm start</code></li>
			<li>Changes are rebuilt automatically by <code>Vite</code></li>
			<li>Interact with your contract immediately in the Contract Explorer</li>
		</ol>
		<p>
			Watch the full process in our
			<a
				href="https://www.youtube.com/watch?v=86hWe8Ragtg&list=PLmr3tp_7-7Gjj6gn5-bBn-QTMyaWzwOU5&index=1"
				target="_blank"
				rel="noreferrer">Youtube tutorial</a
			><br />
			Get inspired by our showcase of
			<a href="https://scaffoldstellar.org/showcase" target="_blank" rel="noreferrer"
				>Example frontends</a
			><br />
			Ready to deploy?
			<a
				href="https://developers.stellar.org/docs/tools/cli/install-cli"
				target="_blank"
				rel="noreferrer">Read the mainnet deployment guide</a
			>
		</p>
	</div>

	<section class="cards">
		<div class="card">
			<p>Invoke your smart contract using the <a href="/debug">Contract Explorer</a></p>
		</div>
		<div class="card">
			<p>
				Browse your local transactions with the
				<a href={labPrefix()} target="_blank" rel="noreferrer">Transaction Explorer</a>
			</p>
		</div>
	</section>
</div>

<style>
	.home {
		max-width: 900px;
		margin: 0 auto;
	}

	.intro {
		text-align: center;
		margin: 4rem auto;
		max-width: 560px;
	}

	.intro h1 {
		font-weight: normal;
	}

	.home :global(.card) {
		margin-bottom: 2rem;
	}

	.contract-nav {
		display: flex;
		gap: 1rem;
		margin: 1rem 0;
		flex-wrap: wrap;
	}

	.cards {
		display: flex;
		gap: 2rem;
		margin-bottom: 2rem;
	}

	.cards :global(.card) {
		flex: 1;
		margin-bottom: 0;
	}
</style>
